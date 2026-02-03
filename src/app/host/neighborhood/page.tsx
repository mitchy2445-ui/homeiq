import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import HostStepper from "@/components/HostStepper";
import { redirect } from "next/navigation";
import type { $Enums } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NeighborhoodPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const s = await requireSession("/host/neighborhood");

  /* ----------------------------------------------------------
     Resolve listingId (single source of truth)
  ---------------------------------------------------------- */
  const listingId = searchParams.id;
  if (!listingId) redirect("/host/basics");

  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      landlordId: true,

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
    },
  });

  if (!listing) redirect("/host/basics");
  if (listing.landlordId !== s.sub) redirect("/host");

  // ✅ FIX: capture safe primitive for server actions
  const safeListingId = listing.id;

  /* ----------------------------------------------------------
     Server Actions
  ---------------------------------------------------------- */
  async function save(formData: FormData): Promise<void> {
    "use server";

    const ss = await requireSession("/host/neighborhood");
    const id = String(formData.get("listingId") || "");
    if (!id) throw new Error("Missing listing id");

    const accessibilityRaw = String(formData.get("accessibility") || "");
    const accessibility = accessibilityRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    await db.listing.update({
      where: { id },
      data: {
        neighborhoodVibe:
          (formData.get("neighborhoodVibe") || null) as
            | $Enums.NeighborhoodVibe
            | null,

        areaType:
          (formData.get("areaType") || null) as
            | $Enums.AreaType
            | null,

        neighborhoodCommunity: strOrNull(formData.get("neighborhoodCommunity")),
        neighborhoodSafety: strOrNull(formData.get("neighborhoodSafety")),
        neighborhoodWalkability: strOrNull(
          formData.get("neighborhoodWalkability")
        ),
        neighborhoodNoise: strOrNull(formData.get("neighborhoodNoise")),
        neighborhoodTransitNotes: strOrNull(
          formData.get("neighborhoodTransitNotes")
        ),
        neighborhoodHighlights: strOrNull(
          formData.get("neighborhoodHighlights")
        ),

        distanceBusMeters: numOrNull(formData.get("distanceBusMeters")),
        distanceGroceryMeters: numOrNull(
          formData.get("distanceGroceryMeters")
        ),
        distanceSchoolMeters: numOrNull(formData.get("distanceSchoolMeters")),
        distanceParkMeters: numOrNull(formData.get("distanceParkMeters")),
        distancePharmacyMeters: numOrNull(
          formData.get("distancePharmacyMeters")
        ),
        distanceGymMeters: numOrNull(formData.get("distanceGymMeters")),

        accessibility,
      },
    });
  }

  async function continueNext(formData: FormData): Promise<void> {
    "use server";
    await save(formData);
    redirect(`/host/pricing?id=${safeListingId}`);
  }

  /* ----------------------------------------------------------
     Helpers
  ---------------------------------------------------------- */
  function numOrNull(v: FormDataEntryValue | null): number | null {
    if (typeof v !== "string") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function strOrNull(v: FormDataEntryValue | null): string | null {
    if (typeof v !== "string") return null;
    const s = v.trim();
    return s.length ? s : null;
  }

  const accessibility = Array.isArray(listing.accessibility)
    ? listing.accessibility
    : [];

  /* ----------------------------------------------------------
     UI
  ---------------------------------------------------------- */
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <HostStepper current="neighborhood" />

      <h1 className="mt-6 text-2xl md:text-3xl font-semibold">
        Neighborhood
      </h1>
      <p className="mt-2 text-gray-600">
        Help renters understand what it’s like to live here.
      </p>

      <form action={save} className="mt-6 space-y-6">
        <input type="hidden" name="listingId" value={safeListingId} />

        <select
          name="neighborhoodVibe"
          defaultValue={listing.neighborhoodVibe ?? ""}
          className="w-full rounded-lg border px-3 py-2"
        >
          <option value="">Select vibe…</option>
          <option value="QUIET">Quiet</option>
          <option value="MODERATE">Moderate</option>
          <option value="BUSY">Busy</option>
        </select>

        <select
          name="areaType"
          defaultValue={listing.areaType ?? ""}
          className="w-full rounded-lg border px-3 py-2"
        >
          <option value="">Select area…</option>
          <option value="URBAN">Urban</option>
          <option value="SUBURBAN">Suburban</option>
          <option value="RURAL">Rural</option>
        </select>

        <textarea
          name="neighborhoodTransitNotes"
          defaultValue={listing.neighborhoodTransitNotes ?? ""}
          placeholder="Transit access, buses, commuting"
          className="w-full rounded-lg border px-3 py-2"
        />

        <textarea
          name="neighborhoodHighlights"
          defaultValue={listing.neighborhoodHighlights ?? ""}
          placeholder="Parks, shops, gyms, restaurants"
          className="w-full rounded-lg border px-3 py-2"
        />

        <textarea
          name="neighborhoodSafety"
          defaultValue={listing.neighborhoodSafety ?? ""}
          placeholder="How safe does the neighborhood feel?"
          className="w-full rounded-lg border px-3 py-2"
        />

        <textarea
          name="neighborhoodWalkability"
          defaultValue={listing.neighborhoodWalkability ?? ""}
          placeholder="Is the area walkable?"
          className="w-full rounded-lg border px-3 py-2"
        />

        <textarea
          name="neighborhoodCommunity"
          defaultValue={listing.neighborhoodCommunity ?? ""}
          placeholder="What is the community like?"
          className="w-full rounded-lg border px-3 py-2"
        />

        <textarea
          name="neighborhoodNoise"
          defaultValue={listing.neighborhoodNoise ?? ""}
          placeholder="Noise levels during day/night"
          className="w-full rounded-lg border px-3 py-2"
        />

        <input
          name="accessibility"
          defaultValue={accessibility.join(", ")}
          placeholder="Elevator, step-free access, wide doors"
          className="w-full rounded-lg border px-3 py-2"
        />

        <div className="flex justify-between pt-4">
          <a
            href={`/host/media?id=${safeListingId}`}
            className="rounded-xl border px-4 py-2 hover:bg-gray-50"
          >
            ← Back
          </a>

          <div className="flex gap-2">
            <button className="rounded-xl border px-4 py-2">
              Save
            </button>

            <button
              formAction={continueNext}
              className="rounded-xl bg-emerald-600 text-white px-5 py-3 font-medium"
            >
              Save & Continue
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
