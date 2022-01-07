import assert from "assert"
import sinon from "sinon"
import mysql from "mysql2/promise"
import AdminCommand from "../commands/admin"
import GrantCommand from "../commands/grant"
import SendCommand from "../commands/send"
import PointsCommand from "../commands/points"
import LeaderboardCommand from "../commands/leaderboard"
import BotInhibitor from "../inhibitors/trusted_bots"
import { Accountant } from "../client"
import { Permissions } from "discord.js"
import { addAdmin, isAdmin } from "../database/admin"
import { createTestDatabasePool, dropAndCreateTables } from "./test_util.test"
import { getPoints, grantPoints } from "../database/points"
import { MAIN_GUILD, TRUSTED_BOTS } from "../config"
import {
  adminUser,
  nonAdminUser,
  nonAdminUser2,
  createAdminMessage,
  createNonAdminMessage,
  mainGuild,
  nonMainGuild,
  MAIN_CHANNELS,
  NON_MAIN_CHANNELS,
} from "./discord_mocks.test"
import axiosModule from "axios"

const axiosStub = sinon.stub(axiosModule, "post")

let pool: mysql.Pool
const CLIENT_ID = "client_Id"
const client = new Accountant(pool)
/// @ts-expect-error
client.user = {
  id: CLIENT_ID,
}
const adminCommand = new AdminCommand()
const grantCommand = new GrantCommand()
const sendCommand = new SendCommand()
const pointsCommand = new PointsCommand()
const leaderboardCommand = new LeaderboardCommand()
const botInhibitor = new BotInhibitor()

before(() => {
  pool = createTestDatabasePool()
  client.pool = pool
  /// @ts-expect-error
  client.guilds.cache.set(MAIN_GUILD, mainGuild)
  /// @ts-expect-error
  client.guilds.cache.set(nonMainGuild.id, nonMainGuild)
  adminCommand.client = client
  grantCommand.client = client
  sendCommand.client = client
})

after(async () => {
  await pool.end()
  client.destroy()
})

beforeEach(async () => {
  // Reset the database before every test case
  // They should not rely on any previous state
  await dropAndCreateTables(pool)

  // Set adminUser as admin
  await addAdmin(adminUser, adminUser, pool)

  // Reset all stubs
  sinon.reset()
})

describe("Admin commands", () => {
  it("adds a new admin", async () => {
    const target = nonAdminUser

    const adminMessage = createAdminMessage()
    adminMessage.mentions.users.set(target.id, target)

    /// @ts-expect-error
    await adminCommand.exec(adminMessage, { command: "add" })

    // Target should be in admin list
    const targetIsAdmin = await isAdmin(target.id, pool)
    assert(targetIsAdmin)
  })

  it("removes an admin", async () => {
    const target = nonAdminUser

    // Set target as admin
    await addAdmin(adminUser, target, pool)

    const adminMessage = createAdminMessage()
    adminMessage.mentions.users.set(target.id, target)

    /// @ts-expect-error
    await adminCommand.exec(adminMessage, { command: "remove" })

    // Target should not be in admin list
    const targetIsNotAdmin = !(await isAdmin(target.id, pool))
    assert(targetIsNotAdmin)
  })

  it("lists the admins", async () => {
    const admin = adminUser
    const admin2 = nonAdminUser

    await addAdmin(adminUser, admin2, pool)

    const adminMessage = createAdminMessage()

    /// @ts-expect-error
    await adminCommand.exec(adminMessage, { command: "list" })

    const reply = adminMessage.reply.args[0][0]
    assert(typeof reply === "string")

    // Should mention the admins
    assert(reply.includes(admin.id))
    assert(reply.includes(admin2.id))
  })

  it("displays grant stats", async () => {
    const amount = 100
    await grantPoints(adminUser, nonAdminUser, amount, pool)
    await grantPoints(adminUser, nonAdminUser, amount, pool)
    await grantPoints(adminUser, nonAdminUser2, amount, pool)

    const adminMessage = createAdminMessage()

    /// @ts-expect-error
    await adminCommand.exec(adminMessage, { command: "stats" })

    const reply = adminMessage.reply.args[0][0]
    assert(typeof reply === "string")

    // Should display the total amount granted
    assert(reply.includes(String(amount * 3)))

    // Should display the total number of grants
    assert(reply.includes(String(3)))

    // Should display the total amount of users granted
    assert(reply.includes(String(2)))
  })
})

