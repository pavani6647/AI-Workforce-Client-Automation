import pool from "./_lib/db.js";
import { getCookieValue, verifyToken } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const token = getCookieValue(req.headers.cookie, "shuroq_session");

    if (!token) {
      return res.status(401).json({
        error: "Not authenticated",
      });
    }

    let user;

    try {
      user = await verifyToken(token);
    } catch {
      return res.status(401).json({
        error: "Invalid or expired session",
      });
    }

    const result = await pool.query(`
      SELECT
        ip.id,
        u.id AS user_id,
        u.name,
        u.email,
        ip.job_role,
        ip.status,
        ip.skills,
        ip.created_at,
        ip.updated_at
      FROM intern_profiles ip
      INNER JOIN users u
        ON u.id = ip.user_id
      ORDER BY ip.id
    `);

    return res.status(200).json({
      interns: result.rows,
      currentUser: user,
    });
  } catch (error) {
    console.error("GET /api/interns error:", error);

    return res.status(500).json({
      error: "Failed to fetch interns.",
    });
  }
}
