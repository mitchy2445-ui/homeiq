// src/app/host/neighborhood/page.tsx
import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import HostStepper from "@/components/HostStepper";
import { redirect } from "next/navigation";
import type { $Enums } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NeighborhoodPage() {
  const s = await requireSession("/host/neighborhood");

  // load the latest listing for this landlord
  const listing = await db.listing.findFirst({
    where: { landlordId: s.sub },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      neighborhoodVibe: true,
      areaType: true,
      distanceBusMeters: true,
      distanceGroceryMeters: true,
      distanceSchoolMeters: true,
      distanceParkMeters: true,
      distancePharmacyMeters: true,
      distanceGymMeters: true,
      accessibility: true, // Json (string[])
    },
  });

  if (!listing) redirect("/host/basics");

  // ----- server actions -----
  async function save(formData: FormData): Promise<void> {
    "use server";
    const ss = await requireSession("/host/neighborhood");
    const id = String(formData.get("listingId") || "");
    if (!id) throw new Error("Missing listing id.");

    // multi-select accessibility (comma-separated)
    const accRaw = String(formData.get("accessibility") || "");
    const accessibility = accRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    await db.listing.updateMany({
      where: { id, landlordId: ss.sub },
      data: {
        neighborhoodVibe: (formData.get("neighborhoodVibe") || null) as $Enums.NeighborhoodVibe | null,
        areaType: (formData.get("areaType") || null) as $Enums.AreaType | null,
        distanceBusMeters: numOrNull(formData.get("distanceBusMeters")),
        distanceGroceryMeters: numOrNull(formData.get("distanceGroceryMeters")),
        distanceSchoolMeters: numOrNull(formData.get("distanceSchoolMeters")),
        distanceParkMeters: numOrNull(formData.get("distanceParkMeters")),
        distancePharmacyMeters: numOrNull(formData.get("distancePharmacyMeters")),
        distanceGymMeters: numOrNull(formData.get("distanceGymMeters")),
        accessibility, // Json string[]
      },
    });
  }

  async function continueNext(formData: FormData): Promise<void> {
    "use server";
    await save(formData);
    redirect("/host/pricing");
  }

  // ----- helpers -----
  function jsonToStringArray(v: unknown): string[] {
    return Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]) : [];
  }

  function numOrNull(v: FormDataEntryValue | null): number | null {
    if (typeof v !== "string") return null;
    const n = Number(v);
    return Number.isFinite(n) && n !== 0 ? n : null;
  }

  const acc = jsonToStringArray(listing.accessibility);

  // Build typed inputs (no `any` indexing)
  const distanceInputs = [
    { name: "distanceBusMeters", label: "Bus stop distance (m)", value: listing.distanceBusMeters },
    { name: "distanceGroceryMeters", label: "Grocery distance (m)", value: listing.distanceGroceryMeters },
    { name: "distanceSchoolMeters", label: "School distance (m)", value: listing.distanceSchoolMeters },
    { name: "distanceParkMeters", label: "Park distance (m)", value: listing.distanceParkMeters },
    { name: "distancePharmacyMeters", label: "Pharmacy distance (m)", value: listing.distancePharmacyMeters },
    { name: "distanceGymMeters", label: "Gym distance (m)", value: listing.distanceGymMeters },
  ] as const;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <HostStepper current="neighborhood" />
      <h1 className="mt-6 text-2xl md:text-3xl font-semibold">Neighborhood</h1>
      <p className="text-gray-600 mt-2">Tell renters about the area and accessibility.</p>

      <form action={save} className="mt-6 space-y-6" id="neighborhood-form">
        <input type="hidden" name="listingId" value={listing.id} />

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Neighborhood vibe</span>
          <select
            name="neighborhoodVibe"
            defaultValue={listing.neighborhoodVibe ?? ""}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="">Select…</option>
            <option value="QUIET">Quiet</option>
            <option value="MODERATE">Moderate</option>
            <option value="BUSY">Busy</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Area type</span>
          <select
            name="areaType"
            defaultValue={listing.areaType ?? ""}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="">Select…</option>
            <option value="URBAN">Urban</option>
            <option value="SUBURBAN">Suburban</option>
            <option value="RURAL">Rural</option>
          </select>
        </label>

        <div className="grid sm:grid-cols-2 gap-4">
          {distanceInputs.map((f) => (
            <label key={f.name} className="block">
              <span className="mb-1 block text-sm font-medium">{f.label}</span>
              <input
                name={f.name}
                type="number"
                defaultValue={f.value ?? ""}
                className="w-full rounded-lg border px-3 py-2"
              />
            </label>
          ))}
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Accessibility (comma-separated)</span>
          <input
            name="accessibility"
            placeholder="Elevator, Wheelchair ramp, Wide doorways"
            defaultValue={acc.join(", ")}
            className="w-full rounded-lg border px-3 py-2"
          />
        </label>

        <div className="flex justify-between">
          <a href="/host/media" className="rounded-xl border px-4 py-2 hover:bg-gray-50">← Back</a>
          <div className="flex gap-2">
            <button form="neighborhood-form" type="submit" className="rounded-xl border px-4 py-2 hover:bg-gray-50">
              Save
            </button>
            <button formAction={continueNext} type="submit" className="rounded-xl bg-brand-600 text-white px-5 py-3 font-medium hover:opacity-95">
              Save & Continue
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
