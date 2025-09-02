"use client";

import { FiSearch, FiDollarSign } from "react-icons/fi";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HOME_CITIES } from "@/config/cities"; // uses your existing config

// Build a simple city list once
const CITY_NAMES = Array.from(
  new Set(HOME_CITIES.map((c) => c.city).filter(Boolean))
).sort();

export default function SearchBar() {
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [beds, setBeds] = useState("");

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = location.trim().toLowerCase();
    if (!q) return CITY_NAMES.slice(0, 7);
    return CITY_NAMES.filter((c) => c.toLowerCase().includes(q)).slice(0, 7);
  }, [location]);

  const submit = () => {
    const params = new URLSearchParams();
    if (location.trim()) params.set("city", location.trim());
    if (price.trim()) params.set("maxPrice", String(Number(price.trim())));
    if (beds.trim()) params.set("beds", String(Number(beds.trim())));
    params.set("page", "1");
    router.push(`/search?${params.toString()}`);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (open && filtered.length > 0) {
        setLocation(filtered[highlight]);
        setOpen(false);
      }
      e.preventDefault();
      submit();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlight((h) => (filtered.length ? (h + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlight((h) =>
        filtered.length ? (h - 1 + filtered.length) % filtered.length : 0
      );
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="w-full max-w-2xl" onKeyDown={onKeyDown}>
      <div
        className="flex items-center gap-2 bg-white rounded-full shadow-card border border-gray-100 px-2 py-2
                   focus-within:ring-2 focus-within:ring-brand-200"
        role="search"
      >
        {/* Location with autocomplete */}
        <div className="relative flex items-center gap-2 px-3" ref={boxRef}>
          <FiSearch className="h-5 w-5 text-gray-500" />
          <input
            aria-label="Location"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="city-autocomplete"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setOpen(true);
              setHighlight(0);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Where to? Winnipeg, Toronto…"
            className="w-36 md:w-56 bg-transparent outline-none text-sm"
          />
          {open && filtered.length > 0 && (
            <ul
              id="city-autocomplete"
              role="listbox"
              className="absolute z-50 top-[110%] left-0 right-0 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
            >
              {filtered.map((city, i) => (
                <li
                  key={city}
                  role="option"
                  aria-selected={i === highlight}
                  className={`px-3 py-2 text-sm cursor-pointer ${
                    i === highlight ? "bg-gray-100" : "bg-white"
                  }`}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => {
                    // prevent input blur before click runs
                    e.preventDefault();
                    setLocation(city);
                    setOpen(false);
                    setTimeout(submit, 0);
                  }}
                >
                  {city}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="h-6 w-px bg-gray-200" />

        {/* Max price */}
        <div className="flex items-center gap-2 px-3">
          <FiDollarSign className="h-5 w-5 text-gray-500" />
          <input
            aria-label="Max monthly price"
            type="number"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            className="w-20 bg-transparent outline-none text-sm"
            min={0}
          />
        </div>

        <div className="h-6 w-px bg-gray-200" />

        {/* Beds */}
        <div className="flex items-center gap-2 px-3">
          <span className="text-gray-500 text-sm">Beds</span>
          <input
            aria-label="Bedrooms"
            type="number"
            inputMode="numeric"
            value={beds}
            onChange={(e) => setBeds(e.target.value)}
            placeholder="Any"
            className="w-14 bg-transparent outline-none text-sm"
            min={0}
          />
        </div>

        <button
          type="button"
          className="ml-auto bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-full"
          onClick={submit}
        >
          Search
        </button>
      </div>
    </div>
  );
}
