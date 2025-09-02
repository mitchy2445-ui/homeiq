// app/page.tsx
import { prisma } from "@/lib/db";
import { HOME_CITIES } from "@/config/cities";
import Section from "@/components/Section";
import type { ListingCardProps } from "@/components/ListingCard";
import Link from "next/link";
import type { Listing } from "@prisma/client";


export const dynamic = "force-dynamic"; // fresh data on each request (great for dev)

// ---- helpers ----
function formatPrice(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })} / mo`;
}

function jsonToStringArray(v: unknown): string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]) : [];
}

function firstImage(images: unknown): string | null {
  if (Array.isArray(images)) {
    const s = images.find((x) => typeof x === "string");
    return (s as string) || null;
  }
  return null;
}

function toCard(l: Listing): ListingCardProps {

  return {
    id: l.id,
    title: l.title ?? "Untitled",
    city: l.city ?? undefined,
    priceCents: typeof l.price === "number" ? l.price : 0, // your schema uses `price` in cents
    beds: typeof l.beds === "number" ? l.beds : undefined,
    baths: typeof l.baths === "number" ? l.baths : undefined,
    images: jsonToStringArray(l.images),
  };
}

export default async function Home() {
  // ----- Curated rows (by HOME_CITIES) -----
  const curatedCities = HOME_CITIES.map((c) => c.city);

  const curatedListings = await prisma.listing.findMany({
    where: { status: "APPROVED", city: { in: curatedCities } },
    orderBy: { createdAt: "desc" },
    take: 48,
  });

  // Group by city
  const byCity = new Map<string, typeof curatedListings>();
  for (const c of curatedCities) byCity.set(c, []);
  for (const l of curatedListings) {
    byCity.set(l.city, [ ...(byCity.get(l.city) ?? []), l ]);
  }

  // Track IDs shown in curated rows (avoid duplicates in Latest)
  const shownIds = new Set<string>();
  for (const c of curatedCities) {
    const rows = byCity.get(c) ?? [];
    for (const l of rows.slice(0, 8)) shownIds.add(l.id);
  }

  // ----- Latest approved (fallback, any city) -----
  const latestApproved = await prisma.listing.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 24,
  });

  const latestToShow = latestApproved
    .filter((l) => !shownIds.has(l.id))
    .slice(0, 12);

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="mx-auto max-w-[1440px] px-4 md:px-6 lg:px-8 mt-10 md:mt-16">
        <h1 className="text-2xl md:text-4xl font-semibold max-w-[40ch]">
          Smarter rentals with video tours, verified landlords, and instant messaging.
        </h1>
        <p className="text-gray-600 mt-3 max-w-[60ch]">
          Explore curated homes across Canadian cities. Compare easily, save favorites, and message landlords.
        </p>
      </section>

      {/* Curated rows per city — now rendered as HORIZONTAL carousels */}
      <div className="mt-10 space-y-8">
        {HOME_CITIES.map(({ city, tagline }) => {
          const rows = byCity.get(city) ?? [];
          const items: ListingCardProps[] = rows.slice(0, 12).map(toCard);
          if (items.length === 0) return null;

          // `Section` -> horizontal scroll, hidden scrollbar, arrow buttons on desktop
          return (
            <div key={city} className="mx-auto max-w-[1440px] px-4 md:px-6 lg:px-8">
              <Section title={tagline} href={`/search?city=${encodeURIComponent(city)}`} listings={items} />
            </div>
          );
        })}
      </div>

      {/* Latest approved (grid) */}
      {latestToShow.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 md:px-6 lg:px-8 mt-12">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Latest approved listings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestToShow.map((l) => {
              const cover = firstImage(l.images);
              return (
                <Link
                  key={l.id}
                  href={`/listing/${l.id}`}
                  className="group rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-sm transition"
                >
                  <div className="aspect-[4/3] bg-gray-100">
                    {/* Use <img> so random external hosts work while testing */}
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={l.title || "Listing photo"}
                        className="w-full h-full object-cover group-hover:opacity-95"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-gray-400 text-sm">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-sm text-gray-500">{l.city}</div>
                    <div className="mt-0.5 font-medium line-clamp-1">{l.title || "Untitled"}</div>
                    <div className="mt-1 text-gray-600 text-sm">
                      {l.beds} bd · {l.baths} ba
                    </div>
                    <div className="mt-2 font-semibold">{formatPrice(l.price)}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Landlord CTA */}
      <section className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 mt-12 mb-16">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="text-gray-700">
            <h2 className="text-xl font-semibold mb-1">For Landlords</h2>
            <p>List your property quickly and reach serious renters.</p>
          </div>
          <a
            href="/host"
            className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium"
          >
            Become a Landlord
          </a>
        </div>
      </section>
    </main>
  );
}
