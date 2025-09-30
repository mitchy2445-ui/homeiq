import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    const listing = await db.listing.findUnique({
      where: { id },
      select: { id: true, title: true, description: true, city: true, price: true, beds: true, baths: true },
    });
    if (!listing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const ok =
      !!listing.title &&
      !!listing.description &&
      !!listing.city &&
      typeof listing.price === "number" && listing.price > 0 &&
      typeof listing.beds === "number" &&
      typeof listing.baths === "number";

    if (!ok) {
      return NextResponse.json(
        { message: "Listing is incomplete. Please fill Basics and Pricing." },
        { status: 400 }
      );
    }

    // If you have a status enum, update it here instead of a no-op write:
    // await db.listing.update({ where: { id }, data: { status: "PUBLISHED" } });

    await db.listing.update({ where: { id }, data: { title: listing.title } }); // no-op update
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
