import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";

type ApiParams = { id: string };
type CloudImage = {
  url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
};

export async function PATCH(req: NextRequest, ctx: { params: Promise<ApiParams> }) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as { images: CloudImage[] };

    if (!Array.isArray(body.images)) {
      return NextResponse.json({ error: "images must be an array" }, { status: 400 });
    }

    await db.listing.update({
      where: { id },
      data: { images: body.images }, // saved in Listing.images (Json)
      select: { id: true },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save images" }, { status: 500 });
  }
}
