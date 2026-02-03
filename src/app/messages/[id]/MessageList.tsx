"use client";

import { useEffect, useRef } from "react";

type MsgStatus = "sending" | "sent" | "failed";

type Msg = {
  id: string;
  body: string;
  senderId: string;
  createdAt: Date | string; // supports server + client
  status?: MsgStatus;
};

export default function MessageList({
  messages,
  me,
  otherLastReadAt,
  onRetry,
}: {
  messages: Msg[];
  me: string;
  otherLastReadAt?: Date | null;
  onRetry?: (msg: Msg) => void;
}) {
  const endRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Find last message sent by me
  const lastMyMessage = [...messages]
    .reverse()
    .find((m) => m.senderId === me);

  return (
    <ul className="space-y-3">
      {messages.map((m, i) => {
        const mine = m.senderId === me;
        const prev = messages[i - 1];
        const showTime = !prev || prev.senderId !== m.senderId;

        // ✅ SAFELY normalize createdAt
        const createdAt =
          m.createdAt instanceof Date
            ? m.createdAt
            : new Date(m.createdAt);

        const isLastOutgoing = mine && lastMyMessage?.id === m.id;

        const seen =
          isLastOutgoing &&
          otherLastReadAt instanceof Date &&
          otherLastReadAt >= createdAt;

        // Message receipt text
        let receipt: string | null = null;
        if (isLastOutgoing) {
          if (m.status === "sending") receipt = "Sending…";
          else if (m.status === "failed") receipt = null;
          else if (seen) receipt = "Seen";
          else receipt = "Sent";
        }

        return (
          <li
            key={m.id}
            className={`flex ${mine ? "justify-end" : "justify-start"}`}
          >
            <div className="max-w-[75%]">
              <div
                className={`rounded-2xl px-4 py-2 text-sm ${
                  mine
                    ? m.status === "failed"
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-600 text-white"
                    : "bg-gray-100"
                }`}
              >
                {m.body}

                {/* Retry failed message */}
                {mine && m.status === "failed" && (
                  <button
                    onClick={() => onRetry?.(m)}
                    className="mt-1 block text-[11px] text-red-600 hover:underline"
                  >
                    Failed to send · Retry
                  </button>
                )}
              </div>

              {/* Timestamp */}
              {showTime && (
                <div
                  className={`mt-1 text-[11px] text-gray-400 ${
                    mine ? "text-right" : "text-left"
                  }`}
                >
                  {createdAt.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}

              {/* Read / Sent receipt */}
              {receipt && (
                <div className="mt-0.5 text-[11px] text-gray-400 text-right">
                  {receipt}
                </div>
              )}
            </div>
          </li>
        );
      })}

      <div ref={endRef} />
    </ul>
  );
}
