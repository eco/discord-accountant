import sinon from "sinon"
import { Client, Collection, Permissions } from "discord.js"

export interface TestUser {
  id: string
  username: string
  toString: () => string
  send: sinon.SinonStub
  bot?: boolean
}

export interface TestGuild {
  id: string
  channels: {
    cache: Collection<string, TestChannel>
  }
  // Prevent errors when running tests when ROLE_LEVELS is configured
  members: {
    cache: Collection<string, unknown>
  }
}

export interface TestChannel {
  name: string
  type: "text"
  send: sinon.SinonStub
}

export interface TestMessage {
  author: TestUser
  content?: string
  client: Client
  mentions: {
    users: Collection<string, TestUser>
  }
  react: sinon.SinonStub
  reply: sinon.SinonStub
  channel?: TestChannel
  guild: TestGuild
  member?: {
    permissions: Readonly<Permissions>
  }
  deleted: boolean
  deletable: boolean
  delete: sinon.SinonStub
}
