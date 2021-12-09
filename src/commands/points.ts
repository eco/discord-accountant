import { Message, User } from "discord.js"
import { Command } from "discord-akairo"
import { getPoints } from "../database/points"
import { Accountant } from "../client"
import { formatNumber } from "../functions/format_number"
import { POINTS_EMOTE } from "../config"
import { getChannelByType, getChannelType } from "../functions/channels"
import { COMMAND_ERROR } from "../types"

export default class PointsCommand extends Command {
  constructor() {
    super("points", {
      aliases: ["points", "score", "balance"],
      category: "main",
      cooldown: 3000,
      ratelimit: 2,
      args: [
        {
          id: "user",
          type: "user",
          default: (message: Message) => message.author,
        },
      ],
    })
  }

  async exec(message: Message, args: { user: User }): Promise<COMMAND_ERROR> {
    const checkingChannel = getChannelByType(message.guild, "checking")
    try {
      if (!checkingChannel || getChannelType(message.channel) !== "checking") {
        const errorMessage = !checkingChannel
          ? `Your \`!points\` post was removed from <#${message.channel.id}>. Please ask your server admins to create a channel called \`#check-your-points\`. That is the only channel where you will be able to check your points via \`!points\`. Thank you.`
          : `Your \`!points\` post was removed from <#${message.channel.id}>. Please only post \`!points\` in ${checkingChannel}. Thank you.`

        await message.author.send(errorMessage)
        if (message.deletable && !message.deleted) {
          await message.delete().catch((err) => console.warn(err))
        }
        return "WRONG_CHANNEL"
      }
    } catch (err) {
      console.warn(err)
    }

    const pool = (message.client as Accountant).pool
    const points = await getPoints(args.user.id, pool)

    await message.reply(
      `by my calculation, ${
        args.user
      } currently has ${POINTS_EMOTE}${formatNumber(points.total)}.`
    )
  }
}
