// src/app/auth/verify/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") ?? "";

  // Missing or obviously wrong token → generic UX
  if (!token || token.length < 16) {
    return NextResponse.redirect(new URL("/auth/check-email", req.url));
  }

  // Look up token
  const vt = await db.verificationToken.findUnique({
    where: { token }, // token is unique in your schema
    select: { id: true, userId: true, expires: true },
  });

  // Not found or expired → generic UX
  if (!vt || vt.expires < new Date()) {
    if (vt) await db.verificationToken.delete({ where: { id: vt.id } }).catch(() => {});
    return NextResponse.redirect(new URL("/auth/check-email", req.url));
  }

  // Mark verified + consume token
  await db.user.update({
    where: { id: vt.userId },
    data: { emailVerified: new Date() },
  });
  await db.verificationToken.delete({ where: { id: vt.id } });

  // Success page
  return NextResponse.redirect(new URL("/auth/verified", req.url));
}
