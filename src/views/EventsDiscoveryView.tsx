"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";
import { useMyTeam } from "@/repositories/teamsRepository";
import { useEventDetail } from "@/repositories/eventsRepository";
import {
  STATUS_LABEL,
  STATUS_DOT_VAR,
  STATUS_TONE,
  computeEventStatus,
  type EventCardData,
} from "@/viewModels/eventsMetadata";
import {
  useEventsDiscoveryViewModel,
  type EventStatusFilter,
  type EventSortOption,
} from "@/viewModels/useEventsDiscoveryViewModel";

// ─── Helper ────────────────────────────────────────────────────────────────────
function formatVnd(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)} ₫`;
}
function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
function daysLeft(endDate: string): number {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000);
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <rect x="2" y="3" width="12" height="11" rx="1" />
      <path d="M2 6.5h12M5 1.5v3M11 1.5v3" strokeLinecap="round" />
    </svg>
  );
}
function TagIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`mt-[1px] h-3.5 w-3.5 shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M8.5 2H3a1 1 0 00-1 1v5.5a1 1 0 00.3.7l6 6a1 1 0 001.4 0l5.5-5.5a1 1 0 000-1.4l-6-6a1 1 0 00-.7-.3z" strokeLinejoin="round" />
      <circle cx="5" cy="5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function TeamIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <circle cx="6" cy="5" r="2.5" />
      <path d="M1 13c0-2.8 2-4.5 5-4.5s5 1.7 5 4.5" strokeLinecap="round" />
      <circle cx="12" cy="5" r="1.8" />
      <path d="M14 13c0-1.8-1-3-2.5-3.5" strokeLinecap="round" />
    </svg>
  );
}
function SealMark() {
  return (
    <svg viewBox="0 0 100 100" className="h-10 w-10" aria-hidden="true">
      <polygon points="50,4 92,27 92,73 50,96 8,73 8,27" fill="none" stroke="var(--accent-primary)" strokeWidth="3" opacity="0.7" />
      <polygon points="50,30 68,40 68,60 50,70 32,60 32,40" fill="rgba(0,217,255,0.15)" />
    </svg>
  );
}

// ─── Event Card (Devpost-style horizontal) ────────────────────────────────────
function EventCard({ event }: { event: EventCardData }) {
  const days = daysLeft(event.endDate);
  const isActive = event.status === "ongoing" || event.status === "registration_open";
  const statusColor = STATUS_DOT_VAR[event.status];

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex items-stretch border border-[var(--border-muted)] bg-[var(--bg-panel)] transition-all duration-200 hover:border-[var(--accent-primary)]/60 hover:shadow-[0_0_20px_rgba(0,217,255,0.06)] hud-clipped"
      style={{ borderLeft: `3px solid ${statusColor}` }}
    >
      {/* Thumbnail */}
      <div className="hidden sm:flex w-28 shrink-0 items-center justify-center bg-[var(--bg-input)] border-r border-[var(--border-muted)]">
        <SealMark />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col justify-between p-4 min-w-0">
        {/* Top row: title + status badge */}
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <h3 className="font-display text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
            {event.eventName}
          </h3>
          <Badge tone={STATUS_TONE[event.status]}>{STATUS_LABEL[event.status]}</Badge>
          {isActive && days > 0 && days <= 30 && (
            <span className={`font-mono text-[9px] px-2 py-0.5 border tracking-widest uppercase ${days <= 3 ? "border-[var(--color-danger)]/50 text-[var(--color-danger)] bg-[var(--color-danger)]/10 animate-pulse" : "border-[var(--color-warning)]/50 text-[var(--color-warning)] bg-[var(--color-warning)]/10"}`}>
              {days <= 0 ? "HÔM NAY" : `${days} NGÀY`}
            </span>
          )}
        </div>

        {/* Tagline */}
        <p className="text-xs text-[var(--text-muted)] truncate mb-2">{event.tagline}</p>

        {/* Bottom row: prize + teams */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-mono text-sm font-bold text-[var(--text-primary)]">
            {formatVnd(event.totalPrizeVnd)}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-xs text-[var(--text-muted)]">
            <TeamIcon />
            {event.teamCount}/{event.maxTeams} đội
          </span>
        </div>
      </div>

      {/* Right meta column */}
      <div className="hidden md:flex w-52 shrink-0 flex-col justify-center gap-2 border-l border-[var(--border-muted)] px-4 py-4">
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--text-muted)]">
          <CalendarIcon />
          {formatShortDate(event.startDate)} – {formatShortDate(event.endDate)}
        </span>
        <span className="flex items-start gap-1.5 font-mono text-[10px] text-[var(--text-muted)]">
          <TagIcon className="mt-px" />
          <span className="flex flex-wrap gap-1">
            {event.tracks.slice(0, 2).map((t) => (
              <span key={t} className="border border-[var(--border-muted)] px-1.5 py-0.5 text-[var(--accent-primary)]/80">
                {t}
              </span>
            ))}
            {event.tracks.length > 2 && (
              <span className="text-[var(--text-muted)]">+{event.tracks.length - 2}</span>
            )}
          </span>
        </span>
      </div>

      {/* Arrow */}
      <div className="flex shrink-0 items-center px-3 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100">
        →
      </div>
    </Link>
  );
}

