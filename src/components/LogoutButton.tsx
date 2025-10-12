"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST", cache: "no-store" });
    router.refresh(); // force server components (Header) to re-render
  }

  return (
    <button onClick={onLogout} className="px-3 py-2 rounded-md border">
      Log out
    </button>
  );
}
