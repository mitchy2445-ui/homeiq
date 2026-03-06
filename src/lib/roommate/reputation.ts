// src/lib/roommate/reputation.ts

interface RoommateReviewInput {
  cleanliness: number;        // 1–5
  paymentReliability: number; // 1–5
  noiseLevel: number;         // 1–5
  respectfulness: number;     // 1–5
  communication: number;      // 1–5
  wouldLiveAgain: boolean;
}

interface ReputationScore {
  score: number;        // 0–100, rounded
  totalReviews: number;
}

/**
 * Calculates weighted score (0–100) for a single review
 */
function scoreSingleReview(review: RoommateReviewInput): number {
  // Convert 1–5 ratings to percentage (0–100)
  const cleanlinessScore = (review.cleanliness / 5) * 100;
  const paymentScore = (review.paymentReliability / 5) * 100;
  const respectScore = (review.respectfulness / 5) * 100;
  const commScore = (review.communication / 5) * 100;

  // Noise: lower is better → invert scale
  const noiseScore = ((6 - review.noiseLevel) / 5) * 100;

  // Would live again: binary
  const wouldLiveAgainScore = review.wouldLiveAgain ? 100 : 0;

  // Weighted average
  return (
    cleanlinessScore * 0.20 +
    paymentScore * 0.25 +
    respectScore * 0.20 +
    commScore * 0.15 +
    noiseScore * 0.10 +
    wouldLiveAgainScore * 0.10
  );
}

/**
 * Computes overall reputation score from multiple reviews
 * - Averages single-review scores
 * - Returns neutral baseline (75) if no reviews
 * - Rounds final score to nearest integer
 */
export function calculateReputationScore(
  reviews: RoommateReviewInput[]
): ReputationScore {
  if (reviews.length === 0) {
    return {
      score: 75,
      totalReviews: 0,
    };
  }

  const total = reviews.reduce((sum, review) => {
    return sum + scoreSingleReview(review);
  }, 0);

  const average = total / reviews.length;
  const roundedScore = Math.round(average);

  return {
    score: Math.max(0, Math.min(100, roundedScore)),
    totalReviews: reviews.length,
  };
}