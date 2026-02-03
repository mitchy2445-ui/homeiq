  // src/lib/auth.ts
  import { SignJWT, jwtVerify, type JWTPayload } from "jose";
  import { cookies } from "next/headers";
  import { NextResponse } from "next/server";
  import { redirect } from "next/navigation";

  export const AUTH_COOKIE = "homeiq_session";

  const secret = new TextEncoder().encode(
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
    return await new SignJWT(payload as JWTPayload)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);
  }

  export async function verifySession(token: string) {
    try {
      const { payload } = await jwtVerify(token, secret);
      return payload as SessionPayload;
    } catch {
      return null;
    }
  }

  /** Read and verify the session from the request cookie (Next 15: cookies() is async). */
  export async function getSessionFromCookie() {
    const jar = await cookies();
    const token = jar.get(AUTH_COOKIE)?.value ?? null;
    return token ? await verifySession(token) : null;
  }

  /** Require a session or redirect to login. */
  export async function requireSession(redirectTo = "/auth/login") {
    const s = await getSessionFromCookie();
    if (!s) redirect(redirectTo);
    return s!;
  }

  /** Attach the session cookie to a NextResponse (use in route handlers). */
  export function attachSessionCookie(res: NextResponse, token: string) {
    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return res;
  }

  /** Clear the session cookie on a NextResponse. */
  export function clearSessionCookieOn(res: NextResponse) {
    res.cookies.set(AUTH_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
      expires: new Date(0), // ✅ helps some browsers clear immediately
    });
    return res;
  }
