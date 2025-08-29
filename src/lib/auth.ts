import { SignJWT, jwtVerify } from "jose";

const key = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");

export type SessionPayload = {
  sub: string;           // user id
  email: string;
  role?: string;
};

export async function signSession(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
