// src/app/host/onboarding/ResendOtpButton.tsx
"use client";
import { useEffect, useState } from "react";

type Props = {
  formAction: (formData: FormData) => void | Promise<void>;
  seconds?: number;
};

export default function ResendOtpButton({ formAction, seconds = 30 }: Props) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [left]);

  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={left > 0}
      onClick={() => {
        if (left === 0) setLeft(seconds);
      }}
      className="rounded-xl border px-4 py-2 hover:bg-gray-50 disabled:opacity-60"
    >
      {left > 0 ? `Resend in ${left}s` : "Send code"}
    </button>
  );
}
