// src/app/messages/layout.tsx
import { requireSession } from "@/lib/auth";

export const runtime = "nodejs";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🔒 Hard auth gate for ALL /messages/*
  await requireSession("/messages");

  return <>{children}</>;
}
