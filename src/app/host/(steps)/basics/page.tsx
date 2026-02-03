"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { nextPath } from "@/lib/listingWizard";

const PROVINCES_CA = [
  "MB", "SK", "AB", "BC", "ON", "QC", "NB", "NS", "PE", "NL", "YT", "NT", "NU",
] as const;

const UTILITY_OPTIONS = [
  "Heat", "Water", "Electricity", "Gas", "Internet", "Garbage", "Parking",
] as const;


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

  preferredTenantType: string;
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



export default function BasicsPage() {
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
  const [error, setError] = useState<string | null>(null);

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (
    key: "utilitiesIncluded" | "utilitiesNotIncluded",
    value: string
  ) => {
    setForm((prev) => {
      const arr = [...prev[key]];
      const otherKey = key === "utilitiesIncluded" ? "utilitiesNotIncluded" : "utilitiesIncluded";
      const otherArr = [...prev[otherKey]];

      const index = arr.indexOf(value);
      if (index !== -1) {
        arr.splice(index, 1);
      } else {
        arr.push(value);
        const otherIndex = otherArr.indexOf(value);
        if (otherIndex !== -1) otherArr.splice(otherIndex, 1);
      }

      return {
        ...prev,
        [key]: arr,
        [otherKey]: otherArr,
      };
    });
  };

 

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Basic client-side validation
    const trimmedTitle = form.title.trim();
    const trimmedStreet = form.street.trim();
    const trimmedCity = form.city.trim();
    const trimmedProvince = form.province.trim();
    const trimmedPostal = form.postal.trim().toUpperCase().replace(/\s/g, "");
    const bedsNum = parseInt(form.beds, 10);
    const bathsNum = parseInt(form.baths, 10);
    const priceStr = form.monthlyPrice.trim().replace(/[^0-9.]/g, "");
    const priceNum = parseFloat(priceStr);
    const trimmedDesc = form.description.trim();

    if (trimmedTitle.length < 10) {
      setError("Title must be at least 10 characters.");
      setSubmitting(false);
      return;
    }
    if (!trimmedStreet || !trimmedCity || !trimmedProvince || !trimmedPostal) {
      setError("Full address is required.");
      setSubmitting(false);
      return;
    }
    if (isNaN(bedsNum) || bedsNum < 0) {
      setError("Beds must be a valid non-negative number.");
      setSubmitting(false);
      return;
    }
    if (isNaN(bathsNum) || bathsNum < 1) {
      setError("Baths must be at least 1.");
      setSubmitting(false);
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Monthly price must be greater than 0.");
      setSubmitting(false);
      return;
    }
    if (trimmedDesc.length < 80) {
      setError("Description must be at least 80 characters.");
      setSubmitting(false);
      return;
    }

    try {
      // Step 1: Create draft listing (minimal)
      const createRes = await fetch("/api/host/listings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!createRes.ok) {
        const err = await createRes.json() as { error?: string };
        throw new Error(err.error ?? "Failed to create draft listing");
      }

      const { id } = await createRes.json() as { id: string };

      // Step 2: Immediately PATCH the new listing with form data
      const patchRes = await fetch(`/api/host/listings/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          street: trimmedStreet,
          city: trimmedCity,
          province: trimmedProvince,
          postal: trimmedPostal,
          country: "Canada",

          beds: bedsNum,
          baths: bathsNum,
          priceCents: Math.round(priceNum * 100),

          propertyType: form.propertyType || undefined,
          description: trimmedDesc,

          isFurnished: form.isFurnished || undefined,
          depositCents: form.depositAmount
            ? Math.round(parseFloat(form.depositAmount.replace(/[^0-9.]/g, "")) * 100)
            : undefined,
          maxOccupants: form.maxOccupancy ? parseInt(form.maxOccupancy, 10) : undefined,
          minLeaseMonths: form.minLeaseMonths ? parseInt(form.minLeaseMonths, 10) : undefined,
          availableFrom: form.availableFrom || undefined,

          idealRenterSummary: form.preferredTenantSelected.length
            ? `Ideal for ${form.preferredTenantSelected.join(", ").toLowerCase()}.`
            : form.preferredTenantType.trim()
              ? `Ideal for ${form.preferredTenantType.trim().toLowerCase()}.`
              : undefined,

          petSummary: form.petOptionsSelected.length
            ? form.petOptionsSelected[0] + (form.petPolicy.trim() ? `; ${form.petPolicy.trim()}` : "")
            : undefined,

          parkingSummary: form.parkingOptionsSelected.length
            ? form.parkingOptionsSelected.join(", ") +
              (form.parkingDetails.trim() ? `; ${form.parkingDetails.trim()}` : "")
            : undefined,

          laundrySummary: form.laundryOptionsSelected.length
            ? form.laundryOptionsSelected.join(", ") +
              (form.laundryDetails.trim() ? `; ${form.laundryDetails.trim()}` : "")
            : undefined,

          utilitiesIncluded: form.utilitiesIncluded.length ? form.utilitiesIncluded : undefined,
          utilitiesNotIncluded: form.utilitiesNotIncluded.length ? form.utilitiesNotIncluded : undefined,
        }),
      });

      if (!patchRes.ok) {
        const err = await patchRes.json() as { error?: string };
        throw new Error(err.error ?? "Failed to save listing details");
      }

      // Success: redirect to next step
      router.push(nextPath("details", id));
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Create New Listing – Basics</h1>

      <form onSubmit={handleSubmit} className="space-y-10">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Listing Title *</Label>
          <Input
            id="title"
            placeholder="e.g. Bright 2-Bedroom Downtown Condo"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            required
          />
        </div>

        {/* Address */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Address</h2>
          <div className="space-y-4">
            <Input
              placeholder="Street Address"
              value={form.street}
              onChange={(e) => updateField("street", e.target.value)}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="City"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                required
              />
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={form.province}
                onChange={(e) => updateField("province", e.target.value)}
                required
              >
                <option value="">Province</option>
                {PROVINCES_CA.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <Input
                placeholder="Postal Code"
                value={form.postal}
                onChange={(e) => updateField("postal", e.target.value.toUpperCase())}
                required
              />
              <Input value="Canada" disabled />
            </div>
          </div>
        </div>

        {/* Beds / Baths / Type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="beds">Bedrooms *</Label>
            <Input
              id="beds"
              type="number"
              min="0"
              value={form.beds}
              onChange={(e) => updateField("beds", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="baths">Bathrooms *</Label>
            <Input
              id="baths"
              type="number"
              min="1"
              step="0.5"
              value={form.baths}
              onChange={(e) => updateField("baths", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="propertyType">Property Type</Label>
            <select
              id="propertyType"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.propertyType}
              onChange={(e) => updateField("propertyType", e.target.value)}
            >
              <option value="">Select type</option>
              <option>Apartment</option>
              <option>Condo</option>
              <option>House</option>
              <option>Basement suite</option>
              <option>Townhouse</option>
              <option>Room in shared home</option>
            </select>
          </div>
        </div>

        {/* Price & Occupancy */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="monthlyPrice">Monthly Rent (CAD) *</Label>
            <Input
              id="monthlyPrice"
              type="text"
              inputMode="numeric"
              placeholder="1,250"
              value={form.monthlyPrice}
              onChange={(e) => updateField("monthlyPrice", e.target.value)}
              required
            />
          </div>
          {/* Add other optional fields like deposit, maxOccupancy, etc. similarly */}
        </div>

        {/* Utilities */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Utilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Label className="mb-3 block">Included in Rent</Label>
              {UTILITY_OPTIONS.map((u) => (
                <div key={u} className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id={`inc-${u}`}
                    checked={form.utilitiesIncluded.includes(u)}
                    onCheckedChange={() => toggleArrayItem("utilitiesIncluded", u)}
                  />
                  <Label htmlFor={`inc-${u}`}>{u}</Label>
                </div>
              ))}
            </div>
            <div>
              <Label className="mb-3 block">Not Included</Label>
              {UTILITY_OPTIONS.map((u) => (
                <div key={u} className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id={`not-${u}`}
                    checked={form.utilitiesNotIncluded.includes(u)}
                    onCheckedChange={() => toggleArrayItem("utilitiesNotIncluded", u)}
                  />
                  <Label htmlFor={`not-${u}`}>{u}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe the property, features, vibe..."
            className="min-h-[120px]"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            required
          />
        </div>

        {/* Submit */}
        <div className="pt-6">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-green-700 hover:bg-green-800 px-8 py-6 text-lg"
          >
            {submitting ? "Saving..." : "Save & Continue to Details"}
          </Button>
        </div>
      </form>
    </div>
  );
}