import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/currentUser";
import twilio from "twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;

const client = twilio(TWILIO_ACCOUNT_SID!, TWILIO_AUTH_TOKEN!);

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { phone } = (await req.json().catch(() => ({}))) as { phone?: string };
    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
    }
    if (!TWILIO_VERIFY_SERVICE_SID) {
      return NextResponse.json({ error: "Missing TWILIO_VERIFY_SERVICE_SID" }, { status: 500 });
    }

    // Twilio sends the OTP SMS
    const v = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: phone, channel: "sms" });

    return NextResponse.json({ ok: true, sid: v.sid });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to send code: ${msg}` }, { status: 500 });
  }
}
