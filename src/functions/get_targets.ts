import { Collection, Message, User } from "discord.js"

// Get the users mentioned before the points argument
// e.g. in "!send @user1 10 points for helping @user2",
// Only take "@user1" as the command target
export function getUsersBeforePoints(
  message: Message
): Collection<string, User> {
  const match = message.content.match(/ [0-9]+/)
  if (!match) {
    // Return no users if points could not be found
    return new Collection()
  }
  const points = match[0]
  const pointsIndex = message.content.indexOf(points)
  const slicedContent = message.content.slice(pointsIndex)
  return message.mentions.users.filter((user) => {
    if (slicedContent.includes(user.id)) {
      return false
    }
    return true
  })
}
