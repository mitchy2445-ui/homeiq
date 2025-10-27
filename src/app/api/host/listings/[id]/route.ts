// src/app/api/host/listings/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";

export const runtime = "nodejs";

/** Strict JSON type (to avoid `any`) */
type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };

const LAUNDRY = new Set(["IN_UNIT", "SHARED", "NONE"] as const);
const PARKING = new Set(["STREET", "ON_SITE", "NONE" as const]);
const PETS = new Set(["NONE", "CATS", "DOGS", "CATS_AND_DOGS", "RESTRICTED"] as const);
const VIBE = new Set(["QUIET", "MODERATE", "BUSY"] as const);
const AREA = new Set(["URBAN", "SUBURBAN", "RURAL"] as const);

function toNullableEnum<T extends string>(v: unknown, set: Set<T>): T | null {
  if (v == null || v === "") return null;
  const s = String(v) as T;
  return set.has(s) ? s : null;
}
function toNullableBool(v: unknown): boolean | null {
  if (v == null) return null;
  return Boolean(v);
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
/** Runtime guard to check a value is our Json type */
function isJson(value: unknown): value is Json {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) return true;

  if (Array.isArray(value)) {
    return value.every(isJson);
  }

  if (typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) {
      if (!isJson(v)) return false;
    }
    return true;
  }

  return false;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const s = await getSessionFromCookie();
    if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = params.id;
    const listing = await db.listing.findUnique({
      where: { id },
      select: { id: true, landlordId: true },
    });
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Admin can edit all; landlord can edit own listing
    const me = await db.user.findUnique({ where: { id: s.sub }, select: { role: true } });
    const isAdmin = me?.role === "ADMIN";
    if (!isAdmin && listing.landlordId !== s.sub) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const bodyUnknown = await req.json().catch(() => ({}));
    const body = (bodyUnknown ?? {}) as Record<string, unknown>;

    const data: Record<string, unknown> = {};

    // Enums
    if ("laundry" in body) data.laundry = toNullableEnum(body.laundry, LAUNDRY);
    if ("parkingType" in body) data.parkingType = toNullableEnum(body.parkingType, PARKING);
    if ("petPolicy" in body) data.petPolicy = toNullableEnum(body.petPolicy, PETS);
    if ("neighborhoodVibe" in body) data.neighborhoodVibe = toNullableEnum(body.neighborhoodVibe, VIBE);
    if ("areaType" in body) data.areaType = toNullableEnum(body.areaType, AREA);

    // Booleans
    if ("furnished" in body) data.furnished = Boolean(toNullableBool(body.furnished) ?? false);
    if ("smokingAllowed" in body) data.smokingAllowed = Boolean(toNullableBool(body.smokingAllowed) ?? false);

    // Strings
    if ("heating" in body) data.heating = toNullableTrimmed(body.heating);
    if ("cooling" in body) data.cooling = toNullableTrimmed(body.cooling);

    // Ints
    if ("maxOccupants" in body) data.maxOccupants = toNullableInt(body.maxOccupants, { min: 1, max: 20 });
    if ("minLeaseMonths" in body) data.minLeaseMonths = toNullableInt(body.minLeaseMonths, { min: 1, max: 60 });

    // JSON
    if ("accessibility" in body) {
      const v = body.accessibility;
      if (v === null) data.accessibility = null;
      else if (isJson(v)) data.accessibility = v;
      else return NextResponse.json({ error: "Invalid accessibility JSON" }, { status: 400 });
    }

    // Proximity distances
    const cap = { min: 0, max: 100_000 }; // 100km cap
    if ("distanceBusMeters" in body) data.distanceBusMeters = toNullableInt(body.distanceBusMeters, cap);
    if ("distanceGroceryMeters" in body) data.distanceGroceryMeters = toNullableInt(body.distanceGroceryMeters, cap);
    if ("distanceSchoolMeters" in body) data.distanceSchoolMeters = toNullableInt(body.distanceSchoolMeters, cap);
    if ("distanceParkMeters" in body) data.distanceParkMeters = toNullableInt(body.distanceParkMeters, cap);
    if ("distancePharmacyMeters" in body) data.distancePharmacyMeters = toNullableInt(body.distancePharmacyMeters, cap);
    if ("distanceGymMeters" in body) data.distanceGymMeters = toNullableInt(body.distanceGymMeters, cap);

    await db.listing.update({ where: { id }, data });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
