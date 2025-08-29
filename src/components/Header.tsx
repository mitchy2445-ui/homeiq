// src/components/Header.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import { usePathname } from "next/navigation";
import { FiHeart, FiMessageCircle, FiBell, FiUser } from "react-icons/fi";
import type { $Enums } from "@prisma/client";

type Me = { email: string; role?: $Enums.Role };

export default function Header() {
  const pathname = usePathname();
  const showCenteredSearch = pathname === "/";

  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => mounted && setMe(d?.user ?? null))
      .catch(() => mounted && setMe(null))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const isLoggedIn = !!me;
  const isAdmin = me?.role === "ADMIN";
  const isLandlord = isAdmin || me?.role === "LANDLORD";

  const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY ?? "";

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/"; // hard refresh to clear client state
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="mx-auto max-w-[1440px] px-4 md:px-6 lg:px-8 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="font-semibold tracking-wide text-brand-700 text-xl whitespace-nowrap"
        >
          HOMEIQ
        </Link>

        {/* Centered search on home (desktop) */}
        <div className="flex-1 hidden md:flex justify-center">
          {showCenteredSearch && <SearchBar />}
        </div>

        {/* Right-side actions */}
        <nav className="ml-auto flex items-center gap-3">
          {/* Create listing (gate server-side later if needed) */}
          <Link href="/dashboard/new-listing" className="text-sm font-medium hover:underline">
            Become a Landlord
          </Link>

          {/* Admin shortcut (only show if key present and user is ADMIN) */}
          {adminKey && isAdmin && (
            <a
              href={`/admin/listings?key=${adminKey}`}
              className="text-sm text-gray-600 hover:underline"
            >
              Admin
            </a>
          )}

          <Link
            aria-label="Favorites"
            href="/favorites"
            className="p-2 rounded-full hover:bg-gray-50"
          >
            <FiHeart className="h-5 w-5" />
          </Link>

          <Link
            aria-label="Messages"
            href="/messages"
            className="p-2 rounded-full hover:bg-gray-50"
          >
            <FiMessageCircle className="h-5 w-5" />
          </Link>

          <button aria-label="Notifications" className="p-2 rounded-full hover:bg-gray-50">
            <FiBell className="h-5 w-5" />
          </button>

          {/* Auth controls */}
          {isLoggedIn ? (
            <>
              <button
                onClick={handleLogout}
                className="text-sm rounded-full border px-3 py-1.5 hover:bg-gray-50"
                disabled={loading}
              >
                Logout
              </button>
              <Link aria-label="Profile" href="/account" className="p-2 rounded-full hover:bg-gray-50">
                <FiUser className="h-5 w-5" />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm rounded-full border px-3 py-1.5 hover:bg-gray-50"
              >
                Log in
              </Link>

              <Link
                href="/auth/register"
                className="text-sm rounded-full border px-3 py-1.5 hover:bg-gray-50"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Mobile search bar (home only) */}
      {showCenteredSearch && (
        <div className="md:hidden border-t border-gray-100 px-4 py-3">
          <SearchBar />
        </div>
      )}
    </header>
  );
}
