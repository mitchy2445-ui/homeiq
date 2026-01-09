// src/app/api/auth/logout/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

// If you previously used other cookie names, list them here to clear too.
const LEGACY_COOKIES = ["auth", "token"];

export async function POST() {
  const jar = await cookies();

  // Match the attributes you used when setting the cookie
  // (Path=/ is critical; add `domain` below if you set one when logging in)
  const baseOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    // Some browsers only respect deletion with an explicit past `expires`
    expires: new Date(0),
    maxAge: 0,
  };

  // Clear primary cookie
  jar.set(AUTH_COOKIE, "", baseOpts);

  // Clear any legacy names too
  for (const name of LEGACY_COOKIES) {
    jar.set(name, "", baseOpts);
  }

  // If you originally set a custom domain, also clear with that domain:
  // const domainOpts = { ...baseOpts, domain: ".yourdomain.com" };
  // jar.set(AUTH_COOKIE, "", domainOpts);

  return NextResponse.json({ ok: true });
}
