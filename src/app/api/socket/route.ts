import { NextResponse } from "next/server";
import { getIO } from "@/lib/socket";
import type { Server as HTTPServer } from "http";

export const runtime = "nodejs";

// Extend global safely (no `any`)
declare global {
  // eslint-disable-next-line no-var
  var _httpServer: HTTPServer | undefined;
}

export async function GET() {
  if (global._httpServer) {
    getIO(global._httpServer);
  }

  return NextResponse.json({ ok: true });
}
