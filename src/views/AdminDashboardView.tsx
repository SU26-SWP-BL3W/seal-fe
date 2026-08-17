"use client";

import React, { useState } from "react";
import { Button, Card, Badge, Table, Input } from "@/components/ui";
import type { EventItem } from "@/viewModels/eventsMetadata";
import { staffRepository } from "@/repositories/staffRepository";
import { ShieldAlert, Plus, Users, School, Activity, ArrowRight, Shield, UserCheck, X, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { useEvents } from "@/repositories/eventsRepository";
import { usersRepository } from "@/repositories/usersRepository";

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
  const { data: rawEvents = [] } = useEvents();
  const realEvents = Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data ?? [];

  const displayEvents = realEvents;

  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [ecEmail, setEcEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignSuccessMessage, setAssignSuccessMessage] = useState<string | null>(null);

  const handleOpenAssignModal = (ev: EventItem) => {
    setSelectedEvent(ev);
    setEcEmail("");
    setAssignSuccessMessage(null);
  };

  const handleAssignEc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ecEmail.trim() || !selectedEvent) return;

    setIsSubmitting(true);
    const eventId = selectedEvent.id || selectedEvent.Id || selectedEvent.eventId || selectedEvent.EventId || "";
    const eventName = selectedEvent.eventName || selectedEvent.EventName || "Sự kiện";

    const foundUser = await usersRepository.findUserByEmail(ecEmail.trim());
    if (!foundUser) {
      setIsSubmitting(false);
      alert(`Không tìm thấy tài khoản người dùng với email "${ecEmail}". Vui lòng kiểm tra lại chính tả.`);
      return;
    }

    const realUserId = foundUser.id || (foundUser as any).Id || (foundUser as any).userId || (foundUser as any).UserId;

    try {
      const res = await staffRepository.assignRoleDirectly({
        userId: realUserId,
        eventId: eventId,
        roleName: "EventCoordinator",
      });
      setIsSubmitting(false);

      if (res && res.success !== false) {
        setAssignSuccessMessage(`Đã phân công ${ecEmail} làm Event Coordinator cho sự kiện "${eventName}" thành công!`);
        setTimeout(() => {
          setSelectedEvent(null);
          setAssignSuccessMessage(null);
        }, 2000);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      const msg = err.response?.data?.message || err.message || "Phân công vai trò thất bại. Vui lòng kiểm tra quyền Admin.";
      alert(`Lỗi phân công EC: ${msg}`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-6 py-8 space-y-6">
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-muted)] pb-6">
          <div>
            <HudLabel>// SYSTEM ADMIN OPERATIONS HUB</HudLabel>
            <h1 className="font-display font-bold text-3xl text-[var(--color-danger)] uppercase tracking-wider mt-1">
              Bảng Điều Hành Admin Tổng
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
              Dành riêng cho System Admin: Khởi tạo sự kiện toàn hệ thống & phân công Event Coordinator quản lý.
            </p>
          </div>

          <Link href="/admin/events/new">
            <Button variant="primary" className="hud-clipped flex items-center gap-2 bg-[var(--color-danger)] text-white hover:bg-white hover:text-[var(--bg-base)] font-mono text-xs font-bold">
              <Plus className="w-4 h-4" /> Tạo Sự Kiện Mới
            </Button>
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 space-y-2 border-l-4 border-l-[var(--color-danger)] bg-[var(--bg-panel)] hud-clipped">
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
              Tổng Sự Kiện Hệ Thống
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-2xl text-[var(--color-danger)]">
                {displayEvents.length}
              </span>
              <Shield className="w-5 h-5 text-[var(--color-danger)] opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-[var(--color-success)] block">
              ● {displayEvents.length} Sự kiện active trên hệ thống
            </span>
          </Card>

          <Card className="p-5 space-y-2 border-l-4 border-l-[var(--accent-coordinator)] bg-[var(--bg-panel)] hud-clipped">
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
              Event Coordinators (EC)
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-2xl text-[var(--accent-coordinator)]">
                12
              </span>
              <Users className="w-5 h-5 text-[var(--accent-coordinator)] opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-[var(--text-muted)] block">
              Đã được gán phụ trách các mùa giải
            </span>
          </Card>

          <Card className="p-5 space-y-2 border-l-4 border-l-[var(--accent-judge)] bg-[var(--bg-panel)] hud-clipped">
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
              Tổng Người Dùng Hệ Thống
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-2xl text-[var(--accent-judge)]">
                1,450
              </span>
              <Activity className="w-5 h-5 text-[var(--accent-judge)] opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-[var(--text-muted)] block">
              Sinh viên, Giám khảo & Cố vấn
            </span>
          </Card>

          <Card className="p-5 space-y-2 border-l-4 border-l-[#2dd4bf] bg-[var(--bg-panel)] hud-clipped">
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
              Trường Đại Học Đăng Ký
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-2xl text-[#2dd4bf]">
                18
              </span>
              <School className="w-5 h-5 text-[#2dd4bf] opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-[var(--text-muted)] block">
              FPTU, HUST, VNU, UIT, HCMUT...
            </span>
          </Card>
        </div>

        {/* All Events Admin Table */}
        <Card className="p-6 space-y-4 bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)]">
          <SectionTitle>DANH SÁCH TẤT CẢ SỰ KIỆN TRONG HỆ THỐNG ({displayEvents.length})</SectionTitle>

          {displayEvents.length === 0 ? (
            <ApiMissingDataBadge
              endpoint="GET /api/Events"
              title="CHƯA CÓ SỰ KIỆN TỪ BACKEND DATABASE"
              message="Chưa có bản ghi sự kiện nào được trả về từ Backend API. Vui lòng bấm 'Khởi Tạo Sự Kiện Mới' để tạo sự kiện."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <th>MÃ EVENT / TÊN SỰ KIỆN</th>
                    <th>MÙA GIẢI</th>
                    <th>SỐ VÒNG THI</th>
                    <th>EVENT COORDINATOR PHỤ TRÁCH</th>
                    <th>TRẠNG THÁI</th>
                    <th className="text-center">THAO TÁC ADMIN</th>
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
                      <tr key={id}>
                        <td>
                          <div className="font-mono font-bold text-sm text-[var(--text-primary)]">{name}</div>
                          <div className="font-mono text-[10px] text-[var(--color-danger)] font-bold">ID: #{id}</div>
                        </td>
                        <td>
                          <Badge tone="team">{season} {year}</Badge>
                        </td>
                        <td>
                          <span className="font-mono text-xs text-[var(--text-primary)]">
                            {roundsCount} Vòng Thi
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-xs text-[var(--accent-coordinator)] font-bold">
                            EC. {ecInfo}
                          </span>
                        </td>
                        <td>
                          <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-[rgba(16,185,129,0.1)] text-[var(--color-success)] border border-[var(--color-success)]/20 uppercase">
                            ACTIVE
                          </span>
                        </td>
                        <td className="text-center">
                          <Button
                            variant="ghost"
                            onClick={() => handleOpenAssignModal(ev)}
                            className="text-xs font-mono border-[var(--accent-coordinator)] text-[var(--accent-coordinator)] hover:bg-[var(--accent-coordinator)]/10"
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Gán EC
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card>

        {/* Modal Gán Event Coordinator Dành Cho Admin */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fade-in">
            <Card className="w-full max-w-lg p-6 bg-[var(--bg-panel)] border border-[var(--accent-coordinator)] space-y-4 relative hud-clipped">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[var(--accent-coordinator)]" />
                  Phân Công Event Coordinator (EC)
                </h3>
                <p className="font-mono text-xs text-[var(--text-muted)]">
                  Chỉ định tài khoản Điều Phối Viên phụ trách quản lý & cấu hình sự kiện{" "}
                  <span className="text-[var(--accent-primary)] font-bold">"{selectedEvent.eventName}"</span>.
                </p>
              </div>

              {assignSuccessMessage ? (
                <div className="p-4 bg-[rgba(16,185,129,0.1)] border border-[var(--color-success)] text-[var(--color-success)] font-mono text-xs hud-clipped flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />
                  <span>{assignSuccessMessage}</span>
                </div>
              ) : (
                <form onSubmit={handleAssignEc} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                      Email Tài Khoản Event Coordinator *
                    </label>
                    <Input
                      type="email"
                      placeholder="e.g. ec.coordinator@seal.edu.vn"
                      value={ecEmail}
                      onChange={(e) => setEcEmail(e.target.value)}
                      className="w-full text-xs font-mono"
                      required
                    />
                  </div>

                  <div className="p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped space-y-1">
                    <span className="font-mono text-[10px] text-[var(--accent-coordinator)] uppercase block font-bold">
                      Ghi chú phân quyền hệ thống:
                    </span>
                    <p className="font-mono text-[10px] text-[var(--text-muted)]">
                      Admin chỉ định EC quản lý sự kiện này. Tài khoản EC được gán sẽ thấy sự kiện xuất hiện trên Bảng điều hành EC của họ để cấu hình Vòng thi (Rounds), Hạng mục (Tracks) & Tiêu chí.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" type="button" onClick={() => setSelectedEvent(null)}>
                      Hủy Bỏ
                    </Button>
                    <Button variant="primary" accent="coordinator" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Đang xử lý..." : "// XÁC NHẬN GÁN EC >"}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};
