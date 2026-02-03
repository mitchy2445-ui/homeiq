"use client";

import { useEffect, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket-client";

export function useUnreadCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/messages/unread-count", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      setCount(data.count ?? 0);
    } else {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const handleUpdate = () => {
      refresh();
    };

    socket.on("messages:unread:update", handleUpdate);

    return () => {
      socket.off("messages:unread:update", handleUpdate);
    };
  }, [refresh]);

  return { count, refresh };
}