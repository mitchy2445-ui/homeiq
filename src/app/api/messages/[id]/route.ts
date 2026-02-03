import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const s = await getSessionFromCookie();
  if (!s) {
    return NextResponse.json({ messages: [] }, { status: 401 });
  }

  // Parse ?after= timestamp for polling
  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after");

  // Verify user is part of the conversation
  const convo = await db.conversation.findFirst({
    where: {
      id: params.id,
      participants: { some: { userId: s.sub } },
    },
    select: {
      id: true,
    },
  });

  if (!convo) {
    return NextResponse.json({ messages: [] }, { status: 404 });
  }

  // Fetch messages (incremental if after exists)
  const messages = await db.message.findMany({
    where: {
      conversationId: params.id,
      ...(after
        ? {
            createdAt: {
              gt: new Date(after),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      senderId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ messages });
}
