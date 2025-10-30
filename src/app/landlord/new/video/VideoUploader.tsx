"use client";

import { useRef, useState } from "react";

type Props = {
  listingId: string;
  initialUrl?: string;
  cloudName: string;
  uploadPreset: string;
  maxDurationSec: number; // 300 = 5 mins
};

export default function VideoUploader({
  listingId,
  initialUrl = "",
  cloudName,
  uploadPreset,
  maxDurationSec,
}: Props) {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handlePick() {
    inputRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic type check
    const okTypes = ["video/mp4", "video/quicktime", "video/webm"];
    if (!okTypes.includes(file.type)) {
      setError("Please choose an MP4, MOV or WEBM video.");
      return;
    }

    // Measure duration before upload (load into a hidden <video>)
    const duration = await getVideoDuration(file).catch(() => -1);
    if (duration <= 0) {
      setError("Could not read video duration. Please try another file.");
      return;
    }
    if (duration > maxDurationSec) {
      setError(`Video is too long (${Math.round(duration)}s). Max is ${maxDurationSec}s.`);
      return;
    }

    // Upload to Cloudinary (video resource)
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", uploadPreset);

      const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
      const res = await fetch(endpoint, { method: "POST", body: form });
      const json = await res.json();

      if (!res.ok || !json?.secure_url) {
        setError(json?.error?.message || "Upload failed. Please try again.");
        return;
      }

      const videoUrl: string = json.secure_url as string;

      // Save on our backend (assumes PATCH /api/host/listings/[id] supports { videoUrl })
      const save = await fetch(`/api/host/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl }),
      });

      if (!save.ok) {
        setError("Uploaded, but failed to save video URL. Please retry.");
        return;
      }

      setCurrentUrl(videoUrl);
    } catch (err) {
      setError("Network error during upload. Please try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border p-4">
      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePick}
          className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          disabled={busy}
        >
          {busy ? "Uploading…" : currentUrl ? "Replace video" : "Upload video"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={onFileChange}
        />
        {currentUrl && (
          <span className="text-sm text-gray-600">Saved ✓</span>
        )}
      </div>

      {currentUrl && (
        <div className="mt-4">
          <video
            src={currentUrl}
            controls
            className="w-full max-w-xl rounded-xl border"
          />
        </div>
      )}
    </div>
  );
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
    };
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const d = video.duration;
      cleanup();
      resolve(d);
    };
    video.onerror = () => {
      cleanup();
      reject(new Error("metadata error"));
    };
    video.src = url;
  });
}
