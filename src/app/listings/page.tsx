// src/app/listings/page.tsx
import { prisma as db } from "@/lib/db";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

type StatusVal = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
type PetPolicyVal = "CATS" | "DOGS" | "CATS_AND_DOGS" | "NONE" | "RESTRICTED";
type LaundryVal = "IN_UNIT" | "SHARED" | "NONE";
type ParkingTypeVal = "ON_SITE" | "STREET" | "NONE";
type AreaTypeVal = "URBAN" | "SUBURBAN" | "RURAL";
type NeighborhoodVibeVal = "QUIET" | "MODERATE" | "BUSY";

function toInt(v?: string, min = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(n, min) : undefined;
}

type PublicListingRow = Prisma.ListingGetPayload<{
  select: {
    id: true;
    title: true;
    city: true;
    price: true;
    beds: true;
    baths: true;
    images: true;
  };
}>;

function jsonToStringArray(v: Prisma.JsonValue | null | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]) : [];
}

function renderEmpty(searchParams: Record<string, string | undefined>) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Browse rentals</h1>
      <FilterBar initial={searchParams} total={0} />
      <p className="mt-6 text-sm text-zinc-600">No results. Try broadening your filters.</p>
    </main>
  );
}

/* ---------------- SQLite-safe, case-insensitive helpers ---------------- */

async function findIdsByCitySearch(q?: string): Promise<Set<string>> {
  // City-only matching for the free-text "q" field (exact first, then partial).
  if (!q || !q.trim()) return new Set();
  const raw = q.trim();

  // Exact city (case-insensitive, trimmed)
  const exactRows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM "Listing"
    WHERE TRIM("city") = TRIM(${raw}) COLLATE NOCASE
  `;
  if (exactRows.length > 0) return new Set(exactRows.map((r) => r.id));

  // Partial city (case-insensitive, trimmed)
  const like = `%${raw}%`;
  const partialRows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM "Listing"
    WHERE "city" LIKE ${like} COLLATE NOCASE
  `;
  return new Set(partialRows.map((r) => r.id));
}

