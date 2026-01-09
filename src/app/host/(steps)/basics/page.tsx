"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { nextPath } from "@/lib/listingWizard";

const PROVINCES_CA = [
  "MB", "SK", "AB", "BC", "ON", "QC",
  "NB", "NS", "PE", "NL", "YT", "NT", "NU",
];

const UTILITY_OPTIONS = [
  "Heat",
  "Water",
  "Electricity",
  "Gas",
  "Internet",
  "Garbage",
  "Parking",
];

const IDEAL_RENTER_OPTIONS = [
  "Students",
  "Young professionals",
  "Families",
  "Couples",
  "Single tenant",
  "Quiet / low-noise tenants",
  "No strong preference",
];

const PET_OPTIONS = [
  "No pets",
  "Cats allowed",
  "Dogs allowed",
  "Cats & dogs allowed",
  "Small pets considered",
  "Pets allowed with approval",
];

const PARKING_OPTIONS = [
  "Outdoor stall included",
  "Covered / underground spot",
  "Street parking available",
  "Visitor parking available",
  "No dedicated parking",
];

const LAUNDRY_OPTIONS = [
  "In-suite laundry",
  "Laundry in building",
  "Shared / coin-op on site",
  "No laundry on property",
];

type FormState = {
  title: string;
  street: string;
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

  preferredTenantType: string; // free text
  preferredTenantSelected: string[];

  petPolicy: string;
  petOptionsSelected: string[];

  parkingDetails: string;
  parkingOptionsSelected: string[];

  laundryDetails: string;
  laundryOptionsSelected: string[];

  utilitiesIncluded: string[];
  utilitiesNotIncluded: string[];
};

