import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Bus, Users, Volume2, Sparkles } from "lucide-react";
import { NeighborhoodVibe, AreaType } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function strOrNull(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default async function NeighborhoodPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const listingId = params.id;

  const session = await requireSession("/host/neighborhood");

  if (!listingId) redirect("/host/basics");

  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      landlordId: true,
      neighborhoodVibe: true,
      areaType: true,
      neighborhoodCommunity: true,
      neighborhoodSafety: true,
      neighborhoodWalkability: true,
      neighborhoodNoise: true,
      neighborhoodTransitNotes: true,
      neighborhoodHighlights: true,
      distanceBusMeters: true,
      distanceGroceryMeters: true,
      distanceSchoolMeters: true,
      distanceParkMeters: true,
      distancePharmacyMeters: true,
      distanceGymMeters: true,
      accessibility: true,
    },
  });

  if (!listing || listing.landlordId !== session.sub) redirect("/host/basics");

  /* ---------------- Server Actions ---------------- */

  async function save(formData: FormData): Promise<void> {
    "use server";

    const ss = await requireSession("/host/neighborhood");
    const id = String(formData.get("listingId") || "");
    if (!id) throw new Error("Missing listing id");

    const accessibilityRaw = String(formData.get("accessibility") || "");
    const accessibility = accessibilityRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    await db.listing.update({
      where: { id, landlordId: ss.sub },
      data: {
       neighborhoodVibe: (formData.get("neighborhoodVibe") || null) as NeighborhoodVibe | null,
areaType: (formData.get("areaType") || null) as AreaType | null,

        neighborhoodCommunity: strOrNull(formData.get("neighborhoodCommunity")),
        neighborhoodSafety: strOrNull(formData.get("neighborhoodSafety")),
        neighborhoodWalkability: strOrNull(formData.get("neighborhoodWalkability")),
        neighborhoodNoise: strOrNull(formData.get("neighborhoodNoise")),
        neighborhoodTransitNotes: strOrNull(formData.get("neighborhoodTransitNotes")),
        neighborhoodHighlights: strOrNull(formData.get("neighborhoodHighlights")),

        distanceBusMeters: numOrNull(formData.get("distanceBusMeters")),
        distanceGroceryMeters: numOrNull(formData.get("distanceGroceryMeters")),
        distanceSchoolMeters: numOrNull(formData.get("distanceSchoolMeters")),
        distanceParkMeters: numOrNull(formData.get("distanceParkMeters")),
        distancePharmacyMeters: numOrNull(formData.get("distancePharmacyMeters")),
        distanceGymMeters: numOrNull(formData.get("distanceGymMeters")),

        accessibility,
      },
    });
  }

  async function continueNext(formData: FormData): Promise<void> {
    "use server";
    await save(formData);
    redirect(`/host/review?id=${listingId}`);
  }

  /* ---------------- Initial Data ---------------- */

  const accessibility = Array.isArray(listing.accessibility)
    ? listing.accessibility.join(", ")
    : "";

  /* ---------------- Render ---------------- */

  return (
    <div className="min-h-screen bg-neutral-50/40">
      <div className="mx-auto max-w-4xl px-5 sm:px-8 py-12 lg:py-16 space-y-16">
        {/* Header */}
        <header className="space-y-4 max-w-2xl">
          <div className="text-sm font-medium tracking-wide text-neutral-500 uppercase">
            Step 4 of 5 · Neighborhood
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
            What’s the neighborhood like?
          </h1>
          <p className="text-lg text-neutral-600">
            Help renters understand the lifestyle, safety, and convenience of the area.
          </p>
        </header>

        {/* Form wrapper */}
        <form id="neighborhood-form" action={save}>
          <input type="hidden" name="listingId" value={listing.id} />

          {/* Section 1: Overview */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <Heart className="h-6 w-6 text-neutral-700" />
              <h2 className="text-2xl font-semibold">Overview</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="neighborhoodVibe" className="text-sm font-medium text-neutral-700">
                  Neighborhood vibe
                </Label>
                <select
                  id="neighborhoodVibe"
                  name="neighborhoodVibe"
                  defaultValue={listing.neighborhoodVibe ?? ""}
                  className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                >
                  <option value="">Select vibe…</option>
                  <option value="QUIET">Quiet / peaceful</option>
                  <option value="MODERATE">Moderate activity</option>
                  <option value="BUSY">Busy / vibrant</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="areaType" className="text-sm font-medium text-neutral-700">
                  Area type
                </Label>
                <select
                  id="areaType"
                  name="areaType"
                  defaultValue={listing.areaType ?? ""}
                  className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                >
                  <option value="">Select area…</option>
                  <option value="URBAN">Urban</option>
                  <option value="SUBURBAN">Suburban</option>
                  <option value="RURAL">Rural</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Getting Around */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <Bus className="h-6 w-6 text-neutral-700" />
              <h2 className="text-2xl font-semibold">Getting around</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="neighborhoodTransitNotes" className="text-sm font-medium text-neutral-700">
                  Public transit & commuting
                </Label>
                <Textarea
                  id="neighborhoodTransitNotes"
                  name="neighborhoodTransitNotes"
                  defaultValue={listing.neighborhoodTransitNotes ?? ""}
                  placeholder="Bus stops nearby, train access, walkable to downtown..."
                  className="min-h-[120px] rounded-xl border border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhoodHighlights" className="text-sm font-medium text-neutral-700">
                  Nearby highlights & conveniences
                </Label>
                <Textarea
                  id="neighborhoodHighlights"
                  name="neighborhoodHighlights"
                  defaultValue={listing.neighborhoodHighlights ?? ""}
                  placeholder="Parks within 5 min walk, grocery stores, restaurants..."
                  className="min-h-[120px] rounded-xl border border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Community & Atmosphere */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-neutral-700" />
              <h2 className="text-2xl font-semibold">Community & atmosphere</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {[
                { id: "neighborhoodSafety", name: "neighborhoodSafety", label: "Safety", placeholder: "Generally safe, well-lit streets..." },
                { id: "neighborhoodWalkability", name: "neighborhoodWalkability", label: "Walkability", placeholder: "Very walkable, sidewalks everywhere..." },
                { id: "neighborhoodCommunity", name: "neighborhoodCommunity", label: "Community feel", placeholder: "Friendly neighbors, families..." },
                { id: "neighborhoodNoise", name: "neighborhoodNoise", label: "Noise levels", placeholder: "Quiet at night, some street noise..." },
              ].map((item) => (
                <div key={item.id} className="space-y-2">
                  <Label htmlFor={item.id} className="text-sm font-medium text-neutral-700">
                    {item.label}
                  </Label>
                  <Textarea
                    id={item.id}
                    name={item.name}
                    defaultValue={(listing[item.name as keyof typeof listing] as string) ?? ""}
                    placeholder={item.placeholder}
                    className="min-h-[100px] rounded-xl border border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Accessibility */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-neutral-700" />
              <h2 className="text-2xl font-semibold">Accessibility</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessibility" className="text-sm font-medium text-neutral-700">
                Accessibility features (comma-separated)
              </Label>
              <Input
                id="accessibility"
                name="accessibility"
                defaultValue={accessibility}
                placeholder="elevator, step-free entrance, wide doorways, roll-in shower..."
                className="rounded-xl border border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
              <p className="text-sm text-neutral-500">
                List features that make the property or building more accessible.
              </p>
            </div>
          </section>

          {/* Footer */}
          <footer className="pt-12 border-t flex items-center justify-between">
            <a
              href={`/host/media?id=${listingId}`}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              ← Back
            </a>

            <div className="flex gap-4">
              <button
                form="neighborhood-form"
                formAction={save}
                type="submit"
                className="rounded-xl border px-6 py-3 hover:bg-gray-50 text-sm font-medium transition"
              >
                Save
              </button>

              <button
                form="neighborhood-form"
                formAction={continueNext}
                type="submit"
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 font-medium transition"
              >
                Continue
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}