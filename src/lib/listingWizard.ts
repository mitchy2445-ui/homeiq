export type WizardStep =
  | "basics"
  | "neighborhood"   // your “Neighborhood Insights” page
  | "description"
  | "photos"
  | "pricing"
  | "review";        // final check/publish

// 👇 Set the order you want here:
export const WIZARD_ORDER: WizardStep[] = [
  "basics",
  "neighborhood",
  "description",
  "photos",
  "pricing",
  "review",
];

// 👇 Map logical step names to your actual route segments
const ROUTE_SEGMENT: Record<WizardStep, string> = {
  basics: "basics",
  neighborhood: "insights", // folder is /landlord/new/insights
  description: "description",
  photos: "photos",
  pricing: "pricing",
  review: "review",
};

export function pathFor(step: WizardStep, id: string) {
  const seg = ROUTE_SEGMENT[step];
  return `/landlord/new/${seg}?listingId=${encodeURIComponent(id)}`;
}

export function nextStep(step: WizardStep): WizardStep | null {
  const i = WIZARD_ORDER.indexOf(step);
  return i >= 0 && i < WIZARD_ORDER.length - 1 ? WIZARD_ORDER[i + 1] : null;
}

export function prevStep(step: WizardStep): WizardStep | null {
  const i = WIZARD_ORDER.indexOf(step);
  return i > 0 ? WIZARD_ORDER[i - 1] : null;
}

export function nextPath(step: WizardStep, id: string) {
  const ns = nextStep(step);
  return ns ? pathFor(ns, id) : pathFor("review", id);
}

export function prevPath(step: WizardStep, id: string) {
  const ps = prevStep(step);
  return ps ? pathFor(ps, id) : pathFor(step, id);
}
