"use client";

import { useState } from "react";

export default function ActionsClient({
  onToggleFavorite,
}: {
  onToggleFavorite: () => Promise<void>;
}) {
  const [favorited, setFavorited] = useState(false);

  return (
    <>
      <form
        action={async () => {
          setFavorited((v) => !v);
          await onToggleFavorite();
        }}
      >
        <button
          className={`w-full rounded-xl py-3 font-medium transition ${
            favorited
              ? "bg-emerald-600 text-white"
              : "border hover:bg-gray-50"
          }`}
        >
          {favorited ? "Saved" : "Save to favorites"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          alert("Link copied to clipboard");
        }}
        className="w-full rounded-xl border py-3 font-medium hover:bg-gray-50"
      >
        Share listing
      </button>
    </>
  );
}
