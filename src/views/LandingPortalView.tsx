"use client";

/**
 * Hallmark · page: landing · genre: technical · macro: Narrative Workflow
 * theme: SEAL tokens (mint / obsidian) · fonts: Chakra Petch + IBM Plex Sans
 * pre-emit critique: P5 H5 E4 S4 R5 V5
 */

import { useState, useEffect } from "react";
import { Badge, Button } from "@/components/ui";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { resolveStaffLandingPath } from "@/lib/eventRoles";
import { SealShield } from "@/components/domain/SealShield";
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

export function LandingPortalView() {
  const { latestEvent, featuredEvents } = useLandingPreviewViewModel();
  const { user, activeRole, allEventRoles } = useAuth();
  const router = useRouter();

  // Tự động chuyển hướng Cán bộ / BTC / Giám khảo / Cố vấn về đúng workspace khi đã đăng nhập
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

  return (
    <main className="landing-root flex flex-1 flex-col overflow-x-clip">
      {/* 1 · Hero — brand-first, one composition */}
      <section className="landing-hero relative isolate flex min-h-[100svh] flex-col justify-end border-b border-[var(--border-muted)] pb-16 pt-28 sm:pb-20 sm:pt-32">
        <div aria-hidden className="landing-hero-atmosphere pointer-events-none absolute inset-0 -z-10" />
        <SealShield
          aria-hidden
          className="landing-hero-mark pointer-events-none absolute inset-y-0 right-[-8%] -z-10 my-auto h-[min(92vh,720px)] w-[min(92vh,720px)] text-[var(--accent-primary)] opacity-[0.09] sm:right-[-4%]"
        />

        <div className="landing-hero-copy mx-auto w-full max-w-[var(--container-max)] px-4 sm:px-6">
          <p className="font-display text-[clamp(4.5rem,18vw,11rem)] font-semibold leading-[0.85] tracking-tight text-[var(--text-primary)]">
            SEAL
          </p>
          <h1 className="mt-6 max-w-xl font-display text-2xl font-semibold leading-snug text-[var(--text-primary)] sm:text-3xl md:text-4xl">
            Nơi ý tưởng công nghệ bứt phá giới hạn
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
            Hackathon cho sinh viên toàn quốc — sản phẩm thật, mentor đồng hành, chấm điểm minh bạch.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/events">
              <Button className="min-w-[168px]">Khám phá sự kiện</Button>
            </Link>
            <Link href="/register">
              <Button variant="secondary" className="min-w-[168px]">
                Đăng ký tham gia
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2 · Live metrics — honest API numbers only, no card wall */}
      <LandingMetricsStrip />

      {/* 3 · Live event spotlight */}
      {latestEvent && <LatestEventSpotlight event={latestEvent} />}

      {/* 4 · Other events as index list (not card collage) */}
      {featuredEvents.length > 0 && (
        <FeaturedIndex events={featuredEvents} showAllHref="/events" />
      )}

      {/* 5 · Narrative workflow */}
      <LandingWorkflowSteps />

      {/* 6 · Proof */}
      <LandingLeaderboardPodium />

      {/* 7 · FAQ */}
      <LandingFaqSection />
    </main>
  );
}

function LatestEventSpotlight({ event }: { event: EventCardData }) {
  const countdownTarget = event.status === "ongoing" ? event.endDate : event.registrationEndDate;
  const countdown = useCountdown(event.status === "ended" ? null : countdownTarget);
  const countdownLabel =
    event.status === "ongoing" ? "Hạn nộp bài còn lại" : "Hạn đăng ký còn lại";
  const fillPercent = Math.min(100, Math.round((event.teamCount / event.maxTeams) * 100));
  const remainingSlots = Math.max(0, event.maxTeams - event.teamCount);

  return (
    <section className="px-4 py-20 sm:px-6 md:py-28">
      <div className="mx-auto grid w-full max-w-[var(--container-max)] gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
        <div className="min-w-0">
          <p className="landing-section-kicker text-sm font-medium text-[var(--accent-primary)]">
            Sự kiện tiêu điểm
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[event.status]}>{STATUS_LABEL[event.status]}</Badge>
            <span className="text-sm text-[var(--text-muted)]">
              {event.season} {event.year}
            </span>
            <span className="text-xs text-[var(--text-muted)]">· {formatShortId(event.id)}</span>
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
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
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
            <div className="h-px w-full bg-[var(--border-muted)]">
              <div
                className="h-px bg-[var(--accent-primary)] transition-[width] duration-500"
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
              <Button>Xem chi tiết & đăng ký</Button>
            </Link>
            <Link href="/events">
              <Button variant="secondary">Tất cả sự kiện</Button>
            </Link>
          </div>
        </div>

        {!countdown.isPast && (
          <aside className="flex flex-col justify-between border-t border-[var(--border-muted)] pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
            <div>
              <p className="text-sm font-medium text-[var(--text-muted)]">{countdownLabel}</p>
              <div
                className="mt-6 grid grid-cols-4 gap-3"
                suppressHydrationWarning
              >
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
              {countdown.isUrgent && (
                <p className="mt-4 text-sm font-medium text-[var(--color-danger)]">
                  Sắp đóng cổng — nộp bài ngay
                </p>
              )}
            </div>

            {event.rounds && event.rounds.length > 0 && (
              <ol className="mt-12 space-y-0 border-t border-[var(--border-muted)] pt-8">
                <li className="mb-4 text-sm font-medium text-[var(--text-muted)]">Lịch vòng thi</li>
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
            )}
          </aside>
        )}
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
                <span className="text-sm text-[var(--text-muted)]">
                  {STATUS_LABEL[ev.status]}
                </span>
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
