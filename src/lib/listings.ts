// src/lib/listings.ts
import { prisma as db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/currentUser";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { NeighborhoodVibe, AreaType } from "@prisma/client";

/* ========================================================================== */
/*                               Draft helpers                                */
/* ========================================================================== */

/**
 * Get a draft listing for the current landlord, or create one.
 * If a listingId is provided and owned by the user, it returns that instead.
 */
export async function getOrCreateDraftListing(listingId?: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");

  if (listingId) {
    const owned = await db.listing.findFirst({
      where: { id: listingId, landlordId: userId },
    });
    if (owned) return owned;
  }

  const existing = await db.listing.findFirst({
    where: { landlordId: userId, status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) return existing;

 return db.listing.create({
  data: {
    landlordId: userId,
    status: "DRAFT",
    title: "Draft listing",
    city: "TBD",
    beds: 0,
    baths: 0,

    // pricing (schema-confirmed)
    priceCents: 0,
    depositCents: 0,
    minLeaseMonths: 0,

    description: "",
    insights: {},
  },
});

}

/**
 * Fetch the current user's draft listing WITHOUT creating a new one.
 * If a listingId is supplied, it must belong to the current user.
 * Returns null if none found.
 */
export async function getMyDraft(listingId?: string) {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  if (listingId) {
    const owned = await db.listing.findFirst({
      where: { id: listingId, landlordId: userId },
    });
    return owned ?? null;
  }

  const existing = await db.listing.findFirst({
    where: { landlordId: userId, status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
  });

  return existing ?? null;
}

/* ========================================================================== */
/*                          Pricing server action                             */
/* ========================================================================== */

/**
 * Flexible server action for Pricing step.
 * Accepts:
 *  1) (formData: FormData)
 *  2) (prevState: unknown, formData: FormData)   // useFormState pattern
 *  3) (payload: Record<string, unknown>)         // manual object call
 *
 * Updates: price (cents), depositCents, minLeaseMonths
 * Redirects to next step: /landlord/new/insights
 */
export async function updateDraftListing(
  ...args:
    | [FormData]
    | [unknown, FormData]
    | [Record<string, unknown>]
) {
  "use server";

  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");

  const form = args.length === 1 ? args[0] : args[1];

  const isFormData = (v: unknown): v is FormData =>
    typeof FormData !== "undefined" && v instanceof FormData;

  const getStr = (key: string): string => {
    if (isFormData(form)) {
      const v = form.get(key);
      return v == null ? "" : String(v);
    }
    if (form && typeof form === "object") {
      const v = (form as Record<string, unknown>)[key];
      return v == null ? "" : String(v);
    }
    return "";
  };

  const getNum = (key: string): number => {
    const n = Number(getStr(key));
    return Number.isFinite(n) ? n : 0;
  };

  const listingId = getStr("listingId");
  if (!listingId) redirect("/landlord/new/basics");

  // Ownership + draft check
  const listing = await db.listing.findFirst({
    where: { id: listingId, landlordId: userId, status: "DRAFT" },
    select: { id: true },
  });
  if (!listing) redirect("/landlord/new/basics");

  // Parse fields (UI uses dollars; store cents)
  const priceDollars = getNum("price");
  const depositDollars = getNum("deposit");
  const minLeaseStr = getStr("minLeaseMonths");

  const price = Math.max(0, Math.round(priceDollars * 100)); // cents
  const depositCents = Math.max(0, Math.round(depositDollars * 100));

  const updateData: Prisma.ListingUpdateInput = {};
  if (!Number.isNaN(price)) updateData.priceCents = price;
;
  if (!Number.isNaN(depositCents)) updateData.depositCents = depositCents;
  if (minLeaseStr !== "") {
    const m = parseInt(minLeaseStr, 10);
    if (!Number.isNaN(m) && m >= 0) updateData.minLeaseMonths = m;
  }

  if (Object.keys(updateData).length > 0) {
    await db.listing.update({ where: { id: listingId }, data: updateData });
  }

  redirect(`/landlord/new/insights?listing=${listingId}`);
}

/* ========================================================================== */
/*                       Neighborhood insights action                         */
/* ========================================================================== */

/**
 * Flexible server action for Neighborhood Insights step.
 * Accepts same calling styles as updateDraftListing.
 *
 * Updates:
 *  - neighborhoodVibe (enum)
 *  - areaType (enum)
 *  - distance*Meters (ints)
 *  - optional notes into `insights` JSON
 *
 * Redirects to next step: /landlord/new/description
 */
export async function updateDraftInsights(
  ...args:
    | [FormData]
    | [unknown, FormData]
    | [Record<string, unknown>]
) {
  "use server";

  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");

  const form = args.length === 1 ? args[0] : args[1];

  const isFormData = (v: unknown): v is FormData =>
    typeof FormData !== "undefined" && v instanceof FormData;

  const getStr = (key: string): string => {
    if (isFormData(form)) {
      const v = form.get(key);
      return v == null ? "" : String(v);
    }
    if (form && typeof form === "object") {
      const v = (form as Record<string, unknown>)[key];
      return v == null ? "" : String(v);
    }
    return "";
  };

  const getInt = (key: string): number | undefined => {
    const s = getStr(key);
    if (!s) return undefined;
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : undefined;
  };

  const listingId = getStr("listingId");
  if (!listingId) redirect("/landlord/new/basics");

  // Ownership + draft check
  const listing = await db.listing.findFirst({
    where: { id: listingId, landlordId: userId, status: "DRAFT" },
    select: { id: true },
  });
  if (!listing) redirect("/landlord/new/basics");

  // Enums (validated)
  const vibeRaw = getStr("neighborhoodVibe").toUpperCase();
  const areaRaw = getStr("areaType").toUpperCase();

  const vibe: NeighborhoodVibe | undefined =
    vibeRaw === "QUIET" || vibeRaw === "MODERATE" || vibeRaw === "BUSY"
      ? (vibeRaw as NeighborhoodVibe)
      : undefined;

  const area: AreaType | undefined =
    areaRaw === "URBAN" || areaRaw === "SUBURBAN" || areaRaw === "RURAL"
      ? (areaRaw as AreaType)
      : undefined;

  // Distances
  const distanceBusMeters = getInt("distanceBusMeters");
  const distanceGroceryMeters = getInt("distanceGroceryMeters");
  const distanceSchoolMeters = getInt("distanceSchoolMeters");
  const distanceParkMeters = getInt("distanceParkMeters");
  const distancePharmacyMeters = getInt("distancePharmacyMeters");
  const distanceGymMeters = getInt("distanceGymMeters");

  // Optional JSON notes
  const vibeNotes = getStr("vibeNotes");
  const insightsJson: Record<string, unknown> = {};
  if (vibeNotes) insightsJson.vibeNotes = vibeNotes;

  const updateData: Prisma.ListingUpdateInput = {};
  if (vibe) updateData.neighborhoodVibe = vibe;
  if (area) updateData.areaType = area;

  if (typeof distanceBusMeters === "number") updateData.distanceBusMeters = distanceBusMeters;
  if (typeof distanceGroceryMeters === "number") updateData.distanceGroceryMeters = distanceGroceryMeters;
  if (typeof distanceSchoolMeters === "number") updateData.distanceSchoolMeters = distanceSchoolMeters;
  if (typeof distanceParkMeters === "number") updateData.distanceParkMeters = distanceParkMeters;
  if (typeof distancePharmacyMeters === "number") updateData.distancePharmacyMeters = distancePharmacyMeters;
  if (typeof distanceGymMeters === "number") updateData.distanceGymMeters = distanceGymMeters;

  if (Object.keys(insightsJson).length > 0) {
    updateData.insights = insightsJson as unknown as Prisma.InputJsonValue;
  }

  if (Object.keys(updateData).length > 0) {
    await db.listing.update({
      where: { id: listingId },
      data: updateData,
    });
  }

  redirect(`/landlord/new/description?listing=${listingId}`);
}

/* ========================================================================== */
/*                   Description & House Rules server action                  */
/* ========================================================================== */

export async function updateDraftDescription(
  ...args:
    | [FormData]
    | [unknown, FormData]
    | [Record<string, unknown>]
) {
  "use server";

  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login");

  const form = args.length === 1 ? args[0] : args[1];

  const isFormData = (v: unknown): v is FormData =>
    typeof FormData !== "undefined" && v instanceof FormData;

  const getStr = (key: string): string => {
    if (isFormData(form)) {
      const v = form.get(key);
      return v == null ? "" : String(v);
    }
    if (form && typeof form === "object") {
      const v = (form as Record<string, unknown>)[key];
      return v == null ? "" : String(v);
    }
    return "";
  };

  const getInt = (key: string): number | undefined => {
    const s = getStr(key);
    if (!s) return undefined;
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : undefined;
  };

  const getBool = (key: string): boolean | undefined => {
    const s = getStr(key).toLowerCase().trim();
    if (!s) return undefined; // missing/unchecked => undefined (no change)
    return s === "true" || s === "on" || s === "1" || s === "yes";
    // NOTE: if you set value="true" on checkboxes, this maps cleanly;
    // for default HTML checkboxes, browsers send "on" when checked.
  };

  const listingId = getStr("listingId");
  if (!listingId) redirect("/landlord/new/basics");

  // Ownership + draft check
  const listing = await db.listing.findFirst({
    where: { id: listingId, landlordId: userId, status: "DRAFT" },
    select: { id: true },
  });
  if (!listing) redirect("/landlord/new/basics");

  const description = getStr("description");
  const houseRules = getStr("houseRules");
  const smokingAllowed = getBool("smokingAllowed");
  const furnished = getBool("furnished");
  const maxOccupants = getInt("maxOccupants");

  const updateData: Prisma.ListingUpdateInput = {};
  if (description !== "") updateData.description = description;
  if (houseRules !== "") updateData.houseRules = houseRules;
  if (typeof smokingAllowed === "boolean") updateData.smokingAllowed = smokingAllowed;
  if (typeof furnished === "boolean") updateData.furnished = furnished;
  if (typeof maxOccupants === "number") updateData.maxOccupants = maxOccupants;

  if (Object.keys(updateData).length > 0) {
    await db.listing.update({ where: { id: listingId }, data: updateData });
  }

  // Next step in your flow (adjust if your route differs)
  redirect(`/landlord/new/review?listing=${listingId}`);
}
