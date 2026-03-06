// src/app/roommates/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma as db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RoommatesBrowsePage() {
  const session = await requireSession();
  if (!session) {
    redirect("/login?redirect=/roommates");
  }

  // Fetch roommate listings, excluding the current user's own posts
  const listings = await db.roommateListing.findMany({
    where: {
      ownerId: { not: session.sub },
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-12">
        {/* Header */}
        <header className="space-y-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-neutral-900">
            Find your next roommate
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Browse verified users and find someone who matches your lifestyle in Winnipeg and beyond.
          </p>
        </header>

        {/* Create Listing CTA */}
        <div className="text-center">
          <Link
            href="/roommates/new"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-8 py-4 text-base font-medium text-white hover:bg-emerald-700 transition min-w-[240px]"
          >
            Create a Roommate Listing
          </Link>
        </div>

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <div className="text-center text-neutral-500 py-20 text-lg">
            No roommate listings available yet. Be the first to create one!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/roommates/${listing.id}`}
                className="group border border-neutral-200 rounded-2xl p-6 hover:shadow-md transition bg-white flex flex-col"
              >
                {/* Type Badge */}
                <div className="mb-4">
                  <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
                    {listing.type === "ROOM_AVAILABLE" ? "Room Available" : "Looking for Room"}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-lg font-semibold text-neutral-900 group-hover:text-emerald-600 transition line-clamp-2">
                  {listing.title}
                </h2>

                {/* Description Preview */}
                <p className="text-sm text-neutral-600 mt-3 line-clamp-3 flex-grow">
                  {listing.description}
                </p>

                {/* Preferences */}
                <div className="mt-6 text-sm text-neutral-600 space-y-1">
                  {listing.preferredGender && (
                    <div>Preferred gender: {listing.preferredGender}</div>
                  )}

                  {(listing.minAge || listing.maxAge) && (
                    <div>
                      Age range: {listing.minAge ?? "?"} – {listing.maxAge ?? "?"}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-neutral-100 text-xs text-neutral-500">
                  Posted by {listing.owner?.name ?? "Anonymous"} •{" "}
                  {new Date(listing.createdAt).toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}