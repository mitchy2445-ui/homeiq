import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";

export const runtime = "nodejs";

type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [k: string]: Json };

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
        title: true,
        description: true,
        houseRules: true,
        street: true,
        aptUnit: true,
        city: true,
        province: true,
        postal: true,
        country: true,
        priceCents: true,
        beds: true,
        baths: true,
        propertyType: true,
        availableFrom: true,
        depositCents: true,
        utilitiesIncluded: true,
        maxOccupants: true,
        minLeaseMonths: true,
        furnished: true,
        smokingAllowed: true,
        idealRenterSummary: true,
        petSummary: true,
        parkingSummary: true,
        laundrySummary: true,

        // Neighborhood Insights fields — all included
        neighborhoodVibe: true,
        areaType: true,
        neighborhoodCommunity: true,
        neighborhoodSafety: true,
        neighborhoodWalkability: true,
        neighborhoodNoise: true,
        neighborhoodTransitNotes: true,
        neighborhoodHighlights: true,
        distanceBusMeters: true,
        distanceGroceryMeters: true,
        distanceSchoolMeters: true,
        distanceParkMeters: true,
        distancePharmacyMeters: true,
        distanceGymMeters: true,
        accessibility: true,

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

    let photos = listing.photos ?? [];

    if (photos.length === 0 && Array.isArray(listing.images)) {
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

    const { images: _legacy, ...rest } = listing;
    void _legacy;

    return NextResponse.json({
      ...rest,
      photos,
    });
  } catch (err) {
    console.error("GET /api/host/listings/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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
    console.log("PATCH BODY:", body);

    const data: Record<string, unknown> = {};

    // String fields
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
      "heating",
      "cooling",
      "noiseLevel",
      "naturalLight",
      "interiorNotes",
      "buildingAmenitiesNotes",
      "rulesNotes",
      "neighborhoodNotes",
      "neighborhoodTransitNotes",
      "neighborhoodCommunity",
      "neighborhoodSafety",
      "neighborhoodWalkability",
      "neighborhoodNoise",
      "neighborhoodHighlights",
      "videoUrl",
    ] as const;

    for (const key of stringFields) {
      if (key in body) data[key] = toNullableTrimmed(body[key]);
    }

    // Enums
    if ("status" in body) {
      const status = toNullableEnum(body.status, [
        "DRAFT",
        "PENDING",
        "ACTIVE",
        "PAUSED",
        "INACTIVE",
      ]);
      if (status) data.status = status;
    }

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

    const neighborhoodVibe = toNullableEnum(body.neighborhoodVibe, [
      "QUIET",
      "MODERATE",
      "BUSY",
    ]);

    const areaType = toNullableEnum(body.areaType, [
      "URBAN",
      "SUBURBAN",
      "RURAL",
    ]);

    if ("petPolicy" in body) data.petPolicy = petPolicy;
    if ("parkingType" in body) data.parkingType = parkingType;
    if ("laundry" in body) data.laundry = laundry;
    if ("neighborhoodVibe" in body) data.neighborhoodVibe = neighborhoodVibe;
    if ("areaType" in body) data.areaType = areaType;

    // Numbers
    const cap = { min: 0, max: 100_000 };
    const numericFields = [
      "beds",
      "baths",
      "maxOccupants",
      "minLeaseMonths",
      "depositCents",
      "distanceBusMeters",
      "distanceGroceryMeters",
      "distanceSchoolMeters",
      "distanceParkMeters",
      "distancePharmacyMeters",
      "distanceGymMeters",
    ] as const;

    for (const key of numericFields) {
      if (key in body) data[key] = toNullableInt(body[key], cap);
    }

    if ("priceCents" in body) {
      data.priceCents = toNullableInt(body.priceCents, { min: 0, max: 10_000_000 });
    }

    // Booleans
    if ("furnished" in body) {
      data.furnished = body.furnished === true || body.furnished === false
        ? Boolean(body.furnished)
        : null;
    }

    if ("smokingAllowed" in body) {
      data.smokingAllowed = body.smokingAllowed === true || body.smokingAllowed === false
        ? Boolean(body.smokingAllowed)
        : null;
    }

    // Date
    if ("availableFrom" in body) {
      const rawDate = body.availableFrom;
      if (!rawDate) data.availableFrom = null;
      else {
        const d = new Date(String(rawDate));
        data.availableFrom = isNaN(d.getTime()) ? null : d;
      }
    }

    // JSON fields
    if ("utilitiesIncluded" in body) {
      data.utilitiesIncluded = isJson(body.utilitiesIncluded)
        ? body.utilitiesIncluded
        : null;
    }

    if ("accessibility" in body) {
      const v = body.accessibility;
      if (v === null) data.accessibility = null;
      else if (isJson(v)) data.accessibility = v;
      else if (typeof v === "string") data.accessibility = v.split(",").map(s => s.trim()).filter(Boolean);
      else
        return NextResponse.json(
          { error: "Invalid accessibility format" },
          { status: 400 }
        );
    }

    // Summary fields
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

    // Apply update
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