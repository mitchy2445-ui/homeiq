// src/components/AuthProvider.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export default function AuthProvider({ children }: { children: ReactNode }) {
  // You could pass a `session` prop here if you SSR it, but not needed for now.
  return <SessionProvider>{children}</SessionProvider>;
}
