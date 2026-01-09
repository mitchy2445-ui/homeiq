"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

type Favorite = {
  id: string;
  listingId: string;
  createdAt?: string;
  listing: {
    id: string;
    title: string;
    city: string;
    beds: number;
    baths: number;
    price: number; // cents
    photos?: { url: string }[];
  };
};

type SortOption =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "city-asc";

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  useEffect(() => {
    fetch("/api/favorites", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          router.replace("/auth/login?next=/favorites");
          return null;
        }
        return res.json();
      })
      .then((data: Favorite[] | null) => {
        if (data) setFavorites(data);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const removeFavorite = async (listingId: string) => {
    setFavorites((prev) =>
      prev.filter((f) => f.listingId !== listingId)
    );

    await fetch("/api/favorites", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
  };

  /* ---------------------------------------------
   * Sorting logic
   * --------------------------------------------*/
  const sortedFavorites = useMemo(() => {
    const arr = [...favorites];

    switch (sortBy) {
      case "price-asc":
        return arr.sort(
          (a, b) => a.listing.price - b.listing.price
        );

      case "price-desc":
        return arr.sort(
          (a, b) => b.listing.price - a.listing.price
        );

      case "city-asc":
        return arr.sort((a, b) =>
          a.listing.city.localeCompare(b.listing.city)
        );

      case "newest":
      default:
        return arr.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return (
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          );
        });
    }
  }, [favorites, sortBy]);

  /* ---------------------------------------------
   * Loading
   * --------------------------------------------*/
  if (loading) {
    return (
      <main className="mx-auto max-w-[1440px] px-4 mt-16">
        <h1 className="text-2xl font-semibold">Saved listings</h1>
        <p className="mt-4 text-gray-500">Loading…</p>
      </main>
    );
  }

  /* ---------------------------------------------
   * Empty state
   * --------------------------------------------*/
  if (sortedFavorites.length === 0) {
    return (
      <main className="mx-auto max-w-[1440px] px-4 mt-24 text-center">
        <Heart className="mx-auto h-10 w-10 text-gray-400" />
        <h2 className="mt-4 text-xl font-semibold">
          No saved listings yet
        </h2>
        <p className="mt-2 text-gray-600">
          Tap the heart icon on a listing to save it here.
        </p>

        <Link
          href="/"
          className="inline-block mt-6 rounded-full border px-6 py-2 font-medium hover:bg-gray-50"
        >
          Browse homes
        </Link>
      </main>
    );
  }

  /* ---------------------------------------------
   * Page
   * --------------------------------------------*/
  return (
    <main className="mx-auto max-w-[1440px] px-4 mt-16">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">
          Saved listings
        </h1>

        {/* Sort control */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="sort"
            className="text-sm text-gray-600"
          >
            Sort by
          </label>

          <select
            id="sort"
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as SortOption)
            }
            className="rounded-full border px-3 py-1.5 text-sm focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">
              Price: Low → High
            </option>
            <option value="price-desc">
              Price: High → Low
            </option>
            <option value="city-asc">
              City: A–Z
            </option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedFavorites.map(({ listing, listingId }) => {
          const image = listing.photos?.[0]?.url;
          const price = Math.round(listing.price / 100);

          return (
            <div
              key={listingId}
              className="rounded-2xl border bg-white overflow-hidden transition hover:shadow-md"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] bg-gray-100">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    No photo available
                  </div>
                )}

                {/* ❤️ Heart toggle */}
                <button
                  onClick={() => removeFavorite(listingId)}
                  aria-label="Remove from favorites"
                  className="
                    absolute top-2 right-2 rounded-full bg-white/90 p-2 shadow
                    hover:scale-105 transition
                  "
                >
                  <Heart className="h-4 w-4 fill-emerald-700 text-emerald-700" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="font-medium truncate">
                  {listing.title}
                </div>

                <div className="mt-1 text-sm text-gray-600">
                  {listing.city} · {listing.beds} bed ·{" "}
                  {listing.baths} bath
                </div>

                <div className="mt-2 font-semibold">
                  ${price.toLocaleString()}/mo
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/listing/${listing.id}`}
                    className="flex-1 rounded-full border px-3 py-1.5 text-sm text-center hover:bg-gray-50"
                  >
                    View listing
                  </Link>

                  <button
                    onClick={() => removeFavorite(listingId)}
                    className="flex-1 rounded-full border px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
