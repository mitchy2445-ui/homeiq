import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 mt-10">
      <div className="container-page py-10 grid gap-8 sm:grid-cols-2 md:grid-cols-4 text-sm">
        <div>
          <h3 className="font-semibold mb-3">Product</h3>
          <ul className="space-y-2 text-gray-600">
            <li><Link href="/browse">Browse</Link></li>
            <li><Link href="/cities">Cities</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">For Landlords</h3>
          <ul className="space-y-2 text-gray-600">
            <li><Link href="/landlord">Become a Landlord</Link></li>
            <li><Link href="/landlord/help">Help Center</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Company</h3>
          <ul className="space-y-2 text-gray-600">
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/terms">Terms</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Follow</h3>
          <ul className="space-y-2 text-gray-600">
            <li><a href="#" aria-label="Instagram">Instagram</a></li>
            <li><a href="#" aria-label="TikTok">TikTok</a></li>
            <li><a href="#" aria-label="LinkedIn">LinkedIn</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-100 py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} HOMEIQ. All rights reserved.
      </div>
    </footer>
  );
}
