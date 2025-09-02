// src/app/host/review/page.tsx
import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import HostStepper from "@/components/HostStepper";
import { redirect } from "next/navigation";
import type { $Enums } from "@prisma/client";
import Image from "next/image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const s = await requireSession("/host/review");

  const listing = await db.listing.findFirst({
    where: { landlordId: s.sub },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      status: true,
      title: true,
      city: true,
      price: true, // cents
      beds: true,
      baths: true,
      description: true,
      images: true, // Json string[]
      videoUrl: true,
      parkingType: true,
      petPolicy: true,
      laundry: true,
      utilitiesIncluded: true, // Json string[]
      furnished: true,
      heating: true,
      cooling: true,
      neighborhoodVibe: true,
      areaType: true,
    },
  });

  if (!listing) redirect("/host/basics");
  const li = listing; // non-null from here on

  /* ---------------- helpers ---------------- */
  function jsonStrArr(v: unknown): string[] {
    return Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]) : [];
  }
  function centsToDollars(cents?: number | null): string {
    if (typeof cents !== "number") return "";
    return `$${(cents / 100).toFixed(0)}`;
  }
  function issues(l: typeof li): string[] {
    const errs: string[] = [];
    if (!l.title?.trim()) errs.push("Title is required.");
    if (!l.city?.trim()) errs.push("City is required.");
    if (typeof l.price !== "number" || l.price <= 0) errs.push("Monthly price is required.");
    if (typeof l.beds !== "number") errs.push("Beds is required.");
    if (typeof l.baths !== "number") errs.push("Baths is required.");
    if (jsonStrArr(l.images).length === 0) errs.push("At least one photo is required.");
    return errs;
  }
  const problems = issues(li);

  /* -------------- actions -------------- */
  async function submitForReview(formData: FormData): Promise<void> {
    "use server";
    const ss = await requireSession("/host/review");
    const id = String(formData.get("listingId") || "");
    if (!id) throw new Error("Missing listing id.");

    // Re-validate on server
    const l = await db.listing.findFirst({
      where: { id, landlordId: ss.sub },
      select: {
        id: true,
        title: true,
        city: true,
        price: true,
        beds: true,
        baths: true,
        images: true,
      },
    });
    if (!l) throw new Error("Listing not found.");

    const imgs = jsonStrArr(l.images);
    const errs: string[] = [];
    if (!l.title?.trim()) errs.push("Title");
    if (!l.city?.trim()) errs.push("City");
    if (typeof l.price !== "number" || l.price <= 0) errs.push("Price");
    if (typeof l.beds !== "number") errs.push("Beds");
    if (typeof l.baths !== "number") errs.push("Baths");
    if (imgs.length === 0) errs.push("Photos");
    if (errs.length) throw new Error(`Please complete: ${errs.join(", ")}.`);

    await db.listing.updateMany({
      where: { id, landlordId: ss.sub },
      data: { status: "PENDING" as $Enums.Status },
    });

    redirect("/host/review");
  }

  /* -------------- UI -------------- */
  const photos = jsonStrArr(li.images);
  const cover = photos[0] ?? "/placeholder.svg";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <HostStepper current="review" />
      <h1 className="mt-6 text-2xl md:text-3xl font-semibold">Review & Publish</h1>
      <p className="text-gray-600 mt-2">Double-check details, then submit for review.</p>

      {/* status pill */}
      <div className="mt-4">
        <span
          className={[
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
            li.status === "APPROVED"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : li.status === "PENDING"
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : li.status === "REJECTED"
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : "bg-gray-50 text-gray-700 border-gray-200",
          ].join(" ")}
        >
          Status: {li.status}
        </span>
      </div>

      {/* summary card */}
      <section className="mt-6 rounded-2xl border overflow-hidden">
        <div className="relative w-full aspect-[16/9] bg-gray-100">
          <Image src={cover} alt="Cover image" fill className="object-cover" />
        </div>
        <div className="p-4 space-y-2">
          <h2 className="text-xl font-semibold">{li.title || "Untitled listing"}</h2>
          <p className="text-gray-600">
            {li.city || "City not set"} • {li.beds} beds • {li.baths} baths •{" "}
            {centsToDollars(li.price) || "Price not set"}/mo
          </p>
          {li.description && (
            <p className="text-sm text-gray-700 leading-6 mt-2">{li.description}</p>
          )}

          <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
            <InfoRow label="Neighborhood vibe" value={li.neighborhoodVibe ?? "—"} />
            <InfoRow label="Area type" value={li.areaType ?? "—"} />
            <InfoRow label="Parking" value={li.parkingType ?? "—"} />
            <InfoRow label="Pets" value={li.petPolicy ?? "—"} />
            <InfoRow label="Laundry" value={li.laundry ?? "—"} />
            <InfoRow label="Furnished" value={li.furnished ? "Yes" : "No"} />
            <InfoRow label="Heating" value={li.heating ?? "—"} />
            <InfoRow label="Cooling" value={li.cooling ?? "—"} />
            <InfoRow
              label="Utilities included"
              value={jsonStrArr(li.utilitiesIncluded).join(", ") || "—"}
            />
            <InfoRow label="Video" value={li.videoUrl ? "Included" : "—"} />
          </div>
        </div>
      </section>

      {/* problems */}
      {problems.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-medium text-amber-800">Incomplete items</p>
          <ul className="mt-2 list-disc list-inside text-amber-800 space-y-1">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <a className="btn" href="/host/basics">Edit Basics</a>
            <a className="btn" href="/host/media">Edit Media</a>
            <a className="btn" href="/host/neighborhood">Edit Neighborhood</a>
            <a className="btn" href="/host/pricing">Edit Pricing & Policies</a>
          </div>
        </div>
      )}

      {/* submit */}
      <form action={submitForReview} className="mt-6">
        <input type="hidden" name="listingId" value={li.id} />
        <button
          type="submit"
          disabled={problems.length > 0 || li.status === "PENDING" || li.status === "APPROVED"}
          className="rounded-xl bg-brand-600 text-white px-5 py-3 font-medium hover:opacity-95 disabled:opacity-50"
        >
          {li.status === "PENDING" ? "Submitted" : "Submit for review"}
        </button>
      </form>

      <style jsx>{`
        .btn {
          display: inline-flex;
          align-items: center;
          border-radius: 0.75rem;
          border: 1px solid rgb(209 213 219);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: rgb(17 24 39);
        }
        .btn:hover {
          background: rgb(249 250 251);
        }
      `}</style>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}
