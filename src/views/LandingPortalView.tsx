"use client";

/**
 * Landing — Command Deck (proposal FE).
 * Geometry: hud-clipped / lattice / square — not soft rounded SaaS.
 * Logic: auth-aware CTAs, registration window, capacity, live countdown.
 */

import { useState, useEffect, useMemo } from "react";
import { Badge, Button } from "@/components/ui";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
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
import { formatShortId } from "@/lib/formatId";

function isRegistrationOpen(event: EventCardData, now = Date.now()): boolean {
  const start = new Date(event.registrationStartDate || event.startDate).getTime();
  const end = new Date(event.registrationEndDate || event.endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return event.status === "registration_open";
  return now >= start && now <= end;
}

function getHeroCtas(args: {
  user: any;
  latestEvent: EventCardData | null;
  regOpen: boolean;
}) {
  const { user, latestEvent, regOpen } = args;
  const approved = Boolean(user?.isApproved ?? user?.IsApproved);
  const isStaffEmail = (() => {
    const email = (user?.email || user?.Email || "").toLowerCase();
    return (
      email.includes("judge") ||
      email.includes("mentor") ||
      email.includes("ec.") ||
      email.includes("admin")
    );
  })();

  if (!user) {
    return {
      primary: { href: "/register", label: "Đăng ký tham gia" },
      secondary: {
        href: latestEvent ? `/events/${latestEvent.id}` : "/events",
        label: latestEvent ? "Xem sự kiện đang mở" : "Khám phá sự kiện",
      },
      note: regOpen
        ? "Cổng đăng ký đang mở — tạo tài khoản để lập đội."
        : "Xem thể lệ trước, đăng ký khi cổng mở.",
    };
  }

  if (!approved && !isStaffEmail) {
    return {
      primary: { href: "/onboarding/profile", label: "Hoàn thiện hồ sơ" },
      secondary: {
        href: latestEvent ? `/events/${latestEvent.id}` : "/events",
        label: "Xem sự kiện",
      },
      note: "Hồ sơ chưa duyệt — xem được sự kiện nhưng chưa tạo đội / nộp bài.",
    };
  }

  if (latestEvent && regOpen) {
    return {
      primary: { href: `/events/${latestEvent.id}`, label: "Vào sự kiện & lập đội" },
      secondary: { href: "/my-team", label: "Đội của tôi" },
      note: `Tiếp tục với ${latestEvent.eventName}.`,
    };
  }

  return {
    primary: { href: "/events", label: "Khám phá sự kiện" },
    secondary: { href: "/my-team", label: "Đội thi của tôi" },
    note: "Chọn sự kiện phù hợp để bắt đầu.",
  };
}

export function LandingPortalView() {
  const { latestEvent, featuredEvents, totalRealCount } = useLandingPreviewViewModel();
  const { user, activeRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const rawRole = activeRole?.roleName || activeRole?.RoleName;
    const userEmail = (user.email || user.Email || "").toLowerCase();
    const isAdm = !!user.isAdmin || !!user.IsAdmin || userEmail.includes("admin");
    const isCoord =
      rawRole === "Coordinator" ||
      rawRole === "EventCoordinator" ||
      userEmail.includes("ec.") ||
      userEmail.includes("coordinator");
    const isJudge = rawRole === "Judge" || userEmail.includes("judge");
    const isMentor = rawRole === "Mentor" || userEmail.includes("mentor");

    if (isAdm) router.replace("/admin/dashboard");
    else if (isCoord) router.replace("/coordinator/dashboard");
    else if (isJudge) router.replace("/judge/events");
    else if (isMentor) router.replace("/events");
  }, [user, activeRole, router]);

  const regOpen = useMemo(
    () => (latestEvent ? isRegistrationOpen(latestEvent) : false),
    [latestEvent],
  );
  const ctas = getHeroCtas({ user, latestEvent, regOpen });

  return (
    <main className="hud-lattice flex flex-1 flex-col overflow-x-clip">
      {/* Hero — asymmetric Command Deck: brand + live panel (fills right) */}
      <section className="relative border-b border-[var(--border-muted)] px-4 py-16 sm:px-6 md:py-20">
        <div className="mx-auto grid w-full max-w-[var(--container-max)] gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)] lg:items-stretch lg:gap-12">
          <div className="flex min-w-0 flex-col justify-center">
            <div className="flex items-center gap-3">
              <div className="border border-[var(--accent-primary)]/40 bg-[var(--bg-panel)] p-2.5 hud-clipped">
                <SealShield className="h-12 w-12 text-[var(--accent-primary)] sm:h-14 sm:w-14" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold tracking-wide text-[var(--text-primary)] sm:text-3xl">
                  SEAL
                </p>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-primary)]">
                  Hackathon Arena
                </p>
              </div>
            </div>

            <h1 className="mt-8 font-display text-3xl font-extrabold uppercase leading-[1.12] tracking-wide text-[var(--text-primary)] md:text-5xl lg:text-[3.25rem]">
              Nơi ý tưởng công nghệ
              <br />
              <span className="text-[var(--accent-primary)]">bứt phá giới hạn</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
              Đấu trường hackathon cho sinh viên toàn quốc — lập đội, nộp sản phẩm, nhận mentor và
              chấm theo rubric công khai.
            </p>
            <p className="mt-4 font-mono text-xs text-[var(--text-muted)]">{ctas.note}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={ctas.primary.href}>
                <Button className="min-w-[180px]">{ctas.primary.label}</Button>
              </Link>
              <Link href={ctas.secondary.href}>
                <Button variant="secondary" className="min-w-[180px]">
                  {ctas.secondary.label}
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-[var(--border-muted)] pt-5 font-mono text-[10px] uppercase tracking-wider">
              <span className="text-[var(--text-muted)]">Truy cập nhanh</span>
              <Link
                href="/my-team"
                className="hud-clipped border border-[var(--accent-team)]/40 bg-[var(--bg-panel)] px-3 py-1.5 font-semibold text-[var(--accent-team)] hover:bg-[var(--accent-team)]/15"
              >
                Đội thi
              </Link>
              <Link
                href="/judge/scoring"
                className="hud-clipped border border-[var(--accent-judge)]/40 bg-[var(--bg-panel)] px-3 py-1.5 font-semibold text-[var(--accent-judge)] hover:bg-[var(--accent-judge)]/15"
              >
                Giám khảo
              </Link>
              <Link
                href="/coordinator/dashboard"
                className="hud-clipped border border-[var(--accent-coordinator)]/40 bg-[var(--bg-panel)] px-3 py-1.5 font-semibold text-[var(--accent-coordinator)] hover:bg-[var(--accent-coordinator)]/15"
              >
                Ban tổ chức
              </Link>
            </div>
          </div>

          <div className="relative min-h-[300px]">
            <SealShield
              aria-hidden
              className="pointer-events-none absolute -right-4 -top-6 h-44 w-44 text-[var(--accent-primary)] opacity-[0.12] sm:h-56 sm:w-56"
            />
            <div className="hud-clipped relative z-10 h-full border border-[var(--accent-primary)]/35 bg-[var(--bg-panel)] p-5 sm:p-6">
              {latestEvent ? (
                <HeroLivePanel event={latestEvent} regOpen={regOpen} />
              ) : (
                <div className="flex h-full flex-col justify-center gap-4">
                  <SealShield className="h-10 w-10 text-[var(--accent-primary)]" />
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Arena status
                  </p>
                  <p className="font-display text-xl font-bold uppercase text-[var(--text-primary)]">
                    {totalRealCount === 0 ? "Chưa có sự kiện mở" : "Đang tải sự kiện…"}
                  </p>
                  <Link href="/events">
                    <Button variant="secondary">Danh sách sự kiện</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <LandingMetricsStrip />

      {latestEvent && <LatestEventSpotlight event={latestEvent} />}

      {featuredEvents.length > 0 && (
        <PreviewSection title="Sự kiện nổi bật khác" events={featuredEvents} showAllHref="/events" />
      )}

      <LandingWorkflowSteps />
      <LandingLeaderboardPodium />
      <LandingFaqSection />
    </main>
  );
}

