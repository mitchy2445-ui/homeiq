import { signIn } from "@/auth";

async function loginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  await signIn("credentials", { email, password, redirectTo: "/" });
}

export default function LoginPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <form action={loginAction} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input name="email" type="email" required className="mt-1 w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input name="password" type="password" required className="mt-1 w-full rounded-md border px-3 py-2" />
        </div>
        <button className="rounded-xl bg-brand-600 text-white px-5 py-3 font-medium hover:bg-brand-700">
          Log in
        </button>
      </form>
      <p className="text-sm text-gray-600 mt-4">
        No account? <a href="/auth/register" className="underline">Register</a>
      </p>
    </main>
  );
}
