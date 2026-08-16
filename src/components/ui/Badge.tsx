import { HTMLAttributes } from "react";

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

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-slate-800 text-slate-300 border-slate-700/60",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  info: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  team: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  mentor: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  judge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  coordinator: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export function Badge({
  tone = "neutral",
  dot = false,
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-sans text-xs font-semibold tracking-wide ${TONE_CLASSES[tone]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            tone === "success"
              ? "bg-emerald-400 animate-pulse"
              : tone === "danger"
              ? "bg-rose-400"
              : tone === "warning"
              ? "bg-amber-400"
              : "bg-cyan-400"
          }`}
        />
      )}
      {children}
    </span>
  );
}
