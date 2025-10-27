// src/app/api/host/listings/route.ts
import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";

export const runtime = "nodejs";

// NOTE: Listing.price is required in your schema (Int). For a draft,
// we'll set it to 0 and update on the Pricing step.
export async function POST(req: Request) {
  try {
    const s = await getSessionFromCookie();
    if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as Partial<{
      title: string;
      city: string;
      beds: number;
      baths: number;
      propertyType: string | null;
      description: string;
    }>;

    const title = (body.title ?? "").trim();
    const city = (body.city ?? "").trim();
    const beds = Number(body.beds);
    const baths = Number(body.baths);
    const propertyType = (body.propertyType ?? "") || null;
    const description = (body.description ?? "").trim();

    // Server validation (mirror client, slightly stricter)
    if (!title || title.length < 10 || title.length > 80) {
      return NextResponse.json({ error: "Title must be 10–80 characters." }, { status: 400 });
    }
    if (!city) {
      return NextResponse.json({ error: "City is required." }, { status: 400 });
    }
    if (!Number.isFinite(beds) || beds < 0) {
      return NextResponse.json({ error: "Beds must be 0 or more." }, { status: 400 });
    }
    if (!Number.isFinite(baths) || baths < 1) {
      return NextResponse.json({ error: "Baths must be 1 or more." }, { status: 400 });
    }
    if (description.length < 80 || description.length > 600) {
      return NextResponse.json({ error: "Description must be 80–600 characters." }, { status: 400 });
    }

    const listing = await db.listing.create({
      data: {
        landlordId: s.sub,
        title,
        city,
        beds,
        baths,
        propertyType,
        description,
        status: "DRAFT",
        price: 0, // placeholder; real value set on Pricing step
      },
      select: { id: true },
    });

    return NextResponse.json({ id: listing.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
