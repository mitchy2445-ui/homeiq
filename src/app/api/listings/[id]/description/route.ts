import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";

type Body = {
  title: string;
  description: string;
  houseRules?: string;
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { message: "Missing listing id" },
        { status: 400 }
      );
    }

    const body = (await req.json()) as Body;

    if (!body.title?.trim() || !body.description?.trim()) {
      return NextResponse.json(
        { message: "Title and description are required" },
        { status: 400 }
      );
    }

    // Optional: authorization check that current user owns this listing

    await db.listing.update({
      where: { id },
      data: {
        title: body.title.trim(),
        description: body.description.trim(),
        houseRules: (body.houseRules ?? "").trim(),
      },
    });

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: "Failed to save description" },
      { status: 500 }
    );
  }
}
