import { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  subtext?: string;
  accent?: string;
}

export function StatCard({ label, value, subtext, accent = "var(--accent-primary)" }: StatCardProps) {
  return (
    <div
      className="flex flex-col rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-5 transition-colors hover:border-[var(--accent-primary)]/30"
      style={{ borderLeftWidth: 3, borderLeftColor: accent }}
    >
      <span className="text-xs font-medium text-[var(--text-muted)]">{label}</span>
      <div className="mt-1 font-display text-2xl font-semibold tabular-nums" style={{ color: accent }}>
        {value}
      </div>
      {subtext && <p className="mt-2 border-t border-[var(--border-muted)]/50 pt-2 text-xs text-[var(--text-muted)]">{subtext}</p>}
    </div>
  );
}
