// src/app/messages/[id]/page.tsx
import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { redirect } from "next/navigation";
import { sendNewMessageEmail } from "@/lib/email";
import ThreadClient from "./ThreadClient";
import { getIO } from "@/lib/socket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: { id: string };
}) {
  const s = await requireSession(`/messages/${params.id}`);

  /* ---------------- load conversation ---------------- */

  const convo = await db.conversation.findFirst({
    where: {
      id: params.id,
      participants: { some: { userId: s.sub } },
    },
    select: {
      id: true,
      listing: { select: { title: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          createdAt: true,
          senderId: true,
        },
      },
      participants: {
        where: { userId: { not: s.sub } },
        select: { lastReadAt: true },
      },
    },
  });

  if (!convo) redirect("/messages");

  /* ---------------- mark as read on open ---------------- */

  await db.conversationParticipant.upsert({
    where: {
      conversationId_userId: {
        conversationId: params.id,
        userId: s.sub,
      },
    },
    update: { lastReadAt: new Date() },
    create: {
      conversationId: params.id,
      userId: s.sub,
      lastReadAt: new Date(),
    },
  });

  /* ---------------- send message (server action) ---------------- */

  async function sendMessage(formData: FormData) {
    "use server";

    const ss = await requireSession(`/messages/${params.id}`);
    const text = String(formData.get("text") || "").trim();
    if (!text) return;

    // Anti-spam cooldown (2s)
    const last = await db.message.findFirst({
      where: { senderId: ss.sub, conversationId: params.id },
      orderBy: { createdAt: "desc" },
    });

    if (last && Date.now() - last.createdAt.getTime() < 2000) return;

    // Create message
    const msg = await db.message.create({
      data: {
        conversationId: params.id,
        senderId: ss.sub,
        body: text,
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
      },
    });

    /* ---------------- real-time socket emits ---------------- */

    const io = getIO();

    // 1. Update open thread (conversation room)
    io?.to(params.id).emit("message:new", {
      id: msg.id,
      body: msg.body,
      senderId: ss.sub,
      createdAt: msg.createdAt,
    });

    // 2. Update inbox for sender
    io?.to(`user:${ss.sub}`).emit("inbox:update", {
      conversationId: params.id,
      body: msg.body,
      createdAt: msg.createdAt,
    });

    // 3. Update inbox for other participants
    const others = await db.conversationParticipant.findMany({
      where: {
        conversationId: params.id,
        userId: { not: ss.sub },
      },
      select: { userId: true },
    });

    others.forEach((p) => {
      io?.to(`user:${p.userId}`).emit("inbox:update", {
        conversationId: params.id,
        body: msg.body,
        createdAt: msg.createdAt,
      });
    });

    /* ---------------- update conversation + sender read state ---------------- */

    await Promise.all([
      db.conversation.update({
        where: { id: params.id },
        data: { lastMessageAt: msg.createdAt },
      }),
      db.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId: params.id,
            userId: ss.sub,
          },
        },
        data: {
          lastReadAt: msg.createdAt,
          isTyping: false,
        },
      }),
    ]);

    /* ---------------- email notification fallback ---------------- */

    const recipients = await db.conversationParticipant.findMany({
      where: {
        conversationId: params.id,
        userId: { not: ss.sub },
      },
      select: {
        user: { select: { email: true } },
      },
    });

    await Promise.all(
      recipients
        .map((p) => p.user?.email)
        .filter(Boolean)
        .map((email) =>
          sendNewMessageEmail(
            email!,
            msg.body.slice(0, 120),
            params.id
          )
        )
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <ThreadClient
      conversationId={convo.id}
      listingTitle={convo.listing?.title ?? "Conversation"}
      me={s.sub}
      initialMessages={convo.messages}
      otherLastReadAt={convo.participants[0]?.lastReadAt ?? null}
      sendMessage={sendMessage}
    />
  );
}
