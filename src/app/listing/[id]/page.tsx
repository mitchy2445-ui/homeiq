// src/app/listing/[id]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma as db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import Button from "@/components/ui/Button";
import SimilarListings from "./SimilarListings";

// Icons
import {
  BedDouble,
  Bath,
  Ruler,
  MapPin,
  Wifi,
  Car,
  Snowflake,
  Tv,
  Waves,
  WashingMachine,
  Utensils,
  Dumbbell,
  PawPrint,
  Flame,
  Leaf,
  Building, // use instead of Elevator
} from "lucide-react";

/* ----------------------------- helpers ---------------------------------- */

function formatCurrency(n: number) {
  return n.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });
}

function jsonToStringArray(v: Prisma.JsonValue | null | undefined): string[] {
  if (!v) return [];
  if (Array.isArray(v) && v.every((x) => typeof x === "string")) return v as string[];
  return [];
}

// normalize amenity strings for icon lookup
function normalizeAmenity(s: string) {
  return s.trim().toLowerCase();
}

// Map common amenity names to icons (expand anytime)
type IconCmp = React.ComponentType<{ className?: string }>;
const AMENITY_ICON_MAP: Record<string, IconCmp> = {
  wifi: Wifi,
  parking: Car,
  "free parking": Car,
  "air conditioning": Snowflake,
  ac: Snowflake,
  pool: Waves,
  tv: Tv,
  washer: WashingMachine,
  dryer: WashingMachine,
  kitchen: Utensils,
  gym: Dumbbell,
  "pets allowed": PawPrint,
  elevator: Building, // fallback icon
  fireplace: Flame,
  balcony: Leaf,
  patio: Leaf,
};

/* ------------------------------- types ---------------------------------- */

type PageParams = { id: string };
type PageProps = { params: Promise<PageParams> };

type ListingWithLandlordLite = Prisma.ListingGetPayload<{
  include: {
    landlord: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

/* ------------------------------- SEO ---------------------------------- */

// Optional SEO for each listing page
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await db.listing.findUnique({
    where: { id },
    select: { title: true, city: true, description: true },
  });

  if (!listing) {
    return { title: "Listing not found — HOMEIQ" };
  }

  const title = `${listing.title ?? "Listing"} — ${listing.city ?? "Canada"} | HOMEIQ`;
  const description = listing.description?.slice(0, 150) ?? "Find your next home on HOMEIQ.";

  return { title, description };
}

/* -------------------------------- page ---------------------------------- */

export default async function ListingPage({ params }: PageProps) {
  // Next.js 15: params is a Promise
  const { id } = await params;

  const listing: ListingWithLandlordLite | null = await db.listing.findUnique({
    where: { id }, // string id
    include: {
      landlord: { select: { id: true, name: true, email: true } }, // avoid passwordHash
    },
  });

  if (!listing) notFound();

  const images = jsonToStringArray(listing.images);
  const amenities = jsonToStringArray(
    (listing as unknown as { amenities?: Prisma.JsonValue }).amenities,
  );
  const videos = jsonToStringArray(
    (listing as unknown as { videos?: Prisma.JsonValue }).videos,
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Back link */}
      <div className="mb-6">
        <Link href="/" className="text-sm underline hover:opacity-80">
          ← Back to Home
        </Link>
      </div>

      {/* Title + location */}
      <header className="mb-3">
        <h1 className="text-3xl font-semibold tracking-tight">{listing.title}</h1>
        <p className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{listing.city}</span>
        </p>
      </header>

      {/* --- Gallery (1 big + 4 small) --- */}
      {images.length > 0 ? (
        <section className="mb-8 grid grid-cols-1 gap-2 md:grid-cols-4">
          {/* Large hero */}
          <div className="relative overflow-hidden rounded-2xl md:col-span-2 md:row-span-2 aspect-[16/11] md:aspect-[4/3]">
            <Image
              src={images[0]}
              alt={listing.title}
              fill
              priority
              className="object-cover"
            />
          </div>
          {/* Up to 4 supporting images */}
          {[images[1], images[2], images[3], images[4]]
            .filter(Boolean)
            .map((src, i) => (
              <div
                key={i}
                className="relative hidden overflow-hidden rounded-2xl md:block aspect-[4/3]"
              >
                <Image src={src as string} alt={`photo ${i + 2}`} fill className="object-cover" />
              </div>
            ))}
        </section>
      ) : (
        <div className="mb-8 h-64 rounded-2xl bg-gray-200" />
      )}

      {/* Videos (uploaded from device) */}
      {videos.length > 0 && (
        <section className="mb-8">
          <h3 className="mb-3 text-lg font-semibold">Videos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {videos.map((src, i) => (
              <video key={i} src={src} className="w-full rounded-2xl border" controls />
            ))}
          </div>
        </section>
      )}

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT: details */}
        <section className="space-y-8">
          {/* Quick facts with icons */}
          <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <BedDouble className="h-5 w-5" />
              <span className="text-sm">
                {listing.beds} {listing.beds === 1 ? "bedroom" : "bedrooms"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Bath className="h-5 w-5" />
              <span className="text-sm">
                {listing.baths} {listing.baths === 1 ? "bathroom" : "bathrooms"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              <span className="text-sm">Spacious layout</span>
            </div>
          </div>

          {/* About */}
          <div>
            <h2 className="mb-3 text-xl font-semibold">About this place</h2>
            <p className="leading-relaxed">
              {listing.description ?? "No description provided."}
            </p>
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-semibold">Amenities</h3>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {amenities.map((raw) => {
                  const key = normalizeAmenity(raw);
                  const Icon = AMENITY_ICON_MAP[key];
                  return (
                    <li
                      key={raw}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      {Icon ? (
                        <Icon className="h-4 w-4" />
                      ) : (
                        <Leaf className="h-4 w-4 opacity-50" />
                      )}
                      <span className="capitalize">{raw}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Location placeholder */}
          <div>
            <h3 className="mb-3 text-lg font-semibold">Location</h3>
            <div className="h-64 w-full rounded-2xl border bg-gray-50" />
          </div>

          {/* Legacy embedded video URL (only if present) */}
          {listing.videoUrl ? (
            <div>
              <h3 className="mb-3 text-lg font-semibold">Virtual viewing</h3>
              <div className="aspect-video overflow-hidden rounded-2xl">
                <iframe
                  src={listing.videoUrl}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title="Virtual viewing"
                />
              </div>
            </div>
          ) : null}
        </section>

        {/* RIGHT: sticky booking/contact card */}
        <aside className="md:sticky md:top-24">
          <div className="rounded-3xl border p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <div className="text-3xl font-semibold leading-tight">
                  {formatCurrency(listing.price)}
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    / month
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {listing.beds} bed · {listing.baths} bath
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Landlord
                </div>
                <div className="font-medium">
                  {listing.landlord?.name ?? "HOMEIQ Landlord"}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button type="button">Contact landlord</Button>
              <Button type="button" variant="outline">
                Save to favorites
              </Button>
            </div>

            <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-muted-foreground">
              You won’t be charged yet. First month + service fee is paid through
              HOMEIQ; subsequent rent is paid directly to the landlord.
            </div>
          </div>
        </aside>
      </div>

      {/* Similar listings */}
      <SimilarListings city={listing.city} excludeId={listing.id} />
    </main>
  );
}
