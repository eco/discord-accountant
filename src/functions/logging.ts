import { AkairoClient } from "discord-akairo"
import { Message } from "discord.js"
import { POINTS_EMOTE, SLACK_WEBHOOK } from "../config"
import { formatNumber } from "./format_number"
import { getMainGuild, isMainGuild } from "./main_guild"
import { getChannelByType } from "./channels"
import axios from "axios"
import { getUsersBeforePoints } from "./get_targets"

function generateLogMessages(
  message: Message,
  points: number,
  newPoints?: number
): {
  transferMain: string
  transferNonMain: string
  grantDiscord: string
  grantDiscordLocal: string
  grantSlack: string
} {
  const targets = getUsersBeforePoints(message)

  const discord = targets
    .map((user) => user.toString())
    .join(", ")
    .replace(/,(?=[^,]*$)/, " and")

  const slack = targets
    .map((user) => `*${user.username}*`)
    .join(", ")
    .replace(/,(?=[^,]*$)/, " and")

  const guild = message.guild

  const transferMain = `${message.author} sent ${POINTS_EMOTE}${formatNumber(
    points
  )} to ${discord} in **${guild.name}** (Server ID: ${guild.id}).`

  const transferNonMain = `${message.author} sent ${POINTS_EMOTE}${formatNumber(
    points
  )} to ${discord}.`

  const grantDiscord = `${message.author} granted ${POINTS_EMOTE}${formatNumber(
    points
  )} to ${discord} in **${guild.name}** (Server ID: ${
    guild.id
  }) with message "${message.content}".`

  const grantDiscordLocal = `${
    message.author
  } granted ${POINTS_EMOTE}${formatNumber(
    points
  )} to ${discord} with message "${message.content}".`

  let grantSlack = ""
  if (targets.size === 1) {
    const user = targets.first()
    grantSlack = `*${message.author.username}* granted *${
      user.username
    }* ${formatNumber(points)} Points in *${guild.name}* (Server ID: ${
      guild.id
    }) with message "${message.content}". *${
      user.username
    }* now has ${formatNumber(newPoints ?? "")} Points.`
  } else {
    grantSlack = `I recorded that ${slack} have been granted ${formatNumber(
      points
    )} Points each in *${guild.name}* (Server ID: ${guild.id}) with message "${
      message.content
    }".`
  }

  return {
    transferMain,
    transferNonMain,
    grantDiscord,
    grantDiscordLocal,
    grantSlack,
  }
}

export async function logTransfer(
  message: Message,
  points: number,
  client: AkairoClient
) {
  await logTransferMain(message, points, client)

  if (!isMainGuild(message.guild, client)) {
    await logTransferNonMain(message, points)
  }
}

// Log the transfer in the main guild
async function logTransferMain(
  message: Message,
  points: number,
  client: AkairoClient
) {
  const mainGuild = getMainGuild(client)
  const mainLogChannel = getChannelByType(mainGuild, "log-normal")
  if (!mainLogChannel) {
    console.warn("Could not find the log channel in the main guild")
    return
  }

  const { transferMain, transferNonMain } = generateLogMessages(message, points)

  try {
    await mainLogChannel.send(transferMain)
    // If the transfer was in the main guild,
    // log it in the main-local log channel as well without guild info
    if (message.guild === mainGuild) {
      const mainLocalLogChannel = getChannelByType(mainGuild, "log-main-local")
      if (mainLocalLogChannel) {
        await mainLocalLogChannel.send(transferNonMain)
      }
    }
  } catch (err) {
    console.warn(err)
  }
}

// Log the transfer without guild info in non-main guilds
async function logTransferNonMain(message: Message, points: number) {
  const logChannel = getChannelByType(message.guild, "log-normal")
  if (!logChannel) {
    await message.reply(
      "I could not find the log channel. Please create a channel with the name `points-log`."
    )
    return
  }

  const { transferNonMain } = generateLogMessages(message, points)

  try {
    await logChannel.send(transferNonMain)
  } catch (err) {
    console.warn(err)
  }
}

// Log the grant in the main guild
export async function logGrantMain(
  message: Message,
  points: number,
  client: AkairoClient,
  newPoints?: number
) {
  const mainGuild = getMainGuild(client)
  const normalLogChannel = getChannelByType(mainGuild, "log-normal")
  if (!normalLogChannel) {
    console.warn("Could not find the log channel in the main guild")
    return
  }

  const { grantDiscord, grantDiscordLocal, grantSlack } = generateLogMessages(
    message,
    points,
    newPoints
  )

  try {
    await normalLogChannel.send(grantDiscord)
    // Log in the grants log channel as well if it exists
    const mainGrantsLogChannel = getChannelByType(mainGuild, "log-main-grants")
    if (mainGrantsLogChannel) {
      await mainGrantsLogChannel.send(grantDiscord)
    }
    // If the transfer was in the main guild,
    // log it in the main-local log channel as well without guild info
    if (message.guild === mainGuild) {
      const mainLocalLogChannel = getChannelByType(mainGuild, "log-main-local")
      if (mainLocalLogChannel) {
        await mainLocalLogChannel.send(grantDiscordLocal)
      }
    }
  } catch (err) {
    console.warn(err)
  }

  // Send to Slack
  if (SLACK_WEBHOOK) {
    await axios.post(SLACK_WEBHOOK, { text: grantSlack })
  }
}
