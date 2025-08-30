// src/app/host/(steps)/media/MediaClient.tsx
"use client";

import * as React from "react";
import { Images, Film, ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";

type Props = {
  defaultImages: string[];
  defaultVideoUrl?: string;
  // server action from the parent server component
  saveAction: (formData: FormData) => void | Promise<void>;
};

export default function MediaClient({ defaultImages, defaultVideoUrl = "", saveAction }: Props) {
  const [images, setImages] = React.useState<string[]>(defaultImages);
  const [videoUrl, setVideoUrl] = React.useState(defaultVideoUrl);
  const [newUrl, setNewUrl] = React.useState("");

  function addUrl(e: React.FormEvent) {
    e.preventDefault();
    const u = newUrl.trim();
    if (!u) return;
    setImages((cur) => (cur.includes(u) ? cur : [...cur, u]));
    setNewUrl("");
  }

  function removeUrl(u: string) {
    setImages((cur) => cur.filter((x) => x !== u));
  }

  // Build a FormData on submit so the server action can persist it
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("imageUrlsCsv", images.join("\n"));
    fd.set("videoUrl", videoUrl);
    await saveAction(fd); // server action
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <section className="rounded-xl border p-4">
        <div className="text-sm font-medium flex items-center gap-2 mb-3">
          <Images className="h-4 w-4" />
          Photos (paste URLs for now)
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {images.map((u) => (
            <div key={u} className="relative rounded-lg border overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-32 w-full object-cover" />
              <button
                type="button"
                onClick={() => removeUrl(u)}
                className="absolute top-2 right-2 rounded-full bg-white/90 p-1 shadow"
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={addUrl} className="mt-3 flex items-center gap-2">
          <input
            type="url"
            placeholder="https://example.com/photo.jpg"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1 rounded-lg border px-3 py-2"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-2">
          We’ll wire real uploads (camera/gallery) next. For now, paste image URLs.
        </p>
      </section>

      <section className="rounded-xl border p-4">
        <div className="text-sm font-medium flex items-center gap-2 mb-3">
          <Film className="h-4 w-4" /> Video (URL)
        </div>
        <input
          type="url"
          placeholder="https://example.com/tour.mp4"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        />
        <p className="text-xs text-gray-500 mt-2">
          Accepts mp4 links (≤ 60s recommended). You can host on Cloudinary/S3 for now.
        </p>
      </section>

      <div className="flex justify-between">
        <a
          href="/host/basics"
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </a>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 text-white px-5 py-3 font-medium hover:opacity-95"
        >
          <ArrowRight className="h-4 w-4" /> Continue
        </button>
      </div>

      {/* hidden fields used by server action (filled in onSubmit) */}
      <input type="hidden" name="imageUrlsCsv" value={images.join("\n")} readOnly />
      <input type="hidden" name="videoUrl" value={videoUrl} readOnly />
    </form>
  );
}
