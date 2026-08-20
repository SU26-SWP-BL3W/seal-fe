"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { useMyTeam } from "@/repositories/teamsRepository";
import { useEventDetail } from "@/repositories/eventsRepository";
import {
  STATUS_LABEL,
  STATUS_DOT_VAR,
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
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function daysLeft(endDate: string): number {
  if (!endDate) return 0;
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000);
}

// ─── Zero-Icon Tactical Event Card ────────────────────────────────────────────
function EventCard({ event }: { event: EventCardData }) {
  const days = daysLeft(event.endDate);
  const isActive = event.status === "ongoing" || event.status === "registration_open";
  const isEnded = event.status === "ended" || days < 0;
  const statusColor = STATUS_DOT_VAR[event.status] || "#2dd4bf";

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block bg-[#10171a] border border-zinc-800/90 hover:border-emerald-500/50 hud-clipped p-5 transition-all duration-200 shadow-sm relative overflow-hidden"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        
        {/* Left / Main Info */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Header Row: Badges + Title */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 hud-clipped text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${statusColor}15`,
                color: statusColor,
                border: `1px solid ${statusColor}40`,
              }}
            >
              [ {STATUS_LABEL[event.status] || "Sự kiện"} ]
            </span>

            {event.season && (
              <span className="px-2 py-0.5 hud-clipped text-[10px] font-bold bg-zinc-800/80 text-zinc-300 border border-zinc-700">
                {event.season} {event.year || 2026}
              </span>
            )}

            {isActive && days > 0 && days <= 30 && (
              <span className={`text-[10px] px-2 py-0.5 hud-clipped border font-bold uppercase ${
                days <= 3
                  ? "border-rose-500/40 text-rose-400 bg-rose-500/10 animate-pulse"
                  : "border-amber-500/40 text-amber-300 bg-amber-500/10"
              }`}>
                {days <= 0 ? "[ HÔM NAY ]" : `[ CÒN ${days} NGÀY ]`}
              </span>
            )}
          </div>

          {/* Event Title */}
          <h3 className="font-display text-lg font-bold text-white group-hover:text-emerald-400 transition-colors truncate uppercase">
            {event.eventName}
          </h3>

          {/* Tagline / Brief description */}
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-sans">
            {event.tagline || event.description || "Cuộc thi lập trình và phát triển sản phẩm công nghệ theo chuẩn RBL."}
          </p>

          {/* Tracks Tags */}
          {event.tracks && event.tracks.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 font-mono text-xs">
              <span className="text-zinc-500 text-[10px] uppercase font-bold">[ HẠNG MỤC: ]</span>
              {event.tracks.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 hud-clipped"
                >
                  {t}
                </span>
              ))}
              {event.tracks.length > 3 && (
                <span className="text-[10px] text-zinc-500">
                  +{event.tracks.length - 3} bảng khác
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Info: Prize, Dates, CTA */}
        <div className="flex flex-row md:flex-col md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-zinc-800/80 pt-3 md:pt-0 md:pl-6 shrink-0 gap-2 min-w-[200px] font-mono text-xs">
          {/* Prize */}
          <div className="space-y-0.5 md:text-right">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
              TỔNG GIẢI THƯỞNG
            </span>
            <span className="text-base font-extrabold text-emerald-400 flex items-center md:justify-end gap-1">
              {formatVnd(event.totalPrizeVnd ?? 0)}
            </span>
          </div>

          {/* Dates */}
          <div className="space-y-0.5 md:text-right text-right md:pt-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
              THỜI GIAN
            </span>
            <span className="text-xs text-zinc-300 flex items-center justify-end gap-1">
              {formatShortDate(event.startDate)} – {formatShortDate(event.endDate)}
            </span>
          </div>

          {/* Action CTA */}
          <div className="hidden md:flex items-center gap-1 text-xs text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity pt-1">
            <span>{isEnded ? "[ XEM BẢNG XẾP HẠNG > ]" : "[ CHI TIẾT SỰ KIỆN > ]"}</span>
          </div>
        </div>

      </div>
    </Link>
  );
}

// ─── Zero-Icon Sidebar Filter ─────────────────────────────────────────────────
const ALL_STATUS_OPTIONS: { value: EventStatusFilter | "my_event"; label: string; dot: string }[] = [
  { value: "all",               label: "Tất cả sự kiện",   dot: "bg-zinc-400" },
  { value: "my_event",          label: "Sự kiện của tôi",  dot: "bg-amber-400 animate-pulse" },
  { value: "registration_open", label: "Đang mở đăng ký",  dot: "bg-emerald-400" },
  { value: "ongoing",           label: "Đang diễn ra",     dot: "bg-cyan-400" },
  { value: "upcoming",          label: "Sắp diễn ra",      dot: "bg-amber-400" },
  { value: "ended",             label: "Đã kết thúc",      dot: "bg-zinc-600" },
];

function SidebarFilter({
  statusFilter, setStatusFilter,
  trackFilter,  setTrackFilter,
  topTracks,    hasMyEvent,
}: {
  statusFilter:    EventStatusFilter | "my_event";
  setStatusFilter: (s: EventStatusFilter | "my_event") => void;
  trackFilter:     string | null;
  setTrackFilter:  (t: string | null) => void;
  topTracks:       { track: string; eventCount: number }[];
  hasMyEvent:      boolean;
}) {
  const activeCount = (statusFilter !== "all" ? 1 : 0) + (trackFilter !== null ? 1 : 0);
  const statusOptions = hasMyEvent
    ? ALL_STATUS_OPTIONS
    : ALL_STATUS_OPTIONS.filter((o) => o.value !== "my_event");

  const onClear = () => {
    setStatusFilter("all");
    setTrackFilter(null);
  };

  return (
    <aside className="bg-[#10171a] border border-zinc-800 p-4 hud-clipped space-y-4">
      {/* Header & Clear Button */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 font-mono text-xs">
        <span className="font-bold text-white uppercase tracking-wider">
          [ BỘ LỌC TÌM KIẾM ]
        </span>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer font-bold uppercase"
          >
            [ XÓA LỌC ({activeCount}) ]
          </button>
        )}
      </div>

      {/* Status section */}
      <div className="space-y-2 font-mono text-xs">
        <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-bold">
          TRẠNG THÁI:
        </span>
        <div className="space-y-1">
          {statusOptions.map((opt) => {
            const isSelected = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left font-mono text-xs hud-clipped transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <span className="text-xs text-emerald-400 font-bold">[✓]</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Track section */}
      {topTracks.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-zinc-800/60 font-mono text-xs">
          <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-bold">
            HẠNG MỤC ({topTracks.length})
          </span>
          <div className="space-y-1">
            <button
              onClick={() => setTrackFilter(null)}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-left font-mono text-xs hud-clipped transition-all cursor-pointer ${
                !trackFilter
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-bold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent"
              }`}
            >
              <span>[ Tất cả bảng thi ]</span>
            </button>
            {topTracks.map(({ track, eventCount }) => {
              const isSelected = trackFilter === track;
              return (
                <button
                  key={track}
                  onClick={() => setTrackFilter(isSelected ? null : track)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-left font-mono text-xs hud-clipped transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-bold"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent"
                  }`}
                >
                  <span className="truncate pr-1">{track}</span>
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">({eventCount})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── Sort Tabs ────────────────────────────────────────────────────────────────
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
            prizes: [],
            totalPrizeVnd: 0,
          },
          Date.now(),
        )
      : null;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#090e11] text-[#dde4e6] font-sans py-6 px-4 md:px-8 flex flex-col">
      <div className="max-w-7xl w-full mx-auto space-y-6 flex-1 flex flex-col">

        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="font-mono text-[11px] text-emerald-400 font-bold tracking-widest uppercase">
              [ SEAL HACKATHON DIRECTORY ]
            </div>
            <h1 className="font-display font-bold text-2xl text-white uppercase tracking-wider mt-1">
              Khám Phá &amp; Đăng Ký Sự Kiện
            </h1>
            <p className="font-mono text-xs text-zinc-400 mt-1">
              Tra cứu toàn bộ các giải đấu lập trình RBL trên hệ thống SEAL — chọn sự kiện để xem thể lệ và đăng ký tham gia.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-80 font-mono text-xs">
            <input
              type="text"
              placeholder="Tìm kiếm sự kiện hoặc chủ đề..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#10171a] border border-zinc-700 px-3.5 py-2.5 text-white font-mono text-xs hud-clipped placeholder:text-zinc-500 focus:border-emerald-400 outline-none transition-colors"
            />
          </div>
        </div>

        {/* ── Admin Command Center Banner ── */}
        {user && roleName === "Admin" && (
          <div className="p-5 bg-[#10171a] border border-red-500/40 hud-clipped flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="font-mono text-[11px] font-bold text-red-400 uppercase tracking-wider">
                [ TRUNG TÂM ĐIỀU HÀNH QUẢN TRỊ VIÊN ]
              </div>
              <h2 className="font-display text-lg font-bold text-white uppercase">
                Quản Trị Toàn Diện {totalCount} Sự Kiện Hệ Thống
              </h2>
              <p className="font-mono text-xs text-zinc-400">
                Khởi tạo sự kiện mới, chỉ định Event Coordinator và quản lý tài khoản người dùng toàn hệ thống.
              </p>
            </div>

            <Link href="/admin/dashboard" className="shrink-0">
              <button className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs tracking-wider uppercase hud-clipped shadow-md transition-all cursor-pointer">
                [ BẢNG ĐIỀU HÀNH ADMIN &gt; ]
              </button>
            </Link>
          </div>
        )}

        {/* ── User Assigned Event Banner ── */}
        {user && roleName !== "Guest" && roleName !== "Admin" && (
          <div className="p-5 bg-[#10171a] border border-cyan-500/40 hud-clipped flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="font-mono text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                [ SỰ KIỆN CỦA TÔI: {roleName.toUpperCase()} ]
              </div>
              <h2 className="font-display text-lg font-bold text-white uppercase">
                {bannerName || "Sự kiện được phân công"}
              </h2>
              <div className="flex items-center gap-3 font-mono text-xs text-zinc-400">
                <span>Vai trò: <strong className="text-cyan-300">{roleName}</strong></span>
                {bannerStatus && (
                  <>
                    <span>•</span>
                    <span>Trạng thái: <strong className="text-emerald-400">{STATUS_LABEL[bannerStatus]}</strong></span>
                  </>
                )}
              </div>
            </div>

            {myEventId && (
              <Link href={`/events/${myEventId}`} className="shrink-0">
                <button className="px-4 py-2 bg-[#141f23] border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white font-mono font-bold text-xs uppercase hud-clipped transition-all cursor-pointer">
                  [ TRUY CẬP SỰ KIỆN &gt; ]
                </button>
              </Link>
            )}
          </div>
        )}

        {/* ── Main Content Grid (Sidebar + List) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 items-start">
          
          {/* Left Column: Sidebar Filter */}
          <div className="lg:col-span-1">
            <SidebarFilter
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              trackFilter={trackFilter}
              setTrackFilter={setTrackFilter}
              topTracks={topTracks}
              hasMyEvent={!!myEventId}
            />
          </div>

          {/* Right Column: Events List */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Sort bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#10171a] border border-zinc-800 p-3 hud-clipped font-mono text-xs">
              <span className="text-zinc-400">
                HIỂN THỊ <strong className="text-white">{events.length}</strong> / {totalCount} SỰ KIỆN
              </span>

              <div className="flex items-center gap-2">
                <span className="text-zinc-500 uppercase text-[11px]">Sắp xếp:</span>
                <div className="flex flex-wrap gap-1">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSort(opt.value)}
                      className={`px-2.5 py-1 text-[11px] font-bold uppercase transition-all cursor-pointer hud-clipped ${
                        sort === opt.value
                          ? "bg-emerald-500 text-black font-extrabold shadow-sm"
                          : "bg-[#090e11] text-zinc-400 border border-zinc-800 hover:text-white"
                      }`}
                    >
                      [ {opt.label} ]
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List */}
            {events.length === 0 ? (
              <div className="bg-[#10171a] border border-zinc-800 p-12 text-center font-mono text-xs text-zinc-400 hud-clipped space-y-3">
                <span className="text-white font-bold uppercase block">[ KHÔNG TÌM THẤY SỰ KIỆN NÀO PHÙ HỢP ]</span>
                <p className="text-zinc-500 max-w-md mx-auto">
                  Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác để khám phá các giải đấu.
                </p>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase hud-clipped cursor-pointer transition-colors"
                >
                  [ ĐẶT LẠI BỘ LỌC ]
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            )}

          </div>

        </div>

      </div>
    </main>
  );
}
