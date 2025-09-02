"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import { usePathname } from "next/navigation";
import {
  FiHeart,
  FiMessageCircle,
  FiBell,
  FiUser,
  FiMenu,
  FiX,
  FiLogOut,
  FiLogIn,
  FiUserPlus,
  FiHome,
} from "react-icons/fi";
import type { $Enums } from "@prisma/client";

type Me = { email: string; role?: $Enums.Role };

export default function Header() {
  const pathname = usePathname();
  const showCenteredSearch = pathname === "/";

  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Close the hamburger when navigating
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isLoggedIn = !!me;
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() ?? "";
  const showAdmin = me?.role === "ADMIN" || me?.email?.toLowerCase() === adminEmail;

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

        {/* Right-side quick actions */}
        <nav className="ml-auto flex items-center gap-3">
          {/* Become a Landlord (visible always; gated server-side later) */}
          <Link href="/host" className="hidden sm:inline-flex items-center gap-2 text-sm font-medium hover:underline">
            <FiHome className="h-4 w-4" />
            Become a Landlord
          </Link>

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

          <button
            aria-label="Notifications"
            className="p-2 rounded-full hover:bg-gray-50"
            type="button"
          >
            <FiBell className="h-5 w-5" />
          </button>

          {/* Auth quick actions (desktop) */}
          {isLoggedIn ? (
            <Link
              aria-label="Profile"
              href="/account"
              className="hidden md:inline-flex p-2 rounded-full hover:bg-gray-50"
              title="Account"
            >
              <FiUser className="h-5 w-5" />
            </Link>
          ) : (
            <div className="hidden md:flex items-center gap-2">
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
            </div>
          )}

          {/* Hamburger menu (Admin Center lives here) */}
          <div className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls="global-menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 rounded-full border hover:bg-gray-50"
            >
              {menuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
            </button>

            {menuOpen && (
              <div
                id="global-menu"
                role="menu"
                className="absolute right-0 mt-2 w-64 rounded-xl border bg-white shadow-lg ring-1 ring-black/5 p-2"
              >
                {/* Signed-in section */}
                {isLoggedIn ? (
                  <>
                    <div className="px-3 py-2 text-xs text-gray-500">
                      Signed in as <span className="font-medium">{me?.email}</span>
                    </div>

                    {/* Admin Center (only if allowed) */}
                    {showAdmin && (
                      <Link
                        href="/admin"
                        role="menuitem"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        {/* simple shield emoji or keep clean text; could also use a lucide icon if you prefer */}
                        <span className="inline-block h-4 w-4 rounded-full bg-gray-900" />
                        <span>Admin Center</span>
                      </Link>
                    )}

                    <Link
                      href="/account"
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <FiUser className="h-4 w-4" />
                      <span>Account</span>
                    </Link>

                    <div className="my-2 h-px bg-gray-100" />

                    <button
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50"
                    >
                      <FiLogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  // Signed-out section
                  <>
                    <Link
                      href="/auth/login"
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <FiLogIn className="h-4 w-4" />
                      <span>Log in</span>
                    </Link>
                    <Link
                      href="/auth/register"
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <FiUserPlus className="h-4 w-4" />
                      <span>Register</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
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
