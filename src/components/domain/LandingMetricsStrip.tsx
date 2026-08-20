"use client";

import { useEvents } from "@/repositories/eventsRepository";

/** Thin honest metrics row — API data only, no StatCard wall. */
export function LandingMetricsStrip() {
  const { data: events = [] } = useEvents();

  const totalEvents = events.length;
  const totalPrizeCount = events.reduce((sum, e) => {
    const ev = e as { prizes?: unknown[]; Prizes?: unknown[] };
    return (
      sum +
      (Array.isArray(ev.prizes)
        ? ev.prizes.length
        : Array.isArray(ev.Prizes)
          ? ev.Prizes.length
          : 0)
    );
  }, 0);

  const items = [
    totalEvents > 0
      ? { label: "Sự kiện trên hệ thống", value: String(totalEvents) }
      : null,
    totalPrizeCount > 0
      ? { label: "Giải thưởng đã cấu hình", value: String(totalPrizeCount) }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  if (items.length === 0) return null;

  return (
    <section className="border-b border-[var(--border-muted)]">
      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-wrap items-stretch divide-x divide-[var(--border-muted)] px-4 sm:px-6">
        {items.map((item) => (
          <div key={item.label} className="flex min-w-[140px] flex-1 flex-col gap-1 px-0 py-8 first:pr-8 last:pl-8 sm:px-8 sm:first:pl-0 sm:last:pr-0">
            <span className="font-display text-3xl font-semibold tabular-nums text-[var(--text-primary)] sm:text-4xl">
              {item.value}
            </span>
            <span className="text-sm text-[var(--text-muted)]">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
