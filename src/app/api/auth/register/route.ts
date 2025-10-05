// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY ?? "");

type RegisterBody = {
  email: string;
  password: string;
};

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json().catch(() => ({}))) as Partial<RegisterBody>;

    const emailNorm = String(email ?? "").trim().toLowerCase();
    const pwd = String(password ?? "");

    if (!emailNorm || !pwd) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    // Ensure email is unique
    const existing = await db.user.findUnique({ where: { email: emailNorm }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ message: "Email already in use." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(pwd, 12);

    const user = await db.user.create({
      data: {
        email: emailNorm,
        passwordHash,
        role: "USER",
        // leave emailVerified/emailVerifiedAt null until verification
      },
      select: { id: true, email: true },
    });

    // Create verification token (24h expiry)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.verificationToken.create({
      data: { userId: user.id, token, expires },
    });

    // Build verify link using your dev base URL (HTTP in dev)
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const url = new URL("/api/auth/verify", base);
    url.searchParams.set("token", token);
    const verifyLink = url.toString();

    // Send email (Resend)
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: process.env.RESEND_FROM || "HOMEIQ <onboarding@resend.dev>",
        to: user.email,
        subject: "Verify your email",
        html: `<p>Welcome to HOMEIQ!</p><p>Please verify your email by clicking the link below:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`,
        text: `Verify your email: ${verifyLink}`,
      });
    } else {
      // In case RESEND isn’t configured during dev, return the link for manual testing
      return NextResponse.json({ ok: true, verifyLink }, { status: 200 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
