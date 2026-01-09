import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const s = await getSessionFromCookie();
  if (!s) {
    return NextResponse.json({ isTyping: false });
  }

  const participant = await db.conversationParticipant.findFirst({
    where: {
      conversationId: params.id,
      userId: { not: s.sub },
      isTyping: true,
    },
    select: { userId: true },
  });

  return NextResponse.json({
    isTyping: Boolean(participant),
  });
}
