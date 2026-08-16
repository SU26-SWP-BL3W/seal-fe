import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  isError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", isError = false, ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full rounded-xl border bg-slate-950/70 px-4 py-2.5 font-sans text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all duration-150 ${
        isError
          ? "border-rose-500/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
          : "border-slate-800 focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/20"
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  )
);
Input.displayName = "Input";
