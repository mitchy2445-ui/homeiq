// src/app/auth/register/page.tsx
import { prisma as db } from "@/lib/db";
import { z } from "zod";
import { hash } from "bcryptjs";
import { $Enums } from "@prisma/client";
import { headers } from "next/headers";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/mail";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FiMail, FiLock, FiUser } from "react-icons/fi";

// Ensure Node runtime for server action + nodemailer
export const runtime = "nodejs";

// ---------- validation ----------
const RegisterInput = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    email: z.string().email().transform((e) => e.trim().toLowerCase()),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[0-9]/, "Include a number"),
    confirmPassword: z.string(),
    // honeypot
    company: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

// ---------- basic rate limit (dev) ----------
const bucket = new Map<string, { n: number; ts: number }>();
function rateLimit(key: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const b = bucket.get(key);
  if (!b || now - b.ts > windowMs) {
    bucket.set(key, { n: 1, ts: now });
    return true;
  }
  if (b.n >= limit) return false;
  b.n++;
  return true;
}

async function clientIp() {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown"
  );
}

// ---------- server action ----------
async function registerAction(formData: FormData) {
  "use server";

  const ip = await clientIp();
  if (!rateLimit(`register:${ip}`)) {
    redirect("/auth/check-email");
  }

  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = RegisterInput.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" | ")
    );
  }

  const { name, email, password, company } = parsed.data;

  // Honeypot filled -> pretend success
  if (company && company.trim() !== "") {
    redirect("/auth/check-email");
  }

  const existing = await db.user.findUnique({ where: { email } });

  let userId: string;
  if (!existing) {
    const passwordHash = await hash(password, 12);
    const u = await db.user.create({
      data: { email, name, role: $Enums.Role.USER, passwordHash },
      select: { id: true },
    });
    userId = u.id;
  } else {
    userId = existing.id;
    // ✅ If user exists but has no password yet (older record), set it now so login works
    if (!existing.passwordHash) {
      const passwordHash = await hash(password, 12);
      await db.user.update({
        where: { id: existing.id },
        data: { passwordHash },
      });
    }
  }

  // Create fresh verification token
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 30); // 30m
  await db.verificationToken.deleteMany({ where: { userId: userId } }).catch(() => {});
  await db.verificationToken.create({ data: { userId: userId, token, expires } });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const verifyUrl = `${base}/auth/verify?token=${encodeURIComponent(token)}`;

  try {
    await sendVerificationEmail(email, verifyUrl);
  } catch (e) {
    console.error("email send error:", e);
  }

  redirect("/auth/check-email");
}

// ---------- UI ----------
export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block text-2xl font-semibold tracking-wide text-brand-700">
            HOMEIQ
          </Link>
          <h1 className="mt-4 text-3xl font-semibold">Create your account</h1>
          <p className="mt-2 text-gray-600">Join HOMEIQ to save, manage, and list homes.</p>
        </div>

        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6">
          <form action={registerAction} className="space-y-5">
            {/* Honeypot */}
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Name</span>
              <div className="relative">
                <FiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  name="name"
                  required
                  placeholder="Jane Doe"
                  className="w-full rounded-lg border border-gray-300 bg-white px-9 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Email</span>
              <div className="relative">
                <FiMail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-gray-300 bg-white px-9 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Password</span>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  className="w-full rounded-lg border border-gray-300 bg-white px-9 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Use 8+ characters with upper/lowercase and a number.
              </p>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Confirm password</span>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="Re-enter your password"
                  className="w-full rounded-lg border border-gray-300 bg-white px-9 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </label>

            <button
              className="mt-2 w-full rounded-xl bg-brand-600 px-5 py-3 font-medium text-white shadow-sm transition hover:opacity-95 active:opacity-90"
            >
              Create account
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-brand-700 hover:underline">
              Log in
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          By creating an account, you agree to our Terms and acknowledge our Privacy Policy.
        </p>
      </div>
    </main>
  );
}
