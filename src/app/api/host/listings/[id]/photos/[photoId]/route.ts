// src/app/api/host/listings/[id]/photos/[photoId]/route.ts
import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; photoId: string } }
) {
  try {
    const s = await getSessionFromCookie();
    if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const listingId = params.id;
    const photoId = params.photoId;

    const me = await db.user.findUnique({ where: { id: s.sub }, select: { role: true } });

    const photo = await db.listingPhoto.findUnique({
      where: { id: photoId },
      select: { id: true, listingId: true },
    });
    if (!photo || photo.listingId !== listingId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const listing = await db.listing.findUnique({
      where: { id: listingId },
      select: { landlordId: true },
    });
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isAdmin = (await db.user.findUnique({ where: { id: s.sub }, select: { role: true } }))?.role === "ADMIN";
    if (!isAdmin && listing.landlordId !== s.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.listingPhoto.delete({ where: { id: photoId } });

    // Optionally, re-pack sortOrder to be 0..n-1 after deletion
    const rest = await db.listingPhoto.findMany({
      where: { listingId },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });
    await db.$transaction(
      rest.map((p, idx) =>
        db.listingPhoto.update({ where: { id: p.id }, data: { sortOrder: idx } })
      )
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
