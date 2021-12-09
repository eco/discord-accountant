import sinon from "sinon"
import { Client, Collection } from "discord.js"
import { MAIN_GUILD } from "../config"
import { TestGuild, TestMessage, TestUser } from "./types.test"

export const adminUser: TestUser = {
  id: "admin_id",
  username: "admin_username",
  toString() {
    return `<@${this.id}>`
  },
  send: sinon.stub(),
}

export const nonAdminUser: TestUser = {
  id: "non_admin_id",
  username: "non_admin_username",
  toString() {
    return `<@${this.id}>`
  },
  send: sinon.stub(),
}

export const nonAdminUser2: TestUser = {
  id: "non_admin2_id",
  username: "non_admin2_username",
  toString() {
    return `<@${this.id}>`
  },
  send: sinon.stub(),
}

export const MAIN_CHANNELS = {
  log: "main_guild_log",
  checking: "main_guild_checking",
  grants: "main_guild_grants",
  local: "main_guild_local",
}

export const NON_MAIN_CHANNELS = {
  log: "non_main_guild_log",
  checking: "non_main_guild_checking",
  grants: "non_main_guild_grants",
  local: "non_main_guild_local",
}

export const mainGuild: TestGuild = {
  id: MAIN_GUILD,
  channels: {
    cache: new Collection(),
  },
  members: {
    cache: new Collection(),
  },
}

mainGuild.channels.cache.set(MAIN_CHANNELS.log, {
  name: "🧾points-log",
  type: "text",
  send: sinon.stub(),
})

mainGuild.channels.cache.set(MAIN_CHANNELS.checking, {
  name: "🏧check-your-ᵽoints",
  type: "text",
  send: sinon.stub(),
})

mainGuild.channels.cache.set(MAIN_CHANNELS.grants, {
  name: "grants-log",
  type: "text",
  send: sinon.stub(),
})

mainGuild.channels.cache.set(MAIN_CHANNELS.local, {
  name: "eco-server-points-log",
  type: "text",
  send: sinon.stub(),
})

export const nonMainGuild: TestGuild = {
  id: "non_main_guild",
  channels: {
    cache: new Collection(),
  },
  members: {
    cache: new Collection(),
  },
}

nonMainGuild.channels.cache.set(NON_MAIN_CHANNELS.log, {
  name: "points-log",
  type: "text",
  send: sinon.stub(),
})

nonMainGuild.channels.cache.set(NON_MAIN_CHANNELS.checking, {
  name: "check-your-points",
  type: "text",
  send: sinon.stub(),
})

nonMainGuild.channels.cache.set(NON_MAIN_CHANNELS.grants, {
  name: "grants-log",
  type: "text",
  send: sinon.stub(),
})

nonMainGuild.channels.cache.set(NON_MAIN_CHANNELS.local, {
  name: "eco-server-points-log",
  type: "text",
  send: sinon.stub(),
})

export function createAdminMessage(client?: Client): TestMessage {
  const message = {
    author: adminUser,
    mentions: {
      users: new Collection() as Collection<string, TestUser>,
    },
    react: sinon.stub(),
    reply: sinon.stub(),
    guild: mainGuild,
    deleted: false,
    deletable: true,
    delete: sinon.stub().returns({
      catch: sinon.stub(),
    }),
    client,
  }

  return message
}

export function createNonAdminMessage(client?: Client): TestMessage {
  return {
    ...createAdminMessage(client),
    author: nonAdminUser,
  }
}