// ─── Sidebar Filter ────────────────────────────────────────────────────────────
const ALL_STATUS_OPTIONS: { value: EventStatusFilter | "my_event"; label: string; dot: string }[] = [
  { value: "all",               label: "Tất cả sự kiện",   dot: "bg-[var(--text-muted)]" },
  { value: "my_event",          label: "⭐ Sự kiện của tôi",dot: "bg-[var(--accent-team)] animate-pulse" },
  { value: "registration_open", label: "Đang mở đăng ký",  dot: "bg-[var(--color-success)]" },
  { value: "ongoing",           label: "Đang diễn ra",     dot: "bg-[var(--accent-primary)]" },
  { value: "upcoming",          label: "Sắp diễn ra",      dot: "bg-[var(--color-warning)]" },
  { value: "ended",             label: "Đã kết thúc",      dot: "bg-[var(--text-muted)] opacity-50" },
];

function SidebarFilter({
  statusFilter, setStatusFilter,
  trackFilter,  setTrackFilter,
  topTracks,
  isAdmin,
  onClear,
}: {
  statusFilter: EventStatusFilter;
  setStatusFilter: (v: EventStatusFilter) => void;
  trackFilter: string | null;
  setTrackFilter: (v: string | null) => void;
  topTracks: { track: string; eventCount: number }[];
  isAdmin?: boolean;
  onClear: () => void;
}) {
  const activeCount = (statusFilter !== "all" ? 1 : 0) + (trackFilter ? 1 : 0);
  const statusOptions = isAdmin
    ? ALL_STATUS_OPTIONS.filter((opt) => opt.value !== "my_event")
    : ALL_STATUS_OPTIONS;

  return (
    <aside className="w-full md:w-56 shrink-0 flex flex-col gap-5">
      {/* Clear */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase">
          BỘ LỌC
        </span>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="font-mono text-[10px] text-[var(--color-danger)] hover:underline"
          >
            Xóa ({activeCount})
          </button>
        )}
      </div>

      {/* Status section */}
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
          Trạng thái
        </span>
        {statusOptions.map((opt) => {
          const isSelected = statusFilter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`group flex items-center justify-between px-3 py-2 text-left font-mono text-xs transition-colors hud-clipped ${
                isSelected
                  ? "bg-[var(--accent-primary)] text-[var(--bg-base)] font-bold"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${opt.dot}`} />
                <span>{opt.label}</span>
              </div>
              {isSelected && <span className="text-[10px]">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Track section */}
      {topTracks.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
            Hạng mục ({topTracks.length})
          </span>
          <button
            onClick={() => setTrackFilter(null)}
            className={`flex items-center justify-between px-3 py-1.5 text-left font-mono text-xs transition-colors hud-clipped ${
              !trackFilter
                ? "bg-[var(--accent-primary)] text-[var(--bg-base)] font-bold"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>Tất cả</span>
          </button>
          {topTracks.map(({ track, eventCount }) => {
            const isSelected = trackFilter === track;
            return (
              <button
                key={track}
                onClick={() => setTrackFilter(isSelected ? null : track)}
                className={`flex items-center justify-between px-3 py-1.5 text-left font-mono text-xs transition-colors hud-clipped ${
                  isSelected
                    ? "bg-[var(--accent-primary)] text-[var(--bg-base)] font-bold"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span className="truncate pr-1">{track}</span>
                <span className="text-[10px] opacity-60 shrink-0">({eventCount})</span>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}

// ─── Sort Tabs (Devpost-style inline tabs) ────────────────────────────────────
const SORT_OPTIONS: { value: EventSortOption; label: string }[] = [
  { value: "relevant",    label: "Liên quan nhất" },
  { value: "soonest",     label: "Sắp diễn ra" },
  { value: "newest",      label: "Mới thêm" },
  { value: "most_teams",  label: "Nhiều đội nhất" },
];

// ─── Main View ─────────────────────────────────────────────────────────────────
export function EventsDiscoveryView() {
  const { user, activeRole } = useAuth();
  let roleName = "";
  if (user?.isAdmin || user?.IsAdmin) {
    roleName = "Admin";
  } else {
    roleName = activeRole?.roleName || activeRole?.RoleName || "Guest";
    if (roleName === "EventCoordinator") roleName = "Coordinator";
  }

  const { data: teamResponse } = useMyTeam();
  const team = (teamResponse as any)?.team ?? teamResponse;
  const myEventId =
    activeRole?.eventId ||
    activeRole?.EventId ||
    team?.EventId ||
    (team as { eventId?: string })?.eventId ||
    "";
  const { data: assignedEvent } = useEventDetail(myEventId);

  const {
    events, totalCount, topTracks,
    search, setSearch,
    statusFilter, setStatusFilter,
    trackFilter, setTrackFilter,
    sort, setSort,
  } = useEventsDiscoveryViewModel();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleClear = () => {
    setStatusFilter("all");
    setTrackFilter(null);
  };

  const listedMine = events.find((e) => e.id === myEventId);
  const bannerName =
    listedMine?.eventName ||
    assignedEvent?.eventName ||
    assignedEvent?.EventName ||
    assignedEvent?.name ||
    (team as { eventName?: string; EventName?: string })?.eventName ||
    (team as { EventName?: string })?.EventName ||
    "";
  const bannerStatus = listedMine
    ? listedMine.status
    : assignedEvent?.startDate && assignedEvent?.endDate
      ? computeEventStatus(
          {
            id: myEventId,
            eventName: bannerName || "Sự kiện",
            season: String(assignedEvent.season || assignedEvent.Season || ""),
            year: Number(assignedEvent.year || assignedEvent.Year || 0),
            tagline: "",
            description: "",
            startDate: assignedEvent.startDate,
            endDate: assignedEvent.endDate,
            registrationStartDate: assignedEvent.registrationStartDate || assignedEvent.startDate,
            registrationEndDate: assignedEvent.registrationEndDate || assignedEvent.endDate,
            maxTeams: 0,
            teamCount: 0,
            tracks: [],
            rounds: [],
            totalPrizeVnd: 0,
          },
          Date.now(),
        )
      : null;
  const bannerSeason = listedMine
    ? [listedMine.season, listedMine.year].filter(Boolean).join(" ")
    : [assignedEvent?.season || assignedEvent?.Season, assignedEvent?.year || assignedEvent?.Year]
        .filter(Boolean)
        .join(" ");

  return (
    <main className="hud-lattice flex flex-1 flex-col">

      {/* ── Page Header ── */}
      <section className="border-b border-[var(--border-muted)] bg-[var(--bg-panel)]/60">
        <div className="mx-auto w-full max-w-[var(--container-max)] px-6 py-8">
          <span className="font-mono text-[10px] text-[var(--accent-primary)] tracking-[0.3em] uppercase opacity-70">
            {"// EVENT DISCOVERY"}
          </span>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-[var(--text-primary)] mt-1">
            Sự Kiện
          </h1>
          <p className="font-mono text-xs text-[var(--text-muted)] mt-1">
            Duyệt toàn bộ hackathon do SEAL tổ chức — đăng nhập để tham gia.
          </p>
        </div>
      </section>

      {/* ── Search bar ── */}
      <div className="border-b border-[var(--border-muted)] bg-[var(--bg-base)]">
        <div className="mx-auto w-full max-w-[var(--container-max)] px-6 py-3 flex items-center gap-3">
          <div className="relative flex-1 max-w-xl">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
            </svg>
            <input
              type="search"
              id="events-search-input"
              placeholder="Tìm sự kiện theo tên hoặc từ khóa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-[var(--border-muted)] bg-[var(--bg-input)] font-mono text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
            />
          </div>
          {/* Mobile: toggle sidebar */}
          <button
            className="md:hidden hud-clipped px-4 py-2.5 border border-[var(--border-muted)] font-mono text-xs text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            BỘ LỌC {sidebarOpen ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* ── Main Layout: Sidebar + List ── */}
      <div className="mx-auto w-full max-w-[var(--container-max)] px-6 py-6 flex gap-6 flex-1">

        {/* Sidebar */}
        <div className={`${sidebarOpen ? "flex" : "hidden"} md:flex`}>
          <SidebarFilter
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            trackFilter={trackFilter}
            setTrackFilter={setTrackFilter}
            topTracks={topTracks}
            isAdmin={roleName === "Admin"}
            onClear={handleClear}
          />
        </div>

        {/* Right: results + list */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* ── Admin Executive Banner ── */}
          {user && roleName === "Admin" && (
            <div className="p-5 bg-[var(--bg-panel)] border border-[var(--color-danger)]/40 hud-clipped flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_20px_rgba(239,68,68,0.08)]">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-[var(--color-danger)] uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-danger)] animate-pulse" />
                  👑 TRUNG TÂM CHỈ HUY QUẢN TRỊ VIÊN (SYSTEM ADMIN)
                </div>
                <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
                  Quản Trị Toàn Bộ {totalCount} Sự Kiện Hệ Thống
                </h2>
                <p className="font-mono text-xs text-[var(--text-muted)] mt-0.5">
                  Dành riêng cho System Admin: Khởi tạo sự kiện mới, phân công Event Coordinator và quản lý trường học &amp; tài khoản.
                </p>
              </div>

              <Link href="/admin/dashboard">
                <button className="hud-clipped px-5 py-2.5 bg-[var(--color-danger)] text-white font-mono font-bold text-xs tracking-wider uppercase hover:bg-white hover:text-black transition-all shadow-sm shrink-0 cursor-pointer">
                  👑 BẢNG ĐIỀU HÀNH ADMIN ➔
                </button>
              </Link>
            </div>
          )}

          {/* ── My Joined Event Banner (DÀNH RIÊNG CHO CÁC VAI TRÒ KHÁC ADMIN) ── */}
          {user && roleName !== "Guest" && roleName !== "Admin" && (
            <div className="p-5 bg-[var(--bg-panel)] border border-[var(--accent-primary)]/40 hud-clipped flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_20px_rgba(0,217,255,0.08)]">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                  ⭐ SỰ KIỆN CỦA TÔI {roleName === "Mentor" ? "(VAI TRÒ: CỐ VẤN TRACK)" : roleName === "Coordinator" ? "(VAI TRÒ: BAN TỔ CHỨC)" : roleName === "Judge" ? "(VAI TRÒ: GIÁM KHẢO)" : team ? `(ĐỘI: ${team.TeamName || (team as any).teamName})` : ""}
                </div>
                <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
                  {bannerName || "Sự kiện được phân công"}
                </h2>
                <div className="flex items-center gap-3 font-mono text-xs text-[var(--text-muted)] mt-0.5">
                  <span>Vai trò hiện tại: <strong className="text-[var(--accent-primary)]">{roleName}</strong></span>
                  {bannerStatus && (
                    <>
                      <span>·</span>
                      <span>Trạng thái: <strong className="text-[var(--color-success)]">{STATUS_LABEL[bannerStatus]}</strong></span>
                    </>
                  )}
                  {bannerSeason && (
                    <>
                      <span>·</span>
                      <span>{bannerSeason}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Smart Role-Based Button Action */}
              {roleName === "Mentor" && (
                <Link href="/mentor/tracks">
                  <button className="hud-clipped px-5 py-2.5 bg-[#2dd4bf] text-[var(--bg-base)] font-mono font-bold text-xs tracking-wider uppercase hover:bg-white transition-all shadow-sm shrink-0 cursor-pointer">
                    💼 VÀO BÀN LÀM VIỆC CỐ VẤN ➔
                  </button>
                </Link>
              )}

              {roleName === "Coordinator" && (
                <Link href="/coordinator/dashboard">
                  <button className="hud-clipped px-5 py-2.5 bg-[#a855f7] text-white font-mono font-bold text-xs tracking-wider uppercase hover:bg-white hover:text-black transition-all shadow-sm shrink-0 cursor-pointer">
                    🎯 CONTROL CENTER BTC ➔
                  </button>
                </Link>
              )}

              {roleName === "Judge" && (
                <Link href="/judge/scoring">
                  <button className="hud-clipped px-5 py-2.5 bg-[var(--accent-judge)] text-[var(--bg-base)] font-mono font-bold text-xs tracking-wider uppercase hover:bg-white transition-all shadow-sm shrink-0 cursor-pointer">
                    ⚖ VÀO BÀN CHẤM GIÁM KHẢO ➔
                  </button>
                </Link>
              )}


              {(roleName === "TeamLeader" || roleName === "TeamMember") && myEventId && (
                <Link href={`/events/${myEventId}`}>
                  <button className="hud-clipped px-5 py-2.5 bg-[var(--accent-team)] text-[var(--bg-base)] font-mono font-bold text-xs tracking-wider uppercase hover:bg-white transition-all shadow-sm shrink-0 cursor-pointer">
                    ↗ XEM CHI TIẾT SỰ KIỆN CỦA TÔI ➔
                  </button>
                </Link>
              )}
            </div>
          )}

          {/* Result count + Sort tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-muted)]">
            <p className="font-mono text-sm text-[var(--text-muted)]">
              Hiển thị{" "}
              <span className="font-bold text-[var(--text-primary)]">{events.length}</span>
              {" / "}
              <span className="font-bold text-[var(--text-primary)]">{totalCount}</span>
              {" "}sự kiện
            </p>

            {/* Sort tabs */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="font-mono text-xs text-[var(--text-muted)] mr-1">Sắp xếp:</span>
              {SORT_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSort(value)}
                  className={`font-mono text-xs px-3 py-1.5 border transition-colors ${
                    sort === value
                      ? "border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--accent-primary)]/10"
                      : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-muted)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Event list */}
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="font-mono text-3xl text-[var(--border-muted)]">{"[ ]"}</div>
              <p className="font-mono text-sm text-[var(--text-muted)]">
                Không tìm thấy sự kiện phù hợp với bộ lọc.
              </p>
              <button
                onClick={handleClear}
                className="hud-clipped mt-2 px-4 py-2 border border-[var(--border-muted)] font-mono text-xs text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
              >
                [ XÓA BỘ LỌC ]
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {events.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
