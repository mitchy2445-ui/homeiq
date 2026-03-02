"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Home,
  Thermometer,
  Volume2,
  Sun,
  FileText,
  Shield,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type UtilitiesIncluded = {
  heat: boolean;
  water: boolean;
  electricity: boolean;
  internet: boolean;
};

type FormData = {
  description: string;
  houseRules: string;
  rulesNotes: string;

  heating: string;
  cooling: string;
  noiseLevel: string;
  naturalLight: string;
  interiorNotes: string;
  buildingAmenitiesNotes: string;

  parkingType: string;
  petPolicy: string;
  laundry: string;

  utilitiesIncluded: UtilitiesIncluded;
};

const NOISE_LEVELS = [
  { value: "VERY_QUIET", label: "Very quiet" },
  { value: "MOSTLY_QUIET", label: "Mostly quiet" },
  { value: "AVERAGE", label: "Average" },
  { value: "LIVELY", label: "Lively" },
] as const;

const LIGHT_LEVELS = [
  { value: "LOW", label: "Low" },
  { value: "MODERATE", label: "Moderate" },
  { value: "BRIGHT", label: "Bright" },
  { value: "VERY_BRIGHT", label: "Very bright" },
] as const;

const PARKING_OPTIONS = [
  { value: "STREET", label: "Street parking" },
  { value: "ON_SITE", label: "On-site parking" },
  { value: "NONE", label: "No parking" },
] as const;

const PET_OPTIONS = [
  { value: "NONE", label: "No pets" },
  { value: "CATS", label: "Cats only" },
  { value: "DOGS", label: "Dogs only" },
  { value: "CATS_AND_DOGS", label: "Cats & dogs OK" },
  { value: "RESTRICTED", label: "With restrictions" },
] as const;

const LAUNDRY_OPTIONS = [
  { value: "IN_UNIT", label: "In-unit" },
  { value: "SHARED", label: "Shared" },
  { value: "NONE", label: "None" },
] as const;

