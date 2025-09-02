// src/lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const AUTH_COOKIE = "homeiq_session"; // <- single source of truth

const key = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-secret-change-me"
);

export type SessionPayload = {
  sub: string;  // user id
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
};

export async function signSession(
  payload: Omit<SessionPayload, "iat" | "exp">
) {
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

export async function getSessionFromCookie() {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  return token ? await verifySession(token) : null;
}

export async function requireSession(redirectTo = "/auth/login") {
  const s = await getSessionFromCookie();
  if (!s) redirect(redirectTo);
  return s!;
}
