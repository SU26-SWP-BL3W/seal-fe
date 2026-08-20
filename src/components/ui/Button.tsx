import { ButtonHTMLAttributes, CSSProperties, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Accent = "primary" | "team" | "mentor" | "judge" | "coordinator";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  accent?: Accent;
}

const ACCENT_VALUE: Record<Accent, string> = {
  primary: "var(--accent-primary)",
  team: "var(--accent-team)",
  mentor: "var(--accent-mentor)",
  judge: "var(--accent-judge)",
  coordinator: "var(--accent-coordinator)",
};

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "border-transparent bg-[var(--btn-accent)] text-[color:var(--bg-base)] hover:brightness-110",
  secondary:
    "border-[var(--border-muted)] bg-[var(--bg-panel)] text-[color:var(--text-primary)] hover:bg-[var(--bg-input)]",
  ghost:
    "border-[var(--border-muted)] bg-transparent text-[color:var(--text-primary)] hover:border-[var(--btn-accent)] hover:bg-white/5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", accent = "primary", className = "", style, ...props }, ref) => (
    <button
      ref={ref}
      style={{ "--btn-accent": ACCENT_VALUE[accent], ...style } as CSSProperties}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--btn-accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)] disabled:pointer-events-none disabled:opacity-50 ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = "Button";
