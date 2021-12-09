import { Command } from "discord-akairo"
import { Message } from "discord.js"

export default class PingCommand extends Command {
  constructor() {
    super("ping", {
      aliases: ["ping"],
      cooldown: 3000,
      ratelimit: 2,
    })
  }

  async exec(message: Message) {
    await message.reply(`pong (${Date.now() - message.createdTimestamp}ms)`)
  }
}
