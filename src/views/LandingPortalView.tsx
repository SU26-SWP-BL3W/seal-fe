"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { SealShield } from "@/components/domain/SealShield";
import { useCountdown } from "@/lib/useCountdown";
import {
  STATUS_LABEL,
  STATUS_DOT_VAR,
  STATUS_TONE,
  TRACK_META,
  DEFAULT_TRACK_META,
  type EventCardData,
} from "@/viewModels/eventsMetadata";
import { useLandingPreviewViewModel } from "@/viewModels/useLandingPreviewViewModel";
import { LandingMetricsStrip } from "@/components/domain/LandingMetricsStrip";
import { LandingWorkflowSteps } from "@/components/domain/LandingWorkflowSteps";
import { LandingLeaderboardPodium } from "@/components/domain/LandingLeaderboardPodium";

export function LandingPortalView() {
  const { latestEvent, featuredEvents } = useLandingPreviewViewModel();

  return (
    <main className="hud-lattice flex flex-1 flex-col overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: TACTICAL CYBER HERO & QUICK PROTOCOL BAR (SYMMETRICAL)
         ───────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center gap-8 px-6 py-20 md:py-28 text-center overflow-hidden">
        {/* Soft Center Radial Glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] md:h-[600px] md:w-[600px] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.12)_0%,rgba(10,15,29,0)_70%)] blur-3xl" aria-hidden="true" />

        {/* Foreground Content */}
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-4xl w-full">

          {/* Central Shield Logo */}
          <div className="relative flex items-center justify-center mb-1">
            <div className="border border-[var(--accent-primary)]/40 bg-[var(--bg-panel)]/90 p-3.5 hud-clipped shadow-[0_0_25px_rgba(45,212,191,0.15)]">
              <SealShield className="h-16 w-16 md:h-20 md:w-20 text-[var(--accent-primary)]" />
            </div>
          </div>

          {/* Status Tag Line */}
          <div className="flex items-center gap-2 bg-[var(--bg-panel)]/90 border border-[var(--accent-primary)]/30 px-4 py-1.5 hud-clipped backdrop-blur-sm font-mono text-xs text-[var(--accent-primary)] tracking-wider">
            <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            <span>HỆ THỐNG ĐẤU TRƯỜNG HACKATHON // SEAL PLATFORM</span>
          </div>

          {/* Main Heading */}
          <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-extrabold uppercase leading-[1.15] text-[var(--text-primary)] tracking-wide w-full text-center">
            NƠI Ý TƯỞNG CÔNG NGHỆ
            <br />
            <span className="bg-gradient-to-r from-teal-300 via-cyan-400 to-sky-400 bg-clip-text text-transparent">
              BỨT PHÁ GIỚI HẠN
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl w-full font-sans text-sm md:text-base text-slate-400 leading-relaxed text-center">
            Đấu trường hackathon dành cho sinh viên toàn quốc — tranh tài xây dựng sản phẩm thực tế,
            nhận tư vấn từ Mentor và nhận đánh giá minh bạch theo chuẩn khoa học RBL.
          </p>

          {/* Symmetrical Button Group */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/events">
              <button className="hud-clipped relative px-8 py-3.5 bg-[var(--accent-primary)] text-[var(--bg-base)] font-mono font-bold tracking-wider uppercase text-sm transition-all duration-200 hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] focus:outline-none min-w-[200px]">
                {"// "}KHÁM PHÁ SỰ KIỆN &gt;
              </button>
            </Link>
            <Link href="/register">
              <button className="hud-clipped px-8 py-3.5 bg-[var(--bg-panel)] border border-[var(--border-muted)] text-[var(--text-primary)] hover:text-white hover:border-[var(--accent-primary)] hover:bg-[rgba(45,212,191,0.08)] font-mono text-sm tracking-wider uppercase transition-all duration-200 min-w-[200px]">
                [ ĐĂNG KÝ THAM GIA ]
              </button>
            </Link>
          </div>

          {/* Quick Access Protocol */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 font-mono text-xs border-t border-slate-800/80 pt-5 w-full max-w-xl">
            <span className="text-slate-500 font-semibold">TRUY CẬP NHANH:</span>
            <Link href="/my-team" className="border border-[var(--accent-team)]/40 bg-[var(--bg-panel)] px-3.5 py-1.5 text-[var(--accent-team)] hover:bg-[var(--accent-team)]/20 transition-colors hud-clipped font-semibold">
              [ ĐỘI THI ]
            </Link>
            <Link href="/judge/scoring" className="border border-[var(--accent-judge)]/40 bg-[var(--bg-panel)] px-3.5 py-1.5 text-[var(--accent-judge)] hover:bg-[var(--accent-judge)]/20 transition-colors hud-clipped font-semibold">
              [ GIÁM KHẢO ]
            </Link>
            <Link href="/coordinator/dashboard" className="border border-[var(--accent-coordinator)]/40 bg-[var(--bg-panel)] px-3.5 py-1.5 text-[var(--accent-coordinator)] hover:bg-[var(--accent-coordinator)]/20 transition-colors hud-clipped font-semibold">
              [ BAN TỔ CHỨC ]
            </Link>
          </div>
        </div>
      </section>



      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: LIVE METRICS STRIP
         ───────────────────────────────────────────────────────────── */}
      <LandingMetricsStrip />

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: LATEST EVENT SPOTLIGHT (ASYMMETRIC COMMAND PANEL)
         ───────────────────────────────────────────────────────────── */}
      {latestEvent && <LatestEventSpotlight event={latestEvent} />}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: FEATURED EVENTS PREVIEW & TRACK EXPLORER
         ───────────────────────────────────────────────────────────── */}
      {featuredEvents.length > 0 && (
        <PreviewSection title="SỰ KIỆN NỔI BẬT KHÁC" events={featuredEvents} showAllHref="/events" />
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: OPERATIONAL WORKFLOW STEPS
         ───────────────────────────────────────────────────────────── */}
      <LandingWorkflowSteps />

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: PODIUM HALL OF FAME & RBL PROOF
         ───────────────────────────────────────────────────────────── */}
      <LandingLeaderboardPodium />

      {/* ─────────────────────────────────────────────────────────────
          SECTION 7: FREQUENTLY ASKED QUESTIONS (FAQ HUD CONSOLE)
         ───────────────────────────────────────────────────────────── */}
      <LandingFaqSection />
    </main>
  );
}

