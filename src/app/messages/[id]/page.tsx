// src/app/messages/[id]/page.tsx
import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { redirect } from "next/navigation";
import { sendNewMessageEmail } from "@/lib/email";
import MessageList from "./MessageList";
import TypingIndicator from "./TypingIndicator";


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

  /* ---------------- mark as read ---------------- */

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

  /* ---------------- server actions ---------------- */

  async function sendMessage(formData: FormData) {
    "use server";

    const ss = await requireSession(`/messages/${params.id}`);
    const text = String(formData.get("text") || "").trim();
    if (!text) return;

    // Cooldown: 1 message / 2 seconds
    const last = await db.message.findFirst({
      where: { senderId: ss.sub, conversationId: params.id },
      orderBy: { createdAt: "desc" },
    });

    if (last && Date.now() - last.createdAt.getTime() < 2000) return;

    // 1) Create message
    const msg = await db.message.create({
      data: {
        conversationId: params.id,
        senderId: ss.sub,
        body: text,
      },
      select: { body: true },
    });

    // 2) Update conversation + mark sender read
    await Promise.all([
      db.conversation.update({
        where: { id: params.id },
        data: { lastMessageAt: new Date() },
      }),
      db.conversationParticipant.upsert({
        where: {
          conversationId_userId: {
            conversationId: params.id,
            userId: ss.sub,
          },
        },
        update: { lastReadAt: new Date() },
        create: {
          conversationId: params.id,
          userId: ss.sub,
          lastReadAt: new Date(),
        },
      }),
    ]);

    // 3) Email other participants
    const recipients = await db.conversationParticipant.findMany({
      where: {
        conversationId: params.id,
        userId: { not: ss.sub },
      },
      select: { user: { select: { email: true } } },
    });

    await Promise.all(
      recipients
        .map((p) => p.user?.email)
        .filter(Boolean)
        .map((email) =>
          sendNewMessageEmail(email!, msg.body.slice(0, 120), params.id)
        )
    );

    await db.conversationParticipant.update({
  where: {
    conversationId_userId: {
      conversationId: params.id,
      userId: ss.sub,
    },
  },
  data: { isTyping: false },
});

  }

  async function setTyping(isTyping: boolean) {
    "use server";

    const ss = await requireSession(`/messages/${params.id}`);

    await db.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: params.id,
          userId: ss.sub,
        },
      },
      data: { isTyping },
    });
  }

  const QUICK_REPLIES = [
    "Hi! Is this still available?",
    "When can I book a viewing?",
    "My move-in date is flexible. What works for you?",
    "We are 2 occupants, no pets.",
  ];

  /* ---------------- UI ---------------- */

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold">
        {convo.listing?.title ?? "Conversation"}
      </h1>

      {/* Messages */}
      <div className="mt-4 rounded-2xl border h-[60vh] overflow-y-auto p-4 pb-28 bg-white">
        {convo.messages.length === 0 ? (
          <p className="mt-24 text-center text-sm text-gray-500">
            No messages yet. Say hello 👋
          </p>
        ) : (
         <MessageList
  messages={convo.messages}
  me={s.sub}
  otherLastReadAt={convo.participants[0]?.lastReadAt ?? null}
  conversationId={params.id}
/>

          
        )}
       <TypingIndicator conversationId={params.id} />


      </div>

      {/* Quick replies */}
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_REPLIES.map((q) => (
          <form key={q} action={sendMessage}>
            <input type="hidden" name="text" value={q} />
            <button
              type="submit"
              className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
            >
              {q}
            </button>
          </form>
        ))}
      </div>

      {/* Composer (mobile-first) */}
      <form
        action={sendMessage}
        className="
          fixed bottom-0 left-0 right-0
          md:sticky md:bottom-4
          flex gap-2
          border-t bg-white
          px-4 py-3
          pb-[env(safe-area-inset-bottom)]
        "
      >
       <input
  name="text"
  placeholder="Write a message…"
  className="flex-1 rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
  autoComplete="off"
  onFocus={() => {
    fetch(`/api/messages/${params.id}/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTyping: true }),
    });
  }}
  onBlur={() => {
    fetch(`/api/messages/${params.id}/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTyping: false }),
    });
  }}
/>



        <button
          type="submit"
          className="rounded-xl bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700 transition"
        >
          Send
        </button>
      </form>
    </main>
  );
}
