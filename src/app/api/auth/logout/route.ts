// src/app/api/auth/logout/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const jar = await cookies();
  jar.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 }); // clear site-wide
  return NextResponse.json({ ok: true });
}
