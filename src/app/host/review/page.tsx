"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { prevPath } from "@/lib/listingWizard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

/* ----------------------------------------------------------
   Types (MATCH API RESPONSE EXACTLY)
---------------------------------------------------------- */

type ReviewPhoto = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
};

type ReviewUtilities = {
  included?: string[];
  notIncluded?: string[];
};

type ReviewListing = {
  id: string;

  title: string;
  street: string;
  aptUnit: string | null;
  city: string;
  province: string;
  postal: string;

  priceCents: number;
  beds: number;
  baths: number;

  propertyType: string | null;
  availableFrom: string | null;
  furnished: boolean | null;

  description: string | null;

  idealRenterSummary: string | null;
  petSummary: string | null;
  parkingSummary: string | null;
  laundrySummary: string | null;

  utilitiesIncluded: ReviewUtilities | null;

  /* ✅ Neighborhood Insights */
  neighborhoodSafety: string | null;
  neighborhoodWalkability: string | null;
  neighborhoodCommunity: string | null;
  neighborhoodNoise: string | null;
  neighborhoodHighlights: string | null;
  neighborhoodTransitNotes: string | null;

  photos: ReviewPhoto[];
};

/* ----------------------------------------------------------
   Component
---------------------------------------------------------- */

export default function ReviewPage() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");

  const [listing, setListing] = React.useState<ReviewListing | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  /* ----------------------------------------------------------
     Load listing
  ---------------------------------------------------------- */
  React.useEffect(() => {
    if (!id) return;

    async function load() {
      const res = await fetch(`/api/host/listings/${id}`, {
        credentials: "include",
      });

      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "Failed to load listing.");
      } else {
        setListing(body as ReviewListing);
      }
      setLoading(false);
    }

    load();
  }, [id]);

  /* ----------------------------------------------------------
     Publish
  ---------------------------------------------------------- */
  async function onPublish() {
    if (!id) return;
    setSaving(true);

    const res = await fetch(`/api/host/listings/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PENDING" }),
    });

    const body = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(body.error || "Unable to publish.");
      return;
    }

    router.replace("/landlord/listings");
  }

  /* ----------------------------------------------------------
     States
  ---------------------------------------------------------- */
  if (loading) {
    return (
      <main className="p-6">
        <p className="text-gray-600">Loading…</p>
      </main>
    );
  }

  if (!listing || error) {
    return (
      <main className="p-6">
        <p className="text-red-600">{error || "Listing not found."}</p>
      </main>
    );
  }

  /* ----------------------------------------------------------
     Render
  ---------------------------------------------------------- */
  return (
    <main className="mx-auto max-w-4xl p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Review & publish</h1>
        <p className="text-sm text-gray-600">
          Confirm all details before publishing your listing.
        </p>
      </header>

      <Progress value={100} />

      {/* Photos */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Photos</h2>
        {listing.photos.length === 0 ? (
          <p className="text-sm text-gray-600">No photos uploaded.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {listing.photos.map((p) => (
              <div key={p.id} className="relative h-32 rounded overflow-hidden">
                <Image src={p.url} alt={p.alt ?? ""} fill className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Basics */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Basics</h2>
        <div className="text-sm text-gray-700 space-y-1">
          <p><strong>Title:</strong> {listing.title}</p>
          <p>
            <strong>Address:</strong>{" "}
            {listing.street}
            {listing.aptUnit ? `, #${listing.aptUnit}` : ""},{" "}
            {listing.city}, {listing.province}, {listing.postal}
          </p>
          <p><strong>Beds:</strong> {listing.beds}</p>
          <p><strong>Baths:</strong> {listing.baths}</p>
          <p>
            <strong>Monthly price:</strong>{" "}
            {listing.priceCents > 0 ? `$${(listing.priceCents / 100).toFixed(2)}` : "—"}
          </p>
        </div>
      </section>

      {/* Summaries */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Summaries</h2>
        <div className="text-sm space-y-1">
          <p><strong>Ideal renter:</strong> {listing.idealRenterSummary || "—"}</p>
          <p><strong>Pets:</strong> {listing.petSummary || "—"}</p>
          <p><strong>Parking:</strong> {listing.parkingSummary || "—"}</p>
          <p><strong>Laundry:</strong> {listing.laundrySummary || "—"}</p>
        </div>
      </section>

      {/* Neighborhood */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Neighborhood insights</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            ["Safety", listing.neighborhoodSafety],
            ["Walkability", listing.neighborhoodWalkability],
            ["Community", listing.neighborhoodCommunity],
            ["Noise", listing.neighborhoodNoise],
            ["Highlights", listing.neighborhoodHighlights],
            ["Transit", listing.neighborhoodTransitNotes],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border p-4 bg-gray-50"
            >
              <p className="text-sm font-medium text-gray-900 mb-1">
                {label}
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {value || "—"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <footer className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => router.push(prevPath("review", listing.id))}
        >
          Back
        </Button>

        <Button onClick={onPublish} disabled={saving}>
          {saving ? "Publishing…" : "Publish"}
        </Button>
      </footer>
    </main>
  );
}
