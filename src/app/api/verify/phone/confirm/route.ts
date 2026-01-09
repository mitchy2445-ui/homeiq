import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/currentUser";
import twilio, { Twilio as TwilioClient } from "twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;

function toE164(raw: string): string | null {
  const s = raw.trim();
  if (s.startsWith("+")) {
    const cleaned = s.replace(/[^\d+]/g, "");
    return /^\+[1-9]\d{7,14}$/.test(cleaned) ? cleaned : null;
  }
  const digits = s.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;            // NA convenience
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
      return NextResponse.json({ error: "Twilio env missing" }, { status: 500 });
    }

    const { phone, code } = (await req.json().catch(() => ({}))) as { phone?: string; code?: string };
    if (!phone || !code) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const to = toE164(phone);
    if (!to) return NextResponse.json({ error: "Phone must be E.164 (e.g., +12045551234)" }, { status: 400 });

    const client: TwilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    const check = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to, code });

    if (check.status !== "approved") {
      return NextResponse.json({ error: "Incorrect or expired code" }, { status: 401 });
    }

    await db.user.update({
      where: { id: userId },
      data: { phoneVerifiedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const anyErr = err as { code?: number; status?: number; message?: string; moreInfo?: string };
    console.error("Twilio confirm error:", anyErr);
    return NextResponse.json(
      { error: "Verification failed", message: anyErr?.message, code: anyErr?.code, moreInfo: anyErr?.moreInfo },
      { status: 502 }
    );
  }
}
