"use client";
import { useState, useTransition } from "react";
import { createViewingRequest } from "@/app/actions/viewings";
import { X } from "lucide-react";

type Props = {
  listingId: string;
  landlordId: string;
  onClose: () => void;
};

function toISOLocal(dt: string) {
  // incoming from <input type="datetime-local"> (no timezone), treat as local and convert to ISO
  if (!dt) return undefined;
  const d = new Date(dt);
  return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,19) + "Z";
}

export default function RequestViewingModal({ listingId, landlordId, onClose }: Props) {
  const [note, setNote] = useState("");
  const [slot1Start, setSlot1Start] = useState(""); const [slot1End, setSlot1End] = useState("");
  const [slot2Start, setSlot2Start] = useState(""); const [slot2End, setSlot2End] = useState("");
  const [slot3Start, setSlot3Start] = useState(""); const [slot3End, setSlot3End] = useState("");

  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Request virtual viewing</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-zinc-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-zinc-600 mb-4">
          Propose up to three 30–60 min windows (your local time). The landlord will confirm one.
        </p>

        {/* Slots */}
        <div className="space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-600">Slot {i} start</label>
                <input
                  type="datetime-local"
                  className="w-full mt-1 rounded-xl border px-3 py-2"
                  value={i===1?slot1Start: i===2?slot2Start:slot3Start}
                  onChange={(e)=> (i===1?setSlot1Start: i===2?setSlot2Start:setSlot3Start)(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-600">Slot {i} end</label>
                <input
                  type="datetime-local"
                  className="w-full mt-1 rounded-xl border px-3 py-2"
                  value={i===1?slot1End: i===2?slot2End:slot3End}
                  onChange={(e)=> (i===1?setSlot1End: i===2?setSlot2End:setSlot3End)(e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="mt-4">
          <label className="text-xs text-zinc-600">Message (optional)</label>
          <textarea
            className="w-full mt-1 rounded-xl border px-3 py-2 min-h-[80px]"
            placeholder="Anything the landlord should know?"
            value={note}
            onChange={(e)=>setNote(e.target.value)}
          />
        </div>

        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
        {ok && <div className="mt-3 text-sm text-green-600">Request sent!</div>}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2 border">Close</button>
          <button
            disabled={pending}
            onClick={()=>{
              setErr(null);
              startTransition(async ()=>{
                try {
                  const res = await createViewingRequest({
                    listingId, landlordId, note,
                    slot1Start: toISOLocal(slot1Start), slot1End: toISOLocal(slot1End),
                    slot2Start: toISOLocal(slot2Start), slot2End: toISOLocal(slot2End),
                    slot3Start: toISOLocal(slot3Start), slot3End: toISOLocal(slot3End),
                  });
                  if (res?.ok) setOk(true);
                } catch (e:any) {
                  setErr(e?.message || "Failed to send request");
                }
              });
            }}
            className="rounded-xl px-4 py-2 border bg-black text-white"
          >
            {pending ? "Sending..." : "Send request"}
          </button>
        </div>
      </div>
    </div>
  );
}
