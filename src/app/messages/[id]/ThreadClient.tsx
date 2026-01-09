"use client";

import { useState } from "react";
import MessageList from "./MessageList";
import TypingIndicator from "./TypingIndicator";
import MessagePoller from "./MessagePoller";

type Msg = {
  id: string;
  body: string;
  senderId: string;
  createdAt: Date;
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

  const lastTimestamp =
    messages.length > 0
      ? messages[messages.length - 1].createdAt
      : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <h1 className="text-xl font-semibold">
        {listingTitle}
      </h1>

      {/* Messages */}
      <div className="mt-4 rounded-2xl border h-[60vh] overflow-y-auto p-4 pb-28 bg-white">
        {messages.length === 0 ? (
          <p className="mt-24 text-center text-sm text-gray-500">
            No messages yet. Say hello 👋
          </p>
        ) : (
          <MessageList
            messages={messages}
            me={me}
            otherLastReadAt={otherLastReadAt}
          />
        )}

        <TypingIndicator conversationId={conversationId} />
      </div>

      {/* Poller */}
      <MessagePoller
        conversationId={conversationId}
        lastTimestamp={lastTimestamp}
        onNewMessages={(newMsgs) =>
          setMessages((prev) => [...prev, ...newMsgs])
        }
      />

      {/* Quick replies */}
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          "Hi! Is this still available?",
          "When can I book a viewing?",
          "My move-in date is flexible. What works for you?",
          "We are 2 occupants, no pets.",
        ].map((q) => (
          <form key={q} action={sendMessage}>
            <input type="hidden" name="text" value={q} />
            <button
              type="submit"
              className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
            >
              {q}
            </button>
          </form>
        ))}
      </div>

      {/* Composer */}
      <form
        action={sendMessage}
        className="
          fixed bottom-0 left-0 right-0
          md:sticky md:bottom-4
          flex gap-2
          border-t bg-white
          px-4 py-3
          pb-[env(safe-area-inset-bottom)]
        "
      >
        <input
          name="text"
          placeholder="Write a message…"
          autoComplete="off"
          className="flex-1 rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          onFocus={() =>
            fetch(`/api/messages/${conversationId}/typing`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isTyping: true }),
            })
          }
          onBlur={() =>
            fetch(`/api/messages/${conversationId}/typing`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isTyping: false }),
            })
          }
        />

        <button
          type="submit"
          className="rounded-xl bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700 transition"
        >
          Send
        </button>
      </form>
    </main>
  );
}
