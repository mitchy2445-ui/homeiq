import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";

export const runtime = "nodejs";

/* ----------------------------------------------------------
   Utility types
---------------------------------------------------------- */
type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [k: string]: Json };

/* ----------------------------------------------------------
   Helpers
---------------------------------------------------------- */
function toNullableEnum<T extends string>(
  v: unknown,
  allowed: readonly T[]
): T | null {
  if (v == null || v === "") return null;
  const s = String(v) as T;
  return allowed.includes(s) ? s : null;
}

function toNullableTrimmed(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function toNullableInt(
  v: unknown,
  { min, max }: { min: number; max: number }
): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const t = Math.trunc(n);
  if (t < min) return min;
  if (t > max) return max;
  return t;
}

function isJson(x: unknown): x is Json {
  if (x == null) return true;
  if (["string", "number", "boolean"].includes(typeof x)) return true;
  if (Array.isArray(x)) return x.every(isJson);
  if (typeof x === "object")
    return Object.values(x as Record<string, unknown>).every(isJson);
  return false;
}

/* ----------------------------------------------------------
   GET
---------------------------------------------------------- */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromCookie();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const listing = await db.listing.findUnique({
    where: { id },
    select: {
      id: true,
      landlordId: true,
      status: true,

      // basics
      title: true,
      description: true,
      houseRules: true,
      street: true,
      aptUnit: true, // <-- FIXED (previously missing)
      city: true,
      province: true,
      postal: true,
      price: true,
      beds: true,
      baths: true,

      propertyType: true,
      availableFrom: true,
      depositCents: true,
      utilitiesIncluded: true,
      maxOccupants: true,
      minLeaseMonths: true,
      furnished: true,

      preferredTenantType: true,
      idealRenterSummary: true,
      petSummary: true,
      parkingSummary: true,
      laundrySummary: true,

      // enums
      laundry: true,
      parkingType: true,
      petPolicy: true,
      neighborhoodVibe: true,
      areaType: true,
      smokingAllowed: true,
      heating: true,
      cooling: true,
      accessibility: true,

      // notes
      noiseLevel: true,
      naturalLight: true,
      interiorNotes: true,
      buildingAmenitiesNotes: true,
      rulesNotes: true,

      // proximities
      distanceBusMeters: true,
      distanceGroceryMeters: true,
      distanceSchoolMeters: true,
      distanceParkMeters: true,
      distancePharmacyMeters: true,
      distanceGymMeters: true,

      distanceRestaurantsMeters: true,
      distanceShoppingMeters: true,
      distanceUniversityMeters: true,
      distanceNightlifeMeters: true,

      // insights
      neighborhoodSafety: true,
      neighborhoodWalkability: true,
      neighborhoodCommunity: true,
      neighborhoodNoise: true,
      neighborhoodHighlights: true,
      neighborhoodTransitNotes: true,

      // media
      videoUrl: true,
      images: true,

      photos: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, url: true, alt: true, sortOrder: true },
      },
    },
  });

  if (!listing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const me = await db.user.findUnique({
    where: { id: session.sub },
    select: { role: true },
  });

  const isAdmin = me?.role === "ADMIN";
  if (!isAdmin && listing.landlordId !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // fallback for legacy images
  let photos = listing.photos;

  if ((!photos || photos.length === 0) && Array.isArray(listing.images)) {
    const urls = listing.images.filter(
      (v): v is string => typeof v === "string"
    );

    photos = urls.map((url, index) => ({
      id: `legacy-${index}`,
      url,
      alt: null,
      sortOrder: index,
    }));
  }

 const { images: _legacy, photos: _oldPhotos, ...rest } = listing;

return NextResponse.json({
  ...rest,

  // ✅ ADAPTER — DOES NOT TOUCH DB OR PATCH
  neighborhoodInsights: {
    overview: rest.neighborhoodHighlights,
    notes: rest.neighborhoodCommunity,
    transit: rest.neighborhoodTransitNotes,
    amenities: rest.neighborhoodWalkability,
  },

  photos,
});

}

/* ----------------------------------------------------------
   PATCH — UPDATED WITH SUMMARY FIXES + APTUNIT
---------------------------------------------------------- */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const listing = await db.listing.findUnique({
      where: { id },
      select: { landlordId: true },
    });

    if (!listing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const me = await db.user.findUnique({
      where: { id: session.sub },
      select: { role: true },
    });

    const isAdmin = me?.role === "ADMIN";
    if (!isAdmin && listing.landlordId !== session.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const raw = await req.json().catch(() => ({}));
    const body = raw as Record<string, unknown>;

    const data: Record<string, unknown> = {};

    /* ---------------------------- Strings ---------------------------- */
   const stringFields = [
  "title",
  "description",
  "houseRules",
  "street",
  "aptUnit",
  "city",
  "province",
  "postal",
  "propertyType",

  // comfort & environment
  "heating",
  "cooling",
  "noiseLevel",
  "naturalLight",

  // interior / building
  "interiorNotes",
  "buildingAmenitiesNotes",
  "rulesNotes",

  // neighborhood insights (THIS IS THE FIX)
  "neighborhoodNotes",
  "transit",
  "amenities",

  // structured neighborhood fields
  "neighborhoodSafety",
  "neighborhoodWalkability",
  "neighborhoodCommunity",
  "neighborhoodNoise",
  "neighborhoodHighlights",
  "neighborhoodTransitNotes",

  "videoUrl",
  "preferredTenantType",
] as const;

    for (const key of stringFields) {
      if (key in body) data[key] = toNullableTrimmed(body[key]);
    }

    /* ---------------------------- Enums ---------------------------- */
    const petPolicy = toNullableEnum(body.petPolicy, [
      "NONE",
      "CATS",
      "DOGS",
      "CATS_AND_DOGS",
      "RESTRICTED",
    ]);

    const parkingType = toNullableEnum(body.parkingType, [
      "STREET",
      "ON_SITE",
      "NONE",
    ]);

    const laundry = toNullableEnum(body.laundry, [
      "IN_UNIT",
      "SHARED",
      "NONE",
    ]);

    data.petPolicy = petPolicy;
    data.parkingType = parkingType;
    data.laundry = laundry;

    /* ---------------------------- Generate Summaries ---------------------------- */

    if ("preferredTenantType" in body) {
      const v = toNullableTrimmed(body.preferredTenantType);
      data.idealRenterSummary = v
        ? `Ideal for ${v.toLowerCase()}.`
        : "Open to all qualified renters.";
    }

    if ("petPolicy" in body) {
      data.petSummary =
        petPolicy === "NONE"
          ? "No pets allowed."
          : petPolicy === "CATS"
          ? "Cats only."
          : petPolicy === "DOGS"
          ? "Dogs only."
          : petPolicy === "CATS_AND_DOGS"
          ? "Cats and dogs OK."
          : petPolicy === "RESTRICTED"
          ? "Pets allowed with restrictions."
          : "Pet policy TBD.";
    }

    if ("parkingType" in body) {
      data.parkingSummary =
        parkingType === "STREET"
          ? "Street parking available."
          : parkingType === "ON_SITE"
          ? "On-site parking available."
          : parkingType === "NONE"
          ? "No dedicated parking."
          : "Parking TBD.";
    }

    if ("laundry" in body) {
      data.laundrySummary =
        laundry === "IN_UNIT"
          ? "In-unit washer/dryer."
          : laundry === "SHARED"
          ? "Shared laundry facilities."
          : laundry === "NONE"
          ? "No laundry on-site."
          : "Laundry TBD.";
    }

    /* ---------------------------- Numbers ---------------------------- */
    const cap = { min: 0, max: 100_000 };
    const numericFields = [
      "beds",
      "baths",
      "price",
      "maxOccupants",
      "minLeaseMonths",
      "depositCents",
      "distanceBusMeters",
      "distanceGroceryMeters",
      "distanceSchoolMeters",
      "distanceParkMeters",
      "distancePharmacyMeters",
      "distanceGymMeters",
      "distanceRestaurantsMeters",
      "distanceShoppingMeters",
      "distanceUniversityMeters",
      "distanceNightlifeMeters",
    ] as const;

    for (const key of numericFields) {
      if (key in body) data[key] = toNullableInt(body[key], cap);
    }

    /* ---------------------------- Dates ---------------------------- */
    if ("availableFrom" in body) {
      const rawDate = body.availableFrom;
      if (!rawDate) data.availableFrom = null;
      else {
        const d = new Date(String(rawDate));
        data.availableFrom = isNaN(d.getTime()) ? null : d;
      }
    }

    /* ---------------------------- JSON ---------------------------- */
    if ("utilitiesIncluded" in body) {
      data.utilitiesIncluded = isJson(body.utilitiesIncluded)
        ? body.utilitiesIncluded
        : null;
    }

    if ("accessibility" in body) {
      const v = body.accessibility;
      if (v === null) data.accessibility = null;
      else if (isJson(v)) data.accessibility = v;
      else if (typeof v === "string") data.accessibility = { notes: v };
      else
        return NextResponse.json(
          { error: "Invalid accessibility JSON" },
          { status: 400 }
        );
    }

    await db.listing.update({
      where: { id },
      data,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/host/listings/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
