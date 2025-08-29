// src/app/host/layout.tsx
export const runtime = "nodejs";
export default function HostLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Become a Landlord</h1>
        <p className="text-gray-600">Create your listing in a few quick steps.</p>
      </div>
      {children}
    </main>
  );
}