{/* ────────────────────────────────────────────────────────────────
    SPOTLIGHT SỰ KIỆN MỚI NHẤT — ADVANCED HIGH-IMPACT COMMAND DECK PANEL
   ──────────────────────────────────────────────────────────────── */}
function LatestEventSpotlight({ event }: { event: EventCardData }) {
  const countdownTarget = event.status === "ongoing" ? event.endDate : event.registrationEndDate;
  const countdown = useCountdown(event.status === "ended" ? null : countdownTarget);
  const countdownLabel = event.status === "ongoing" ? "HẠN NỘP BÀI THI CÒN LẠI" : "HẠN ĐĂNG KÝ CÒN LẠI";
  const fillPercent = Math.min(100, Math.round((event.teamCount / event.maxTeams) * 100));

  return (
    <section className="border-t border-[var(--border-muted)] px-[var(--space-xl)] py-[calc(var(--space-xl)*1.5)] relative">
      <div className="mx-auto w-full max-w-[var(--container-max)]">
        {/* Tactical Header Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-muted)] pb-3">
          <div className="flex items-center gap-3">
            <span className="hud-live-dot h-2.5 w-2.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_10px_var(--accent-primary)]" />
            <span className="font-mono text-xs font-bold tracking-[0.2em] text-[var(--accent-primary)] uppercase">
              [ SPOTLIGHT PROTOCOL // SỰ KIỆN HOT NHẤT ]
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs text-[var(--text-muted)]">
            <span className="hidden sm:inline-block text-[var(--accent-mentor)]">● LIVE TRACKING</span>
            <span>SEASON: <strong className="text-[var(--text-primary)]">{event.season.toUpperCase()} {event.year}</strong></span>
          </div>
        </div>

        {/* Main High-Impact HUD Panel */}
        <div className="hud-clipped hud-glow-cyan hud-scanline-once group relative overflow-hidden bg-[var(--bg-panel)] p-6 md:p-8 transition-all duration-300 hover:shadow-[0_0_35px_rgba(0,217,255,0.2)] border border-[var(--border-muted)]">
          {/* Tactical Corner Brackets */}
          <div className="pointer-events-none absolute top-2 left-2 font-mono text-[10px] text-[var(--accent-primary)] opacity-60">+</div>
          <div className="pointer-events-none absolute top-2 right-2 font-mono text-[10px] text-[var(--accent-primary)] opacity-60">+</div>
          <div className="pointer-events-none absolute bottom-2 left-2 font-mono text-[10px] text-[var(--accent-primary)] opacity-60">+</div>
          <div className="pointer-events-none absolute bottom-2 right-2 font-mono text-[10px] text-[var(--accent-primary)] opacity-60">+</div>

          {/* Background Watermark Shield */}
          <SealShield className="hud-pulse pointer-events-none absolute -right-10 -bottom-10 h-72 w-72 opacity-15 md:h-96 md:w-96 text-[var(--accent-primary)]" />

          <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
            {/* LEFT COLUMN: Event Content & High-Impact Info */}
            <div className="flex flex-col items-start gap-4">
              {/* Badges & Status */}
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone={STATUS_TONE[event.status]}>{STATUS_LABEL[event.status]}</Badge>
                {event.status === "ongoing" && (
                  <span className="inline-flex items-center gap-2 border border-[var(--accent-judge)]/40 bg-[var(--accent-judge)]/10 px-3 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent-judge)] hud-clipped">
                    <span className="hud-live-dot h-2 w-2 rounded-full bg-[var(--accent-judge)] shadow-[0_0_8px_var(--accent-judge)]" />
                    ĐANG TRỰC TIẾP CHẤM BÀI
                  </span>
                )}
                <span className="font-mono text-xs text-[var(--text-muted)] border border-[var(--border-muted)] px-2 py-0.5">
                  ID: #{event.id.toUpperCase()}
                </span>
              </div>

              {/* Event Title & Tagline */}
              <div>
                <h3 className="font-display text-3xl font-extrabold uppercase leading-tight text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] md:text-5xl transition-colors">
                  {event.eventName}
                </h3>
                <p className="mt-2 text-base text-[var(--text-muted)] max-w-2xl font-sans leading-relaxed">
                  {event.tagline}
                </p>
              </div>

              {/* Track Modules */}
              {event.tracks.length > 0 && (
                <div className="flex flex-col gap-2 w-full pt-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    HẠNG MỤC CÔNG NGHỆ (TRACKS):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {event.tracks.map((track) => {
                      const meta = TRACK_META[track] || DEFAULT_TRACK_META;
                      return (
                        <div
                          key={track}
                          className="flex items-center gap-2 border border-[var(--border-muted)] bg-[var(--bg-input)] px-3 py-1.5 font-mono text-xs text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:scale-[1.02] transition-all cursor-default hud-clipped"
                        >
                          <span className="h-2 w-2 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: meta.accent, color: meta.accent }} />
                          <span className="font-semibold">{track}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Key Metrics: Capacity Bar & Prize Highlight Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-2">
                {/* Capacity Progress Bar */}
                <div className="border border-[var(--border-muted)] bg-[var(--bg-input)]/70 p-3.5 hud-clipped flex flex-col justify-between">
                  <div className="flex items-center justify-between font-mono text-xs mb-1.5">
                    <span className="text-[var(--text-muted)]">CỔNG ĐĂNG KÝ ĐỘI THI</span>
                    <span className="font-bold text-[var(--accent-team)]">{event.teamCount} / {event.maxTeams} Đội ({fillPercent}%)</span>
                  </div>
                  {/* Outer Bar */}
                  <div className="h-2.5 w-full bg-[var(--bg-base)] border border-[var(--border-muted)] overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--accent-team)] via-[var(--accent-primary)] to-[var(--accent-judge)] transition-all duration-500 shadow-[0_0_10px_rgba(0,217,255,0.5)]"
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-[var(--text-muted)] mt-1">
                    Còn {event.maxTeams - event.teamCount} suất thi đấu cuối cùng
                  </span>
                </div>

                {/* Prize Pool Highlight Box */}
                <div className="border border-[var(--accent-judge)]/50 bg-[var(--accent-judge)]/10 p-3.5 hud-clipped flex items-center gap-3">
                  <div className="flex px-2 py-1 shrink-0 items-center justify-center border border-[var(--accent-judge)] bg-[var(--bg-input)] font-mono text-xs font-bold text-[var(--accent-judge)] shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                    [PRIZE]
                  </div>

                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--accent-judge)]">
                      TỔNG GIÁ TRỊ GIẢI THƯỞNG
                    </span>
                    <span className="font-mono text-xl font-extrabold text-[var(--accent-judge)] tracking-tight">
                      {formatVnd(event.totalPrizeVnd)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button Protocol */}
              <div className="flex flex-wrap items-center gap-4 pt-3 w-full sm:w-auto">
                <Link href={`/events/${event.id}`} className="w-full sm:w-auto">
                  <button className="hud-clipped w-full sm:w-auto px-7 py-3.5 bg-[var(--accent-primary)] text-[var(--bg-base)] font-mono font-extrabold tracking-wider uppercase text-sm transition-all duration-200 hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] focus:outline-none flex items-center justify-center gap-2">
                    <span>{"// "}XEM CHI TIẾT &amp; ĐĂNG KÝ NGAY</span>
                    <span className="transition-transform duration-200 group-hover:translate-x-1">&gt;</span>
                  </button>
                </Link>
                <Link href="/events" className="w-full sm:w-auto">
                  <button className="hud-clipped w-full sm:w-auto px-5 py-3.5 bg-transparent border border-[var(--border-muted)] text-[var(--text-primary)] hover:text-white hover:border-[var(--accent-primary)] hover:bg-[rgba(0,217,255,0.08)] font-mono text-xs tracking-wider uppercase transition-all duration-200">
                    [ XEM THỂ LỆ SỰ KIỆN ]
                  </button>
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN: Compact Countdown + Round Timeline */}
            {!countdown.isPast && (
              <div className="flex flex-col gap-4 border border-[var(--border-muted)]/60 bg-[var(--bg-base)]/70 p-5">

                {/* Label */}
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  <span className={`h-1.5 w-1.5 rounded-full ${countdown.isUrgent ? "bg-[var(--color-danger)] animate-ping" : "bg-[var(--accent-primary)]"}`} />
                  {countdownLabel}
                </div>

                {/* Compact single-row countdown */}
                <div className="flex items-center justify-between gap-1" suppressHydrationWarning>
                  {[
                    { value: countdown.days, label: "ngày" },
                    { value: countdown.hours, label: "giờ" },
                    { value: countdown.minutes, label: "phút" },
                    { value: countdown.seconds, label: "giây" },
                  ].map((u, i) => (
                    <div key={u.label} className="flex items-baseline gap-1" suppressHydrationWarning>
                      <span
                        className={`font-mono font-bold tabular-nums text-2xl tracking-tight ${countdown.isUrgent ? "text-[var(--color-danger)]" : "text-[var(--accent-primary)]"}`}
                        suppressHydrationWarning
                      >
                        {String(u.value).padStart(2, "0")}
                      </span>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">{u.label}</span>
                      {i < 3 && <span className="font-mono text-[var(--border-muted)] ml-1">:</span>}
                    </div>
                  ))}
                </div>

                {/* Round Timeline */}
                {event.rounds && event.rounds.length > 0 && (
                  <div className="flex flex-col gap-0 border-t border-[var(--border-muted)]/50 pt-3 mt-1">
                    <span className="font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-widest mb-2">
                      Lịch vòng thi
                    </span>
                    {event.rounds.map((r, idx) => {
                      const isPast = new Date(r.startDate) < new Date();
                      return (
                        <div key={r.id} className="flex items-center gap-3 py-1.5 group">
                          {/* Timeline dot + line */}
                          <div className="flex flex-col items-center shrink-0 w-3">
                            <span className={`w-2 h-2 rounded-full border ${isPast ? "bg-[var(--text-muted)]/30 border-[var(--border-muted)]" : "bg-[var(--accent-primary)]/80 border-[var(--accent-primary)]"}`} />
                            {idx < event.rounds.length - 1 && (
                              <span className="w-px flex-1 bg-[var(--border-muted)]/50 h-3 mt-0.5" />
                            )}
                          </div>
                          {/* Content */}
                          <div className="flex-1 flex items-center justify-between min-w-0">
                            <span className={`font-mono text-[11px] font-medium ${isPast ? "text-[var(--text-muted)]/50 line-through" : "text-[var(--text-primary)]"}`}>
                              {r.roundName}
                            </span>
                            <span className="font-mono text-[10px] text-[var(--text-muted)] shrink-0 ml-2">
                              {formatShortDate(r.startDate)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {countdown.isUrgent && (
                  <span className="font-mono text-[10px] font-bold text-[var(--color-danger)] uppercase tracking-wider animate-pulse text-center border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 py-1">
                    ⚠ Sắp đóng cổng — Nộp bài ngay!
                  </span>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}

function formatVnd(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)} ₫`;
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}



function PreviewSection({
  title,
  events,
  showAllHref,
}: {
  title: string;
  events: EventCardData[];
  showAllHref?: string;
}) {
  const featuredEvent = events[0];
  const sideEvents = events.slice(1, 3);

  return (
    <section className="border-t border-[var(--border-muted)] px-[var(--space-xl)] py-[calc(var(--space-xl)*1.2)]">
      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-[var(--space-lg)]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold uppercase text-[color:var(--text-primary)] md:text-2xl">{title}</h2>
          {showAllHref && (
            <Link
              href={showAllHref}
              className="font-mono text-sm text-[color:var(--accent-primary)] hover:text-white hover:underline"
            >
              Xem tất cả sự kiện →
            </Link>
          )}
        </div>

        {/* Bố cục bất đối xứng Cyberpunk HUD: 1 Card Lớn bên trái + 2 Card Nhỏ xếp dọc bên phải */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-[var(--space-lg)]">
          {featuredEvent && (
            <Link
              href={`/events/${featuredEvent.id}`}
              className="hud-clipped group flex flex-col justify-between border border-[var(--border-muted)] bg-[var(--bg-panel)] p-6 transition-all hover:border-[var(--accent-primary)]/70 hover:shadow-lg"
              style={{ borderTop: `4px solid ${STATUS_DOT_VAR[featuredEvent.status]}` }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge tone={STATUS_TONE[featuredEvent.status]}>{STATUS_LABEL[featuredEvent.status]}</Badge>
                  <span className="font-mono text-xs font-bold text-[var(--accent-primary)] uppercase">
                    FEATURED HIGHLIGHT // {featuredEvent.season} {featuredEvent.year}
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-2xl font-bold text-[color:var(--text-primary)] group-hover:text-[color:var(--accent-primary)] transition-colors">
                    {featuredEvent.eventName}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--text-muted)] line-clamp-3">
                    {featuredEvent.tagline}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-[var(--border-muted)] pt-4 flex items-center justify-between font-mono text-xs text-[color:var(--text-muted)]">
                <span>{featuredEvent.teamCount} Đội Thi Đã Đăng Ký</span>
                <span className="font-bold text-[var(--accent-judge)] text-sm">{formatVnd(featuredEvent.totalPrizeVnd)}</span>
              </div>
            </Link>
          )}

          <div className="flex flex-col gap-[var(--space-lg)] justify-between">
            {sideEvents.map((ev) => (
              <PreviewCard key={ev.id} event={ev} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewCard({ event }: { event: EventCardData }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="hud-clipped group flex flex-col justify-between border border-[var(--border-muted)] bg-[var(--bg-panel)] p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/50"
      style={{ borderTop: `3px solid ${STATUS_DOT_VAR[event.status]}` }}
    >
      <div>
        <div className="flex items-center justify-between">
          <Badge tone={STATUS_TONE[event.status]}>{STATUS_LABEL[event.status]}</Badge>
          <span className="font-mono text-[10px] text-[var(--text-muted)]">{event.season} {event.year}</span>
        </div>

        <h3 className="mt-2 font-display text-base font-bold text-[color:var(--text-primary)] group-hover:text-[color:var(--accent-primary)] transition-colors">
          {event.eventName}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-[color:var(--text-muted)]">{event.tagline}</p>
      </div>

      <div className="mt-3 border-t border-[var(--border-muted)] pt-2.5 flex items-center justify-between font-mono text-xs text-[color:var(--text-muted)]">
        <span>{event.teamCount} Đội thi</span>
        <span className="font-bold text-[var(--accent-judge)]">{formatVnd(event.totalPrizeVnd)}</span>
      </div>
    </Link>
  );
}

{/* ────────────────────────────────────────────────────────────────
    SECTION 7: FAQ TERMINAL LOG ACCORDION COMPONENT
   ──────────────────────────────────────────────────────────────── */}
function LandingFaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const FAQS = [
    {
      q: "Sinh viên ngoài Đại học FPT có được tham gia SEAL Hackathon không?",
      a: "Có! Sinh viên tất cả các trường đại học toàn quốc đều được chào đón. Sinh viên ngoài FPT chỉ cần tải ảnh thẻ sinh viên lên mục Profile để được duyệt xác thực tài khoản.",
    },
    {
      q: "Quy định về quy mô đội thi như thế nào?",
      a: "Mỗi đội thi bắt buộc có từ 3 đến 5 thành viên. Trưởng nhóm có thể gửi lời mời trực tiếp hoặc tìm kiếm thành viên chưa có đội qua hệ thống ghép đội.",
    },
    {
      q: "Điểm số RBL được tính toán và đảm bảo tính minh bạch ra sao?",
      a: "Mỗi bài nộp được chấm độc lập bởi 4 Giám khảo. Hệ thống tự động tính tổng điểm theo trọng số tiêu chí và tính hệ số độ lệch Inter-rater Delta. Nếu độ lệch vượt ngưỡng 2.0, bài nộp sẽ được chuyển tới giám khảo trưởng soát xét lại.",
    },
    {
      q: "Tôi có thể đăng ký thi cùng lúc nhiều Track trong 1 sự kiện không?",
      a: "Mỗi đội thi chỉ được chọn duy nhất 1 Track công nghệ chính cho mỗi sự kiện để tập trung nguồn lực phát triển sản phẩm chất lượng nhất.",
    },
  ];

  return (
    <section className="border-t border-[var(--border-muted)] px-[var(--space-xl)] py-[calc(var(--space-xl)*1.5)] mb-12">
      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-[var(--space-xl)]">
        <div className="flex flex-col items-center text-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-primary)]">
            KNOWLEDGE BASE // TERMINAL FAQ LOGS
          </span>
          <h2 className="font-display text-2xl font-bold uppercase text-[var(--text-primary)] md:text-4xl">
            CÂU HỎI THƯỜNG GẶP
          </h2>
        </div>

        <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            const logNumber = `[Q.0${idx + 1}]`;
            return (
              <div
                key={idx}
                className={`hud-clipped border transition-all bg-[var(--bg-panel)] overflow-hidden ${isOpen ? "border-[var(--accent-primary)] shadow-sm" : "border-[var(--border-muted)]"
                  }`}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-4 text-left font-display text-sm font-bold text-[var(--text-primary)] flex items-center justify-between hover:text-[var(--accent-primary)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[var(--accent-primary)] bg-[var(--bg-input)] px-2 py-1 border border-[var(--accent-primary)]/30">
                      {logNumber}
                    </span>
                    <span>{faq.q}</span>
                  </div>
                  <span className="font-mono text-sm text-[var(--accent-primary)] font-bold">{isOpen ? "[ - ]" : "[ + ]"}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 font-sans text-xs leading-relaxed text-[var(--text-muted)] border-t border-[var(--border-muted)] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
export default LandingPortalView;
