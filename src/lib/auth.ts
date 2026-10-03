import { SignJWT, jwtVerify } from "jose";

const envSecret = process.env.JWT_SECRET;

if (!envSecret && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: JWT_SECRET environment variable is not defined.");
}

const JWT_SECRET = new TextEncoder().encode(envSecret || "dev-only-insecure-secret");

export async function signToken(payload: { userId: number; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}