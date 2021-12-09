import { Command } from "discord-akairo"
import { Message } from "discord.js"

export default class HelpCommand extends Command {
  constructor() {
    super("help", {
      aliases: ["help", "h"],
      cooldown: 3000,
      ratelimit: 2,
    })
  }

  async exec(message: Message) {
    await message.reply(
      "nice to meet you. Here’s how to talk to me:```!send [@username] [number] Points\nI will debit Points from you and credit [@username] with that amount\n\n!leaderboard\nI will give you a list of top 10 accounts by Point holdings\n\n!points [@username]\nI will tell you how many Points [@username] has\n\n!help\nI'll send you this message```"
    )
  }
}
