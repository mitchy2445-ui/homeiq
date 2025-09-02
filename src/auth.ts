// src/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";
import { z } from "zod";
import type { Role } from "@prisma/client";
import type { JWT } from "next-auth/jwt";
import type { User } from "next-auth";

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type TokenWithRole = JWT & { role?: Role };
const DEFAULT_ROLE: Role = "USER";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  // Optional: helpful logs with correct signatures
  logger: {
    error(error) {
      console.error("[NextAuth error]", error);
    },
    warn(message) {
      console.warn("[NextAuth warn]", message);
    },
    debug(message, ...meta) {
      console.debug("[NextAuth debug]", message, ...meta);
    },
  },

  session: { strategy: "jwt" },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = CredentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          role: user.role,
        } satisfies User;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as TokenWithRole).role = (user as User & { role?: Role }).role ?? DEFAULT_ROLE;
      } else {
        (token as TokenWithRole).role = (token as TokenWithRole).role ?? DEFAULT_ROLE;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.sub ?? "";
        (session.user as { role: Role }).role =
          ((token as TokenWithRole).role ?? DEFAULT_ROLE) as Role;
      }
      return session;
    },
  },
});
