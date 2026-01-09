import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * GET – fetch user's favorites (with listing + photos)
 */
export async function GET() {
  const session = await getSessionFromCookie();

  if (!session) {
    // Return empty array so UI doesn't crash
    return NextResponse.json([], { status: 401 });
  }

  const favorites = await db.favorite.findMany({
    where: { userId: session.sub },
    include: {
      listing: {
        include: {
          photos: {
            orderBy: { sortOrder: "asc" },
            take: 1, // only need first image for cards
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(favorites);
}

/**
 * POST – add listing to favorites
 */
export async function POST(req: Request) {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listingId } = await req.json();

  if (!listingId) {
    return NextResponse.json(
      { error: "listingId is required" },
      { status: 400 }
    );
  }

  const existing = await db.favorite.findFirst({
    where: {
      userId: session.sub,
      listingId,
    },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const favorite = await db.favorite.create({
    data: {
      userId: session.sub,
      listingId,
    },
  });

  return NextResponse.json(favorite);
}

/**
 * DELETE – remove listing from favorites
 */
export async function DELETE(req: Request) {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listingId } = await req.json();

  if (!listingId) {
    return NextResponse.json(
      { error: "listingId is required" },
      { status: 400 }
    );
  }

  await db.favorite.deleteMany({
    where: {
      userId: session.sub,
      listingId,
    },
  });

  return NextResponse.json({ success: true });
}
