"use client";

import React from "react";
import { Button, Card, Badge, ApiMissingDataBadge } from "@/components/ui";
import {
  Shield,
  Plus,
  Users,
  School,
  Activity,
  ArrowRight,
  UserCheck,
  Calendar,
  ExternalLink,
  RefreshCw,
  Building2,
  Sliders,
  Eye,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useEvents } from "@/repositories/eventsRepository";
import { useGetUsers } from "@/repositories/usersRepository";
import { useGetSchools } from "@/repositories/schoolsRepository";
import { useGetAllEventsCoordinators } from "@/repositories/staffRepository";

function HudLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--color-danger)] uppercase">
      {children}
    </span>
  );
}

function pickId(ev: any): string {
  return ev?.id || ev?.Id || ev?.eventId || ev?.EventId || "";
}

export function AdminDashboardView() {
  const { data: rawEvents = [], isLoading: isLoadingEvents, refetch: refetchEvents } = useEvents();
  const realEvents: any[] = Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data ?? [];

  const { data: ecMap = {}, refetch: refetchEcs } = useGetAllEventsCoordinators(realEvents);

  const { data: rawUsersData, refetch: refetchUsers } = useGetUsers({ pageSize: 500 });
  const usersList = rawUsersData?.data ?? [];
  const totalUsersCount = rawUsersData?.totalItems ?? usersList.length;

  const { data: schoolsList = [], refetch: refetchSchools } = useGetSchools();
  const totalSchoolsCount = schoolsList.length;

  const availableCoordinators = usersList.filter((u: any) => {
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

  const ecCount = availableCoordinators.length;

  const handleRefreshAll = () => {
    refetchEvents();
    refetchEcs();
    refetchUsers();
    refetchSchools();
  };

  const recentEvents = realEvents.slice(0, 4);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#090e11] text-[#dde4e6] font-sans py-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500 tracking-widest uppercase">
          <span className="text-red-400 font-bold">ADMIN // EXECUTIVE CONTROL</span>
          <span>&gt;</span>
          <span className="text-zinc-300 font-bold">BẢNG ĐIỀU HÀNH TỔNG QUAN</span>
        </div>

        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <div className="font-mono text-[11px] text-amber-400 uppercase tracking-wider mb-1">
              SYSTEM ADMIN OPERATIONS HUB
            </div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-white uppercase tracking-wider flex items-center gap-2.5">
              <Shield className="w-7 h-7 text-red-500" />
              Bảng Điều Hành Admin Tổng
            </h1>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              Trung tâm chỉ huy tối cao: Giám sát toàn hệ thống, quản trị tài khoản, danh mục trường &amp; quản lý sự kiện.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={handleRefreshAll}
              className="px-3.5 py-2 bg-[#141f23] border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-mono text-xs uppercase transition-colors rounded cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Làm Mới
            </button>
            <Link href="/admin/events/new">
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase transition-all shadow-md shadow-red-950/40 rounded cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Tạo Sự Kiện Mới
              </button>
            </Link>
          </div>
        </div>

        {/* 4 KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <Link href="/admin/events" className="block group">
            <div className="p-5 bg-[#0f171c] border border-zinc-800 hover:border-red-500/50 hover:bg-[#141f23] transition-all rounded space-y-2 relative overflow-hidden h-full">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                TỔNG SỰ KIỆN HỆ THỐNG
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-3xl text-red-400">
                  {realEvents.length}
                </span>
                <Calendar className="w-5 h-5 text-red-500/70 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[10px] text-zinc-500 group-hover:text-red-400 flex items-center gap-1 pt-1 transition-colors">
                Xem tất cả sự kiện <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>

          <Link href="/admin/events/coordinators" className="block group">
            <div className="p-5 bg-[#0f171c] border border-zinc-800 hover:border-red-500/50 hover:bg-[#141f23] transition-all rounded space-y-2 relative overflow-hidden h-full">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                EVENT COORDINATORS (EC)
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-3xl text-red-400">
                  {ecCount}
                </span>
                <UserCheck className="w-5 h-5 text-red-500/70 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[10px] text-zinc-500 group-hover:text-red-400 flex items-center gap-1 pt-1 transition-colors">
                Phân công điều phối <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>

          <Link href="/admin/users" className="block group">
            <div className="p-5 bg-[#0f171c] border border-zinc-800 hover:border-red-500/50 hover:bg-[#141f23] transition-all rounded space-y-2 relative overflow-hidden h-full">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                TỔNG NGƯỜI DÙNG
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-3xl text-red-400">
                  {totalUsersCount}
                </span>
                <Users className="w-5 h-5 text-red-500/70 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[10px] text-zinc-500 group-hover:text-red-400 flex items-center gap-1 pt-1 transition-colors">
                Quản lý tài khoản <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>

          <Link href="/admin/schools" className="block group">
            <div className="p-5 bg-[#0f171c] border border-zinc-800 hover:border-red-500/50 hover:bg-[#141f23] transition-all rounded space-y-2 relative overflow-hidden h-full">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                TRƯỜNG ĐẠI HỌC ĐỐI TÁC
              </span>
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-3xl text-red-400">
                  {totalSchoolsCount}
                </span>
                <School className="w-5 h-5 text-red-500/70 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[10px] text-zinc-500 group-hover:text-red-400 flex items-center gap-1 pt-1 transition-colors">
                Danh mục trường ĐH <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        </div>

        {/* Quick Operations Command Hub */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          <Link
            href="/admin/events/new"
            className="p-4 bg-[#0f171c] border border-zinc-800 hover:border-zinc-700 hover:bg-[#141f23] rounded flex items-center gap-3 transition-all group"
          >
            <div className="w-9 h-9 rounded bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:bg-red-600 group-hover:text-white transition-colors shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-white truncate uppercase">Tạo Sự Kiện Mới</div>
              <div className="text-[10px] text-zinc-400 truncate">Thiết lập cuộc thi Hackathon</div>
            </div>
          </Link>

          <Link
            href="/admin/events"
            className="p-4 bg-[#0f171c] border border-zinc-800 hover:border-zinc-700 hover:bg-[#141f23] rounded flex items-center gap-3 transition-all group"
          >
            <div className="w-9 h-9 rounded bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:bg-red-600 group-hover:text-white transition-colors shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-white truncate uppercase">Quản Lý Sự Kiện</div>
              <div className="text-[10px] text-zinc-400 truncate">Danh sách, lọc &amp; can thiệp</div>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="p-4 bg-[#0f171c] border border-zinc-800 hover:border-zinc-700 hover:bg-[#141f23] rounded flex items-center gap-3 transition-all group"
          >
            <div className="w-9 h-9 rounded bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:bg-red-600 group-hover:text-white transition-colors shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-white truncate uppercase">Quản Lý Tài Khoản</div>
              <div className="text-[10px] text-zinc-400 truncate">Phân quyền, duyệt &amp; khóa</div>
            </div>
          </Link>

          <Link
            href="/admin/schools"
            className="p-4 bg-[#0f171c] border border-zinc-800 hover:border-zinc-700 hover:bg-[#141f23] rounded flex items-center gap-3 transition-all group"
          >
            <div className="w-9 h-9 rounded bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:bg-red-600 group-hover:text-white transition-colors shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-white truncate uppercase">Danh Mục Trường ĐH</div>
              <div className="text-[10px] text-zinc-400 truncate">Thêm, sửa trường đại học</div>
            </div>
          </Link>
        </div>

        {/* Recent Events Command Deck */}
        <div className="p-6 bg-[#0f171c] border border-zinc-800 rounded font-mono space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 bg-red-500 inline-block" />
              <h2 className="text-sm font-bold text-white tracking-widest uppercase">
                SỰ KIỆN GẦN ĐÂY // RECENT EVENTS ({recentEvents.length} / {realEvents.length})
              </h2>
            </div>

            <Link href="/admin/events">
              <button
                className="text-xs font-mono text-red-400 hover:text-white bg-red-950/20 hover:bg-red-950/40 border border-red-500/40 px-3 py-1 rounded flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Xem Tất Cả Sự Kiện</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>

          {isLoadingEvents ? (
            <div className="p-12 text-center text-xs text-zinc-400 animate-pulse">
              Đang tải dữ liệu sự kiện gần đây...
            </div>
          ) : realEvents.length === 0 ? (
            <ApiMissingDataBadge
              endpoint="GET /api/Events"
              title="CHƯA CÓ SỰ KIỆN NÀO"
              message="Chưa có bản ghi sự kiện nào trong hệ thống. Bấm 'Tạo Sự Kiện Mới' để bắt đầu."
            />
          ) : (
            <div className="w-full overflow-x-auto border border-zinc-800 bg-[#090e11] rounded">
              <table className="w-full table-fixed min-w-[850px] text-left border-collapse text-xs">
                <thead className="bg-[#0c1216] border-b border-zinc-800 text-zinc-400">
                  <tr>
                    <th className="w-[35%] px-4 py-3 text-left uppercase">TÊN SỰ KIỆN</th>
                    <th className="w-[18%] px-4 py-3 text-left uppercase">MÙA GIẢI</th>
                    <th className="w-[22%] px-4 py-3 text-left uppercase">COORDINATOR PHỤ TRÁCH</th>
                    <th className="w-[12%] px-4 py-3 text-center uppercase">TRẠNG THÁI</th>
                    <th className="w-[13%] px-4 py-3 text-right uppercase">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((ev: any, idx: number) => {
                    const id = pickId(ev) || `ev-${idx}`;
                    const name = ev.eventName || ev.EventName || "Sự kiện SEAL";
                    const season = ev.season || ev.Season || "Summer";
                    const year = ev.year || ev.Year || 2026;
                    const assignedEcs = ecMap[id] || [];
                    const ecLabel =
                      assignedEcs.length > 0
                        ? assignedEcs[0].name || assignedEcs[0].email
                        : ev.coordinatorEmail || "Chưa gán EC";
                    const isActive = ev.status !== false && ev.Status !== false;

                    return (
                      <tr
                        key={id}
                        className="hover:bg-white/[0.03] transition-colors border-t border-zinc-800/60"
                      >
                        <td className="px-4 py-3 font-bold text-white truncate" title={name}>
                          {name}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-red-950/40 text-red-300 border border-red-500/30 rounded">
                            {season} {year}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-purple-300 truncate" title={ecLabel}>
                          {assignedEcs.length > 0 ? `👤 ${ecLabel}` : <span className="text-zinc-500 italic">Chưa gán EC</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                              isActive
                                ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/40"
                                : "bg-zinc-800/50 text-zinc-400 border border-zinc-700"
                            }`}
                          >
                            {isActive ? "● MỞ" : "○ ĐÓNG"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/admin/events/${id}`}>
                              <button
                                className="text-[10px] font-mono border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer bg-[#141f23]"
                              >
                                <Eye className="w-3 h-3" /> Chi Tiết
                              </button>
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
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardView;
