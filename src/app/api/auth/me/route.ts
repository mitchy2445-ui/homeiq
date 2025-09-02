// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const s = await getSessionFromCookie();
  return NextResponse.json({
    user: s ? { email: s.email, role: s.role } : null,
  });
}
