"use client";

import * as React from "react";

type Props = {
  listingId: string;
  cloudName: string;                 // NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  uploadPreset: string;              // NEXT_PUBLIC_CLOUDINARY_VIDEO_PRESET (unsigned + video/auto)
  maxDurationSec?: number;           // default 300 (5 min)
  maxSizeMB?: number;                // default 100 (Cloudinary free plan guideline)
};

export default function VideoUploader({
  listingId,
  cloudName,
  uploadPreset,
  maxDurationSec = 300,
  maxSizeMB = 100,
}: Props) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const [videoUrl, setVideoUrl] = React.useState<string>("");

  async function handlePick() {
    setError("");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/mp4,video/webm,video/quicktime"; // mp4/webm/mov
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // 1) Duration check (<= 5 min by default)
      const objectUrl = URL.createObjectURL(file);
      try {
        const dur = await getVideoDuration(objectUrl);
        if (!isFinite(dur) || dur > maxDurationSec) {
          setError(`Video is longer than ${Math.floor(maxDurationSec / 60)} minutes. Please trim and try again.`);
          URL.revokeObjectURL(objectUrl);
          return;
        }
      } catch {
        // If duration probing fails, we still attempt upload.
      } finally {
        URL.revokeObjectURL(objectUrl);
      }

      // 2) Size check (friendly guardrail)
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        setError(`File is larger than ${maxSizeMB}MB. Please compress/trim and try again.`);
        return;
      }

      setBusy(true);
      try {
        // 3) Upload to Cloudinary VIDEO endpoint
        const form = new FormData();
        form.append("file", file);
        form.append("upload_preset", uploadPreset);

        const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
        const res = await fetch(endpoint, { method: "POST", body: form });

        if (!res.ok) {
          const t = await res.text().catch(() => "");
          console.error("Cloudinary upload error:", res.status, t);
          if (res.status === 400 || res.status === 401) {
            setError(
              "Upload failed. Verify your Cloudinary cloud name and that the unsigned VIDEO preset exists and allows mp4/mov/webm."
            );
          } else {
            setError("Network error during upload. Please try again.");
          }
          return;
        }

        const data = await res.json();
        const url: string = data.secure_url || data.url;
        if (!url) {
          setError("Upload succeeded but no URL returned by Cloudinary.");
          return;
        }

        setVideoUrl(url);

        // 4) Persist to listing (PATCH your API)
        const save = await fetch(`/api/host/listings/${encodeURIComponent(listingId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl: url }),
        });

        if (!save.ok) {
          const t = await save.text().catch(() => "");
          console.error("Failed to save videoUrl:", t);
          setError("Uploaded, but failed to save to your listing. Please try again.");
          return;
        }
      } catch (e) {
        console.error(e);
        setError("Network error during upload. Please try again.");
      } finally {
        setBusy(false);
      }
    };
    input.click();
  }

  return (
    <div className="rounded-xl border p-4">
      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {videoUrl ? (
        <div className="space-y-3">
          <video controls className="w-full rounded-lg" src={videoUrl} />
          <div className="text-sm text-gray-600 break-all">
            Saved video:&nbsp;
            <a className="underline" href={videoUrl} target="_blank" rel="noreferrer">
              {videoUrl}
            </a>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePick}
          disabled={busy}
          className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
        >
          {busy ? "Uploading…" : "Upload video"}
        </button>
      )}
    </div>
  );
}

function getVideoDuration(src: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => resolve(v.duration || 0);
    v.onerror = reject;
    v.src = src;
  });
}
