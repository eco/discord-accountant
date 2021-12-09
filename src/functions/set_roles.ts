import { Guild } from "discord.js"
import { ROLE_LEVELS } from "../config"

// Set a user's roles according to the amount of points they have
export async function setRoles(userID: string, guild: Guild, points: number) {
  // Disable if not configured
  if (!ROLE_LEVELS[0]) {
    return
  }

  try {
    // Ignore DMs, guild data aren't available
    if (!guild) {
      return
    }

    const guildMember = guild.members.cache.get(userID)
    if (!guildMember) {
      return
    }

    let roleId = ""
    // Sort roles in descending order
    const roleLevels = ROLE_LEVELS.sort((a, b) => b.min - a.min)

    // Add a new role that matches the amount of points
    for (let i = 0; i < roleLevels.length; i++) {
      if (points > roleLevels[i].min) {
        roleId = roleLevels[i].id

        if (!guildMember.roles.cache.has(roleId)) {
          const role = guild.roles.cache.get(roleId)
          if (role) guildMember.roles.add(role).catch(console.warn)
        }
        break
      }
    }

    // Remove the old role if we added a new one
    for (let i = 0; i < roleLevels.length; i++) {
      if (roleId !== roleLevels[i].id) {
        if (guildMember.roles.cache.has(roleLevels[i].id)) {
          const role = guild.roles.cache.get(roleLevels[i].id)
          if (role) guildMember.roles.remove(role).catch(console.warn)
        }
      }
    }
  } catch (err) {
    console.warn(err)
  }
}
