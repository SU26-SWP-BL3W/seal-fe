"use client";

import { useEvents } from "@/repositories/eventsRepository";

export function LandingMetricsStrip() {
  const { data: events = [] } = useEvents();

  const totalEvents = events.length;
  const totalPrize = events.reduce((sum: number, e: any) => sum + (e.totalPrizeVnd || e.TotalPrizeVnd || 0), 0);
  const formattedPrize = totalPrize > 0 ? `${(totalPrize / 1_000_000).toFixed(0)} Triệu VNĐ` : "0 VNĐ";

  const metrics = [
    {
      id: "events",
      label: "TỔNG SỰ KIỆN",
      value: totalEvents > 0 ? `${totalEvents} Sự kiện` : "0 Sự kiện",
      subtext: "Đang & chuẩn bị diễn ra",
      toneVar: "var(--accent-primary)",
    },
    {
      id: "prizes",
      label: "TỔNG GIẢI THƯỞNG",
      value: formattedPrize,
      subtext: "Quỹ thưởng chính thức từ BTC",
      toneVar: "var(--color-warning)",
    },
    {
      id: "evaluation",
      label: "TIÊU CHÍ ĐÁNH GIÁ",
      value: "100% RBL",
      subtext: "Chấm điểm mù & Minh bạch",
      toneVar: "var(--color-success)",
    },
    {
      id: "platform",
      label: "NỀN TẢNG",
      value: "SEAL System",
      subtext: "Tự động phân công & Hiệu chuẩn",
      toneVar: "var(--accent-coordinator)",
    },
  ];

  return (
    <section className="w-full border-y border-[var(--border-muted)] bg-[var(--bg-panel)]/50 py-8 px-[var(--space-xl)] shadow-md">
      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="hud-live-dot h-2.5 w-2.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary)]" aria-hidden="true" />
            <span className="font-mono text-xs font-bold uppercase text-[var(--accent-primary)] tracking-widest">
              SYSTEM METRICS // THỐNG KÊ TỔNG QUAN
            </span>
          </div>
          <span className="font-mono text-[11px] text-[var(--text-muted)] hidden sm:inline-block">
            CẬP NHẬT THỜI GIAN THỰC TỪ BACKEND
          </span>
        </div>

        {/* 4 Cards Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              className="hud-clipped group relative flex flex-col justify-between border border-[var(--border-muted)] bg-[var(--bg-panel)] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--accent-primary)]/50 shadow-sm"
              style={{ borderLeft: `3px solid ${metric.toneVar}` }}
            >
              {/* Card Header Label */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-semibold text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                  {metric.label}
                </span>
                <span className="font-mono text-[10px] font-bold text-[var(--text-muted)] border border-[var(--border-muted)] bg-[var(--bg-input)] px-1.5 py-0.5">
                  #{metric.id.toUpperCase()}
                </span>
              </div>

              {/* Big Value */}
              <div
                className="font-mono text-3xl font-extrabold tracking-tight my-1"
                style={{ color: metric.toneVar }}
              >
                {metric.value}
              </div>

              {/* Subtext */}
              <div className="font-sans text-xs text-[var(--text-muted)] mt-1 border-t border-[var(--border-muted)]/50 pt-2">
                {metric.subtext}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
