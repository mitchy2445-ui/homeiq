import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";

type Body = { title: string; description: string; houseRules?: string };

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as Body;

    if (!id) return NextResponse.json({ message: "Missing listing id" }, { status: 400 });
    if (!body.title?.trim() || !body.description?.trim()) {
      return NextResponse.json({ message: "Title and description are required" }, { status: 400 });
    }

    await db.listing.update({
      where: { id },
      data: {
        title: body.title.trim(),
        description: body.description.trim(),
        houseRules: (body.houseRules ?? "").trim(),
      },
    });

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to save description" }, { status: 500 });
  }
}
