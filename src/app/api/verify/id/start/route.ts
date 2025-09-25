// src/app/api/verify/id/start/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma as db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {});

export async function POST() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" }, { status: 500 });
    }
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_APP_URL" }, { status: 500 });
    }

    const me = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      options: {
        document: { require_live_capture: true, require_matching_selfie: true },
      },
      client_reference_id: userId,
      metadata: { userId },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/landlord/verify?identity=return`,
    });

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
      email: me?.email ?? null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Always return JSON, never an empty body
    return NextResponse.json({ error: `Stripe session error: ${msg}` }, { status: 500 });
  }
}
