"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { SealShield } from "@/components/domain/SealShield";
import { useEventDetailViewModel } from "@/viewModels/useEventDetailViewModel";
import type { RoundStatus } from "@/viewModels/useEventDetailViewModel";
import { useCountdown } from "@/lib/useCountdown";
import { useAuth } from "@/providers/AuthProvider";
import { TRACK_META, DEFAULT_TRACK_META, type TrackIconKey } from "@/viewModels/eventsMetadata";

import { hasEventPermission } from "@/lib/permissions";
import { useMyTeam } from "@/repositories/teamsRepository";

export function EventDetailView({ eventId }: { eventId: string }) {
  const { user, activeRole } = useAuth();
  const { data: teamResponse } = useMyTeam();
  const team = (teamResponse as any)?.team ?? teamResponse;

  const rawRole = activeRole?.roleName || activeRole?.RoleName;
  const userEmail = (user?.email || user?.Email || "").toLowerCase();
  let roleName = rawRole || "";
  if (roleName === "EventCoordinator") roleName = "Coordinator";
  if (!roleName) {
    if (userEmail.includes("ec_") || userEmail.includes("ec.") || userEmail.includes("coordinator")) {
      roleName = "Coordinator";
    } else if (userEmail.includes("judge")) {
      roleName = "Judge";
    } else if (userEmail.includes("mentor")) {
      roleName = "Mentor";
    } else if (user?.isAdmin || user?.IsAdmin) {
      roleName = "Admin";
    } else {
      roleName = "Guest";
    }
  }

  // Kiểm tra user/đội thi có thuộc sự kiện này không
  const isJoinedParticipant =
    (roleName === "TeamLeader" || roleName === "TeamMember") && ((team as any)?.eventId === eventId || team?.EventId === eventId);
  const isAuthorizedActor = hasEventPermission(user, activeRole, eventId);

  const {
    notFound,
    eventName,
    season,
    year,
    tagline,
    description,
    tracks,
    rounds,
    teamCount,
    maxTeams,
    totalPrizeVnd,
    deadline,
    deadlineRoundName,
  } = useEventDetailViewModel(eventId);
  const countdown = useCountdown(deadline);

  if (notFound) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-[var(--space-md)] p-[var(--space-xl)]">
        <p className="font-mono text-[color:var(--text-muted)]">Không tìm thấy sự kiện này.</p>
        <Link href="/events" className="font-mono text-sm text-[color:var(--accent-primary)] hover:text-white">
          ← Quay lại danh sách sự kiện
        </Link>
      </main>
    );
  }

  return (
    <main className="hud-lattice flex flex-1 flex-col pb-16">
      {/* ── Breadcrumb Bar ── */}
      <div className="border-b border-[var(--border-muted)] bg-[var(--bg-panel)]/40 px-6 py-3">
        <div className="mx-auto flex max-w-[var(--container-max)] items-center justify-between font-mono text-xs text-[var(--text-muted)]">
          <Link href="/events" className="hover:text-[var(--accent-primary)] flex items-center gap-1">
            ← Tất cả sự kiện
          </Link>
          <span className="text-[var(--accent-primary)] font-bold">
            SỰ KIỆN: {eventName.toUpperCase()}
          </span>
        </div>
      </div>

      {/* ── Main Full-Width Workspace Container ── */}
      <div className="mx-auto w-full max-w-[var(--container-max)] px-6 py-8 flex flex-col gap-10 flex-1">
        
        {/* ── Section Overview Banner ── */}
        <section className="p-8 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped flex flex-col md:flex-row justify-between gap-8 shadow-[0_0_30px_rgba(56,189,248,0.06)]">
          <div className="flex flex-col gap-4 flex-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-[var(--accent-primary)] tracking-widest uppercase border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 px-3 py-1">
                {season} {year}
              </span>
              <span className="font-mono text-xs text-[var(--text-muted)]">
                {teamCount}/{maxTeams} đội thi đã đăng ký
              </span>
            </div>

            <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide text-[var(--text-primary)] md:text-5xl">
              {eventName}
            </h1>
            
            <p className="font-mono text-sm text-[var(--accent-primary)]">{tagline}</p>
            <p className="font-sans text-sm text-[var(--text-muted)] leading-relaxed max-w-3xl">{description}</p>

            <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-[var(--border-muted)] mt-2 font-mono text-xs">
              <span>Tổng giải thưởng: <strong className="text-[var(--accent-judge)] font-bold text-base">{formatVnd(totalPrizeVnd)}</strong></span>
              <span>·</span>
              <span>Số hạng mục: <strong className="text-[var(--text-primary)] font-bold">{tracks.length} Tracks</strong></span>
            </div>

            {/* ── Sub-Navbar Ngang Chức Năng Role ── */}
            <div className="mt-6 pt-4 border-t border-[var(--border-muted)]">
              <div className="font-mono text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-widest mb-2 flex items-center gap-2">
                <span>⚡ CHỨC NĂNG THAM GIA ({roleName === "TeamLeader" || roleName === "TeamMember" ? (isJoinedParticipant ? roleName : "THÍ SINH TỰ DO") : roleName}):</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                {/* Active tab hiện tại */}
                <span className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--bg-base)] font-bold hud-clipped flex items-center gap-1.5 shadow-sm">
                  <span>📍</span> 1. THỂ LỆ & CHI TIẾT
                </span>

                {/* THI ĐẤU: CHỈ HIỂN THỊ KHI ĐÃ ĐĂNG KÝ SỰ KIỆN NÀY */}
                {(roleName === "TeamLeader" || roleName === "TeamMember") && isJoinedParticipant && (
                  <>
                    <Link href="/my-team">
                      <button className="px-4 py-2 bg-[var(--bg-panel)] border border-[var(--accent-team)]/50 text-[var(--accent-team)] font-bold hover:bg-[var(--accent-team)] hover:text-black transition-all hud-clipped cursor-pointer flex items-center gap-1.5">
                        <span>👥</span> {roleName === "TeamLeader" ? "2. QUẢN LÝ ĐỘI THI" : "2. XEM ĐỘI THI CỦA TÔI"}
                      </button>
                    </Link>

                    <Link href="/my-submissions">
                      <button className="px-4 py-2 bg-[var(--bg-panel)] border border-[var(--accent-team)]/50 text-[var(--accent-team)] font-bold hover:bg-[var(--accent-team)] hover:text-black transition-all hud-clipped cursor-pointer flex items-center gap-1.5">
                        <span>📤</span> {roleName === "TeamLeader" ? "3. NỘP BÀI THI CỦA ĐỘI" : "3. XEM BÀI NỘP CỦA ĐỘI"}
                      </button>
                    </Link>

                    <Link href={`/events/${eventId}/leaderboard`}>
                      <button className="px-4 py-2 bg-[var(--bg-panel)] border border-[var(--accent-judge)]/50 text-[var(--accent-judge)] font-bold hover:bg-[var(--accent-judge)] hover:text-black transition-all hud-clipped cursor-pointer flex items-center gap-1.5">
                        <span>🏆</span> 4. BẢNG XẾP HẠNG KẾT QUẢ
                      </button>
                    </Link>

                    <Link href="/appeals">
                      <button className="px-4 py-2 bg-[var(--bg-panel)] border border-[var(--accent-coordinator)]/50 text-[var(--accent-coordinator)] font-bold hover:bg-[var(--accent-coordinator)] hover:text-black transition-all hud-clipped cursor-pointer flex items-center gap-1.5">
                        <span>⚖</span> 5. PHÚC KHẢO & KHIẾU NẠI
                      </button>
                    </Link>
                  </>
                )}

                {/* THÍ SINH CHƯA ĐĂNG KÝ SỰ KIỆN NÀY */}
                {(roleName === "TeamLeader" || roleName === "TeamMember") && !isJoinedParticipant && (
                  <>
                    <Link href="/register">
                      <button className="px-5 py-2 bg-[var(--accent-team)] text-[var(--bg-base)] font-bold hover:bg-white transition-all hud-clipped cursor-pointer flex items-center gap-1.5 shadow-sm">
                        <span>🚀</span> 2. ĐĂNG KÝ THAM GIA SỰ KIỆN NÀY
                      </button>
                    </Link>
                    <Link href={`/events/${eventId}/leaderboard`}>
                      <button className="px-4 py-2 bg-[var(--bg-panel)] border border-[var(--accent-judge)]/50 text-[var(--accent-judge)] font-bold hover:bg-[var(--accent-judge)] hover:text-black transition-all hud-clipped cursor-pointer flex items-center gap-1.5">
                        <span>🏆</span> 3. XEM BẢNG XẾP HẠNG
                      </button>
                    </Link>
                  </>
                )}

                {(roleName === "Coordinator" || roleName === "Admin") && (
                  <>
                    <Link href={`/coordinator/events/${eventId}`}>
                      <button className="px-4 py-2 bg-[#a855f7] text-white font-bold hover:bg-white hover:text-black transition-all hud-clipped cursor-pointer flex items-center gap-1.5 shadow-sm">
                        <span>✏️</span> 2. QUẢN LÝ / CHỈNH SỬA SỰ KIỆN (BTC)
                      </button>
                    </Link>
                    <Link href="/coordinator/dashboard">
                      <button className="px-4 py-2 bg-[var(--bg-panel)] border border-[#a855f7]/50 text-[#a855f7] font-bold hover:bg-[#a855f7] hover:text-white transition-all hud-clipped cursor-pointer flex items-center gap-1.5">
                        <span>🎯</span> 3. CONTROL CENTER BTC
                      </button>
                    </Link>
                    <Link href={`/events/${eventId}/leaderboard`}>
                      <button className="px-4 py-2 bg-[var(--bg-panel)] border border-[var(--accent-judge)]/50 text-[var(--accent-judge)] font-bold hover:bg-[var(--accent-judge)] hover:text-black transition-all hud-clipped cursor-pointer flex items-center gap-1.5">
                        <span>🏆</span> 4. XEM BẢNG XẾP HẠNG
                      </button>
                    </Link>
                  </>
                )}

                {roleName === "Mentor" && (
                  <>
                    <Link href="/mentor/tracks">
                      <button className="px-4 py-2 bg-[#2dd4bf] text-[var(--bg-base)] font-bold hover:bg-white transition-all hud-clipped cursor-pointer flex items-center gap-1.5">
                        <span>💼</span> 2. BÀN LÀM VIỆC CỐ VẤN
                      </button>
                    </Link>
                    <Link href="/mentor/submissions">
                      <button className="px-4 py-2 bg-[var(--bg-panel)] border border-[#2dd4bf]/50 text-[#2dd4bf] font-bold hover:bg-[#2dd4bf] hover:text-black transition-all hud-clipped cursor-pointer flex items-center gap-1.5">
                        <span>📂</span> 3. BÀI NỘP CẦN REVIEW
                      </button>
                    </Link>
                  </>
                )}

                {roleName === "Judge" && (
                  <>
                    <Link href="/judge/scoring">
                      <button className="px-4 py-2 bg-[var(--accent-judge)] text-[var(--bg-base)] font-bold hover:bg-white transition-all hud-clipped cursor-pointer flex items-center gap-1.5">
                        <span>⚖</span> 2. BÀN CHẤM ĐIỂM GIÁM KHẢO
                      </button>
                    </Link>
                    <Link href={`/events/${eventId}/leaderboard`}>
                      <button className="px-4 py-2 bg-[var(--bg-panel)] border border-[var(--accent-judge)]/50 text-[var(--accent-judge)] font-bold hover:bg-[var(--accent-judge)] hover:text-black transition-all hud-clipped cursor-pointer flex items-center gap-1.5">
                        <span>🏆</span> 3. BẢNG XẾP HẠNG
                      </button>
                    </Link>
                  </>
                )}

                {roleName === "Guest" && (
                  <Link href="/register">
                    <button className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--bg-base)] font-bold hover:bg-white transition-all hud-clipped cursor-pointer flex items-center gap-1.5">
                      <span>🚀</span> ĐĂNG KÝ THAM GIA SỰ KIỆN NÀY
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Right Logo Shield & Deadline Clock */}
          <div className="flex flex-col items-center justify-between gap-6 shrink-0 md:w-64 border-t md:border-t-0 md:border-l border-[var(--border-muted)] pt-6 md:pt-0 md:pl-8">
            <SealShield className="h-28 w-28 text-[var(--accent-primary)] drop-shadow-[0_0_20px_rgba(56,189,248,0.3)]" />
            {deadlineRoundName && !countdown.isPast && (
              <div className="hud-clipped w-full border border-[var(--border-muted)] bg-[var(--bg-input)] p-4 text-center">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">
                  Hạn nộp bài — {deadlineRoundName}
                </p>
                <CountdownClock {...countdown} />
              </div>
            )}
          </div>
        </section>

        {/* ── Section Schedule Horizontal Timeline ── */}
        <ScheduleSection rounds={rounds} />

        {/* ── Section Tracks ── */}
        <TracksSection tracks={tracks} />

      </div>
    </main>
  );
}

