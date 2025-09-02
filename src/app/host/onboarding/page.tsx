import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import HostStepper from "@/components/HostStepper";
import { redirect } from "next/navigation";
import ResendOtpButton from "./ResendOtpButton";
import { BadgeCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import type { $Enums } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Onboarding() {
  const s = await requireSession("/host/onboarding");

  const profile = await db.landlordProfile.findUnique({
    where: { userId: s.sub },
  });

  /* ---------- actions ---------- */

  async function saveProfile(formData: FormData): Promise<void> {
    "use server";
    const ss = await requireSession("/host/onboarding");
    const gx = (k: string) => formData.get(k)?.toString().trim() ?? "";

    const dobStr = gx("dob");
    const dob = dobStr ? new Date(dobStr) : null;

    const data = {
      fullName: gx("fullName"),
      phone: gx("phone"),
      dob,
      addressLine1: gx("addressLine1"),
      addressLine2: gx("addressLine2") || null,
      city: gx("city"),
      region: gx("region") || null,
      country: gx("country"),
      postal: gx("postal"),
    };

    await db.landlordProfile.upsert({
      where: { userId: ss.sub },
      create: { userId: ss.sub, ...data },
      update: data,
    });
  }

  async function sendOtp(formData: FormData): Promise<void> {
    "use server";
    const ss = await requireSession("/host/onboarding");
    const gx = (k: string) => formData.get(k)?.toString().trim() ?? "";
    const phone = gx("phone");
    if (!phone) throw new Error("Enter your phone number first.");

    await db.landlordProfile.upsert({
      where: { userId: ss.sub },
      create: {
        userId: ss.sub,
        fullName: gx("fullName"),
        phone,
        addressLine1: gx("addressLine1"),
        addressLine2: gx("addressLine2") || null,
        city: gx("city"),
        region: gx("region") || null,
        country: gx("country") || "Canada",
        postal: gx("postal"),
      },
      update: { phone },
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const bcrypt = (await import("bcryptjs")).default;
    const hash = await bcrypt.hash(code, 10);
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    await db.landlordProfile.update({
      where: { userId: ss.sub },
      data: { phoneOtpHash: hash, phoneOtpExpires: expires },
    });

    console.log(`[DEV] OTP for ${phone} => ${code}`);
  }

  async function verifyOtp(formData: FormData): Promise<void> {
    "use server";
    const ss = await requireSession("/host/onboarding");
    const code = String(formData.get("otp") || "").trim();
    if (!code) throw new Error("Enter the code we sent to your phone.");

    const rec = await db.landlordProfile.findUnique({
      where: { userId: ss.sub },
      select: { phoneOtpHash: true, phoneOtpExpires: true },
    });
    if (!rec?.phoneOtpHash || !rec.phoneOtpExpires)
      throw new Error("No OTP pending. Send a new one.");
    if (rec.phoneOtpExpires.getTime() < Date.now())
      throw new Error("Code expired. Send a new one.");

    const bcrypt = (await import("bcryptjs")).default;
    const ok = await bcrypt.compare(code, rec.phoneOtpHash);
    if (!ok) throw new Error("Invalid code.");

    await db.landlordProfile.update({
      where: { userId: ss.sub },
      data: { phoneVerifiedAt: new Date(), phoneOtpHash: null, phoneOtpExpires: null },
    });
  }

  async function continueNext(): Promise<void> {
    "use server";
    await requireSession("/host/onboarding");
    // Enforce verification if desired:
    // const lp = await db.landlordProfile.findUnique({ where: { userId: ss.sub } });
    // if (!lp?.phoneVerifiedAt) throw new Error("Verify phone to continue.");
    redirect("/host/basics");
  }

  /* ---------- UI ---------- */

  const phoneVerified = !!profile?.phoneVerifiedAt;
  const idStatus: $Enums.IdStatus | undefined = profile?.idStatus ?? undefined;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <HostStepper current="onboarding" />

      <div className="mt-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Become a landlord</h1>
          <p className="text-gray-600 mt-2">
            Tell us a bit about yourself. We’ll verify your phone so renters can trust who they’re dealing with.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {phoneVerified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 px-3 py-1 text-xs">
              <BadgeCheck className="h-3.5 w-3.5" /> Phone verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 text-xs">
              <ShieldAlert className="h-3.5 w-3.5" /> Phone not verified
            </span>
          )}

          {idStatus === "VERIFIED" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs">
              <ShieldCheck className="h-3.5 w-3.5" /> ID verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1 text-xs">
              ID status: {idStatus ?? "UNVERIFIED"}
            </span>
          )}
        </div>
      </div>

      <form id="host-onboarding" action={saveProfile} className="mt-6 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full legal name">
            <input
              name="fullName"
              defaultValue={profile?.fullName ?? ""}
              required
              placeholder="Jane Q. Landlord"
              className="w-full rounded-lg border px-3 py-2"
            />
          </Field>

          <Field label="Phone">
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              defaultValue={profile?.phone ?? ""}
              required
              placeholder="+1 (204) 555-0123"
              className="w-full rounded-lg border px-3 py-2"
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Date of birth">
            <input
              type="date"
              name="dob"
              defaultValue={
                profile?.dob ? new Date(profile.dob).toISOString().slice(0, 10) : ""
              }
              className="w-full rounded-lg border px-3 py-2"
            />
          </Field>
          <div className="flex items-end">
            <ResendOtpButton formAction={sendOtp} seconds={30} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Address line 1">
            <input
              name="addressLine1"
              defaultValue={profile?.addressLine1 ?? ""}
              required
              placeholder="123 Main St"
              className="w-full rounded-lg border px-3 py-2"
            />
          </Field>
          <Field label="Address line 2 (optional)">
            <input
              name="addressLine2"
              defaultValue={profile?.addressLine2 ?? ""}
              placeholder="Apt 4B"
              className="w-full rounded-lg border px-3 py-2"
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="City">
            <input
              name="city"
              defaultValue={profile?.city ?? ""}
              required
              className="w-full rounded-lg border px-3 py-2"
            />
          </Field>
          <Field label="Region / Province">
            <input
              name="region"
              defaultValue={profile?.region ?? ""}
              className="w-full rounded-lg border px-3 py-2"
            />
          </Field>
          <Field label="Country">
            <input
              name="country"
              defaultValue={profile?.country ?? "Canada"}
              required
              className="w-full rounded-lg border px-3 py-2"
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Postal code">
            <input
              name="postal"
              defaultValue={profile?.postal ?? ""}
              required
              className="w-full rounded-lg border px-3 py-2"
            />
          </Field>
          <Field label="Verification code">
            <input
              name="otp"
              placeholder="6-digit code"
              className="w-full rounded-lg border px-3 py-2"
            />
          </Field>
          <div className="flex items-end gap-2">
            <button
              form="host-onboarding"
              formAction={verifyOtp}
              className="rounded-xl border px-4 py-2 hover:bg-gray-50"
              type="submit"
            >
              Verify code
            </button>
            {phoneVerified ? (
              <span className="text-sm text-green-600">Phone verified</span>
            ) : (
              <span className="text-sm text-amber-600">Not verified</span>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            form="host-onboarding"
            className="rounded-xl border px-4 py-2 hover:bg-gray-50"
            type="submit"
          >
            Save
          </button>
          <button
            form="host-onboarding"
            formAction={continueNext}
            className="rounded-xl bg-brand-600 text-white px-5 py-3 font-medium hover:opacity-95"
            type="submit"
          >
            Continue
          </button>
        </div>
      </form>
    </main>
  );
}

/* --- small wrapper for labels --- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
