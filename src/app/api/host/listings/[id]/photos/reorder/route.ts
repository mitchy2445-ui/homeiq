// src/app/api/host/listings/[id]/photos/reorder/route.ts
import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function PATCH(
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
    const photoIds = Array.isArray(body.photoIds) ? body.photoIds : [];

    if (!photoIds.length) {
      return NextResponse.json({ error: "photoIds required" }, { status: 400 });
    }

    // ensure all ids belong to this listing
    const existingIds = new Set(listing.photos.map((p) => p.id));
    for (const v of photoIds) {
      if (typeof v !== "string" || !existingIds.has(v)) {
        return NextResponse.json({ error: "Invalid photo IDs" }, { status: 400 });
      }
    }

    // Update in a transaction
    await db.$transaction(
      photoIds.map((id, idx) =>
        db.listingPhoto.update({
          where: { id },
          data: { sortOrder: idx },
        })
      )
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
