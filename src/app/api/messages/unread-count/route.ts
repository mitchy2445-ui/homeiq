import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ count: 0 });
  }

  // Fetch all conversation participants for this user
  const rows = await db.conversationParticipant.findMany({
    where: {
      userId: session.sub,
    },
    select: {
      lastReadAt: true,
      conversation: {
        select: {
          lastMessageAt: true,
        },
      },
    },
  });

  // Count unread conversations
  const unreadCount = rows.filter((row) => {
    const lastMessageAt = row.conversation.lastMessageAt;
    const lastReadAt = row.lastReadAt;

    if (!lastMessageAt) return false;
    if (!lastReadAt) return true;

    return lastMessageAt > lastReadAt;
  }).length;

  return NextResponse.json({ count: unreadCount });
}
