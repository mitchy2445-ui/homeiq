// src/components/SearchFilters.tsx
"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function useSetQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (patch: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
  };
}

export default function SearchFilters() {
  const searchParams = useSearchParams();
  const setQuery = useSetQuery();

  const city = searchParams.get("city") ?? "";
  const q = searchParams.get("q") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const beds = searchParams.get("beds") ?? "";
  const baths = searchParams.get("baths") ?? "";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end"
    >
      <div className="col-span-2 md:col-span-2">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          City
        </label>
        <input
          type="text"
          value={city}
          onChange={(e) => setQuery({ city: e.target.value })}
          placeholder="Winnipeg"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      <div className="col-span-2 md:col-span-1">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Min price (¢)
        </label>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={minPrice}
          onChange={(e) => setQuery({ minPrice: e.target.value })}
          placeholder="50000"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      <div className="col-span-2 md:col-span-1">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Max price (¢)
        </label>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={maxPrice}
          onChange={(e) => setQuery({ maxPrice: e.target.value })}
          placeholder="250000"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Beds (min)
        </label>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={beds}
          onChange={(e) => setQuery({ beds: e.target.value })}
          placeholder="1"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Baths (min)
        </label>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={baths}
          onChange={(e) => setQuery({ baths: e.target.value })}
          placeholder="1"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      <div className="col-span-2 md:col-span-2">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Keywords
        </label>
        <input
          type="text"
          value={q}
          onChange={(e) => setQuery({ q: e.target.value })}
          placeholder="‘balcony’, ‘downtown’, ‘pet friendly’…"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      <div className="md:col-span-6">
        <button
          type="button"
          onClick={() =>
            setQuery({
              city: "",
              q: "",
              minPrice: "",
              maxPrice: "",
              beds: "",
              baths: "",
            })
          }
          className="rounded-full border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Clear filters
        </button>
      </div>
    </form>
  );
}
