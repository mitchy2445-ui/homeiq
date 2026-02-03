// src/lib/socket.ts
import { Server as IOServer, type Socket } from "socket.io";
import type { Server as HTTPServer } from "http";

/* ---------- types ---------- */

type TypingPayload = {
  conversationId: string;
  isTyping: boolean;
};

/* ---------- singleton ---------- */

let io: IOServer | null = null;

/* ---------- presence store (in-memory) ---------- */
// DO NOT persist this in DB
const onlineUsers = new Set<string>();

/* ---------- init / getter ---------- */

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

      /* ----------------------------------------
         JOIN CONVERSATION ROOM
      ---------------------------------------- */
      socket.on("join", (conversationId: string) => {
        socket.join(conversationId);
      });

      /* ----------------------------------------
         JOIN USER ROOM (for inbox / unread)
      ---------------------------------------- */
      socket.on("join:user", (userId: string) => {
        socket.join(`user:${userId}`);
      });

      /* ----------------------------------------
         USER ONLINE (PRESENCE)
      ---------------------------------------- */
      socket.on("user:online", (userId: string) => {
        onlineUsers.add(userId);
        socket.data.userId = userId;

        io?.emit("user:presence", {
          userId,
          online: true,
        });
      });

      /* ----------------------------------------
         TYPING INDICATOR
      ---------------------------------------- */
      socket.on("typing", (payload: TypingPayload) => {
        socket
          .to(payload.conversationId)
          .emit("typing", { isTyping: payload.isTyping });
      });

      /* ----------------------------------------
         DISCONNECT
      ---------------------------------------- */
      socket.on("disconnect", () => {
        const userId = socket.data.userId;

        if (userId) {
          onlineUsers.delete(userId);

          io?.emit("user:presence", {
            userId,
            online: false,
          });
        }

        console.log("🔴 Socket disconnected:", socket.id);
      });
    });
  }

  return io;
}
