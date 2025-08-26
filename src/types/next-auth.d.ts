// src/types/next-auth.d.ts
import type { DefaultSession } from "next-auth";
import type { $Enums } from "@prisma/client";

// Augment NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: $Enums.Role;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: $Enums.Role;
    email: string;
    name: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: $Enums.Role;
  }
}
