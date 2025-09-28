"use client";

import * as React from "react";

type Variant = "default" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-full font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
    const variants: Record<Variant, string> = {
      default: "bg-emerald-700 text-white hover:shadow-md disabled:opacity-60",
      outline: "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 disabled:opacity-60",
      ghost: "text-gray-700 hover:bg-gray-100 disabled:opacity-60",
    };
    const sizes: Record<Size, string> = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2",
      lg: "px-6 py-3",
    };
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], "focus-visible:ring-emerald-700", className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
