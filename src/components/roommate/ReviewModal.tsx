// src/components/roommate/ReviewModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReviewModalProps {
  reviewedUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ReviewFormState {
  cleanliness: number | "";
  paymentReliability: number | "";
  noiseLevel: number | "";
  respectfulness: number | "";
  communication: number | "";
  wouldLiveAgain: boolean;
}

type RatingField =
  | "cleanliness"
  | "paymentReliability"
  | "noiseLevel"
  | "respectfulness"
  | "communication";

const ratingFields: RatingField[] = [
  "cleanliness",
  "paymentReliability",
  "noiseLevel",
  "respectfulness",
  "communication",
];

const fieldLabels: Record<RatingField, string> = {
  cleanliness: "Cleanliness",
  paymentReliability: "Payment reliability",
  noiseLevel: "Noise level",
  respectfulness: "Respectfulness",
  communication: "Communication",
};

export default function ReviewModal({
  reviewedUserId,
  isOpen,
  onClose,
}: ReviewModalProps) {
  const router = useRouter();

  const [form, setForm] = useState<ReviewFormState>({
    cleanliness: "",
    paymentReliability: "",
    noiseLevel: "",
    respectfulness: "",
    communication: "",
    wouldLiveAgain: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRatingChange = (field: RatingField, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value === "" ? "" : Number(value),
    }));
  };

  const handleWouldLiveAgainChange = (checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      wouldLiveAgain: checked,
    }));
  };

  const isFormValid =
    ratingFields.every((field) => form[field] !== "") &&
    typeof form.wouldLiveAgain === "boolean";

  const handleSubmit = async () => {
    if (!isFormValid) {
      setError("Please complete all rating fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/roommates/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewedUserId,
          cleanliness: Number(form.cleanliness),
          paymentReliability: Number(form.paymentReliability),
          noiseLevel: Number(form.noiseLevel),
          respectfulness: Number(form.respectfulness),
          communication: Number(form.communication),
          wouldLiveAgain: form.wouldLiveAgain,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      // Success
      onClose();
      router.refresh();
    } catch {
      setError("Unexpected error occurred.");
      setLoading(false);
    }
  };

  const ratingOptions = [1, 2, 3, 4, 5];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900">
            Leave a Review
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Share your experience living with this roommate.
          </p>
        </div>

        {/* Ratings */}
        <div className="space-y-4">
          {ratingFields.map((key) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-neutral-700">
                {fieldLabels[key]}
              </span>
              <select
                className="border border-neutral-300 rounded-lg px-3 py-1 text-sm"
                value={form[key]}
                onChange={(e) => handleRatingChange(key, e.target.value)}
              >
                <option value="">Select</option>
                {ratingOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Would Live Again */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-700">
            Would live with again?
          </span>
          <input
            type="checkbox"
            checked={form.wouldLiveAgain}
            onChange={(e) => handleWouldLiveAgainChange(e.target.checked)}
            className="h-4 w-4 accent-emerald-600"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || !isFormValid}
            className="px-6 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}