export default function BasicsForm() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    title: "",
    street: "",
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

    preferredTenantType: "",
    preferredTenantSelected: [],

    petPolicy: "",
    petOptionsSelected: [],

    parkingDetails: "",
    parkingOptionsSelected: [],

    laundryDetails: "",
    laundryOptionsSelected: [],

    utilitiesIncluded: [],
    utilitiesNotIncluded: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /** Fix: no `any`, strong typed handler */
  const setField =
    (key: keyof FormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  function toggleUtility(
    key: "utilitiesIncluded" | "utilitiesNotIncluded",
    value: string
  ) {
    setForm((f) => {
      const current = new Set(f[key]);
      const otherKey =
        key === "utilitiesIncluded" ? "utilitiesNotIncluded" : "utilitiesIncluded";

      current.has(value) ? current.delete(value) : current.add(value);

      const other = new Set(f[otherKey]);
      if (other.has(value)) other.delete(value);

      return {
        ...f,
        [key]: [...current],
        [otherKey]: [...other],
      };
    });
  }

  /** Fix: single select for pets */
  function toggleOption(
    key:
      | "preferredTenantSelected"
      | "petOptionsSelected"
      | "parkingOptionsSelected"
      | "laundryOptionsSelected",
    value: string
  ) {
    setForm((f) => {
      if (key === "petOptionsSelected") {
        return { ...f, petOptionsSelected: [value] };
      }

      const s = new Set(f[key]);
      s.has(value) ? s.delete(value) : s.add(value);
      return { ...f, [key]: [...s] };
    });
  }

  function buildSelection(selected: string[], notes: string) {
    const parts = [...selected];
    if (notes.trim()) parts.push(notes.trim());
    return parts.join("; ");
  }

  /** Fix: typed submit handler */
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const title = form.title.trim();
    const street = form.street.trim();
    const city = form.city.trim();
    const province = form.province.trim();
    const postal = form.postal.trim().toUpperCase();
    const beds = Number(form.beds);
    const baths = Number(form.baths);
    const price = Number(form.monthlyPrice.trim().replace(/[, ]+/g, ""));
    const description = form.description.trim();

    if (title.length < 10) return setError("Title must be at least 10 characters.");
    if (!street) return setError("Street is required.");
    if (!city) return setError("City is required.");
    if (!province) return setError("Province required.");
    if (!postal) return setError("Postal required.");
    if (!Number.isFinite(beds)) return setError("Beds must be a number.");
    if (!Number.isFinite(baths)) return setError("Baths must be a number.");
    if (!Number.isFinite(price)) return setError("Invalid price.");
    if (description.length < 80) return setError("Description must be at least 80 characters.");

    /** FIX: No unused expression */
    const idealRenterSummary = form.preferredTenantSelected.length
      ? `Ideal for ${form.preferredTenantSelected.join(", ").toLowerCase()}.`
      : form.preferredTenantType.trim()
      ? `Ideal for ${form.preferredTenantType.trim().toLowerCase()}.`
      : null;

    const petSummary = buildSelection(form.petOptionsSelected, form.petPolicy);
    const parkingSummary = buildSelection(
      form.parkingOptionsSelected,
      form.parkingDetails
    );
    const laundrySummary = buildSelection(
      form.laundryOptionsSelected,
      form.laundryDetails
    );

    setSubmitting(true);

    const res = await fetch("/api/host/listings", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        street,
        city,
        province,
        postal,
        beds,
        baths,
        monthlyPrice: price,
        propertyType: form.propertyType || null,
        description,

        isFurnished: form.isFurnished || null,
        depositAmount: form.depositAmount
          ? Number(form.depositAmount) * 100
          : null,
        maxOccupancy: form.maxOccupancy ? Number(form.maxOccupancy) : null,
        minLeaseMonths: form.minLeaseMonths
          ? Number(form.minLeaseMonths)
          : null,
        availableFrom: form.availableFrom || null,

        // summaries
        idealRenterSummary,
        petSummary,
        parkingSummary,
        laundrySummary,

        utilitiesIncluded: form.utilitiesIncluded,
        utilitiesNotIncluded: form.utilitiesNotIncluded,
      }),
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
      {error && (
        <div className="rounded-md border border-red-500 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* TITLE */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Listing title</label>
        <Input
          placeholder="Modern 2-bedroom suite"
          value={form.title}
          onChange={setField("title")}
        />
      </div>

      {/* ADDRESS */}
      <div className="space-y-4 border-t pt-6">
        <h2 className="text-base font-semibold">Address</h2>
        <Input
          placeholder="Street address"
          value={form.street}
          onChange={setField("street")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Input
            placeholder="City"
            value={form.city}
            onChange={setField("city")}
          />
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={form.province}
            onChange={setField("province")}
          >
            <option value="">Province</option>
            {PROVINCES_CA.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>

          <Input
            placeholder="Postal code"
            value={form.postal}
            onChange={setField("postal")}
          />

          <Input disabled value="Canada" />
        </div>
      </div>

      {/* HOME SETUP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-6">
        <div>
          <label className="text-sm font-medium">Beds</label>
          <Input value={form.beds} onChange={setField("beds")} />
        </div>

        <div>
          <label className="text-sm font-medium">Baths</label>
          <Input value={form.baths} onChange={setField("baths")} />
        </div>

        <div>
          <label className="text-sm font-medium">Property type</label>
          <select
            className="mt-1 rounded-md border px-3 py-2 text-sm"
            value={form.propertyType}
            onChange={setField("propertyType")}
          >
            <option value="">Select…</option>
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
          <Input
            placeholder="1250"
            value={form.monthlyPrice}
            onChange={setField("monthlyPrice")}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Deposit (CAD)</label>
          <Input
            placeholder="Optional"
            value={form.depositAmount}
            onChange={setField("depositAmount")}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Max occupants</label>
          <Input
            placeholder="Optional"
            value={form.maxOccupancy}
            onChange={setField("maxOccupancy")}
          />
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
          <span className="text-sm font-medium">Utilities not included</span>
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
      <div className="space-y-2 border-t pt-6">
        <span className="text-sm font-medium">Ideal renter</span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {IDEAL_RENTER_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={form.preferredTenantSelected.includes(opt)}
                onChange={() =>
                  toggleOption("preferredTenantSelected", opt)
                }
              />
              {opt}
            </label>
          ))}
        </div>

        <Input
          placeholder="Other notes"
          value={form.preferredTenantType}
          onChange={setField("preferredTenantType")}
        />
      </div>

      {/* PETS — SINGLE SELECT */}
      <div className="space-y-2 border-t pt-6">
        <span className="text-sm font-medium">Pets</span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PET_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={form.petOptionsSelected[0] === opt}
                onChange={() => toggleOption("petOptionsSelected", opt)}
              />
              {opt}
            </label>
          ))}
        </div>

        <Input
          placeholder="Notes (optional)"
          value={form.petPolicy}
          onChange={setField("petPolicy")}
        />
      </div>

      {/* PARKING */}
      <div className="space-y-2 border-t pt-6">
        <span className="text-sm font-medium">Parking</span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PARKING_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={form.parkingOptionsSelected.includes(opt)}
                onChange={() => toggleOption("parkingOptionsSelected", opt)}
              />
              {opt}
            </label>
          ))}
        </div>

        <Input
          placeholder="Parking notes"
          value={form.parkingDetails}
          onChange={setField("parkingDetails")}
        />
      </div>

      {/* LAUNDRY */}
      <div className="space-y-2 border-t pt-6">
        <span className="text-sm font-medium">Laundry</span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {LAUNDRY_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={form.laundryOptionsSelected.includes(opt)}
                onChange={() => toggleOption("laundryOptionsSelected", opt)}
              />
              {opt}
            </label>
          ))}
        </div>

        <Input
          placeholder="Laundry notes"
          value={form.laundryDetails}
          onChange={setField("laundryDetails")}
        />
      </div>

      {/* DESCRIPTION */}
      <div className="space-y-2 border-t pt-6">
        <label className="text-sm font-medium">Description</label>
        <textarea
          className="w-full min-h-28 rounded-md border px-3 py-2 text-sm"
          value={form.description}
          onChange={setField("description")}
          placeholder="Describe the unit, layout, amenities, nearby points of interest…"
        />
      </div>

      {/* SUBMIT BUTTON */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="
            rounded-full 
            bg-[#1F6B45] 
            text-white 
            px-6 py-3 
            text-sm font-medium 
            shadow-sm
            disabled:opacity-60
            disabled:cursor-not-allowed
          "
        >
          {submitting ? "Saving…" : "Save & Continue"}
        </button>
      </div>
    </form>
  );
}
