"use client";

import React from "react";
import clsx from "clsx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
  className?: string;
};

export default function Button({ variant = "primary", className, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={clsx(
        "w-full rounded-xl px-4 py-3 font-medium transition",
        variant === "primary" && "bg-brand-600 text-white hover:opacity-90",
        variant === "outline" && "border hover:bg-gray-50",
        className
      )}
    />
  );
}
