import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/db";
import { PetPolicy, ParkingType, LaundryType } from "@prisma/client";
import { getSessionFromCookie } from "@/lib/auth";

export const runtime = "nodejs";

/* ----------------------------------------------------------
   Helpers
---------------------------------------------------------- */

function toInt(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseMoneyToCents(input: string): number | null {
  const cleaned = input.replace(/[, ]+/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function stringOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

function normalizeStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter((s) => s.length > 0);
}

/* ----------------------------------------------------------
   POST — CREATE LISTING
---------------------------------------------------------- */

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookie();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const me = await db.user.findUnique({
      where: { id: session.sub },
      select: { role: true, verificationStatus: true, emailVerifiedAt: true },
    });

    const isAdmin = me?.role === "ADMIN";
    const emailVerified = Boolean(me?.emailVerifiedAt);
    const isVerifiedLandlord = me?.verificationStatus === "VERIFIED";

    if (!emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email first." },
        { status: 403 }
      );
    }

    if (!isVerifiedLandlord && !isAdmin) {
      return NextResponse.json(
        { error: "You must complete landlord verification before listing." },
        { status: 403 }
      );
    }

    const raw = await req.json().catch(() => ({}));
    const body = raw as Record<string, unknown>;

    /* -------------------- REQUIRED BASICS -------------------- */
    const title = stringOrNull(body.title);
    const description = stringOrNull(body.description);
    const propertyType = stringOrNull(body.propertyType);

    const beds = toInt(body.beds);
    const baths = toInt(body.baths);

    const priceCents =
      typeof body.monthlyPrice === "string"
        ? parseMoneyToCents(body.monthlyPrice)
        : typeof body.price === "number"
        ? Math.trunc(body.price)
        : null;

    /* -------------------- ADDRESS -------------------- */
    const street = stringOrNull(body.street);
    const aptUnit = stringOrNull(body.aptUnit);
    const city = stringOrNull(body.city);
    const province = stringOrNull(body.province);
    const postal = stringOrNull(body.postal);
    const country = "Canada";

    if (!street || !city || !province || !postal) {
      return NextResponse.json(
        { error: "Full address required." },
        { status: 400 }
      );
    }

    /* -------------------- VALIDATION -------------------- */
    if (!title || title.length < 10)
      return NextResponse.json(
        { error: "Title must be at least 10 characters." },
        { status: 400 }
      );

    if (!description || description.length < 80 || description.length > 600)
      return NextResponse.json(
        { error: "Description must be 80–600 characters." },
        { status: 400 }
      );

    if (beds == null || beds < 0)
      return NextResponse.json(
        { error: "Beds must be 0 or more." },
        { status: 400 }
      );

    if (baths == null || baths < 1)
      return NextResponse.json(
        { error: "Baths must be 1 or more." },
        { status: 400 }
      );

    if (priceCents == null || priceCents <= 0)
      return NextResponse.json(
        { error: "Monthly price must be greater than 0." },
        { status: 400 }
      );

    /* -------------------- LISTING DETAILS -------------------- */
    const noiseLevel = stringOrNull(
      body.noiseLevel ?? body.noise ?? body.noise_rating
    );

    const naturalLight = stringOrNull(
      body.naturalLight ?? body.light ?? body.lightLevel ?? body.naturalLighting
    );

    const interiorNotes = stringOrNull(body.interiorNotes);
    const buildingAmenitiesNotes = stringOrNull(
      body.buildingAmenitiesNotes
    );

    const smokingAllowed =
      typeof body.smokingAllowed === "boolean"
        ? body.smokingAllowed
        : null;

    const accessibility =
      body.accessibility && typeof body.accessibility === "object"
        ? body.accessibility
        : body.accessibility
        ? { notes: String(body.accessibility) }
        : null;

    /* -------------------- OPTIONAL -------------------- */
    const depositCents =
      typeof body.depositAmount === "string"
        ? parseMoneyToCents(body.depositAmount)
        : typeof body.depositAmount === "number"
        ? Math.trunc(body.depositAmount)
        : null;

    const maxOccupants = toInt(body.maxOccupancy);
    const minLeaseMonths = toInt(body.minLeaseMonths);

    const availableFrom =
      typeof body.availableFrom === "string" && body.availableFrom.trim()
        ? new Date(body.availableFrom)
        : null;

    /* -------------------- UTILITIES -------------------- */
    const utilitiesIncluded = normalizeStringArray(body.utilitiesIncluded);
    const utilitiesNotIncluded = normalizeStringArray(
      body.utilitiesNotIncluded
    );

    /* -------------------- ENUMS -------------------- */
    const petPolicy = stringOrNull(body.petPolicy) as PetPolicy | null;
    const parkingType = stringOrNull(
      body.parkingType
    ) as ParkingType | null;
    const laundry = stringOrNull(body.laundry) as LaundryType | null;

    /* -------------------- SUMMARIES -------------------- */
    const idealRenterSummary = body.preferredTenantType
      ? `Ideal for ${String(body.preferredTenantType).toLowerCase()}.`
      : "Open to all qualified renters.";

    const petSummary =
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

    const parkingSummary =
      parkingType === "STREET"
        ? "Street parking available."
        : parkingType === "ON_SITE"
        ? "On-site parking available."
        : parkingType === "NONE"
        ? "No dedicated parking."
        : "Parking TBD.";

    const laundrySummary =
      laundry === "IN_UNIT"
        ? "In-unit washer/dryer."
        : laundry === "SHARED"
        ? "Shared laundry facilities."
        : laundry === "NONE"
        ? "No laundry on-site."
        : "Laundry TBD.";

    /* -------------------- CREATE -------------------- */
    const created = await db.listing.create({
      data: {
        status: "DRAFT",
        landlord: { connect: { id: session.sub } },

        title,
        description,
        beds,
        baths,
        price: priceCents,
        propertyType,

        street,
        aptUnit,
        city,
        province,
        postal,
        country,

        noiseLevel,
        naturalLight,
        interiorNotes,
        buildingAmenitiesNotes,
        smokingAllowed,
        accessibility: accessibility ?? undefined,

        furnished:
          typeof body.isFurnished === "boolean" ? body.isFurnished : null,
        depositCents,
        maxOccupants,
        minLeaseMonths,
        availableFrom,

        preferredTenantType: stringOrNull(body.preferredTenantType),

        petPolicy,
        parkingType,
        laundry,

        idealRenterSummary,
        petSummary,
        parkingSummary,
        laundrySummary,

        utilitiesIncluded:
          utilitiesIncluded.length || utilitiesNotIncluded.length
            ? {
                included: utilitiesIncluded,
                notIncluded: utilitiesNotIncluded,
              }
            : undefined,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/host/listings error", err);
    return NextResponse.json(
      { error: "Could not create listing." },
      { status: 500 }
    );
  }
}
