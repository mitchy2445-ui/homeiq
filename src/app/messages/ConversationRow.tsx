"use client";

import Link from "next/link";

type ConversationRowProps = {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageAt: Date | string | null;
  unread: boolean;
  onOpen: () => void; // ✅ added
};

export default function ConversationRow({
  id,
  title,
  lastMessage,
  lastMessageAt,
  unread,
  onOpen,
}: ConversationRowProps) {
  const ts = lastMessageAt
    ? new Date(lastMessageAt)
    : null;

  return (
    <li>
      <Link
        href={`/messages/${id}`}
        onClick={onOpen}
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
              <p
                className={`truncate ${
                  unread ? "font-semibold" : "font-medium"
                }`}
              >
                {title}
              </p>

              {ts && (
                <span className="text-xs text-gray-400">
                  {formatTimestamp(ts)}
                </span>
              )}
            </div>

            <p
              className={`text-sm truncate ${
                unread
                  ? "text-gray-900 font-medium"
                  : "text-gray-500"
              }`}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      </Link>
    </li>
  );
}

/* -------- helpers -------- */

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
