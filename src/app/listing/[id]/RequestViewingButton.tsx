"use client";
import { useState } from "react";
import RequestViewingModal from "./RequestViewingModal";
import { CalendarClock } from "lucide-react";

export default function RequestViewingButton({ listingId, landlordId }:{
  listingId: string; landlordId: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 shadow hover:shadow-md border text-sm"
      >
        <CalendarClock className="w-4 h-4" />
        Request virtual viewing
      </button>
      {open && (
        <RequestViewingModal
          listingId={listingId}
          landlordId={landlordId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
