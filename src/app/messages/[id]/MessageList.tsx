"use client";

import { useEffect, useRef } from "react";

type Msg = {
  id: string;
  body: string;
  senderId: string;
  createdAt: Date;
};

export default function MessageList({
  messages,
  me,
  otherLastReadAt,
}: {
  messages: Msg[];
  me: string;
  otherLastReadAt?: Date | null;
}) {
  const endRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on load + new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ✅ Find the LAST message sent by ME
  const lastMyMessage = [...messages]
    .reverse()
    .find((m) => m.senderId === me);

  return (
    <ul className="space-y-3">
      {messages.map((m, i) => {
        const mine = m.senderId === me;
        const prev = messages[i - 1];
        const showTime = !prev || prev.senderId !== m.senderId;

        const isLastOutgoing =
          mine && lastMyMessage?.id === m.id;

        const seen =
          isLastOutgoing &&
          otherLastReadAt &&
          otherLastReadAt >= m.createdAt;

        return (
          <li
            key={m.id}
            className={`flex ${mine ? "justify-end" : "justify-start"}`}
          >
            <div className="max-w-[75%]">
              <div
                className={`rounded-2xl px-4 py-2 text-sm ${
                  mine
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100"
                }`}
              >
                {m.body}
              </div>

              {showTime && (
                <div
                  className={`mt-1 text-[11px] text-gray-400 ${
                    mine ? "text-right" : "text-left"
                  }`}
                >
                  {m.createdAt.toLocaleString()}
                </div>
              )}

              {seen && (
                <div className="mt-0.5 text-[11px] text-gray-400 text-right">
                  Seen
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
