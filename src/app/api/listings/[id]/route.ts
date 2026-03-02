// src/app/api/listings/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";

export const runtime = "nodejs";

type ListingParams = {
  id: string;
};

type InsightsBasics = {
  neighborhoodNotes?: string;
  transit?: string;
  amenities?: string;

  basicsPreferredTenantType?: string;
  basicsPetPolicyNotes?: string;
  basicsParkingDetails?: string;
  basicsLaundryDetails?: string;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<ListingParams> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing id" },
        { status: 400 }
      );
    }

    const listing = await db.listing.findUnique({
      where: { id },
      include: {
        photos: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    const {
      images,
      insights,
      photos: prismaPhotos,
      ...rest
    } = listing;

    /* ----------------------------------------------------------
       Normalize photos (fallback to legacy images array)
    ---------------------------------------------------------- */

    const legacyImages: string[] = Array.isArray(images)
      ? images.filter((x): x is string => typeof x === "string")
      : [];

    const photos =
      prismaPhotos && prismaPhotos.length > 0
        ? prismaPhotos.map((p) => ({
            id: p.id,
            url: p.url,
            alt: p.alt,
            sortOrder: p.sortOrder,
          }))
        : legacyImages.map((url, i) => ({
            id: `legacy-${i}`,
            url,
            alt: null as string | null,
            sortOrder: i,
          }));

    /* ----------------------------------------------------------
       Extract insights (legacy fallback only)
    ---------------------------------------------------------- */

    const i: InsightsBasics =
      insights &&
      typeof insights === "object" &&
      !Array.isArray(insights)
        ? (insights as InsightsBasics)
        : {};

    // Use normalized Prisma fields first
    const neighborhoodNotes =
  rest.neighborhoodNotes ?? i.neighborhoodNotes ?? null;

const transit =
  rest.neighborhoodTransitNotes ?? i.transit ?? null;

const amenities =
  rest.neighborhoodHighlights ?? i.amenities ?? null;

    // Basics "extra" fields from legacy insights JSON
    const preferredTenantType =
      typeof i.basicsPreferredTenantType === "string"
        ? i.basicsPreferredTenantType
        : null;

    const petPolicy =
      typeof i.basicsPetPolicyNotes === "string"
        ? i.basicsPetPolicyNotes
        : null;

    const parkingDetails =
      typeof i.basicsParkingDetails === "string"
        ? i.basicsParkingDetails
        : null;

    const laundryDetails =
      typeof i.basicsLaundryDetails === "string"
        ? i.basicsLaundryDetails
        : null;

    /* ----------------------------------------------------------
       Final Response Payload
    ---------------------------------------------------------- */

    return NextResponse.json(
      {
        ...rest,

        // Normalized + fallback merged
        neighborhoodNotes,
        transit,
        amenities,

        preferredTenantType,
        petPolicy,
        parkingDetails,
        laundryDetails,

        photos,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("GET /api/listings/[id] error", e);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
