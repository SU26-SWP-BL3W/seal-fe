"use client";

import React from "react";
import { Button, Input, Card } from "@/components/ui";
import { Shield, Calendar, Info, ArrowLeft, CheckCircle2, UserCheck } from "lucide-react";
import Link from "next/link";
import { useAdminCreateEventViewModel } from "@/viewModels/admin/useAdminCreateEventViewModel";

export const AdminCreateEventView: React.FC = () => {
  const { state, actions } = useAdminCreateEventViewModel();
  const { form, isSubmitting, errorMessage, successEventId } = state;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-muted)] border-b border-[var(--border-muted)] pb-4">
          <Link href="/admin/dashboard" className="hover:text-[var(--color-danger)] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Bảng Điều Hành Admin
          </Link>
          <span>/</span>
          <span className="text-[var(--color-danger)] font-bold">STT #1: Khởi Tạo Sự Kiện (Admin Only)</span>
        </div>

        <Card className="hud-glow-cyan p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-4">
            <div>
              <h2 className="font-display font-bold text-xl text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-6 h-6 text-[var(--color-danger)]" />
                Admin Khởi Tạo Sự Kiện Mới (POST /api/Events)
              </h2>
              <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
                Tạo Khung Sự Kiện Chính và chỉ định Event Coordinator (Trưởng Ban Tổ Chức) phụ trách điều phối sự kiện.
              </p>
            </div>
            <span className="px-3 py-1 font-mono text-xs bg-[rgba(239,68,68,0.1)] text-[var(--color-danger)] border border-[var(--color-danger)]/30 hud-clipped font-bold">
              [ADM-ACTION ONLY]
            </span>
          </div>

          {errorMessage && (
            <div className="p-4 bg-[rgba(239,68,68,0.1)] border border-[var(--color-danger)] text-[var(--color-danger)] font-mono text-xs hud-clipped">
              {errorMessage}
            </div>
          )}

          {successEventId ? (
            <div className="p-6 bg-[rgba(16,185,129,0.1)] border border-[var(--color-success)] hud-clipped space-y-4 text-center">
              <div className="flex justify-center">
                <CheckCircle2 className="w-12 h-12 text-[var(--color-success)]" />
              </div>
              <h3 className="font-mono font-bold text-lg text-[var(--color-success)] uppercase">
                Khởi Tạo Sự Kiện Thành Công!
              </h3>
              <p className="font-mono text-xs text-[var(--text-primary)]">
                Mã Sự Kiện vừa tạo: <span className="text-[var(--accent-primary)] font-bold">#{successEventId}</span>
                {form.coordinatorEmail && (
                  <span className="block text-[var(--accent-coordinator)] font-mono text-xs mt-1">
                    Đã phân công Event Coordinator: {form.coordinatorEmail}
                  </span>
                )}
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-4">
                <Link href="/admin/dashboard">
                  <Button variant="primary" className="font-mono text-xs bg-[var(--color-danger)]">
                    Về Bảng Điều Hành Admin Tổng &gt;
                  </Button>
                </Link>
                <Link href="/coordinator/dashboard">
                  <Button variant="secondary" className="font-mono text-xs border-[var(--accent-coordinator)] text-[var(--accent-coordinator)]">
                    Sang Bảng EC Dashboard &gt;
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={actions.handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                    Tên Sự Kiện <span className="text-[var(--color-danger)]">*</span>
                  </label>
                  <Input
                    type="text"
                    value={form.eventName}
                    onChange={(e) => actions.setForm({ ...form, eventName: e.target.value })}
                    required
                  />
                </div>

                {/* Chỉ định Event Coordinator */}
                <div className="md:col-span-2 space-y-1.5 p-4 bg-[var(--bg-input)] border border-[var(--accent-coordinator)]/30 hud-clipped">
                  <label className="text-xs font-mono tracking-widest text-[var(--accent-coordinator)] uppercase flex items-center gap-1.5 font-bold">
                    <UserCheck className="w-4 h-4 text-[var(--accent-coordinator)]" />
                    Chỉ Định Event Coordinator (EC) Phụ Trách Quản Lý
                  </label>
                  <Input
                    type="email"
                    placeholder="e.g. ec.coordinator@seal.edu.vn"
                    value={form.coordinatorEmail}
                    onChange={(e) => actions.setForm({ ...form, coordinatorEmail: e.target.value })}
                    className="w-full"
                  />
                  <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1">
                    Admin có thể gán ngay tài khoản EC hoặc bỏ trống để gán sau trên Admin Dashboard. Tài khoản EC này sẽ phụ trách tạo Vòng thi (Rounds), Hạng mục (Tracks) &amp; Tiêu chí.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                    Mùa Giải (Season) *
                  </label>
                  <select
                    value={form.season}
                    onChange={(e) => actions.setForm({ ...form, season: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-sm hud-clipped"
                  >
                    <option value="Mùa Xuân">Mùa Xuân (Spring)</option>
                    <option value="Mùa Hè">Mùa Hè (Summer)</option>
                    <option value="Mùa Thu">Mùa Thu (Autumn)</option>
                    <option value="Mùa Đông">Mùa Đông (Winter)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                    Năm (Year) *
                  </label>
                  <Input
                    type="number"
                    value={form.year}
                    onChange={(e) => actions.setForm({ ...form, year: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    Ngày Bắt Đầu Sự Kiện *
                  </label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => actions.setForm({ ...form, startDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    Ngày Kết Thúc Sự Kiện *
                  </label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => actions.setForm({ ...form, endDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                    Ngày Mở Cổng Đăng Ký
                  </label>
                  <Input
                    type="date"
                    value={form.registrationStartDate}
                    onChange={(e) => actions.setForm({ ...form, registrationStartDate: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                    Ngày Đóng Cổng Đăng Ký
                  </label>
                  <Input
                    type="date"
                    value={form.registrationEndDate}
                    onChange={(e) => actions.setForm({ ...form, registrationEndDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono tracking-widest text-[var(--accent-team)] uppercase font-bold">
                    Số Thành Viên Tối Thiểu / Đội *
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={form.maxTeamSize}
                    value={form.minTeamSize}
                    onChange={(e) => actions.setForm({ ...form, minTeamSize: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono tracking-widest text-[var(--accent-team)] uppercase font-bold">
                    Số Thành Viên Tối Đa / Đội *
                  </label>
                  <Input
                    type="number"
                    min={form.minTeamSize}
                    max={20}
                    value={form.maxTeamSize}
                    onChange={(e) => actions.setForm({ ...form, maxTeamSize: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                    Mô Tả Tổng Quan Sự Kiện
                  </label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => actions.setForm({ ...form, description: e.target.value })}
                    className="w-full p-4 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-sm hud-clipped"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-muted)]">
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
                  <Info className="w-4 h-4 text-[var(--color-danger)]" />
                  <span>Chỉ System Admin mới có nút bấm khởi tạo này.</span>
                </div>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Đang tạo event & gán EC..." : "Xác Nhận Tạo Sự Kiện"}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </main>
    </div>
  );
};
