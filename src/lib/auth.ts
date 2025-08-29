// src/lib/auth.ts
import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const secret = process.env.AUTH_SECRET || "dev-secret-change-me";
const key = new TextEncoder().encode(secret);

export type SessionPayload = {
  sub: string;     // user id
  email: string;
  role?: string;   // e.g. "USER" | "LANDLORD" | "ADMIN"
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

/** Read and verify the JWT from the HttpOnly cookie on the server. */
export async function getSessionFromCookie() {
  const store = await cookies(); // Next 14: async
  const token = store.get("homeiq_session")?.value;
  if (!token) return null;
  return await verifySession(token);
}

/** Redirect to /auth/login if no session. Use in Server Components / Route Handlers. */
export async function requireSession(nextPath?: string) {
  const s = await getSessionFromCookie();
  if (!s) {
    const to = "/auth/login" + (nextPath ? `?next=${encodeURIComponent(nextPath)}` : "");
    redirect(to);
  }
  return s;
}

/** Optional: gate by role(s). Redirects home if role missing. */
export async function requireRole(roles: string[], nextPath?: string) {
  const s = await requireSession(nextPath);
  if (!s.role || !roles.includes(String(s.role))) redirect("/");
  return s;
}
