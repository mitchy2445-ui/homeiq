import { prisma } from "@/lib/db";
import { HOME_CITIES } from "@/config/cities";

export const dynamic = "force-dynamic"; // simple: fetch fresh on dev

function formatPrice(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })} / mo`;
}

export default async function Home() {
  // fetch approved listings for the cities we feature
  const cities = HOME_CITIES.map(c => c.city);
  const listings = await prisma.listing.findMany({
    where: { status: "APPROVED", city: { in: cities } },
    orderBy: { createdAt: "desc" },
    take: 48,
  });

  // group by city for rendering under each tagline
  const byCity = new Map<string, typeof listings>();
  for (const c of cities) byCity.set(c, []);
  for (const l of listings) {
    byCity.set(l.city, [...(byCity.get(l.city) ?? []), l]);
  }

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 mt-10 md:mt-16">
        <h1 className="text-2xl md:text-4xl font-semibold max-w-[40ch]">
          Smarter rentals with video tours, verified landlords, and instant messaging.
        </h1>
        <p className="text-gray-600 mt-3 max-w-[60ch]">
          Explore curated homes across Canadian cities. Compare easily, save favorites, and message landlords.
        </p>
      </section>

      {/* Rows per city/tagline */}
      <section className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 mt-10 space-y-8">
        {HOME_CITIES.map(({ city, tagline }) => {
          const rows = byCity.get(city) ?? [];
          return (
            <div key={city}>
              <h2 className="text-lg md:text-xl font-semibold mb-3">
                {tagline} &gt;
              </h2>
              <div className="overflow-x-auto">
                <div className="flex gap-4 min-w-max">
                  {rows.length === 0 ? (
                    <div className="text-sm text-gray-500">No listings yet.</div>
                  ) : (
                    rows.slice(0, 8).map((l) => (
                      <a
                        key={l.id}
                        href={`/listing/${l.id}`}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition w-[260px] shrink-0 overflow-hidden"
                      >
                        <div className="relative aspect-[4/3] bg-gray-200" />
                        <div className="p-3">
                          <div className="font-semibold">{formatPrice(l.price)}</div>
                          <div className="text-sm text-gray-600">
                            {l.beds} bd · {l.baths} ba
                          </div>
                          <div className="text-sm text-gray-500">{l.title}</div>
                        </div>
                      </a>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Landlord CTA */}
      <section className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 mt-12 mb-16">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="text-gray-700">
            <h2 className="text-xl font-semibold mb-1">For Landlords</h2>
            <p>List your property for just $5/month and reach serious renters.</p>
          </div>
          <a
            href="/landlord"
            className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium"
          >
            Become a Landlord
          </a>
        </div>
      </section>
    </main>
  );
}
