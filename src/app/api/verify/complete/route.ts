import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await db.user.findUnique({
    where: { id: userId },
    select: { phoneVerifiedAt: true, emailVerifiedAt: true, verificationStatus: true },
  });

  if (!me?.phoneVerifiedAt || !me?.emailVerifiedAt) {
    return NextResponse.json({ error: "Please verify phone and email first." }, { status: 400 });
  }

  // Mark the account verified if not already
  if (me.verificationStatus !== "VERIFIED") {
    await db.user.update({
      where: { id: userId },
      data: { verificationStatus: "VERIFIED", verifiedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true, next: "/landlord/new/basics" });
}
