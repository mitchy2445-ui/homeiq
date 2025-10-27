// src/app/api/host/listings/[id]/photos/route.ts
import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const s = await getSessionFromCookie();
    if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const listingId = params.id;
    const me = await db.user.findUnique({ where: { id: s.sub }, select: { role: true } });

    const listing = await db.listing.findUnique({
      where: { id: listingId },
      select: { id: true, landlordId: true, photos: { select: { id: true } } },
    });
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isAdmin = me?.role === "ADMIN";
    if (!isAdmin && listing.landlordId !== s.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bodyUnknown = await req.json().catch(() => ({}));
    const body = (bodyUnknown ?? {}) as Record<string, unknown>;
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const alt = typeof body.alt === "string" ? body.alt.trim() : "";
    if (!/^https?:\/\//.test(url)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Max 30 photos
    if (listing.photos.length >= 30) {
      return NextResponse.json({ error: "Photo limit reached (30)." }, { status: 400 });
    }

    // Next sort order
    const nextOrder = listing.photos.length
      ? listing.photos.length
      : 0;

    const created = await db.listingPhoto.create({
      data: {
        listingId,
        url,
        alt: alt || null,
        sortOrder: nextOrder,
      },
      select: { id: true, url: true, alt: true, sortOrder: true },
    });

    return NextResponse.json({ photo: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
