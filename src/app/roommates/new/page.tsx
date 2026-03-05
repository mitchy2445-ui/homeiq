// src/app/roommates/new/page.tsx
import { redirect } from "next/navigation";
import { prisma as db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

export default async function NewRoommateListingPage() {
  const session = await requireSession();
  if (!session) {
    redirect("/login?redirect=/roommates/new");
  }

  // Ensure user has completed their roommate profile
  const profile = await db.roommateProfile.findUnique({
    where: { userId: session.sub },
    select: { id: true },
  });

  if (!profile) {
    redirect("/roommates/profile");
  }

  async function createListing(formData: FormData) {
    "use server";

    const s = await requireSession();
    if (!s) redirect("/login");

    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const typeRaw = String(formData.get("type") || "");

    const preferredGenderRaw = String(formData.get("preferredGender") || "").trim();
    const minAgeRaw = String(formData.get("minAge") || "");
    const maxAgeRaw = String(formData.get("maxAge") || "");

    if (!title) throw new Error("Title is required");
    if (!description) throw new Error("Description is required");

    if (!["ROOM_AVAILABLE", "LOOKING_FOR_ROOM"].includes(typeRaw)) {
      throw new Error("Invalid listing type");
    }

    const type = typeRaw as "ROOM_AVAILABLE" | "LOOKING_FOR_ROOM";

    const minAge =
      minAgeRaw && !isNaN(Number(minAgeRaw))
        ? Math.max(18, Math.min(100, Number(minAgeRaw)))
        : undefined;

    const maxAge =
      maxAgeRaw && !isNaN(Number(maxAgeRaw))
        ? Math.max(18, Math.min(100, Number(maxAgeRaw)))
        : undefined;

    if (minAge !== undefined && maxAge !== undefined && minAge > maxAge) {
      throw new Error("Minimum age cannot be greater than maximum age");
    }

    await db.roommateListing.create({
      data: {
        ownerId: s.sub,
        type,
        title,
        description,
        preferredGender: preferredGenderRaw || null,
        minAge,
        maxAge,
      },
    });

    redirect("/roommates");
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">
        {/* Header */}
        <header className="space-y-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-neutral-900">
            Create a roommate listing
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Tell others what you are looking for and who you would like to live with.
          </p> a        </header>

        <form action={createListing} className="space-y-20">
          {/* Listing Type */}
          <section className="space-y-10">
            <div className="border-t border-neutral-200 pt-16">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-8">
                What are you posting?
              </h2>

              <div className="flex flex-wrap gap-4">
                <input
                  type="radio"
                  id="room-available"
                  name="type"
                  value="ROOM_AVAILABLE"
                  className="peer/room hidden"
                  defaultChecked
                  required
                />
                <label
                  htmlFor="room-available"
                  className="
                    flex-1 min-w-[220px] cursor-pointer 
                    rounded-xl border-2 border-neutral-200 
                    px-6 py-5 text-center text-lg font-medium 
                    transition-all 
                    peer-checked/room:border-emerald-600 
                    peer-checked/room:bg-emerald-50 
                    peer-checked/room:text-emerald-700 
                    hover:border-neutral-300 hover:bg-neutral-50
                  "
                >
                  I have a room available
                </label>

                <input
                  type="radio"
                  id="looking-for-room"
                  name="type"
                  value="LOOKING_FOR_ROOM"
                  className="peer/look hidden"
                  required
                />
                <label
                  htmlFor="looking-for-room"
                  className="
                    flex-1 min-w-[220px] cursor-pointer 
                    rounded-xl border-2 border-neutral-200 
                    px-6 py-5 text-center text-lg font-medium 
                    transition-all 
                    peer-checked/look:border-emerald-600 
                    peer-checked/look:bg-emerald-50 
                    peer-checked/look:text-emerald-700 
                    hover:border-neutral-300 hover:bg-neutral-50
                  "
                >
                  I am looking for a room
                </label>
              </div>
            </div>
          </section>

          {/* About the situation */}
          <section className="space-y-10">
            <div className="border-t border-neutral-200 pt-16">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-8">
                About the situation
              </h2>

              <div className="space-y-8">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-neutral-700">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g. Looking for a chill roommate in Osborne Village"
                    required
                    className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-neutral-700">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Tell people about the room/situation, location, vibe, shared spaces, rent details, house rules, etc..."
                    required
                    rows={8}
                    className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section className="space-y-10">
            <div className="border-t border-neutral-200 pt-16">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-8">
                Roommate preferences (optional)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="preferredGender" className="text-sm font-medium text-neutral-700">
                    Preferred gender
                  </Label>
                  <Input
                    id="preferredGender"
                    name="preferredGender"
                    placeholder="Any / Female / Male / Non-binary"
                    className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minAge" className="text-sm font-medium text-neutral-700">
                    Minimum age
                  </Label>
                  <Input
                    id="minAge"
                    name="minAge"
                    type="number"
                    min={18}
                    max={100}
                    placeholder="18"
                    className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAge" className="text-sm font-medium text-neutral-700">
                    Maximum age
                  </Label>
                  <Input
                    id="maxAge"
                    name="maxAge"
                    type="number"
                    min={18}
                    max={100}
                    placeholder="40"
                    className="rounded-xl border-neutral-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="pt-12 border-t border-neutral-200 flex justify-end">
            <Button
              type="submit"
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-10 py-6 text-base font-medium transition min-w-[220px]"
            >
              Publish listing
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
}