import { redirect } from "next/navigation";
import { prisma as db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/currentUser";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { pathFor, prevPath, type WizardStep } from "@/lib/listingWizard";

export const dynamic = "force-dynamic";
const CURRENT_STEP: WizardStep = "pricing";

async function requireUser() {
  const uid = await getCurrentUserId();
  if (!uid) redirect("/auth/login?next=/landlord/new/pricing");
  return uid;
}

async function savePricing(formData: FormData) {
  "use server";
  await requireUser();

  const listingId = (formData.get("listingId") as string) || "";
  if (!listingId) redirect("/landlord/new/basics");

  const priceDollars = Number(formData.get("price") || 0);
  const depositDollars = Number(formData.get("deposit") || 0);
  const minLeaseMonths = formData.get("minLeaseMonths");

  const price = Math.max(0, Math.round(priceDollars * 100));
  const depositCents =
    Number.isFinite(depositDollars) && depositDollars > 0 ? Math.round(depositDollars * 100) : null;

  await db.listing.update({
    where: { id: listingId },
    data: {
      price,
      depositCents,
      minLeaseMonths: minLeaseMonths ? Math.max(0, Math.floor(Number(minLeaseMonths))) : null,
    },
    select: { id: true },
  });

  // ✅ Next: PHOTOS
  redirect(pathFor("photos", listingId));
}

export default async function PricingPage({
  searchParams,
}: { searchParams?: Record<string, string | string[] | undefined> }) {
  const listingId =
    typeof searchParams?.listingId === "string" ? (searchParams!.listingId as string) : undefined;

  if (!listingId) redirect("/landlord/new/basics");

  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { id: true, price: true, depositCents: true, minLeaseMonths: true },
  });
  if (!listing) redirect("/landlord/new/basics");

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <div className="text-sm text-gray-500">Step 3 of 5</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Pricing & availability</h1>
        <div className="mt-4"><Progress value={60} className="h-2" /></div>
      </div>

      <Card className="rounded-2xl shadow-sm border">
        <CardContent className="p-6">
          <form action={savePricing} className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <input type="hidden" name="listingId" value={listing.id} />

            <div>
              <label htmlFor="price" className="text-sm font-medium">Monthly price (CAD)*</label>
              <Input id="price" name="price" type="number" min={0} step={1}
                     defaultValue={Math.round((listing.price || 0) / 100)} className="mt-2" required />
            </div>

            <div>
              <label htmlFor="deposit" className="text-sm font-medium">Security deposit (CAD)</label>
              <Input id="deposit" name="deposit" type="number" min={0} step={1}
                     defaultValue={listing.depositCents ? Math.round(listing.depositCents / 100) : 0}
                     className="mt-2" />
            </div>

            <div>
              <label htmlFor="minLeaseMonths" className="text-sm font-medium">Minimum lease (months)</label>
              <Input id="minLeaseMonths" name="minLeaseMonths" type="number" min={0} step={1}
                     defaultValue={listing.minLeaseMonths ?? ""} className="mt-2" />
            </div>

            <div className="md:col-span-2 flex items-center justify-between pt-2">
              <a href={prevPath(CURRENT_STEP, listing.id)} className="rounded-full px-6 py-2 border">Back</a>
              <Button type="submit" className="rounded-full px-6" style={{ background: "#1A6E4E" }}>
                Save & continue
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
