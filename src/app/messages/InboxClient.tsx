"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket-client";
import ConversationRow from "./ConversationRow";

type InboxItem = {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageAt: Date | string | null;
  unread: boolean;
};

export default function InboxClient({
  conversations: initial,
}: {
  conversations: InboxItem[];
}) {
  const [conversations, setConversations] =
    useState<InboxItem[]>(initial);

  /* -------- socket inbox updates -------- */

  useEffect(() => {
    function onInboxUpdate(payload: {
      conversationId: string;
      body: string;
      createdAt: string;
    }) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === payload.conversationId
            ? {
                ...c,
                lastMessage: payload.body,
                lastMessageAt: payload.createdAt,
                unread: true,
              }
            : c
        )
      );
    }

    socket.on("inbox:update", onInboxUpdate);
    return () => {
      socket.off("inbox:update", onInboxUpdate);
    };
  }, []);

  /* -------- UI -------- */

  if (conversations.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-24">
        <p className="text-sm">
          You don’t have any conversations yet.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-2xl border bg-white">
      {conversations.map((c) => (
        <ConversationRow
          key={c.id}
          id={c.id}
          title={c.title}
          lastMessage={c.lastMessage}
          lastMessageAt={c.lastMessageAt}
          unread={c.unread}
        />
      ))}
    </ul>
  );
}
