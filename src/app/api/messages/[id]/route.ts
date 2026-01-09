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
    return NextResponse.json({ messages: [] }, { status: 401 });
  }

  const convo = await db.conversation.findFirst({
    where: {
      id: params.id,
      participants: { some: { userId: s.sub } },
    },
    select: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          senderId: true,
          createdAt: true,
        },
      },
    },
  });

  if (!convo) {
    return NextResponse.json({ messages: [] }, { status: 404 });
  }

  return NextResponse.json({ messages: convo.messages });
}
