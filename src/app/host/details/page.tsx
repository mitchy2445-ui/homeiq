"use client";

import { useSearchParams } from "next/navigation";
import DetailsForm from "@/components/listings/DetailsForm";

export default function DetailsPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-xl">
        Missing listing ID — go back to Basics
      </div>
    );
  }

  return <DetailsForm listingId={id} />;
}