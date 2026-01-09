// src/app/landlord/new/review/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { prevPath } from "@/lib/listingWizard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

// ---------- TYPES MATCHING GET /api/host/listings/[id] ----------
type ReviewPhoto = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
};

type ReviewUtilities = {
  included: string[];
  notIncluded: string[];
};

type ReviewListing = {
  id: string;
  title: string;
  street: string;
  aptUnit: string | null;
  city: string;
  province: string;
  postal: string;
  price: number;
  beds: number;
  baths: number;
  propertyType: string | null;
  availableFrom: string | null;

  furnished: boolean | null;

  // summaries
  idealRenterSummary: string | null;
  petSummary: string | null;
  parkingSummary: string | null;
  laundrySummary: string | null;

  // utilities
  utilitiesIncluded: ReviewUtilities | null;

  // description
  description: string;

  // neighborhood insights
  neighborhoodSafety: string | null;
  neighborhoodWalkability: string | null;
  neighborhoodCommunity: string | null;
  neighborhoodNoise: string | null;
  neighborhoodHighlights: string | null;
  neighborhoodTransitNotes: string | null;

  photos: ReviewPhoto[];
};

export default function ReviewPage() {
  const router = useRouter();
  const params = useSearchParams();

  const id = params.get("id");

  const [data, setData] = React.useState<ReviewListing | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  // ---------------------- LOAD LISTING ----------------------
  React.useEffect(() => {
    if (!id) return;

    async function load() {
      const res = await fetch(`/api/host/listings/${id}`, {
        method: "GET",
        credentials: "include",
      });

      const body = await res.json();

      if (!res.ok) {
        setError(body.error || "Failed to load listing.");
      } else {
        setData(body as ReviewListing);
      }
      setLoading(false);
    }

    load();
  }, [id]);

  // ---------------------- PUBLISH LISTING ----------------------
  async function onPublish() {
    setSaving(true);

    const res = await fetch(`/api/host/listings/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PENDING" }),
    });

    const body = await res.json();
    setSaving(false);

    if (!res.ok) return setError(body.error || "Unable to publish.");

    router.replace("/landlord/listings");
  }

  if (loading)
    return (
      <main className="p-6">
        <p className="text-gray-600">Loading…</p>
      </main>
    );

  if (error || !data)
    return (
      <main className="p-6">
        <p className="text-red-600">{error || "Error loading listing."}</p>
      </main>
    );

  const listing = data;

  // ------------------------------------------------------------
  // RENDER PAGE
  // ------------------------------------------------------------
  return (
    <main className="mx-auto max-w-4xl p-6 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold mb-1">Review your listing</h1>
        <p className="text-gray-600 text-sm">
          Make sure everything looks correct before publishing.
        </p>
      </div>

      <Progress value={100} className="w-full" />

      {/* ---------------------- PHOTOS ---------------------- */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Photos</h2>

        {listing.photos.length === 0 && (
          <p className="text-gray-600 text-sm">No photos uploaded.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {listing.photos.map((p) => (
            <div
              key={p.id}
              className="relative w-full h-32 rounded overflow-hidden"
            >
              <Image
                src={p.url}
                alt={p.alt ?? ""}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------- BASIC INFO ---------------------- */}
      <section className="space-y-1">
        <h2 className="text-xl font-semibold">Basic Information</h2>

        <div className="text-sm text-gray-700 space-y-1">
          <p>
            <strong>Title:</strong> {listing.title}
          </p>
          <p>
            <strong>Address:</strong> {listing.street}
            {listing.aptUnit ? `, #${listing.aptUnit}` : ""},{" "}
            {listing.city}, {listing.province}, {listing.postal}
          </p>
          <p>
            <strong>Price:</strong> ${(listing.price / 100).toFixed(2)} /
            month
          </p>
          <p>
            <strong>Beds:</strong> {listing.beds}
          </p>
          <p>
            <strong>Baths:</strong> {listing.baths}
          </p>
          <p>
            <strong>Property Type:</strong>{" "}
            {listing.propertyType || "Not set"}
          </p>
          <p>
            <strong>Available From:</strong>{" "}
            {listing.availableFrom
              ? new Date(listing.availableFrom).toLocaleDateString()
              : "Not specified"}
          </p>
        </div>
      </section>

      {/* ---------------------- FURNISHING ---------------------- */}
      <section className="space-y-1">
        <h2 className="text-xl font-semibold">Furnishing</h2>
        <p className="text-sm text-gray-700">
          {listing.furnished === true
            ? "This unit is furnished."
            : listing.furnished === false
            ? "This unit is unfurnished."
            : "Not specified."}
        </p>
      </section>

      {/* ---------------------- SUMMARIES ---------------------- */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Summaries</h2>

        <div className="text-sm text-gray-700 space-y-1">
          <p>
            <strong>Ideal Renter: </strong>
            {listing.idealRenterSummary || "Not specified"}
          </p>
          <p>
            <strong>Pet Policy: </strong>
            {listing.petSummary || "Not specified"}
          </p>
          <p>
            <strong>Parking: </strong>
            {listing.parkingSummary || "Not specified"}
          </p>
          <p>
            <strong>Laundry: </strong>
            {listing.laundrySummary || "Not specified"}
          </p>
        </div>
      </section>

      {/* ---------------------- UTILITIES ---------------------- */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Utilities</h2>

        <div className="text-sm text-gray-700 space-y-1">
          <p>
            <strong>Included: </strong>
            {listing.utilitiesIncluded?.included?.length
              ? listing.utilitiesIncluded.included.join(", ")
              : "None"}
          </p>
          <p>
            <strong>Not Included: </strong>
            {listing.utilitiesIncluded?.notIncluded?.length
              ? listing.utilitiesIncluded.notIncluded.join(", ")
              : "None"}
          </p>
        </div>
      </section>

      {/* ---------------------- DESCRIPTION ---------------------- */}
      <section>
        <h2 className="text-xl font-semibold">Description</h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {listing.description}
        </p>
      </section>

      {/* ---------------------- NEIGHBORHOOD ---------------------- */}
      <section className="space-y-1">
        <h2 className="text-xl font-semibold">Neighborhood Insights</h2>

        <div className="text-sm text-gray-700 space-y-1">
          <p>
            <strong>Safety:</strong>{" "}
            {listing.neighborhoodSafety || "Not specified"}
          </p>
          <p>
            <strong>Walkability:</strong>{" "}
            {listing.neighborhoodWalkability || "Not specified"}
          </p>
          <p>
            <strong>Community:</strong>{" "}
            {listing.neighborhoodCommunity || "Not specified"}
          </p>
          <p>
            <strong>Noise:</strong>{" "}
            {listing.neighborhoodNoise || "Not specified"}
          </p>
          <p>
            <strong>Highlights:</strong>{" "}
            {listing.neighborhoodHighlights || "Not specified"}
          </p>
          <p>
            <strong>Transit Notes:</strong>{" "}
            {listing.neighborhoodTransitNotes || "Not specified"}
          </p>
        </div>
      </section>

      {/* ---------------------- NAVIGATION ---------------------- */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => router.push(prevPath("review", listing.id))}
        >
          Back
        </Button>

        <Button onClick={onPublish} disabled={saving}>
          {saving ? "Publishing..." : "Publish Listing"}
        </Button>
      </div>
    </main>
  );
}
