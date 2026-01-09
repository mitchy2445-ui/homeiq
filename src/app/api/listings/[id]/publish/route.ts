import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/currentUser";

type ApiParams = { id: string };

export async function POST(_req: Request, ctx: { params: Promise<ApiParams> }) {
  try {
    const { id } = await ctx.params;

    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Load the listing and the data we need to validate publishing.
    const l = await db.listing.findUnique({
      where: { id },
      select: {
        id: true,
        landlordId: true,
        title: true,
        city: true,
        beds: true,
        baths: true,
        price: true,          // cents
        images: true,         // JSON array (your uploader saves here)
        photos: { select: { id: true } }, // relation (if you also use it)
        status: true,
      },
    });

    if (!l) return NextResponse.json({ message: "Not found" }, { status: 404 });
    if (l.landlordId !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Validate required fields
    const errors: string[] = [];
    if (!l.title?.trim()) errors.push("Title is required.");
    if (!l.city?.trim()) errors.push("City is required.");
    if (!l.beds || l.beds <= 0) errors.push("Beds must be greater than 0.");
    if (!l.baths || l.baths <= 0) errors.push("Baths must be greater than 0.");
    if (!l.price || l.price <= 0) errors.push("Monthly price must be greater than 0.");

    const hasJsonImages = Array.isArray(l.images) && l.images.length > 0;
    const hasRelPhotos = Array.isArray(l.photos) && l.photos.length > 0;
    if (!hasJsonImages && !hasRelPhotos) errors.push("At least one photo is required.");

    if (errors.length) {
      return NextResponse.json(
        { message: "Cannot publish.", errors },
        { status: 400 }
      );
    }

    const updated = await db.listing.update({
      where: { id },
      data: { status: "PENDING" }, // or "APPROVED" if you auto-approve
      select: { id: true, status: true },
    });

    return NextResponse.json({ ok: true, id: updated.id, status: updated.status });
  } catch (e) {
    console.error("Publish error:", e);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
