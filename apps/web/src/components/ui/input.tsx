import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-12 w-full rounded-2xl border border-rf-border bg-white px-4 text-sm text-rf-midnight outline-none transition placeholder:text-rf-muted focus:border-rf-green focus:ring-4 focus:ring-rf-green/10 ${className}`}
      {...props}
    />
  );
}
