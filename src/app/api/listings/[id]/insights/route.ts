import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type Body = { neighborhoodNotes?: string; transit?: string; amenities?: string };

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    const body = (await req.json()) as Body;

    // Read existing JSON blob
    const current = await db.listing.findUnique({
      where: { id },
      select: { insights: true },
    });

    const prev = (current?.insights ?? {}) as Prisma.JsonObject;

    // Merge / upsert the three fields
    const merged: Prisma.JsonObject = {
      ...prev,
      neighborhoodNotes: (body.neighborhoodNotes ?? "").trim(),
      transit: (body.transit ?? "").trim(),
      amenities: (body.amenities ?? "").trim(),
    };

    await db.listing.update({
      where: { id },
      data: { insights: merged },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to save insights" }, { status: 500 });
  }
}
