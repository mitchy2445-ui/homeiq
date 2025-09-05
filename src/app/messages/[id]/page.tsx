import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: { params: { id: string } }) {
  const s = await requireSession(`/messages/${params.id}`);

  // verify membership
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

  async function sendMessage(formData: FormData) {
    "use server";
    const ss = await requireSession(`/messages/${params.id}`);
    const text = String(formData.get("text") || "").trim();
    if (!text) return;

    // simple cooldown: 1 msg per 2s
    const last = await db.message.findFirst({
      where: { senderId: ss.sub, conversationId: params.id },
      orderBy: { createdAt: "desc" },
    });
    if (last && Date.now() - last.createdAt.getTime() < 2000) return;

    await db.message.create({
      data: { conversationId: params.id, senderId: ss.sub, body: text },
    });
    await db.conversation.update({
      where: { id: params.id },
      data: { lastMessageAt: new Date() },
    });
  }

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

      <form action={sendMessage} className="mt-3 flex gap-2">
        <input
          name="text"
          placeholder="Write a message…"
          className="flex-1 rounded-xl border px-3 py-2"
        />
        <button type="submit" className="rounded-xl bg-emerald-600 text-white px-4 py-2">
          Send
        </button>
      </form>
    </main>
  );
}
