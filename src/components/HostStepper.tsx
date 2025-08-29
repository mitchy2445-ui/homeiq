"use client";

import { Check, Home, Images, BadgeDollarSign, ClipboardCheck } from "lucide-react";

function cn(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

const STEPS = [
  { key: "basics",  label: "Basics",  Icon: Home },
  { key: "media",   label: "Media",   Icon: Images },
  { key: "pricing", label: "Pricing", Icon: BadgeDollarSign },
  { key: "review",  label: "Review",  Icon: ClipboardCheck },
] as const;

export default function HostStepper({ current }: { current: typeof STEPS[number]["key"] }) {
  const idx = STEPS.findIndex(s => s.key === current);

  return (
    <div className="mb-6">
      {/* Bar */}
      <div className="mb-3 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-600 transition-all"
          style={{ width: `${(idx / (STEPS.length - 1)) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <ol className="grid grid-cols-4 gap-3">
        {STEPS.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          const Icon = s.Icon;
          return (
            <li
              key={s.key}
              className={cn(
                "rounded-xl border p-3 text-sm flex items-center gap-2",
                active && "border-brand-300 bg-brand-50 font-medium",
                done && "border-green-200 bg-green-50 text-green-800",
                !active && !done && "border-gray-200 bg-white text-gray-600"
              )}
            >
              {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              <span>{s.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
