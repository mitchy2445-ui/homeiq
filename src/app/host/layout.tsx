export const runtime = "nodejs";

export default function HostLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <section className="mx-auto max-w-4xl px-4 py-12">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-brand-700 ring-1 ring-brand-100">
            <span className="h-2 w-2 rounded-full bg-brand-600" />
            Hosting Setup
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">Become a Landlord</h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Create a great listing in a few professional steps. You can save anytime and finish later.
          </p>
        </header>

        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6 md:p-8">
          {children}
        </div>
      </section>
    </main>
  );
}
