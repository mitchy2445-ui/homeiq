// src/app/api/webhooks/stripe/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma as db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature") || "";
  const raw = await req.text(); // raw body for signature verification

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, WEBHOOK_SECRET);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown signature error";
    return NextResponse.json({ error: `Invalid signature: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "identity.verification_session.verified": {
        const session = event.data.object as Stripe.Identity.VerificationSession;
        const userId =
          (session.client_reference_id as string | null) ||
          (session.metadata?.userId as string | null);
        if (!userId) break;

        // See what else is already verified
        const me = await db.user.findUnique({
          where: { id: userId },
          select: { phoneVerifiedAt: true, emailVerifiedAt: true },
        });

        const isFullyVerified = Boolean(me?.phoneVerifiedAt && me?.emailVerifiedAt);

        await db.user.update({
          where: { id: userId },
          data: {
            idCheckProvider: "stripe",
            idCheckSessionId: session.id,
            verificationStatus: isFullyVerified ? "VERIFIED" : "PENDING",
            ...(isFullyVerified ? { verifiedAt: new Date() } : {}),
          },
        });
        break;
      }

      case "identity.verification_session.requires_input": {
        const session = event.data.object as Stripe.Identity.VerificationSession;
        const userId =
          (session.client_reference_id as string | null) ||
          (session.metadata?.userId as string | null);
        if (!userId) break;

        await db.user.update({
          where: { id: userId },
          data: {
            verificationStatus: "PENDING",
            idCheckProvider: "stripe",
            idCheckSessionId: session.id,
          },
        });
        break;
      }

      case "identity.verification_session.canceled": {
        const session = event.data.object as Stripe.Identity.VerificationSession;
        const userId =
          (session.client_reference_id as string | null) ||
          (session.metadata?.userId as string | null);
        if (!userId) break;

        await db.user.update({
          where: { id: userId },
          data: {
            verificationStatus: "UNVERIFIED",
            idCheckProvider: "stripe",
            idCheckSessionId: session.id,
          },
        });
        break;
      }

      case "identity.verification_session.processing": {
        const session = event.data.object as Stripe.Identity.VerificationSession;
        const userId =
          (session.client_reference_id as string | null) ||
          (session.metadata?.userId as string | null);
        if (!userId) break;

        await db.user.update({
          where: { id: userId },
          data: {
            verificationStatus: "PENDING",
            idCheckProvider: "stripe",
            idCheckSessionId: session.id,
          },
        });
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Webhook handler error:", msg);
    return NextResponse.json({ error: "Webhook handler failure" }, { status: 500 });
  }
}
