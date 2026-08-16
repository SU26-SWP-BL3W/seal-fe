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

// Badge phẳng, nền bán trong suốt + viền 1px cùng màu — KHÔNG bo tròn pill,
// đúng "Geometric Discipline" của proposal (góc vuông thay vì rounded-full).
export function Badge({
  tone = "neutral",
  className = "",
  style,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      style={{ "--badge-tone": TONE_VALUE[tone], ...style } as CSSProperties}
      className={`inline-flex items-center gap-[var(--space-xs)] border border-[var(--badge-tone)]/30 bg-[var(--badge-tone)]/10 px-[var(--space-sm)] py-[2px] font-mono text-[length:var(--fs-caption-sm)] font-bold uppercase tracking-wider text-[color:var(--badge-tone)] ${className}`}
      {...props}
    />
  );
}
