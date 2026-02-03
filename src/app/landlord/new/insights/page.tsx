"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

/* ---------------------- ENUM-LIKE OPTIONS ---------------------- */

const COMMUNITY_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "FAMILY_FRIENDLY", label: "Family-friendly" },
  { value: "STUDENT_AREA", label: "Student area" },
  { value: "TRENDY", label: "Trendy / nightlife" },
  { value: "QUIET_SUBURBAN", label: "Quiet suburban" },
  { value: "URBAN_CENTRAL", label: "Urban / central" },
  { value: "NATURE_FOCUSED", label: "Close to nature" },
] as const;

const SAFETY_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "VERY_SAFE", label: "Very safe" },
  { value: "FAIRLY_SAFE", label: "Fairly safe" },
  { value: "MIXED", label: "Mixed depending on time" },
  { value: "UNSURE", label: "Not sure" },
] as const;

const WALKABILITY_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "VERY_WALKABLE", label: "Very walkable" },
  { value: "SOMEWHAT_WALKABLE", label: "Somewhat walkable" },
  { value: "CAR_DEPENDENT", label: "Mostly car-dependent" },
] as const;

const NOISE_OPTIONS = [
  { value: "", label: "Select…" },
  { value: "VERY_QUIET", label: "Very quiet" },
  { value: "MOSTLY_QUIET", label: "Mostly quiet" },
  { value: "AVERAGE", label: "Average noise" },
  { value: "LIVELY", label: "Lively area" },
] as const;

/* ------------------------ PAGE START ------------------------ */

