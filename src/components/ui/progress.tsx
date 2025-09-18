"use client";

import * as React from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const Progress = ({ value = 0, className }: { value?: number; className?: string }) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-gray-200", className)}>
      <div
        className="h-full rounded-full"
        style={{ width: `${clamped}%`, backgroundColor: "#1A6E4E" }}
      />
    </div>
  );
};
