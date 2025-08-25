// src/components/FiltersBar.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Props = {
  initial?: {
    city?: string;
    minPrice?: string;
    maxPrice?: string;
    beds?: string;
  };
};

const cities = ["Winnipeg", "Toronto", "Calgary", "Edmonton", "Saskatoon", "Regina", "Brandon"];

export default function FiltersBar({ initial = {} }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const [city, setCity] = useState(initial.city ?? "");
  const [minPrice, setMinPrice] = useState(initial.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice ?? "");
  const [beds, setBeds] = useState(initial.beds ?? "");

  // Keep inputs in sync if user navigates back/forward
  useEffect(() => {
    setCity(params.get("city") ?? "");
    setMinPrice(params.get("minPrice") ?? "");
    setMaxPrice(params.get("maxPrice") ?? "");
    setBeds(params.get("beds") ?? "");
  }, [params]);

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (city) q.set("city", city);
    if (minPrice) q.set("minPrice", minPrice);
    if (maxPrice) q.set("maxPrice", maxPrice);
    if (beds) q.set("beds", beds);
    q.set("page", "1"); // reset page on new search
    return q.toString();
  }, [city, minPrice, maxPrice, beds]);

  const apply = () => router.push(`/search?${query}`);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1">City</label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-xl border-gray-300"
        >
          <option value="">Any</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1">Min $/mo</label>
        <input
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="rounded-xl border-gray-300 w-28"
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1">Max $/mo</label>
        <input
          type="number"
          inputMode="numeric"
          placeholder="5000"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="rounded-xl border-gray-300 w-28"
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1">Beds</label>
        <input
          type="number"
          inputMode="numeric"
          placeholder="Any"
          value={beds}
          onChange={(e) => setBeds(e.target.value)}
          className="rounded-xl border-gray-300 w-24"
          min={0}
        />
      </div>

      <button
        onClick={apply}
        className="ml-auto px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white"
      >
        Apply
      </button>
    </div>
  );
}
