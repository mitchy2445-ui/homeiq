import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";

/** GET: used by Review */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    const listing = await db.listing.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        houseRules: true,
        city: true,
        price: true,   // cents
        beds: true,
        baths: true,
        insights: true,
        // Prefer real photos table if you created it
        photos: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: { id: true, url: true, alt: true, sortOrder: true },
        },
        // Legacy fallbacks
        images: true,
        videos: true,
        videoUrl: true,
      },
    });

    if (!listing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    // Normalized insights from JSON blob
    const ins = (listing.insights ?? {}) as Record<string, unknown>;
    const neighborhoodNotes = typeof ins.neighborhoodNotes === "string" ? ins.neighborhoodNotes : null;
    const transit           = typeof ins.transit           === "string" ? ins.transit           : null;
    const amenities         = typeof ins.amenities         === "string" ? ins.amenities         : null;

    // If no rows in ListingPhoto, fallback to legacy images JSON
    let photos = listing.photos;
    if (!photos || photos.length === 0) {
      const imgs = Array.isArray(listing.images) ? listing.images as Array<string | { url: string; alt?: string | null; sortOrder?: number }> : [];
      photos = imgs.map((img, i) => {
        if (typeof img === "string") return { id: `legacy-${i}`, url: img, alt: null, sortOrder: i };
        return {
          id: `legacy-${i}`,
          url: typeof img.url === "string" ? img.url : "",
          alt: typeof img.alt === "string" ? img.alt : null,
          sortOrder: typeof img.sortOrder === "number" ? img.sortOrder : i,
        };
      });
    }

    return NextResponse.json({
      ...listing,
      neighborhoodNotes,
      transit,
      amenities,
      photos,
    });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

/** PATCH: persist Basics & Pricing fields */
type PatchBody = Partial<{
  title: string;
  description: string | null;
  houseRules: string | null;
  city: string;
  price: number; // cents
  beds: number;
  baths: number;
}>;

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as PatchBody;

    const data: Record<string, unknown> = {};
    if (typeof body.title === "string") data.title = body.title.trim();
    if (typeof body.description === "string" || body.description === null) data.description = body.description ?? null;
    if (typeof body.houseRules === "string" || body.houseRules === null) data.houseRules = body.houseRules ?? null;
    if (typeof body.city === "string") data.city = body.city.trim();
    if (typeof body.price === "number") data.price = Math.max(0, Math.floor(body.price)); // keep as cents
    if (typeof body.beds === "number") data.beds = Math.max(0, Math.floor(body.beds));
    if (typeof body.baths === "number") data.baths = Math.max(0, Math.floor(body.baths));

    const updated = await db.listing.update({
      where: { id },
      data,
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: updated.id });
  } catch {
    return NextResponse.json({ message: "Failed to update" }, { status: 500 });
  }
}
