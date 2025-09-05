import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const s = await requireSession("/messages");

  const convos = await db.conversation.findMany({
    where: { participants: { some: { userId: s.sub } } },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      listing: { select: { title: true, city: true, images: true } },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { body: true, createdAt: true, senderId: true },
      },
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Messages</h1>

      {convos.length === 0 ? (
        <p className="text-gray-600">No conversations yet.</p>
      ) : (
        <ul className="divide-y rounded-2xl border">
          {convos.map((c) => {
            const last = c.messages[0];
            const cover =
              (Array.isArray(c.listing?.images) ? (c.listing?.images as string[]) : [])[0] ??
              "/placeholder.svg";
            return (
              <li key={c.id} className="p-4 hover:bg-gray-50 transition">
                <Link href={`/messages/${c.id}`} className="flex items-center gap-3">
                  <div className="relative h-14 w-20 overflow-hidden rounded-lg border">
                    <Image src={cover} alt="" fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="font-medium truncate">
                        {c.listing?.title ?? "Listing"}
                      </p>
                      <span className="text-xs text-gray-500">
                        {last ? timeAgo(last.createdAt) : ""}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {last ? last.body : "No messages yet"}
                    </p>
                    {c.listing?.city && (
                      <p className="text-xs text-gray-500 mt-0.5">{c.listing.city}</p>
                    )}
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

function timeAgo(d: Date) {
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
