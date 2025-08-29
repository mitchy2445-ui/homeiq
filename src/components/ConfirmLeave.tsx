"use client";
import { useEffect } from "react";

/** Blocks accidental tab close/refresh while dirty. */
export default function ConfirmLeave({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // shows native confirm dialog
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [enabled]);
  return null;
}
