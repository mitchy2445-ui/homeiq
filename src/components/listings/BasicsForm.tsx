"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { nextPath } from "@/lib/listingWizard";

// --- PROVINCES ---
const PROVINCES_CA = [
  "MB", "SK", "AB", "BC", "ON", "QC",
  "NB", "NS", "PE", "NL", "YT", "NT", "NU",
];

// --- UI Utilities ---
const UTILITY_OPTIONS = [
  "Heat",
  "Water",
  "Electricity",
  "Gas",
  "Internet",
  "Garbage",
  "Parking",
];

// --- Ideal Renter (text only goes to preferredTenantType) ---
const IDEAL_RENTER_OPTIONS = [
  "Students",
  "Young professionals",
  "Families",
  "Couples",
  "Single tenant",
  "Quiet / low-noise tenants",
  "No strong preference",
];

// --- ENUM-SAFE OPTIONS ---
const PET_ENUM_OPTIONS = [
  { label: "No pets", value: "NONE" },
  { label: "Cats allowed", value: "CATS" },
  { label: "Dogs allowed", value: "DOGS" },
  { label: "Cats & dogs allowed", value: "CATS_AND_DOGS" },
  { label: "Pets allowed with restrictions", value: "RESTRICTED" },
];

const PARKING_ENUM_OPTIONS = [
  { label: "Street parking available", value: "STREET" },
  { label: "On-site parking available", value: "ON_SITE" },
  { label: "No dedicated parking", value: "NONE" },
];

const LAUNDRY_ENUM_OPTIONS = [
  { label: "In-unit washer/dryer", value: "IN_UNIT" },
  { label: "Shared laundry facilities", value: "SHARED" },
  { label: "No laundry on-site", value: "NONE" },
];

type FormState = {
  title: string;
  street: string;
  aptUnit: string;
  city: string;
  province: string;
  postal: string;

  beds: string;
  baths: string;
  propertyType: string;
  monthlyPrice: string;
  description: string;

  isFurnished: string;
  maxOccupancy: string;
  depositAmount: string;
  availableFrom: string;
  minLeaseMonths: string;

  // ENUMS
  petPolicy: string;
  parkingType: string;
  laundry: string;

  // Summaries
  preferredTenantType: string;

  // Utilities
  utilitiesIncluded: string[];
  utilitiesNotIncluded: string[];
};

