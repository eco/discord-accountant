import { Message } from "discord.js"
import { Command } from "discord-akairo"
import { getPoints, sendPoints } from "../database/points"
import { Accountant } from "../client"
import { formatNumber } from "../functions/format_number"
import { setRoles } from "../functions/set_roles"
import { POINTS_EMOTE } from "../config"
import { COMMAND_ERROR } from "../types"
import { logTransfer } from "../functions/logging"
import { getUsersBeforePoints } from "../functions/get_targets"

export default class SendCommand extends Command {
  constructor() {
    super("send", {
      aliases: ["send", "give", "trade", "transfer", "pay"],
      category: "main",
      cooldown: 3000,
      ratelimit: 2,
      args: [
        {
          id: "points",
          type: "number",
          unordered: true,
        },
      ],
      lock: "user",
    })
  }

  async exec(
    message: Message,
    args: { points: number }
  ): Promise<COMMAND_ERROR> {
    const targets = getUsersBeforePoints(message)

    // Need at least one user and some points
    if (targets.size === 0 || args.points <= 0) {
      await message.reply(
        "incorrect number of arguments: !send @user [number of Points]"
      )
      return "INVALID_ARGUMENTS"
    }

    // Users can't send points to themselves
    const callerInUsers = targets.has(message.author.id)
    if (callerInUsers) {
      await message.reply("you cannot send Points to yourself.")
      return "INVALID_ARGUMENTS"
    }

    const pool = (this.client as Accountant).pool

    // Check if caller has enough points to send
    const callerPoints = await getPoints(message.author.id, pool)
    if (callerPoints.total < args.points * targets.size) {
      await message.reply(
        `you only have ${POINTS_EMOTE}${formatNumber(callerPoints.total)}.`
      )
      return "NOT_ENOUGH_POINTS"
    }

    // Save each send in database
    await Promise.all(
      targets.map(async (user) => {
        await sendPoints(message.author, user, args.points, pool)

        // Set role of each user
        const points = await getPoints(user.id, pool)
        await setRoles(user.id, message.guild, points.total)
      })
    )

    await message.react("✅")

    // Set role of sender
    const points = await getPoints(message.author.id, pool)
    await setRoles(message.author.id, message.guild, points.total)

    // Log the transfer
    await logTransfer(message, args.points, this.client)
  }
}
