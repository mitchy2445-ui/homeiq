import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/currentUser";
import { Resend } from "resend";
import { SignJWT } from "jose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY || "");
const EMAIL_FROM = process.env.RESEND_FROM || "HOMEIQ <onboarding@resend.dev>";

function isEmail(x: string) {
  // simple validation; you may replace with a stricter one
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const requestedEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;

    const me = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!me?.email) return NextResponse.json({ error: "Your account has no email" }, { status: 400 });

    const email = requestedEmail ?? me.email.toLowerCase();
    if (!isEmail(email)) return NextResponse.json({ error: "Invalid email address" }, { status: 400 });

    // Create a short-lived signed token
    const key = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");
    const token = await new SignJWT({ typ: "email_verify", sub: userId, email })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("30m")
      .sign(key);

    // Store token for single-use + expiry (uses your existing VerificationToken model)
    const exp = new Date(Date.now() + 30 * 60 * 1000);
    await db.verificationToken.create({
      data: { userId, token, expires: exp },
    });

    const base = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verifyUrl = `${base}/api/verify/email/confirm?token=${encodeURIComponent(token)}`;

    // Send the email
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Verify your email for HOMEIQ",
      html: `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,sans-serif;max-width:520px;margin:0 auto;">
          <h2 style="margin:0 0 12px">Verify your email</h2>
          <p style="color:#475569;margin:0 0 16px">
            Click the button below to confirm <b>${email}</b> for your HOMEIQ account.
            This link expires in 30 minutes.
          </p>
          <p style="margin:24px 0">
            <a href="${verifyUrl}" 
              style="display:inline-block;background:#1A6E4E;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none">
              Verify email
            </a>
          </p>
          <p style="color:#64748b;font-size:12px">
            Or copy & paste this link: <br />
            <a href="${verifyUrl}">${verifyUrl}</a>
          </p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error: `Resend error: ${error.message ?? "unknown"}` }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Could not send verification: ${msg}` }, { status: 500 });
  }
}
