// Main guild ID (logs transfers from all guilds)
export const MAIN_GUILD = "123"

// Prefix for commands
export const PREFIX = "!"

// Text representation of the points emote used in bot messages
// You can get this by typing a backslash with the emote e.g. "\:points:"
// And it'll send it in this format
export const POINTS_EMOTE = "<:points:899996311271612345>"

// IDs for custom roles and the minimum amount of points to acquire each
// e.g. "50-250 points" role for "min: 50",
// "250-1000 points" role for "min: 250"
// Providing an empty array disables this feature
export const ROLE_LEVELS = [
  // { id: "", min: 5000 },
  // { id: "", min: 1000 },
  // { id: "", min: 250 },
  // { id: "", min: 50 },
  // { id: "", min: 0 },
]

// (optional) Bot IDs allowed to interact with this bot
// All other bots will be ignored
export const TRUSTED_BOTS = ["123456"]

// (optional) Slack webhook for logging grants
// https://api.slack.com/messaging/webhooks
export const SLACK_WEBHOOK = ""
