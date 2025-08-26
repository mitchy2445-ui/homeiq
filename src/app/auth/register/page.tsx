import { prisma as db } from "@/lib/db";
import { z } from "zod";
import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { $Enums } from "@prisma/client";

const RegisterInput = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

async function registerAction(formData: FormData) {
  "use server";

  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = RegisterInput.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(" | ");
    throw new Error(`Invalid input: ${msg}`);
  }

  const { name, email, password } = parsed.data;

  // Prevent duplicate email
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Email is already registered");
  }

  const passwordHash = await hash(password, 12);

  await db.user.create({
    data: {
      email,
      name,
      // omit role if you want the schema default(USER) to apply
      role: $Enums.Role.USER,
      passwordHash,
    },
  });

  // go to login or auto-sign-in flow
  redirect("/auth/login");
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-semibold">Create your account</h1>
      <p className="text-gray-600 mt-1">Join HOMEIQ to save and list homes.</p>

      <form action={registerAction} className="mt-6 space-y-5">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            name="name"
            required
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="••••••••"
          />
        </div>

        <button className="rounded-xl bg-brand-600 text-white px-5 py-3 font-medium hover:bg-brand-700">
          Register
        </button>
      </form>
    </main>
  );
}