describe("Protecting admin commands", () => {
  it("does not allow a non-admin to use any of the !admin commands (even with admin perms)", async () => {
    const nonAdminMessage = createNonAdminMessage()
    nonAdminMessage.member = {
      permissions: new Permissions(Permissions.FLAGS.ADMINISTRATOR),
    }

    // Caller has admin perms
    assert(
      nonAdminMessage.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
    )

    const commands = ["add", "remove", "list", "stats"]
    const results = await Promise.all(
      commands.map((command) => {
        /// @ts-expect-error
        return adminCommand.exec(nonAdminMessage, {
          command,
        })
      })
    )

    // All commands should be rejected
    assert.deepStrictEqual(results, [
      "NOT_ADMIN",
      "NOT_ADMIN",
      "NOT_ADMIN",
      "NOT_ADMIN",
    ])
  })

  it("does not allow a non-admin to add new admins", async () => {
    const target = nonAdminUser2

    const nonAdminMessage = createNonAdminMessage()
    nonAdminMessage.mentions.users.set(target.id, target)

    // Attempt to add targetID to list of admins
    /// @ts-expect-error
    const result = await adminCommand.exec(nonAdminMessage, { command: "add" })
    assert.strictEqual(result, "NOT_ADMIN")

    // Target should not be in admin list
    const targetIsAdmin = await isAdmin(target.id, pool)
    assert(!targetIsAdmin)
  })

  it("does not allow a non-admin to grant points (even with admin perms)", async () => {
    const nonAdminMessage = createNonAdminMessage()
    nonAdminMessage.mentions.users.set(nonAdminUser.id, nonAdminUser)
    nonAdminMessage.member = {
      permissions: new Permissions(Permissions.FLAGS.ADMINISTRATOR),
    }

    // Caller has admin perms
    assert(
      nonAdminMessage.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
    )

    /// @ts-expect-error
    const result = await grantCommand.exec(nonAdminMessage, { points: 100 })
    assert.strictEqual(result, "NOT_ADMIN")

    // Points should not have been granted
    const points = await getPoints(nonAdminUser.id, pool)
    assert.strictEqual(points.total, 0)

    // Should return the "sorry" response
    assert(nonAdminMessage.reply.called)
  })
})

