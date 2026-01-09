"use client";

import { useEffect, useRef, useState } from "react";

type Msg = {
  id: string;
  body: string;
  senderId: string;
  createdAt: Date;
};

export default function MessageList({
  messages: initialMessages,
  me,
  otherLastReadAt,
  conversationId,
}: {
  messages: Msg[];
  me: string;
  otherLastReadAt?: Date | null;
  conversationId: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // 🔁 Poll for new messages
  useEffect(() => {
    let alive = true;

    async function poll() {
      try {
        const res = await fetch(`/api/messages/${conversationId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;

        const data = await res.json();
        if (alive) setMessages(data.messages);
      } catch {}
    }

    const id = setInterval(poll, 2000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [conversationId]);

  const lastMessage = messages[messages.length - 1];

  return (
    <ul className="space-y-3">
      {messages.map((m, i) => {
        const mine = m.senderId === me;
        const prev = messages[i - 1];
        const showTime = !prev || prev.senderId !== m.senderId;

        const isLastOutgoing = mine && m.id === lastMessage?.id;
        const seen =
          isLastOutgoing &&
          otherLastReadAt &&
          otherLastReadAt > new Date(m.createdAt);

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
                  {new Date(m.createdAt).toLocaleString()}
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
