"use client";

import React, { useState } from "react";
import { Button, Card, Badge, Table, Input } from "@/components/ui";
import type { EventItem } from "@/viewModels/eventsMetadata";
import type { User } from "@/models/entities";
import { staffRepository } from "@/repositories/staffRepository";
import {
  ShieldAlert,
  Plus,
  Users,
  School,
  Activity,
  ArrowRight,
  Shield,
  UserCheck,
  X,
  CheckCircle2,
  Edit,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Link } from "@/i18n/routing";

import { useEvents } from "@/repositories/eventsRepository";
import { usersRepository, useGetUsers } from "@/repositories/usersRepository";
import { useGetSchools } from "@/repositories/schoolsRepository";
import { ComprehensiveEventEditModal } from "@/components/domain/ComprehensiveEventEditModal";
import { AdminCoordinatorModal } from "@/components/domain/AdminCoordinatorModal";

import { ApiMissingDataBadge } from "@/components/ui";

function HudLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--color-danger)] uppercase">
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-muted)]">
      <span className="w-1.5 h-4 bg-[var(--color-danger)] inline-block" aria-hidden="true" />
      <h2 className="font-mono text-sm font-bold text-[var(--text-primary)] tracking-widest uppercase">
        {children}
      </h2>
    </div>
  );
}

