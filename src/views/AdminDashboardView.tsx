"use client";

import React, { useState, useMemo } from "react";
import { Button, Card, Badge, Input, ApiMissingDataBadge, StatCard, EmptyState } from "@/components/ui";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Plus,
  Users,
  School,
  UserCheck,
  Edit,
  ExternalLink,
  RefreshCw,
  Search,
  Grid,
  List,
  Calendar,
  Layers,
  AlertTriangle,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "@/i18n/routing";

import { useEvents } from "@/repositories/eventsRepository";
import { useGetUsers } from "@/repositories/usersRepository";
import { useGetSchools } from "@/repositories/schoolsRepository";
import { useGetAllEventsCoordinators } from "@/repositories/staffRepository";
import { ComprehensiveEventEditModal } from "@/components/domain/ComprehensiveEventEditModal";
import { AdminCoordinatorModal } from "@/components/domain/AdminCoordinatorModal";

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

export const AdminDashboardView: React.FC = () => {
  const { data: rawEvents = [], isLoading: isLoadingEvents, refetch: refetchEvents } = useEvents();
  const realEvents = Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data ?? [];
  const displayEvents = realEvents;

  const { data: ecMap = {}, refetch: refetchEcs } = useGetAllEventsCoordinators(displayEvents);

  const { data: rawUsersData, refetch: refetchUsers } = useGetUsers({ pageSize: 500 });
  const usersList = rawUsersData?.data ?? [];
  const totalUsersCount = rawUsersData?.totalItems ?? usersList.length;

  const { data: schoolsList = [] } = useGetSchools();
  const totalSchoolsCount = schoolsList.length;

  const availableCoordinators = useMemo(() => {
    return usersList.filter((u: any) => {
      const em = (u.email || u.Email || "").toLowerCase();
      const role = (u.roleName || u.RoleName || "").toLowerCase();
      const isAdmin = Boolean(u.isAdmin || u.IsAdmin || em.includes("admin") || role.includes("admin"));
      if (isAdmin) return false;

      const isStudent = Boolean(u.isStudent || u.IsStudent || u.studentCode || u.StudentCode);
      if (isStudent) return false;

      return (
        role.includes("coordinator") ||
        role.includes("coodinator") ||
        em.includes("coordinator") ||
        em.includes("ec.") ||
        em.includes("ec_") ||
        em.includes("ec@") ||
        em.startsWith("ec")
      );
    });
  }, [usersList]);

  const ecCount = availableCoordinators.length;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "has_ec" | "no_ec">("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchEvents(), refetchEcs(), refetchUsers()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredEvents = useMemo(() => {
    return displayEvents.filter((ev: any) => {
      const id = ev.id || ev.Id || ev.eventId || ev.EventId || "";
      const name = (ev.eventName || ev.EventName || "").toLowerCase();
      const season = (ev.season || ev.Season || "").toLowerCase();
      const year = String(ev.year || ev.Year || "");

      const assignedEcs = ecMap[id] || [];
      const ecNames = assignedEcs.map((x: any) => (x.name || x.email || "").toLowerCase()).join(" ");
      const fallbackEc = (ev.coordinatorEmail || ev.CoordinatorEmail || "").toLowerCase();

      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        name.includes(query) ||
        season.includes(query) ||
        year.includes(query) ||
        ecNames.includes(query) ||
        fallbackEc.includes(query);

      let matchesStatus = true;
      if (statusFilter === "no_ec") {
        matchesStatus = assignedEcs.length === 0 && !fallbackEc;
      } else if (statusFilter === "has_ec") {
        matchesStatus = assignedEcs.length > 0 || Boolean(fallbackEc);
      }

      return matchesSearch && matchesStatus;
    });
  }, [displayEvents, searchTerm, statusFilter, ecMap]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedEvents = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredEvents.slice(start, start + PAGE_SIZE);
  }, [filteredEvents, safePage]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (filter: "all" | "has_ec" | "no_ec") => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  return (
    <PageShell className="min-h-[calc(100vh-4rem)] space-y-6">
      <PageHeader
        title="Bảng điều hành admin"
        description="Quản lý sự kiện, phân công event coordinator, phê duyệt người dùng và giám sát trường đại học đối tác."
        breadcrumb={
          <nav className="text-xs text-[var(--text-muted)]">
            <Link href="/admin/dashboard" className="hover:text-[var(--accent-primary)]">
              Admin
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-[var(--text-primary)]">Tổng quan</span>
          </nav>
        }
        actions={
          <>
            <Button
              variant="ghost"
              accent="primary"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Đang tải..." : "Làm mới"}
            </Button>
            <Link href="/admin/users">
              <Button variant="secondary" accent="coordinator">
                <Users className="h-4 w-4" />
                Người dùng
              </Button>
            </Link>
            <Link href="/admin/schools">
              <Button variant="secondary" accent="primary">
                <School className="h-4 w-4" />
                Trường học
              </Button>
            </Link>
            <Link href="/admin/events/new">
              <Button variant="primary" accent="primary">
                <Plus className="h-4 w-4" />
                Tạo sự kiện
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng sự kiện"
          value={displayEvents.length}
          subtext="Đang vận hành trên hệ thống"
          accent="var(--accent-primary)"
        />
        <StatCard
          label="Event coordinators"
          value={ecCount}
          subtext="Sẵn sàng gán sự kiện"
          accent="var(--accent-coordinator)"
        />
        <Link href="/admin/users" className="block">
          <StatCard
            label="Người dùng"
            value={totalUsersCount}
            subtext="Thí sinh, giám khảo và EC"
            accent="var(--accent-judge)"
          />
        </Link>
        <Link href="/admin/schools" className="block">
          <StatCard
            label="Trường đại học"
            value={totalSchoolsCount}
            subtext="Danh mục trường đối tác"
            accent="var(--color-success)"
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="flex flex-col gap-3 p-5">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Khởi tạo sự kiện mới</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Thiết lập mùa giải, cấu hình vòng thi và thể lệ.</p>
          </div>
          <Link href="/admin/events/new">
            <Button variant="secondary" accent="primary" className="w-full">
              Tạo sự kiện
            </Button>
          </Link>
        </Card>
        <Card className="flex flex-col gap-3 p-5">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Quản lý người dùng</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Duyệt hồ sơ, phân quyền EC, giám khảo và cố vấn.</p>
          </div>
          <Link href="/admin/users">
            <Button variant="secondary" accent="coordinator" className="w-full">
              Mở trang duyệt
            </Button>
          </Link>
        </Card>
        <Card className="flex flex-col gap-3 p-5">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Danh mục trường học</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Thêm mới, sửa thông tin và mã các trường đối tác.</p>
          </div>
          <Link href="/admin/schools">
            <Button variant="secondary" accent="primary" className="w-full">
              Quản lý trường
            </Button>
          </Link>
        </Card>
      </div>

      <Card className="space-y-5 p-6">
        <div className="flex flex-col gap-4 border-b border-[var(--border-muted)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
              Tất cả sự kiện
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {filteredEvents.length} / {displayEvents.length} sự kiện
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                type="text"
                placeholder="Tìm sự kiện, mùa giải, EC..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-base)] p-1">
              <FilterPill active={statusFilter === "all"} onClick={() => handleStatusFilterChange("all")}>
                Tất cả ({displayEvents.length})
              </FilterPill>
              <FilterPill active={statusFilter === "has_ec"} onClick={() => handleStatusFilterChange("has_ec")}>
                Đã gán EC
              </FilterPill>
              <FilterPill active={statusFilter === "no_ec"} onClick={() => handleStatusFilterChange("no_ec")}>
                Chưa gán EC
              </FilterPill>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-base)] p-1">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === "table"
                    ? "bg-[var(--bg-panel)] text-[var(--accent-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
                title="Chế độ bảng"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === "grid"
                    ? "bg-[var(--bg-panel)] text-[var(--accent-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
                title="Chế độ thẻ"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {isLoadingEvents ? (
          <EmptyState
            icon={RefreshCw}
            title="Đang tải sự kiện"
            description="Đang truy vấn danh sách sự kiện từ cơ sở dữ liệu..."
          />
        ) : displayEvents.length === 0 ? (
          <ApiMissingDataBadge
            endpoint="GET /api/Events"
            title="Chưa có sự kiện nào"
            message="Hệ thống chưa có sự kiện. Bấm 'Tạo sự kiện' để bắt đầu."
          />
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            icon={SlidersHorizontal}
            title="Không tìm thấy sự kiện"
            description={`Không có sự kiện phù hợp với bộ lọc và từ khóa "${searchTerm}".`}
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  handleSearchChange("");
                  handleStatusFilterChange("all");
                }}
              >
                Xóa bộ lọc
              </Button>
            }
          />
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto rounded-lg border border-[var(--border-muted)]">
            <table className="w-full min-w-[1060px] table-fixed border-collapse text-left text-sm">
              <thead className="border-b border-[var(--border-muted)] bg-[var(--bg-base)]">
                <tr>
                  <th className="w-[23%] px-4 py-3 text-xs font-medium text-[var(--text-muted)]">Tên sự kiện</th>
                  <th className="w-[12%] px-4 py-3 text-xs font-medium text-[var(--text-muted)]">Mùa giải</th>
                  <th className="w-[10%] px-4 py-3 text-xs font-medium text-[var(--text-muted)]">Vòng thi</th>
                  <th className="w-[18%] px-4 py-3 text-xs font-medium text-[var(--text-muted)]">Event coordinator</th>
                  <th className="w-[12%] px-2 py-3 text-center text-xs font-medium text-[var(--text-muted)]">Trạng thái</th>
                  <th className="w-[25%] px-4 py-3 text-right text-xs font-medium text-[var(--text-muted)]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-muted)]/50">
                {paginatedEvents.map((ev: any, index: number) => {
                  const id = ev.id || ev.Id || ev.eventId || ev.EventId || `ev-admin-${index}`;
                  const name = ev.eventName || ev.EventName || "Sự kiện Hackathon";
                  const season = ev.season || ev.Season || "Mùa Hè";
                  const year = ev.year || ev.Year || 2026;
                  const roundsCount = ev.rounds?.length ?? ev.Rounds?.length ?? 1;

                  const assignedEcs = ecMap[id] || [];
                  const fallbackEc = ev.coordinatorEmail || ev.CoordinatorEmail;
                  const ecSummaryTitle =
                    assignedEcs.length > 0
                      ? assignedEcs.map((x: any) => (x.name ? `${x.name} (${x.email})` : x.email)).join(", ")
                      : fallbackEc || "Chưa gán EC";

                  return (
                    <tr key={id} className="transition-colors hover:bg-[var(--bg-input)]/50">
                      <td className="px-4 py-3 align-middle">
                        <div className="max-w-full space-y-0.5">
                          <div className="truncate text-sm font-medium text-[var(--text-primary)]" title={name}>
                            {name}
                          </div>
                          <div className="truncate text-xs text-[var(--text-muted)]" title={id}>
                            ID: {id}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <Badge tone="team">
                          <Calendar className="h-3 w-3" />
                          {season} {year}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-primary)]">
                          <Layers className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                          {roundsCount} vòng
                        </span>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        {assignedEcs.length > 0 ? (
                          <div className="flex max-w-full items-center gap-2" title={ecSummaryTitle}>
                            <span className="truncate text-sm text-[var(--text-primary)]">
                              {assignedEcs[0].name || assignedEcs[0].email}
                            </span>
                            {assignedEcs.length > 1 && (
                              <Badge tone="coordinator">+{assignedEcs.length - 1}</Badge>
                            )}
                          </div>
                        ) : fallbackEc ? (
                          <span className="truncate text-sm text-[var(--text-primary)]" title={fallbackEc}>
                            {fallbackEc}
                          </span>
                        ) : (
                          <Badge tone="warning">
                            <AlertTriangle className="h-3 w-3" />
                            Chưa gán EC
                          </Badge>
                        )}
                      </td>

                      <td className="px-2 py-3 text-center align-middle">
                        <Badge tone="success">Hoạt động</Badge>
                      </td>

                      <td className="px-4 py-3 text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            accent="primary"
                            onClick={() => setEditingEvent(ev)}
                            className="h-8 px-2.5 text-xs"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Sửa
                          </Button>
                          <Button
                            variant="ghost"
                            accent="coordinator"
                            onClick={() => setSelectedEvent(ev)}
                            className="h-8 px-2.5 text-xs"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            EC
                          </Button>
                          <Link href={`/events/${id}`}>
                            <Button variant="ghost" accent="primary" className="h-8 w-8 p-0">
                              <ExternalLink className="h-3.5 w-3.5" />
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
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedEvents.map((ev: any, index: number) => {
              const id = ev.id || ev.Id || ev.eventId || ev.EventId || `ev-grid-${index}`;
              const name = ev.eventName || ev.EventName || "Sự kiện Hackathon";
              const season = ev.season || ev.Season || "Mùa Hè";
              const year = ev.year || ev.Year || 2026;
              const roundsCount = ev.rounds?.length ?? ev.Rounds?.length ?? 1;

              const assignedEcs = ecMap[id] || [];
              const fallbackEc = ev.coordinatorEmail || ev.CoordinatorEmail;

              return (
                <Card key={id} className="flex flex-col justify-between gap-4 p-5">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge tone="team">
                        <Calendar className="h-3 w-3" />
                        {season} {year}
                      </Badge>
                      <Badge tone="success">Hoạt động</Badge>
                    </div>

                    <div>
                      <h3 className="line-clamp-2 text-base font-semibold text-[var(--text-primary)]" title={name}>
                        {name}
                      </h3>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">ID: {id}</p>
                    </div>

                    <div className="flex items-center gap-1.5 border-t border-[var(--border-muted)]/40 pt-2 text-xs text-[var(--text-muted)]">
                      <Layers className="h-3.5 w-3.5" />
                      {roundsCount} vòng thi
                    </div>

                    <div className="space-y-1 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-base)] p-3">
                      <span className="text-xs font-medium text-[var(--text-muted)]">Event coordinator</span>
                      {assignedEcs.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm text-[var(--text-primary)]">
                            {assignedEcs[0].name || assignedEcs[0].email}
                          </span>
                          {assignedEcs.length > 1 && (
                            <Badge tone="coordinator">+{assignedEcs.length - 1}</Badge>
                          )}
                        </div>
                      ) : fallbackEc ? (
                        <span className="block truncate text-sm text-[var(--text-primary)]">{fallbackEc}</span>
                      ) : (
                        <Badge tone="warning">
                          <AlertTriangle className="h-3 w-3" />
                          Chưa phân công
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-[var(--border-muted)] pt-3">
                    <Button
                      variant="ghost"
                      accent="coordinator"
                      onClick={() => setSelectedEvent(ev)}
                      className="flex-1 text-xs"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      EC
                    </Button>
                    <Button
                      variant="ghost"
                      accent="primary"
                      onClick={() => setEditingEvent(ev)}
                      className="flex-1 text-xs"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Sửa
                    </Button>
                    <Link href={`/events/${id}`}>
                      <Button variant="ghost" accent="primary" className="h-8 w-8 p-0">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
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

      {selectedEvent && (
        <AdminCoordinatorModal
          event={selectedEvent}
          allUsers={usersList}
          onClose={() => setSelectedEvent(null)}
          onSuccess={() => {
            refetchEvents();
            refetchEcs();
          }}
        />
      )}

      {editingEvent && (
        <ComprehensiveEventEditModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSuccess={() => {
            refetchEvents();
            setEditingEvent(null);
          }}
        />
      )}
    </PageShell>
  );
};
