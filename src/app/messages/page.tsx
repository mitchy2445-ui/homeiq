// src/app/messages/page.tsx
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const s = await requireSession("/messages");

  // Fetch conversations the user belongs to, newest first
  const convos = await db.conversation.findMany({
    where: { participants: { some: { userId: s.sub } } },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      listing: { select: { title: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, senderId: true },
      },
      participants: { where: { userId: s.sub }, select: { lastReadAt: true } },
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Messages</h1>

      {!convos.length ? (
        <p className="mt-6 text-gray-600">No conversations yet.</p>
      ) : (
        <ul className="mt-6 divide-y rounded-2xl border bg-white">
          {convos.map((c) => {
            const last = c.messages[0];
            const lastAt = last?.createdAt ?? null;
            const lastRead = c.participants[0]?.lastReadAt ?? null;
            const unread = lastAt && (!lastRead || lastAt > lastRead);
            const title = c.listing?.title ?? "Conversation";
            return (
              <li key={c.id} className="p-4 hover:bg-gray-50">
                <Link href={`/messages/${c.id}`} className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="truncate font-medium">{title}</h2>
                      {unread && (
                        <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
                          Unread
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-600">
                      {last ? preview(last.body, 120) : "No messages yet."}
                    </p>
                    {lastAt ? (
                      <p className="mt-1 text-xs text-gray-500">{timeAgo(lastAt)}</p>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

/* ---------- small helpers ---------- */

function preview(text: string, max = 100) {
  const s = text.replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function timeAgo(date: Date) {
  const ms = Date.now() - date.getTime();
  const sec = Math.round(ms / 1000);
  if (sec < 60) return "Just now";
  const mins = Math.round(sec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}
