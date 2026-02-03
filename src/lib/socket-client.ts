"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Singleton socket client
 * - One connection per tab
 * - Safe across re-renders
 * - Matches server path + credentials
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: "/api/socket",
      withCredentials: true,
      autoConnect: true,
    });

    socket.on("connect", () => {
      console.log("🟢 Socket connected (client):", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected (client)");
    });
  }

  return socket;
}

/**
 * Optional helper (recommended)
 * Call this ONCE after login / session load
 */
export function initUserSocket(userId: string) {
  const s = getSocket();

  // join inbox room
  s.emit("join:user", userId);

  // mark user online (presence)
  s.emit("user:online", userId);
}
