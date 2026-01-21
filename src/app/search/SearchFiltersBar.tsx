"use client";

export default function SearchFiltersBar() {
  return (
    <div className="sticky top-16 z-30 bg-white border rounded-full px-4 py-3 flex items-center gap-4 shadow-sm">
      <FilterChip label="Location" />
      <FilterChip label="Price" />
      <FilterChip label="Beds" />
      <FilterChip label="Listing type" />
      <button className="ml-auto text-sm font-medium text-emerald-600 hover:underline">
        Filters
      </button>
    </div>
  );
}

function FilterChip({ label }: { label: string }) {
  return (
    <button className="text-sm px-4 py-2 rounded-full border hover:bg-gray-50">
      {label}
    </button>
  );
}
