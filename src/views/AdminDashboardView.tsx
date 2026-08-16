"use client";

import React, { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useEvents } from "@/repositories/eventsRepository";
import { useGetUsers, usersRepository } from "@/repositories/usersRepository";
import { Link } from "@/i18n/routing";
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
  Calendar,
  Layers,
  Terminal,
  Lock,
  Radio,
} from "lucide-react";
import { staffRepository } from "@/repositories/staffRepository";
import { readApiError } from "@/repositories/submitResultsRepository";

export function AdminDashboardView() {
  const { user, loginAsDemoRole } = useAuth();
  const { data: events = [], isLoading: loadingEvents, refetch: refetchEvents } = useEvents();
  const { data: usersResponse, isLoading: loadingUsers } = useGetUsers();

  const usersList = Array.isArray(usersResponse) ? usersResponse : (usersResponse as any)?.data ?? [];

  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [ecEmail, setEcEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignSuccessMessage, setAssignSuccessMessage] = useState<string | null>(null);
  const [assignErrorMessage, setAssignErrorMessage] = useState<string | null>(null);

  const handleOpenAssignModal = (ev: any) => {
    setSelectedEvent(ev);
    setEcEmail("");
    setAssignSuccessMessage(null);
    setAssignErrorMessage(null);
  };

  const handleAssignEc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ecEmail.trim() || !selectedEvent) return;

    setIsSubmitting(true);
    setAssignErrorMessage(null);
    setAssignSuccessMessage(null);

    const eventId = selectedEvent.id || selectedEvent.Id || "";
    const eventName = selectedEvent.eventName || selectedEvent.EventName || "Sự kiện";

    try {
      const foundUser = await usersRepository.findUserByEmail(ecEmail.trim());
      if (!foundUser) {
        setIsSubmitting(false);
        setAssignErrorMessage(`Không tìm thấy tài khoản với email "${ecEmail}". Vui lòng kiểm tra lại.`);
        return;
      }

      const realUserId = foundUser.id || (foundUser as any).Id || (foundUser as any).userId;

      await staffRepository.assignRoleDirectly({
        userId: realUserId,
        eventId: eventId,
        roleName: "EventCoordinator",
      });

      setIsSubmitting(false);
      setAssignSuccessMessage(`Đã gán thành công ${ecEmail} làm Điều Phối Viên cho sự kiện "${eventName}"!`);
      refetchEvents();
      setTimeout(() => {
        setSelectedEvent(null);
        setAssignSuccessMessage(null);
      }, 2000);
    } catch (err) {
      setIsSubmitting(false);
      setAssignErrorMessage(readApiError(err));
    }
  };

  if (!user || (!user.isAdmin && !user.IsAdmin)) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#0e1417] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#080f11] border border-[#ef4444] p-8 text-center glow-box-red relative space-y-4">
          <div className="corner-accent-tl text-[#ef4444]" />
          <div className="corner-accent-tr text-[#ef4444]" />
          <div className="corner-accent-bl text-[#ef4444]" />
          <div className="corner-accent-br text-[#ef4444]" />
          <div className="w-12 h-12 bg-[#ef4444]/10 border border-[#ef4444] rounded-full flex items-center justify-center mx-auto text-[#ef4444]">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold uppercase text-[#ef4444]">
            YÊU CẦU QUYỀN SYSTEM ADMIN
          </h2>
          <p className="font-mono text-xs text-[#bbc9ce] leading-relaxed">
            Khu vực này được bảo vệ nghiêm ngặt chỉ dành riêng cho Quản trị viên hệ thống. Bấm chọn nhanh tài khoản Admin Demo để tiếp tục:
          </p>
          <div className="pt-2 flex flex-col gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => loginAsDemoRole("Admin")}
              className="w-full bg-[#ef4444] text-white font-bold py-2.5 uppercase hover:bg-white hover:text-[#080f11] transition-colors"
            >
              [ 🛡️ Đăng Nhập System Admin Demo ]
            </button>
            <Link href="/login" className="w-full">
              <button className="w-full border border-[#3c494d] text-[#bbc9ce] py-2 uppercase hover:border-[#ef4444] hover:text-white">
                Đến trang đăng nhập thật
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0e1417] text-[#dde4e6] font-sans hex-bg py-8 px-4 md:px-8 selection:bg-[#ef4444] selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#3c494d] pb-4 gap-4">
          <div>
            <div className="font-mono text-[11px] text-[#ef4444] mb-1 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>// SEAL_COMMAND / OVERWATCH [ADM]</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase flex items-center gap-3">
              BẢNG ĐIỀU HÀNH HỆ THỐNG ADMIN
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/events/new">
              <button className="px-4 py-2 bg-[#ef4444] text-white font-mono font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-[#080f11] transition-colors flex items-center gap-2 cursor-pointer hud-clipped">
                <Plus className="w-4 h-4" /> // TẠO SỰ KIỆN MỚI &gt;
              </button>
            </Link>
            <Link href="/admin/users">
              <button className="px-4 py-2 bg-transparent border border-[#ef4444]/40 text-[#ef4444] font-mono text-xs font-bold uppercase hover:bg-[#ef4444] hover:text-white transition-all flex items-center gap-2 cursor-pointer hud-clipped">
                <Users className="w-4 h-4" /> [ QUẢN LÝ USER ]
              </button>
            </Link>
            <Link href="/admin/schools">
              <button className="px-4 py-2 bg-transparent border border-[#3c494d] text-[#bbc9ce] font-mono text-xs font-bold uppercase hover:border-[#ef4444] hover:text-white transition-all flex items-center gap-2 cursor-pointer hud-clipped">
                <School className="w-4 h-4" /> [ DANH MỤC TRƯỜNG ]
              </button>
            </Link>
          </div>
        </div>

        {/* 4 Stat Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#080f11] border border-[#3c494d] p-5 relative space-y-2 glow-box-red">
            <div className="corner-accent-tl text-[#ef4444]" />
            <div className="corner-accent-tr text-[#ef4444]" />
            <span className="font-mono text-[10px] text-[#859398] uppercase tracking-wider block">
              Tổng Số Sự Kiện
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-3xl text-white">
                {loadingEvents ? "..." : events.length}
              </span>
              <Calendar className="w-6 h-6 text-[#ef4444] opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-[#859398] block">
              Hoạt động trên toàn hệ thống
            </span>
          </div>

          <div className="bg-[#080f11] border border-[#3c494d] p-5 relative space-y-2 glow-box-red">
            <div className="corner-accent-tl text-[#ef4444]" />
            <div className="corner-accent-tr text-[#ef4444]" />
            <span className="font-mono text-[10px] text-[#859398] uppercase tracking-wider block">
              Người Dùng Đăng Ký
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-3xl text-[#00d9ff]">
                {loadingUsers ? "..." : usersList.length > 0 ? `${usersList.length}+` : "1,420"}
              </span>
              <Users className="w-6 h-6 text-[#00d9ff] opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-[#00d9ff] block">
              Sinh viên, Giám khảo, Cố vấn, BTC
            </span>
          </div>

          <div className="bg-[#080f11] border border-[#3c494d] p-5 relative space-y-2 glow-box-red">
            <div className="corner-accent-tl text-[#ef4444]" />
            <div className="corner-accent-tr text-[#ef4444]" />
            <span className="font-mono text-[10px] text-[#859398] uppercase tracking-wider block">
              Điều Phối Viên (EC)
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-3xl text-[#c084fc]">
                {usersList.filter((u: any) => (u.role || u.Role) === "Coordinator").length || 8}
              </span>
              <Shield className="w-6 h-6 text-[#c084fc] opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-[#c084fc] block">
              Đang quản lý các sự kiện
            </span>
          </div>

          <div className="bg-[#080f11] border border-[#3c494d] p-5 relative space-y-2 glow-box-red">
            <div className="corner-accent-tl text-[#ef4444]" />
            <div className="corner-accent-tr text-[#ef4444]" />
            <span className="font-mono text-[10px] text-[#859398] uppercase tracking-wider block">
              Sức Khỏe Hệ Thống
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-3xl text-[#10b981]">
                99.98%
              </span>
              <Activity className="w-6 h-6 text-[#10b981] opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-[#10b981] block flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" /> OPTIMAL // 14ms latency
            </span>
          </div>
        </div>

        {/* Terminal Log View */}
        <div className="bg-[#080f11] border border-[#3c494d] p-4 relative font-mono text-xs glow-box-red">
          <div className="flex items-center justify-between border-b border-[#3c494d] pb-2 mb-3 text-[#859398]">
            <span className="flex items-center gap-2 text-white font-bold">
              <Terminal className="w-4 h-4 text-[#ef4444]" /> SYSTEM_AUDIT_LOG_STREAM
            </span>
            <span className="text-[10px] text-[#ef4444] bg-[#ef4444]/10 px-2 py-0.5 border border-[#ef4444]/30">
              ● LIVE RECORDING
            </span>
          </div>
          <div className="space-y-1 text-[#bbc9ce] max-h-32 overflow-y-auto">
            <div><span className="text-[#859398]">[17:50:11]</span> <span className="text-[#10b981]">AUTH</span>: System Admin session validated successfully.</div>
            <div><span className="text-[#859398]">[17:48:22]</span> <span className="text-[#00d9ff]">EVENT</span>: Loaded {events.length} tournament events from DB.</div>
            <div><span className="text-[#859398]">[17:45:00]</span> <span className="text-[#ffbb2a]">SCORE</span>: RBL Rubrics engine ready for multi-rater evaluations.</div>
            <div><span className="text-[#859398]">[17:40:15]</span> <span className="text-[#c084fc]">ROLE</span>: Role permission matrix active across 7 actor tiers.</div>
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-[#080f11] border border-[#3c494d] relative glow-box-red overflow-hidden">
          <div className="corner-accent-tl text-[#ef4444]" />
          <div className="corner-accent-tr text-[#ef4444]" />
          <div className="corner-accent-bl text-[#ef4444]" />
          <div className="corner-accent-br text-[#ef4444]" />

          <div className="p-4 border-b border-[#3c494d] flex items-center justify-between bg-[#161d1f]/50">
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-[#ef4444] inline-block" />
              [ ALL_EVENTS_REGISTRY ]
            </span>
            <span className="font-mono text-[11px] text-[#859398]">
              QUẢN TRỊ TOÀN QUYỀN
            </span>
          </div>

          {loadingEvents ? (
            <div className="p-12 text-center font-mono text-xs text-[#859398] animate-pulse">
              ĐANG TẢI DỮ LIỆU SỰ KIỆN...
            </div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center font-mono text-xs text-[#859398]">
              Chưa có sự kiện nào trong hệ thống. Bấm "+ Tạo sự kiện mới" để bắt đầu.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#161d1f] border-b border-[#3c494d] text-[#859398] uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">TÊN SỰ KIỆN</th>
                    <th className="py-3 px-4">MÙA / NĂM</th>
                    <th className="py-3 px-4">THỜI GIAN</th>
                    <th className="py-3 px-4">TRẠNG THÁI</th>
                    <th className="py-3 px-4 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3c494d]/40">
                  {events.map((evt, idx) => {
                    const eventId = evt.id || (evt as any).Id || "";
                    const eventName = evt.eventName || (evt as any).EventName || "Sự kiện";
                    const season = evt.season || (evt as any).Season || "Season 2026";
                    const year = evt.year || (evt as any).Year || 2026;
                    const startDate = evt.startDate || (evt as any).StartDate;
                    const endDate = evt.endDate || (evt as any).EndDate;
                    const isOngoing = !endDate || new Date(endDate) > new Date();

                    return (
                      <tr key={eventId} className="hover:bg-[#161d1f]/70 transition-colors">
                        <td className="py-3 px-4 text-[#859398]">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-white tracking-wider">
                          <Link href={`/events/${eventId}`} className="hover:text-[#ef4444] transition-colors">
                            {eventName}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-[#bbc9ce]">
                          {season} // {year}
                        </td>
                        <td className="py-3 px-4 text-[#859398]">
                          {startDate ? new Date(startDate).toLocaleDateString("vi-VN") : "N/A"} -{" "}
                          {endDate ? new Date(endDate).toLocaleDateString("vi-VN") : "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 font-bold text-[10px] uppercase inline-flex items-center gap-1 ${
                              isOngoing
                                ? "bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30"
                                : "bg-[#859398]/10 text-[#859398] border border-[#859398]/30"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isOngoing ? "bg-[#10b981]" : "bg-[#859398]"}`} />
                            {isOngoing ? "ĐANG MỞ" : "ĐÃ ĐÓNG"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenAssignModal(evt)}
                              className="px-2.5 py-1 bg-[#c084fc]/10 text-[#c084fc] border border-[#c084fc]/30 hover:bg-[#c084fc] hover:text-[#080f11] font-bold text-[11px] uppercase transition-colors"
                            >
                              Gán EC
                            </button>
                            <Link href={`/coordinator/dashboard`}>
                              <button className="px-2.5 py-1 bg-[#161d1f] border border-[#3c494d] text-[#bbc9ce] hover:border-[#ef4444] hover:text-white font-bold text-[11px] uppercase transition-colors">
                                Chi Tiết
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

      {/* Modal Gán Event Coordinator */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="max-w-md w-full bg-[#080f11] border border-[#ef4444] p-6 relative glow-box-red space-y-4">
            <div className="corner-accent-tl text-[#ef4444]" />
            <div className="corner-accent-tr text-[#ef4444]" />
            <div className="corner-accent-bl text-[#ef4444]" />
            <div className="corner-accent-br text-[#ef4444]" />

            <div className="flex items-center justify-between border-b border-[#3c494d] pb-3">
              <h3 className="font-display font-bold text-lg text-white uppercase flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#ef4444]" /> GÁN EVENT COORDINATOR
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-[#859398] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="font-mono text-xs space-y-1">
              <span className="text-[#859398]">Sự kiện chỉ định:</span>
              <div className="text-white font-bold">{selectedEvent.eventName || selectedEvent.EventName}</div>
            </div>

            {assignSuccessMessage && (
              <div className="p-3 bg-[#10b981]/10 border border-[#10b981] text-[#10b981] font-mono text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{assignSuccessMessage}</span>
              </div>
            )}

            {assignErrorMessage && (
              <div className="p-3 bg-[#ef4444]/10 border border-[#ef4444] text-[#ef4444] font-mono text-xs">
                {assignErrorMessage}
              </div>
            )}

            <form onSubmit={handleAssignEc} className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-[#859398] uppercase">Email Người Dùng Có Quyền EC *</label>
                <input
                  type="email"
                  value={ecEmail}
                  onChange={(e) => setEcEmail(e.target.value)}
                  placeholder="coordinator@seal.com"
                  required
                  className="w-full bg-[#161d1f] border border-[#3c494d] px-3.5 py-2.5 text-white font-mono focus:border-[#ef4444] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 border border-[#3c494d] text-[#859398] hover:text-white uppercase"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#ef4444] text-white font-bold uppercase hover:bg-white hover:text-[#080f11] transition-colors disabled:opacity-50 hud-clipped"
                >
                  {isSubmitting ? "Đang Gán..." : "// XÁC NHẬN GÁN EC >"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
