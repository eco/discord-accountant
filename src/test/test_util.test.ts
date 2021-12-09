import mysql, { Pool } from "mysql2/promise"
import { readFile } from "fs/promises"
import path from "path"

export function createTestDatabasePool() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE_TEST,
    port: Number(process.env.DB_PORT),
    multipleStatements: true,
  })
}

export async function dropAndCreateTables(pool: Pool) {
  const sql = await readFile(
    path.join(__dirname, "..", "..", "db.sql"),
    "utf-8"
  )

  return pool.query(sql)
}
