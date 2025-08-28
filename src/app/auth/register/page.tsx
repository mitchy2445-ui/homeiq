// src/app/auth/register/page.tsx
import { prisma as db } from "@/lib/db";
import { z } from "zod";
import { hash } from "bcryptjs";
import { $Enums, Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/mail";
import { redirect } from "next/navigation";

// ---------- validation ----------
const RegisterInput = z.object({
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
}).refine((d) => d.password === d.confirmPassword, {
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
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

// ---------- server action ----------
async function registerAction(formData: FormData) {
  "use server";

  const ip = await clientIp();
  if (!rateLimit(`register:${ip}`)) {
    // generic message to avoid probing
    redirect("/auth/check-email");
  }

  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = RegisterInput.safeParse(raw);
  if (!parsed.success) {
    // keep UX simple: send them to the same page with generic msg, or throw
    throw new Error(
      parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(" | ")
    );
  }

  const { name, email, password, company } = parsed.data;

  // Honeypot filled -> pretend success
  if (company && company.trim() !== "") {
    redirect("/auth/check-email");
  }

  // Find or create user
  const existing = await db.user.findUnique({ where: { email } });

  // Always behave the same to users (anti-enumeration).
  // But internally, if user doesn't exist, create; if exists and unverified, refresh token; if verified, refresh token anyway (secure email change in future).
  let userId = existing?.id;
  if (!existing) {
    const passwordHash = await hash(password, 12);
    const u = await db.user.create({
      data: {
        email,
        name,
        role: $Enums.Role.USER,
        passwordHash,
      },
      select: { id: true },
    });
    userId = u.id;
  }

  // Create (or replace) a verification token
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

  // Ensure single active token per user (optional nicety)
  await db.verificationToken.deleteMany({ where: { userId: userId! } }).catch(() => {});
  await db.verificationToken.create({
    data: { userId: userId!, token, expires },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const verifyUrl = `${base}/auth/verify?token=${encodeURIComponent(token)}`;
  try {
    await sendVerificationEmail(email, verifyUrl);
  } catch (e) {
    // Don’t leak delivery errors to users; still show check-email page
    console.error("email send error:", e);
  }

  // Always the same UX
  redirect("/auth/check-email");
}

// ---------- UI ----------
export default function RegisterPage() {
  return (
    <main className="min-h-screen mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-semibold">Create your account</h1>
      <p className="text-gray-600 mt-1">Join HOMEIQ to save and list homes.</p>

      <form action={registerAction} className="mt-6 space-y-5">
        {/* Honeypot */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        <div>
          <label className="block text-sm font-medium">Name</label>
          <input name="name" required className="mt-1 w-full rounded-md border px-3 py-2" placeholder="Jane Doe" />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input name="email" type="email" required className="mt-1 w-full rounded-md border px-3 py-2" placeholder="you@example.com" />
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input name="password" type="password" required className="mt-1 w-full rounded-md border px-3 py-2" placeholder="At least 8 characters" />
          <p className="mt-1 text-xs text-gray-500">Use 8+ chars with upper/lowercase and a number.</p>
        </div>

        <div>
          <label className="block text-sm font-medium">Confirm password</label>
          <input name="confirmPassword" type="password" required className="mt-1 w-full rounded-md border px-3 py-2" placeholder="Re-enter your password" />
        </div>

        <button className="rounded-xl bg-brand-600 text-white px-5 py-3 font-medium hover:opacity-90">
          Register
        </button>
      </form>
    </main>
  );
}