export default function DetailsPage({
  listingId,
  initialData,
}: {
  listingId: string;
  initialData?: Partial<FormData> | null;
}) {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    description: initialData?.description ?? "",
    houseRules: initialData?.houseRules ?? "",
    rulesNotes: initialData?.rulesNotes ?? "",

    heating: initialData?.heating ?? "",
    cooling: initialData?.cooling ?? "",
    noiseLevel: initialData?.noiseLevel ?? "",
    naturalLight: initialData?.naturalLight ?? "",
    interiorNotes: initialData?.interiorNotes ?? "",
    buildingAmenitiesNotes: initialData?.buildingAmenitiesNotes ?? "",

    parkingType: initialData?.parkingType ?? "",
    petPolicy: initialData?.petPolicy ?? "",
    laundry: initialData?.laundry ?? "",

    utilitiesIncluded: {
      heat: initialData?.utilitiesIncluded?.heat ?? false,
      water: initialData?.utilitiesIncluded?.water ?? false,
      electricity: initialData?.utilitiesIncluded?.electricity ?? false,
      internet: initialData?.utilitiesIncluded?.internet ?? false,
    },
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Auto-save on change (debounced in real app — simplified here for clarity)
  useEffect(() => {
    const save = async () => {
      if (saving) return;
      setSaving(true);

      try {
        const payload = {
          description: form.description.trim() || null,
          houseRules: form.houseRules.trim() || null,
          rulesNotes: form.rulesNotes.trim() || null,

          heating: form.heating.trim() || null,
          cooling: form.cooling.trim() || null,
          noiseLevel: form.noiseLevel || null,
          naturalLight: form.naturalLight || null,
          interiorNotes: form.interiorNotes.trim() || null,
          buildingAmenitiesNotes: form.buildingAmenitiesNotes.trim() || null,

          parkingType: form.parkingType || null,
          petPolicy: form.petPolicy || null,
          laundry: form.laundry || null,

          utilitiesIncluded: form.utilitiesIncluded,
        };

        const res = await fetch(`/api/host/listings/${listingId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Save failed");
      } catch (err) {
        setError("Failed to save — try again");
        console.error(err);
      } finally {
        setSaving(false);
      }
    };

    const timer = setTimeout(save, 800);
    return () => clearTimeout(timer);
  }, [form, listingId, saving]);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateUtility = (key: keyof UtilitiesIncluded, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      utilitiesIncluded: { ...prev.utilitiesIncluded, [key]: checked },
    }));
  };

  const isComplete =
    form.description.trim() &&
    form.houseRules.trim() &&
    form.parkingType &&
    form.petPolicy &&
    form.laundry;

  return (
    <div className="min-h-screen bg-neutral-50/40">
      <div className="mx-auto max-w-4xl px-5 sm:px-8 py-12 lg:py-16 space-y-16">
        {/* Header - exact match to Basics */}
        <header className="space-y-4 max-w-2xl">
          <div className="text-sm font-medium tracking-wide text-neutral-500 uppercase">
            Step 2 of 5 · Details
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
            Tell renters what it’s like to live here
          </h1>
          <p className="text-lg text-neutral-600">
            Describe the space, comfort, rules, and what’s included.
          </p>
        </header>

        {/* Section 1: Description */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-neutral-700" />
            <h2 className="text-2xl font-semibold">Description</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-neutral-700">
                Full description
              </Label>
              <Textarea
                id="description"
                placeholder="A bright two-bedroom apartment with large windows and hardwood floors. Located steps from shops, parks, and transit — perfect for professionals or small families..."
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                className="min-h-[160px] rounded-xl border border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="houseRules" className="text-sm font-medium text-neutral-700">
                House rules
              </Label>
              <Textarea
                id="houseRules"
                placeholder="No smoking inside, no parties, quiet hours 10 PM – 8 AM, etc."
                value={form.houseRules}
                onChange={(e) => update("houseRules", e.target.value)}
                className="min-h-[120px] rounded-xl border border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rulesNotes" className="text-sm font-medium text-neutral-700">
                Additional notes
              </Label>
              <Textarea
                id="rulesNotes"
                placeholder="Shoes off at door, garbage sorting required..."
                value={form.rulesNotes}
                onChange={(e) => update("rulesNotes", e.target.value)}
                className="min-h-[100px] rounded-xl border border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Comfort */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <Home className="h-6 w-6 text-neutral-700" />
            <h2 className="text-2xl font-semibold">Comfort & environment</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="heating" className="text-sm font-medium text-neutral-700">
                Heating
              </Label>
              <Input
                id="heating"
                placeholder="Forced air, baseboard, in-floor..."
                value={form.heating}
                onChange={(e) => update("heating", e.target.value)}
                className="rounded-xl border border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cooling" className="text-sm font-medium text-neutral-700">
                Cooling
              </Label>
              <Input
                id="cooling"
                placeholder="Central AC, window units, fans..."
                value={form.cooling}
                onChange={(e) => update("cooling", e.target.value)}
                className="rounded-xl border border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">Noise level</Label>
              <div className="grid grid-cols-2 gap-3">
                {NOISE_LEVELS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update("noiseLevel", opt.value)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center text-sm font-medium transition-all",
                      form.noiseLevel === opt.value
                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                        : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">Natural light</Label>
              <div className="grid grid-cols-2 gap-3">
                {LIGHT_LEVELS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update("naturalLight", opt.value)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center text-sm font-medium transition-all",
                      form.naturalLight === opt.value
                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                        : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3 space-y-2">
              <Label htmlFor="interiorNotes" className="text-sm font-medium text-neutral-700">
                Interior notes
              </Label>
              <Textarea
                id="interiorNotes"
                placeholder="Hardwood floors, updated kitchen, high ceilings..."
                value={form.interiorNotes}
                onChange={(e) => update("interiorNotes", e.target.value)}
                className="min-h-[100px] rounded-xl border border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 space-y-2">
              <Label htmlFor="buildingAmenitiesNotes" className="text-sm font-medium text-neutral-700">
                Building amenities
              </Label>
              <Textarea
                id="buildingAmenitiesNotes"
                placeholder="Elevator, gym, rooftop terrace, bike storage..."
                value={form.buildingAmenitiesNotes}
                onChange={(e) => update("buildingAmenitiesNotes", e.target.value)}
                className="min-h-[100px] rounded-xl border border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </section>

        {/* Section 3: Policies */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-neutral-700" />
            <h2 className="text-2xl font-semibold">Policies</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">Parking</Label>
              <div className="grid grid-cols-1 gap-2">
                {PARKING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update("parkingType", opt.value)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center text-sm font-medium transition-all",
                      form.parkingType === opt.value
                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                        : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">Pet policy</Label>
              <div className="grid grid-cols-1 gap-2">
                {PET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update("petPolicy", opt.value)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center text-sm font-medium transition-all",
                      form.petPolicy === opt.value
                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                        : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">Laundry</Label>
              <div className="grid grid-cols-1 gap-2">
                {LAUNDRY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update("laundry", opt.value)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center text-sm font-medium transition-all",
                      form.laundry === opt.value
                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                        : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Utilities */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-neutral-700" />
            <h2 className="text-2xl font-semibold">Utilities included</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(["heat", "water", "electricity", "internet"] as const).map((util) => (
              <label
                key={util}
                className={cn(
                  "flex items-center gap-3 p-5 rounded-xl border-2 transition-all cursor-pointer",
                  form.utilitiesIncluded[util]
                    ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                    : "border-neutral-200 hover:border-neutral-300 hover:bg-white"
                )}
              >
                <Checkbox
                  checked={form.utilitiesIncluded[util]}
                  onCheckedChange={(checked) => updateUtility(util, !!checked)}
                  className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <span className="font-medium capitalize">{util}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Footer - exact match to Basics */}
        <footer className="pt-12 border-t flex items-center justify-between">
          <div className="text-sm text-neutral-500">
            {saving ? "Saving…" : "Changes saved automatically"}
          </div>

          <Button
            size="lg"
            disabled={!isComplete || saving}
            onClick={() => router.push(`/host/media?id=${listingId}`)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-10 py-6 text-base font-medium transition min-w-[180px]"
          >
            Continue
          </Button>
        </footer>

        {error && <p className="text-red-600 text-center pt-4">{error}</p>}
      </div>
    </div>
  );
}