"use client";

import { useEffect, useState } from "react";

export default function TypingIndicator({
  conversationId,
}: {
  conversationId: string;
}) {
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let alive = true;

    async function poll() {
      try {
        const res = await fetch(
          `/api/messages/${conversationId}/typing`,
          { cache: "no-store" }
        );
        if (!res.ok) return;

        const data = await res.json();
        if (alive) setTyping(Boolean(data.isTyping));
      } catch {
        // silent
      }
    }

    poll();
    const id = setInterval(poll, 2000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [conversationId]);

  if (!typing) return null;

  return (
    <div className="px-3 py-1 text-sm text-gray-500 italic">
      Typing…
    </div>
  );
}
