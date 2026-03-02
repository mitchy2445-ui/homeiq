// src/lib/listingWizard.ts

/**
 * The 6 steps of the landlord listing wizard, in sequential order.
 */
export type WizardStep =
  | "basics"
  | "details"
  | "photos"
  | "video"
  | "neighborhood"
  | "review";

export const WIZARD_ORDER: readonly WizardStep[] = [
  "basics",
  "details",
  "photos",
  "video",
  "neighborhood",
  "review",
] as const;

/**
 * Base path prefix for all wizard steps.
 * IMPORTANT: This must match your actual route structure.
 */
const BASE = "/host";

/**
 * Returns the full URL path for a given wizard step.
 *
 * Rules enforced:
 * - "basics" step → NEVER includes ?id= (even if id is provided)
 * - All other steps → REQUIRE ?id= (throws if id is missing)
 * - Output format: /host/{step}?id=xxx (except basics)
 */
export function pathFor(step: WizardStep, listingId?: string): string {
  if (step === "basics") {
    // Basics does NOT use id — it creates the listing
    return `${BASE}/basics`;
  }

  // Every other step REQUIRES a listing ID
  if (!listingId) {
    throw new Error(
      `listingId is required for step "${step}". ` +
      `Cannot generate path without an existing draft ID.`
    );
  }

  const query = `?id=${encodeURIComponent(listingId)}`;

  switch (step) {
    case "details":
      return `${BASE}/details${query}`;
    case "photos":
      return `${BASE}/photos${query}`;
    case "video":
      return `${BASE}/video${query}`;
    case "neighborhood":
      return `${BASE}/neighborhood${query}`;
    case "review":
      return `${BASE}/review${query}`;
    default:
      // Exhaustive check (TS should prevent this, but good safety)
      const _exhaustive: never = step;
      throw new Error(`Unknown wizard step: ${step}`);
  }
}

/**
 * Returns the path to the NEXT step in the wizard.
 * Always includes ?id= for non-basics steps.
 *
 * @param current - The current step
 * @param listingId - Required for all steps (even if current is basics)
 * @returns Path to the next step (or stays on review if already there)
 */
export function nextPath(current: WizardStep, listingId: string): string {
  const currentIndex = WIZARD_ORDER.indexOf(current);
  if (currentIndex === -1) {
    throw new Error(`Invalid current step: ${current}`);
  }

  // If already on the last step, stay there
  const nextIndex = Math.min(currentIndex + 1, WIZARD_ORDER.length - 1);
  const nextStep = WIZARD_ORDER[nextIndex];

  return pathFor(nextStep, listingId);
}

/**
 * Returns the path to the PREVIOUS step in the wizard.
 * Always includes ?id= for non-basics steps.
 *
 * @param current - The current step
 * @param listingId - Required for all steps (even if current is basics)
 * @returns Path to the previous step (or stays on basics if already there)
 */
export function prevPath(current: WizardStep, listingId: string): string {
  const currentIndex = WIZARD_ORDER.indexOf(current);
  if (currentIndex === -1) {
    throw new Error(`Invalid current step: ${current}`);
  }

  // If already on the first step, stay there
  const prevIndex = Math.max(currentIndex - 1, 0);
  const prevStep = WIZARD_ORDER[prevIndex];

  return pathFor(prevStep, listingId);
}