// src/components/roommate/ReviewSection.tsx
"use client";

import { useState } from "react";
import ReviewModal from "@/components/roommate/ReviewModal";
import { Button } from "@/components/ui/button";

interface ReviewSectionProps {
  ownerId: string;
  hasReviewed: boolean;
  reputation: {
    score: number;
    totalReviews: number;
  };
  hasReviews: boolean;
  avgCleanliness: number | null;
  avgPayment: number | null;
  avgNoise: number | null;
  avgRespect: number | null;
  avgComm: number | null;
}

export default function ReviewSection({
  ownerId,
  hasReviewed,
  reputation,
  hasReviews,
  avgCleanliness,
  avgPayment,
  avgNoise,
  avgRespect,
  avgComm,
}: ReviewSectionProps) {
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  return (
    <>
      <section className="bg-white border border-neutral-200 rounded-2xl p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">
            Reputation & Trust
          </h2>
          <p className="text-sm text-neutral-600">
            Verified roommate reviews
          </p>
        </div>

        {hasReviews ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-semibold text-neutral-900">
                  {reputation.score}%
                </div>
                <div className="text-sm text-neutral-600">
                  {reputation.totalReviews}{" "}
                  {reputation.totalReviews === 1 ? "review" : "reviews"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {avgCleanliness !== null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Cleanliness</span>
                  <span className="font-medium text-neutral-900">
                    {avgCleanliness} / 5
                  </span>
                </div>
              )}

              {avgPayment !== null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Payment reliability</span>
                  <span className="font-medium text-neutral-900">
                    {avgPayment} / 5
                  </span>
                </div>
              )}

              {avgRespect !== null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Respectfulness</span>
                  <span className="font-medium text-neutral-900">
                    {avgRespect} / 5
                  </span>
                </div>
              )}

              {avgComm !== null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Communication</span>
                  <span className="font-medium text-neutral-900">
                    {avgComm} / 5
                  </span>
                </div>
              )}

              {avgNoise !== null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Noise level</span>
                  <span className="font-medium text-neutral-900">
                    {avgNoise} / 5
                  </span>
                </div>
              )}
            </div>

            {!hasReviewed && (
              <div className="pt-6 border-t border-neutral-100">
                <Button
                  onClick={() => setIsReviewOpen(true)}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-3 text-sm font-medium transition"
                >
                  Leave a Review
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <h3 className="text-lg font-medium text-neutral-800">
              New user
            </h3>
            <p className="text-sm text-neutral-600 mt-2">
              This roommate has not received any reviews yet.
            </p>

            <Button
              onClick={() => setIsReviewOpen(true)}
              className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-3 text-sm font-medium transition"
            >
              Leave a Review
            </Button>
          </div>
        )}
      </section>

      <ReviewModal
        reviewedUserId={ownerId}
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
      />
    </>
  );
}