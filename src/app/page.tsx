import { prisma } from "@/lib/db";
import { HOME_CITIES } from "@/config/cities";
import Section from "@/components/Section";
import type { ListingCardProps } from "@/components/ListingCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

/* ---------------------------------------------
 * Helpers
 * --------------------------------------------*/

function formatPrice(cents: number) {
  return `$${(cents / 100).toLocaleString()} / mo`;
}

/* ---------------------------------------------
 * Data (MATCHES YOUR PRISMA SCHEMA)
 * --------------------------------------------*/

async function getVisibleByCity(city: string, limit = 6) {
  return prisma.listing.findMany({
    where: {
      city,
      status: "APPROVED",
      priceCents: { gt: 0 },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      photos: {
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
    },
  });
}

async function getLatestVisibleExcluding(
  excludeIds: string[],
  limit = 12
) {
  return prisma.listing.findMany({
    where: {
      status: "APPROVED",
      priceCents: { gt: 0 },
      ...(excludeIds.length
        ? { id: { notIn: excludeIds } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      photos: {
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
    },
  });
}

/* ---------------------------------------------
 * Mapper (ALIGNED WITH QUERY RESULT)
 * --------------------------------------------*/

function toCard(l: {
  id: string;
  title: string | null;
  city: string | null;
  priceCents: number | null;
  beds: number | null;
  baths: number | null;
  photos: { url: string }[];
}): ListingCardProps {
  return {
    listing: {
      id: l.id,
      title: l.title ?? "Untitled",
      city: l.city ?? "",
      imageUrl: l.photos[0]?.url,
      priceCents: l.priceCents ?? 0,
      beds: l.beds ?? 0,
      baths: l.baths ?? 0,
    },
  };
}

/* ---------------------------------------------
 * Page
 * --------------------------------------------*/

export default async function Home() {
  const perCityResults = await Promise.all(
    HOME_CITIES.map(({ city }) => getVisibleByCity(city))
  );

  const shownIds = new Set<string>();
  perCityResults.forEach((rows) =>
    rows.forEach((l) => shownIds.add(l.id))
  );

  const latestVisible = await getLatestVisibleExcluding(
    [...shownIds],
    12
  );

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="mx-auto max-w-[1440px] px-4 mt-16">
        <h1 className="text-4xl font-semibold max-w-[40ch]">
          Smarter rentals with video tours, verified landlords,
          and instant messaging.
        </h1>
        <p className="text-gray-600 mt-3 max-w-[60ch]">
          Explore curated homes across Canadian cities.
        </p>
      </section>

      {/* City Sections */}
      <div className="mt-12 space-y-10">
        {HOME_CITIES.map(({ city, tagline }, idx) => {
          const rows = perCityResults[idx];
          if (!rows.length) return null;

          return (
            <div key={city} className="mx-auto max-w-[1440px] px-4">
              <Section
                title={tagline}
                href={`/search?city=${encodeURIComponent(city)}`}
                listings={rows.map(toCard)}
              />
            </div>
          );
        })}
      </div>

      {/* Latest */}
      {latestVisible.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 mt-16">
          <h2 className="text-2xl font-semibold mb-4">
            Latest homes
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestVisible.map((l) => (
              <Link
                key={l.id}
                href={`/listing/${l.id}`}
                className="rounded-2xl border overflow-hidden hover:shadow-sm"
              >
                <div className="aspect-[4/3] bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={l.photos[0]?.url}
                    alt={l.title ?? "Listing"}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-4">
                  <div className="text-sm text-gray-500">
                    {l.city}
                  </div>
                  <div className="font-medium truncate">
                    {l.title}
                  </div>
                  <div className="text-sm text-gray-600">
                    {l.beds} bd · {l.baths} ba
                  </div>
                  <div className="mt-1 font-semibold">
                    {formatPrice(l.priceCents ?? 0)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
