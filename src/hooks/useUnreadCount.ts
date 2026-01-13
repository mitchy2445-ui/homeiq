"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export function useUnreadCount() {
  const [count, setCount] = useState(0);

  async function refresh() {
    const res = await fetch("/api/messages/unread-count", {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      setCount(data.count ?? 0);
    }
  }

  useEffect(() => {
    refresh();

    const socket = io({
      path: "/api/socket",
      withCredentials: true,
    });

    socket.on("messages:unread:update", refresh);

    return () => {
      socket.disconnect();
    };
  }, []);

  return count;
}
