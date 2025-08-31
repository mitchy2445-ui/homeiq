// src/app/admin/page.tsx
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const store = await cookies();
  const token = store.get("session")?.value;
  const session = token ? await verifySession(token) : null;
  const ok =
    session?.role === "ADMIN" ||
    (process.env.NEXT_PUBLIC_ADMIN_EMAIL &&
     session?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL);
  if (!ok) redirect("/");
  return session;
}

export default async function AdminHome() {
  await requireAdmin();
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
