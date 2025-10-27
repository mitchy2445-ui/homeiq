// src/app/landlord/new/details/page.tsx
import { redirect } from "next/navigation";
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";
import DetailsForm from "@/components/listings/DetailsForm";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

/** Match the Json type used by DetailsForm (no `any`) */
type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };

/** Safely convert Prisma.JsonValue -> Json (structurally compatible) */
function prismaToJson(v: Prisma.JsonValue | null | undefined): Json {
  if (v === null || v === undefined) return null;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;

  if (Array.isArray(v)) {
    return v.map((item) => prismaToJson(item));
  }

  // Prisma.JsonObject is Record<string, Prisma.JsonValue>
  const obj: Record<string, Json> = {};
  for (const [k, val] of Object.entries(v as Prisma.JsonObject)) {
    obj[k] = prismaToJson(val);
  }
  return obj;
}

export default async function DetailsStepPage({
  searchParams,
}: { searchParams: { id?: string } }) {
  const s = await getSessionFromCookie();
  if (!s) redirect("/auth/login?next=/landlord/new/details");

  const id = (searchParams?.id || "").trim();
  if (!id) redirect("/landlord/new/basics");

  const me = await db.user.findUnique({
    where: { id: s.sub },
    select: { role: true, verificationStatus: true, emailVerifiedAt: true },
  });

  const isAdmin = me?.role === "ADMIN";
  const emailVerified = Boolean(me?.emailVerifiedAt);
  const isVerifiedLandlord = me?.verificationStatus === "VERIFIED";

  if (!emailVerified) redirect("/auth/login?next=/landlord/new/details");
  if (!isVerifiedLandlord && !isAdmin) redirect("/landlord/verify");

  const listing = await db.listing.findUnique({
    where: { id },
    select: {
      id: true,
      landlordId: true,
      status: true,
      furnished: true,
      laundry: true,
      parkingType: true,
      petPolicy: true,
      smokingAllowed: true,
      heating: true,
      cooling: true,
      maxOccupants: true,
      minLeaseMonths: true,
      accessibility: true,          // Prisma.JsonValue | null
      neighborhoodVibe: true,
      areaType: true,
      distanceBusMeters: true,
      distanceGroceryMeters: true,
      distanceSchoolMeters: true,
      distanceParkMeters: true,
      distancePharmacyMeters: true,
      distanceGymMeters: true,
    },
  });

  if (!listing) redirect("/landlord/new/basics");
  if (!isAdmin && listing.landlordId !== s.sub) redirect("/");

  // if (listing.status !== "DRAFT" && !isAdmin) redirect("/");

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Listing details</h1>
      <p className="text-sm text-gray-600 mb-6">
        Add the details that help renters understand the property and improve search results.
      </p>

      <DetailsForm
        listingId={listing.id}
        initial={{
          furnished: listing.furnished ?? false,
          laundry: listing.laundry ?? null,
          parkingType: listing.parkingType ?? null,
          petPolicy: listing.petPolicy ?? null,
          smokingAllowed: listing.smokingAllowed ?? false,
          heating: listing.heating ?? "",
          cooling: listing.cooling ?? "",
          maxOccupants: listing.maxOccupants ?? "",
          minLeaseMonths: listing.minLeaseMonths ?? "",
          accessibility: prismaToJson(listing.accessibility), // ✅ converted to Json
          neighborhoodVibe: listing.neighborhoodVibe ?? null,
          areaType: listing.areaType ?? null,
          distanceBusMeters: listing.distanceBusMeters ?? "",
          distanceGroceryMeters: listing.distanceGroceryMeters ?? "",
          distanceSchoolMeters: listing.distanceSchoolMeters ?? "",
          distanceParkMeters: listing.distanceParkMeters ?? "",
          distancePharmacyMeters: listing.distancePharmacyMeters ?? "",
          distanceGymMeters: listing.distanceGymMeters ?? "",
        }}
      />

      <div className="mt-8 flex items-center gap-3">
        <a
          href={`/landlord/new/basics?id=${encodeURIComponent(listing.id)}`}
          className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Back
        </a>
        <a
          href={`/landlord/new/photos?id=${encodeURIComponent(listing.id)}`}
          className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Skip to Photos
        </a>
      </div>
    </main>
  );
}
