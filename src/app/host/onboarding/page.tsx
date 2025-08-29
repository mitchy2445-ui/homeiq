import { requireSession } from "@/lib/auth";
import { prisma as db } from "@/lib/db";
import { redirect } from "next/navigation";
import { z } from "zod";
import HostStepper from "@/components/HostStepper";
import ConfirmLeave from "@/components/ConfirmLeave";
import { Phone, ShieldCheck, Info, ArrowRight } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ProfileInput = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(7),
  dob: z.string().optional(),
  addressLine1: z.string().min(3),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  region: z.string().optional(),
  country: z.string().min(2),
  postal: z.string().min(2),
});

export default async function Onboarding() {
  const s = await requireSession("/host/onboarding");
  let profile = await db.landlordProfile.findUnique({ where: { userId: s.sub } });

  // Server actions
  async function saveProfile(formData: FormData) {
    "use server";
    const ss = await requireSession("/host/onboarding");
    const raw = Object.fromEntries(formData) as Record<string, string>;
    const p = ProfileInput.safeParse(raw);
    if (!p.success) throw new Error("Invalid fields");
    const data = p.data;

    const dob = data.dob ? new Date(data.dob) : null;

    profile = await db.landlordProfile.upsert({
      where: { userId: ss.sub },
      create: {
        userId: ss.sub,
        fullName: data.fullName,
        phone: data.phone,
        dob: dob ?? undefined,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || undefined,
        city: data.city,
        region: data.region || undefined,
        country: data.country,
        postal: data.postal,
        idStatus: "UNVERIFIED",
      },
      update: {
        fullName: data.fullName,
        phone: data.phone,
        dob: dob ?? undefined,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || undefined,
        city: data.city,
        region: data.region || undefined,
        country: data.country,
        postal: data.postal,
      },
    });
    redirect("/host/onboarding?saved=1");
  }

  async function sendOtp() {
    "use server";
    const ss = await requireSession("/host/onboarding");
    const rec = await db.landlordProfile.findUnique({ where: { userId: ss.sub } });
    if (!rec?.phone) throw new Error("Save phone first");

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const bcrypt = (await import("bcryptjs")).default;
    const phoneOtpHash = await bcrypt.hash(code, 10);
    const phoneOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await db.landlordProfile.update({
      where: { userId: ss.sub },
      data: { phoneOtpHash, phoneOtpExpires, idStatus: "PENDING" },
    });
    console.log("DEV OTP for", rec.phone, "=", code); // dev-mode console
    redirect("/host/onboarding?otp=sent");
  }

  async function verifyOtp(formData: FormData) {
    "use server";
    const ss = await requireSession("/host/onboarding");
    const rec = await db.landlordProfile.findUnique({ where: { userId: ss.sub } });
    if (!rec?.phoneOtpHash || !rec.phoneOtpExpires) throw new Error("No OTP pending");

    const code = String(formData.get("otp") || "");
    const bcrypt = (await import("bcryptjs")).default;
    const ok = await bcrypt.compare(code, rec.phoneOtpHash);
    if (!ok || rec.phoneOtpExpires < new Date()) {
      throw new Error("Invalid or expired code");
    }
    await db.landlordProfile.update({
      where: { userId: ss.sub },
      data: { phoneVerifiedAt: new Date(), phoneOtpHash: null, phoneOtpExpires: null, idStatus: "VERIFIED" },
    });
    redirect("/host/basics");
  }

  return (
    <main>
      <HostStepper current="onboarding" />
      <div className="mb-4 rounded-xl border border-gray-100 p-4 bg-gray-50/60 text-sm text-gray-700 flex gap-2">
        <Info className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
        <p>Tell us about yourself. We verify phone numbers to keep the marketplace safe.</p>
      </div>

      <ConfirmLeave enabled={true} />

      <form action={saveProfile} className="grid gap-5">
        <div className="grid md:grid-cols-2 gap-4">
          <Field name="fullName" label="Full legal name" defaultValue={profile?.fullName} />
          <Field name="phone" label="Phone" defaultValue={profile?.phone} icon={<Phone className="h-4 w-4 text-gray-400" />} />
          <Field name="dob" label="Date of birth" type="date" defaultValue={profile?.dob ? profile.dob.toISOString().slice(0,10) : ""} />
          <Field name="postal" label="Postal code" defaultValue={profile?.postal} />
        </div>
        <Field name="addressLine1" label="Address line 1" defaultValue={profile?.addressLine1} />
        <Field name="addressLine2" label="Address line 2 (optional)" defaultValue={profile?.addressLine2 ?? ""} />
        <div className="grid md:grid-cols-3 gap-4">
          <Field name="city" label="City" defaultValue={profile?.city} />
          <Field name="region" label="Region/State" defaultValue={profile?.region ?? ""} />
          <Field name="country" label="Country" defaultValue={profile?.country ?? "Canada"} />
        </div>

        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            Status: <strong>{profile?.idStatus ?? "UNVERIFIED"}</strong>
            {profile?.phoneVerifiedAt && <span className="text-gray-500">(phone verified)</span>}
          </div>
          <div className="flex gap-3">
            <button className="rounded-xl border px-4 py-2 hover:bg-gray-50" formAction={saveProfile}>Save</button>
            <button className="rounded-xl bg-gray-900 text-white px-5 py-2 hover:bg-black" formAction={sendOtp}>Send OTP</button>
          </div>
        </div>
      </form>

      <div className="mt-6 border-t pt-6">
        <form action={verifyOtp} className="flex items-end gap-3">
          <Field name="otp" label="Enter 6-digit code" />
          <button className="inline-flex items-center gap-2 rounded-xl bg-brand-600 text-white px-5 py-2 font-medium hover:opacity-95">
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-500">In dev, the OTP is printed in your server console.</p>
      </div>
    </main>
  );
}

function Field({
  name, label, type="text", defaultValue, icon,
}: { name: string; label: string; type?: string; defaultValue?: any; icon?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>}
        <input
          name={name}
          defaultValue={defaultValue ?? ""}
          type={type}
          className={`w-full rounded-lg border border-gray-300 bg-white ${icon ? "pl-9" : "pl-3"} pr-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100`}
          required={/optional/i.test(label) ? false : true}
        />
      </div>
    </label>
  );
}
