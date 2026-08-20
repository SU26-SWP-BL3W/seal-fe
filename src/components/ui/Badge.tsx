import { CSSProperties, HTMLAttributes } from "react";

type Tone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "team"
  | "mentor"
  | "judge"
  | "coordinator";

const TONE_VALUE: Record<Tone, string> = {
  neutral: "var(--text-muted)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  info: "var(--accent-primary)",
  team: "var(--accent-team)",
  mentor: "var(--accent-mentor)",
  judge: "var(--accent-judge)",
  coordinator: "var(--accent-coordinator)",
};

export function Badge({
  tone = "neutral",
  className = "",
  style,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      style={{ "--badge-tone": TONE_VALUE[tone], ...style } as CSSProperties}
      className={`inline-flex items-center gap-1 rounded-md border border-[var(--badge-tone)]/30 bg-[var(--badge-tone)]/10 px-2 py-0.5 text-xs font-medium text-[color:var(--badge-tone)] ${className}`}
      {...props}
    />
  );
}
