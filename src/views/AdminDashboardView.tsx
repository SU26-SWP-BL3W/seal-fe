"use client";

import React, { useState, useMemo } from "react";
import { Button, Card, Badge, Input, ApiMissingDataBadge } from "@/components/ui";
import {
  Shield,
  Plus,
  Users,
  School,
  Activity,
  ArrowRight,
  UserCheck,
  Edit,
  ExternalLink,
  RefreshCw,
  Search,
  Grid,
  List,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Link } from "@/i18n/routing";

import { useEvents } from "@/repositories/eventsRepository";
import { useGetUsers } from "@/repositories/usersRepository";
import { useGetSchools } from "@/repositories/schoolsRepository";
import { useGetAllEventsCoordinators } from "@/repositories/staffRepository";
import { ComprehensiveEventEditModal } from "@/components/domain/ComprehensiveEventEditModal";
import { AdminCoordinatorModal } from "@/components/domain/AdminCoordinatorModal";

function HudLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--color-danger)] uppercase font-semibold">
      {children}
    </span>
  );
}

function SectionTitle({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-[var(--border-muted)]">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-4 bg-[var(--color-danger)] inline-block rounded-xs" aria-hidden="true" />
        <h2 className="font-mono text-sm font-bold text-[var(--text-primary)] tracking-widest uppercase flex items-center gap-2">
          {children}
          {typeof count === "number" && (
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-danger)]/15 text-[var(--color-danger)] border border-[var(--color-danger)]/30 font-mono font-bold">
              {count}
            </span>
          )}
        </h2>
      </div>
    </div>
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

  // Filter available ECs
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

  // Filters & State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "has_ec" | "no_ec">("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchEvents(), refetchEcs(), refetchUsers()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Filtered Events
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

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Top Control Header & Breadcrumbs */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-muted)]/50 pb-3">
            <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase">
              <span className="text-[var(--color-danger)] font-bold flex items-center gap-1">
                <Shield className="w-3 h-3" /> ADMIN // EXECUTIVE CONTROL
              </span>
              <span>&gt;</span>
              <span className="text-[var(--text-primary)] font-bold">BẢNG ĐIỀU HÀNH TỔNG QUAN</span>
            </div>

            {/* System Live Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-[rgba(16,185,129,0.1)] border border-[var(--color-success)]/30 text-[var(--color-success)] font-mono text-[10px]">
              <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-ping shrink-0" />
              <span className="font-bold tracking-wider">SYSTEM OPERATIONAL 100%</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-[var(--bg-panel)] p-6 hud-clipped border border-[var(--border-muted)] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--color-danger)]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-1 z-10">
              <HudLabel>// SYSTEM ADMIN OPERATIONS HUB</HudLabel>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-3">
                <div className="p-2 rounded bg-[var(--color-danger)]/15 border border-[var(--color-danger)]/30 text-[var(--color-danger)]">
                  <Shield className="w-7 h-7" />
                </div>
                <span>Bảng Điều Hành Admin Tổng</span>
              </h1>
              <p className="text-xs sm:text-sm font-mono text-[var(--text-muted)] max-w-2xl">
                Trung tâm chỉ huy tối cao: Quản lý sự kiện, phân công Event Coordinator (EC), phê duyệt người dùng và giám sát trường đại học đối tác.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 z-10 shrink-0">
              <Button
                variant="ghost"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="hud-clipped font-mono text-xs border border-[var(--border-muted)] flex items-center gap-2 text-zinc-300 hover:text-white bg-[var(--bg-base)] cursor-pointer"
                title="Cập nhật toàn bộ dữ liệu sự kiện, EC và người dùng"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[var(--color-danger)]" : ""}`} />
                <span>{isRefreshing ? "Đang tải..." : "Làm Mới"}</span>
              </Button>

              <Link href="/admin/users">
                <Button
                  variant="ghost"
                  className="hud-clipped font-mono text-xs border border-[var(--border-muted)] hover:border-[var(--accent-coordinator)] flex items-center gap-2 text-[var(--accent-coordinator)] hover:bg-[var(--accent-coordinator)]/10 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Quản Lý Người Dùng</span>
                </Button>
              </Link>

              <Link href="/admin/schools">
                <Button
                  variant="ghost"
                  className="hud-clipped font-mono text-xs border border-[var(--border-muted)] hover:border-[#2dd4bf] flex items-center gap-2 text-[#2dd4bf] hover:bg-[#2dd4bf]/10 cursor-pointer"
                >
                  <School className="w-3.5 h-3.5" />
                  <span>Trường Học</span>
                </Button>
              </Link>

              <Link href="/admin/events/new">
                <Button variant="primary" className="hud-clipped flex items-center gap-2 bg-[var(--color-danger)] text-white hover:bg-white hover:text-[var(--bg-base)] font-mono text-xs font-bold shadow-lg shadow-[var(--color-danger)]/25 transition-all duration-200 cursor-pointer px-4">
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Tạo Sự Kiện Mới</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Executive Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Metric 1: Total Events */}
          <Card className="p-5 space-y-3 border-l-4 border-l-[var(--color-danger)] bg-[var(--bg-panel)] hud-clipped hover:-translate-y-1 hover:shadow-xl hover:shadow-[var(--color-danger)]/15 transition-all duration-200 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                Tổng Sự Kiện Hệ Thống
              </span>
              <div className="p-2 rounded bg-[var(--color-danger)]/10 text-[var(--color-danger)] group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-3xl sm:text-4xl text-[var(--color-danger)]">
                {displayEvents.length}
              </span>
              <span className="font-mono text-xs text-zinc-400">sự kiện</span>
            </div>
            <div className="pt-2 border-t border-[var(--border-muted)]/40 flex items-center justify-between text-[10px] font-mono">
              <span className="text-[var(--color-success)] flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                Vận hành ổn định
              </span>
              <span className="text-[var(--text-muted)]">SEAL Engine v2</span>
            </div>
          </Card>

          {/* Metric 2: Coordinators */}
          <Card className="p-5 space-y-3 border-l-4 border-l-[var(--accent-coordinator)] bg-[var(--bg-panel)] hud-clipped hover:-translate-y-1 hover:shadow-xl hover:shadow-[var(--accent-coordinator)]/15 transition-all duration-200 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                Event Coordinators (EC)
              </span>
              <div className="p-2 rounded bg-[var(--accent-coordinator)]/10 text-[var(--accent-coordinator)] group-hover:scale-110 transition-transform">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-3xl sm:text-4xl text-[var(--accent-coordinator)]">
                {ecCount}
              </span>
              <span className="font-mono text-xs text-zinc-400">tài khoản EC</span>
            </div>
            <div className="pt-2 border-t border-[var(--border-muted)]/40 flex items-center justify-between text-[10px] font-mono">
              <span className="text-[var(--text-muted)] font-semibold">
                Sẵn sàng gán sự kiện
              </span>
              <span className="text-[var(--accent-coordinator)] font-bold">[EC ROLE]</span>
            </div>
          </Card>

          {/* Metric 3: Total Users */}
          <Link href="/admin/users" className="block group">
            <Card className="p-5 space-y-3 border-l-4 border-l-[var(--accent-judge)] bg-[var(--bg-panel)] hud-clipped hover:-translate-y-1 hover:shadow-xl hover:shadow-[var(--accent-judge)]/15 transition-all duration-200 relative overflow-hidden h-full">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                  Người Dùng Hệ Thống
                </span>
                <div className="p-2 rounded bg-[var(--accent-judge)]/10 text-[var(--accent-judge)] group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono font-bold text-3xl sm:text-4xl text-[var(--accent-judge)]">
                  {totalUsersCount}
                </span>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <div className="pt-2 border-t border-[var(--border-muted)]/40 flex items-center justify-between text-[10px] font-mono">
                <span className="text-[var(--text-muted)] font-semibold">
                  Thí sinh, Giám khảo & EC
                </span>
                <span className="text-[var(--accent-judge)] font-bold hover:underline">Quản Lý &gt;</span>
              </div>
            </Card>
          </Link>

          {/* Metric 4: Universities */}
          <Link href="/admin/schools" className="block group">
            <Card className="p-5 space-y-3 border-l-4 border-l-[#2dd4bf] bg-[var(--bg-panel)] hud-clipped hover:-translate-y-1 hover:shadow-xl hover:shadow-[#2dd4bf]/15 transition-all duration-200 relative overflow-hidden h-full">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                  Trường Đại Học Đối Tác
                </span>
                <div className="p-2 rounded bg-[#2dd4bf]/10 text-[#2dd4bf] group-hover:scale-110 transition-transform">
                  <School className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono font-bold text-3xl sm:text-4xl text-[#2dd4bf]">
                  {totalSchoolsCount}
                </span>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <div className="pt-2 border-t border-[var(--border-muted)]/40 flex items-center justify-between text-[10px] font-mono">
                <span className="text-[var(--text-muted)] font-semibold">
                  Danh mục trường học đối tác
                </span>
                <span className="text-[#2dd4bf] font-bold hover:underline">Xem Danh Sách &gt;</span>
              </div>
            </Card>
          </Link>

        </div>

        {/* Quick Action Operations Deck */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="p-5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-muted)] hover:border-[var(--color-danger)]/50 transition-colors space-y-3 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[var(--color-danger)]/15 border border-[var(--color-danger)]/30 flex items-center justify-center text-[var(--color-danger)] shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-[var(--text-primary)] uppercase group-hover:text-[var(--color-danger)] transition-colors">
                  Khởi Tạo Sự Kiện Mới
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Thiết lập mùa giải, cấu hình vòng thi & thể lệ</p>
              </div>
            </div>
            <Link href="/admin/events/new" className="block">
              <Button variant="ghost" className="w-full font-mono text-xs border border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white transition-all cursor-pointer flex items-center justify-between">
                <span>Tạo Sự Kiện</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="p-5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-muted)] hover:border-[var(--accent-coordinator)]/50 transition-colors space-y-3 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[var(--accent-coordinator)]/15 border border-[var(--accent-coordinator)]/30 flex items-center justify-center text-[var(--accent-coordinator)] shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-[var(--text-primary)] uppercase group-hover:text-[var(--accent-coordinator)] transition-colors">
                  Quản Lý & Duyệt Người Dùng
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Duyệt hồ sơ, phân quyền EC, Giám khảo & Cố vấn</p>
              </div>
            </div>
            <Link href="/admin/users" className="block">
              <Button variant="ghost" className="w-full font-mono text-xs border border-[var(--accent-coordinator)]/40 text-[var(--accent-coordinator)] hover:bg-[var(--accent-coordinator)] hover:text-white transition-all cursor-pointer flex items-center justify-between">
                <span>Mở Trang Duyệt Người Dùng</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="p-5 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-muted)] hover:border-[#2dd4bf]/50 transition-colors space-y-3 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[#2dd4bf]/15 border border-[#2dd4bf]/30 flex items-center justify-center text-[#2dd4bf] shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-[var(--text-primary)] uppercase group-hover:text-[#2dd4bf] transition-colors">
                  Danh Mục Trường Đại Học
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Thêm mới, sửa thông tin & mã các trường đối tác</p>
              </div>
            </div>
            <Link href="/admin/schools" className="block">
              <Button variant="ghost" className="w-full font-mono text-xs border border-[#2dd4bf]/40 text-[#2dd4bf] hover:bg-[#2dd4bf] hover:text-white transition-all cursor-pointer flex items-center justify-between">
                <span>Quản Lý Trường Học</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

        </div>

        {/* All Events Admin Control Deck */}
        <Card className="p-6 space-y-6 bg-[var(--bg-panel)] hud-clipped border border-[var(--border-muted)] shadow-xl">
          
          {/* Section Header & Toolbar Controls */}
          <div className="space-y-4">
            <SectionTitle count={filteredEvents.length}>
              DANH SÁCH TẤT CẢ SỰ KIỆN TRONG HỆ THỐNG
            </SectionTitle>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm sự kiện, mùa giải, năm hoặc EC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs font-mono bg-[var(--bg-base)] border-[var(--border-muted)] focus:border-[var(--color-danger)]"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filters & View Switcher */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Status filter pill group */}
                <div className="flex items-center p-1 bg-[var(--bg-base)] border border-[var(--border-muted)] rounded font-mono text-xs">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                      statusFilter === "all"
                        ? "bg-[var(--color-danger)] text-white font-bold"
                        : "text-[var(--text-muted)] hover:text-white"
                    }`}
                  >
                    Tất Cả ({displayEvents.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter("has_ec")}
                    className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                      statusFilter === "has_ec"
                        ? "bg-[var(--accent-coordinator)] text-white font-bold"
                        : "text-[var(--text-muted)] hover:text-white"
                    }`}
                  >
                    Đã Gán EC
                  </button>
                  <button
                    onClick={() => setStatusFilter("no_ec")}
                    className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                      statusFilter === "no_ec"
                        ? "bg-amber-600 text-white font-bold"
                        : "text-[var(--text-muted)] hover:text-white"
                    }`}
                  >
                    Chưa Gán EC
                  </button>
                </div>

                {/* View switcher */}
                <div className="flex items-center p-1 bg-[var(--bg-base)] border border-[var(--border-muted)] rounded">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-1.5 rounded transition-colors cursor-pointer ${
                      viewMode === "table"
                        ? "bg-[var(--bg-panel)] text-[var(--color-danger)] border border-[var(--border-muted)]"
                        : "text-[var(--text-muted)] hover:text-white"
                    }`}
                    title="Chế độ Bảng"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded transition-colors cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-[var(--bg-panel)] text-[var(--color-danger)] border border-[var(--border-muted)]"
                        : "text-[var(--text-muted)] hover:text-white"
                    }`}
                    title="Chế độ Thẻ (Grid)"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          </div>

          {/* Loading state */}
          {isLoadingEvents ? (
            <div className="p-16 text-center space-y-3 border border-dashed border-[var(--border-muted)] rounded bg-[var(--bg-base)]">
              <RefreshCw className="w-8 h-8 mx-auto text-[var(--color-danger)] animate-spin" />
              <p className="font-mono text-xs text-zinc-400">
                Đang tải danh sách sự kiện toàn hệ thống từ cơ sở dữ liệu...
              </p>
            </div>
          ) : displayEvents.length === 0 ? (
            <ApiMissingDataBadge
              endpoint="GET /api/Events"
              title="CHƯA CÓ SỰ KIỆN TỪ BACKEND DATABASE"
              message="Chưa có bản ghi sự kiện nào được trả về từ Backend API. Vui lòng bấm 'Khởi Tạo Sự Kiện Mới' để tạo sự kiện."
            />
          ) : filteredEvents.length === 0 ? (
            <div className="p-12 text-center space-y-3 border border-[var(--border-muted)] rounded bg-[var(--bg-base)]">
              <SlidersHorizontal className="w-8 h-8 mx-auto text-zinc-500" />
              <p className="font-mono text-xs text-zinc-300">
                Không tìm thấy sự kiện nào phù hợp với bộ lọc & từ khóa &quot;{searchTerm}&quot;.
              </p>
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="font-mono text-xs border border-[var(--border-muted)] text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
              >
                Xóa Bộ Lọc
              </Button>
            </div>
          ) : viewMode === "table" ? (
            
            /* Table View Mode */
            <div className="w-full overflow-x-auto border border-[var(--border-muted)] bg-[var(--bg-panel)] hud-clipped">
              <table className="w-full table-fixed min-w-[980px] text-left border-collapse">
                <thead className="bg-[var(--bg-base)] border-b border-[var(--border-muted)]">
                  <tr>
                    <th className="w-[26%] px-4 py-3.5 text-left font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
                      TÊN SỰ KIỆN & MÃ ID
                    </th>
                    <th className="w-[13%] px-4 py-3.5 text-left font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
                      MÙA GIẢI
                    </th>
                    <th className="w-[12%] px-4 py-3.5 text-left font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
                      VÒNG THI
                    </th>
                    <th className="w-[20%] px-4 py-3.5 text-left font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
                      EVENT COORDINATOR (EC)
                    </th>
                    <th className="w-[10%] px-2 py-3.5 text-center font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
                      TRẠNG THÁI
                    </th>
                    <th className="w-[19%] px-4 py-3.5 text-right font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
                      THAO TÁC
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-muted)]/50">
                  {filteredEvents.map((ev: any, index: number) => {
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
                      <tr key={id} className="hover:bg-[var(--color-danger)]/5 transition-colors group">
                        
                        {/* Name & ID */}
                        <td className="px-4 py-3.5 align-middle">
                          <div className="space-y-0.5 max-w-full">
                            <div className="font-mono font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--color-danger)] transition-colors truncate" title={name}>
                              {name}
                            </div>
                            <div className="font-mono text-[10px] text-zinc-500 truncate" title={id}>
                              ID: {id}
                            </div>
                          </div>
                        </td>

                        {/* Season & Year */}
                        <td className="px-4 py-3.5 align-middle">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold bg-[var(--accent-team)]/10 text-[var(--accent-team)] border border-[var(--accent-team)]/30 rounded" title={`${season} ${year}`}>
                            <Calendar className="w-3 h-3" />
                            {season} {year}
                          </span>
                        </td>

                        {/* Rounds */}
                        <td className="px-4 py-3.5 align-middle">
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--text-primary)] font-semibold">
                            <Layers className="w-3.5 h-3.5 text-zinc-400" />
                            {roundsCount} Vòng Thi
                          </span>
                        </td>

                        {/* Event Coordinator */}
                        <td className="px-4 py-3.5 align-middle">
                          {assignedEcs.length > 0 ? (
                            <div className="flex items-center gap-2 max-w-full" title={ecSummaryTitle}>
                              <div className="w-6 h-6 rounded-full bg-purple-900/60 border border-purple-500/50 flex items-center justify-center text-[10px] font-mono font-bold text-purple-300 shrink-0">
                                {(assignedEcs[0].name || assignedEcs[0].email || "EC").slice(0, 2).toUpperCase()}
                              </div>
                              <span className="font-mono text-xs font-bold text-purple-300 truncate">
                                {assignedEcs[0].name || assignedEcs[0].email}
                              </span>
                              {assignedEcs.length > 1 && (
                                <span className="px-1.5 py-0.5 bg-purple-950/80 text-purple-300 border border-purple-500/50 rounded text-[9px] font-mono shrink-0 font-bold">
                                  +{assignedEcs.length - 1}
                                </span>
                              )}
                            </div>
                          ) : fallbackEc ? (
                            <div className="flex items-center gap-2 max-w-full" title={fallbackEc}>
                              <div className="w-6 h-6 rounded-full bg-purple-900/60 border border-purple-500/50 flex items-center justify-center text-[10px] font-mono font-bold text-purple-300 shrink-0">
                                EC
                              </div>
                              <span className="font-mono text-xs font-bold text-purple-300 truncate">
                                {fallbackEc}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/30 text-amber-400 border border-amber-500/30 font-mono text-[11px] font-semibold">
                              <AlertTriangle className="w-3 h-3" /> Chưa gán EC
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-2 py-3.5 align-middle text-center">
                          <span className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 text-[10px] font-mono font-bold bg-[rgba(16,185,129,0.1)] text-[var(--color-success)] border border-[var(--color-success)]/30 uppercase rounded whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse shrink-0" />
                            ACTIVE
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 align-middle text-right">
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            <Button
                              variant="ghost"
                              onClick={() => setEditingEvent(ev)}
                              className="text-xs font-mono border border-[var(--color-danger)]/60 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/15 px-2.5 py-0.5 h-7 font-bold cursor-pointer inline-flex items-center gap-1"
                              title="Chỉnh sửa toàn diện thông tin sự kiện & các vòng thi"
                            >
                              <Edit className="w-3.5 h-3.5" /> Sửa
                            </Button>

                            <Button
                              variant="ghost"
                              onClick={() => setSelectedEvent(ev)}
                              className="text-xs font-mono border border-[var(--accent-coordinator)]/60 text-[var(--accent-coordinator)] hover:bg-[var(--accent-coordinator)]/15 px-2.5 py-0.5 h-7 font-bold cursor-pointer inline-flex items-center gap-1"
                              title="Quản lý & phân công Event Coordinator (EC)"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Quản lý EC
                            </Button>

                            <Link href={`/events/${id}`}>
                              <Button
                                variant="ghost"
                                className="text-xs font-mono border border-[var(--border-muted)] text-[var(--text-muted)] hover:text-white hover:border-[var(--accent-primary)] px-2 py-0.5 h-7 w-7 flex items-center justify-center cursor-pointer"
                                title="Xem trang thể lệ & thông tin công khai"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
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

            /* Grid Cards View Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((ev: any, index: number) => {
                const id = ev.id || ev.Id || ev.eventId || ev.EventId || `ev-grid-${index}`;
                const name = ev.eventName || ev.EventName || "Sự kiện Hackathon";
                const season = ev.season || ev.Season || "Mùa Hè";
                const year = ev.year || ev.Year || 2026;
                const roundsCount = ev.rounds?.length ?? ev.Rounds?.length ?? 1;

                const assignedEcs = ecMap[id] || [];
                const fallbackEc = ev.coordinatorEmail || ev.CoordinatorEmail;

                return (
                  <Card key={id} className="p-5 space-y-4 bg-[var(--bg-base)] border border-[var(--border-muted)] hover:border-[var(--color-danger)]/50 transition-all hud-clipped flex flex-col justify-between group">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-mono font-bold bg-[var(--accent-team)]/10 text-[var(--accent-team)] border border-[var(--accent-team)]/30 rounded">
                          <Calendar className="w-3 h-3" />
                          {season} {year}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-[rgba(16,185,129,0.1)] text-[var(--color-success)] border border-[var(--color-success)]/30 uppercase rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                          ACTIVE
                        </span>
                      </div>

                      <div>
                        <h3 className="font-mono font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--color-danger)] transition-colors line-clamp-2" title={name}>
                          {name}
                        </h3>
                        <p className="font-mono text-[10px] text-zinc-500 mt-0.5">ID: {id}</p>
                      </div>

                      <div className="pt-2 border-t border-[var(--border-muted)]/40 flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-zinc-400" />
                          {roundsCount} Vòng thi
                        </span>
                      </div>

                      {/* Assigned EC Box */}
                      <div className="p-2.5 rounded bg-[var(--bg-panel)] border border-[var(--border-muted)]/60 space-y-1">
                        <span className="text-[9px] font-mono uppercase text-zinc-500 block font-bold">
                          // EVENT COORDINATOR ASSIGNED
                        </span>
                        {assignedEcs.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-purple-900/80 border border-purple-400/50 flex items-center justify-center text-[9px] font-mono font-bold text-purple-200">
                              {(assignedEcs[0].name || assignedEcs[0].email || "EC").slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-mono text-xs font-bold text-purple-300 truncate">
                              {assignedEcs[0].name || assignedEcs[0].email}
                            </span>
                            {assignedEcs.length > 1 && (
                              <span className="px-1 py-0.2 bg-purple-950 text-purple-300 border border-purple-500/40 rounded text-[9px] font-mono font-bold ml-auto">
                                +{assignedEcs.length - 1} EC
                              </span>
                            )}
                          </div>
                        ) : fallbackEc ? (
                          <span className="font-mono text-xs font-bold text-purple-300 truncate block">
                            {fallbackEc}
                          </span>
                        ) : (
                          <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Chưa phân công EC
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-[var(--border-muted)] flex items-center justify-between gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedEvent(ev)}
                        className="flex-1 text-xs font-mono border border-[var(--accent-coordinator)]/60 text-[var(--accent-coordinator)] hover:bg-[var(--accent-coordinator)]/15 py-1 font-bold cursor-pointer flex items-center justify-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> EC
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => setEditingEvent(ev)}
                        className="flex-1 text-xs font-mono border border-[var(--color-danger)]/60 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/15 py-1 font-bold cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" /> Sửa
                      </Button>

                      <Link href={`/events/${id}`}>
                        <Button
                          variant="ghost"
                          className="text-xs font-mono border border-[var(--border-muted)] text-[var(--text-muted)] hover:text-white px-2 py-1 h-8 w-8 flex items-center justify-center cursor-pointer"
                          title="Xem trang thể lệ"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>

          )}

        </Card>

        {/* Modal Quản lý Event Coordinator (EC) */}
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

        {/* Modal Chỉnh Sửa Toàn Diện Sự Kiện */}
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

      </main>
    </div>
  );
};
