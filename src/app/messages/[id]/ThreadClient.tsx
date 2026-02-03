"use client";

import { useEffect, useRef, useState } from "react";
import MessageList from "./MessageList";
import TypingIndicator from "./TypingIndicator";
import { getSocket } from "@/lib/socket-client";

type MsgStatus = "sending" | "sent" | "failed";

type Msg = {
  id: string;
  body: string;
  senderId: string;
  createdAt: Date | string;
  status?: MsgStatus;
};

type Props = {
  conversationId: string;
  listingTitle: string;
  me: string;
  initialMessages: Msg[];
  otherLastReadAt: Date | null;
  sendMessage: (formData: FormData) => Promise<void>;
};

export default function ThreadClient({
  conversationId,
  listingTitle,
  me,
  initialMessages,
  otherLastReadAt,
  sendMessage,
}: Props) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  /* ---------------- socket: join room + receive messages ---------------- */

  useEffect(() => {
    const socket = getSocket();

    // join conversation room
    socket.emit("join", conversationId);

    const onNewMessage = (msg: Msg) => {
      setMessages((prev) => {
        // 🔒 prevent duplicates (CRITICAL)
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on("message:new", onNewMessage);

    return () => {
      socket.off("message:new", onNewMessage);
    };
  }, [conversationId]);

  /* ---------------- smart auto-scroll ---------------- */

  function isNearBottom(): boolean {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }

  useEffect(() => {
    if (isNearBottom()) {
      containerRef.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length]);

  /* ---------------- send message ---------------- */

  async function handleSend() {
    if (!text.trim() || sending) return;

    const tempId = `tmp-${Date.now()}`;

    const optimistic: Msg = {
      id: tempId,
      body: text,
      senderId: me,
      createdAt: new Date(),
      status: "sending",
    };

    setMessages((prev) => [...prev, optimistic]);
    setText("");
    setSending(true);

    try {
      const fd = new FormData();
      fd.set("text", optimistic.body);

      await sendMessage(fd);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, status: "sent" } : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, status: "failed" } : m
        )
      );
    } finally {
      setSending(false);
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <h1 className="text-xl font-semibold">{listingTitle}</h1>

      {/* Messages */}
      <div
        ref={containerRef}
        className="mt-4 rounded-2xl border h-[60vh] overflow-y-auto p-4 pb-28 bg-white"
      >
        {messages.length === 0 ? (
          <p className="mt-24 text-center text-sm text-gray-500">
            No messages yet. Say hello 👋
          </p>
        ) : (
          <MessageList
            messages={messages}
            me={me}
            otherLastReadAt={otherLastReadAt}
            onRetry={(msg) => {
              setText(msg.body);
              setMessages((prev) =>
                prev.filter((m) => m.id !== msg.id)
              );
            }}
          />
        )}

        <TypingIndicator conversationId={conversationId} />
      </div>

      {/* Composer */}
      <div className="fixed bottom-0 left-0 right-0 md:sticky md:bottom-4 flex gap-2 border-t bg-white px-4 py-3">
        <textarea
          value={text}
          placeholder="Write a message…"
          rows={1}
          className="flex-1 resize-none rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <button
          disabled={sending || !text.trim()}
          onClick={handleSend}
          className={`rounded-xl px-4 py-2 transition ${
            sending || !text.trim()
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          Send
        </button>
      </div>
    </main>
  );
}
