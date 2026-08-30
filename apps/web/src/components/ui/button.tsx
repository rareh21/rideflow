import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const styles = {
    primary: "bg-rf-green text-rf-midnight shadow-[0_8px_24px_rgba(22,199,106,0.22)] hover:bg-rf-green-dark",
    secondary: "border border-rf-border bg-white text-rf-midnight hover:bg-rf-surface-muted",
    ghost: "bg-transparent text-rf-midnight hover:bg-rf-surface-muted",
    danger: "bg-rf-danger text-white hover:bg-red-600",
  }[variant];

  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
      {...props}
    />
  );
}
