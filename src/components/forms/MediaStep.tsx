"use client";

import { useRef, useState } from "react";
import Image from "next/image";

type Props = {
  photos: string[];
  setPhotos: (urls: string[]) => void;
  videoUrl: string | null;
  setVideoUrl: (url: string | null) => void;
};

export default function MediaStep({ photos, setPhotos, videoUrl, setVideoUrl }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File, resourceType: "image" | "video") {
    setUploading(true);
    setProgressText(`Uploading ${resourceType}…`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("resourceType", resourceType);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    setUploading(false);
    setProgressText(null);

    if (!res.ok) throw new Error(data?.error || "Upload failed");
    return data.url as string;
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
              className="rounded-xl px-4 py-2 bg-emerald-600 text-white hover:shadow-md"
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
              className="rounded-xl px-4 py-2 bg-emerald-600 text-white hover:shadow-md"
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
        </div>

        {videoUrl ? (
          <video
            controls
            src={videoUrl}
            className="w-full rounded-2xl border"
            aria-label="Listing video"
          />
        ) : (
          <p className="text-sm text-gray-500">
            MP4 recommended, ~60s. We’ll host it for you.
          </p>
        )}
      </section>
    </div>
  );
}
