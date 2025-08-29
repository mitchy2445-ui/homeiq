import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, emailVerified: true, passwordHash: true },
  });

  await new Promise((r) => setTimeout(r, 250)); // small anti-enum delay

  if (!user?.passwordHash) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  if (!user.emailVerified) return NextResponse.json({ error: "Please verify your email first." }, { status: 403 });

  const token = await signSession({ sub: user.id, email: user.email, role: user.role });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("homeiq_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
