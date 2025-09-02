// src/app/admin/page.tsx
import { getSessionFromCookie } from "@/lib/auth";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function canAdmin(session: { email?: string; role?: string } | null) {
  const envEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();
  return session?.role === "ADMIN" ||
    session?.email?.toLowerCase() === envEmail;
}

export default async function AdminHome() {
  const session = await getSessionFromCookie();

  if (!canAdmin(session)) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-semibold">Unauthorized</h1>
        <p className="text-gray-600 mt-2">
          You don’t have access to the Admin Center.
        </p>
        <div className="mt-4 text-sm text-gray-500">
          <div><strong>Logged in as:</strong> {session?.email ?? "guest"}</div>
          <div><strong>Required email:</strong> {process.env.NEXT_PUBLIC_ADMIN_EMAIL || "(not set)"} </div>
        </div>
        <div className="mt-6">
          <Link href="/" className="rounded-xl border px-4 py-2 hover:bg-gray-50">Go home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Admin Center</h1>
      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <a href="/admin/listings" className="rounded-xl border p-5 hover:bg-gray-50">
          <div className="text-lg font-medium">Listings</div>
          <p className="text-sm text-gray-600">Review pending, approve/reject.</p>
        </a>
        <a href="/admin/landlords" className="rounded-xl border p-5 hover:bg-gray-50">
          <div className="text-lg font-medium">Landlords</div>
          <p className="text-sm text-gray-600">Verify identity (mark VERIFIED).</p>
        </a>
      </div>
    </main>
  );
}
