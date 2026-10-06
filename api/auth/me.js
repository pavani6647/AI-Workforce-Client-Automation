import pool from "../_lib/db.js";
import {
  getCookieValue,
  verifyToken,
} from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const token = getCookieValue(
      req.headers.cookie,
      "shuroq_session"
    );

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const payload = await verifyToken(token);

    const result = await pool.query(
      `
      SELECT id, name, email, role
      FROM users
      WHERE id = $1
      `,
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session",
    });
  }
}
