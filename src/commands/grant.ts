import { Message } from "discord.js"
import { Command } from "discord-akairo"
import { getPoints, grantPoints } from "../database/points"
import { Accountant } from "../client"
import { setRoles } from "../functions/set_roles"
import { isAdmin } from "../database/admin"
import { sorry } from "../functions/sorry"
import { COMMAND_ERROR } from "../types"
import { logGrantMain } from "../functions/logging"
import { getUsersBeforePoints } from "../functions/get_targets"

export default class GrantCommand extends Command {
  constructor() {
    super("grant", {
      aliases: ["grant", "add", "award"],
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
    })
  }

  async exec(
    message: Message,
    args: { points: number }
  ): Promise<COMMAND_ERROR> {
    const pool = (this.client as Accountant).pool

    // Check if caller is in admin list
    if (!(await isAdmin(message.author.id, pool))) {
      await sorry(message)
      return "NOT_ADMIN"
    }

    const targets = getUsersBeforePoints(message)
    // Need at least one user and some points
    if (targets.size === 0 || args.points <= 0) {
      await message.reply(
        "incorrect number of arguments: !grant @user [number of Points]."
      )
      return
    }

    // Save each grant in database
    await Promise.all(
      targets.map(async (user) => {
        await grantPoints(message.author, user, args.points, pool)

        const points = await getPoints(user.id, pool)
        await setRoles(user.id, message.guild, points.total)
      })
    )

    await message.react("✅")

    if (targets.size === 1) {
      // Get points first if there's only one user granted
      // This is to display how many points they now have (in slack)
      const user = targets.first()
      const points = await getPoints(user.id, pool)
      await logGrantMain(message, args.points, this.client, points.total)
    } else {
      // Log normally otherwise
      await logGrantMain(message, args.points, this.client)
    }
  }
}
