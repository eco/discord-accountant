import { Listener, ListenerOptions } from "discord-akairo"

export abstract class CustomListener extends Listener {
  constructor(id: string, options?: ListenerOptions) {
    super(id, options)
  }

  async exec(...args: any[]) {
    try {
      await this.listenerExec(...args)
    } catch (err) {
      console.warn(err)
    }
  }

  protected abstract listenerExec(...args: any[]): Promise<void>
}
