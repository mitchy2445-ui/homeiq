"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Home,
  Building2,
  Warehouse,
  DoorOpen,
  Building,
  MapPin,
  DollarSign,
  Users,
} from "lucide-react";

type FormData = {
  title: string;
  propertyType: string;
  street: string;
  aptUnit: string;
  city: string;
  province: string;
  postal: string;
  country: string;

  price: string;
  deposit: string;
  availableFrom: string;
  minLeaseMonths: string;

  beds: string;
  baths: string;
  maxOccupants: string;
  furnished: boolean;
  smokingAllowed: boolean;
};

type ListingPatchBody = {
  title?: string | null;
  propertyType?: string | null;
  street?: string | null;
  aptUnit?: string | null;
  city?: string | null;
  province?: string | null;
  postal?: string | null;
  country?: string | null;
  priceCents?: number | null;
  depositCents?: number | null;
  availableFrom?: string | null;
  minLeaseMonths?: number | null;
  beds?: number | null;
  baths?: number | null;
  maxOccupants?: number | null;
  furnished?: boolean | null;
  smokingAllowed?: boolean | null;
};

const PROPERTY_TYPES = [
  { value: "Apartment", label: "Apartment", icon: Building2 },
  { value: "Condo", label: "Condo", icon: Building },
  { value: "House", label: "House", icon: Home },
  { value: "Basement suite", label: "Basement suite", icon: Warehouse },
  { value: "Townhouse", label: "Townhouse", icon: Home },
  { value: "Room in shared home", label: "Room in shared home", icon: DoorOpen },
] as const;

