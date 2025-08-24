// src/app/listing/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma as db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// ---- helpers ----
function formatCurrencyFromCents(cents: number) {
  return (cents / 100).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });
}

// Safely coerce Prisma Json -> string[]
function jsonToStringArray(v: Prisma.JsonValue | null | undefined): string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]) : [];
}

type PageProps = { params: { id: string } };

// Strong types for our queries (media fields OPTIONAL to satisfy older client types)
type ListingWithLandlordAndMaybeMedia =
  Prisma.ListingGetPayload<{ include: { landlord: true } }> & {
    images?: Prisma.JsonValue | null;
    videoUrl?: string | null;
  };

type RelatedLite = {
  id: string;
  title: string;
  city: string;
  price: number;
  beds: number;
  baths: number;
};

export default async function ListingPage({ params }: PageProps) {
  const id = params.id;

  // Fetch the listing + landlord (typed)
  const listing: ListingWithLandlordAndMaybeMedia | null = await db.listing.findUnique({
    where: { id },
    include: { landlord: true },
  });

  if (!listing) notFound();

  // Related listings from same city
  const related: RelatedLite[] = await db.listing.findMany({
    where: { city: listing.city, NOT: { id: listing.id } },
    select: { id: true, title: true, city: true, price: true, beds: true, baths: true },
    take: 6,
    orderBy: { price: "asc" },
  });

  // Prefer DB media; fallback to placeholders if empty
  const placeholderImages: string[] = [
    "https://picsum.photos/seed/homeiq1/1200/800",
    "https://picsum.photos/seed/homeiq2/800/600",
    "https://picsum.photos/seed/homeiq3/800/600",
    "https://picsum.photos/seed/homeiq4/800/600",
    "https://picsum.photos/seed/homeiq5/800/600",
  ];

  const dbImages = jsonToStringArray(listing.images ?? null);
  const images = dbImages.length > 0 ? dbImages.slice(0, 5) : placeholderImages;

  const videoUrl = listing.videoUrl ?? undefined;

  return (
    <main className="min-h-screen">
      <div className="h-2" />

      <section className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        {/* Title row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              {listing.title}
            </h1>
            <p className="text-gray-600 mt-1">
              {listing.city} • {listing.beds} bd • {listing.baths} ba
            </p>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
              aria-label="Share listing"
            >
              Share
            </button>
            <button
              className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
              aria-label="Save listing"
            >
              ♥ Save
            </button>
          </div>
        </div>

        {/* Media gallery */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-3">
          {/* Big tile */}
          <div className="md:col-span-2 md:row-span-2 overflow-hidden rounded-2xl relative h-72 md:h-[28rem]">
            <Image
              src={images[0]}
              alt="Primary photo"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          </div>

          {/* Four small tiles */}
          {images.slice(1, 5).map((src, i) => (
            <div key={i} className="overflow-hidden rounded-2xl relative h-44 md:h-auto md:min-h-40">
              <Image
                src={src}
                alt={`Photo ${i + 2}`}
                fill
                sizes="(min-width: 768px) 25vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* Main two-column layout */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left column */}
          <div className="lg:col-span-8">
            {/* Virtual Viewing */}
            {videoUrl && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">Virtual viewing</h2>
                <div className="rounded-2xl overflow-hidden bg-black">
                  <video src={videoUrl} controls className="w-full h-[360px] md:h-[440px]" />
                </div>
              </div>
            )}

            {/* About */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">About this home</h2>
              <p className="text-gray-700 leading-7">
                A bright, comfortable place in {listing.city}. For now, beds/baths and price are from your database.
                Add a richer description and amenities as your schema grows.
              </p>
            </div>

            {/* Essentials */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Essentials</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-gray-700">
                <div className="rounded-xl border p-3">🛏 {listing.beds} Bedrooms</div>
                <div className="rounded-xl border p-3">🚿 {listing.baths} Bathrooms</div>
                <div className="rounded-xl border p-3">🏷 Status: {listing.status}</div>
              </div>
            </div>

            {/* Amenities (stub list for now) */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {["Wi-Fi", "Heating", "In-unit laundry", "Parking"].map((a) => (
                  <span
                    key={a}
                    className="text-sm rounded-full border px-3 py-1.5 bg-white"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>

            {/* Landlord card */}
            <div className="mb-10">
              <h3 className="text-lg font-semibold mb-3">Listed by</h3>
              <div className="rounded-2xl border p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {listing.landlord?.name ?? "Landlord"}
                  </p>
                  <p className="text-sm text-gray-600">Usually responds within a day</p>
                </div>
                <button
                  className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
                  disabled
                  title="Messaging will be enabled after we add auth"
                >
                  Message landlord
                </button>
              </div>
            </div>
          </div>

          {/* Right column (sticky action card) */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 rounded-2xl shadow-card border p-5">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-semibold">
                    {formatCurrencyFromCents(listing.price)}{" "}
                    <span className="text-base font-normal text-gray-600">/ mo</span>
                  </div>
                  <div className="text-gray-600 text-sm mt-1">
                    {listing.beds} bd • {listing.baths} ba • {listing.city}
                  </div>
                </div>
              </div>

              <button
                className="mt-4 w-full rounded-xl bg-brand-600 text-white py-3 font-medium hover:bg-brand-700 transition"
                disabled
                title="Auth & messaging coming next"
              >
                Message landlord
              </button>

              <p className="text-xs text-gray-500 mt-3">
                Instant messaging unlocks after we add authentication. You’ll also see virtual
                viewing if the landlord uploads a tour.
              </p>
            </div>
          </aside>
        </div>

        {/* Related listings */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">More in {listing.city}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/listing/${r.id}`}
                  className="group rounded-2xl border overflow-hidden hover:shadow-hover transition"
                >
                  <div className="aspect-[4/3] bg-gray-100" />
                  <div className="p-4">
                    <div className="font-semibold">
                      {formatCurrencyFromCents(r.price)}{" "}
                      <span className="text-gray-600 font-normal">/ mo</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {r.beds} bd • {r.baths} ba • {r.city}
                    </div>
                    <div className="text-sm mt-1 line-clamp-1">{r.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
