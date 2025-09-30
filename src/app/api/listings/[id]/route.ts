import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await db.listing.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        description: true,
        houseRules: true,
      },
    });
    if (!listing) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json(listing);
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
