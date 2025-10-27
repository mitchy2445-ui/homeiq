// src/app/landlord/new/photos/PhotoUploader.tsx
"use client";

import { useRef, useState } from "react";

export type Photo = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
};

type Props = {
  listingId: string;
  initialPhotos: ReadonlyArray<Photo>;
  cloudName: string;
  uploadPreset: string;
  maxCount?: number;       // default 30
  minRecommended?: number; // default 5
};

export default function PhotoUploader({
  listingId,
  initialPhotos,
  cloudName,
  uploadPreset,
  maxCount = 30,
  minRecommended = 5,
}: Props) {
  const [photos, setPhotos] = useState<Photo[]>([...initialPhotos]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = Math.max(0, maxCount - photos.length);

  function pickFiles() {
    inputRef.current?.click();
  }

  async function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    setError("");

    const toUpload = files.slice(0, remaining);
    if (toUpload.length === 0) {
      setError(`You’ve reached the max of ${maxCount} photos.`);
      // reset input so same files can be chosen again later
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setBusy(true);
    try {
      const uploaded = await Promise.all(toUpload.map(uploadToCloudinary));

      // Now persist each to our API
      for (const u of uploaded) {
        const res = await fetch(`/api/host/listings/${encodeURIComponent(listingId)}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ url: u.secure_url, alt: "", publicId: u.public_id }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(body?.error ?? "Failed to save a photo.");
          break;
        }
        const created = body?.photo as Photo | undefined;
        if (created) {
          setPhotos((p) => {
            const next = [...p, created];
            return next.sort((a, b) => a.sortOrder - b.sortOrder);
          });
        }
      }
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function uploadToCloudinary(file: File): Promise<{ secure_url: string; public_id: string }> {
    if (!/^image\//.test(file.type)) {
      throw new Error("Only image files are allowed.");
    }
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", uploadPreset);

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const res = await fetch(url, { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok || !json?.secure_url) {
      throw new Error(json?.error?.message || "Cloudinary upload error");
    }
    return { secure_url: String(json.secure_url), public_id: String(json.public_id) };
  }

  async function onDelete(photoId: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        `/api/host/listings/${encodeURIComponent(listingId)}/photos/${encodeURIComponent(photoId)}`,
        { method: "DELETE", credentials: "include" }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error ?? "Failed to delete photo.");
        return;
      }
      setPhotos((p) => p.filter((ph) => ph.id !== photoId));
    } catch {
      setError("Network error while deleting.");
    } finally {
      setBusy(false);
    }
  }

  // Simple reorder controls (left/right). Drag&drop can be added later.
  async function move(photoId: string, dir: -1 | 1) {
    const idx = photos.findIndex((p) => p.id === photoId);
    if (idx < 0) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= photos.length) return;

    const newOrder = [...photos];
    const [a, b] = [newOrder[idx], newOrder[swapIdx]];
    newOrder[idx] = { ...b, sortOrder: a.sortOrder };
    newOrder[swapIdx] = { ...a, sortOrder: b.sortOrder };

    // Optimistic UI
    setPhotos(newOrder);

    try {
      const orderedIds = newOrder.map((p) => p.id);
      const res = await fetch(
        `/api/host/listings/${encodeURIComponent(listingId)}/photos/reorder`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ photoIds: orderedIds }),
        }
      );
      if (!res.ok) {
        // revert on failure
        setPhotos(photos);
      }
    } catch {
      setPhotos(photos);
    }
  }

  return (
    <section className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-gray-600">
          Upload JPG or PNG. We recommend at least {minRecommended} photos.
        </p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            onClick={pickFiles}
            disabled={busy || remaining <= 0}
          >
            {busy ? "Uploading…" : `Upload photos (${remaining} left)`}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onFilesSelected}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">Max {maxCount} photos.</p>
      </div>

      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((ph, i) => (
          <li key={ph.id} className="rounded-xl border overflow-hidden">
            <div className="relative h-40 w-full bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ph.url} alt={ph.alt || "Listing photo"} className="h-full w-full object-cover" />
            </div>
            <div className="flex items-center gap-2 p-2 text-xs">
              <button
                type="button"
                className="rounded border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                onClick={() => move(ph.id, -1)}
                disabled={busy || i === 0}
                aria-label="Move left"
              >
                ←
              </button>
              <button
                type="button"
                className="rounded border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                onClick={() => move(ph.id, +1)}
                disabled={busy || i === photos.length - 1}
                aria-label="Move right"
              >
                →
              </button>
              <span className="ml-auto text-gray-500">#{i + 1}</span>
              <button
                type="button"
                className="ml-2 rounded border px-2 py-1 hover:bg-red-50 disabled:opacity-50"
                onClick={() => onDelete(ph.id)}
                disabled={busy}
                aria-label="Delete"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
