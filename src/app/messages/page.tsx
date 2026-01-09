import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const s = await requireSession("/messages");

  const convos = await db.conversation.findMany({
    where: { participants: { some: { userId: s.sub } } },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      listing: { select: { title: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true },
      },
      participants: {
        where: { userId: s.sub },
        select: { lastReadAt: true },
      },
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Messages</h1>

      {!convos.length ? (
        <div className="mt-16 text-center text-gray-600">
          <p className="text-lg font-medium">No messages yet</p>
          <p className="mt-2 text-sm">
            When you contact a host, your conversations will appear here.
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y rounded-2xl border bg-white">
          {convos.map((c) => {
            const last = c.messages[0];
            const lastAt = last?.createdAt ?? null;
            const lastRead = c.participants[0]?.lastReadAt ?? null;
            const unread = lastAt && (!lastRead || lastAt > lastRead);
            const title = c.listing?.title ?? "Conversation";

            return (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  className="block p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="truncate font-medium">{title}</h2>
                    {unread && (
                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
                        New
                      </span>
                    )}
                  </div>

                  <p className="mt-1 truncate text-sm text-gray-600">
                    {last ? preview(last.body, 120) : "No messages yet."}
                  </p>

                  {lastAt && (
                    <p className="mt-1 text-xs text-gray-400">
                      {timeAgo(lastAt)}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

/* ---------- helpers ---------- */

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
