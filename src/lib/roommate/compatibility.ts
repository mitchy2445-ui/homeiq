// src/lib/roommate/compatibility.ts

interface Profile {
  budgetMin: number | null;
  budgetMax: number | null;
  moveInDate: Date | null;
  cleanliness: number | null;   // 1–5
  socialLevel: number | null;   // 1–5
  sleepSchedule: "EARLY" | "FLEXIBLE" | "NIGHT_OWL" | null;
  smoking: boolean | null;
  pets: boolean | null;
  age?: number | null;
  gender?: string | null;
}

interface ListingPreferences {
  preferredGender?: string | null;
  minAge?: number | null;
  maxAge?: number | null;
}

export type CompatibilityResult = {
  totalScore: number;
  primaryFactors: string[];
  secondaryFactors: string[];
  frictionFactors: string[];
};

/**
 * Calculates budget compatibility score (0–100)
 */
function scoreBudget(viewer: Profile, owner: Profile): number {
  if (
    viewer.budgetMin === null ||
    viewer.budgetMax === null ||
    owner.budgetMin === null ||
    owner.budgetMax === null
  ) {
    return 50;
  }

  const vMin = Math.min(viewer.budgetMin, viewer.budgetMax);
  const vMax = Math.max(viewer.budgetMin, viewer.budgetMax);
  const oMin = Math.min(owner.budgetMin, owner.budgetMax);
  const oMax = Math.max(owner.budgetMin, owner.budgetMax);

  if (vMin === vMax && oMin === oMax && vMin === oMin) {
    return 100;
  }

  if (vMax >= oMin && vMin <= oMax) {
    return 100;
  }

  const gap = Math.max(vMin - oMax, oMin - vMax);
  const avgRangeSize = ((vMax - vMin) + (oMax - oMin)) / 2 || 1;

  const relativeGap = gap / avgRangeSize;

  if (relativeGap <= 0.1) return 70;
  if (relativeGap <= 0.25) return 40;
  return 0;
}

/**
 * Difference-based score for cleanliness or social level (0–100)
 */
function scoreDifference(a: number | null, b: number | null): number {
  if (a === null || b === null) return 50;

  const diff = Math.abs(a - b);

  if (diff === 0) return 100;
  if (diff === 1) return 80;
  if (diff === 2) return 50;
  return 20;
}

function scoreCleanliness(viewer: Profile, owner: Profile): number {
  return scoreDifference(viewer.cleanliness, owner.cleanliness);
}

function scoreSocial(viewer: Profile, owner: Profile): number {
  return scoreDifference(viewer.socialLevel, owner.socialLevel);
}

/**
 * Move-in date compatibility (0–100)
 */
function scoreMoveIn(viewer: Profile, owner: Profile): number {
  if (!viewer.moveInDate || !owner.moveInDate) {
    return 50;
  }

  const diffMs = Math.abs(viewer.moveInDate.getTime() - owner.moveInDate.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 14) return 100;
  if (diffDays <= 30) return 80;
  if (diffDays <= 60) return 50;
  return 20;
}

/**
 * Lifestyle compatibility
 */
function scoreLifestyle(viewer: Profile, owner: Profile): number {
  let smokingScore = 60;
  if (viewer.smoking !== null && owner.smoking !== null) {
    smokingScore = viewer.smoking === owner.smoking ? 100 : 0;
  }

  let petsScore = 60;
  if (viewer.pets !== null && owner.pets !== null) {
    petsScore = viewer.pets === owner.pets ? 100 : 40;
  }

  return Math.round(smokingScore * 0.7 + petsScore * 0.3);
}

/**
 * Sleep schedule compatibility
 */
function scoreSleep(viewer: Profile, owner: Profile): number {
  if (!viewer.sleepSchedule || !owner.sleepSchedule) {
    return 60;
  }

  if (viewer.sleepSchedule === "FLEXIBLE" || owner.sleepSchedule === "FLEXIBLE") {
    return 80;
  }

  return viewer.sleepSchedule === owner.sleepSchedule ? 100 : 20;
}

/**
 * Main compatibility calculation
 */
export function calculateCompatibility(
  viewerProfile: Profile,
  ownerProfile: Profile,
  listingPrefs: ListingPreferences
): CompatibilityResult {
  const budget = scoreBudget(viewerProfile, ownerProfile);
  const cleanliness = scoreCleanliness(viewerProfile, ownerProfile);
  const social = scoreSocial(viewerProfile, ownerProfile);
  const moveIn = scoreMoveIn(viewerProfile, ownerProfile);
  const lifestyle = scoreLifestyle(viewerProfile, ownerProfile);
  const sleep = scoreSleep(viewerProfile, ownerProfile);

  // ── Classify factors ────────────────────────────────────────────────────
  const primaryFactors: string[] = [];
  const secondaryFactors: string[] = [];
  const frictionFactors: string[] = [];

  // Cleanliness
  if (cleanliness >= 80) primaryFactors.push("Cleanliness");
  else if (cleanliness >= 50) secondaryFactors.push("Cleanliness");
  else frictionFactors.push("Cleanliness");

  // Social Level
  if (social >= 80) primaryFactors.push("Social level");
  else if (social >= 50) secondaryFactors.push("Social level");
  else frictionFactors.push("Social level");

  // Sleep Schedule
  if (sleep >= 80) primaryFactors.push("Sleep schedule");
  else if (sleep >= 60) secondaryFactors.push("Sleep schedule");
  else frictionFactors.push("Sleep schedule");

  // Lifestyle
  if (lifestyle >= 80) primaryFactors.push("Lifestyle");
  else if (lifestyle >= 60) secondaryFactors.push("Lifestyle");
  else frictionFactors.push("Lifestyle");

  // Budget
  if (budget >= 80) primaryFactors.push("Budget");
  else if (budget >= 50) secondaryFactors.push("Budget");
  else frictionFactors.push("Budget");

  // Move-in Date
  if (moveIn >= 80) primaryFactors.push("Move-in date");
  else if (moveIn >= 50) secondaryFactors.push("Move-in date");
  else frictionFactors.push("Move-in date");

  // ── Gender Preference ──────────────────────────────────────────────────
  let genderScore = 60;
  if (listingPrefs.preferredGender && ownerProfile.gender) {
    if (
      listingPrefs.preferredGender === "No preference" ||
      listingPrefs.preferredGender === ownerProfile.gender
    ) {
      genderScore = 100;
      secondaryFactors.push("Gender preference");
    } else {
      genderScore = 0;
      frictionFactors.push("Gender preference");
    }
  }

  // ── Age Range ──────────────────────────────────────────────────────────
  let ageScore = 60;
  // Safe access with null/undefined check
  if (
    listingPrefs.minAge != null &&    // != null catches both null and undefined
    listingPrefs.maxAge != null &&
    ownerProfile.age != null
  ) {
    if (ownerProfile.age >= listingPrefs.minAge && ownerProfile.age <= listingPrefs.maxAge) {
      ageScore = 100;
      secondaryFactors.push("Age range");
    } else {
      ageScore = 20;
      frictionFactors.push("Age range");
    }
  }

  // ── Total score calculation (unchanged) ────────────────────────────────
  let totalScore =
    budget * 0.25 +
    cleanliness * 0.20 +
    social * 0.15 +
    moveIn * 0.15 +
    lifestyle * 0.15 +
    sleep * 0.10;

  totalScore += genderScore * 0.05;
  totalScore += ageScore * 0.05;

  totalScore = Math.round(Math.max(0, Math.min(100, totalScore)));

  return {
    totalScore,
    primaryFactors,
    secondaryFactors,
    frictionFactors,
  };
}