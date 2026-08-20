"use client";

import React, { useState, useMemo } from "react";
import { Button, Card, Badge, Input, ApiMissingDataBadge, StatCard, EmptyState } from "@/components/ui";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useEvents } from "@/repositories/eventsRepository";
import { Link } from "@/i18n/routing";
import { ComprehensiveEventEditModal } from "@/components/domain/ComprehensiveEventEditModal";
import { RevokeDraftConfirmModal } from "@/components/domain/RevokeDraftConfirmModal";
import { RefreshCw, Plus, ChevronLeft, ChevronRight } from "lucide-react";

function pickId(ev: any): string {
  return ev?.id || ev?.Id || ev?.eventId || ev?.EventId || "";
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]"
          : "text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]"
      }`}
    >
      {children}
    </button>
  );
}

export function AdminEventsView() {
  const { data: rawEvents = [], isLoading, refetch } = useEvents();
  const eventsList: any[] = Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data ?? [];

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [seasonFilter, setSeasonFilter] = useState<string>("all");
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [revokingEvent, setRevokingEvent] = useState<any | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  const seasons = useMemo(() => {
    return Array.from(
      new Set(eventsList.map((e) => e.season || e.Season).filter(Boolean))
    );
  }, [eventsList]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (filter: "all" | "active" | "inactive") => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  const handleSeasonFilterChange = (season: string) => {
    setSeasonFilter(season);
    setCurrentPage(1);
  };

  const filteredEvents = useMemo(() => {
    return eventsList.filter((ev) => {
      const isAct = ev.status !== false && ev.Status !== false;
      if (statusFilter === "active" && !isAct) return false;
      if (statusFilter === "inactive" && isAct) return false;

      const s = ev.season || ev.Season;
      if (seasonFilter !== "all" && s !== seasonFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (ev.eventName || ev.EventName || "").toLowerCase();
        const seasonName = (ev.season || ev.Season || "").toLowerCase();
        const id = pickId(ev).toLowerCase();
        return name.includes(q) || seasonName.includes(q) || id.includes(q);
      }
      return true;
    });
  }, [eventsList, statusFilter, seasonFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedEvents = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredEvents.slice(start, start + PAGE_SIZE);
  }, [filteredEvents, safePage]);

  const activeCount = eventsList.filter((e) => e.status !== false && e.Status !== false).length;
  const inactiveCount = eventsList.length - activeCount;

  return (
    <PageShell className="min-h-[calc(100vh-4rem)] space-y-6">
      <PageHeader
        title="Danh sách sự kiện"
        description="Quản trị tập trung các cuộc thi hackathon, phân công trưởng ban điều phối và giám sát tiến độ."
        breadcrumb={
          <nav className="text-xs text-[var(--text-muted)]">
            <Link href="/admin/dashboard" className="hover:text-[var(--accent-primary)]">
              Admin
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-[var(--text-primary)]">Sự kiện</span>
          </nav>
        }
        actions={
          <>
            <Button variant="ghost" accent="primary" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
            <Link href="/admin/events/new">
              <Button variant="primary" accent="primary">
                <Plus className="h-4 w-4" />
                Tạo sự kiện
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Tổng sự kiện" value={eventsList.length} accent="var(--accent-primary)" />
        <StatCard label="Đang hoạt động" value={activeCount} accent="var(--color-success)" />
        <StatCard label="Bản nháp / tạm dừng" value={inactiveCount} accent="var(--text-muted)" />
      </div>

      <Card className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="flex flex-wrap items-center gap-1.5 sm:col-span-4">
            <FilterPill active={statusFilter === "all"} onClick={() => handleStatusFilterChange("all")}>
              Tất cả ({eventsList.length})
            </FilterPill>
            <FilterPill active={statusFilter === "active"} onClick={() => handleStatusFilterChange("active")}>
              Hoạt động ({activeCount})
            </FilterPill>
            <FilterPill active={statusFilter === "inactive"} onClick={() => handleStatusFilterChange("inactive")}>
              Tạm dừng ({inactiveCount})
            </FilterPill>
          </div>

          <div className="sm:col-span-4">
            <select
              value={seasonFilter}
              onChange={(e) => handleSeasonFilterChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="all">Tất cả mùa giải ({seasons.length})</option>
              {seasons.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <Input
              type="search"
              placeholder="Tìm theo tên, mùa giải, ID..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
            Chi tiết sự kiện ({filteredEvents.length})
          </h2>
          <span className="text-xs text-[var(--text-muted)]">Cập nhật từ cơ sở dữ liệu</span>
        </div>

        {isLoading ? (
          <EmptyState
            icon={RefreshCw}
            title="Đang tải sự kiện"
            description="Đang truy vấn danh sách sự kiện..."
          />
        ) : filteredEvents.length === 0 ? (
          <ApiMissingDataBadge
            endpoint="GET /api/Events"
            title="Không tìm thấy sự kiện"
            message="Chưa có sự kiện khớp bộ lọc hoặc hệ thống chưa có dữ liệu."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--border-muted)]">
            <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
              <thead className="border-b border-[var(--border-muted)] bg-[var(--bg-base)]">
                <tr>
                  <th className="w-[26%] px-4 py-3 text-xs font-medium text-[var(--text-muted)]">Tên sự kiện</th>
                  <th className="w-[18%] px-4 py-3 text-xs font-medium text-[var(--text-muted)]">Thời gian</th>
                  <th className="w-[12%] px-4 py-3 text-xs font-medium text-[var(--text-muted)]">Quy mô đội</th>
                  <th className="w-[12%] px-4 py-3 text-center text-xs font-medium text-[var(--text-muted)]">Trạng thái</th>
                  <th className="w-[32%] px-4 py-3 text-right text-xs font-medium text-[var(--text-muted)]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEvents.map((ev, idx) => {
                  const evId = pickId(ev) || `ev-${idx}`;
                  const evName = ev.eventName || ev.EventName || "Sự kiện SEAL";
                  const season = ev.season || ev.Season || "Summer";
                  const year = ev.year || ev.Year || 2026;
                  const startDate = ev.startDate || ev.StartDate;
                  const endDate = ev.endDate || ev.EndDate;
                  const maxTeams = ev.maxTeams || ev.MaxTeams || 50;
                  const teamCount = ev.teamCount || ev.TeamCount || 0;
                  const isActive = ev.status !== false && ev.Status !== false;

                  return (
                    <tr
                      key={evId}
                      className="border-t border-[var(--border-muted)]/60 transition-colors hover:bg-[var(--bg-input)]/50"
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="flex min-w-0 flex-col gap-1 pr-2">
                          <span className="truncate font-medium text-[var(--text-primary)]" title={evName}>
                            {evName}
                          </span>
                          <Badge tone="team">
                            {season} {year}
                          </Badge>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 align-middle text-xs text-[var(--text-muted)]">
                        <div>
                          Bắt đầu: {startDate ? new Date(startDate).toLocaleDateString("vi-VN") : "TBD"}
                        </div>
                        <div>
                          Kết thúc: {endDate ? new Date(endDate).toLocaleDateString("vi-VN") : "TBD"}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 align-middle">
                        <span className="font-medium text-[var(--text-primary)]">{teamCount}</span>
                        <span className="text-[var(--text-muted)]"> / {maxTeams} đội</span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-center align-middle">
                        <Badge tone={isActive ? "success" : "neutral"}>
                          {isActive ? "Hoạt động" : "Tạm dừng"}
                        </Badge>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right align-middle">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5 sm:flex-nowrap">
                          <Button
                            variant="ghost"
                            accent="primary"
                            onClick={() => {
                              if (isActive) {
                                setRevokingEvent(ev);
                              } else {
                                setEditingEvent(ev);
                              }
                            }}
                            className="h-8 px-2.5 text-xs"
                          >
                            Sửa
                          </Button>
                          <Link href={`/admin/events/${evId}`}>
                            <Button variant="ghost" accent="primary" className="h-8 px-2.5 text-xs">
                              Chi tiết
                            </Button>
                          </Link>
                          <Link href={`/admin/events/coordinators?eventId=${evId}`}>
                            <Button variant="ghost" accent="coordinator" className="h-8 px-2.5 text-xs">
                              Phân công EC
                            </Button>
                          </Link>
                          <Link href={`/coordinator/dashboard?eventId=${evId}`}>
                            <Button variant="ghost" accent="coordinator" className="h-8 px-2.5 text-xs">
                              Giám sát
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredEvents.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--border-muted)] pt-4 text-xs text-[var(--text-muted)] sm:flex-row">
            <div>
              Hiển thị{" "}
              <span className="font-medium text-[var(--text-primary)]">
                {(safePage - 1) * PAGE_SIZE + 1}
              </span>
              {" – "}
              <span className="font-medium text-[var(--text-primary)]">
                {Math.min(safePage * PAGE_SIZE, filteredEvents.length)}
              </span>
              {" / "}
              <span className="font-medium text-[var(--accent-primary)]">
                {filteredEvents.length}
              </span>{" "}
              sự kiện (tối đa {PAGE_SIZE}/trang)
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  accent="primary"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="h-8 px-2.5 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Trước
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  if (
                    totalPages > 7 &&
                    p !== 1 &&
                    p !== totalPages &&
                    Math.abs(p - safePage) > 1
                  ) {
                    if (p === 2 || p === totalPages - 1) {
                      return (
                        <span key={p} className="select-none px-1 text-[var(--text-muted)]">
                          …
                        </span>
                      );
                    }
                    return null;
                  }

                  const isActivePage = p === safePage;
                  return (
                    <Button
                      key={p}
                      variant={isActivePage ? "primary" : "ghost"}
                      accent="primary"
                      onClick={() => setCurrentPage(p)}
                      className="h-8 w-8 px-0 text-xs"
                    >
                      {p}
                    </Button>
                  );
                })}

                <Button
                  variant="ghost"
                  accent="primary"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="h-8 px-2.5 text-xs"
                >
                  Sau
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {revokingEvent && (
        <RevokeDraftConfirmModal
          event={revokingEvent}
          onClose={() => setRevokingEvent(null)}
          onConfirmSuccess={(updatedEvent) => {
            refetch();
            setRevokingEvent(null);
            setEditingEvent(updatedEvent);
          }}
        />
      )}

      {editingEvent && (
        <ComprehensiveEventEditModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSuccess={() => {
            refetch();
            setEditingEvent(null);
          }}
        />
      )}
    </PageShell>
  );
}

export default AdminEventsView;
