import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { $Enums } from "@prisma/client";
import { redirect } from "next/navigation";
import HostStepper from "@/components/HostStepper";
import ConfirmLeave from "@/components/ConfirmLeave";
import Uploader from "@/components/Uploader";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MediaStep() {
  const s = await requireSession("/host/media");
  const draft = await db.listing.findFirst({ where: { landlordId: s.sub, status: $Enums.Status.DRAFT }, orderBy: { updatedAt: "desc" } });
  if (!draft) redirect("/host/basics");

  async function save(formData: FormData) {
    "use server";
    const ss = await requireSession("/host/media");
    const images = JSON.parse(String(formData.get("images") || "[]")) as string[];
    const videoUrl = String(formData.get("videoUrl") || "");
    await db.listing.update({ where: { id: draft!.id, landlordId: ss.sub }, data: { images, videoUrl: videoUrl || null } });
    redirect("/host/neighborhood");
  }

  return (
    <>
      <HostStepper current="media" />
      <div className="mb-4 rounded-xl border border-gray-100 p-4 bg-gray-50/60 text-sm text-gray-700 flex gap-2">
        <Info className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
        <p>Add at least one photo. Drag to reorder. MP4 video is optional.</p>
      </div>

      <ConfirmLeave enabled={true} />

      <form action={save} className="space-y-5">
        {/* Uploader is client-side, binds to a hidden input named 'images' */}
        <ImagesField initial={Array.isArray(draft?.images) ? (draft!.images as string[]) : []} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Video URL (optional)</span>
          <input name="videoUrl" defaultValue={draft?.videoUrl ?? ""} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
        </label>
        <div className="flex justify-between">
          <a href="/host/basics" className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-gray-50"><ArrowLeft className="h-4 w-4" /> Back</a>
          <button className="inline-flex items-center gap-2 rounded-xl bg-brand-600 text-white px-5 py-3 font-medium hover:opacity-95"><ArrowRight className="h-4 w-4" /> Continue</button>
        </div>
      </form>
    </>
  );
}

function ImagesField({ initial }: { initial: string[] }) {
  "use client";
  const [urls, setUrls] = useState<string[]>(initial);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current!.value = JSON.stringify(urls); }, [urls]);

  return (
    <>
      <Uploader value={urls} onChange={setUrls} minImages={1} />
      <input ref={inputRef} type="hidden" name="images" />
    </>
  );
}

import { useEffect, useRef, useState } from "react";
