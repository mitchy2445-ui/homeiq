// src/app/auth/verify/route.ts
import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/auth/login?verify=missing", req.url));

  const record = await db.verificationToken.findUnique({ where: { token } });
  if (!record || record.expires < new Date()) {
    // cleanup any expired
    if (record) await db.verificationToken.delete({ where: { token } }).catch(() => {});
    return NextResponse.redirect(new URL("/auth/login?verify=expired", req.url));
  }

  await db.user.update({
    where: { id: record.userId },
    data: { emailVerified: new Date() },
  });

  await db.verificationToken.delete({ where: { token } }).catch(() => {});
  return NextResponse.redirect(new URL("/auth/login?verify=ok", req.url));
}
