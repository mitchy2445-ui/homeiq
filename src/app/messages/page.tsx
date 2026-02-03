// src/app/messages/page.tsx
import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await requireSession("/messages");

  const conversations = await db.conversation.findMany({
    where: {
      participants: {
        some: { userId: session.sub },
      },
    },
    orderBy: { lastMessageAt: "desc" },
    select: {
      id: true,
      lastMessageAt: true,
      listing: {
        select: { title: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          body: true,
          createdAt: true,
          senderId: true,
        },
      },
      participants: {
        where: { userId: session.sub },
        select: { lastReadAt: true },
      },
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Messages</h1>

      {conversations.length === 0 ? (
        <div className="text-center text-gray-500 mt-24">
          <p className="text-sm">
            You don’t have any conversations yet.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-2xl border bg-white">
          {conversations.map((c) => {
            const lastMsg = c.messages[0];
            const lastReadAt = c.participants[0]?.lastReadAt ?? null;

            const lastCreatedAt = lastMsg
              ? new Date(lastMsg.createdAt)
              : null;

            const unread =
  !!lastMsg &&
  lastMsg.senderId !== session.sub &&
  (!lastReadAt || lastMsg.createdAt > lastReadAt);


            return (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  className="block hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4 px-4 py-3">
                    {/* Unread dot */}
                    <div className="w-2">
                      {unread && (
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-medium truncate">
                          {c.listing?.title ?? "Conversation"}
                        </p>

                        {lastCreatedAt && (
                          <span className="text-xs text-gray-400">
                            {formatTimestamp(lastCreatedAt)}
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-sm truncate ${
                          unread
                            ? "font-medium text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        {lastMsg?.body ?? "No messages yet"}
                      </p>
                    </div>
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

/* ---------- helpers ---------- */

function formatTimestamp(date: Date) {
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  return sameDay
    ? date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : date.toLocaleDateString();
}
