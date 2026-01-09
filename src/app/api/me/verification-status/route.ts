// src/app/api/me/verification-status/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";

type VerificationStatus = "UNAUTHENTICATED" | "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export async function GET() {
  const sess = await getSessionFromCookie();

  let status: VerificationStatus = "UNAUTHENTICATED";
  if (sess?.sub) {
    const u = await db.user.findUnique({
      where: { id: sess.sub },
      select: { verificationStatus: true },
    });
    status = (u?.verificationStatus ?? "UNVERIFIED") as VerificationStatus;
  }

  return new NextResponse(JSON.stringify({ status }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
