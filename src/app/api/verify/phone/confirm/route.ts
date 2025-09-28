import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/currentUser";
import twilio, { Twilio as TwilioClient } from "twilio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!TWILIO_ACCOUNT_SID) return NextResponse.json({ error: "Missing TWILIO_ACCOUNT_SID" }, { status: 500 });
    if (!TWILIO_AUTH_TOKEN) return NextResponse.json({ error: "Missing TWILIO_AUTH_TOKEN" }, { status: 500 });
    if (!TWILIO_VERIFY_SERVICE_SID) return NextResponse.json({ error: "Missing TWILIO_VERIFY_SERVICE_SID" }, { status: 500 });

    const { phone, code } = (await req.json().catch(() => ({}))) as { phone?: string; code?: string };
    if (!phone || !code) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    // ✅ Function call style
    const client: TwilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    const check = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phone, code });

    if (check.status !== "approved") {
      return NextResponse.json({ error: "Incorrect code" }, { status: 401 });
    }

    await db.user.update({
      where: { id: userId },
      data: { phoneVerifiedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Verification failed: ${msg}` }, { status: 500 });
  }
}
