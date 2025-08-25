"use client";

export default function ShareButton({ url, title }: { url: string; title: string }) {
  return (
    <button
      className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
      onClick={async () => {
        try {
          if (navigator.share) {
            await navigator.share({ url, title });
          } else {
            await navigator.clipboard.writeText(url);
            alert("Link copied!");
          }
        } catch {
          // ignore if user cancels
        }
      }}
    >
      Share
    </button>
  );
}
