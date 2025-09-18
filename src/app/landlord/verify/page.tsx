// src/app/landlord/verify/page.tsx
import { redirect } from "next/navigation";
import { prisma as db } from "@/lib/db";
import { homeiq } from "@/styles/theme";
import { getCurrentUserId } from "@/lib/currentUser";
import { CheckCircle2, FileUp, Phone, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Verify() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/auth/login?next=/landlord/verify");

  const me = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phoneVerifiedAt: true,
      emailVerifiedAt: true,
      verificationStatus: true,
    },
  });

  if (!me) redirect("/auth/login?next=/landlord/verify");
  if (me.verificationStatus === "VERIFIED") redirect("/landlord/new/basics");

  const emailDone = Boolean(me.emailVerifiedAt);
  const phoneDone = Boolean(me.phoneVerifiedAt);
  const idDone = false; // TODO: wire your ID provider later

  const allDone = emailDone && phoneDone && idDone;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-gray-500">Step 1 of 7 — Verify your identity</p>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
        Verify your identity
      </h1>
      <p className="text-gray-600 mt-2">
        For a safe community, we verify every landlord’s identity. It takes 2–3 minutes.
      </p>

      <div className="mt-8 grid gap-4">
        <Panel
          icon={<FileUp className="w-5 h-5" />}
          title="Government ID"
          desc="Upload front and back of your ID. We’ll review it shortly."
          action={<IDUploadAction />}
          done={idDone}
        />
        <Panel
          icon={<Phone className="w-5 h-5" />}
          title="Phone verification"
          desc="Add a phone number and verify by SMS code."
          action={<PhoneOtpAction hasPhone={Boolean(me.phoneVerifiedAt)} />}
          done={phoneDone}
        />
        <Panel
          icon={<Mail className="w-5 h-5" />}
          title="Email verification"
          desc={`We’ll send a verification link to ${me.email}`}
          action={<EmailAction />}
          done={emailDone}
        />
      </div>

      <ConsentAndContinue enabled={allDone} />
    </main>
  );
}

/* ------------------------ UI components ------------------------ */

function Panel({
  icon,
  title,
  desc,
  action,
  done,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action: React.ReactNode;
  done: boolean;
}) {
  return (
    <div className="rounded-2xl border p-5 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="rounded-full p-2"
            style={{ backgroundColor: "#eaf5f0", color: homeiq.green }}
          >
            {icon}
          </div>
          <div>
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-gray-600">{desc}</p>
          </div>
        </div>
        {done ? (
          <CheckCircle2 className="w-5 h-5" style={{ color: homeiq.green }} />
        ) : null}
      </div>
      <div className="mt-4">{action}</div>
    </div>
  );
}

function ConsentAndContinue({ enabled }: { enabled: boolean }) {
  return (
    <form action={enabled ? verifyDone : undefined} className="mt-6 space-y-4">
      <label className="flex items-start gap-3 text-sm text-gray-700">
        <input type="checkbox" name="consent" required className="mt-1" />
        <span>I consent to the verification of my identity for hosting on HOMEIQ.</span>
      </label>
      <button
        disabled={!enabled}
        className={`rounded-full px-6 py-3 text-white font-medium shadow-sm hover:shadow-md transition ${
          enabled ? "" : "opacity-60 cursor-not-allowed"
        }`}
        style={{ backgroundColor: homeiq.green }}
      >
        Continue
      </button>
    </form>
  );
}

/* ------------------------ Actions (stubs) ------------------------ */

async function verifyDone() {
  "use server";
  // After ID + phone + email are verified:
  // await db.user.update({
  //   where: { id: (await getCurrentUserId())! },
  //   data: { verificationStatus: "VERIFIED", verifiedAt: new Date() },
  // });
}

/* ------------------------ Field stubs ------------------------ */

function IDUploadAction() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <input
        type="file"
        accept="image/*,application/pdf"
        className="block w-full text-sm"
      />
      <button
        type="button"
        className="rounded-full px-4 py-2 text-white shadow-sm"
        style={{ backgroundColor: homeiq.green }}
      >
        Upload
      </button>
    </div>
  );
}

function PhoneOtpAction({ hasPhone }: { hasPhone: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {!hasPhone && (
        <input
          name="phone"
          placeholder="Phone (e.g., +1 204-555-1234)"
          className="border rounded-xl px-3 py-2 w-full"
        />
      )}
      <button
        type="button"
        className="rounded-full px-4 py-2 text-white shadow-sm"
        style={{ backgroundColor: homeiq.green }}
      >
        {hasPhone ? "Send code" : "Save & send code"}
      </button>
      <input
        name="otp"
        placeholder="Enter code"
        className="border rounded-xl px-3 py-2 w-40"
      />
      <button
        type="button"
        className="rounded-full px-4 py-2 border"
        style={{ borderColor: "#cbd5e1" }}
      >
        Verify
      </button>
    </div>
  );
}

function EmailAction() {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className="rounded-full px-4 py-2 text-white shadow-sm"
        style={{ backgroundColor: homeiq.green }}
      >
        Send link
      </button>
      <span className="text-sm text-gray-500">
        Check your inbox and click the link to verify.
      </span>
    </div>
  );
}
