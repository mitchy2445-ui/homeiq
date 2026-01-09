// src/app/landlord/new/basics/page.tsx
import { redirect } from "next/navigation";
import { prisma as db } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";
import BasicsForm from "@/components/listings/BasicsForm";

export const runtime = "nodejs";

export default async function BasicsStepPage() {
  // Require session
  const s = await getSessionFromCookie();
  if (!s) redirect("/auth/login?next=/landlord/new/basics");

  // Only allow verified landlords (or admins)
  const me = await db.user.findUnique({
    where: { id: s.sub },
    select: { role: true, verificationStatus: true, emailVerifiedAt: true },
  });

  const isAdmin = me?.role === "ADMIN";
  const emailVerified = Boolean(me?.emailVerifiedAt);
  const isVerifiedLandlord = me?.verificationStatus === "VERIFIED";

  if (!emailVerified) {
    redirect("/auth/login?next=/landlord/new/basics");
  }
  if (!isVerifiedLandlord && !isAdmin) {
    redirect("/landlord/verify");
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Create your listing</h1>
      <p className="text-sm text-gray-600 mb-6">
        Start with the basics. You can add photos, pricing, and more on the next steps.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <BasicsForm />
        </section>

        <aside className="lg:col-span-1">
          <div className="rounded-2xl border p-4">
            <div className="text-sm font-medium mb-2">Tips for a great listing</div>
            <ul className="text-sm text-gray-600 list-disc pl-4 space-y-1">
              <li>Use a clear, specific title (include beds/baths).</li>
              <li>Pick the right city to help renters find you.</li>
              <li>Write 80–600 characters for your description.</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
