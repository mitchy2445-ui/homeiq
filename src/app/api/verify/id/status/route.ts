import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentUserId } from "@/lib/currentUser";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const session = await stripe.identity.verificationSessions.retrieve(sessionId);

  // No DB write here; we'll update the DB from the Stripe webhook as the source of truth.
  return NextResponse.json({ status: session.status });
}