describe("Point transfers", () => {
  it("allows an admin to grant points to a single user", async () => {
    const target = nonAdminUser
    const amount = 100

    const adminMessage = createAdminMessage()
    adminMessage.mentions.users.set(target.id, target)
    adminMessage.content = `!grant <@${target.id}> ${amount} points>`

    /// @ts-expect-error
    await grantCommand.exec(adminMessage, { points: amount })
    const points = await getPoints(target.id, pool)

    // Target should have the points
    assert.strictEqual(points.total, amount)
  })

  it("allows an admin to grant points to multiple users", async () => {
    const target = nonAdminUser
    const target2 = nonAdminUser2
    const amount = 100

    const adminMessage = createAdminMessage()
    adminMessage.mentions.users.set(target.id, target)
    adminMessage.mentions.users.set(target2.id, target2)
    adminMessage.content = `!grant <@${target.id}> <@${target2.id}> ${amount} points>`

    /// @ts-expect-error
    await grantCommand.exec(adminMessage, { points: amount })
    const points = await getPoints(target.id, pool)
    const points2 = await getPoints(target2.id, pool)

    // Targets should have the points
    assert.strictEqual(points.total, amount)
    assert.strictEqual(points2.total, amount)
  })

  it("allows a user to send points to another user", async () => {
    const sender = nonAdminUser
    const target = nonAdminUser2

    const amount = 100
    await grantPoints(adminUser, sender, amount, pool)

    const senderMessage = createNonAdminMessage()
    senderMessage.mentions.users.set(target.id, target)
    senderMessage.content = `!send <@${target.id}> ${amount} points>`

    /// @ts-expect-error
    await sendCommand.exec(senderMessage, { points: amount })

    /// Sender should have exactly 0 points left
    const senderPoints = await getPoints(sender.id, pool)
    assert.strictEqual(senderPoints.total, 0)

    /// Target should have the points
    const targetPoints = await getPoints(target.id, pool)
    assert.strictEqual(targetPoints.total, amount)
  })

  it("allows a user to send points to multiple users", async () => {
    const sender = nonAdminUser
    const target = nonAdminUser2
    const target2 = adminUser

    const amountToGrant = 200
    await grantPoints(adminUser, sender, amountToGrant, pool)

    const amountToSend = 100

    const senderMessage = createNonAdminMessage()
    senderMessage.mentions.users.set(target.id, target)
    senderMessage.mentions.users.set(target2.id, target2)
    senderMessage.content = `!send <@${target.id}> <@${target2.id}> ${amountToSend} points>`

    /// @ts-expect-error
    await sendCommand.exec(senderMessage, { points: amountToSend })

    /// Sender should have exactly 0 points left
    const senderPoints = await getPoints(sender.id, pool)
    assert.strictEqual(senderPoints.total, 0)

    /// Each target should have 100 points each
    const targetPoints = await getPoints(target.id, pool)
    const targetPoints2 = await getPoints(target2.id, pool)
    assert.strictEqual(targetPoints.total, amountToSend)
    assert.strictEqual(targetPoints2.total, amountToSend)
  })

  it("does not allow a user to send points they don't have", async () => {
    const target = nonAdminUser2
    const amount = 100

    const senderMessage = createNonAdminMessage()
    senderMessage.mentions.users.set(target.id, target)
    senderMessage.content = `!send <@${target.id}> ${amount} points>`

    /// @ts-expect-error
    const result = await sendCommand.exec(senderMessage, { points: amount })
    assert.strictEqual(result, "NOT_ENOUGH_POINTS")

    // Target should not have the points
    const points = await getPoints(target.id, pool)
    assert.strictEqual(points.total, 0)
  })

  it("does not allow a user to send points to themselves", async () => {
    const sender = nonAdminUser

    const amount = 100
    await grantPoints(adminUser, nonAdminUser, amount, pool)

    const senderMessage = createNonAdminMessage()
    senderMessage.mentions.users.set(sender.id, sender)
    senderMessage.content = `!send <@${sender.id}> ${amount} points>`

    // Sender should have the same amount of points
    const points = await getPoints(sender.id, pool)
    assert.strictEqual(points.total, amount)
  })

  it("does not allow a user to send points to the bot", async () => {
    const sender = nonAdminUser

    const amount = 100
    await grantPoints(adminUser, nonAdminUser, amount, pool)

    const senderMessage = createNonAdminMessage()
    /// @ts-expect-error
    senderMessage.mentions.users.set(client.user.id, client.user)
    senderMessage.content = `!send <@${client.user.id}> ${amount} points>`

    // Sender should have the same amount of points
    const points = await getPoints(sender.id, pool)
    assert.strictEqual(points.total, amount)
  })

  it("ignores users mentioned after the points argument (transfers)", async () => {
    const sender = nonAdminUser
    const target = nonAdminUser2
    const secondUser = adminUser

    const amountToGrant = 200
    await grantPoints(adminUser, sender, amountToGrant, pool)
    const amountToSend = 100

    const senderMessage = createNonAdminMessage()
    senderMessage.mentions.users.set(target.id, target)
    senderMessage.mentions.users.set(secondUser.id, secondUser)
    senderMessage.content = `!send <@${target.id}> ${amountToSend} points for helping <@${secondUser.id}>`

    /// @ts-expect-error
    await sendCommand.exec(senderMessage, { points: amountToSend })

    // Sender should have 100 points left
    const senderPoints = await getPoints(sender.id, pool)
    assert.strictEqual(senderPoints.total, 100)

    // Target should have the points
    const targetPoints = await getPoints(target.id, pool)
    assert.strictEqual(targetPoints.total, amountToSend)

    // Second user should not have any points
    const secondUserPoints = await getPoints(secondUser.id, pool)
    assert.strictEqual(secondUserPoints.total, 0)
  })

  it("ignores users mentioned after the points argument (grants)", async () => {
    const target = nonAdminUser
    const secondUser = nonAdminUser2
    const amount = 100

    const adminMessage = createAdminMessage()
    adminMessage.mentions.users.set(target.id, target)
    adminMessage.mentions.users.set(secondUser.id, secondUser)
    adminMessage.content = `!grant <@${target.id}> ${amount} points for helping <@${secondUser.id}>`

    /// @ts-expect-error
    await grantCommand.exec(adminMessage, { points: amount })

    // Target should have the points
    const targetPoints = await getPoints(target.id, pool)
    assert.strictEqual(targetPoints.total, amount)

    // Second user should not have any points
    const secondUserPoints = await getPoints(secondUser.id, pool)
    assert.strictEqual(secondUserPoints.total, 0)
  })

  it("allows !send with no message", async () => {
    const sender = nonAdminUser
    const target = nonAdminUser2

    const amount = 100
    await grantPoints(adminUser, sender, amount, pool)

    const senderMessage = createNonAdminMessage()
    senderMessage.mentions.users.set(target.id, target)
    senderMessage.content = `!send <@${target.id}> ${amount}`

    /// @ts-expect-error
    await sendCommand.exec(senderMessage, { points: amount })

    /// Sender should have exactly 0 points left
    const senderPoints = await getPoints(sender.id, pool)
    assert.strictEqual(senderPoints.total, 0)

    /// Target should have the points
    const targetPoints = await getPoints(target.id, pool)
    assert.strictEqual(targetPoints.total, amount)
  })
})

