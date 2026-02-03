"use client";

import { useEffect, useMemo, useState } from "react";
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
  FiCalendar,
  FiCheckCircle,
} from "react-icons/fi";
import type { $Enums } from "@prisma/client";
import { useUnreadCount } from "@/hooks/useUnreadCount";

type Me = { email: string; role?: $Enums.Role } | null;
type VerificationStatus = "UNAUTHENTICATED" | "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export default function Header() {
  const pathname = usePathname();
  const { count: unread, refresh } = useUnreadCount();

  const showCenteredSearch = pathname === "/";

  const [me, setMe] = useState<Me>(null);
  const [vStatus, setVStatus] = useState<VerificationStatus>("UNAUTHENTICATED");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // Derived UI flags
  const isLoggedIn = !!me;
  const showAdmin = useMemo(() => me?.role === "ADMIN", [me]); // role-only
  const isHost = (me?.role === "LANDLORD") || showAdmin;

  // CTA
  const ctaLabel = vStatus === "VERIFIED" ? "Post a listing" : "Become a Landlord";
  const ctaHref = vStatus === "VERIFIED" ? "/landlord/new/basics" : "/landlord/verify";

  // Fetch auth + verification status (no-store, include cookies)
  async function loadMe() {
    setLoading(true);
    try {
      const [meRes, vRes] = await Promise.all([
        fetch("/api/auth/me", { method: "GET", cache: "no-store", credentials: "include" }),
        fetch("/api/me/verification-status", { method: "GET", cache: "no-store", credentials: "include" }),
      ]);

      let user: Me = null;
      if (meRes.ok) {
        const d = await meRes.json().catch(() => ({}));
        user = d?.user ?? null;
      }

      let status: VerificationStatus = "UNAUTHENTICATED";
      if (vRes.ok) {
        const d = await vRes.json().catch(() => ({}));
        status = (d?.status as VerificationStatus) ?? (user ? "UNVERIFIED" : "UNAUTHENTICATED");
      } else {
        status = user ? "UNVERIFIED" : "UNAUTHENTICATED";
      }

      setMe(user);
      setVStatus(status);
    } catch {
      setMe(null);
      setVStatus("UNAUTHENTICATED");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe().then(() => {
      refresh();
    });

    const onFocus = () => {
      loadMe().then(() => {
        refresh();
      });
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === "homeiq_auth_changed") {
        loadMe().then(() => {
          refresh();
        });
      }
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  // Close the hamburger when navigating
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", cache: "no-store", credentials: "include" });
    } finally {
      try {
        localStorage.setItem("homeiq_auth_changed", Math.random().toString());
      } catch {}
      window.location.href = "/";
    }
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
          {/* Identity-gated landlord CTA (always visible) */}
          <Link
            href={ctaHref}
            className="hidden sm:inline-flex items-center gap-2 text-sm font-medium hover:underline"
            title={ctaLabel}
          >
            <FiHome className="h-4 w-4" />
            {ctaLabel}
            {!loading && vStatus === "VERIFIED" && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                <FiCheckCircle className="h-3 w-3" />
                Verified
              </span>
            )}
          </Link>

          {/* Quick Viewings shortcut for hosts (desktop) */}
          {!loading && isHost && (
            <Link
              href="/host/viewings"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium hover:underline"
              title="Manage viewing requests"
            >
              <FiCalendar className="h-4 w-4" />
              Viewings
            </Link>
          )}

          {/* Renter: My Viewings (desktop) */}
          {!loading && isLoggedIn && (
            <Link
              href="/viewings"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium hover:underline"
              title="My viewing requests"
            >
              Viewings
            </Link>
          )}

          <Link
            aria-label="Favorites"
            href="/favorites"
            className="p-2 rounded-full hover:bg-gray-50"
          >
            <FiHeart className="h-5 w-5" />
          </Link>

          <Link
            href="/messages"
            aria-label="Messages"
            className="relative p-2 rounded-full hover:bg-gray-50"
          >
            <FiMessageCircle className="h-5 w-5" />

            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center px-1">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>

          <button
            aria-label="Notifications"
            className="p-2 rounded-full hover:bg-gray-50"
            type="button"
          >
            <FiBell className="h-5 w-5" />
          </button>

          {/* Auth quick actions (desktop). Hide until we know. */}
          {!loading && (isLoggedIn ? (
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
                onClick={() => {
                  try { localStorage.setItem("homeiq_auth_changed", Math.random().toString()); } catch {}
                }}
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                className="text-sm rounded-full border px-3 py-1.5 hover:bg-gray-50"
                onClick={() => {
                  try { localStorage.setItem("homeiq_auth_changed", Math.random().toString()); } catch {}
                }}
              >
                Register
              </Link>
            </div>
          ))}

          {/* Hamburger menu */}
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
                {!loading && isLoggedIn ? (
                  <>
                    <div className="px-3 py-2 text-xs text-gray-500">
                      Signed in as <span className="font-medium">{me?.email}</span>
                    </div>

                    {/* Admin Center (only if allowed) */}
                    {showAdmin && (
                      <Link
                        href="/admin/listings"
                        role="menuitem"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50"
                        onClick={() => setMenuOpen(false)}
                      >
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

                    {/* Landlord CTA inside menu */}
                    <Link
                      href={ctaHref}
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <FiHome className="h-4 w-4" />
                      <span>{ctaLabel}</span>
                      {vStatus === "VERIFIED" && (
                        <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-emerald-600">
                          <FiCheckCircle className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </Link>

                    {isHost && (
                      <>
                        <div className="mt-2 px-3 py-1 text-xs text-gray-500">Host</div>
                        <Link
                          href="/host/listings"
                          role="menuitem"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50"
                          onClick={() => setMenuOpen(false)}
                        >
                          <FiHome className="h-4 w-4" />
                          <span>My Listings</span>
                        </Link>
                        <Link
                          href="/host/viewings"
                          role="menuitem"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50"
                          onClick={() => setMenuOpen(false)}
                        >
                          <FiCalendar className="h-4 w-4" />
                          <span>Viewings</span>
                        </Link>
                      </>
                    )}

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
                  // Signed-out section (or still loading => show nothing else)
                  <>
                    <Link
                      href={ctaHref}
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <FiHome className="h-4 w-4" />
                      <span>{ctaLabel}</span>
                    </Link>

                    {!loading && (
                      <>
                        <div className="my-2 h-px bg-gray-100" />
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