"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket-client";

export default function TypingIndicator({
  conversationId,
}: {
  conversationId: string;
}) {
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    function onTyping(payload: { isTyping: boolean }) {
      setTyping(payload.isTyping);
    }

    // join conversation room
    socket.emit("join", conversationId);
    socket.on("typing", onTyping);

    return () => {
      socket.off("typing", onTyping);
    };
  }, [conversationId]);

  if (!typing) return null;

  return (
    <div className="px-3 py-1 text-sm text-gray-500 italic">
      Typing…
    </div>
  );
}
