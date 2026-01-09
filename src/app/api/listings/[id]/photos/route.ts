// src/app/api/listings/[id]/photos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";

type ApiParams = { id: string };
type CreatePhotosBody = { urls: string[]; alts?: (string | null)[] };
type PhotoDto = { id: string; url: string; alt: string | null; sortOrder: number };

async function getParams(ctx: { params: Promise<ApiParams> }): Promise<ApiParams> {
  return ctx.params;
}
function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}
function isAltArray(v: unknown): v is (string | null)[] {
  return Array.isArray(v) && v.every((x) => x === null || typeof x === "string");
}

export async function GET(_req: NextRequest, ctx: { params: Promise<ApiParams> }) {
  try {
    const { id } = await getParams(ctx);
    const photos = await db.listingPhoto.findMany({
      where: { listingId: id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, url: true, alt: true, sortOrder: true },
    });
    return NextResponse.json({ ok: true, photos });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<ApiParams> }) {
  try {
    const { id } = await getParams(ctx);
    const body = (await req.json()) as unknown;

    const urls = (body as CreatePhotosBody).urls;
    const alts = (body as CreatePhotosBody).alts;

    if (!isStringArray(urls) || urls.length === 0) {
      return NextResponse.json({ message: "Body.urls must be a non-empty string[]" }, { status: 400 });
    }
    if (typeof alts !== "undefined" && !isAltArray(alts)) {
      return NextResponse.json({ message: "Body.alts must be (string|null)[] if provided" }, { status: 400 });
    }

    const existingCount = await db.listingPhoto.count({ where: { listingId: id } });

    const rows = urls.map((url, idx) => ({
      listingId: id,
      url,
      alt: alts?.[idx] ?? null,
      sortOrder: existingCount + idx,
    }));

    // SQLite: skipDuplicates is not supported → omit it
    await db.listingPhoto.createMany({ data: rows });

    const created: PhotoDto[] = await db.listingPhoto.findMany({
      where: { listingId: id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, url: true, alt: true, sortOrder: true },
    });

    return NextResponse.json({ ok: true, photos: created }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Failed to save photos" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<ApiParams> }) {
  try {
    const { id } = await getParams(ctx);
    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get("photoId");
    if (!photoId) return NextResponse.json({ message: "Missing photoId" }, { status: 400 });

    await db.listingPhoto.delete({ where: { id: photoId } });

    const photos: PhotoDto[] = await db.listingPhoto.findMany({
      where: { listingId: id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, url: true, alt: true, sortOrder: true },
    });

    return NextResponse.json({ ok: true, photos });
  } catch {
    return NextResponse.json({ message: "Failed to delete photo" }, { status: 500 });
  }
}