export default function BasicsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingId = searchParams.get("id");

  const [listingId, setListingId] = useState<string | null>(existingId);
  const [form, setForm] = useState<FormData>({
    title: "",
    propertyType: "",
    street: "",
    aptUnit: "",
    city: "",
    province: "",
    postal: "",
    country: "Canada",
    price: "",
    deposit: "",
    availableFrom: "",
    minLeaseMonths: "",
    beds: "",
    baths: "",
    maxOccupants: "",
    furnished: false,
    smokingAllowed: false,
  });
  const [saving, setSaving] = useState(false);

  // Load existing data if editing
  useEffect(() => {
    if (!existingId) return;

    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/host/listings/${existingId}`, {
          credentials: "include",
        });
        if (!res.ok) return;

        const data = await res.json();

        setForm({
          title: data.title ?? "",
          propertyType: data.propertyType ?? "",
          street: data.street ?? "",
          aptUnit: data.aptUnit ?? "",
          city: data.city ?? "",
          province: data.province ?? "",
          postal: data.postal ?? "",
          country: data.country ?? "Canada",

          price: data.priceCents ? (data.priceCents / 100).toFixed(0) : "",
          deposit: data.depositCents ? (data.depositCents / 100).toFixed(0) : "",
          availableFrom: data.availableFrom
            ? new Date(data.availableFrom).toISOString().split("T")[0]
            : "",
          minLeaseMonths: data.minLeaseMonths?.toString() ?? "",

          beds: data.beds?.toString() ?? "",
          baths: data.baths?.toString() ?? "",
          maxOccupants: data.maxOccupants?.toString() ?? "",
          furnished: data.furnished ?? false,
          smokingAllowed: data.smokingAllowed ?? false,
        });
      } catch (err) {
        console.error("Failed to load listing:", err);
      }
    };

    fetchListing();
  }, [existingId]);

  // Save changes
  const saveChanges = async () => {
    if (saving) return;
    setSaving(true);

    try {
      let id = listingId;

      if (!id) {
        const res = await fetch("/api/host/listings", {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Create failed");
        const { id: newId } = await res.json();
        id = newId;
        setListingId(newId);
      }

      const body: ListingPatchBody = {
        title: form.title.trim() || null,
        propertyType: form.propertyType || null,
        street: form.street.trim() || null,
        aptUnit: form.aptUnit.trim() || null,
        city: form.city.trim() || null,
        province: form.province.trim() || null,
        postal: form.postal.trim() || null,
        country: form.country.trim() || null,

        priceCents: form.price ? Math.round(Number(form.price) * 100) : null,
        depositCents: form.deposit ? Math.round(Number(form.deposit) * 100) : null,
        availableFrom: form.availableFrom || null,
        minLeaseMonths: form.minLeaseMonths ? Number(form.minLeaseMonths) : null,

        beds: form.beds ? Number(form.beds) : null,
        baths: form.baths ? Number(form.baths) : null,
        maxOccupants: form.maxOccupants ? Number(form.maxOccupants) : null,
        furnished: form.furnished,
        smokingAllowed: form.smokingAllowed,
      };

      // Always save — never skip (this was the main bug)
      console.log("Sending PATCH with body:", body);

      const res = await fetch(`/api/host/listings/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "(no response body)");
        console.error(`PATCH failed: ${res.status} - ${errorText}`);
        throw new Error("Save failed");
      }

      console.log("Save successful");
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    saveChanges(); // Auto-save
  };

  const isComplete =
    form.title.trim() &&
    form.propertyType &&
    form.city.trim() &&
    form.beds &&
    form.baths &&
    form.price &&
    form.availableFrom &&
    form.maxOccupants;

  // Final save + navigate
  const handleContinue = async () => {
    await saveChanges();   // force final save
    if (listingId) {
      router.push(`/host/details?id=${listingId}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Progress */}
      <div className="border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-emerald-600 font-semibold">Basics</span>
            <span className="text-neutral-400">Details</span>
            <span className="text-neutral-400">Media</span>
            <span className="text-neutral-400">Neighborhood</span>
            <span className="text-neutral-400">Review</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-20">
        {/* Header */}
        <header className="space-y-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-neutral-900">
            Tell us about your place
          </h1>
          <p className="text-lg text-neutral-600">
            This information helps renters understand what you’re offering.
          </p>
        </header>

        {/* Property Identity */}
        <section className="space-y-10">
          <div className="border-t border-neutral-200 pt-16">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-8">Property Details</h2>

            <div className="space-y-8">
              {/* Title - full width */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-neutral-700">
                  Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Bright 2-bed apartment in Osborne Village"
                  value={form.title}
                  onChange={e => handleChange("title", e.target.value)}
                  className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>

              {/* Property Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-neutral-700">
                  What type of place is this?
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {PROPERTY_TYPES.map(({ value, label, icon: Icon }) => {
                    const active = form.propertyType === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleChange("propertyType", value)}
                        className={`
                          flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all
                          ${active
                            ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                            : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"}
                        `}
                      >
                        <Icon className="h-8 w-8 text-neutral-600" />
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Beds, Baths, Occupants */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="beds" className="text-sm font-medium text-neutral-700">
                    Bedrooms
                  </Label>
                  <Input
                    id="beds"
                    type="number"
                    min={0}
                    value={form.beds}
                    onChange={e => handleChange("beds", e.target.value)}
                    className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baths" className="text-sm font-medium text-neutral-700">
                    Bathrooms
                  </Label>
                  <Input
                    id="baths"
                    type="number"
                    step="0.5"
                    min={0}
                    value={form.baths}
                    onChange={e => handleChange("baths", e.target.value)}
                    className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxOccupants" className="text-sm font-medium text-neutral-700">
                    Max occupants
                  </Label>
                  <Input
                    id="maxOccupants"
                    type="number"
                    min={1}
                    value={form.maxOccupants}
                    onChange={e => handleChange("maxOccupants", e.target.value)}
                    className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-col sm:flex-row gap-10 pt-4">
                <div className="flex items-center gap-3">
                  <Switch
                    id="furnished"
                    checked={form.furnished}
                    onCheckedChange={checked => handleChange("furnished", checked)}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                  <Label htmlFor="furnished" className="text-base font-medium">
                    Furnished
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    id="smokingAllowed"
                    checked={form.smokingAllowed}
                    onCheckedChange={checked => handleChange("smokingAllowed", checked)}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                  <Label htmlFor="smokingAllowed" className="text-base font-medium">
                    Smoking allowed
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="space-y-10">
          <div className="border-t border-neutral-200 pt-16">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-8">Location</h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="street" className="text-sm font-medium text-neutral-700">
                  Street address
                </Label>
                <Input
                  id="street"
                  placeholder="123 Main Street"
                  value={form.street}
                  onChange={e => handleChange("street", e.target.value)}
                  className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aptUnit" className="text-sm font-medium text-neutral-700">
                  Apt / Unit / Suite (optional)
                </Label>
                <Input
                  id="aptUnit"
                  placeholder="Apt 4B"
                  value={form.aptUnit}
                  onChange={e => handleChange("aptUnit", e.target.value)}
                  className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium text-neutral-700">
                    City
                  </Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={e => handleChange("city", e.target.value)}
                    className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="province" className="text-sm font-medium text-neutral-700">
                    Province / Region
                  </Label>
                  <Input
                    id="province"
                    placeholder="Manitoba"
                    value={form.province}
                    onChange={e => handleChange("province", e.target.value)}
                    className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal" className="text-sm font-medium text-neutral-700">
                    Postal / ZIP code
                  </Label>
                  <Input
                    id="postal"
                    value={form.postal}
                    onChange={e => handleChange("postal", e.target.value)}
                    className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium text-neutral-700">
                    Country
                  </Label>
                  <Input
                    id="country"
                    value={form.country}
                    onChange={e => handleChange("country", e.target.value)}
                    className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="space-y-10">
          <div className="border-t border-neutral-200 pt-16">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-8">Pricing</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium text-neutral-700">
                  Monthly rent
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    className="rounded-xl border-neutral-300 pl-10 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    placeholder="1,500"
                    value={form.price}
                    onChange={e => handleChange("price", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit" className="text-sm font-medium text-neutral-700">
                  Security deposit
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                  <Input
                    id="deposit"
                    type="number"
                    min={0}
                    className="rounded-xl border-neutral-300 pl-10 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    placeholder="1,500"
                    value={form.deposit}
                    onChange={e => handleChange("deposit", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="availableFrom" className="text-sm font-medium text-neutral-700">
                  Available from
                </Label>
                <Input
                  id="availableFrom"
                  type="date"
                  value={form.availableFrom}
                  onChange={e => handleChange("availableFrom", e.target.value)}
                  className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minLeaseMonths" className="text-sm font-medium text-neutral-700">
                  Minimum lease (months)
                </Label>
                <Input
                  id="minLeaseMonths"
                  type="number"
                  min={1}
                  value={form.minLeaseMonths}
                  onChange={e => handleChange("minLeaseMonths", e.target.value)}
                  className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-12 border-t border-neutral-200 flex justify-end">
          <Button
            size="lg"
            disabled={!isComplete || saving}
            onClick={handleContinue}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 py-6 text-base font-medium transition min-w-[180px]"
          >
            {saving ? "Saving..." : "Continue"}
          </Button>
        </footer>
      </div>
    </div>
  );
}