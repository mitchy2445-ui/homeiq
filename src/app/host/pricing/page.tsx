// src/app/host/pricing/page.tsx
import { getSessionFromCookie } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { redirect } from "next/navigation";
import { nextPath } from "@/lib/listingWizard";
import HostStepper from "@/components/HostStepper";
import type { ParkingType, PetPolicy, LaundryType } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const session = await getSessionFromCookie();
  if (!session) redirect("/host");

  const listingId = searchParams.id;
  if (!listingId) redirect("/host/basics");

  const listing = await db.listing.findFirst({
    where: {
      id: listingId,
      landlordId: session.sub,
      status: "DRAFT",
    },
    select: {
      id: true,
      depositCents: true,
      parkingType: true,
      petPolicy: true,
      laundry: true,
      utilitiesIncluded: true,
      smokingAllowed: true,
      minLeaseMonths: true,
      maxOccupants: true,
      furnished: true,
      heating: true,
      cooling: true,
    },
  });

  if (!listing) redirect("/host/basics");

  /* ---------------- helpers ---------------- */

  const centsToDollars = (cents: number | null) =>
    cents != null ? (cents / 100).toFixed(2) : "";

  /* ---------------- server actions ---------------- */

  async function handleSave(formData: FormData) {
    "use server";

    const session = await getSessionFromCookie();
    if (!session) throw new Error("Unauthorized");

    const id = String(formData.get("listingId") || "");
    if (!id) throw new Error("Missing listing id");

    const owned = await db.listing.findFirst({
      where: {
        id,
        landlordId: session.sub,
        status: "DRAFT",
      },
      select: { id: true },
    });

    if (!owned) throw new Error("Unauthorized");

    const depositDollars = formData.get("depositDollars")?.toString().trim();
    const depositCents =
      depositDollars && !Number.isNaN(Number(depositDollars))
        ? Math.round(Number(depositDollars) * 100)
        : null;

    const utilitiesCsv = formData.get("utilitiesIncluded")?.toString() || "";
    const utilitiesArray = utilitiesCsv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const parkingValue = formData.get("parkingType")?.toString() || null;
    const petValue = formData.get("petPolicy")?.toString() || null;
    const laundryValue = formData.get("laundry")?.toString() || null;

    await db.listing.update({
      where: { id },
      data: {
        depositCents: depositCents ?? undefined,
        parkingType: parkingValue
          ? (parkingValue as ParkingType)
          : null,
        petPolicy: petValue ? (petValue as PetPolicy) : null,
        laundry: laundryValue ? (laundryValue as LaundryType) : null,
        utilitiesIncluded: utilitiesArray.length
          ? utilitiesArray
          : undefined,
        smokingAllowed: formData.get("smokingAllowed") === "on",
        minLeaseMonths: Number(formData.get("minLeaseMonths")) || undefined,
        maxOccupants: Number(formData.get("maxOccupants")) || undefined,
        furnished: formData.get("furnished") === "on",
        heating: formData.get("heating")?.toString().trim() || undefined,
        cooling: formData.get("cooling")?.toString().trim() || undefined,
      },
    });
  }

  async function handleSaveAndContinue(formData: FormData) {
    "use server";
    await handleSave(formData);

    const id = String(formData.get("listingId") || "");
    redirect(nextPath("photos", id));
  }

  /* ---------------- UI ---------------- */

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <HostStepper current="pricing" />

      <h1 className="mt-6 text-2xl md:text-3xl font-semibold">
        Pricing & Policies
      </h1>
      <p className="text-gray-600 mt-2">
        Tell renters about costs and house rules.
      </p>

      <form action={handleSave} className="mt-6 space-y-6" id="pricing-form">
        <input type="hidden" name="listingId" value={listing.id} />

        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Deposit (optional, $)
          </span>
          <input
            name="depositDollars"
            type="number"
            step="0.01"
            min="0"
            defaultValue={centsToDollars(listing.depositCents)}
            className="w-full rounded-lg border px-3 py-2"
          />
        </label>

        <div className="flex justify-between pt-4">
          <a
            href={nextPath("neighborhood", listing.id)}
            className="rounded-xl border px-4 py-2 hover:bg-gray-50"
          >
            ← Back
          </a>
          <div className="flex gap-3">
            <button
              form="pricing-form"
              type="submit"
              className="rounded-xl border px-5 py-3 hover:bg-gray-50"
            >
              Save
            </button>
            <button
              formAction={handleSaveAndContinue}
              type="submit"
              className="rounded-xl bg-green-700 text-white px-6 py-3 font-medium hover:bg-green-800"
            >
              Save & Continue
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
