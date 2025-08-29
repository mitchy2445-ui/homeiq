// src/app/host/page.tsx  (redirect to first step)
import { redirect } from "next/navigation";
export default function HostIndex() {
  redirect("/host/basics");
}
