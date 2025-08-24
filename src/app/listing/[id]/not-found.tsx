import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold mb-2">We couldn’t find that listing</h1>
      <p className="text-gray-600 mb-6">
        It may have been removed or isn’t approved yet.
      </p>
      <Link
        href="/"
        className="inline-block rounded-xl bg-brand-600 text-white px-4 py-2 hover:bg-brand-700"
      >
        Back to Home
      </Link>
    </div>
  );
}