describe("Logging", () => {
  it("logs main guild transfers to the right channels", async () => {
    const sender = nonAdminUser
    const target = nonAdminUser2

    const amount = 100
    await grantPoints(adminUser, sender, amount, pool)

    const senderMessage = createNonAdminMessage()
    senderMessage.mentions.users.set(target.id, target)
    senderMessage.guild = mainGuild
    senderMessage.content = `!send <@${target.id} ${amount} points>`

    /// @ts-expect-error
    await sendCommand.exec(senderMessage, { points: amount })

    // Should log in the main guild's log channel
    assert(mainGuild.channels.cache.get(MAIN_CHANNELS.log).send.called)

    // Should log in the main guild's local log channel
    assert(mainGuild.channels.cache.get(MAIN_CHANNELS.local).send.called)

    // Should not log in the non-main guild's log channel
    assert(
      nonMainGuild.channels.cache.get(NON_MAIN_CHANNELS.log).send.notCalled
    )
  })

  it("logs non-main guild transfers to the right channels", async () => {
    const sender = nonAdminUser
    const target = nonAdminUser2

    const amount = 100
    await grantPoints(adminUser, sender, amount, pool)

    const senderMessage = createNonAdminMessage()
    senderMessage.mentions.users.set(target.id, target)
    senderMessage.guild = nonMainGuild
    senderMessage.content = `!send <@${target.id} ${amount} points>`

    /// @ts-expect-error
    await sendCommand.exec(senderMessage, { points: amount })

    // Should log in the main guild's log channel
    assert(mainGuild.channels.cache.get(MAIN_CHANNELS.log).send.called)

    // Should not log in the main guild's local log channel
    assert(mainGuild.channels.cache.get(MAIN_CHANNELS.local).send.notCalled)

    // Should log in the non-main guild's log channel
    assert(nonMainGuild.channels.cache.get(NON_MAIN_CHANNELS.log).send.called)

    // Should not log in the non-main guild's local log channel
    // Non-main guilds should not have this channel
    assert(
      nonMainGuild.channels.cache.get(NON_MAIN_CHANNELS.local).send.notCalled
    )
  })

  it("logs main guild grants to the right channels + slack", async () => {
    const target = nonAdminUser
    const amount = 100

    const adminMessage = createAdminMessage()
    adminMessage.mentions.users.set(target.id, target)
    adminMessage.guild = mainGuild
    adminMessage.content = `!grant <@${target.id} ${amount} points>`

    /// @ts-expect-error
    await grantCommand.exec(adminMessage, { points: amount })

    // Should log in the main guild's log channel
    assert(mainGuild.channels.cache.get(MAIN_CHANNELS.log).send.called)

    // Should log in the main guild's grants channel
    assert(mainGuild.channels.cache.get(MAIN_CHANNELS.grants).send.called)

    // Should log in the main guild's local log channel
    assert(mainGuild.channels.cache.get(MAIN_CHANNELS.local).send.called)

    // Should not log in the non-main guild's log channel
    assert(
      nonMainGuild.channels.cache.get(NON_MAIN_CHANNELS.log).send.notCalled
    )

    // Should not log in the non-main guild's grants channel
    // Non-main guilds should not have this channel
    assert(
      nonMainGuild.channels.cache.get(NON_MAIN_CHANNELS.grants).send.notCalled
    )

    // Should post to slack
    assert(axiosStub.called)
  })

  it("logs non-main guild grants to the right channels + slack", async () => {
    const target = nonAdminUser
    const amount = 100

    const adminMessage = createAdminMessage()
    adminMessage.mentions.users.set(target.id, target)
    adminMessage.guild = nonMainGuild
    adminMessage.content = `!grant <@${target.id} ${amount} points>`

    /// @ts-expect-error
    await grantCommand.exec(adminMessage, { points: amount })

    // Should log in the main guild's log channel
    assert(mainGuild.channels.cache.get(MAIN_CHANNELS.log).send.called)

    // Should log in the main guild's grants channel
    assert(mainGuild.channels.cache.get(MAIN_CHANNELS.grants).send.called)

    // Should not log in the main guild's local log channel
    assert(mainGuild.channels.cache.get(MAIN_CHANNELS.local).send.notCalled)

    // Should not log in the non-main guild's log channel
    assert(
      nonMainGuild.channels.cache.get(NON_MAIN_CHANNELS.log).send.notCalled
    )

    // Should not log in the non-main guild's grants channel
    // Non-main guilds should not have this channel
    assert(
      nonMainGuild.channels.cache.get(NON_MAIN_CHANNELS.grants).send.notCalled
    )

    // Should post to slack
    assert(axiosStub.called)
  })
})

