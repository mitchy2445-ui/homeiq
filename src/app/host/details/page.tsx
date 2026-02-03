// src/app/host/details/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function DetailsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Listing Details</h1>
      <p className="mt-2 text-gray-600">
        This step will collect detailed property information.
      </p>
    </main>
  );
}
