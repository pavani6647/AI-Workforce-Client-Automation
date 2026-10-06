import dotenv from "dotenv";
import { SignJWT, jwtVerify } from "jose";

dotenv.config({ path: ".env.local" });

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not available in the API runtime");
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function createToken(user) {
  return await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

export function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.trim().split("=");

    if (key === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}

export function setAuthCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    `shuroq_session=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`
  );
}

export function clearAuthCookie(res) {
  res.setHeader(
    "Set-Cookie",
    "shuroq_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
  );
}