export default function BasicsForm() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    title: "",
    street: "",
    aptUnit: "",
    city: "",
    province: "",
    postal: "",

    beds: "",
    baths: "",
    propertyType: "",
    monthlyPrice: "",
    description: "",

    isFurnished: "",
    maxOccupancy: "",
    depositAmount: "",
    availableFrom: "",
    minLeaseMonths: "",

    petPolicy: "",
    parkingType: "",
    laundry: "",

    preferredTenantType: "",

    utilitiesIncluded: [],
    utilitiesNotIncluded: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function onChange<K extends keyof FormState>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function toggleUtility(
    key: "utilitiesIncluded" | "utilitiesNotIncluded",
    value: string
  ) {
    setForm((f) => {
      const thisSet = new Set(f[key]);
      const otherKey = key === "utilitiesIncluded" ? "utilitiesNotIncluded" : "utilitiesIncluded";

      thisSet.has(value) ? thisSet.delete(value) : thisSet.add(value);

      const otherSet = new Set(f[otherKey]);
      if (otherSet.has(value)) otherSet.delete(value);

      return {
        ...f,
        [key]: [...thisSet],
        [otherKey]: [...otherSet],
      };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // BASIC validation
    const title = form.title.trim();
    const description = form.description.trim();
    const street = form.street.trim();
    const city = form.city.trim();
    const province = form.province.trim();
    const postal = form.postal.trim().toUpperCase();

    const price = Number(form.monthlyPrice.replace(/[, ]+/g, ""));
    const beds = Number(form.beds);
    const baths = Number(form.baths);

    if (title.length < 10) return setError("Title must be at least 10 characters.");
    if (!street) return setError("Street is required.");
    if (!city) return setError("City is required.");
    if (!province) return setError("Province is required.");
    if (!postal) return setError("Postal code is required.");
    if (!Number.isFinite(price)) return setError("Price must be valid.");
    if (!Number.isFinite(beds)) return setError("Beds must be a number.");
    if (!Number.isFinite(baths)) return setError("Baths must be a number.");
    if (description.length < 80) return setError("Description must be at least 80 characters.");

    const priceCents = Math.round(price * 100);

    // FINAL clean payload
    const payload = {
      title,
      street,
      aptUnit: form.aptUnit || null,
      city,
      province,
      postal,
      beds,
      baths,
      description,
      propertyType: form.propertyType || null,

      price: priceCents,

      isFurnished: form.isFurnished === "yes",
      maxOccupancy: form.maxOccupancy ? Number(form.maxOccupancy) : null,
      depositAmount: form.depositAmount ? Number(form.depositAmount) * 100 : null,
      availableFrom: form.availableFrom || null,
      minLeaseMonths: form.minLeaseMonths ? Number(form.minLeaseMonths) : null,

      // ENUMS — EXACT MATCH FOR POST ROUTE
      petPolicy: form.petPolicy || null,
      parkingType: form.parkingType || null,
      laundry: form.laundry || null,

      preferredTenantType: form.preferredTenantType || null,

      utilitiesIncluded: form.utilitiesIncluded,
      utilitiesNotIncluded: form.utilitiesNotIncluded,
    };

    setSubmitting(true);

    const res = await fetch("/api/host/listings", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(body.error || "Unable to save listing.");
      setSubmitting(false);
      return;
    }

    router.replace(nextPath("basics", body.id));
  }

  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      {/* ERROR BANNER */}
      {error && (
        <div className="rounded border border-red-500 bg-red-50 text-red-600 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {/* TITLE */}
      <div>
        <label className="text-sm font-medium">Listing title</label>
        <Input placeholder="Modern 2-bedroom suite near BU" value={form.title} onChange={onChange("title")} />
      </div>

      {/* ADDRESS */}
      <div className="border-t pt-6 space-y-4">
        <h2 className="font-semibold text-base">Address</h2>

        <Input placeholder="Street address" value={form.street} onChange={onChange("street")} />
        <Input placeholder="Apt / Unit (optional)" value={form.aptUnit} onChange={onChange("aptUnit")} />

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Input placeholder="City" value={form.city} onChange={onChange("city")} />

          <select className="rounded border px-3 py-2 text-sm" value={form.province} onChange={onChange("province")}>
            <option value="">Province</option>
            {PROVINCES_CA.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>

          <Input placeholder="Postal code" value={form.postal} onChange={onChange("postal")} />

          <Input disabled value="Canada" />
        </div>
      </div>

      {/* HOME SETUP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-6">
        <div>
          <label className="text-sm font-medium">Beds</label>
          <Input type="number" value={form.beds} onChange={onChange("beds")} />
        </div>

        <div>
          <label className="text-sm font-medium">Baths</label>
          <Input type="number" value={form.baths} onChange={onChange("baths")} />
        </div>

        <div>
          <label className="text-sm font-medium">Property type</label>
          <select className="rounded border px-3 py-2 text-sm" value={form.propertyType} onChange={onChange("propertyType")}>
            <option value="">Select...</option>
            <option>Apartment</option>
            <option>Condo</option>
            <option>House</option>
            <option>Basement suite</option>
            <option>Townhouse</option>
            <option>Room in shared home</option>
          </select>
        </div>
      </div>

      {/* PRICE & OCCUPANCY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Monthly price (CAD)</label>
          <Input value={form.monthlyPrice} onChange={onChange("monthlyPrice")} placeholder="1250" />
        </div>

        <div>
          <label className="text-sm font-medium">Deposit (CAD)</label>
          <Input value={form.depositAmount} onChange={onChange("depositAmount")} placeholder="Optional" />
        </div>

        <div>
          <label className="text-sm font-medium">Max occupants</label>
          <Input value={form.maxOccupancy} onChange={onChange("maxOccupancy")} placeholder="Optional" />
        </div>
      </div>

      {/* UTILITIES */}
      <div className="grid sm:grid-cols-2 gap-6 border-t pt-6">
        <div>
          <span className="text-sm font-medium">Utilities included</span>
          <div className="mt-2 space-y-1">
            {UTILITY_OPTIONS.map((u) => (
              <label key={u} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.utilitiesIncluded.includes(u)}
                  onChange={() => toggleUtility("utilitiesIncluded", u)}
                />
                {u}
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm font-medium">Utilities NOT included</span>
          <div className="mt-2 space-y-1">
            {UTILITY_OPTIONS.map((u) => (
              <label key={u} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.utilitiesNotIncluded.includes(u)}
                  onChange={() => toggleUtility("utilitiesNotIncluded", u)}
                />
                {u}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* IDEAL RENTER */}
      <div className="border-t pt-6 space-y-2">
        <span className="text-sm font-medium">Ideal renter (optional)</span>

        <select
          className="border rounded px-3 py-2 text-sm"
          value={form.preferredTenantType}
          onChange={onChange("preferredTenantType")}
        >
          <option value="">Select...</option>
          {IDEAL_RENTER_OPTIONS.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* PET POLICY — ENUM SAFE */}
      <div className="border-t pt-6 space-y-2">
        <span className="text-sm font-medium">Pet Policy</span>

        <select
          className="border rounded px-3 py-2 text-sm"
          value={form.petPolicy}
          onChange={onChange("petPolicy")}
        >
          <option value="">Select...</option>
          {PET_ENUM_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* PARKING TYPE */}
      <div className="border-t pt-6 space-y-2">
        <span className="text-sm font-medium">Parking</span>

        <select
          className="border rounded px-3 py-2 text-sm"
          value={form.parkingType}
          onChange={onChange("parkingType")}
        >
          <option value="">Select...</option>
          {PARKING_ENUM_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* LAUNDRY TYPE */}
      <div className="border-t pt-6 space-y-2">
        <span className="text-sm font-medium">Laundry</span>

        <select
          className="border rounded px-3 py-2 text-sm"
          value={form.laundry}
          onChange={onChange("laundry")}
        >
          <option value="">Select...</option>
          {LAUNDRY_ENUM_OPTIONS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {/* DESCRIPTION */}
      <div className="border-t pt-6">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={form.description}
          onChange={onChange("description")}
          className="w-full rounded border px-3 py-2 text-sm min-h-28"
          placeholder="Describe the unit, layout, amenities, nearby areas..."
        />
      </div>

      {/* SUBMIT */}
      <div className="pt-4">
        <Button
          type="submit"
          disabled={submitting}
          className="bg-[#1F6B45] text-white px-6 py-3 rounded-full"
        >
          {submitting ? "Saving…" : "Save & Continue"}
        </Button>
      </div>
    </form>
  );
}
