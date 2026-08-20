"use client";

/* Hallmark · pre-emit critique: P4 H5 E4 S4 R5 V4
   Redesign: narrative spotlight rhythm · SEAL Refined Dark tokens · no HUD */

import { useState, useEffect } from "react";
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

export function LandingPortalView() {
  const { latestEvent, featuredEvents } = useLandingPreviewViewModel();
  const { user, activeRole } = useAuth();
  const router = useRouter();

  // Tự động chuyển hướng Cán bộ / BTC / Giám khảo / Cố vấn về thẳng Dashboard khi đã đăng nhập
  useEffect(() => {
    if (user) {
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
    }
  }, [user, activeRole, router]);

  return (
    <main className="flex flex-1 flex-col overflow-x-clip">
      {/* ── Hero: brand + one headline + support + CTAs ── */}
      <section className="relative isolate min-h-[min(88vh,780px)] border-b border-[var(--border-muted)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 70% 20%, color-mix(in srgb, var(--accent-primary) 14%, transparent), transparent 55%), radial-gradient(ellipse 50% 40% at 10% 80%, color-mix(in srgb, var(--accent-team) 8%, transparent), transparent 50%)",
          }}
        />
        <SealShield
          aria-hidden
          className="landing-hero-shield pointer-events-none absolute -right-16 top-1/2 -z-10 h-[min(70vw,420px)] w-[min(70vw,420px)] -translate-y-1/2 text-[var(--accent-primary)] opacity-[0.07]"
        />

        <div className="mx-auto flex min-h-[min(88vh,780px)] w-full max-w-[var(--container-max)] flex-col justify-center px-4 py-16 sm:px-6 md:py-20">
          <div className="landing-hero-copy max-w-2xl">
            <p className="mb-4 font-display text-sm font-semibold tracking-wide text-[var(--accent-primary)] sm:text-base">
              SEAL
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.1] text-[var(--text-primary)] sm:text-5xl md:text-6xl">
              Nơi ý tưởng công nghệ bứt phá giới hạn
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
              Đấu trường hackathon dành cho sinh viên toàn quốc — xây dựng sản phẩm thực tế, nhận tư
              vấn từ mentor và đánh giá minh bạch theo tiêu chí chuẩn.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/events">
                <Button className="min-w-[160px]">Khám phá sự kiện</Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary" className="min-w-[160px]">
                  Đăng ký tham gia
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingMetricsStrip />

      {latestEvent && <LatestEventSpotlight event={latestEvent} />}

      {featuredEvents.length > 0 && (
        <PreviewSection
          title="Sự kiện nổi bật khác"
          events={featuredEvents}
          showAllHref="/events"
        />
      )}

      <LandingWorkflowSteps />

      <LandingLeaderboardPodium />

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
    <section className="border-t border-[var(--border-muted)] px-4 py-14 sm:px-6 md:py-20">
      <div className="mx-auto w-full max-w-[var(--container-max)]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--accent-primary)]">Sự kiện tiêu điểm</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Mùa giải {event.season} {event.year}
            </p>
          </div>
          <span className="text-xs text-[var(--text-muted)]">Mã: {formatShortId(event.id)}</span>
        </div>

        <div className="grid grid-cols-1 gap-8 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_TONE[event.status]}>{STATUS_LABEL[event.status]}</Badge>
              {event.status === "ongoing" && (
                <span className="inline-flex items-center gap-2 rounded-md border border-[var(--accent-judge)]/35 bg-[var(--accent-judge)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--accent-judge)]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent-judge)]" />
                  Đang chấm bài
                </span>
              )}
            </div>

            <div>
              <h2 className="font-display text-2xl font-semibold leading-tight text-[var(--text-primary)] sm:text-3xl md:text-4xl">
                {event.eventName}
              </h2>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-[var(--text-muted)]">
                {event.tagline}
              </p>
            </div>

            {event.tracks.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-[var(--text-muted)]">Hạng mục</p>
                <div className="flex flex-wrap gap-2">
                  {event.tracks.map((track) => {
                    const meta = TRACK_META[track] || DEFAULT_TRACK_META;
                    return (
                      <span
                        key={track}
                        className="inline-flex items-center gap-2 rounded-md border border-[var(--border-muted)] bg-[var(--bg-input)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: meta.accent }}
                        />
                        {track}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)]/60 p-4">
                <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                  <span className="text-[var(--text-muted)]">Đội đã đăng ký</span>
                  <span className="font-semibold tabular-nums text-[var(--accent-team)]">
                    {event.teamCount}/{event.maxTeams} ({fillPercent}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-base)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent-primary)] transition-[width] duration-500"
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  Còn {remainingSlots} suất
                </p>
              </div>

              {event.prizes.length > 0 && (
                <div className="rounded-lg border border-[var(--accent-judge)]/30 bg-[var(--accent-judge)]/8 p-4">
                  <p className="mb-1 text-xs font-medium text-[var(--accent-judge)]">Giải thưởng</p>
                  <ul className="space-y-0.5">
                    {event.prizes.map((p) => (
                      <li key={p.id} className="text-sm font-semibold text-[var(--accent-judge)]">
                        {p.prizeName}: {p.value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link href={`/events/${event.id}`}>
                <Button>Xem chi tiết & đăng ký</Button>
              </Link>
              <Link href="/events">
                <Button variant="secondary">Tất cả sự kiện</Button>
              </Link>
            </div>
          </div>

          {!countdown.isPast && (
            <aside className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-base)]/80 p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    countdown.isUrgent
                      ? "animate-ping bg-[var(--color-danger)]"
                      : "bg-[var(--accent-primary)]"
                  }`}
                />
                {countdownLabel}
              </div>

              <div className="grid grid-cols-4 gap-2" suppressHydrationWarning>
                {[
                  { value: countdown.days, label: "ngày" },
                  { value: countdown.hours, label: "giờ" },
                  { value: countdown.minutes, label: "phút" },
                  { value: countdown.seconds, label: "giây" },
                ].map((u) => (
                  <div
                    key={u.label}
                    className="rounded-md bg-[var(--bg-panel)] px-1 py-2 text-center"
                    suppressHydrationWarning
                  >
                    <span
                      className={`block font-display text-xl font-semibold tabular-nums sm:text-2xl ${
                        countdown.isUrgent
                          ? "text-[var(--color-danger)]"
                          : "text-[var(--accent-primary)]"
                      }`}
                      suppressHydrationWarning
                    >
                      {String(u.value).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">{u.label}</span>
                  </div>
                ))}
              </div>

              {event.rounds && event.rounds.length > 0 && (
                <div className="mt-4 border-t border-[var(--border-muted)] pt-3">
                  <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">Lịch vòng thi</p>
                  <ol className="space-y-2">
                    {event.rounds.map((r) => {
                      const isPast = new Date(r.startDate) < new Date();
                      return (
                        <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                          <span
                            className={
                              isPast
                                ? "text-[var(--text-muted)] line-through"
                                : "text-[var(--text-primary)]"
                            }
                          >
                            {r.roundName}
                          </span>
                          <span className="shrink-0 text-xs text-[var(--text-muted)]">
                            {formatShortDate(r.startDate)}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

              {countdown.isUrgent && (
                <p className="mt-3 rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-2 py-1.5 text-center text-xs font-medium text-[var(--color-danger)]">
                  Sắp đóng cổng — nộp bài ngay
                </p>
              )}
            </aside>
          )}
        </div>
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
    <section className="border-t border-[var(--border-muted)] px-4 py-14 sm:px-6 md:py-16">
      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] md:text-3xl">
            {title}
          </h2>
          {showAllHref && (
            <Link
              href={showAllHref}
              className="text-sm font-medium text-[var(--accent-primary)] hover:underline"
            >
              Xem tất cả sự kiện →
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          {featuredEvent && (
            <Link
              href={`/events/${featuredEvent.id}`}
              className="group flex min-w-0 flex-col justify-between rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-6 transition-colors hover:border-[var(--accent-primary)]/50"
              style={{ borderTop: `3px solid ${STATUS_DOT_VAR[featuredEvent.status]}` }}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge tone={STATUS_TONE[featuredEvent.status]}>
                    {STATUS_LABEL[featuredEvent.status]}
                  </Badge>
                  <span className="text-xs text-[var(--text-muted)]">
                    {featuredEvent.season} {featuredEvent.year}
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-primary)] sm:text-2xl">
                    {featuredEvent.eventName}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm text-[var(--text-muted)]">
                    {featuredEvent.tagline}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-[var(--border-muted)] pt-4 text-sm text-[var(--text-muted)]">
                <span>{featuredEvent.teamCount} đội đã đăng ký</span>
                {featuredEvent.prizes.length > 0 && (
                  <span className="font-medium text-[var(--accent-judge)]">
                    {featuredEvent.prizes[0].prizeName}: {featuredEvent.prizes[0].value}
                  </span>
                )}
              </div>
            </Link>
          )}

          <div className="flex flex-col gap-4">
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
      className="group flex min-w-0 flex-col justify-between rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-4 transition-colors hover:border-[var(--accent-primary)]/40"
      style={{ borderTop: `3px solid ${STATUS_DOT_VAR[event.status]}` }}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <Badge tone={STATUS_TONE[event.status]}>{STATUS_LABEL[event.status]}</Badge>
          <span className="text-[10px] text-[var(--text-muted)]">
            {event.season} {event.year}
          </span>
        </div>
        <h3 className="mt-2 font-display text-base font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-primary)]">
          {event.eventName}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">{event.tagline}</p>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[var(--border-muted)] pt-2.5 text-xs text-[var(--text-muted)]">
        <span>{event.teamCount} đội thi</span>
        {event.prizes.length > 0 && (
          <span className="font-medium text-[var(--accent-judge)]">
            {event.prizes[0].prizeName}: {event.prizes[0].value}
          </span>
        )}
      </div>
    </Link>
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
    <section className="mb-12 border-t border-[var(--border-muted)] px-4 py-14 sm:px-6 md:py-16">
      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] md:text-3xl">
            Câu hỏi thường gặp
          </h2>
        </div>

        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            const panelId = `landing-faq-panel-${idx}`;
            const buttonId = `landing-faq-button-${idx}`;
            return (
              <div
                key={idx}
                className={`overflow-hidden rounded-lg border bg-[var(--bg-panel)] transition-colors ${
                  isOpen ? "border-[var(--accent-primary)]/50" : "border-[var(--border-muted)]"
                }`}
              >
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"
                >
                  <span>{faq.q}</span>
                  <span aria-hidden className="shrink-0 text-[var(--text-muted)]">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className="border-t border-[var(--border-muted)] px-4 pb-4 pt-3 text-sm leading-relaxed text-[var(--text-muted)]"
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
