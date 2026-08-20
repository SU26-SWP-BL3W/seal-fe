import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] px-3 py-2.5 text-sm text-[color:var(--text-primary)] outline-none transition-colors placeholder:text-[color:var(--text-muted)]/60 focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/30 ${className}`}
      {...props}
    />
  ),
);
Input.displayName = "Input";
