// src/app/landlord/page.tsx
import Link from "next/link";
import { homeiq } from "@/styles/theme";
import { getUserVerificationStatus } from "@/lib/guards";
import { ShieldCheck, Images, MapPinned, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LandlordLanding() {
  // If you don’t have getUserVerificationStatus, swap verified to: false
  const status = await getUserVerificationStatus();
  const verified = status === "VERIFIED";

  const primaryHref = verified ? "/landlord/new/basics" : "/landlord/verify";
  const primaryLabel = verified ? "Post a listing" : "Start verification";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Hero */}
      <section className="text-center space-y-5">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
          Share your home, earn with ease.
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Verified landlords, trusted renters, simple tools.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href={primaryHref}
            className="rounded-full px-6 py-3 text-white font-medium shadow-sm hover:shadow-md transition"
            style={{ backgroundColor: homeiq.green }}
          >
            {primaryLabel}
          </Link>
          <div className="flex gap-4 text-sm text-gray-600">
            <a
              href="#how-it-works"
              className="underline underline-offset-4 hover:text-gray-900"
            >
              How verification works
            </a>
            <a
              href="#faqs"
              className="underline underline-offset-4 hover:text-gray-900"
            >
              Landlord FAQs
            </a>
          </div>
        </div>
      </section>

      {/* Trust Row */}
      <section className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          icon={<ShieldCheck className="w-5 h-5" />}
          title="Verified hosts"
          desc="Government ID, phone, and email required."
        />
        <Card
          icon={<CheckCircle2 className="w-5 h-5" />}
          title="Quality listings"
          desc="Every listing is reviewed before it goes live."
        />
        <Card
          icon={<Images className="w-5 h-5" />}
          title="Simple onboarding"
          desc="Step-by-step wizard to publish fast."
        />
        <Card
          icon={<MapPinned className="w-5 h-5" />}
          title="Verified maps"
          desc="Google Maps location verification."
        />
      </section>

      {/* Process Preview */}
      <section id="how-it-works" className="mt-14">
        <h2 className="text-xl font-semibold mb-4">How it works</h2>
        <ol className="grid gap-3 md:grid-cols-2">
          {[
            "Verify identity (ID, phone, email)",
            "Property basics (address, type, beds/baths)",
            "Photos & media",
            "Pricing & availability",
            "Neighbourhood insights",
            "Description & house rules",
            "Review & publish",
          ].map((step, i) => (
            <li key={i} className="rounded-2xl border p-4 shadow-sm bg-white">
              {i + 1}. {step}
            </li>
          ))}
        </ol>
      </section>

      {/* FAQs placeholder */}
      <section id="faqs" className="mt-14">
        <h2 className="text-xl font-semibold mb-4">Landlord FAQs</h2>
        <div className="rounded-2xl border p-6 bg-white shadow-sm text-sm text-gray-600">
          We’ll add common questions here (verification time, accepted documents, etc.).
        </div>
      </section>
    </main>
  );
}

function Card({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border p-5 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="rounded-full p-2"
          style={{ backgroundColor: homeiq.greenSoft, color: homeiq.green }}
        >
          {icon}
        </div>
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  );
}
