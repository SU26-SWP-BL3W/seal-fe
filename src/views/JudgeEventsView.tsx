"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useEvents } from "@/repositories/eventsRepository";
import { Link } from "@/i18n/routing";
import { getAssignedEventIdsFromRoles } from "@/lib/eventRoles";
import {
  Scale,
  Calendar,
  Clock,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, Button, Card, EmptyState, Pagination } from "@/components/ui";
import { usePagination } from "@/hooks/usePagination";

type EventTab = "all" | "ongoing" | "upcoming" | "past";

const TAB_OPTIONS: { key: EventTab; label: string; tone?: "judge" | "success" | "info" | "neutral" }[] = [
  { key: "all", label: "Tất cả" },
  { key: "ongoing", label: "Đang diễn ra", tone: "success" },
  { key: "upcoming", label: "Sắp khởi tranh", tone: "info" },
  { key: "past", label: "Đã kết thúc", tone: "neutral" },
];

function eventStatus(now: Date, start: Date | null, end: Date | null) {
  const isPast = Boolean(end && end < now);
  const isUpcoming = Boolean(start && start > now);
  const isOngoing = !isPast && !isUpcoming;
  return { isPast, isUpcoming, isOngoing };
}

export function JudgeEventsView() {
  const { user, activeRole, allEventRoles } = useAuth();
  const { data: rawEvents = [], isLoading } = useEvents();
  const [activeTab, setActiveTab] = useState<EventTab>("all");

  const events = useMemo(() => {
    const list = Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data || [];
    return list;
  }, [rawEvents]);

  const judgeEvents = useMemo(() => {
    if (!user) return [];
    if (user.isAdmin || user.IsAdmin) return events;

    const assignedIds: string[] = getAssignedEventIdsFromRoles(
      allEventRoles.filter((r) => r.roleName === "Judge"),
    );
    if (assignedIds.length === 0) {
      if (Array.isArray((activeRole as any)?.assignedEventIds)) {
        assignedIds.push(...(activeRole as any).assignedEventIds);
      }
      const singleEventId = activeRole?.eventId || (activeRole as any)?.EventId;
      if (singleEventId && !assignedIds.includes(singleEventId)) {
        assignedIds.push(singleEventId);
      }
    }

    if (assignedIds.length > 0) {
      return events.filter((e: any) => assignedIds.includes(e.id || e.Id));
    }

    return [];
  }, [events, user, activeRole, allEventRoles]);

  const categorizedEvents = useMemo(() => {
    const now = new Date();
    const ongoingList: any[] = [];
    const upcomingList: any[] = [];
    const pastList: any[] = [];

    judgeEvents.forEach((evt: any) => {
      const startDate = evt.startDate || evt.StartDate;
      const endDate = evt.endDate || evt.EndDate;
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (end && end < now) {
        pastList.push(evt);
      } else if (start && start > now) {
        upcomingList.push(evt);
      } else {
        ongoingList.push(evt);
      }
    });

    return {
      all: judgeEvents,
      ongoing: ongoingList,
      upcoming: upcomingList,
      past: pastList,
    };
  }, [judgeEvents]);

  const displayedEvents = categorizedEvents[activeTab] || [];

  const {
    paginatedItems: paginatedEvents,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setCurrentPage,
    setPageSize,
  } = usePagination(displayedEvents, 6);

  if (!user) {
    return (
      <PageShell className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <EmptyState
            icon={Scale}
            title="Yêu cầu quyền giám khảo"
            description="Vui lòng đăng nhập với tài khoản Giám khảo để tiếp tục."
            action={
              <Link href="/login">
                <Button accent="judge">Đến trang đăng nhập</Button>
              </Link>
            }
          />
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell className="min-h-[calc(100vh-4rem)] space-y-6">
      <PageHeader
        title="Sự kiện phân công chấm thi"
        description="Danh sách sự kiện bạn được phân công với vai trò Giám khảo."
        actions={
          <>
            <Badge tone="neutral">
              Tổng phân công: <span className="font-semibold">{judgeEvents.length}</span>
            </Badge>
            <Badge tone="judge">Vai trò: Giám khảo</Badge>
          </>
        }
      />

      <Card className="flex flex-col gap-3 border-[var(--accent-judge)]/30 bg-[var(--accent-judge)]/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-judge)]" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Quy định chấm thi ẩn danh
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Toàn bộ bài nộp trong các hạng mục đều được ẩn danh danh tính thí sinh và trường học để đảm bảo tính khách quan.
            </p>
          </div>
        </div>
        <Badge tone="judge" className="shrink-0 self-start sm:self-center">
          Khách quan & bảo mật
        </Badge>
      </Card>

      <div className="flex flex-wrap gap-2 border-b border-[var(--border-muted)] pb-3">
        {TAB_OPTIONS.map(({ key, label }) => {
          const count = categorizedEvents[key].length;
          const isActive = activeTab === key;
          return (
            <Button
              key={key}
              type="button"
              variant={isActive ? "primary" : "secondary"}
              accent="judge"
              className="text-xs"
              onClick={() => setActiveTab(key)}
            >
              {label} ({count})
            </Button>
          );
        })}
      </div>

      {isLoading && (
        <Card className="py-12 text-center">
          <p className="animate-pulse text-sm text-[var(--text-muted)]">
            Đang tải dữ liệu sự kiện phân công…
          </p>
        </Card>
      )}

      {!isLoading && displayedEvents.length === 0 && (
        <EmptyState
          icon={ShieldAlert}
          title={
            activeTab === "all"
              ? "Chưa có sự kiện nào được phân công"
              : "Không có sự kiện nào ở trạng thái này"
          }
          description={
            activeTab === "all"
              ? "Bạn chưa được chỉ định làm Giám khảo trong sự kiện nào. Vui lòng liên hệ Ban Tổ Chức để được cấp quyền."
              : "Hiện tại không có sự kiện nào thuộc danh mục đã chọn."
          }
        />
      )}

      {!isLoading && displayedEvents.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedEvents.map((evt: any) => {
              const eventId = evt.id || evt.Id || "";
              const eventName = evt.eventName || evt.EventName || evt.name || "Sự kiện Hackathon";
              const season = evt.season || evt.Season || "Season 2026";
              const year = evt.year || evt.Year || new Date().getFullYear();
              const startDate = evt.startDate || evt.StartDate;
              const endDate = evt.endDate || evt.EndDate;

              const now = new Date();
              const start = startDate ? new Date(startDate) : null;
              const end = endDate ? new Date(endDate) : null;
              const { isPast, isUpcoming, isOngoing } = eventStatus(now, start, end);

              return (
                <Card
                  key={eventId}
                  className="flex flex-col justify-between gap-4 transition-colors hover:border-[var(--accent-judge)]/40"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-[var(--text-muted)]">
                        {season} · {year}
                      </span>
                      <Badge
                        tone={isOngoing ? "success" : isUpcoming ? "info" : "neutral"}
                        className="gap-1.5"
                      >
                        {isOngoing && (
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-success)]" />
                        )}
                        {isOngoing
                          ? "Đang diễn ra"
                          : isUpcoming
                            ? "Sắp khởi tranh"
                            : "Đã kết thúc"}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="line-clamp-2 font-display text-lg font-semibold text-[var(--text-primary)]">
                        {eventName}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">
                        {evt.description || evt.Description || "Sự kiện thi đấu lập trình và đổi mới sáng tạo SEAL."}
                      </p>
                    </div>

                    <div className="space-y-2 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-3 text-xs">
                      <div className="flex items-center justify-between text-[var(--text-primary)]">
                        <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                          <Calendar className="h-3.5 w-3.5" /> Bắt đầu
                        </span>
                        <span>{startDate ? new Date(startDate).toLocaleDateString("vi-VN") : "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between text-[var(--text-primary)]">
                        <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                          <Clock className="h-3.5 w-3.5" /> Hạn chót
                        </span>
                        <span className="font-medium text-[var(--accent-judge)]">
                          {endDate ? new Date(endDate).toLocaleDateString("vi-VN") : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[var(--border-muted)] pt-4">
                    {isOngoing && (
                      <Link href="/judge/tracks">
                        <Button accent="judge" className="w-full">
                          Vào chấm điểm hạng mục
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    {isUpcoming && (
                      <Link href={`/events/${eventId}`}>
                        <Button variant="secondary" accent="judge" className="w-full">
                          Xem thể lệ & tiêu chí
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    {isPast && (
                      <Link href="/judge/tracks">
                        <Button variant="ghost" accent="judge" className="w-full">
                          Xem lại bảng điểm đã chấm
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="pt-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="sự kiện"
            />
          </div>
        </>
      )}
    </PageShell>
  );
}
