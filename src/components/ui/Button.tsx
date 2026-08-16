import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";
type Accent = "primary" | "team" | "mentor" | "judge" | "coordinator";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  accent?: Accent;
  isLoading?: boolean;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-semibold hover:from-cyan-400 hover:to-blue-500 hover:shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98]",
  secondary:
    "border border-slate-700/80 bg-slate-800/80 text-slate-100 font-medium hover:bg-slate-700/90 hover:border-slate-600 active:scale-[0.98]",
  ghost:
    "bg-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white active:scale-[0.98]",
  danger:
    "bg-rose-600/90 text-white font-medium hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-600/20 active:scale-[0.98]",
  success:
    "bg-emerald-600/90 text-white font-medium hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-[0.98]",
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      accent,
      isLoading = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    // If accent is provided without explicit variant override
    let computedVariant = variant;
    if (accent === "judge") computedVariant = "primary";

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-sans tracking-normal transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 disabled:pointer-events-none disabled:opacity-50 ${VARIANT_CLASS[computedVariant]} ${SIZE_CLASS[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
