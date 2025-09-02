"use client";

import { useEffect, useState } from "react";
import MediaStep from "./MediaStep";

type Props = {
  initialPhotos: string[];
  initialVideoUrl: string | null;
};

export default function MediaFormClient({ initialPhotos, initialVideoUrl }: Props) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos || []);
  const [videoUrl, setVideoUrl] = useState<string | null>(initialVideoUrl || null);

  // keep hidden inputs up to date
  useEffect(() => {
    const el = document.getElementById("photos-json") as HTMLInputElement | null;
    if (el) el.value = JSON.stringify(photos);
  }, [photos]);

  useEffect(() => {
    const el = document.getElementById("video-url") as HTMLInputElement | null;
    if (el) el.value = videoUrl ?? "";
  }, [videoUrl]);

  return (
    <>
      <MediaStep
        photos={photos}
        setPhotos={setPhotos}
        videoUrl={videoUrl}
        setVideoUrl={setVideoUrl}
      />
      {/* Hidden fields the server action will read */}
      <input id="photos-json" name="photosJson" type="hidden" defaultValue="[]" />
      <input id="video-url" name="videoUrl" type="hidden" defaultValue="" />
    </>
  );
}
