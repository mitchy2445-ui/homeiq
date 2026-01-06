import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "homeiq_session";

// Routes that REQUIRE authentication
const PROTECTED_ROUTES = [
  "/favorites",
  "/messages",
  "/host",
];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Check if route is protected
  const isProtected = PROTECTED_ROUTES.some(
    (route) =>
      pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;

  // Not logged in → redirect to login
  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set(
      "next",
      pathname + search
    );

    return NextResponse.redirect(loginUrl);
  }

  // Logged in → allow
  return NextResponse.next();
}

/**
 * Apply middleware only to app routes (not static assets)
 */
export const config = {
  matcher: [
    "/favorites/:path*",
    "/messages/:path*",
    "/host/:path*",
  ],
};
