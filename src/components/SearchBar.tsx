"use client";
import { FiSearch, FiDollarSign } from "react-icons/fi";
import { useState } from "react";

export default function SearchBar() {
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [beds, setBeds] = useState("");

  return (
    <div className="w-full max-w-2xl">
      <div
        className="flex items-center gap-2 bg-white rounded-full shadow-card border border-gray-100 px-2 py-2
                   focus-within:ring-2 focus-within:ring-brand-200"
        role="search"
      >
        <div className="flex items-center gap-2 px-3">
          <FiSearch className="h-5 w-5 text-gray-500" />
          <input
            aria-label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where to? Winnipeg, Toronto…"
            className="w-36 md:w-56 bg-transparent outline-none text-sm"
          />
        </div>

        <div className="h-6 w-px bg-gray-200" />

        <div className="flex items-center gap-2 px-3">
          <FiDollarSign className="h-5 w-5 text-gray-500" />
          <input
            aria-label="Max monthly price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            className="w-20 bg-transparent outline-none text-sm"
          />
        </div>

        <div className="h-6 w-px bg-gray-200" />

        <div className="flex items-center gap-2 px-3">
          <span className="text-gray-500 text-sm">Beds</span>
          <input
            aria-label="Bedrooms"
            value={beds}
            onChange={(e) => setBeds(e.target.value)}
            placeholder="Any"
            className="w-14 bg-transparent outline-none text-sm"
          />
        </div>

        <button
          className="ml-auto bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-full"
          onClick={() => {
            const params = new URLSearchParams({
              ...(location ? { location } : {}),
              ...(price ? { price } : {}),
              ...(beds ? { beds } : {}),
            }).toString();
            window.location.href = `/search?${params}`;
          }}
        >
          Search
        </button>
      </div>
    </div>
  );
}