async function findIdsByCityEquals(city?: string): Promise<Set<string>> {
  // Exact city filter (case-insensitive, trimmed)
  if (!city || !city.trim()) return new Set();
  const raw = city.trim();
  const rows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM "Listing"
    WHERE TRIM("city") = TRIM(${raw}) COLLATE NOCASE
  `;
  return new Set(rows.map((r) => r.id));
}

/* ---------------------------------------------------------------------- */

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    city?: string;
    minPrice?: string; // dollars (UI uses 0..5000)
    maxPrice?: string; // dollars
    beds?: string; // min beds
    baths?: string;
    petPolicy?: string;
    laundry?: string;
    parkingType?: string;
    areaType?: string;
    neighborhoodVibe?: string;
    sort?: "new" | "price_asc" | "price_desc";
    page?: string;
  };
}) {
  const page = Math.max(parseInt(searchParams.page ?? "1", 10) || 1, 1);

  const where: Prisma.ListingWhereInput = {
    status: "APPROVED" as StatusVal,
  };

  /* ---- City-only search behavior (case-insensitive) ---- */
  let idSet: Set<string> | null = null;

  const qTried = !!(searchParams.q && searchParams.q.trim());
  const cityTried = !!(searchParams.city && searchParams.city.trim());

  if (qTried) {
    idSet = await findIdsByCitySearch(searchParams.q);
  }
  if (cityTried) {
    const cityIds = await findIdsByCityEquals(searchParams.city);
    idSet = idSet === null ? cityIds : new Set([...idSet].filter((id) => cityIds.has(id)));
  }

  if ((qTried || cityTried) && (!idSet || idSet.size === 0)) {
    return renderEmpty(searchParams);
  }
  if (idSet && idSet.size > 0) {
    where.id = { in: [...idSet] };
  }

  // Price (UI in dollars → store in cents)
  const minPriceD = toInt(searchParams.minPrice);
  const maxPriceD = toInt(searchParams.maxPrice);
  const minPriceC = minPriceD != null ? minPriceD * 100 : undefined;
  const maxPriceC = maxPriceD != null ? maxPriceD * 100 : undefined;
  if (minPriceC != null || maxPriceC != null) {
    where.price = {
      ...(minPriceC != null ? { gte: minPriceC } : {}),
      ...(maxPriceC != null ? { lte: maxPriceC } : {}),
    };
  }

  // Beds / baths
  const beds = toInt(searchParams.beds);
  const baths = toInt(searchParams.baths);
  if (beds != null) where.beds = { gte: beds };
  if (baths != null) where.baths = { gte: baths };

  // Enums
  if (searchParams.petPolicy && searchParams.petPolicy !== "ANY") {
    where.petPolicy = searchParams.petPolicy as PetPolicyVal;
  }
  if (searchParams.laundry && searchParams.laundry !== "ANY") {
    where.laundry = searchParams.laundry as LaundryVal;
  }
  if (searchParams.parkingType && searchParams.parkingType !== "ANY") {
    where.parkingType = searchParams.parkingType as ParkingTypeVal;
  }
  if (searchParams.areaType && searchParams.areaType !== "ANY") {
    where.areaType = searchParams.areaType as AreaTypeVal;
  }
  if (searchParams.neighborhoodVibe && searchParams.neighborhoodVibe !== "ANY") {
    where.neighborhoodVibe = searchParams.neighborhoodVibe as NeighborhoodVibeVal;
  }

  // Sorting
  let orderBy: { createdAt: "desc" } | { price: "asc" } | { price: "desc" } = { createdAt: "desc" };
  if (searchParams.sort === "price_asc") orderBy = { price: "asc" };
  if (searchParams.sort === "price_desc") orderBy = { price: "desc" };

  const [items, total] = await Promise.all([
    db.listing.findMany({
      where,
      orderBy,
      select: {
        id: true,
        title: true,
        city: true,
        price: true,
        beds: true,
        baths: true,
        images: true,
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }) as Promise<PublicListingRow[]>,
    db.listing.count({ where }),
  ]);

  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  if (total === 0) return renderEmpty(searchParams);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Browse rentals</h1>

      <FilterBar initial={searchParams} total={total} />

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-600">No results. Try broadening your filters.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((l) => {
            const cover = jsonToStringArray(l.images)[0] ?? "/placeholder.svg";
            return (
              <li key={l.id} className="rounded-2xl border overflow-hidden">
                <Link href={`/listing/${l.id}`} className="block">
                  <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
                    <img src={cover} alt={l.title ?? "Listing photo"} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <div className="font-medium line-clamp-1">{l.title ?? "Untitled"}</div>
                    <div className="text-sm text-zinc-600">{l.city}</div>
                    <div className="mt-1 text-sm">
                      ${Math.round(l.price / 100)} / <span className="text-zinc-500">month</span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-600">
                      {l.beds} bed • {l.baths} bath
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <PageLink params={searchParams} page={Math.max(page - 1, 1)} disabled={page === 1}>
            Prev
          </PageLink>
          <div className="text-sm">Page {page} of {pages}</div>
          <PageLink params={searchParams} page={Math.min(page + 1, pages)} disabled={page === pages}>
            Next
          </PageLink>
        </div>
      )}
    </main>
  );
}

/* ----------------- UI bits (unchanged) ----------------- */

function PageLink({
  params,
  page,
  disabled,
  children,
}: {
  params: Record<string, string | undefined>;
  page: number;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const sp = new URLSearchParams(
    Object.entries(params).reduce<[string, string][]>((acc, [k, v]) => {
      if (v) acc.push([k, v]);
      return acc;
    }, [])
  );
  sp.set("page", String(page));
  const href = `/listings?${sp.toString()}`;

  return (
    <a
      href={href}
      className={`px-3 py-1.5 rounded-xl border ${disabled ? "pointer-events-none opacity-50" : "hover:bg-gray-50"}`}
    >
      {children}
    </a>
  );
}

function FilterBar({
  initial,
  total,
}: {
  initial: Record<string, string | undefined>;
  total: number;
}) {
  const sp = new URLSearchParams(
    Object.entries(initial).reduce<[string, string][]>((acc, [k, v]) => {
      if (v) acc.push([k, v]);
      return acc;
    }, [])
  );
  const get = (k: string) => sp.get(k) ?? "";

  function setParam(name: string, value?: string) {
    if (!value) sp.delete(name);
    else sp.set(name, value);
  }
  function submitNow() {
    sp.delete("page");
    window.location.href = `/listings?${sp.toString()}`;
  }
  function setAndSubmit(name: string, value: string) {
    setParam(name, value);
    submitNow();
  }
  function clearAll() {
    window.location.href = "/listings";
  }

  const priceMin = Number(get("minPrice") || 0);
  const priceMax = Number(get("maxPrice") || 5000);
  const bedsMin = Number(get("beds") || 0);

  function updatePrice(minD: number, maxD: number) {
    setParam("minPrice", minD > 0 ? String(minD) : "");
    setParam("maxPrice", maxD < 5000 ? String(maxD) : "");
    submitNow();
  }

  return (
    <div className="rounded-2xl border p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-end">
        <Input
          label="Search"
          placeholder="Title or city"
          defaultValue={get("q")}
          onBlur={(v) => setAndSubmit("q", v)}
        />
        <Input
          label="City"
          placeholder="e.g., Winnipeg"
          defaultValue={get("city")}
          onBlur={(v) => setAndSubmit("city", v)}
        />

        <div className="sm:col-span-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">Price ($/mo)</span>
            <div className="flex items-center gap-3">
              <span className="w-16 text-xs text-zinc-600">${priceMin}</span>
              <input
                type="range" min={0} max={5000} step={50}
                defaultValue={priceMin}
                onChange={(e) => {
                  const newMin = Number(e.currentTarget.value);
                  updatePrice(Math.min(newMin, priceMax), priceMax);
                }}
                className="flex-1"
              />
              <input
                type="range" min={0} max={5000} step={50}
                defaultValue={priceMax}
                onChange={(e) => {
                  const newMax = Number(e.currentTarget.value);
                  updatePrice(priceMin, Math.max(newMax, priceMin));
                }}
                className="flex-1"
              />
              <span className="w-16 text-xs text-zinc-600 text-right">${priceMax}</span>
            </div>
            <div className="flex gap-2 text-xs text-zinc-500">
              <button className="underline underline-offset-2 hover:text-zinc-700" onClick={() => updatePrice(0, 5000)}>
                Reset price
              </button>
            </div>
          </label>
        </div>

        <div>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">Beds (min)</span>
            <div className="flex items-center gap-3">
              <span className="w-10 text-xs text-zinc-600">{bedsMin}</span>
              <input
                type="range" min={0} max={5} step={1}
                defaultValue={bedsMin}
                onChange={(e) => setAndSubmit("beds", e.currentTarget.value)}
                className="flex-1"
              />
            </div>
          </label>
        </div>

        <Select
          label="Baths"
          value={get("baths")}
          onChange={(v) => setAndSubmit("baths", v)}
          options={[
            { v: "", l: "Any" },
            { v: "1", l: "1+" },
            { v: "2", l: "2+" },
            { v: "3", l: "3+" },
          ]}
        />
        <Select
          label="Pets"
          value={get("petPolicy")}
          onChange={(v) => setAndSubmit("petPolicy", v)}
          options={[
            { v: "ANY", l: "Any" },
            { v: "CATS", l: "Cats" },
            { v: "DOGS", l: "Dogs" },
            { v: "CATS_AND_DOGS", l: "Cats & Dogs" },
            { v: "NONE", l: "No Pets" },
            { v: "RESTRICTED", l: "Restricted" },
          ]}
        />
        <Select
          label="Laundry"
          value={get("laundry")}
          onChange={(v) => setAndSubmit("laundry", v)}
          options={[
            { v: "ANY", l: "Any" },
            { v: "IN_UNIT", l: "In Unit" },
            { v: "SHARED", l: "Shared" },
            { v: "NONE", l: "None" },
          ]}
        />
        <Select
          label="Parking"
          value={get("parkingType")}
          onChange={(v) => setAndSubmit("parkingType", v)}
          options={[
            { v: "ANY", l: "Any" },
            { v: "ON_SITE", l: "On-site" },
            { v: "STREET", l: "Street" },
            { v: "NONE", l: "None" },
          ]}
        />
        <Select
          label="Area"
          value={get("areaType")}
          onChange={(v) => setAndSubmit("areaType", v)}
          options={[
            { v: "ANY", l: "Any" },
            { v: "URBAN", l: "Urban" },
            { v: "SUBURBAN", l: "Suburban" },
            { v: "RURAL", l: "Rural" },
          ]}
        />
        <Select
          label="Vibe"
          value={get("neighborhoodVibe")}
          onChange={(v) => setAndSubmit("neighborhoodVibe", v)}
          options={[
            { v: "ANY", l: "Any" },
            { v: "QUIET", l: "Quiet" },
            { v: "MODERATE", l: "Moderate" },
            { v: "BUSY", l: "Busy" },
          ]}
        />

        <div className="flex flex-wrap items-end gap-3 sm:col-span-2 lg:col-span-3 xl:col-span-4">
          <Select
            label="Sort"
            value={get("sort") || "new"}
            onChange={(v) => setAndSubmit("sort", v)}
            options={[
              { v: "new", l: "Newest" },
              { v: "price_asc", l: "Price ↑" },
              { v: "price_desc", l: "Price ↓" },
            ]}
          />
          <div className="text-sm text-zinc-600">{total} results</div>
          <button onClick={() => (window.location.href = "/listings")} className="ml-auto rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50">
            Clear filters
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  className,
  type = "text",
  placeholder,
  defaultValue,
  onBlur,
}: {
  label: string;
  className?: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  onBlur: (val: string) => void;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-xs text-zinc-500">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="rounded-xl border px-3 py-2"
        onBlur={(e) => onBlur(e.currentTarget.value)}
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: { v: string; l: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-zinc-500">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border px-3 py-2"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </label>
  );
}
