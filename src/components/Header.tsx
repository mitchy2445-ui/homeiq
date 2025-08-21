"use client";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import { usePathname } from "next/navigation";
import { FiHeart, FiMessageCircle, FiBell, FiUser } from "react-icons/fi";

export default function Header() {
  const pathname = usePathname();
  const showCenteredSearch = pathname === "/";

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="container-page h-16 flex items-center gap-4">
        <Link href="/" className="font-semibold tracking-wide text-brand-700 text-xl">
          HOMEIQ
        </Link>

        <div className="flex-1 hidden md:flex justify-center">
          {showCenteredSearch && <SearchBar />}
        </div>

        <nav className="ml-auto flex items-center gap-3">
          <Link
            href="/landlord"
            className="hidden sm:inline-block px-3 py-2 rounded-full border border-gray-200 hover:border-brand-300 text-sm"
          >
            Become a Landlord
          </Link>
          <Link aria-label="Favorites" href="/favorites" className="p-2 rounded-full hover:bg-gray-50">
            <FiHeart className="h-5 w-5" />
          </Link>
          <Link aria-label="Messages" href="/messages" className="p-2 rounded-full hover:bg-gray-50">
            <FiMessageCircle className="h-5 w-5" />
          </Link>
          <button aria-label="Notifications" className="p-2 rounded-full hover:bg-gray-50">
            <FiBell className="h-5 w-5" />
          </button>
          <button aria-label="Profile" className="p-2 rounded-full hover:bg-gray-50">
            <FiUser className="h-5 w-5" />
          </button>
        </nav>
      </div>

      {showCenteredSearch && (
        <div className="md:hidden border-t border-gray-100 px-4 py-3">
          <SearchBar />
        </div>
      )}
    </header>
  );
}