function CountdownClock({
  days,
  hours,
  minutes,
  seconds,
  isUrgent,
}: ReturnType<typeof useCountdown>) {
  const units = [
    { value: days, label: "ngày" },
    { value: hours, label: "giờ" },
    { value: minutes, label: "phút" },
    { value: seconds, label: "giây" },
  ];

  return (
    <div
      className={`flex items-center justify-center gap-2 font-mono ${
        isUrgent ? "text-[color:var(--color-danger)]" : "text-[color:var(--accent-primary)]"
      }`}
    >
      {units.map(({ value, label }) => (
        <div key={label} className="flex flex-col items-center">
          <span className="font-display text-xl font-bold">{String(value).padStart(2, "0")}</span>
          <span className="text-[9px] uppercase text-[color:var(--text-muted)]">{label}</span>
        </div>
      ))}
    </div>
  );
}

function ScheduleSection({ rounds }: { rounds: ReturnType<typeof useEventDetailViewModel>["rounds"] }) {
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);
  const currentRound = rounds[selectedRoundIndex] || rounds[0];

  if (!currentRound) return null;

  const milestones = [
    {
      id: "reg",
      title: "Mở Form Đăng Ký",
      date: formatShortDate(currentRound.registrationDate || currentRound.startDate),
      color: "var(--accent-primary)",
      desc: "Bắt đầu mở cổng nhận hồ sơ tạo đội thi",
    },
    {
      id: "start",
      title: "Thời Gian Thi",
      date: `${formatShortDate(currentRound.startDate)} – ${formatShortDate(currentRound.endDate)}`,
      color: "var(--accent-team)",
      desc: "Các đội thực hiện sản phẩm & làm bài",
    },
    {
      id: "sub",
      title: "Hạn Nộp Bài Thi",
      date: formatShortDate(currentRound.submissionDeadline || currentRound.endDate),
      color: "var(--color-danger)",
      desc: "Đóng cổng nhận bài thi vòng này",
    },
    {
      id: "res",
      title: "Công Bố Kết Quả",
      date: formatShortDate(currentRound.resultAnnouncementDate || currentRound.endDate),
      color: "var(--accent-judge)",
      desc: "Giám khảo công bố danh sách đi tiếp",
    },
    {
      id: "app",
      title: "Hạn Phúc Khảo",
      date: formatShortDate(currentRound.appealDeadline || currentRound.endDate),
      color: "var(--accent-coordinator)",
      desc: "Hạn cuối tiếp nhận khiếu nại điểm số",
    },
  ];

  return (
    <section className="p-8 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped flex flex-col gap-8 shadow-sm">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-muted)]">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--accent-primary)] uppercase tracking-widest font-bold">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            TIMELINE TIẾN TRÌNH VÒNG THI
          </div>
          <h2 className="font-display text-2xl font-bold uppercase text-[var(--text-primary)] mt-0.5">
            Lịch Trình Cuộc Thi
          </h2>
        </div>

        {/* Round Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {rounds.map((r, index) => (
            <button
              key={r.id || r.roundName}
              onClick={() => setSelectedRoundIndex(index)}
              className={`font-mono text-xs px-4 py-2 hud-clipped transition-all font-bold whitespace-nowrap ${
                selectedRoundIndex === index
                  ? "bg-[var(--accent-primary)] text-[var(--bg-base)] shadow-md"
                  : "bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-muted)]"
              }`}
            >
              {r.roundName.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Active Round Info Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[var(--bg-input)]/60 border border-[var(--border-muted)] hud-clipped">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] text-[var(--accent-primary)] font-bold uppercase tracking-wider">
              VÒNG {currentRound.roundNumber}: {currentRound.roundName.toUpperCase()}
            </span>
            <span className="font-mono text-xs font-bold text-[var(--accent-team)] bg-[var(--accent-team)]/10 border border-[var(--accent-team)]/30 px-2.5 py-0.5">
              🗓 THỜI GIAN VÒNG: {formatDateTime(currentRound.startDate)} — {formatDateTime(currentRound.endDate)}
            </span>
          </div>
          <p className="font-sans text-xs text-[var(--text-muted)] leading-relaxed">
            {currentRound.description}
          </p>
        </div>
        <Badge tone={roundTone(currentRound.status)}>
          {roundStatusLabel(currentRound.status)}
        </Badge>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          HORIZONTAL STEPPER TIMELINE (TRỤC TIẾN TRÌNH NGANG 5 MỐC)
         ───────────────────────────────────────────────────────────── */}
      <div className="relative py-6">
        {/* Connecting Background Line */}
        <div className="hidden md:block absolute top-[2.25rem] left-[10%] right-[10%] h-0.5 bg-[var(--border-muted)]" />

        {/* 5 Milestone Nodes Stepper */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
          {milestones.map((m, idx) => (
            <div key={m.id} className="flex flex-col items-center text-center group">
              {/* Stepper Node Icon / Number */}
              <div
                className="w-11 h-11 hud-clipped flex items-center justify-center font-mono font-bold text-xs mb-3 border bg-[var(--bg-panel)] transition-all group-hover:scale-110 shadow-sm"
                style={{
                  borderColor: m.color,
                  color: m.color,
                  boxShadow: `0 0 15px ${m.color}20`,
                }}
              >
                0{idx + 1}
              </div>

              {/* Title & Date */}
              <span className="font-mono text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                {m.title}
              </span>
              
              <strong
                className="font-mono text-xs mt-1 px-2.5 py-0.5 bg-[var(--bg-input)] border border-[var(--border-muted)]"
                style={{ color: m.color }}
              >
                {m.date}
              </strong>

              <p className="font-sans text-[11px] text-[var(--text-muted)] mt-1.5 leading-tight max-w-[160px]">
                {m.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TracksSection({ tracks }: { tracks: string[] }) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-muted)]">
        <span className="w-1.5 h-4 bg-[var(--accent-primary)] inline-block" />
        <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-[color:var(--text-primary)]">
          Hạng mục thi đấu ({tracks.length})
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {tracks.map((track, i) => {
          const meta = TRACK_META[track] ?? DEFAULT_TRACK_META;
          return (
            <div
              key={track}
              className="border p-6 bg-[var(--bg-panel)] hud-clipped flex flex-col gap-3 shadow-sm hover:border-[var(--accent-primary)]/50 transition-all"
              style={{ borderColor: "var(--border-muted)", borderLeft: `3px solid ${meta.accent}` }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center hud-clipped"
                  style={{ background: `color-mix(in srgb, ${meta.accent} 18%, var(--bg-input))` }}
                >
                  <TrackIcon icon={meta.icon} color={meta.accent} />
                </div>
                <span className="font-mono text-[10px] font-bold text-[color:var(--text-muted)] border border-[var(--border-muted)] px-2 py-0.5">
                  TRACK {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-[color:var(--text-primary)]">
                {track}
              </h3>
              <p className="text-xs text-[color:var(--text-muted)] leading-relaxed">{meta.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function roundStatusLabel(status: RoundStatus): string {
  switch (status) {
    case "current": return "Đang diễn ra";
    case "upcoming": return "Sắp tới";
    case "past": return "Đã kết thúc";
    default: return "Chưa xác định";
  }
}

function roundTone(status: RoundStatus): "success" | "warning" | "neutral" {
  switch (status) {
    case "current": return "success";
    case "upcoming": return "warning";
    case "past": return "neutral";
    default: return "neutral";
  }
}

function formatVnd(val: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const dateStr = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${dateStr} ${timeStr}`;
}

function TrackIcon({ icon, color }: { icon: TrackIconKey; color: string }) {
  const common = { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "none", stroke: color, strokeWidth: 1.6 } as const;
  switch (icon) {
    case "ai":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v3M12 18v3M21 12h-3M6 12H3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6" strokeLinecap="round" />
        </svg>
      );
    case "web":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M8 9 4 12l4 3M16 9l4 3-4 3M13.5 6l-3 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "security":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" strokeLinejoin="round" />
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "iot":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="7" y="7" width="10" height="10" rx="1" />
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.5 2.5M18.5 5.5 16 8M18.5 18.5 16 16M5.5 18.5 8 16" strokeLinecap="round" />
        </svg>
      );
    case "idea":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M9 18h6M10 21h4M8 14a4 4 0 1 1 8 0c0 1.5-.8 2.3-1.5 3-.4.4-.5.7-.5 1H9.9c0-.3-.1-.6-.5-1C8.7 16.3 8 15.5 8 14Z" strokeLinejoin="round" />
        </svg>
      );
  }
}
