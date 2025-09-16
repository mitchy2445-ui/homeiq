// src/app/host/viewings/DecideForm.tsx
"use client";

import { decideViewingRequest } from "@/app/actions/viewings";
import { useState, useTransition } from "react";

type Req = {
  id: string;
  status: "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED";
  slot1Start?: string | null; slot1End?: string | null;
  slot2Start?: string | null; slot2End?: string | null;
  slot3Start?: string | null; slot3End?: string | null;
};

function fmtISO(d?: string | null) {
  return d ? new Date(d).toLocaleString() : "—";
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    // Some frameworks throw serialized errors
    return JSON.stringify(err);
  } catch {
    return "Action failed";
  }
}

export default function DecideForm({ req }: { req: Req }) {
  const [chosen, setChosen] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const options: Array<{ label: string; start: string; end: string }> = [
    req.slot1Start && req.slot1End
      ? { label: `Slot 1 (${fmtISO(req.slot1Start)} – ${fmtISO(req.slot1End)})`, start: req.slot1Start, end: req.slot1End }
      : undefined,
    req.slot2Start && req.slot2End
      ? { label: `Slot 2 (${fmtISO(req.slot2Start)} – ${fmtISO(req.slot2End)})`, start: req.slot2Start, end: req.slot2End }
      : undefined,
    req.slot3Start && req.slot3End
      ? { label: `Slot 3 (${fmtISO(req.slot3Start)} – ${fmtISO(req.slot3End)})`, start: req.slot3Start, end: req.slot3End }
      : undefined,
  ].filter(Boolean) as Array<{ label: string; start: string; end: string }>;

  function act(action: "APPROVE" | "DECLINE" | "CANCEL") {
    setErr(null);
    setMsg(null);
    startTransition(async () => {
      try {
        let chosenStart: string | undefined;
        let chosenEnd: string | undefined;

        if (action === "APPROVE") {
          const [s, e] = chosen.split("|");
          chosenStart = s;
          chosenEnd = e;
          if (!chosenStart || !chosenEnd) {
            throw new Error("Please select a time slot before approving.");
          }
        }

        const res = await decideViewingRequest({
          id: req.id,
          action,
          chosenStart,
          chosenEnd,
        });

        if (res?.ok) {
          setMsg(
            action === "APPROVE"
              ? "Approved!"
              : action === "DECLINE"
              ? "Declined."
              : "Cancelled."
          );
        } else {
          setErr("Action failed");
        }
      } catch (error: unknown) {
        setErr(getErrorMessage(error));
      }
    });
  }

  const disabled = pending || req.status !== "PENDING";

  return (
    <div className="rounded-xl border p-3">
      {err && <div className="text-sm text-red-600 mb-2">{err}</div>}
      {msg && <div className="text-sm text-green-700 mb-2">{msg}</div>}

      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <select
          disabled={disabled}
          className="w-full sm:w-auto rounded-xl border px-3 py-2"
          value={chosen}
          onChange={(e) => setChosen(e.target.value)}
        >
          <option value="">Select a slot...</option>
          {options.map((o, idx) => (
            <option key={idx} value={`${o.start}|${o.end}`}>
              {o.label}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            disabled={disabled || !chosen}
            onClick={() => act("APPROVE")}
            className="rounded-xl px-4 py-2 border bg-black text-white"
          >
            {pending ? "..." : "Approve"}
          </button>
          <button
            disabled={disabled}
            onClick={() => act("DECLINE")}
            className="rounded-xl px-4 py-2 border"
          >
            Decline
          </button>
          <button
            disabled={disabled}
            onClick={() => act("CANCEL")}
            className="rounded-xl px-4 py-2 border"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
