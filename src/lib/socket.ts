// src/lib/socket.ts
import { Server as IOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import type { Socket } from "socket.io";

type TypingPayload = {
  conversationId: string;
  isTyping: boolean;
};

let io: IOServer | null = null;

export function getIO(server?: HTTPServer): IOServer | null {
  if (!io && server) {
    io = new IOServer(server, {
      path: "/api/socket",
      cors: {
        origin: true,
        credentials: true,
      },
    });

    io.on("connection", (socket: Socket) => {
      console.log("🟢 Socket connected:", socket.id);

      /* -------- join conversation room -------- */
      socket.on("join", (conversationId: string) => {
        socket.join(conversationId);
      });

      /* -------- join user room (for inbox updates) -------- */
      socket.on("join:user", (userId: string) => {
        socket.join(`user:${userId}`);
      });

      /* -------- typing indicator -------- */
      socket.on("typing", (payload: TypingPayload) => {
        const { conversationId, isTyping } = payload;

        socket
          .to(conversationId)
          .emit("typing", { isTyping });
      });

      /* -------- cleanup -------- */
      socket.on("disconnect", () => {
        console.log("🔴 Socket disconnected:", socket.id);
      });
    });
  }

  return io;
}
