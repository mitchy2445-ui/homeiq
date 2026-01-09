// src/lib/appUrl.ts
export function appUrl() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "http://localhost:3000";
  return base.replace(/\/+$/, "");
}

export function buildVerifyLink(token: string) {
  // ✅ remove /api
  const url = new URL("/auth/verify", appUrl());
  url.searchParams.set("token", token);
  return url.toString();
}
