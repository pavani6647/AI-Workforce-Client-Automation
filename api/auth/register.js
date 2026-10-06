import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import pool from "../_lib/db.js";
import { createToken, setAuthCookie } from "../_lib/auth.js";

dotenv.config({ path: ".env.local" });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and role are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const allowedRoles = ["intern", "client"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at
      `,
      [name.trim(), normalizedEmail, passwordHash, role]
    );

    const user = result.rows[0];

    const token = await createToken(user);

    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user,
    });
    } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
      error: error.code || "UNKNOWN_ERROR",
    });
  }
}