export const AdminDashboardView: React.FC = () => {
  const { data: rawEvents = [], isLoading: isLoadingEvents, refetch: refetchEvents } = useEvents();
  const realEvents = Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data ?? [];
  const displayEvents = realEvents;

  const { data: rawUsersData } = useGetUsers({ pageSize: 500 });
  const usersList = rawUsersData?.data ?? [];
  const totalUsersCount = rawUsersData?.totalItems ?? usersList.length;

  const { data: schoolsList = [] } = useGetSchools();
  const totalSchoolsCount = schoolsList.length;

  const availableCoordinators = usersList.filter((u: any) => {
    const em = (u.email || u.Email || "").toLowerCase();
    const role = (u.roleName || u.RoleName || "").toLowerCase();
    const isAdmin = Boolean(u.isAdmin || u.IsAdmin || em.includes("admin") || role.includes("admin"));
    if (isAdmin) return false;

    // Sinh viên / Thí sinh không được phép gán làm EC
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

  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-6 py-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase">
          <span className="text-[var(--color-danger)] font-bold">ADMIN // EXECUTIVE CONTROL</span>
          <span>&gt;</span>
          <span className="text-[var(--text-primary)] font-bold">BẢNG ĐIỀU HÀNH TỔNG QUAN</span>
        </div>

        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-muted)] pb-6">
          <div>
            <HudLabel>// SYSTEM ADMIN OPERATIONS HUB</HudLabel>
            <h1 className="font-display font-bold text-3xl text-[var(--color-danger)] uppercase tracking-wider mt-1 flex items-center gap-2.5">
              <Shield className="w-7 h-7 text-[var(--color-danger)]" />
              Bảng Điều Hành Admin Tổng
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
              Trung tâm chỉ huy tối cao: Giám sát toàn hệ thống, khởi tạo sự kiện & chỉ định Event Coordinator.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <Button
              variant="ghost"
              onClick={() => refetchEvents()}
              className="hud-clipped font-mono text-xs border border-[var(--border-muted)] flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Làm Mới
            </Button>
            <Link href="/admin/events/new">
              <Button variant="primary" className="hud-clipped flex items-center gap-2 bg-[var(--color-danger)] text-white hover:bg-white hover:text-[var(--bg-base)] font-mono text-xs font-bold shadow-lg shadow-[var(--color-danger)]/20 transition-all duration-200 cursor-pointer">
                <Plus className="w-4 h-4" /> Tạo Sự Kiện Mới
              </Button>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 space-y-2 border-l-4 border-l-[var(--color-danger)] bg-[var(--bg-panel)] hud-clipped hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[var(--color-danger)]/10 transition-all duration-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-danger)]/5 rounded-full blur-xl pointer-events-none group-hover:bg-[var(--color-danger)]/10 transition-colors" />
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
              Tổng Sự Kiện Hệ Thống
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-3xl text-[var(--color-danger)]">
                {displayEvents.length}
              </span>
              <Shield className="w-5 h-5 text-[var(--color-danger)] opacity-70 group-hover:scale-110 transition-transform" />
            </div>
            <span className="font-mono text-[10px] text-[var(--color-success)] flex items-center gap-1.5 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
              {displayEvents.length} Sự kiện đang vận hành
            </span>
          </Card>

          <Card className="p-5 space-y-2 border-l-4 border-l-[var(--accent-coordinator)] bg-[var(--bg-panel)] hud-clipped hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[var(--accent-coordinator)]/10 transition-all duration-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent-coordinator)]/5 rounded-full blur-xl pointer-events-none group-hover:bg-[var(--accent-coordinator)]/10 transition-colors" />
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
              Event Coordinators (EC)
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-3xl text-[var(--accent-coordinator)]">
                {ecCount}
              </span>
              <Users className="w-5 h-5 text-[var(--accent-coordinator)] opacity-70 group-hover:scale-110 transition-transform" />
            </div>
            <span className="font-mono text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-coordinator)]" />
              Tài khoản điều phối sự kiện
            </span>
          </Card>

          <Card className="p-5 space-y-2 border-l-4 border-l-[var(--accent-judge)] bg-[var(--bg-panel)] hud-clipped hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[var(--accent-judge)]/10 transition-all duration-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent-judge)]/5 rounded-full blur-xl pointer-events-none group-hover:bg-[var(--accent-judge)]/10 transition-colors" />
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
              Tổng Người Dùng Hệ Thống
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-3xl text-[var(--accent-judge)]">
                {totalUsersCount}
              </span>
              <Activity className="w-5 h-5 text-[var(--accent-judge)] opacity-70 group-hover:scale-110 transition-transform" />
            </div>
            <span className="font-mono text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-judge)]" />
              Sinh viên, Giám khảo & Cố vấn
            </span>
          </Card>

          <Card className="p-5 space-y-2 border-l-4 border-l-[#2dd4bf] bg-[var(--bg-panel)] hud-clipped hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#2dd4bf]/10 transition-all duration-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#2dd4bf]/5 rounded-full blur-xl pointer-events-none group-hover:bg-[#2dd4bf]/10 transition-colors" />
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
              Trường Đại Học Đối Tác
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-3xl text-[#2dd4bf]">
                {totalSchoolsCount}
              </span>
              <School className="w-5 h-5 text-[#2dd4bf] opacity-70 group-hover:scale-110 transition-transform" />
            </div>
            <span className="font-mono text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf]" />
              Danh mục trường đại học đối tác
            </span>
          </Card>
        </div>

        {/* All Events Admin Table */}
        <Card className="p-6 space-y-4 bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)]">
          <div className="flex items-center justify-between">
            <SectionTitle>DANH SÁCH TẤT CẢ SỰ KIỆN TRONG HỆ THỐNG ({displayEvents.length})</SectionTitle>
          </div>

          {isLoadingEvents ? (
            <div className="p-12 text-center font-mono text-xs text-zinc-400 animate-pulse">
              Đang tải danh sách sự kiện toàn hệ thống...
            </div>
          ) : displayEvents.length === 0 ? (
            <ApiMissingDataBadge
              endpoint="GET /api/Events"
              title="CHƯA CÓ SỰ KIỆN TỪ BACKEND DATABASE"
              message="Chưa có bản ghi sự kiện nào được trả về từ Backend API. Vui lòng bấm 'Khởi Tạo Sự Kiện Mới' để tạo sự kiện."
            />
          ) : (
            <div className="w-full overflow-x-auto border border-[var(--border-muted)] bg-[var(--bg-panel)] hud-clipped">
              <table className="w-full table-fixed min-w-[950px] text-left border-collapse">
                <thead className="bg-[var(--bg-base)] border-b border-[var(--border-muted)]">
                  <tr>
                    <th className="w-[25%] px-4 py-3.5 text-left font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
                      TÊN SỰ KIỆN
                    </th>
                    <th className="w-[13%] px-4 py-3.5 text-left font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
                      MÙA GIẢI
                    </th>
                    <th className="w-[10%] px-4 py-3.5 text-left font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
                      SỐ VÒNG
                    </th>
                    <th className="w-[16%] px-4 py-3.5 text-left font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
                      EVENT COORDINATOR
                    </th>
                    <th className="w-[10%] px-2 py-3.5 text-center font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
                      TRẠNG THÁI
                    </th>
                    <th className="w-[26%] px-4 py-3.5 text-right font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
                      THAO TÁC
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayEvents.map((ev: any, index: number) => {
                    const id = ev.id || ev.Id || ev.eventId || ev.EventId || `ev-admin-${index}`;
                    const name = ev.eventName || ev.EventName || "Sự kiện Hackathon";
                    const season = ev.season || ev.Season || "Mùa Hè";
                    const year = ev.year || ev.Year || 2026;
                    const roundsCount = ev.rounds?.length ?? ev.Rounds?.length ?? 1;
                    const ecInfo = ev.coordinatorEmail || ev.CoordinatorEmail || "Chưa gán EC";

                    return (
                      <tr key={id} className="hover:bg-[var(--color-danger)]/5 transition-colors group">
                        <td className="px-4 py-3.5 align-middle border-t border-[var(--border-muted)]/50">
                          <div className="font-mono font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--color-danger)] transition-colors truncate" title={name}>
                            {name}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-middle border-t border-[var(--border-muted)]/50">
                          <span className="inline-block max-w-full truncate px-2.5 py-1 text-xs font-mono font-bold bg-[var(--accent-team)]/10 text-[var(--accent-team)] border border-[var(--accent-team)]/30 rounded" title={`${season} ${year}`}>
                            {season} {year}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 align-middle border-t border-[var(--border-muted)]/50">
                          <span className="font-mono text-xs text-[var(--text-primary)]">
                            {roundsCount} Vòng Thi
                          </span>
                        </td>
                        <td className="px-4 py-3.5 align-middle border-t border-[var(--border-muted)]/50">
                          <span className="font-mono text-xs text-[var(--accent-coordinator)] font-bold truncate block" title={ecInfo}>
                            {ecInfo}
                          </span>
                        </td>
                        <td className="px-2 py-3.5 align-middle border-t border-[var(--border-muted)]/50 text-center">
                          <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-[rgba(16,185,129,0.1)] text-[var(--color-success)] border border-[var(--color-success)]/20 uppercase rounded whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse shrink-0" />
                            ACTIVE
                          </span>
                        </td>
                        <td className="px-4 py-3.5 align-middle border-t border-[var(--border-muted)]/50 text-right">
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            <Button
                              variant="ghost"
                              onClick={() => setEditingEvent(ev)}
                              className="text-xs font-mono border-[var(--color-danger)]/60 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 px-2.5 py-0.5 h-7 font-bold cursor-pointer inline-flex items-center gap-1"
                              title="Chỉnh sửa toàn diện sự kiện & các vòng thi"
                            >
                              <Edit className="w-3.5 h-3.5" /> Sửa
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => setSelectedEvent(ev)}
                              className="text-xs font-mono border-[var(--accent-coordinator)] text-[var(--accent-coordinator)] hover:bg-[var(--accent-coordinator)]/10 px-2.5 py-0.5 h-7 cursor-pointer inline-flex items-center gap-1"
                              title="Quản lý & phân công Event Coordinator"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Quản lý EC
                            </Button>
                            <Link href={`/events/${id}`}>
                              <Button
                                variant="ghost"
                                className="text-xs font-mono border-[var(--border-muted)] text-[var(--text-muted)] hover:text-white hover:border-[var(--accent-primary)] px-2 py-0.5 h-7 w-7 flex items-center justify-center cursor-pointer"
                                title="Xem trang thể lệ công khai"
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
          )}
        </Card>

        {/* Trung Tâm Quản Lý & Phân Công Event Coordinator (EC HUB) */}
        {selectedEvent && (
          <AdminCoordinatorModal
            event={selectedEvent}
            allUsers={usersList}
            onClose={() => setSelectedEvent(null)}
            onSuccess={() => {
              refetchEvents();
            }}
          />
        )}

        {/* Modal Chỉnh Sửa Toàn Diện Sự Kiện Cho Admin */}
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
