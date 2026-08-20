"use client";

/**
 * Hallmark · page: landing · genre: technical · macro: Narrative Workflow
 * Brand-first hero with SEAL mark + live event panel (fills right column).
 * Logic: auth-aware CTAs, registration window, capacity, live countdown.
 */

import { useState, useEffect, useMemo } from "react";
import { Badge, Button } from "@/components/ui";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { SealShield } from "@/components/domain/SealShield";
import { resolveStaffLandingPath } from "@/lib/eventRoles";
import { useCountdown } from "@/lib/useCountdown";
import {
  STATUS_LABEL,
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
      primary: { href: "/register", label: "Tạo tài khoản thi" },
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
      primary: { href: "/onboarding/profile", label: "Hoàn thiện hồ sơ sinh viên" },
      secondary: {
        href: latestEvent ? `/events/${latestEvent.id}` : "/events",
        label: "Xem sự kiện (chỉ đọc)",
      },
      note: "Hồ sơ chưa duyệt — bạn xem được sự kiện nhưng chưa tạo đội / nộp bài.",
    };
  }

  if (latestEvent && regOpen) {
    return {
      primary: { href: `/events/${latestEvent.id}`, label: "Vào sự kiện & lập đội" },
      secondary: { href: "/my-team", label: "Quản lý đội của tôi" },
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
  const { user, activeRole, allEventRoles } = useAuth();
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

    if (isAdm) {
      router.replace("/admin/dashboard");
      return;
    }
    if (isCoord) {
      router.replace("/coordinator/dashboard");
      return;
    }

    const staffPath = resolveStaffLandingPath(allEventRoles);
    if (staffPath) {
      router.replace(staffPath);
      return;
    }

    const isJudge = rawRole === "Judge" || userEmail.includes("judge");
    const isMentor = rawRole === "Mentor" || userEmail.includes("mentor");
    if (isJudge) router.replace("/judge/events");
    else if (isMentor) router.replace("/events");
  }, [user, activeRole, allEventRoles, router]);

  const regOpen = useMemo(
    () => (latestEvent ? isRegistrationOpen(latestEvent) : false),
    [latestEvent],
  );
  const ctas = getHeroCtas({ user, latestEvent, regOpen });
  const needsProfile =
    Boolean(user) &&
    !(user?.isApproved ?? (user as { IsApproved?: boolean })?.IsApproved) &&
    !(user?.isAdmin || user?.IsAdmin);

  return (
    <main className="landing-root flex flex-1 flex-col overflow-x-clip bg-[var(--bg-base)]">
      <section className="relative isolate min-h-[min(92vh,900px)] border-b border-[var(--border-muted)]">
        <div aria-hidden className="landing-hero-atmosphere pointer-events-none absolute inset-0 -z-10" />
        <div aria-hidden className="landing-hero-grid pointer-events-none absolute inset-0 -z-10" />

        <div className="mx-auto grid w-full max-w-[var(--container-max)] gap-10 px-4 pb-16 pt-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.95fr)] lg:items-center lg:gap-10 lg:pb-24 lg:pt-24">
          <div className="landing-hero-copy min-w-0">
            <div className="flex items-center gap-3">
              <SealShield className="h-11 w-11 shrink-0 text-[var(--accent-primary)] sm:h-12 sm:w-12" />
              <div>
                <p className="font-display text-2xl font-semibold tracking-[0.04em] text-[var(--text-primary)] sm:text-3xl">
                  SEAL
                </p>
                <p className="text-xs text-[var(--text-muted)] sm:text-sm">
                  Hackathon Arena · FPT & toàn quốc
                </p>
              </div>
            </div>

            <h1 className="mt-8 font-display text-[clamp(2.6rem,7.5vw,5rem)] font-semibold leading-[0.96] text-[var(--text-primary)]">
              Đấu trường
              <br />
              <span className="text-[var(--accent-primary)]">ý tưởng thật</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
              Lập đội, nộp sản phẩm, nhận mentor và được chấm theo rubric công khai — trên một hệ
              thống.
            </p>

            <p className="mt-6 text-sm text-[var(--text-muted)]">{ctas.note}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={ctas.primary.href}>
                <Button className="min-w-[180px]">{ctas.primary.label}</Button>
              </Link>
              <Link href={ctas.secondary.href}>
                <Button variant="secondary" className="min-w-[180px]">
                  {ctas.secondary.label}
                </Button>
              </Link>
            </div>

            {needsProfile && (
              <div className="mt-8 border-l-2 border-[var(--color-warning)] pl-4">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Hồ sơ sinh viên chưa được duyệt
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Hoàn thiện MSSV / thẻ SV để mở quyền tạo đội và nộp bài.{" "}
                  <Link href="/onboarding/profile" className="text-[var(--accent-primary)] underline">
                    Cập nhật ngay
                  </Link>
                </p>
              </div>
            )}
          </div>

          {/* Right column: brand mark backdrop + live event (never empty void) */}
          <div className="landing-hero-stage relative min-h-[320px] min-w-0 sm:min-h-[380px]">
            <div
              aria-hidden
              className="landing-hero-mark pointer-events-none absolute -right-6 -top-4 h-[220px] w-[220px] opacity-[0.22] sm:-right-10 sm:h-[280px] sm:w-[280px] lg:h-[320px] lg:w-[320px]"
            >
              <SealShield className="h-full w-full text-[var(--accent-primary)]" />
            </div>
            <div className="landing-hero-panel relative z-10 mt-10 border border-[var(--border-muted)] bg-[color-mix(in_srgb,var(--bg-panel)_92%,transparent)] p-6 backdrop-blur-[2px] sm:mt-16 sm:p-8">
              {latestEvent ? (
                <HeroLivePanel event={latestEvent} regOpen={regOpen} />
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <SealShield className="h-10 w-10 text-[var(--accent-primary)]" />
                    <p className="text-sm font-medium text-[var(--text-muted)]">Arena đang chờ</p>
                  </div>
                  <p className="font-display text-2xl font-semibold text-[var(--text-primary)]">
                    {totalRealCount === 0
                      ? "Chưa có sự kiện mở trên hệ thống"
                      : "Đang tải sự kiện…"}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Khi sự kiện mở, countdown và sức chứa đội sẽ hiện tại đây.
                  </p>
                  <Link href="/events">
                    <Button variant="secondary">Đi tới danh sách sự kiện</Button>
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
        <FeaturedIndex events={featuredEvents} showAllHref="/events" />
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[event.status]}>{STATUS_LABEL[event.status]}</Badge>
          <Badge tone={regOpen ? "success" : "neutral"}>
            {regOpen ? "Cổng đăng ký mở" : "Ngoài cửa sổ đăng ký"}
          </Badge>
        </div>
        <SealShield className="h-8 w-8 shrink-0 text-[var(--accent-primary)] opacity-80" />
      </div>

      <p className="mt-4 text-xs text-[var(--text-muted)]">
        {event.season} {event.year} · {formatShortId(event.id)}
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-[var(--text-primary)] sm:text-3xl">
        {event.eventName}
      </h2>
      <p className="mt-2 line-clamp-2 text-sm text-[var(--text-muted)]">{event.tagline}</p>

      {event.tracks.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5">
          {event.tracks.slice(0, 4).map((track) => {
            const meta = TRACK_META[track] || DEFAULT_TRACK_META;
            return (
              <li key={track} className="flex items-center gap-1.5 text-xs text-[var(--text-primary)]">
                <span className="h-1.5 w-1.5 shrink-0" style={{ backgroundColor: meta.accent }} />
                {track}
              </li>
            );
          })}
        </ul>
      )}

      {!countdown.isPast && (
        <div className="mt-6 border-t border-[var(--border-muted)] pt-5" suppressHydrationWarning>
          <p className="text-xs font-medium text-[var(--text-muted)]">
            {event.status === "ongoing" ? "Hạn nộp còn" : "Đóng cổng đăng ký sau"}
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
                  className={`font-display text-2xl font-semibold tabular-nums ${
                    countdown.isUrgent ? "text-[var(--color-danger)]" : "text-[var(--text-primary)]"
                  }`}
                  suppressHydrationWarning
                >
                  {String(u.value).padStart(2, "0")}
                </span>
                <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">{u.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 space-y-2">
        <div className="flex justify-between text-xs text-[var(--text-muted)]">
          <span>Sức chứa đội</span>
          <span className="tabular-nums text-[var(--text-primary)]">
            {event.teamCount}/{event.maxTeams} · còn {slotsLeft}
          </span>
        </div>
        <div className="h-1 bg-[var(--bg-input)]">
          <div
            className="h-1 bg-[var(--accent-primary)] transition-[width] duration-500"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-auto pt-6">
        <Link href={`/events/${event.id}`} className="block">
          <Button className="w-full">{regOpen ? "Đăng ký sự kiện này" : "Xem chi tiết sự kiện"}</Button>
        </Link>
      </div>
    </div>
  );
}

function LatestEventSpotlight({ event }: { event: EventCardData }) {
  const countdownTarget = event.status === "ongoing" ? event.endDate : event.registrationEndDate;
  const countdown = useCountdown(event.status === "ended" ? null : countdownTarget);
  const countdownLabel =
    event.status === "ongoing" ? "Hạn nộp bài còn lại" : "Hạn đăng ký còn lại";
  const fillPercent = Math.min(100, Math.round((event.teamCount / Math.max(event.maxTeams, 1)) * 100));
  const remainingSlots = Math.max(0, event.maxTeams - event.teamCount);
  const regOpen = isRegistrationOpen(event);

  return (
    <section id="spotlight" className="relative px-4 py-20 sm:px-6 md:py-28">
      <div aria-hidden className="landing-spotlight-wash pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto grid w-full max-w-[var(--container-max)] gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14 lg:items-stretch">
        <div className="min-w-0 border border-[var(--border-muted)] bg-[var(--bg-panel)] p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="landing-section-kicker text-sm font-medium text-[var(--accent-primary)]">
                Sự kiện tiêu điểm
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone={STATUS_TONE[event.status]}>{STATUS_LABEL[event.status]}</Badge>
                <Badge tone={regOpen ? "success" : "warning"}>
                  {regOpen ? "Đang nhận đội" : "Ngoài kỳ đăng ký"}
                </Badge>
                <span className="text-sm text-[var(--text-muted)]">
                  {event.season} {event.year}
                </span>
              </div>
            </div>
            <SealShield className="h-12 w-12 shrink-0 text-[var(--accent-primary)] opacity-90" />
          </div>

          <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-[var(--text-primary)] sm:text-4xl md:text-5xl">
            {event.eventName}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
            {event.tagline}
          </p>

          {event.tracks.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-x-4 gap-y-2">
              {event.tracks.map((track) => {
                const meta = TRACK_META[track] || DEFAULT_TRACK_META;
                return (
                  <li key={track} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                    <span
                      className="h-1.5 w-1.5 shrink-0"
                      style={{ backgroundColor: meta.accent }}
                    />
                    {track}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-10 space-y-3 border-t border-[var(--border-muted)] pt-8">
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-[var(--text-muted)]">Đội đã đăng ký</span>
              <span className="font-display text-lg font-semibold tabular-nums text-[var(--text-primary)]">
                {event.teamCount}
                <span className="text-[var(--text-muted)]"> / {event.maxTeams}</span>
              </span>
            </div>
            <div className="h-1 w-full bg-[var(--bg-input)]">
              <div
                className="h-1 bg-[var(--accent-primary)] transition-[width] duration-500"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
            <p className="text-xs text-[var(--text-muted)]">Còn {remainingSlots} suất</p>
          </div>

          {event.prizes.length > 0 && (
            <div className="mt-8">
              <p className="text-sm font-medium text-[var(--text-muted)]">Giải thưởng</p>
              <ul className="mt-2 space-y-1">
                {event.prizes.map((p) => (
                  <li key={p.id} className="font-display text-base text-[var(--accent-judge)] sm:text-lg">
                    {p.prizeName}: {p.value}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href={`/events/${event.id}`}>
              <Button>{regOpen ? "Đăng ký ngay" : "Xem chi tiết"}</Button>
            </Link>
            <Link href="/events">
              <Button variant="secondary">Tất cả sự kiện</Button>
            </Link>
          </div>
        </div>

        {/* Right column always filled — countdown and/or schedule + brand */}
        <aside className="relative flex min-h-[280px] flex-col justify-between overflow-hidden border border-[var(--border-muted)] bg-[var(--bg-base)] p-6 sm:p-8 lg:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 opacity-[0.18] sm:h-52 sm:w-52"
          >
            <SealShield className="h-full w-full text-[var(--accent-primary)]" />
          </div>

          <div className="relative z-10">
            {!countdown.isPast ? (
              <>
                <p className="text-sm font-medium text-[var(--text-muted)]">{countdownLabel}</p>
                <div className="mt-6 grid grid-cols-4 gap-3" suppressHydrationWarning>
                  {[
                    { value: countdown.days, label: "ngày" },
                    { value: countdown.hours, label: "giờ" },
                    { value: countdown.minutes, label: "phút" },
                    { value: countdown.seconds, label: "giây" },
                  ].map((u) => (
                    <div key={u.label} className="min-w-0" suppressHydrationWarning>
                      <span
                        className={`block font-display text-3xl font-semibold tabular-nums sm:text-4xl ${
                          countdown.isUrgent
                            ? "text-[var(--color-danger)]"
                            : "text-[var(--text-primary)]"
                        }`}
                        suppressHydrationWarning
                      >
                        {String(u.value).padStart(2, "0")}
                      </span>
                      <span className="mt-1 block text-xs text-[var(--text-muted)]">{u.label}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-[var(--text-muted)]">Mốc thời gian</p>
                <dl className="mt-6 space-y-4">
                  <div className="flex justify-between gap-4 border-b border-[var(--border-muted)] pb-3 text-sm">
                    <dt className="text-[var(--text-muted)]">Đăng ký</dt>
                    <dd className="tabular-nums text-[var(--text-primary)]">
                      {formatShortDate(event.registrationStartDate)} –{" "}
                      {formatShortDate(event.registrationEndDate)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-[var(--border-muted)] pb-3 text-sm">
                    <dt className="text-[var(--text-muted)]">Diễn ra</dt>
                    <dd className="tabular-nums text-[var(--text-primary)]">
                      {formatShortDate(event.startDate)} – {formatShortDate(event.endDate)}
                    </dd>
                  </div>
                </dl>
              </>
            )}
          </div>

          {event.rounds && event.rounds.length > 0 ? (
            <ol className="relative z-10 mt-10 space-y-0 border-t border-[var(--border-muted)] pt-6">
              <li className="mb-3 text-sm font-medium text-[var(--text-muted)]">Lịch vòng thi</li>
              {event.rounds.map((r) => {
                const isPast = new Date(r.startDate) < new Date();
                return (
                  <li
                    key={r.id}
                    className="flex items-baseline justify-between gap-4 border-b border-[var(--border-muted)] py-3 text-sm last:border-b-0"
                  >
                    <span
                      className={
                        isPast
                          ? "text-[var(--text-muted)] line-through"
                          : "text-[var(--text-primary)]"
                      }
                    >
                      {r.roundName}
                    </span>
                    <span className="shrink-0 tabular-nums text-[var(--text-muted)]">
                      {formatShortDate(r.startDate)}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="relative z-10 mt-10 border-t border-[var(--border-muted)] pt-6">
              <p className="font-display text-lg font-semibold text-[var(--text-primary)]">
                SEAL Arena
              </p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Theo dõi vòng thi, nộp bài và bảng xếp hạng trên cùng một nền tảng.
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function FeaturedIndex({
  events,
  showAllHref,
}: {
  events: EventCardData[];
  showAllHref: string;
}) {
  return (
    <section className="border-y border-[var(--border-muted)] bg-[var(--bg-panel)]/35 px-4 py-20 sm:px-6 md:py-24">
      <div className="mx-auto w-full max-w-[var(--container-max)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="landing-section-kicker text-sm font-medium text-[var(--accent-primary)]">
              Danh mục
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)] md:text-4xl">
              Sự kiện khác
            </h2>
          </div>
          <Link
            href={showAllHref}
            className="text-sm font-medium text-[var(--accent-primary)] underline-offset-4 hover:underline"
          >
            Xem tất cả →
          </Link>
        </div>

        <ul className="mt-12 divide-y divide-[var(--border-muted)] border-t border-[var(--border-muted)]">
          {events.slice(0, 5).map((ev) => (
            <li key={ev.id}>
              <Link
                href={`/events/${ev.id}`}
                className="group grid grid-cols-1 gap-2 py-5 transition-colors sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-baseline sm:gap-8"
              >
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] sm:text-xl">
                    {ev.eventName}
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm text-[var(--text-muted)]">{ev.tagline}</p>
                </div>
                <span className="text-sm text-[var(--text-muted)]">{STATUS_LABEL[ev.status]}</span>
                <span className="text-sm tabular-nums text-[var(--text-muted)] sm:text-right">
                  {ev.season} {ev.year}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

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
    <section className="mb-16 px-4 py-20 sm:px-6 md:py-28">
      <div className="mx-auto grid w-full max-w-[var(--container-max)] gap-12 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] lg:gap-20">
        <div>
          <p className="landing-section-kicker text-sm font-medium text-[var(--accent-primary)]">
            Hỗ trợ
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)] md:text-4xl">
            Câu hỏi thường gặp
          </h2>
        </div>

        <div className="divide-y divide-[var(--border-muted)] border-t border-[var(--border-muted)]">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            const panelId = `landing-faq-panel-${idx}`;
            const buttonId = `landing-faq-button-${idx}`;
            return (
              <div key={idx}>
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex w-full items-start justify-between gap-4 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"
                >
                  <span className="text-base font-medium text-[var(--text-primary)]">{faq.q}</span>
                  <span aria-hidden className="mt-0.5 shrink-0 text-[var(--text-muted)]">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className="pb-5 text-sm leading-relaxed text-[var(--text-muted)]"
                >
                  {faq.a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default LandingPortalView;
