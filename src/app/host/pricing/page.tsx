// src/app/host/pricing/page.tsx
import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import HostStepper from "@/components/HostStepper";
import { redirect } from "next/navigation";
import type { $Enums, Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const s = await requireSession("/host/pricing");

  const listing = await db.listing.findFirst({
    where: { landlordId: s.sub },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      depositCents: true,
      parkingType: true,
      petPolicy: true,
      laundry: true,
      utilitiesIncluded: true,   // Json string[]
      smokingAllowed: true,
      minLeaseMonths: true,
      maxOccupants: true,
      furnished: true,
      heating: true,
      cooling: true,
    },
  });

  if (!listing) redirect("/host/basics");

  /* --------------------- helpers --------------------- */
  function dollarsToCents(v: FormDataEntryValue | null): number | null {
    if (typeof v !== "string" || v.trim() === "") return null;
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? Math.round(n * 100) : null;
  }
  function numOrNull(v: FormDataEntryValue | null): number | null {
    if (typeof v !== "string" || v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  function textOrNull(v: FormDataEntryValue | null): string | null {
    return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  }
  function toStringArray(csv: string): string[] {
    return csv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  function jsonToStringArray(v: unknown): string[] {
    return Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]) : [];
  }

  /* -------------------- server actions -------------------- */
  async function save(formData: FormData): Promise<void> {
    "use server";
    const ss = await requireSession("/host/pricing");
    const id = String(formData.get("listingId") || "");
    if (!id) throw new Error("Missing listing id.");

    const utilitiesCsv = String(formData.get("utilitiesIncluded") || "");
    const utilities = toStringArray(utilitiesCsv);

    await db.listing.updateMany({
      where: { id, landlordId: ss.sub },
      data: {
        depositCents: dollarsToCents(formData.get("depositDollars")),
        parkingType: (formData.get("parkingType") || null) as $Enums.ParkingType | null,
        petPolicy: (formData.get("petPolicy") || null) as $Enums.PetPolicy | null,
        laundry: (formData.get("laundry") || null) as $Enums.LaundryType | null,
        utilitiesIncluded: utilities as unknown as Prisma.JsonArray,
        smokingAllowed: Boolean(formData.get("smokingAllowed")),
        minLeaseMonths: numOrNull(formData.get("minLeaseMonths")),
        maxOccupants: numOrNull(formData.get("maxOccupants")),
        furnished: Boolean(formData.get("furnished")),
        heating: textOrNull(formData.get("heating")),
        cooling: textOrNull(formData.get("cooling")),
      },
    });
  }

  async function continueNext(formData: FormData): Promise<void> {
    "use server";
    await save(formData);
    redirect("/host/review");
  }

  /* ------------------------ UI ------------------------ */
  const utilities = jsonToStringArray(listing.utilitiesIncluded);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <HostStepper current="pricing" />
      <h1 className="mt-6 text-2xl md:text-3xl font-semibold">Pricing & Policies</h1>
      <p className="text-gray-600 mt-2">Tell renters about costs and house rules.</p>

      <form action={save} className="mt-6 space-y-6" id="pricing-form">
        <input type="hidden" name="listingId" value={listing.id} />

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Deposit (optional, $)</span>
            <input
              name="depositDollars"
              type="number"
              step="0.01"
              min="0"
              defaultValue={
                typeof listing.depositCents === "number"
                  ? (listing.depositCents / 100).toFixed(2)
                  : ""
              }
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Min lease (months)</span>
            <input
              name="minLeaseMonths"
              type="number"
              min="0"
              defaultValue={listing.minLeaseMonths ?? ""}
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Max occupants</span>
            <input
              name="maxOccupants"
              type="number"
              min="0"
              defaultValue={listing.maxOccupants ?? ""}
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Parking</span>
            <select
              name="parkingType"
              defaultValue={listing.parkingType ?? ""}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="">Select…</option>
              <option value="STREET">Street</option>
              <option value="ON_SITE">On-site</option>
              <option value="NONE">None</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Pets</span>
            <select
              name="petPolicy"
              defaultValue={listing.petPolicy ?? ""}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="">Select…</option>
              <option value="NONE">No pets</option>
              <option value="CATS">Cats</option>
              <option value="DOGS">Dogs</option>
              <option value="CATS_AND_DOGS">Cats & Dogs</option>
              <option value="RESTRICTED">Restricted</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Laundry</span>
            <select
              name="laundry"
              defaultValue={listing.laundry ?? ""}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="">Select…</option>
              <option value="IN_UNIT">In-unit</option>
              <option value="SHARED">Shared</option>
              <option value="NONE">None</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Utilities included (comma-separated)</span>
          <input
            name="utilitiesIncluded"
            placeholder="Water, Heat, Electricity, Internet"
            defaultValue={utilities.join(", ")}
            className="w-full rounded-lg border px-3 py-2"
          />
        </label>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              name="smokingAllowed"
              defaultChecked={Boolean(listing.smokingAllowed)}
              className="h-4 w-4"
            />
            <span className="text-sm">Smoking allowed</span>
          </label>

          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              name="furnished"
              defaultChecked={Boolean(listing.furnished)}
              className="h-4 w-4"
            />
            <span className="text-sm">Furnished</span>
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Heating</span>
            <input
              name="heating"
              defaultValue={listing.heating ?? ""}
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Cooling</span>
            <input
              name="cooling"
              defaultValue={listing.cooling ?? ""}
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>
        </div>

        <div className="flex justify-between">
          <a href="/host/neighborhood" className="rounded-xl border px-4 py-2 hover:bg-gray-50">
            ← Back
          </a>
          <div className="flex gap-2">
            <button form="pricing-form" type="submit" className="rounded-xl border px-4 py-2 hover:bg-gray-50">
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
