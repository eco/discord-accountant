import { AkairoClient } from "discord-akairo"
import { Guild } from "discord.js"
import { MAIN_GUILD } from "../config"

// Get the main guild (logs transfers from all guilds)
export function getMainGuild(client: AkairoClient): Guild {
  const guildCache = client.guilds.cache
  const guild = guildCache.find((guild) => guild.id === MAIN_GUILD)

  if (guild) {
    return guild
  } else {
    console.warn(`Main guild ${MAIN_GUILD} not found`)
  }
}

export function isMainGuild(guild: Guild, client: AkairoClient): boolean {
  return guild.id === getMainGuild(client)?.id
}
