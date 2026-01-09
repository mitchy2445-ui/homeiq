// src/app/api/auth/me/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth";
import { prisma as db } from "@/lib/db";

export async function GET() {
  const s = await getSessionFromCookie();
  if (!s) {
    return new NextResponse(JSON.stringify({ user: null }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  }

  const user = await db.user.findUnique({
    where: { id: s.sub },
    select: { id: true, email: true, role: true, emailVerifiedAt: true, verificationStatus: true },
  });

  return new NextResponse(JSON.stringify({ user }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
