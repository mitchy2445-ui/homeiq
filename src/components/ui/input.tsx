"use client";

import * as React from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// Use a type alias instead of an empty interface extending the supertype
export type InputProps = React.ComponentProps<"input">;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
