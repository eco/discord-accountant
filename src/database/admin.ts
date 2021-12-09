import { Pool } from "mysql2/promise"

// Check if user is in admin list
export async function isAdmin(userID: string, pool: Pool) {
  const [rows] = await pool.execute("SELECT * FROM admins WHERE id=?", [userID])

  if (!Array.isArray(rows)) {
    return false
  }

  return rows.length > 0
}

// Add user to admin list
export async function addAdmin(
  caller: { id: string; username: string },
  target: { id: string; username: string },
  pool: Pool
) {
  return pool.execute(
    "INSERT INTO admins (id, username, by_id, by_username) VALUES(?, ?, ?, ?)",
    [target.id, target.username, caller.id, caller.username]
  )
}

// Remove user from admin list
export async function removeAdmin(userID: string, pool: Pool) {
  return pool.execute("DELETE FROM admins WHERE id = ?", [userID])
}

// Get the list of admins
export async function listAdmins(pool: Pool) {
  const [rows] = await pool.execute(
    `SELECT * FROM admins ORDER BY created DESC`
  )

  if (!Array.isArray(rows)) {
    return
  }

  return rows as { id: string }[]
}
