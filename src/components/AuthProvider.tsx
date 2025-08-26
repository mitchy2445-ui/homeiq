"use client";

import { SessionProvider } from "next-auth/react";

export default function AuthProvider({
  children,
}: { children: React.ReactNode }) {
  // No props needed; it will fetch the session from /api/auth/session
  return <SessionProvider>{children}</SessionProvider>;
}
