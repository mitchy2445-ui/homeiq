// src/lib/listingWizard.ts

// The 6 steps of the landlord listing wizard, in order.
export type WizardStep =
  | "basics"
  | "details"
  | "photos"
  | "video"
  | "neighborhood"
  | "review";

export const WIZARD_ORDER: WizardStep[] = [
  "basics",
  "details",
  "photos",
  "video",
  "neighborhood",
  "review",
];

const BASE = "/landlord/new";

/**
 * Build the URL for a given step.
 * All steps after basics expect ?id=<listingId> in the URL.
 */
export function pathFor(step: WizardStep, listingId?: string) {
  const q = listingId ? `?id=${encodeURIComponent(listingId)}` : "";

  switch (step) {
    case "basics":
      // basics can create the listing, so it normally doesn't need an id
      return `${BASE}/basics`;

    case "details":
      return `${BASE}/details${q}`;

    case "photos":
      return `${BASE}/photos${q}`;

    case "video":
      return `${BASE}/video${q}`;

    case "neighborhood":
      return `${BASE}/neighborhood${q}`;

    case "review":
      return `${BASE}/review${q}`;
  }
}

/**
 * Next step in the wizard.
 */
export function nextPath(current: WizardStep, listingId: string) {
  const i = WIZARD_ORDER.indexOf(current);
  const next = WIZARD_ORDER[Math.min(i + 1, WIZARD_ORDER.length - 1)];
  return pathFor(next, listingId);
}

/**
 * Previous step in the wizard.
 */
export function prevPath(current: WizardStep, listingId: string) {
  const i = WIZARD_ORDER.indexOf(current);
  const prev = WIZARD_ORDER[Math.max(i - 1, 0)];
  return pathFor(prev, listingId);
}
