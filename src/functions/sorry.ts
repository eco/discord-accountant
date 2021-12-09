import { Message } from "discord.js"

// Generic "unknown command" reply
export function sorry(message: Message) {
  return message.reply("I’m sorry but I can’t do that for you.")
}
