// src/auth.ts
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { $Enums } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            role: true,
          },
        });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // object returned here becomes `user` in jwt() on first sign-in
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // At sign-in, copy id/role from `user` into the token
      if (user) {
        const u = user as { id: string; role?: $Enums.Role };
        token.userId = u.id;
        if (u.role) token.role = u.role;
      }

      // On subsequent requests, hydrate from DB if needed
      if (token.email && (!token.userId || !token.role)) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role;
        }
      }

      return token as JWT;
    },

    async session({ session, token }) {
      if (session.user) {
        const t = token as JWT & { userId?: string; role?: $Enums.Role };
        session.user.id = t.userId ?? "";
        if (t.role) session.user.role = t.role;
      }
      return session;
    },
  },

  // where your login page lives
  pages: {
    signIn: "/auth/login",
  },
};

// Helper for server components/actions
export const getServerAuth = () => getServerSession(authOptions);
