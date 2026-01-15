import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ count: 0 });
  }

  const count = await db.conversation.count({
    where: {
      participants: {
        some: {
          userId: session.sub,
          OR: [
            { lastReadAt: null },
            {
              conversation: {
                lastMessageAt: {
                  gt: undefined, // placeholder, filtered below
                },
              },
            },
          ],
        },
      },
    },
  });

  // More precise: count conversations where lastMessageAt > lastReadAt
  const rows = await db.conversationParticipant.findMany({
    where: { userId: session.sub },
    select: {
      lastReadAt: true,
      conversation: { select: { lastMessageAt: true } },
    },
  });

  const unread = rows.filter(
    (r) =>
      r.conversation.lastMessageAt &&
      (!r.lastReadAt ||
        r.conversation.lastMessageAt > r.lastReadAt)
  ).length;

  return NextResponse.json({ count: unread });
}
