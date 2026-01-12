import { Server as IOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

let io: IOServer | null = null;

export function getIO(server?: HTTPServer) {
  if (!io && server) {
    io = new IOServer(server, {
      path: "/api/socket",
      cors: {
        origin: true,
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      console.log("🟢 Socket connected", socket.id);

      socket.on("join", (conversationId: string) => {
        socket.join(conversationId);
      });

      socket.on("typing", ({ conversationId, isTyping }) => {
        socket
          .to(conversationId)
          .emit("typing", { isTyping });
      });

      socket.on("disconnect", () => {
        console.log("🔴 Socket disconnected", socket.id);
      });
    });
  }

  return io;
}
