import { prisma as db } from "@/lib/db";
import { redirect } from "next/navigation";
import ListingCard from "@/components/ListingCard";

const PAGE_SIZE = 12;

type SearchParams = {
  city?: string;
  beds?: string;
  baths?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  /* ---------------- VALIDATE CITY ---------------- */

  const city = searchParams.city?.trim();
  if (!city) redirect("/");

  /* ---------------- PARSE FILTERS ---------------- */

  const beds = searchParams.beds ? Number(searchParams.beds) : undefined;
  const baths = searchParams.baths ? Number(searchParams.baths) : undefined;
  const minPrice = searchParams.minPrice
    ? Number(searchParams.minPrice) * 100
    : undefined;
  const maxPrice = searchParams.maxPrice
    ? Number(searchParams.maxPrice) * 100
    : undefined;

  const page = Math.max(Number(searchParams.page ?? "1"), 1);
  const skip = (page - 1) * PAGE_SIZE;

  /* ---------------- WHERE FILTER ---------------- */

  const where = {
  city,
  priceCents: { gt: 0 },          // ✅ hide $0 listings
  published: true,                // ✅ only live listings
  approved: true,                 // ✅ only admin-approved

  ...(beds ? { beds: { gte: beds } } : {}),
  ...(baths ? { baths: { gte: baths } } : {}),
  ...(minPrice || maxPrice
    ? {
        priceCents: {
          ...(minPrice ? { gte: minPrice } : {}),
          ...(maxPrice ? { lte: maxPrice } : {}),
        },
      }
    : {}),
};


  /* ---------------- TOTAL COUNT ---------------- */

  const total = await db.listing.count({ where });
  const totalPages = Math.ceil(total / PAGE_SIZE);

  /* ---------------- PAGE OUT OF RANGE ---------------- */

  if (page > totalPages && totalPages > 0) {
    const params = new URLSearchParams();

    Object.entries(searchParams).forEach(([key, value]) => {
      if (typeof value === "string") {
        params.set(key, value);
      }
    });

    params.set("page", "1");

    redirect(`/search?${params.toString()}`);
  }

  /* ---------------- FETCH RESULTS ---------------- */

  const listings = await db.listing.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: PAGE_SIZE,
    select: {
      id: true,
      title: true,
      city: true,
      beds: true,
      baths: true,
      priceCents: true,
      images: true,
      createdAt: true,
    },
  });

  /* ---------------- PAGINATION RANGE ---------------- */

  function getPageNumbers(current: number, total: number) {
    const pages: number[] = [];

    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  /* ---------------- UI ---------------- */

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Homes in {city}</h1>

      <p className="mt-2 text-sm text-gray-600">
        {total} results · Page {page} of {totalPages || 1}
      </p>

      {/* RESULTS */}
      {listings.length === 0 ? (
        <div className="mt-16 text-center text-gray-500">
          No listings found.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {listings.map((l) => (
            <ListingCard
              key={l.id}
              id={l.id}
              title={l.title}
              city={l.city}
              beds={l.beds}
              baths={l.baths}
              priceCents={l.priceCents ?? undefined}
              images={
                Array.isArray(l.images)
                  ? l.images.filter(
                      (img): img is string => typeof img === "string"
                    )
                  : []
              }
            />
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {/* Previous */}
          {page > 1 && (() => {
            const params = new URLSearchParams();

            Object.entries(searchParams).forEach(([key, value]) => {
              if (typeof value === "string") {
                params.set(key, value);
              }
            });

            params.set("page", String(page - 1));

            return (
              <a
                href={`/search?${params.toString()}`}
                className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
              >
                Prev
              </a>
            );
          })()}

          {/* Page numbers */}
          {getPageNumbers(page, totalPages).map((p) => {
            const params = new URLSearchParams();

            Object.entries(searchParams).forEach(([key, value]) => {
              if (typeof value === "string") {
                params.set(key, value);
              }
            });

            params.set("page", String(p));

            return (
              <a
                key={p}
                href={`/search?${params.toString()}`}
                className={`px-3 py-2 rounded-lg border text-sm ${
                  p === page
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "hover:bg-gray-50"
                }`}
              >
                {p}
              </a>
            );
          })}

          {/* Next */}
          {page < totalPages && (() => {
            const params = new URLSearchParams();

            Object.entries(searchParams).forEach(([key, value]) => {
              if (typeof value === "string") {
                params.set(key, value);
              }
            });

            params.set("page", String(page + 1));

            return (
              <a
                href={`/search?${params.toString()}`}
                className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
              >
                Next
              </a>
            );
          })()}
        </div>
      )}
    </main>
  );
}
