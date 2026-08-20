"use client";

import { useEvents } from "@/repositories/eventsRepository";
import { StatCard } from "@/components/ui/StatCard";

export function LandingMetricsStrip() {
  const { data: events = [] } = useEvents();

  const totalEvents = events.length;
  const totalPrizeCount = events.reduce((sum, e) => {
    const ev = e as { prizes?: unknown[]; Prizes?: unknown[] };
    return sum + (Array.isArray(ev.prizes) ? ev.prizes.length : Array.isArray(ev.Prizes) ? ev.Prizes.length : 0);
  }, 0);

  const items = [
    totalEvents > 0
      ? {
          label: "Sự kiện",
          value: totalEvents,
          subtext: "Đang và sắp diễn ra",
          accent: "var(--accent-primary)",
        }
      : null,
    totalPrizeCount > 0
      ? {
          label: "Giải thưởng",
          value: totalPrizeCount,
          subtext: "Đã cấu hình trên hệ thống",
          accent: "var(--color-warning)",
        }
      : null,
  ].filter(Boolean) as { label: string; value: number; subtext: string; accent: string }[];

  if (items.length === 0) return null;

  return (
    <section className="border-y border-[var(--border-muted)] bg-[var(--bg-panel)]/40 py-10">
      <div className="mx-auto w-full max-w-[var(--container-max)] px-4 sm:px-6">
        <h2 className="mb-4 text-sm font-medium text-[var(--text-muted)]">Thống kê tổng quan</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <StatCard
              key={item.label}
              label={item.label}
              value={item.value}
              subtext={item.subtext}
              accent={item.accent}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
