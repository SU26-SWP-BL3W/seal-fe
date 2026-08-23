"use client";

import React from "react";
import { Button, Card, Badge, Input, ApiMissingDataBadge, StatCard, EmptyState, Pagination } from "@/components/ui";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Link } from "@/i18n/routing";
import { ComprehensiveEventEditModal } from "@/components/domain/ComprehensiveEventEditModal";
import { RevokeDraftConfirmModal } from "@/components/domain/RevokeDraftConfirmModal";
import { RefreshCw, Plus } from "lucide-react";
import { useAdminEventsViewModel } from "@/viewModels/admin/useAdminEventsViewModel";

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
  const { state, data, pagination, actions } = useAdminEventsViewModel();

  const {
    searchTerm,
    statusFilter,
    seasonFilter,
    editingEvent,
    revokingEvent,
    isLoading,
    activeCount,
    inactiveCount,
  } = state;

  const { eventsList, filteredEvents, seasons } = data;
  const { paginatedItems: paginatedEvents, currentPage: safePage, totalPages, pageSize: PAGE_SIZE, setCurrentPage } = pagination;

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
            <Button variant="ghost" accent="primary" onClick={() => actions.refetch()}>
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
            <FilterPill active={statusFilter === "all"} onClick={() => actions.setStatusFilter("all")}>
              Tất cả ({eventsList.length})
            </FilterPill>
            <FilterPill active={statusFilter === "active"} onClick={() => actions.setStatusFilter("active")}>
              Hoạt động ({activeCount})
            </FilterPill>
            <FilterPill active={statusFilter === "inactive"} onClick={() => actions.setStatusFilter("inactive")}>
              Tạm dừng ({inactiveCount})
            </FilterPill>
          </div>

          <div className="sm:col-span-4">
            <select
              value={seasonFilter}
              onChange={(e) => actions.setSeasonFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="all">Tất cả mùa giải ({seasons.length})</option>
              {seasons.map((s: any) => (
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
              onChange={(e) => actions.setSearchTerm(e.target.value)}
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
                {paginatedEvents.map((ev: any, idx: number) => {
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
                                actions.setRevokingEvent(ev);
                              } else {
                                actions.setEditingEvent(ev);
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
          <div className="pt-4 border-t border-[var(--border-muted)]">
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={filteredEvents.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemLabel="sự kiện"
            />
          </div>
        )}
      </Card>

      {revokingEvent && (
        <RevokeDraftConfirmModal
          event={revokingEvent}
          onClose={() => actions.setRevokingEvent(null)}
          onConfirmSuccess={(updatedEvent) => {
            actions.refetch();
            actions.setRevokingEvent(null);
            actions.setEditingEvent(updatedEvent);
          }}
        />
      )}

      {editingEvent && (
        <ComprehensiveEventEditModal
          event={editingEvent}
          onClose={() => actions.setEditingEvent(null)}
          onSuccess={() => {
            actions.refetch();
            actions.setEditingEvent(null);
          }}
        />
      )}
    </PageShell>
  );
}

export default AdminEventsView;
