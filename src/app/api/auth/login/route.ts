// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signSession, attachSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

type LoginBody = { email?: string; password?: string; next?: string };

function sanitizeNext(n?: string | null) {
  if (!n || typeof n !== "string") return "/";
  try {
    // Allow only same-origin relative paths
    if (n.startsWith("/") && !n.startsWith("//")) return n;
  } catch {}
  return "/";
}

export async function POST(req: Request) {
  try {
    const ct = req.headers.get("content-type") || "";
    let email = "", password = "", next = "/";

    if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      // Form POST (browser submit) → we will REDIRECT
      const form = await req.formData();
      email = String(form.get("email") ?? "").trim().toLowerCase();
      password = String(form.get("password") ?? "");
      next = sanitizeNext(String(form.get("next") ?? "/"));
    } else {
      // JSON (fetch) → we will RETURN JSON
      const body = (await req.json().catch(() => ({}))) as LoginBody;
      email = String(body.email ?? "").trim().toLowerCase();
      password = String(body.password ?? "");
      next = sanitizeNext(body.next ?? "/");
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    // tiny delay to reduce enumeration
    await new Promise((r) => setTimeout(r, 200));

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true, email: true, role: true, passwordHash: true,
        emailVerified: true, emailVerifiedAt: true,
      },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isVerified = Boolean(user.emailVerified || user.emailVerifiedAt);
    if (!isVerified) {
      return NextResponse.json({ error: "Please verify your email before logging in." }, { status: 403 });
    }

    const role = user.role ?? "USER";
    const token = await signSession({ sub: user.id, email: user.email, role });

    if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      // Form flow → set cookie + redirect (hard reload)
      const res = NextResponse.redirect(new URL(next, req.url));
      return attachSessionCookie(res, token);
    }

    // JSON (fetch) flow → set cookie + return JSON
    const res = NextResponse.json({ ok: true, role, next }, { status: 200 });
    return attachSessionCookie(res, token);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