describe("Points checking", () => {
  it("replies with the user's points", async () => {
    const caller = nonAdminUser

    const amount = 100
    await grantPoints(adminUser, caller, amount, pool)

    const callerMessage = createNonAdminMessage(client)
    callerMessage.channel = nonMainGuild.channels.cache.get(
      NON_MAIN_CHANNELS.checking
    )
    /// @ts-expect-error
    await pointsCommand.exec(callerMessage, { user: caller })

    const reply = callerMessage.reply.args[0][0]
    assert(typeof reply === "string")

    // Should mention the caller
    assert(reply.includes(caller.id))

    // Should return the correct value
    assert(reply.includes(String(amount)))
  })

  it("displays another user's points", async () => {
    const target = nonAdminUser2

    const amount = 100
    await grantPoints(adminUser, target, amount, pool)

    const callerMessage = createNonAdminMessage(client)
    callerMessage.channel = nonMainGuild.channels.cache.get(
      NON_MAIN_CHANNELS.checking
    )
    /// @ts-expect-error
    await pointsCommand.exec(callerMessage, { user: target })

    const reply = callerMessage.reply.args[0][0]
    assert(typeof reply === "string")

    // Should mention the target
    assert(reply.includes(target.id))

    // Should return the correct value
    assert(reply.includes(String(amount)))
  })

  it("displays the leaderboard", async () => {
    const amount = 100
    await grantPoints(adminUser, nonAdminUser, amount, pool)
    await grantPoints(adminUser, nonAdminUser2, amount, pool)

    const callerMessage = createNonAdminMessage(client)
    callerMessage.channel = nonMainGuild.channels.cache.get(
      NON_MAIN_CHANNELS.checking
    )
    /// @ts-expect-error
    await leaderboardCommand.exec(callerMessage, { limit: 10 })

    const reply = callerMessage.reply.args[0][0]
    assert(typeof reply === "string")

    // Should mention the users
    assert(reply.includes(nonAdminUser.id))
    assert(reply.includes(nonAdminUser2.id))

    // Should display the correct value
    assert(reply.includes(String(amount)))
  })

  it("deletes the !points message if it's in the wrong channel", async () => {
    const caller = nonAdminUser

    const callerMessage = createNonAdminMessage(client)
    callerMessage.channel = nonMainGuild.channels.cache.get(
      NON_MAIN_CHANNELS.log
    )

    /// @ts-expect-error
    const result = await pointsCommand.exec(callerMessage, {
      user: caller,
    })
    assert.strictEqual(result, "WRONG_CHANNEL")

    // Should delete the message
    assert(callerMessage.delete.called)

    // Should DM the user the reason why
    assert(caller.send.called)
  })

  it("deletes the !leaderboard message if it's in the wrong channel", async () => {
    const caller = nonAdminUser

    const callerMessage = createNonAdminMessage(client)
    callerMessage.channel = nonMainGuild.channels.cache.get(
      NON_MAIN_CHANNELS.log
    )

    /// @ts-expect-error
    const result = await leaderboardCommand.exec(callerMessage, {
      user: caller,
    })
    assert.strictEqual(result, "WRONG_CHANNEL")

    // Should delete the message
    assert(callerMessage.delete.called)

    // Should DM the user the reason why
    assert(caller.send.called)
  })
})

describe("Trusted bots", () => {
  it("allows trusted bots to use commands", () => {
    if (!TRUSTED_BOTS[0]) {
      throw new Error("No trusted bots configured")
    }

    const botMessage = createNonAdminMessage(client)
    botMessage.author.id = TRUSTED_BOTS[0]
    botMessage.author.bot = true

    /// @ts-expect-error
    const result = botInhibitor.exec(botMessage)

    // Message was not blocked
    assert(!result)
  })

  it("does not allow non-trusted bots to use commands", () => {
    const botMessage = createNonAdminMessage(client)
    botMessage.author.id = "12345"
    botMessage.author.bot = true

    /// @ts-expect-error
    const result = botInhibitor.exec(botMessage)

    // Message was blocked
    assert(result)
  })
})
