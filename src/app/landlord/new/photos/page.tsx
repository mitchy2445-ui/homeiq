import { redirect } from "next/navigation";
import { prisma as db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/currentUser";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";
import * as React from "react";

export const dynamic = "force-dynamic";

type CloudImage = {
  url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
};

async function requireOwner(listingId?: string) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login?next=/landlord/new/photos");

  if (!listingId) {
    const draft = await db.listing.findFirst({
      where: { landlordId: userId, status: "DRAFT" },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    if (!draft) redirect("/landlord/new/basics");
    return { userId, listingId: draft.id };
  }

  const owned = await db.listing.findFirst({
    where: { id: listingId, landlordId: userId },
    select: { id: true },
  });
  if (!owned) redirect("/landlord/new/basics");
  return { userId, listingId };
}

export default async function PhotosPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const qp = typeof searchParams?.listing === "string" ? (searchParams!.listing as string) : undefined;
  const { listingId } = await requireOwner(qp);

  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { id: true, title: true, images: true },
  });

  const existing = (listing?.images as CloudImage[] | null) || [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <div className="text-sm text-gray-500">Step 3 of 6</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Photos</h1>
        <p className="mt-2 text-gray-600">
          Upload photos for <span className="font-medium">{listing?.title || "your listing"}</span>.
        </p>
        <div className="mt-4"><Progress value={48} className="h-2" /></div>
      </div>

      <PhotoUploader listingId={listingId} initialImages={existing} />
    </main>
  );
}

/* ------------------------------- Client UI -------------------------------- */
function PhotoUploader({
  listingId,
  initialImages,
}: {
  listingId: string;
  initialImages: CloudImage[];
}) {
  "use client";

  const [images, setImages] = React.useState<CloudImage[]>(initialImages);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string>("");

  async function getSignature() {
    const res = await fetch("/api/uploads/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    if (!res.ok) throw new Error("Failed to get upload signature");
    return (await res.json()) as {
      timestamp: number;
      signature: string;
      folder: string;
      cloudName: string;
      apiKey: string;
    };
  }

  async function uploadFile(file: File) {
    const { timestamp, signature, folder, cloudName, apiKey } = await getSignature();

    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", apiKey);
    fd.append("timestamp", String(timestamp));
    fd.append("signature", signature);
    fd.append("folder", folder);

    const upl = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: "POST",
      body: fd,
    });

    const j = await upl.json();
    if (!upl.ok) throw new Error(j?.error?.message || "Upload failed");

    const img: CloudImage = {
      url: j.secure_url,
      public_id: j.public_id,
      width: j.width,
      height: j.height,
      format: j.format,
    };
    return img;
  }

  async function persist(newImages: CloudImage[]) {
    const r = await fetch(`/api/listings/${listingId}/images`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images: newImages }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j?.error || "Failed to save images");
    }
  }

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files).slice(0, 25) : [];
    if (!files.length) return;
    setBusy(true);
    setMsg("");

    try {
      const uploaded: CloudImage[] = [];
      for (const f of files) {
        uploaded.push(await uploadFile(f));
      }
      const next = [...images, ...uploaded];
      setImages(next);
      await persist(next);
      setMsg("Saved.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      e.currentTarget.value = "";
    }
  }

  async function removeAt(idx: number) {
    const next = images.filter((_, i) => i !== idx);
    setImages(next);
    try {
      await persist(next);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <Card className="rounded-2xl shadow-sm border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <label
            htmlFor="photo-input"
            className={`inline-flex cursor-pointer items-center rounded-full px-4 py-2 text-white shadow-sm ${
              busy ? "opacity-60 cursor-not-allowed" : ""
            }`}
            style={{ background: "#1A6E4E" }}
          >
            Upload photos
          </label>
          <Input id="photo-input" type="file" accept="image/*" multiple className="hidden" onChange={onSelect} />
          <div className="text-sm text-gray-500" aria-live="polite">{msg}</div>
        </div>

        {/* grid */}
        {images.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {images.map((img, i) => (
              <figure key={img.public_id} className="relative overflow-hidden rounded-xl border bg-white">
                <img src={img.url} alt={`Photo ${i + 1}`} className="h-40 w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1 shadow hover:bg-white"
                  onClick={() => removeAt(i)}
                  aria-label="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </figure>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed p-8 text-center text-sm text-gray-600">
            No photos yet. Click <span className="font-medium">Upload photos</span> to add images.
          </div>
        )}

        <div className="mt-6 flex items-center justify-end">
          <a
            href={`/landlord/new/pricing?listing=${listingId}`}
            className="rounded-full px-6 py-2 text-white"
            style={{ background: "#1A6E4E" }}
          >
            Save & continue
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
