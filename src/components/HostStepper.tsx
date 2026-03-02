"use client";

import { Check, Home, Images, BadgeDollarSign, ClipboardCheck, ShieldCheck, MapPin } from "lucide-react";

function cn(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

const STEPS = [
  { key: "onboarding", label: "Onboarding", Icon: ShieldCheck },
  { key: "basics", label: "Basics", Icon: Home },
  { key: "details", label: "Details", Icon: ClipboardCheck },
  { key: "media", label: "Media", Icon: Images },
  { key: "neighborhood", label: "Neighborhood", Icon: MapPin },
  { key: "review", label: "Review", Icon: ClipboardCheck },
] as const;

export type StepKey = typeof STEPS[number]["key"];

export default function HostStepper({ current }: { current: StepKey }) {
  const idx = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="mb-6">
      <div className="mb-3 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-600 transition-all"
          style={{ width: `${(idx / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
