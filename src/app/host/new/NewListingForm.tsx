"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const AMENITY_OPTIONS = ["Wifi","Parking","Air Conditioning","Pool","TV","Washer","Dryer","Kitchen","Gym","Pets Allowed","Fireplace","Balcony","Patio"];

function dollarsToCents(s: string) {
  const n = Number(String(s).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

type Props = { landlordId: string };

export default function NewListingForm({ landlordId }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [priceDollars, setPriceDollars] = useState("");
  const [beds, setBeds] = useState<number | "">("");
  const [baths, setBaths] = useState<number | "">("");
  const [description, setDescription] = useState("");

  const [amenities, setAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);

  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return title && city && priceDollars && (images.length > 0) && !submitting;
  }, [title, city, priceDollars, images.length, submitting]);

  function toggleAmenity(name: string) {
    setAmenities((prev) => prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]);
  }

  async function upload(kind: "images" | "videos") {
    const files = kind === "images" ? imageFiles : videoFiles;
    if (files.length === 0) return;
    kind === "images" ? setUploadingImages(true) : setUploadingVideos(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Upload failed");
      const paths = (json.files as { path: string; mime: string }[]).map((f) => f.path);
      if (kind === "images") {
        setImages((prev) => [...prev, ...paths]);
        setImageFiles([]);
      } else {
        setVideos((prev) => [...prev, ...paths]);
        setVideoFiles([]);
      }
    } catch (e) {
      alert((e as Error).message);
    } finally {
      kind === "images" ? setUploadingImages(false) : setUploadingVideos(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload = {
        title,
        city,
        price: dollarsToCents(priceDollars),
        beds: typeof beds === "number" ? beds : 0,
        baths: typeof baths === "number" ? baths : 0,
        description,
        images,           // stored as /uploads/...
        videos,           // stored as /uploads/...
        amenities,
      };
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to create listing");
      router.push(`/listing/${json.listing.id}`);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-[900px] px-4 md:px-6 lg:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-semibold">Create a new listing</h1>
      <p className="text-gray-600 mt-1">Add details, select amenities, and upload photos/videos from your device.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* title + city */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600" placeholder="Bright 2-bed apartment" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600" placeholder="Winnipeg" required />
          </div>
        </div>

        {/* price + beds + baths */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Monthly price (CAD)</label>
            <input value={priceDollars} onChange={(e) => setPriceDollars(e.target.value)} className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600" placeholder="1500" inputMode="decimal" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Beds</label>
            <input type="number" min={0} value={beds} onChange={(e) => setBeds(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600" placeholder="2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Baths</label>
            <input type="number" min={0} value={baths} onChange={(e) => setBaths(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600" placeholder="1" />
          </div>
        </div>

        {/* description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600" placeholder="Tell renters about the place, neighborhood, utilities, etc." />
        </div>

        {/* amenities chips */}
        <div>
          <label className="block text-sm font-medium mb-2">Amenities <span className="text-gray-500">({amenities.length} selected)</span></label>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((name) => {
              const active = amenities.includes(name);
              return (
                <button key={name} type="button" onClick={() => toggleAmenity(name)}
                  className={["rounded-full border px-3 py-1 text-sm", active ? "border-emerald-700 bg-emerald-700 text-white" : "border-gray-300 hover:bg-gray-50"].join(" ")}>
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        {/* image uploads */}
        <div>
          <label className="block text-sm font-medium mb-1">Photos (from your device)</label>
          <div className="rounded-xl border p-4">
            <input type="file" multiple accept="image/*" onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))} />
            <div className="mt-3 flex gap-2 flex-wrap">
              {images.map((src) => (
                <img key={src} src={src} alt="preview" className="h-24 w-24 rounded-lg object-cover border" />
              ))}
            </div>
            <button type="button" onClick={() => upload("images")} disabled={uploadingImages || imageFiles.length === 0}
              className="mt-3 rounded-full border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60">
              {uploadingImages ? "Uploading..." : "Upload selected photos"}
            </button>
          </div>
        </div>

        {/* video uploads */}
        <div>
          <label className="block text-sm font-medium mb-1">Videos (from your device)</label>
          <div className="rounded-xl border p-4">
            <input type="file" multiple accept="video/*" onChange={(e) => setVideoFiles(Array.from(e.target.files ?? []))} />
            <div className="mt-3 flex gap-2 flex-wrap">
              {videos.map((src) => (
                <video key={src} src={src} className="h-24 w-32 rounded-lg border object-cover" controls />
              ))}
            </div>
            <button type="button" onClick={() => upload("videos")} disabled={uploadingVideos || videoFiles.length === 0}
              className="mt-3 rounded-full border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60">
              {uploadingVideos ? "Uploading..." : "Upload selected videos"}
            </button>
          </div>
        </div>

        {/* submit */}
        <div className="pt-2">
          <button type="submit" disabled={!canSubmit} className="rounded-full bg-emerald-700 px-5 py-2 text-white font-medium hover:bg-emerald-800 disabled:opacity-60">
            {submitting ? "Creating..." : "Create listing"}
          </button>
        </div>
      </form>
    </main>
  );
}
