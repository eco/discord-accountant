import { Message } from "discord.js"
import { Command } from "discord-akairo"
import { CustomListener } from "../listener"

export default class CommandErrorListener extends CustomListener {
  constructor() {
    super("commandError", {
      emitter: "commandHandler",
      event: "error",
    })
  }

  async listenerExec(err: Error, message: Message, command: Command) {
    console.warn(err)
  }
}
