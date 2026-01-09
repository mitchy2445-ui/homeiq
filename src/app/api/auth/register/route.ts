import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";
import { buildVerifyLink } from "@/lib/appUrl";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY ?? "");

type RegisterBody = { email: string; password: string };
type RegisterOk = { ok: true; verifyLink?: string; note?: "fallback_link_returned" };
type RegisterErr = { message: string };

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json().catch(() => ({}))) as Partial<RegisterBody>;

    const emailNorm = String(email ?? "").trim().toLowerCase();
    const pwd = String(password ?? "");

    if (!emailNorm || !pwd) {
      return NextResponse.json<RegisterErr>({ message: "Email and password are required." }, { status: 400 });
    }
    if (pwd.length < 8) {
      return NextResponse.json<RegisterErr>({ message: "Password must be at least 8 characters." }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email: emailNorm }, select: { id: true } });
    if (existing) {
      return NextResponse.json<RegisterErr>({ message: "Email already in use." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(pwd, 12);

    const user = await db.user.create({
      data: { email: emailNorm, passwordHash, role: "USER" },
      select: { id: true, email: true },
    });

    // Create verification token (24h)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.verificationToken.create({ data: { userId: user.id, token, expires } });

    const verifyLink = buildVerifyLink(token);

    // Try to send via Resend (handle {error} explicitly)
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY missing — returning fallback verify link.");
      return NextResponse.json<RegisterOk>({ ok: true, verifyLink, note: "fallback_link_returned" }, { status: 200 });
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || "HOMEIQ <onboarding@resend.dev>",
      to: user.email,
      subject: "Verify your email",
      html: `<p>Welcome to HOMEIQ!</p><p>Please verify your email:</p>
             <p><a href="${verifyLink}">${verifyLink}</a></p>`,
      text: `Verify your email: ${verifyLink}`,
      replyTo: process.env.RESEND_REPLY_TO ?? "homeiq.25@gmail.com",
    });

    if (error) {
      console.error("Resend send error:", error);
      // Fallback: expose the link so you can click it in dev
      return NextResponse.json<RegisterOk>({ ok: true, verifyLink, note: "fallback_link_returned" }, { status: 200 });
    }

    // In dev, also return the link for convenience; in prod, just { ok: true }
    const body: RegisterOk = process.env.NODE_ENV !== "production" ? { ok: true, verifyLink } : { ok: true };
    return NextResponse.json<RegisterOk>(body, { status: 200 });
  } catch (e) {
    console.error("Register POST error:", e);
    return NextResponse.json<RegisterErr>({ message: "Server error" }, { status: 500 });
  }
}
