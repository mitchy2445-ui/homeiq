// src/app/dashboard/new-listing/page.tsx
import { prisma as db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { z } from "zod";
import { redirect } from "next/navigation";
import { $Enums } from "@prisma/client";

export const runtime = "nodejs";
// Make sure cookies are read on every request (no static caching)
export const dynamic = "force-dynamic";

const ListingInput = z.object({
  title: z.string().min(3),
  city: z.string().min(2),
  price: z.coerce.number().int().positive(), // dollars; convert to cents
  beds: z.coerce.number().int().min(0),
  baths: z.coerce.number().int().min(0),
  description: z.string().optional(),
  imagesCsv: z.string().optional(), // comma/line separated URLs
  videoUrl: z
    .string()
    .url({ message: "Must be a valid URL" })
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export default async function NewListingPage() {
  // ✅ Redirects to /auth/login if not logged in (and preserves return path)
  const session = await requireSession("/dashboard/new-listing");

  // (optional) role gate — show a friendly message or redirect as you wish
  if (session.role !== "LANDLORD" && session.role !== "ADMIN") {
    return (
      <main className="min-h-screen max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-semibold">Not authorized</h1>
        <p className="text-gray-600 mt-2">
          You need a landlord account to create listings.
        </p>
      </main>
    );
  }

  // Server action (re-check session inside the action)
  async function createListingAction(formData: FormData) {
    "use server";

    const s = await requireSession("/dashboard/new-listing");
    if (s.role !== "LANDLORD" && s.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const data = Object.fromEntries(formData) as Record<string, string>;
    const parsed = ListingInput.safeParse(data);

    if (!parsed.success) {
      const msg = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(" | ");
      throw new Error(`Invalid input: ${msg}`);
    }

    const v = parsed.data;

    // price in cents
    const priceCents = Math.round(v.price * 100);

    // normalize images from CSV/newlines to string[]
    const images =
      v.imagesCsv
        ?.split(/[\n,]/g)
        .map((s) => s.trim())
        .filter(Boolean) ?? [];

    const listing = await db.listing.create({
      data: {
        title: v.title,
        city: v.city,
        price: priceCents,
        beds: v.beds,
        baths: v.baths,
        description: v.description,
        images, // JSON column (string[])
        videoUrl: v.videoUrl,
        status: $Enums.Status.PENDING,
        landlordId: s.sub, // 👈 from our JWT (user id)
      },
      select: { id: true },
    });

    redirect(`/listing/${listing.id}`);
  }

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-semibold">Create a new listing</h1>
      <p className="text-gray-600 mt-1">Add photos, details, and an optional video tour.</p>

      <form action={createListingAction} className="mt-6 space-y-5">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            name="title"
            required
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="Bright 2-bed near Osborne Village"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">City</label>
          <input
            name="city"
            required
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="Winnipeg"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Price (CAD / month)</label>
            <input
              name="price"
              type="number"
              min="0"
              step="1"
              required
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="1750"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Beds</label>
            <input
              name="beds"
              type="number"
              min="0"
              step="1"
              required
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Baths</label>
            <input
              name="baths"
              type="number"
              min="0"
              step="1"
              required
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            rows={4}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="Sunlit unit with exposed brick and river views."
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Image URLs (comma or new line)</label>
          <textarea
            name="imagesCsv"
            rows={3}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder={"https://...\nhttps://..."}
          />
          <p className="text-xs text-gray-500 mt-1">We’ll store these as an array for the gallery.</p>
        </div>

        <div>
          <label className="block text-sm font-medium">Video URL (optional)</label>
          <input
            name="videoUrl"
            type="url"
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="https://res.cloudinary.com/.../tour.mp4"
          />
        </div>

        <button className="rounded-xl bg-brand-600 text-white px-5 py-3 font-medium hover:bg-brand-700">
          Create listing
        </button>
      </form>
    </main>
  );
}
