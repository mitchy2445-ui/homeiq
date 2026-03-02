// app/host/review/page.tsx
import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  Home,
  Building2,
  MapPin,
  DollarSign,
  Users,
  FileText,
  Shield,
  Thermometer,
  Volume2,
  Sun,
  Heart,
  Bus,
  Sparkles,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import Image from "next/image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const listingId = params.id;

  if (!listingId) redirect("/host/basics");

  const session = await requireSession("/host/review");

  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      landlordId: true,
      // Basics
      title: true,
      propertyType: true,
      street: true,
      aptUnit: true,
      city: true,
      province: true,
      postal: true,
      country: true,
      beds: true,
      baths: true,
      maxOccupants: true,
      furnished: true,
      smokingAllowed: true,
      priceCents: true,
      depositCents: true,
      availableFrom: true,
      minLeaseMonths: true,
      // Details
      description: true,
      houseRules: true,
      rulesNotes: true,
      heating: true,
      cooling: true,
      noiseLevel: true,
      naturalLight: true,
      interiorNotes: true,
      buildingAmenitiesNotes: true,
      parkingType: true,
      petPolicy: true,
      laundry: true,
      utilitiesIncluded: true,
      // Media
      images: true,
      videoUrl: true,
      // Neighborhood
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

  if (!listing || listing.landlordId !== session.sub) {
    redirect("/host/basics");
  }

  // Helpers for display
  const price = listing.priceCents ? (listing.priceCents / 100).toLocaleString() : "—";
  const deposit = listing.depositCents ? (listing.depositCents / 100).toLocaleString() : "—";
  const photos = Array.isArray(listing.images) ? (listing.images as string[]) : [];
  const accessibilityList = Array.isArray(listing.accessibility)
    ? listing.accessibility
    : [];

  const utilities = listing.utilitiesIncluded as
    | { heat?: boolean; water?: boolean; electricity?: boolean; internet?: boolean }
    | null;

  /* ---------------- Publish Action ---------------- */

  async function publishListing(formData: FormData): Promise<void> {
    "use server";

    const ss = await requireSession("/host/review");

    const id = String(formData.get("listingId") || "");
    if (!id) throw new Error("Missing listing id");

    await db.listing.update({
      where: { 
        id, 
        landlordId: ss.sub 
      },
      data: { 
        status: "PENDING" 
      },
    });

    // Redirect to homepage + show success message
    redirect("/?success=published");
  }

  return (
    <div className="min-h-screen bg-neutral-50/40">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 py-12 lg:py-16 space-y-16">
        {/* Header */}
        <header className="space-y-4 max-w-3xl">
          <div className="text-sm font-medium tracking-wide text-neutral-500 uppercase">
            Final Review
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
            Review your listing
          </h1>
          <p className="text-lg text-neutral-600">
            Make sure everything looks correct before publishing.
          </p>
        </header>

        {/* Basics Summary */}
        <section className="rounded-2xl border bg-white p-6 sm:p-8 space-y-8">
          <div className="flex items-center gap-3">
            <Home className="h-6 w-6 text-neutral-700" />
            <h2 className="text-2xl font-semibold">Basics</h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="text-sm font-medium text-neutral-500">Title</h3>
              <p className="mt-1">{listing.title || "—"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-neutral-500">Property Type</h3>
              <p className="mt-1">{listing.propertyType || "—"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-neutral-500">Bedrooms / Bathrooms</h3>
              <p className="mt-1">
                {listing.beds ?? "—"} beds • {listing.baths ?? "—"} baths
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-neutral-500">Max Occupants</h3>
              <p className="mt-1">{listing.maxOccupants ?? "—"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-neutral-500">Furnished / Smoking</h3>
              <p className="mt-1">
                {listing.furnished ? "Yes" : "No"} furnished •{" "}
                {listing.smokingAllowed ? "Smoking allowed" : "No smoking"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-neutral-500">Price</h3>
              <p className="mt-1">${price}/month</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-neutral-500">Deposit</h3>
              <p className="mt-1">${deposit}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-neutral-500">Available from</h3>
              <p className="mt-1">
                {listing.availableFrom
                  ? new Date(listing.availableFrom).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <h3 className="text-sm font-medium text-neutral-500">Address</h3>
              <p className="mt-1">
                {listing.street || "—"}
                {listing.aptUnit ? `, ${listing.aptUnit}` : ""} <br />
                {listing.city}, {listing.province} {listing.postal} <br />
                {listing.country}
              </p>
            </div>
          </div>
        </section>

        {/* Details Summary */}
        <section className="rounded-2xl border bg-white p-6 sm:p-8 space-y-8">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-neutral-700" />
            <h2 className="text-2xl font-semibold">Details & Comfort</h2>
          </div>

          <div className="space-y-10">
            <div>
              <h3 className="text-sm font-medium text-neutral-500">Description</h3>
              <p className="mt-2 whitespace-pre-wrap">{listing.description || "—"}</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <h3 className="text-sm font-medium text-neutral-500">House Rules</h3>
                <p className="mt-1 whitespace-pre-wrap">{listing.houseRules || "—"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-500">Additional Rules Notes</h3>
                <p className="mt-1 whitespace-pre-wrap">{listing.rulesNotes || "—"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-500">Heating / Cooling</h3>
                <p className="mt-1">
                  {listing.heating || "—"} / {listing.cooling || "—"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-500">Noise Level</h3>
                <p className="mt-1">{listing.noiseLevel || "—"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-500">Natural Light</h3>
                <p className="mt-1">{listing.naturalLight || "—"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-500">Parking • Pets • Laundry</h3>
                <p className="mt-1">
                  {listing.parkingType || "—"} • {listing.petPolicy || "—"} • {listing.laundry || "—"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-500">Utilities Included</h3>
                <ul className="mt-1 space-y-1">
                  {utilities &&
                    Object.entries(utilities).map(([key, val]) =>
                      val ? (
                        <li key={key} className="capitalize">
                          ✓ {key}
                        </li>
                      ) : null
                    )}
                  {!utilities || Object.values(utilities).every(v => !v) ? (
                    <li>None specified</li>
                  ) : null}
                </ul>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-neutral-500">Interior Notes</h3>
                <p className="mt-1 whitespace-pre-wrap">{listing.interiorNotes || "—"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-500">Building Amenities</h3>
                <p className="mt-1 whitespace-pre-wrap">{listing.buildingAmenitiesNotes || "—"}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Media Summary */}
        <section className="rounded-2xl border bg-white p-6 sm:p-8 space-y-8">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-6 w-6 text-neutral-700" />
            <h2 className="text-2xl font-semibold">Media</h2>
          </div>

          {photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map((url, idx) => (
                <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border">
                  <Image
                    src={url}
                    alt={`Photo ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500">No photos uploaded yet.</p>
          )}

          {listing.videoUrl && (
            <div className="pt-6 border-t">
              <h3 className="text-sm font-medium text-neutral-500 mb-3">Video</h3>
              <video
                controls
                className="w-full rounded-xl border bg-black"
                src={listing.videoUrl}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </section>

        {/* Neighborhood Summary */}
        <section className="rounded-2xl border bg-white p-6 sm:p-8 space-y-8">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-neutral-700" />
            <h2 className="text-2xl font-semibold">Neighborhood Insights</h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-neutral-500">Vibe & Area</h3>
                <p className="mt-1">
                  {listing.neighborhoodVibe || "—"} • {listing.areaType || "—"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-500">Community & Atmosphere</h3>
                <dl className="mt-2 space-y-2 text-sm">
                  <div>
                    <dt className="inline font-medium">Safety: </dt>
                    <dd className="inline">{listing.neighborhoodSafety || "—"}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium">Walkability: </dt>
                    <dd className="inline">{listing.neighborhoodWalkability || "—"}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium">Community: </dt>
                    <dd className="inline">{listing.neighborhoodCommunity || "—"}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium">Noise: </dt>
                    <dd className="inline">{listing.neighborhoodNoise || "—"}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-500">Accessibility</h3>
                <p className="mt-1">
                  {accessibilityList.length > 0 ? accessibilityList.join(", ") : "None specified"}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-neutral-500">Transit & Highlights</h3>
                <p className="mt-1 whitespace-pre-wrap">
                  {listing.neighborhoodTransitNotes || "—"}
                </p>
                <p className="mt-3 whitespace-pre-wrap">
                  {listing.neighborhoodHighlights || "—"}
                </p>
              </div>
              {(listing.distanceBusMeters ||
                listing.distanceGroceryMeters ||
                listing.distanceParkMeters) && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Approximate Distances</h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    {listing.distanceBusMeters && (
                      <li>Bus: {listing.distanceBusMeters}m</li>
                    )}
                    {listing.distanceGroceryMeters && (
                      <li>Grocery: {listing.distanceGroceryMeters}m</li>
                    )}
                    {listing.distanceSchoolMeters && (
                      <li>School: {listing.distanceSchoolMeters}m</li>
                    )}
                    {listing.distanceParkMeters && (
                      <li>Park: {listing.distanceParkMeters}m</li>
                    )}
                    {listing.distancePharmacyMeters && (
                      <li>Pharmacy: {listing.distancePharmacyMeters}m</li>
                    )}
                    {listing.distanceGymMeters && (
                      <li>Gym: {listing.distanceGymMeters}m</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Actions */}
        <footer className="pt-12 border-t flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap gap-4">
            <a
              href={`/host/basics?id=${listingId}`}
              className="rounded-xl border px-6 py-3 hover:bg-gray-50 text-sm font-medium transition"
            >
              Edit Basics
            </a>
            <a
              href={`/host/details?id=${listingId}`}
              className="rounded-xl border px-6 py-3 hover:bg-gray-50 text-sm font-medium transition"
            >
              Edit Details
            </a>
            <a
              href={`/host/media?id=${listingId}`}
              className="rounded-xl border px-6 py-3 hover:bg-gray-50 text-sm font-medium transition"
            >
              Edit Media
            </a>
            <a
              href={`/host/neighborhood?id=${listingId}`}
              className="rounded-xl border px-6 py-3 hover:bg-gray-50 text-sm font-medium transition"
            >
              Edit Neighborhood
            </a>
          </div>

          <form action={publishListing}>
            <input type="hidden" name="listingId" value={listingId} />
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 font-medium transition min-w-[200px]"
            >
              Publish Listing
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}