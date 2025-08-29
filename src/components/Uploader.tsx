"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Images, Film, Trash2, GripVertical, AlertTriangle, Camera } from "lucide-react";

type Item = { file?: File; url: string; kind: "image" | "video" };
type Props = {
  value: string[];                      // current URLs
  onChange: (urls: string[]) => void;   // emit when uploaded/reordered/deleted
  minImages?: number;                   // gate step if needed
};

const IMG_MAX = 8 * 1024 * 1024;   // 8MB
const VID_MAX = 200 * 1024 * 1024; // 200MB

export default function Uploader({ value, onChange, minImages = 1 }: Props) {
  const [items, setItems] = useState<Item[]>(
    () => value.map(u => ({ url: u, kind: isVideo(u) ? "video" : "image" }))
  );
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputImg = useRef<HTMLInputElement>(null);
  const fileInputVid = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setItems(value.map(u => ({ url: u, kind: isVideo(u) ? "video" : "image" })));
  }, [value]);

  const imageCount = items.filter(i => i.kind === "image").length;
  const meetsMin = imageCount >= minImages;

  const errors = useRef<string[]>([]);
  const onPick = async (files: FileList | null, kind: "image" | "video") => {
    if (!files?.length) return;
    setUploading(true);
    setProgress(0);
    errors.current = [];

    // validate
    const valid: File[] = [];
    for (const f of Array.from(files)) {
      if (kind === "image") {
        if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { errors.current.push(`${f.name}: invalid image type`); continue; }
        if (f.size > IMG_MAX) { errors.current.push(`${f.name}: too large (>8MB)`); continue; }
      } else {
        if (f.type !== "video/mp4") { errors.current.push(`${f.name}: only MP4 allowed`); continue; }
        if (f.size > VID_MAX) { errors.current.push(`${f.name}: too large (>200MB)`); continue; }
      }
      valid.push(f);
    }
    if (!valid.length) { setUploading(false); return; }

    // upload with real progress
    const fd = new FormData();
    valid.forEach(v => fd.append("files", v));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setUploading(false);
      try {
        const json = JSON.parse(xhr.responseText);
        if (json?.urls?.length) {
          const newUrls: string[] = [...value, ...json.urls];
          onChange(newUrls);
        }
      } catch { /* noop */ }
    };
    xhr.onerror = () => { setUploading(false); alert("Upload failed. Try again."); };
    xhr.send(fd);
  };

  const removeAt = (idx: number) => {
    const next = items.slice();
    next.splice(idx, 1);
    setItems(next);
    onChange(next.map(n => n.url));
  };

  // Reorder via HTML5 drag & drop
  const dragIndex = useRef<number | null>(null);
  const onDragStart = (i: number) => (e: React.DragEvent) => { dragIndex.current = i; e.dataTransfer.effectAllowed = "move"; };
  const onDragOver = (i: number) => (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const onDrop = (i: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from == null || from === i) return;
    const next = items.slice();
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    dragIndex.current = null;
    setItems(next);
    onChange(next.map(n => n.url));
  };

  // “old photo” soft warning (rough: file.lastModified older than 3 years)
  const oldWarnings = useMemo(() => {
    const now = Date.now();
    return items
      .filter(it => it.file && (now - (it.file as any).lastModified) > 1000 * 60 * 60 * 24 * 365 * 3)
      .map(it => it.file?.name || "");
  }, [items]);

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => fileInputImg.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-gray-50"
        >
          <Camera className="h-4 w-4" /> Add photos
        </button>
        <button
          type="button"
          onClick={() => fileInputVid.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-gray-50"
        >
          <Film className="h-4 w-4" /> Add video
        </button>

        <input
          ref={fileInputImg}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          multiple
          hidden
          onChange={e => onPick(e.target.files, "image")}
        />
        <input
          ref={fileInputVid}
          type="file"
          accept="video/mp4"
          capture
          hidden
          onChange={e => onPick(e.target.files, "video")}
        />
      </div>

      {uploading && (
        <div className="mt-3 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {!!errors.current.length && (
        <div className="mt-3 text-sm text-red-600">
          {errors.current.map((e, i) => <div key={i} className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{e}</div>)}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((it, i) => (
          <div
            key={i}
            className="relative group rounded-lg overflow-hidden border"
            draggable
            onDragStart={onDragStart(i)}
            onDragOver={onDragOver(i)}
            onDrop={onDrop(i)}
            title="Drag to reorder"
          >
            {it.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.url} alt="" className="w-full h-36 object-cover" />
            ) : (
              <video src={it.url} className="w-full h-36 object-cover" />
            )}
            <div className="absolute inset-x-0 top-0 p-1 flex justify-between opacity-0 group-hover:opacity-100 transition">
              <span className="inline-flex items-center gap-1 text-[11px] bg-white/90 px-2 py-0.5 rounded">
                <GripVertical className="h-3 w-3" /> drag
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[11px] bg-white/90 px-2 py-0.5 rounded"
                onClick={() => removeAt(i)}
              >
                <Trash2 className="h-3 w-3" /> remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {!meetsMin && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
          <Images className="h-4 w-4" /> At least {minImages} photo(s) required to continue.
        </p>
      )}

      {!!oldWarnings.length && (
        <p className="mt-2 text-sm text-amber-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Some photos look quite old. Consider adding fresh photos.
        </p>
      )}
    </div>
  );
}

function isVideo(url: string) {
  return /\.mp4($|\?)/i.test(url) || url.startsWith("data:video/");
}
