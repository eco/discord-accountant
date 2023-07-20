import { Message } from "discord.js"
import { Command } from "discord-akairo"
import { Accountant } from "../client"
import { formatNumber } from "../functions/format_number"
import { addAdmin, isAdmin, listAdmins, removeAdmin } from "../database/admin"
import { sorry } from "../functions/sorry"
import { POINTS_EMOTE } from "../config"
import { getStats } from "../database/points"
import { COMMAND_ERROR } from "../types"

export default class PointsCommand extends Command {
  constructor() {
    super("admin", {
      aliases: ["admin"],
      category: "main",
      cooldown: 3000,
      ratelimit: 2,
      args: [
        {
          id: "command",
          type: "string",
        },
      ],
    })
  }

  async exec(
    message: Message,
    args: { command: string }
  ): Promise<COMMAND_ERROR> {
    const pool = (this.client as Accountant).pool
    const command = args.command

    if (!command) {
      return
    }

    // Check if caller is in admin list
    if (!(await isAdmin(message.author.id, pool))) {
      return "NOT_ADMIN"
    }
    const users = message.mentions.users

    if (command === "list") {
      const rows = await listAdmins(pool)

      let list = ""
      for (let i = 0; i < rows.length; i++) {
        list +=
          // Add spaces to single digit rows (1-9)
          // to make them line up with double digit rows (10+)
          (i > 8 ? "\n" : "\n ") + (i + 1) + ". <@" + rows[i].id + ">"
      }

      await message.reply(`here is the list of admins: ${list}`)
    } else if (command === "stats") {
      const stats = await getStats(pool)

      await message.reply(
        `${POINTS_EMOTE}${formatNumber(stats.points)} granted, ${formatNumber(
          stats.grants
        )} grants, ${formatNumber(stats.users)} users`
      )
    }
  }
}