export default function InsightsPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const listingId = sp.get("id") ?? "";

  const [, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  /* ---------------------- FORM FIELDS ----------------------- */

  const [community, setCommunity] = React.useState("");
  const [safety, setSafety] = React.useState("");
  const [walkability, setWalkability] = React.useState("");
  const [noise, setNoise] = React.useState("");

  const [transitNotes, setTransitNotes] = React.useState("");
  const [highlights, setHighlights] = React.useState("");

  /* ---------------------- LOAD EXISTING ---------------------- */

  React.useEffect(() => {
    let active = true;

    (async () => {
      if (!listingId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/host/listings/${listingId}`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          const text = await res.text();
          setError(`Load failed (${res.status}): ${text || res.statusText}`);
          return;
        }

        const data = await res.json();

        if (!active) return;

        // Load textareas
        setTransitNotes(data.transit ?? "");
        setHighlights(data.amenities ?? "");

        // Parse neighborhoodNotes for selects
        if (data.neighborhoodNotes) {
          const lines = data.neighborhoodNotes.split('\n').map((l: string) => l.trim()).filter(Boolean);
          for (const line of lines) {
            if (line.startsWith('Vibe: ')) {
              const label = line.slice(6);
              const opt = COMMUNITY_OPTIONS.find(o => o.label === label);
              if (opt?.value) setCommunity(opt.value);
            } else if (line.startsWith('Safety: ')) {
              const label = line.slice(8);
              const opt = SAFETY_OPTIONS.find(o => o.label === label);
              if (opt?.value) setSafety(opt.value);
            } else if (line.startsWith('Walkability: ')) {
              const label = line.slice(12);
              const opt = WALKABILITY_OPTIONS.find(o => o.label === label);
              if (opt?.value) setWalkability(opt.value);
            } else if (line.startsWith('Noise level: ')) {
              const label = line.slice(12);
              const opt = NOISE_OPTIONS.find(o => o.label === label);
              if (opt?.value) setNoise(opt.value);
            }
          }
        }

      } catch {
        setError("Failed to load listing.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [listingId]);

  /* ---------------------- SAVE FUNCTION ---------------------- */

  async function save() {
    if (!listingId) return;

    // Format selects into neighborhoodNotes
    const neighborhoodLines = [
      community ? `Vibe: ${COMMUNITY_OPTIONS.find(o => o.value === community)?.label}` : null,
      safety ? `Safety: ${SAFETY_OPTIONS.find(o => o.value === safety)?.label}` : null,
      walkability ? `Walkability: ${WALKABILITY_OPTIONS.find(o => o.value === walkability)?.label}` : null,
      noise ? `Noise level: ${NOISE_OPTIONS.find(o => o.value === noise)?.label}` : null,
    ].filter(Boolean);
    const neighborhoodNotes = neighborhoodLines.length > 0 ? neighborhoodLines.join('\n') : null;

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/host/listings/${listingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          neighborhoodNotes,
          transit: transitNotes.trim() || null,
          amenities: highlights.trim() || null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(`Save failed (${res.status}): ${text || res.statusText}`);
        return;
      }

      router.replace(`/landlord/new/review?id=${listingId}`);

    } catch {
      setError("Failed to save insights.");
    } finally {
      setSaving(false);
    }
  }

  function back() {
    if (!listingId) return;
    router.replace(`/landlord/new/video?id=${listingId}`);
  }

  /* ------------------------ RENDER ------------------------ */

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* HEADER */}
      <div className="mb-6">
        <div className="text-sm text-gray-500">Step 4 of 5</div>
        <h1 className="mt-1 text-3xl font-semibold">Neighborhood insights</h1>
        <p className="mt-2 text-sm text-gray-600 max-w-2xl">
          Help renters understand what it’s like to live here—vibe, safety,
          transit access, and nearby essentials.
        </p>
        <div className="mt-4">
          <Progress value={70} className="h-2" />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="rounded-2xl shadow-sm border">
        <CardContent className="space-y-8 p-6">

          {/* COMMUNITY & OVERVIEW */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold">Community & vibe</h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Community */}
              <SelectBox
                label="Neighborhood vibe"
                value={community}
                onChange={setCommunity}
                options={COMMUNITY_OPTIONS}
              />

              {/* Safety */}
              <SelectBox
                label="Safety (your view)"
                value={safety}
                onChange={setSafety}
                options={SAFETY_OPTIONS}
              />

              {/* Walkability */}
              <SelectBox
                label="Walkability"
                value={walkability}
                onChange={setWalkability}
                options={WALKABILITY_OPTIONS}
              />

              {/* Noise */}
              <SelectBox
                label="Noise level"
                value={noise}
                onChange={setNoise}
                options={NOISE_OPTIONS}
              />
            </div>
          </section>

          {/* TRANSIT */}
          <section className="space-y-4 border-t pt-6">
            <h2 className="text-sm font-semibold">Transit & access</h2>

            <textarea
              className="w-full min-h-24 rounded-md border p-2 text-sm"
              placeholder="Describe bus routes, rapid transit, cycling, driving access…"
              value={transitNotes}
              onChange={(e) => setTransitNotes(e.target.value)}
            />
          </section>

          {/* HIGHLIGHTS */}
          <section className="space-y-4 border-t pt-6">
            <h2 className="text-sm font-semibold">Nearby amenities</h2>

            <textarea
              className="w-full min-h-24 rounded-md border p-2 text-sm"
              placeholder="List grocery stores, parks, gyms, malls, restaurants, and more…"
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
            />
          </section>

          {/* FOOTER BUTTONS */}
          <div className="flex items-center justify-between pt-6">
            <Button
              variant="outline"
              onClick={back}
              disabled={saving}
            >
              Back
            </Button>

            <Button
              onClick={save}
              disabled={saving}
              style={{ backgroundColor: "#1A6E4E", color: "#fff" }}
              className="hover:bg-[#1A6E4E] active:bg-[#1A6E4E]"
            >
              {saving ? "Saving…" : "Save & Continue"}
            </Button>
          </div>

        </CardContent>
      </Card>
    </main>
  );
}

/* ---------------------- SELECT COMPONENT ---------------------- */

function SelectBox(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <div>
      <div className="text-sm font-medium">{props.label}</div>
      <select
        className="mt-2 block w-full rounded-md border px-3 py-2 text-sm"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      >
        {props.options.map((o) => (
          <option key={o.value || "blank"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}