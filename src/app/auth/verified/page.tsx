// src/app/auth/verified/page.tsx
import Link from "next/link";

export default function VerifiedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">Email verified 🎉</h1>
        <p className="mt-3 text-gray-600">
          Your account is now active. You can log in and start using HOMEIQ.
        </p>
        <Link
          href="/auth/login"
          className="inline-block mt-6 rounded-xl bg-brand-600 px-5 py-3 font-medium text-white hover:opacity-95"
        >
          Go to Log in
        </Link>
      </div>
    </main>
  );
}
