"use client";

import { useRef, useState } from "react";
import Image from "next/image";

type Props = {
  photos: string[];
  setPhotos: (urls: string[]) => void;
  videoUrl: string | null;
  setVideoUrl: (url: string | null) => void;
};

/* ------------------------- type guards / helpers ------------------------- */

type SignSuccess = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getErrorMessage(x: unknown): string {
  if (typeof x === "string") return x;
  if (isRecord(x) && typeof x.error === "string") return x.error;
  if (isRecord(x) && isRecord(x.error) && typeof x.error.message === "string") {
    return x.error.message;
  }
  if (isRecord(x) && typeof x.message === "string") return x.message;
  return "Upload failed";
}

function isSignSuccess(x: unknown): x is SignSuccess {
  return (
    isRecord(x) &&
    typeof x.timestamp === "number" &&
    typeof x.signature === "string" &&
    typeof x.apiKey === "string" &&
    typeof x.cloudName === "string" &&
    typeof x.folder === "string"
  );
}

function hasSecureUrl(x: unknown): x is { secure_url: string } {
  return isRecord(x) && typeof x.secure_url === "string";
}

/* ----------------------------------------------------------------------- */

export default function MediaStep({ photos, setPhotos, videoUrl, setVideoUrl }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  async function uploadToCloudinarySigned(
    file: File,
    resourceType: "image" | "video"
  ): Promise<string> {
    // 1) get signature from our server
    const signRes = await fetch("/api/cloudinary/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "homeiq/uploads" }),
    });

    const signCT = signRes.headers.get("content-type") || "";
    const signBody: unknown = signCT.includes("application/json")
      ? await signRes.json()
      : await signRes.text();

    if (!signRes.ok || !isSignSuccess(signBody)) {
      throw new Error(getErrorMessage(signBody));
    }

    const { cloudName, apiKey, timestamp, signature, folder } = signBody;

    // 2) browser → Cloudinary direct upload
    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", apiKey);
    fd.append("timestamp", String(timestamp));
    fd.append("signature", signature);
    fd.append("folder", folder);

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    const upRes = await fetch(endpoint, { method: "POST", body: fd });

    const upCT = upRes.headers.get("content-type") || "";
    const upBody: unknown = upCT.includes("application/json")
      ? await upRes.json()
      : await upRes.text();

    if (!upRes.ok || !hasSecureUrl(upBody)) {
      throw new Error(getErrorMessage(upBody));
    }
    return upBody.secure_url;
  }

  async function uploadFile(file: File, resourceType: "image" | "video") {
    setUploading(true);
    setProgressText(`Uploading ${resourceType}…`);
    try {
      return await uploadToCloudinarySigned(file, resourceType);
    } finally {
      setUploading(false);
      setProgressText(null);
    }
  }

  async function handleAddImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      const urls: string[] = [];
      for (const f of files) {
        const url = await uploadFile(f, "image");
        urls.push(url);
      }
      setPhotos([...(photos || []), ...urls]);
    } catch (err) {
      alert("Image upload failed. Check console.");
      console.error(err);
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  async function handleAddVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = (e.target.files || [])[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, "video");
      setVideoUrl(url);
    } catch (err) {
      alert("Video upload failed. Check console.");
      console.error(err);
    } finally {
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }

  function makeCover(i: number) {
    const cp = [...photos];
    const [cover] = cp.splice(i, 1);
    setPhotos([cover, ...cp]);
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= photos.length) return;
    const cp = [...photos];
    const tmp = cp[i];
    cp[i] = cp[j];
    cp[j] = tmp;
    setPhotos(cp);
  }

  function remove(i: number) {
    const cp = [...photos];
    cp.splice(i, 1);
    setPhotos(cp);
  }

  return (
    <div className="space-y-8">
      {/* Header / progress */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Media</h2>
        {uploading && <span className="text-sm text-gray-500">{progressText}</span>}
      </div>

      {/* Photos */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Photos</h3>
          <div>
            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleAddImages}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              className="rounded-xl px-4 py-2 bg-emerald-600 text-white hover:shadow-md disabled:opacity-60"
            >
              + Add
            </button>
          </div>
        </div>

        {photos?.length ? (
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((url, i) => (
              <li key={url} className="rounded-2xl border p-2 flex flex-col gap-2">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden">
                  <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => makeCover(i)}
                      className="text-xs rounded-lg px-2 py-1 border"
                      title="Make cover"
                    >
                      Make cover
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    className="text-xs rounded-lg px-2 py-1 border"
                    disabled={i === 0}
                    title="Move left"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    className="text-xs rounded-lg px-2 py-1 border"
                    disabled={i === photos.length - 1}
                    title="Move right"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="text-xs rounded-lg px-2 py-1 border text-red-600"
                    title="Remove"
                  >
                    Remove
                  </button>
                </div>
                {i === 0 && (
                  <span className="text-[11px] text-emerald-700 font-medium">Cover image</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Add a few photos—first one becomes the cover.</p>
        )}
      </section>

      {/* Video */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Video (optional)</h3>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleAddVideo}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploading}
            className="rounded-xl px-4 py-2 bg-emerald-600 text-white hover:shadow-md disabled:opacity-60"
          >
            Upload video
          </button>
          {videoUrl && (
            <button
              type="button"
              onClick={() => setVideoUrl(null)}
              className="rounded-xl px-3 py-2 border text-sm"
            >
              Remove
            </button>
          )}
        </div>

        {videoUrl ? (
          <video
            controls
            src={videoUrl}
            className="w-full rounded-2xl border"
            aria-label="Listing video"
          />
        ) : (
          <p className="text-sm text-gray-500">MP4 recommended, ~60s. We’ll host it for you.</p>
        )}
      </section>
    </div>
  );
}
