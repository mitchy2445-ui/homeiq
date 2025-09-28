import { redirect } from "next/navigation";
import { prisma as db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/currentUser";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

/**
 * Verified-only: create a draft listing with the basics.
 * Redirects to the next step after save.
 */

export const dynamic = "force-dynamic";

async function requireVerifiedUser() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login?next=/landlord/new/basics");

  const me = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, verificationStatus: true },
  });

  if (!me) redirect("/auth/login?next=/landlord/new/basics");
  if (me.verificationStatus !== "VERIFIED") {
    redirect("/landlord/verify?next=/landlord/new/basics");
  }
  return me.id;
}

async function createListing(formData: FormData) {
  "use server";

  const userId = await requireVerifiedUser();

  const title = (formData.get("title") as string || "").trim();
  const address = (formData.get("address") as string || "").trim();
  const city = (formData.get("city") as string || "").trim();
  const region = (formData.get("region") as string || "").trim();
  const postal = (formData.get("postal") as string || "").trim();

  const beds = Number(formData.get("beds") || 0);
  const baths = Number(formData.get("baths") || 0);
  const priceMonthly = Number(formData.get("price") || 0); // dollars in UI
  const priceCents = Math.max(0, Math.round(priceMonthly * 100));

  // very basic validation
  if (!title || !address || !city || !beds || !baths || !priceCents) {
    // Re-render the page with a querystring error for now
    redirect(`/landlord/new/basics?e=missing`);
  }

  const listing = await db.listing.create({
    data: {
      title,
      city,
      description: "",
      beds,
      baths,
      price: priceCents,
      status: "DRAFT",
      landlordId: userId,

      // optional metadata you may want to use later
      insights: {},
      locationVerified: false,
    },
    select: { id: true },
  });

  // You can change the next step path to match your wizard
  redirect(`/landlord/new/photos?listing=${listing.id}`);
}

export default async function BasicsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  await requireVerifiedUser();
  const hasErr = searchParams?.e === "missing";

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <div className="text-sm text-gray-500">Step 2 of 6</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Property basics</h1>
        <p className="mt-2 text-gray-600">
          Verified-only area. Start entering address, type, beds/baths here.
        </p>
        <div className="mt-4"><Progress value={32} className="h-2" /></div>
      </div>

      {hasErr ? (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Please fill out all required fields.
        </div>
      ) : null}

      <Card className="rounded-2xl shadow-sm border">
        <CardContent className="p-6">
          <form action={createListing} className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-800" htmlFor="title">Listing title*</label>
              <Input id="title" name="title" placeholder="Cozy 2BR in Charleswood" className="mt-2" required />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-800" htmlFor="address">Address*</label>
              <Input id="address" name="address" placeholder="123 Main St" className="mt-2" required />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-800" htmlFor="city">City*</label>
              <Input id="city" name="city" placeholder="Winnipeg" className="mt-2" required />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-800" htmlFor="region">Province/State</label>
              <Input id="region" name="region" placeholder="MB" className="mt-2" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-800" htmlFor="postal">Postal code</label>
              <Input id="postal" name="postal" placeholder="R3X 1Y2" className="mt-2" />
            </div>

            {/* Beds / Baths */}
            <div>
              <label className="text-sm font-medium text-gray-800" htmlFor="beds">Beds*</label>
              <Input id="beds" name="beds" type="number" min={0} step={1} placeholder="2" className="mt-2" required />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-800" htmlFor="baths">Baths*</label>
              <Input id="baths" name="baths" type="number" min={0} step={0.5} placeholder="1" className="mt-2" required />
            </div>

            {/* Price */}
            <div>
              <label className="text-sm font-medium text-gray-800" htmlFor="price">Monthly price (CAD)*</label>
              <Input id="price" name="price" type="number" min={0} step={1} placeholder="1450" className="mt-2" required />
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
              <Button type="submit" style={{ backgroundColor: "#1A6E4E" }} className="rounded-full px-6">
                Save & continue
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
