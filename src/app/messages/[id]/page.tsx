// src/app/messages/[id]/page.tsx
import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { redirect } from "next/navigation";
import { sendNewMessageEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: { params: { id: string } }) {
  const s = await requireSession(`/messages/${params.id}`);

  // Verify membership & load thread
  const convo = await db.conversation.findFirst({
    where: { id: params.id, participants: { some: { userId: s.sub } } },
    select: {
      id: true,
      listing: { select: { title: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, body: true, createdAt: true, senderId: true },
      },
    },
  });
  if (!convo) redirect("/messages");

  // Mark as read on open (create row if missing)
  await db.conversationParticipant.upsert({
    where: {
      conversationId_userId: { conversationId: params.id, userId: s.sub },
    },
    update: { lastReadAt: new Date() },
    create: {
      conversationId: params.id,
      userId: s.sub,
      lastReadAt: new Date(),
    },
  });

  /* ---------- actions ---------- */

  async function sendMessage(formData: FormData) {
    "use server";
    const ss = await requireSession(`/messages/${params.id}`);
    const text = String(formData.get("text") || "").trim();
    if (!text) return;

    // Cooldown: 1 message / 2s
    const last = await db.message.findFirst({
      where: { senderId: ss.sub, conversationId: params.id },
      orderBy: { createdAt: "desc" },
    });
    if (last && Date.now() - last.createdAt.getTime() < 2000) return;

    // 1) Create message
    const msg = await db.message.create({
      data: { conversationId: params.id, senderId: ss.sub, body: text },
      select: { body: true },
    });

    // 2) Update convo activity & mark sender as read
    await Promise.all([
      db.conversation.update({
        where: { id: params.id },
        data: { lastMessageAt: new Date() },
      }),
      db.conversationParticipant.upsert({
        where: {
          conversationId_userId: { conversationId: params.id, userId: ss.sub },
        },
        update: { lastReadAt: new Date() },
        create: { conversationId: params.id, userId: ss.sub, lastReadAt: new Date() },
      }),
    ]);

    // 3) Email other participants (simple preview)
    const recipients = await db.conversationParticipant.findMany({
      where: { conversationId: params.id, userId: { not: ss.sub } },
      select: { user: { select: { email: true } } },
    });

    await Promise.all(
      recipients
        .map((p) => p.user?.email)
        .filter(Boolean)
        .map((email) => sendNewMessageEmail(email!, msg.body.slice(0, 120), params.id))
    );
  }

  const QUICK_REPLIES = [
    "Hi! Is this still available?",
    "When can I book a viewing?",
    "My move-in date is flexible. What works for you?",
    "We are 2 occupants, no pets.",
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold">{convo.listing?.title ?? "Conversation"}</h1>

      <div className="mt-4 rounded-2xl border h-[60vh] overflow-y-auto p-4 bg-white">
        <ul className="space-y-3">
          {convo.messages.map((m) => {
            const mine = m.senderId === s.sub;
            return (
              <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine ? "bg-emerald-600 text-white" : "bg-gray-100"
                  }`}
                  title={m.createdAt.toLocaleString()}
                >
                  {m.body}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Quick replies */}
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_REPLIES.map((q) => (
          <form key={q} action={sendMessage}>
            <input type="hidden" name="text" value={q} />
            <button
              type="submit"
              className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
              title="Send quick reply"
            >
              {q}
            </button>
          </form>
        ))}
      </div>

      {/* Composer */}
      <form action={sendMessage} className="mt-3 flex gap-2 sticky bottom-4">
        <input
          name="text"
          placeholder="Write a message…"
          className="flex-1 rounded-xl border px-3 py-2"
          autoComplete="off"
        />
        <button type="submit" className="rounded-xl bg-emerald-600 text-white px-4 py-2">
          Send
        </button>
      </form>
    </main>
  );
}
