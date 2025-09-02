// src/app/api/listings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";

// ---------- helpers ----------
function toInt(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function getString(obj: unknown, key: string): string | null {
  if (!isObj(obj)) return null;
  const val = obj[key];
  return typeof val === "string" ? val : null;
}

// Try to pull a user id from various possible session shapes without using `any`
function extractUserId(session: unknown): string | null {
  if (!isObj(session)) return null;

  // { userId: "..." }
  const userId = getString(session, "userId");
  if (userId) return userId;

  // { id: "..." }
  const id = getString(session, "id");
  if (id) return id;

  // { user: { id: "..." } } or { user: { sub: "..." } }
  const user = isObj(session.user) ? (session.user as Record<string, unknown>) : null;
  if (user) {
    const uid = getString(user, "id") ?? getString(user, "sub");
    if (uid) return uid;
  }

  // { claims: { sub: "..." } }
  const claims = isObj(session.claims) ? (session.claims as Record<string, unknown>) : null;
  if (claims) {
    const sub = getString(claims, "sub");
    if (sub) return sub;
  }

  return null;
}

// ---------- route ----------
export async function POST(req: Request) {
  try {
    // Require auth; adapt to your helper's behavior
    const session = await requireSession().catch(() => null);
    const landlordId = extractUserId(session);

    if (!landlordId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const data = {
      title: String(body.title ?? "Untitled").slice(0, 140),
      city: String(body.city ?? "").slice(0, 80),
      price: toInt(body.price) ?? 0, // cents
      beds: toInt(body.beds) ?? 0,
      baths: toInt(body.baths) ?? 0,
      description: String(body.description ?? ""),
      images: asStringArray(body.images),
      amenities: asStringArray(body.amenities),               // Json? in Prisma
      videoUrl: body.videoUrl ? String(body.videoUrl) : null, // String?
      status: "APPROVED" as const,                            // flip to "PENDING" for review
      landlordId,                                             // from session
    };

    const created = await prisma.listing.create({ data });
    return NextResponse.json({ listing: created });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
