// src/app/api/listings/[id]/images/route.ts
import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/currentUser";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CloudImage = {
  url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
};

function isCloudImageArray(x: unknown): x is CloudImage[] {
  return (
    Array.isArray(x) &&
    x.every(
      (i) =>
        i &&
        typeof i === "object" &&
        typeof (i as Record<string, unknown>).url === "string" &&
        typeof (i as Record<string, unknown>).public_id === "string"
    )
  );
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const listingId = params.id;
  if (!listingId) return NextResponse.json({ error: "Missing listing id" }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as { images?: unknown };
  const images: CloudImage[] = isCloudImageArray(body.images) ? body.images : [];

  // ensure listing belongs to user
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { landlordId: true },
  });
  if (!listing || listing.landlordId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.listing.update({
    where: { id: listingId },
    data: {
      // Use Prisma’s JSON type instead of `any`
      images: images as unknown as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ ok: true });
}