function HeroLivePanel({ event, regOpen }: { event: EventCardData; regOpen: boolean }) {
  const countdownTarget = event.status === "ongoing" ? event.endDate : event.registrationEndDate;
  const countdown = useCountdown(event.status === "ended" ? null : countdownTarget);
  const slotsLeft = Math.max(0, event.maxTeams - event.teamCount);
  const fillPercent = Math.min(100, Math.round((event.teamCount / Math.max(event.maxTeams, 1)) * 100));

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Badge tone={STATUS_TONE[event.status]}>{STATUS_LABEL[event.status]}</Badge>
          <Badge tone={regOpen ? "success" : "neutral"}>
            {regOpen ? "Cổng mở" : "Ngoài cửa sổ ĐK"}
          </Badge>
        </div>
        <SealShield className="h-8 w-8 shrink-0 text-[var(--accent-primary)]" />
      </div>

      <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
        {event.season} {event.year} · #{formatShortId(event.id)}
      </p>
      <h2 className="mt-2 font-display text-xl font-extrabold uppercase leading-tight text-[var(--text-primary)] sm:text-2xl">
        {event.eventName}
      </h2>
      <p className="mt-2 line-clamp-2 text-sm text-[var(--text-muted)]">{event.tagline}</p>

      {!countdown.isPast && (
        <div className="mt-5 border-t border-[var(--border-muted)] pt-4" suppressHydrationWarning>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            {event.status === "ongoing" ? "Hạn nộp còn" : "Đóng cổng sau"}
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[
              { value: countdown.days, label: "ngày" },
              { value: countdown.hours, label: "giờ" },
              { value: countdown.minutes, label: "phút" },
              { value: countdown.seconds, label: "giây" },
            ].map((u) => (
              <div key={u.label} suppressHydrationWarning>
                <span
                  className={`font-mono text-xl font-bold tabular-nums ${
                    countdown.isUrgent ? "text-[var(--color-danger)]" : "text-[var(--accent-primary)]"
                  }`}
                  suppressHydrationWarning
                >
                  {String(u.value).padStart(2, "0")}
                </span>
                <span className="mt-0.5 block font-mono text-[9px] text-[var(--text-muted)]">
                  {u.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 space-y-2">
        <div className="flex justify-between font-mono text-[10px] uppercase text-[var(--text-muted)]">
          <span>Sức chứa đội</span>
          <span className="tabular-nums text-[var(--accent-team)]">
            {event.teamCount}/{event.maxTeams} · còn {slotsLeft}
          </span>
        </div>
        <div className="h-2 border border-[var(--border-muted)] bg-[var(--bg-base)] p-0.5">
          <div
            className="h-full bg-[var(--accent-primary)] transition-[width] duration-500"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-auto pt-6">
        <Link href={`/events/${event.id}`} className="block">
          <Button className="w-full">{regOpen ? "Đăng ký sự kiện này" : "Chi tiết sự kiện"}</Button>
        </Link>
      </div>
    </div>
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
              SỰ KIỆN TIÊU ĐIỂM
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs text-[var(--text-muted)]">
            <span className="hidden sm:inline-block text-[var(--accent-mentor)]">● ĐANG MỞ</span>
            <span>MÙA GIẢI: <strong className="text-[var(--text-primary)]">{event.season.toUpperCase()} {event.year}</strong></span>
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
                  ID: #{formatShortId(event.id)}
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

                {/* Prize Pool Highlight Box — liệt kê giải thưởng thật, ẩn nếu BTC chưa cấu hình */}
                {event.prizes.length > 0 && (
                  <div className="border border-[var(--accent-judge)]/50 bg-[var(--accent-judge)]/10 p-3.5 hud-clipped flex items-start gap-3">
                    <div className="flex px-2 py-1 shrink-0 items-center justify-center border border-[var(--accent-judge)] bg-[var(--bg-input)] font-mono text-xs font-bold text-[var(--accent-judge)] shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                      [PRIZE]
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--accent-judge)]">
                        GIẢI THƯỞNG
                      </span>
                      {event.prizes.map((p) => (
                        <span key={p.id} className="font-mono text-sm font-bold text-[var(--accent-judge)] tracking-tight">
                          {p.prizeName}: {p.value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button Protocol */}
              <div className="flex flex-wrap items-center gap-4 pt-3 w-full sm:w-auto">
                <Link href={`/events/${event.id}`} className="w-full sm:w-auto">
                  <button className="hud-clipped w-full sm:w-auto px-7 py-3.5 bg-[var(--accent-primary)] text-[var(--bg-base)] font-mono font-extrabold tracking-wider uppercase text-sm transition-all duration-200 hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] focus:outline-none flex items-center justify-center gap-2 cursor-pointer">
                    <span>XEM CHI TIẾT &amp; ĐĂNG KÝ NGAY</span>
                    <span className="transition-transform duration-200 group-hover:translate-x-1">&gt;</span>
                  </button>
                </Link>
                <Link href="/events" className="w-full sm:w-auto">
                  <button className="hud-clipped w-full sm:w-auto px-5 py-3.5 bg-transparent border border-[var(--border-muted)] text-[var(--text-primary)] hover:text-white hover:border-[var(--accent-primary)] hover:bg-[rgba(0,217,255,0.08)] font-mono text-xs tracking-wider uppercase transition-all duration-200 cursor-pointer">
                    XEM TẤT CẢ SỰ KIỆN
                  </button>
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN: always filled — countdown and/or schedule + mark */}
            <div className="relative flex flex-col gap-4 overflow-hidden border border-[var(--border-muted)] bg-[var(--bg-base)]/80 p-5 hud-clipped">
              <SealShield
                aria-hidden
                className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 text-[var(--accent-primary)] opacity-20"
              />

              {!countdown.isPast ? (
                <>
                  <div className="relative z-10 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        countdown.isUrgent
                          ? "bg-[var(--color-danger)] animate-ping"
                          : "bg-[var(--accent-primary)]"
                      }`}
                    />
                    {countdownLabel}
                  </div>

                  <div className="relative z-10 flex items-center justify-between gap-1" suppressHydrationWarning>
                    {[
                      { value: countdown.days, label: "ngày" },
                      { value: countdown.hours, label: "giờ" },
                      { value: countdown.minutes, label: "phút" },
                      { value: countdown.seconds, label: "giây" },
                    ].map((u, i) => (
                      <div key={u.label} className="flex items-baseline gap-1" suppressHydrationWarning>
                        <span
                          className={`font-mono font-bold tabular-nums text-2xl tracking-tight ${
                            countdown.isUrgent
                              ? "text-[var(--color-danger)]"
                              : "text-[var(--accent-primary)]"
                          }`}
                          suppressHydrationWarning
                        >
                          {String(u.value).padStart(2, "0")}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--text-muted)]">{u.label}</span>
                        {i < 3 && <span className="ml-1 font-mono text-[var(--border-muted)]">:</span>}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="relative z-10 space-y-3">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    Mốc thời gian
                  </p>
                  <div className="flex justify-between gap-3 border-b border-[var(--border-muted)] pb-2 font-mono text-xs">
                    <span className="text-[var(--text-muted)]">Đăng ký</span>
                    <span className="tabular-nums text-[var(--text-primary)]">
                      {formatShortDate(event.registrationStartDate)} –{" "}
                      {formatShortDate(event.registrationEndDate)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 font-mono text-xs">
                    <span className="text-[var(--text-muted)]">Diễn ra</span>
                    <span className="tabular-nums text-[var(--text-primary)]">
                      {formatShortDate(event.startDate)} – {formatShortDate(event.endDate)}
                    </span>
                  </div>
                </div>
              )}

              {event.rounds && event.rounds.length > 0 && (
                <div className="relative z-10 mt-1 flex flex-col gap-0 border-t border-[var(--border-muted)]/50 pt-3">
                  <span className="mb-2 font-mono text-[9px] uppercase tracking-widest text-[var(--text-muted)]">
                    Lịch vòng thi
                  </span>
                  {event.rounds.map((r, idx) => {
                    const isPast = new Date(r.startDate) < new Date();
                    return (
                      <div key={r.id} className="flex items-center gap-3 py-1.5">
                        <div className="flex w-3 shrink-0 flex-col items-center">
                          <span
                            className={`h-2 w-2 rounded-full border ${
                              isPast
                                ? "border-[var(--border-muted)] bg-[var(--text-muted)]/30"
                                : "border-[var(--accent-primary)] bg-[var(--accent-primary)]/80"
                            }`}
                          />
                          {idx < event.rounds.length - 1 && (
                            <span className="mt-0.5 h-3 w-px bg-[var(--border-muted)]/50" />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 items-center justify-between">
                          <span
                            className={`font-mono text-[11px] font-medium ${
                              isPast
                                ? "text-[var(--text-muted)]/50 line-through"
                                : "text-[var(--text-primary)]"
                            }`}
                          >
                            {r.roundName}
                          </span>
                          <span className="ml-2 shrink-0 font-mono text-[10px] text-[var(--text-muted)]">
                            {formatShortDate(r.startDate)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {countdown.isUrgent && !countdown.isPast && (
                <span className="relative z-10 border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 py-1 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-danger)] animate-pulse">
                  Sắp đóng cổng — Nộp bài ngay!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
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

        {/* Bố cục bất đối xứng: 1 Card Lớn bên trái + 2 Card Nhỏ xếp dọc bên phải */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-[var(--space-lg)]">
          {featuredEvent && (
            <Link
              href={`/events/${featuredEvent.id}`}
              className="hud-clipped group relative grid grid-cols-1 overflow-hidden border border-[var(--border-muted)] bg-[var(--bg-panel)] transition-all hover:border-[var(--accent-primary)]/70 sm:grid-cols-[minmax(0,1.2fr)_minmax(140px,0.8fr)]"
              style={{ borderTop: `4px solid ${STATUS_DOT_VAR[featuredEvent.status]}` }}
            >
              <div className="flex flex-col justify-between p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={STATUS_TONE[featuredEvent.status]}>
                      {STATUS_LABEL[featuredEvent.status]}
                    </Badge>
                    <span className="font-mono text-xs font-bold uppercase text-[var(--accent-primary)]">
                      Tiêu điểm · {featuredEvent.season} {featuredEvent.year}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-2xl font-bold text-[color:var(--text-primary)] transition-colors group-hover:text-[color:var(--accent-primary)]">
                      {featuredEvent.eventName}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm text-[color:var(--text-muted)]">
                      {featuredEvent.tagline}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-[var(--border-muted)] pt-4 font-mono text-xs text-[color:var(--text-muted)]">
                  <span>{featuredEvent.teamCount} đội đã đăng ký</span>
                  {featuredEvent.prizes.length > 0 && (
                    <span className="text-sm font-bold text-[var(--accent-judge)]">
                      {featuredEvent.prizes[0].prizeName}: {featuredEvent.prizes[0].value}
                    </span>
                  )}
                </div>
              </div>

              {/* Right fill — logo mark + capacity (no empty void) */}
              <div className="relative flex min-h-[160px] flex-col items-center justify-center gap-3 border-t border-[var(--border-muted)] bg-[var(--bg-base)]/50 p-6 sm:border-l sm:border-t-0">
                <SealShield className="h-20 w-20 text-[var(--accent-primary)] opacity-80 sm:h-24 sm:w-24" />
                <div className="w-full max-w-[140px] space-y-1.5">
                  <div className="flex justify-between font-mono text-[9px] uppercase text-[var(--text-muted)]">
                    <span>Đội</span>
                    <span className="text-[var(--accent-team)]">
                      {featuredEvent.teamCount}/{featuredEvent.maxTeams}
                    </span>
                  </div>
                  <div className="h-1.5 border border-[var(--border-muted)] bg-[var(--bg-input)] p-px">
                    <div
                      className="h-full bg-[var(--accent-primary)]"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (featuredEvent.teamCount / Math.max(featuredEvent.maxTeams, 1)) * 100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">
                  Xem chi tiết →
                </span>
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
        {event.prizes.length > 0 && (
          <span className="font-bold text-[var(--accent-judge)]">
            {event.prizes[0].prizeName}: {event.prizes[0].value}
          </span>
        )}
      </div>
    </Link>
  );
}

{/* ────────────────────────────────────────────────────────────────
    SECTION 7: FAQ ACCORDION COMPONENT
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
      q: "Điểm số bài nộp được tính toán và đảm bảo tính minh bạch ra sao?",
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
            HỎI ĐÁP PHỔ BIẾN
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
