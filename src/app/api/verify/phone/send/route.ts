import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/currentUser";
import twilio, { Twilio as TwilioClient } from "twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;

function toE164(raw: string): string | null {
  const s = raw.trim();
  // if already like +123..., strip spaces/dashes and validate
  if (s.startsWith("+")) {
    const cleaned = s.replace(/[^\d+]/g, "");
    return /^\+[1-9]\d{7,14}$/.test(cleaned) ? cleaned : null;
  }
  // remove all non-digits
  const digits = s.replace(/\D/g, "");
  // North America convenience: 10 digits -> +1xxxxxxxxxx
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  // fallback: if it looks like an international number (8–15 digits), require user to add +
  return null;
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!TWILIO_ACCOUNT_SID) return NextResponse.json({ error: "Missing TWILIO_ACCOUNT_SID" }, { status: 500 });
    if (!TWILIO_AUTH_TOKEN) return NextResponse.json({ error: "Missing TWILIO_AUTH_TOKEN" }, { status: 500 });
    if (!TWILIO_VERIFY_SERVICE_SID) return NextResponse.json({ error: "Missing TWILIO_VERIFY_SERVICE_SID" }, { status: 500 });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const raw = typeof body.phone === "string" ? body.phone : "";
    const phone = toE164(raw);

    if (!phone) {
      return NextResponse.json(
        { error: "Enter a valid phone (e.g., +12045551234). Dashes/spaces are OK." },
        { status: 400 }
      );
    }

    const client: TwilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    const v = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: phone, channel: "sms" });

    // ...same imports and helpers as before (includes toE164)

return NextResponse.json({ ok: true, sid: v.sid, status: v.status, to: phone });

  } catch (err: unknown) {
    const anyErr = err as { code?: number; status?: number; message?: string; moreInfo?: string };
    console.error("Twilio send error:", anyErr);
    return NextResponse.json(
      { error: "Failed to send code", message: anyErr?.message, code: anyErr?.code, moreInfo: anyErr?.moreInfo },
      { status: 502 }
    );
  }
}
