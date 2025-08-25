// app/search/page.tsx
import { prisma } from "@/lib/db";
import FiltersBar from "@/components/FiltersBar";
import ListingCard from "@/components/ListingCard";
import Link from "next/link";

type SearchParams = {
  city?: string;
  minPrice?: string;
  maxPrice?: string;
  beds?: string;
  page?: string;
};

function dollarsToCents(v?: string) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.round(n * 100)) : undefined;
}

// Typed helper to build a query string without using `any`
function buildQuery(sp: SearchParams) {
  const q = new URLSearchParams();
  if (sp.city) q.set("city", sp.city);
  if (sp.minPrice) q.set("minPrice", sp.minPrice);
  if (sp.maxPrice) q.set("maxPrice", sp.maxPrice);
  if (sp.beds) q.set("beds", sp.beds);
  return q;
}

export default async function SearchPage({
  searchParams,
}: { searchParams: SearchParams }) {
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const take = 24;
  const skip = (page - 1) * take;

  const city = searchParams.city?.trim();
  const minPrice = dollarsToCents(searchParams.minPrice);
  const maxPrice = dollarsToCents(searchParams.maxPrice);
  const beds = Number(searchParams.beds);
  const hasBeds = Number.isFinite(beds) && beds > 0;

  const where = {
    status: "APPROVED" as const,
    ...(city ? { city } : {}),
    ...(hasBeds ? { beds: { gte: beds } } : {}),
    ...(minPrice || maxPrice
      ? { price: { ...(minPrice ? { gte: minPrice } : {}), ...(maxPrice ? { lte: maxPrice } : {}) } }
      : {}),
  };

  const [results, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.listing.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / take));

  const setPage = (p: number) => {
    const q = buildQuery(searchParams);
    q.set("page", String(p));
    return `/search?${q.toString()}`;
  };

  return (
    <main className="mx-auto max-w-[1440px] px-4 md:px-6 lg:px-8 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-semibold mt-6">Search homes</h1>

      {/* Filters */}
      <div className="mt-4">
        <FiltersBar initial={searchParams} />
      </div>

      {/* Results */}
      <section className="mt-6">
        {results.length === 0 ? (
          <p className="text-gray-600">No results. Try widening your filters.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {results.map((l) => (
              <ListingCard
                key={l.id}
                href={`/listing/${l.id}`}
                // imageSrc={l.imageUrl}
                title={l.title}
                price={`$${(l.price / 100).toLocaleString()} / mo`}
                meta={`${l.beds} bd · ${l.baths} ba`}
                location={l.city}
              />
            ))}
          </div>
        )}
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 my-10">
          <Link
            href={setPage(Math.max(1, page - 1))}
            aria-disabled={page === 1}
            className={`px-3 py-2 rounded-full border ${page === 1 ? "pointer-events-none opacity-50" : "hover:bg-gray-50"}`}
          >
            Prev
          </Link>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Link
            href={setPage(Math.min(totalPages, page + 1))}
            aria-disabled={page === totalPages}
            className={`px-3 py-2 rounded-full border ${page === totalPages ? "pointer-events-none opacity-50" : "hover:bg-gray-50"}`}
          >
            Next
          </Link>
        </nav>
      )}
    </main>
  );
}
