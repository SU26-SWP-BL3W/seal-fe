"use client";

import { useEvents } from "@/repositories/eventsRepository";

/**
 * Thin live strip — API data only.
 * Not the old 4-card "SYSTEM METRICS" wall with fake "100% Minh Bạch".
 */
export function LandingMetricsStrip() {
  const { data: events = [] } = useEvents();

  const totalEvents = events.length;
  const totalPrizeCount = events.reduce((sum: number, e: any) => {
    const prizes = e.prizes ?? e.Prizes;
    return sum + (Array.isArray(prizes) ? prizes.length : 0);
  }, 0);
  const openCount = events.filter((e: any) => {
    const s = (e.status || e.Status || "").toString().toLowerCase();
    return s.includes("registration") || s.includes("ongoing") || s === "open";
  }).length;

  const cells = [
    { label: "Sự kiện", value: String(totalEvents) },
    openCount > 0 ? { label: "Đang mở / diễn ra", value: String(openCount) } : null,
    totalPrizeCount > 0
      ? { label: "Giải đã cấu hình", value: String(totalPrizeCount) }
      : { label: "Giải đã cấu hình", value: "—" },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <section className="border-b border-[var(--border-muted)] bg-[var(--bg-panel)]">
      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col sm:flex-row">
        <div className="flex items-center gap-2 border-b border-[var(--border-muted)] px-4 py-3 sm:w-48 sm:shrink-0 sm:border-b-0 sm:border-r sm:px-6">
          <span className="hud-live-dot h-2 w-2 rounded-full bg-[var(--accent-primary)]" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-primary)]">
            Live feed
          </span>
        </div>
        <div className="grid flex-1 grid-cols-1 divide-y divide-[var(--border-muted)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {cells.map((c) => (
            <div key={c.label} className="flex items-baseline justify-between gap-3 px-4 py-4 sm:flex-col sm:items-start sm:justify-center sm:px-6">
              <span className="font-display text-2xl font-bold tabular-nums text-[var(--text-primary)] sm:text-3xl">
                {c.value}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
