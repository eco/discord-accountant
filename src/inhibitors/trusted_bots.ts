import { Inhibitor } from "discord-akairo"
import { Message } from "discord.js"
import { TRUSTED_BOTS } from "../config"

export default class BotInhibitor extends Inhibitor {
  constructor() {
    super("bot", {
      reason: "bot",
    })
  }

  exec(message: Message) {
    // Ignore non-trusted bots
    return !TRUSTED_BOTS.includes(message.author.id) && message.author.bot
  }
}
