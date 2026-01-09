"use client";

import { useEffect } from "react";

type Msg = {
  id: string;
  body: string;
  senderId: string;
  createdAt: Date;
};

export default function MessagePoller({
  conversationId,
  lastTimestamp,
  onNewMessages,
}: {
  conversationId: string;
  lastTimestamp: Date | null;
  onNewMessages: (msgs: Msg[]) => void;
}) {
  useEffect(() => {
    let alive = true;

    async function poll() {
      try {
        const url = new URL(
          `/api/messages/${conversationId}`,
          window.location.origin
        );

        if (lastTimestamp) {
          url.searchParams.set(
            "after",
            lastTimestamp.toISOString()
          );
        }

        const res = await fetch(url.toString(), {
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json();
        if (alive && data.messages?.length) {
          onNewMessages(data.messages);
        }
      } catch {
        // silent
      }
    }

    const id = setInterval(poll, 2000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [conversationId, lastTimestamp, onNewMessages]);

  return null;
}
