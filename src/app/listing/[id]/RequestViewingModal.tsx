"use client";

import { useState, useTransition } from "react";
import { createViewingRequest } from "@/app/actions/viewings";

type Props = {
  listingId: string;
  landlordId: string;
  onClose: () => void;
};

export default function RequestViewingModal({ listingId, landlordId, onClose }: Props) {
  const [note, setNote] = useState("");
  const [slots, setSlots] = useState([
    { start: "", end: "" },
    { start: "", end: "" },
    { start: "", end: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function updateSlot(i: number, key: "start" | "end", value: string) {
    setSlots((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [key]: value };
      return next;
    });
  }

  function validateSlots(): { ok: boolean; message?: string } {
    // Half-filled slots not allowed
    for (const [i, s] of slots.entries()) {
      const bothEmpty = !s.start && !s.end;
      const bothFilled = s.start && s.end;
      if (!bothEmpty && !bothFilled) {
        return { ok: false, message: `Slot ${i + 1} must have both start and end.` };
      }
    }
    // At least one valid (start < end)
    const valid = slots.some((s) => {
      if (!s.start || !s.end) return false;
      return new Date(s.start) < new Date(s.end);
    });
    if (!valid) {
      return { ok: false, message: "Please provide at least one valid time slot." };
    }
    return { ok: true };
  }

  function submit() {
    setError(null);
    setMsg(null);

    const validation = validateSlots();
    if (!validation.ok) {
      setError(validation.message ?? "Invalid input");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createViewingRequest({
          listingId,
          landlordId,
          note,
          slot1Start: slots[0].start || undefined,
          slot1End: slots[0].end || undefined,
          slot2Start: slots[1].start || undefined,
          slot2End: slots[1].end || undefined,
          slot3Start: slots[2].start || undefined,
          slot3End: slots[2].end || undefined,
        });
        if (res?.ok) {
          setMsg("Request submitted!");
          setTimeout(onClose, 1200);
        } else {
          setError("Failed to submit request.");
        }
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError("Unexpected error");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Request a Viewing</h2>

        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        {msg && <div className="mb-3 text-sm text-green-700">{msg}</div>}

        <label className="block mb-3">
          <span className="text-sm text-gray-600">Note to landlord (optional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2"
          />
        </label>

        <div className="space-y-3">
          {slots.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="datetime-local"
                value={s.start}
                onChange={(e) => updateSlot(i, "start", e.target.value)}
                className="flex-1 rounded-xl border px-3 py-2"
              />
              <input
                type="datetime-local"
                value={s.end}
                onChange={(e) => updateSlot(i, "end", e.target.value)}
                className="flex-1 rounded-xl border px-3 py-2"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border px-4 py-2 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={pending}
            className="rounded-xl bg-emerald-600 text-white px-4 py-2 hover:opacity-95"
          >
            {pending ? "Submitting..." : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
