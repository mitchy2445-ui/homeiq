import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/currentUser";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ status: "UNAUTHENTICATED" });
  }

  const u = await db.user.findUnique({
    where: { id: userId },
    select: { verificationStatus: true },
  });

  return NextResponse.json({ status: u?.verificationStatus ?? "UNVERIFIED" });
}
