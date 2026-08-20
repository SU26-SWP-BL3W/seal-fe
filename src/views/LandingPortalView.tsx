"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui";
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
import { Button } from "@/components/ui";

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
      const isCoord = rawRole === "Coordinator" || rawRole === "EventCoordinator" || userEmail.includes("ec.") || userEmail.includes("coordinator");
      const isJudge = rawRole === "Judge" || userEmail.includes("judge");
      const isMentor = rawRole === "Mentor" || userEmail.includes("mentor");

      if (isAdm) router.replace("/admin/dashboard");
      else if (isCoord) router.replace("/coordinator/dashboard");
      else if (isJudge) router.replace("/judge/events");
      else if (isMentor) router.replace("/events");
    }
  }, [user, activeRole, router]);

  return (
    <main className="flex flex-1 flex-col">
      <section className="border-b border-[var(--border-muted)] px-4 py-16 sm:px-6 md:py-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)]">
            <SealShield className="h-8 w-8 text-[var(--accent-primary)]" />
          </div>

          <p className="text-sm font-medium text-[var(--accent-primary)]">Hệ thống đấu trường hackathon SEAL</p>

          <h1 className="font-display text-3xl font-semibold leading-tight text-[var(--text-primary)] md:text-5xl">
            Nơi ý tưởng công nghệ bứt phá giới hạn
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-[var(--text-muted)]">
            Đấu trường hackathon dành cho sinh viên toàn quốc — xây dựng sản phẩm thực tế,
            nhận tư vấn từ mentor và đánh giá minh bạch theo tiêu chí chuẩn.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/events">
              <Button className="min-w-[180px]">Khám phá sự kiện</Button>
            </Link>
            <Link href="/register">
              <Button variant="secondary" className="min-w-[180px]">
                Đăng ký tham gia
              </Button>
            </Link>
          </div>

          <p className="text-sm text-[var(--text-muted)]">
            Truy cập nhanh:{" "}
            <Link href="/my-team" className="text-[var(--text-primary)] hover:text-[var(--accent-primary)] hover:underline">
              Đội thi
            </Link>
            {" · "}
            <Link href="/judge/scoring" className="text-[var(--text-primary)] hover:text-[var(--accent-primary)] hover:underline">
              Giám khảo
            </Link>
            {" · "}
            <Link href="/coordinator/dashboard" className="text-[var(--text-primary)] hover:text-[var(--accent-primary)] hover:underline">
              Ban tổ chức
            </Link>
          </p>
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
          SECTION 6: PODIUM HALL OF FAME & PROOF OF RESULTS
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
                <span className="text-xs text-[var(--text-muted)]">
                  Mã: {formatShortId(event.id)}
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
                    Sắp đóng cổng — Nộp bài ngay!
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
              className="hud-clipped group flex flex-col justify-between border border-[var(--border-muted)] bg-[var(--bg-panel)] p-6 transition-all hover:border-[var(--accent-primary)]/70 hover:shadow-lg"
              style={{ borderTop: `4px solid ${STATUS_DOT_VAR[featuredEvent.status]}` }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge tone={STATUS_TONE[featuredEvent.status]}>{STATUS_LABEL[featuredEvent.status]}</Badge>
                  <span className="font-mono text-xs font-bold text-[var(--accent-primary)] uppercase">
                    TIÊU ĐIỂM • {featuredEvent.season} {featuredEvent.year}
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
                {featuredEvent.prizes.length > 0 && (
                  <span className="font-bold text-[var(--accent-judge)] text-sm">
                    {featuredEvent.prizes[0].prizeName}: {featuredEvent.prizes[0].value}
                  </span>
                )}
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
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] md:text-3xl">
            Câu hỏi thường gặp
          </h2>
        </div>

        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className={`overflow-hidden rounded-lg border bg-[var(--bg-panel)] transition-colors ${
                  isOpen ? "border-[var(--accent-primary)]" : "border-[var(--border-muted)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)]"
                >
                  <span>{faq.q}</span>
                  <span className="shrink-0 text-[var(--text-muted)]">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="border-t border-[var(--border-muted)] px-4 pb-4 pt-3 text-sm leading-relaxed text-[var(--text-muted)]">
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
