"use client";

import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { useMyTeam } from "@/repositories/teamsRepository";
import { useEventDetail } from "@/repositories/eventsRepository";
import {
  STATUS_LABEL,
  computeEventStatus,
  type EventCardData,
} from "@/viewModels/eventsMetadata";
import {
  useEventsDiscoveryViewModel,
  type EventStatusFilter,
  type EventSortOption,
} from "@/viewModels/useEventsDiscoveryViewModel";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, Button, Input } from "@/components/ui";

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

function EventCard({ event }: { event: EventCardData }) {
  const days = daysLeft(event.endDate);
  const isActive = event.status === "ongoing" || event.status === "registration_open";
  const isEnded = event.status === "ended" || days < 0;

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-5 transition-colors hover:border-[var(--accent-primary)]/40"
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={event.status === "ongoing" ? "info" : event.status === "ended" ? "neutral" : "success"}>
              {STATUS_LABEL[event.status] || "Sự kiện"}
            </Badge>
            {event.season && (
              <span className="text-xs text-[var(--text-muted)]">
                {event.season} {event.year || 2026}
              </span>
            )}
            {isActive && days > 0 && days <= 30 && (
              <span className="text-xs text-[var(--color-warning)]">
                {days <= 0 ? "Hôm nay" : `Còn ${days} ngày`}
              </span>
            )}
          </div>

          <h3 className="truncate font-display text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]">
            {event.eventName}
          </h3>

          <p className="line-clamp-2 text-sm leading-relaxed text-[var(--text-muted)]">
            {event.tagline || event.description || "Cuộc thi lập trình và phát triển sản phẩm công nghệ."}
          </p>

          {event.tracks && event.tracks.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {event.tracks.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-[var(--border-muted)] bg-[var(--bg-input)] px-2 py-0.5 text-xs text-[var(--text-muted)]"
                >
                  {t}
                </span>
              ))}
              {event.tracks.length > 3 && (
                <span className="text-xs text-[var(--text-muted)]">+{event.tracks.length - 3}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-row items-end justify-between gap-4 border-t border-[var(--border-muted)] pt-3 md:min-w-[180px] md:flex-col md:items-end md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <div className="space-y-1 md:text-right">
            <span className="block text-xs text-[var(--text-muted)]">Giải thưởng</span>
            <span className="text-sm font-semibold text-[var(--accent-primary)]">
              {formatVnd(event.totalPrizeVnd ?? 0)}
            </span>
          </div>
          <div className="space-y-1 md:text-right">
            <span className="block text-xs text-[var(--text-muted)]">Thời gian</span>
            <span className="text-xs text-[var(--text-primary)]">
              {formatShortDate(event.startDate)} – {formatShortDate(event.endDate)}
            </span>
          </div>
          <span className="hidden text-xs font-medium text-[var(--accent-primary)] md:block md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
            {isEnded ? "Xem bảng xếp hạng →" : "Chi tiết sự kiện →"}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Zero-Icon Sidebar Filter ─────────────────────────────────────────────────
const ALL_STATUS_OPTIONS: { value: EventStatusFilter | "my_event"; label: string; dot: string }[] = [
  { value: "all",               label: "Tất cả sự kiện",   dot: "bg-[var(--text-muted)]" },
  { value: "my_event",          label: "Sự kiện của tôi",  dot: "bg-[var(--accent-judge)]" },
  { value: "registration_open", label: "Đang mở đăng ký",  dot: "bg-[var(--color-success)]" },
  { value: "ongoing",           label: "Đang diễn ra",     dot: "bg-[var(--accent-primary)]" },
  { value: "upcoming",          label: "Sắp diễn ra",      dot: "bg-[var(--accent-team)]" },
  { value: "ended",             label: "Đã kết thúc",      dot: "bg-[var(--border-muted)]" },
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
    <aside className="space-y-4 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-4">
      <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
        <span className="text-sm font-medium text-[var(--text-primary)]">Bộ lọc</span>
        {activeCount > 0 && (
          <button type="button" onClick={onClear} className="text-xs text-[var(--color-danger)] hover:underline">
            Xóa lọc ({activeCount})
          </button>
        )}
      </div>

      <div className="space-y-2">
        <span className="block text-xs font-medium text-[var(--text-muted)]">Trạng thái</span>
        <div className="space-y-1">
          {statusOptions.map((opt) => {
            const isSelected = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {topTracks.length > 0 && (
        <div className="space-y-2 border-t border-[var(--border-muted)] pt-3">
          <span className="block text-xs font-medium text-[var(--text-muted)]">
            Hạng mục ({topTracks.length})
          </span>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setTrackFilter(null)}
              className={`w-full rounded-md px-3 py-1.5 text-left text-sm ${
                !trackFilter
                  ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-input)]"
              }`}
            >
              Tất cả hạng mục
            </button>
            {topTracks.map(({ track, eventCount }) => {
              const isSelected = trackFilter === track;
              return (
                <button
                  key={track}
                  type="button"
                  onClick={() => setTrackFilter(isSelected ? null : track)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-sm ${
                    isSelected
                      ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--bg-input)]"
                  }`}
                >
                  <span className="truncate pr-1">{track}</span>
                  <span className="text-xs opacity-70">({eventCount})</span>
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
    <PageShell className="min-h-[calc(100vh-4rem)] flex flex-1 flex-col">
      <PageHeader
        title="Khám phá sự kiện"
        description="Tra cứu các giải hackathon trên SEAL — chọn sự kiện để xem thể lệ và đăng ký."
        actions={
          <Input
            type="search"
            placeholder="Tìm kiếm sự kiện..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-72"
          />
        }
      />

      {user && roleName === "Admin" && (
        <div className="mb-6 flex flex-col gap-4 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--bg-panel)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Quản trị {totalCount} sự kiện hệ thống
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Khởi tạo sự kiện, chỉ định coordinator và quản lý người dùng.
            </p>
          </div>
          <Link href="/admin/dashboard">
            <Button accent="primary" variant="secondary" className="border-[var(--color-danger)]/40 text-[var(--color-danger)]">
              Bảng điều hành
            </Button>
          </Link>
        </div>
      )}

      {user && roleName !== "Guest" && roleName !== "Admin" && (
        <div className="mb-6 flex flex-col gap-4 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-[var(--text-muted)]">Sự kiện của tôi · {roleName}</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {bannerName || "Sự kiện được phân công"}
            </p>
            {bannerStatus && (
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Trạng thái: {STATUS_LABEL[bannerStatus]}
              </p>
            )}
          </div>
          {myEventId && (
            <Link href={`/events/${myEventId}`}>
              <Button variant="secondary">Truy cập sự kiện</Button>
            </Link>
          )}
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 items-start gap-6 lg:grid-cols-4">
          
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
            
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-3 text-sm">
              <span className="text-[var(--text-muted)]">
                Hiển thị <strong className="text-[var(--text-primary)]">{events.length}</strong> / {totalCount} sự kiện
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">Sắp xếp:</span>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSort(opt.value)}
                    className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                      sort === opt.value
                        ? "bg-[var(--accent-primary)] text-[var(--bg-base)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {events.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--border-muted)] bg-[var(--bg-panel)] p-12 text-center">
                <p className="font-medium text-[var(--text-primary)]">Không tìm thấy sự kiện phù hợp</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Thử đổi từ khóa hoặc bộ lọc trạng thái.
                </p>
                <Button type="button" variant="secondary" className="mt-4" onClick={handleClear}>
                  Đặt lại bộ lọc
                </Button>
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
    </PageShell>
  );
}
