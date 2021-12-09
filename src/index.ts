import mysql from "mysql2/promise"
import { Accountant } from "./client"

async function start() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT),
  })

  const client = new Accountant(pool)
  client.login(process.env.BOT_TOKEN)
}

start().catch((err) => {
  console.warn(err)
  process.exit(1)
})
