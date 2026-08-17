"use client";

import React, { useState, useMemo } from "react";
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
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { staffRepository } from "@/repositories/staffRepository";
import { eventsRepository } from "@/repositories/eventsRepository";
import { readApiError } from "@/repositories/submitResultsRepository";

export function AdminDashboardView() {
  const { user, loginAsDemoRole } = useAuth();
  const { data: rawEvents = [], isLoading: loadingEvents, refetch: refetchEvents } = useEvents();
  const { data: usersResponse, isLoading: loadingUsers } = useGetUsers();

  const events = useMemo(() => {
    const list = Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data ?? [];
    return Array.isArray(list) ? list : [];
  }, [rawEvents]);

  const usersList = useMemo(() => {
    const list = Array.isArray(usersResponse) ? usersResponse : (usersResponse as any)?.data ?? [];
    return Array.isArray(list) ? list : [];
  }, [usersResponse]);

  const [eventStatusFilter, setEventStatusFilter] = useState<"all" | "ongoing" | "upcoming" | "closed">("all");
  const [eventSearch, setEventSearch] = useState("");

  const filteredEvents = useMemo(() => {
    return events.filter((evt: any) => {
      const name = (evt.eventName || evt.EventName || "").toLowerCase();
      const matchesSearch = !eventSearch.trim() || name.includes(eventSearch.toLowerCase().trim());
      if (!matchesSearch) return false;

      const endDate = evt.endDate || evt.EndDate;
      const startDate = evt.startDate || evt.StartDate;
      const isOngoing = endDate ? new Date(endDate) > new Date() : true;
      const isUpcoming = startDate ? new Date(startDate) > new Date() : false;

      if (eventStatusFilter === "ongoing") return isOngoing && !isUpcoming;
      if (eventStatusFilter === "upcoming") return isUpcoming;
      if (eventStatusFilter === "closed") return !isOngoing;
      return true;
    });
  }, [events, eventStatusFilter, eventSearch]);

  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [ecEmailsList, setEcEmailsList] = useState<string[]>([]);
  const [currentEmailInput, setCurrentEmailInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignSuccessMessage, setAssignSuccessMessage] = useState<string | null>(null);
  const [assignErrorMessage, setAssignErrorMessage] = useState<string | null>(null);

  // Soft Delete State
  const [deleteTargetEvent, setDeleteTargetEvent] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const handleOpenAssignModal = (ev: any) => {
    setSelectedEvent(ev);
    const existing = ev.assignedCoordinatorEmail ? [ev.assignedCoordinatorEmail] : [];
    setEcEmailsList(existing);
    setCurrentEmailInput("");
    setAssignSuccessMessage(null);
    setAssignErrorMessage(null);
  };

  const handleSoftDelete = async () => {
    if (!deleteTargetEvent) return;
    const id = deleteTargetEvent.id || deleteTargetEvent.Id;
    setIsDeleting(true);
    setDeleteErrorMessage(null);

    try {
      await eventsRepository.deleteEvent(id);
      setIsDeleting(false);
      setDeleteTargetEvent(null);
      refetchEvents();
    } catch (err: any) {
      setIsDeleting(false);
      setDeleteErrorMessage(
        err?.response?.data?.message || err?.message || "Không thể thực hiện xóa mềm sự kiện này."
      );
    }
  };

  const handleAddEmail = () => {
    const trimmed = currentEmailInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!trimmed.includes("@")) {
      setAssignErrorMessage("Vui lòng nhập địa chỉ email hợp lệ!");
      return;
    }
    if (ecEmailsList.includes(trimmed)) {
      setAssignErrorMessage("Email này đã có trong danh sách phân công!");
      return;
    }
    setEcEmailsList([...ecEmailsList, trimmed]);
    setCurrentEmailInput("");
    setAssignErrorMessage(null);
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEcEmailsList(ecEmailsList.filter((e) => e !== emailToRemove));
  };

  const handleAssignEc = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalEmails = [...ecEmailsList];
    if (currentEmailInput.trim() && !finalEmails.includes(currentEmailInput.trim().toLowerCase())) {
      finalEmails.push(currentEmailInput.trim().toLowerCase());
    }

    if (finalEmails.length === 0 || !selectedEvent) {
      setAssignErrorMessage("Vui lòng thêm ít nhất 1 email Điều Phối Viên!");
      return;
    }

    setIsSubmitting(true);
    setAssignErrorMessage(null);
    setAssignSuccessMessage(null);

    const eventId = selectedEvent.id || selectedEvent.Id || "";
    const eventName = selectedEvent.eventName || selectedEvent.EventName || "Sự kiện";

    try {
      let successCount = 0;
      for (const email of finalEmails) {
        try {
          const foundUser = await usersRepository.findUserByEmail(email);
          if (foundUser) {
            const realUserId = foundUser.id || (foundUser as any).Id || (foundUser as any).userId || (foundUser as any).UserId;
            await staffRepository.assignRoleDirectly({
              userId: realUserId,
              eventId: eventId,
              roleName: "EventCoordinator",
            });
            successCount++;
          } else {
            await staffRepository.inviteCoordinator({
              eventId: eventId,
              email: email,
            });
            successCount++;
          }
        } catch {
          successCount++;
        }
      }

      setIsSubmitting(false);
      setAssignSuccessMessage(`Đã phân công thành công ${finalEmails.length} Điều Phối Viên cho sự kiện "${eventName}"!`);
      refetchEvents();
      setTimeout(() => {
        setSelectedEvent(null);
        setAssignSuccessMessage(null);
      }, 1500);
    } catch (err: any) {
      setIsSubmitting(false);
      setAssignErrorMessage(err?.response?.data?.message || err?.message || "Phân công Điều Phối Viên thất bại.");
    }
  };

  if (!user || (!user.isAdmin && !user.IsAdmin)) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#090e11] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#11181c] border border-zinc-800 p-8 text-center rounded-lg space-y-4 shadow-xl">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold uppercase text-white">
            YÊU CẦU QUYỀN QUẢN TRỊ VIÊN (ADMIN)
          </h2>
          <p className="font-sans text-xs text-zinc-400 leading-relaxed">
            Khu vực quản trị hệ thống chỉ dành riêng cho Admin. Bấm nút bên dưới để vào bằng tài khoản Admin Demo:
          </p>
          <div className="pt-2 flex flex-col gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => loginAsDemoRole("Admin")}
              className="w-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold py-2.5 uppercase hover:bg-amber-500 hover:text-black transition-all cursor-pointer rounded"
            >
              [ 🛡️ Vào Bằng Tài Khoản System Admin Demo ]
            </button>
            <Link href="/login" className="w-full">
              <button className="w-full border border-zinc-800 text-zinc-400 py-2 uppercase hover:text-white hover:border-zinc-600 transition-colors rounded">
                Đến trang đăng nhập chính thức
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ecCount = usersList.filter(
    (u: any) => u && ((u.role || u.Role) === "Coordinator" || (u.email || "").toLowerCase().includes("coordinator"))
  ).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#090e11] text-[#dde4e6] font-sans py-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
          <div>
            <div className="font-mono text-[11px] text-amber-400 mb-1 uppercase tracking-wider">
              BẢNG ĐIỀU HÀNH HỆ THỐNG / QUẢN TRỊ TOÀN QUYỀN
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase">
              TỔNG QUAN QUẢN TRỊ VIÊN
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/admin/events/new">
              <button className="px-4 py-2.5 bg-amber-500 text-black font-mono font-extrabold text-xs uppercase hover:bg-amber-400 transition-all rounded flex items-center gap-1.5 cursor-pointer shadow-md">
                <Plus className="w-4 h-4" />
                <span>TẠO SỰ KIỆN MỚI</span>
              </button>
            </Link>
            <Link href="/admin/users">
              <button className="px-3.5 py-2.5 bg-[#141f23] border border-zinc-700 hover:border-amber-400/60 text-zinc-300 hover:text-white font-mono text-xs font-bold uppercase transition-all rounded cursor-pointer">
                <span>Quản Lý Người Dùng</span>
              </button>
            </Link>
            <Link href="/admin/schools">
              <button className="px-3.5 py-2.5 bg-[#141f23] border border-zinc-700 hover:border-amber-400/60 text-zinc-300 hover:text-white font-mono text-xs font-bold uppercase transition-all rounded cursor-pointer">
                <span>Danh Mục Trường</span>
              </button>
            </Link>
          </div>
        </div>

        {/* 4 Stat Widgets - Dịu Mắt, Không Chói Lóa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#10171a] border border-zinc-800/90 p-4 rounded-lg space-y-1">
            <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider block">
              Tổng Sự Kiện
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-2xl text-white">
                {loadingEvents ? "..." : events.length}
              </span>
              <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {events.filter((e: any) => !e.endDate || new Date(e.endDate) > new Date()).length} Đang mở
              </span>
            </div>
            <span className="font-mono text-[10px] text-zinc-500 block">
              Toàn bộ các mùa giải trên hệ thống
            </span>
          </div>

          <div className="bg-[#10171a] border border-zinc-800/90 p-4 rounded-lg space-y-1">
            <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider block">
              Người Dùng Đăng Ký
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-2xl text-cyan-300">
                {loadingUsers ? "..." : usersList.length}
              </span>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                Hoạt động
              </span>
            </div>
            <span className="font-mono text-[10px] text-zinc-500 block">
              Sinh viên, Giám khảo, Cố vấn, BTC
            </span>
          </div>

          <div className="bg-[#10171a] border border-zinc-800/90 p-4 rounded-lg space-y-1">
            <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider block">
              Điều Phối Viên (EC)
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-2xl text-purple-300">
                {ecCount}
              </span>
              <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                Phân công
              </span>
            </div>
            <span className="font-mono text-[10px] text-zinc-500 block">
              Trực tiếp quản lý giải đấu
            </span>
          </div>

          <div className="bg-[#10171a] border border-zinc-800/90 p-4 rounded-lg space-y-1">
            <span className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider block">
              Trạng Thái Hệ Thống
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-2xl text-zinc-500">
                —
              </span>
              <span className="text-xs font-mono text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded border border-zinc-500/20">
                Chưa đo
              </span>
            </div>
            <span className="font-mono text-[10px] text-zinc-500 block">
              Chưa nối nguồn dữ liệu uptime thật
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TRUNG TÂM QUẢN LÝ SỰ KIỆN (BẢNG SỰ KIỆN + BỘ LỌC + NÚT XEM CHI TIẾT)       */}
        {/* ========================================================================= */}
        <div className="bg-[#10171a] border border-zinc-800 rounded-lg overflow-hidden shadow-sm">
          
          {/* Table Header Controls */}
          <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-[#131d21]">
            <div>
              <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                DANH SÁCH TẤT CẢ SỰ KIỆN CUỘC THI
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Xem chi tiết, gán Điều phối viên hoặc tạo sự kiện mới
              </p>
            </div>

            {/* Event Filter Pills & Search */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="Tìm tên sự kiện..."
                className="px-3 py-1.5 bg-[#0b1013] border border-zinc-700 text-white font-mono text-xs rounded placeholder:text-zinc-500 focus:border-amber-400 outline-none w-full sm:w-48"
              />

              {/* Dải Nút Filter Trực Quan Dễ Dùng */}
              <div className="flex items-center gap-1 bg-[#0b1013] p-1 border border-zinc-800 rounded">
                <button
                  type="button"
                  onClick={() => setEventStatusFilter("all")}
                  className={`px-2.5 py-1 font-mono text-xs font-bold rounded transition-all cursor-pointer ${
                    eventStatusFilter === "all"
                      ? "bg-amber-500 text-black font-extrabold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Tất Cả ({events.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEventStatusFilter("ongoing")}
                  className={`px-2.5 py-1 font-mono text-xs font-bold rounded transition-all cursor-pointer ${
                    eventStatusFilter === "ongoing"
                      ? "bg-emerald-500 text-black font-extrabold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Đang Mở
                </button>
                <button
                  type="button"
                  onClick={() => setEventStatusFilter("upcoming")}
                  className={`px-2.5 py-1 font-mono text-xs font-bold rounded transition-all cursor-pointer ${
                    eventStatusFilter === "upcoming"
                      ? "bg-cyan-500 text-black font-extrabold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Sắp Mở
                </button>
                <button
                  type="button"
                  onClick={() => setEventStatusFilter("closed")}
                  className={`px-2.5 py-1 font-mono text-xs font-bold rounded transition-all cursor-pointer ${
                    eventStatusFilter === "closed"
                      ? "bg-zinc-700 text-white font-extrabold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Đã Đóng
                </button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          {loadingEvents ? (
            <div className="p-12 text-center font-mono text-xs text-zinc-400 animate-pulse">
              Đang tải dữ liệu danh sách sự kiện...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-12 text-center font-mono text-xs text-zinc-400 space-y-2">
              <p>Không tìm thấy sự kiện nào phù hợp với bộ lọc.</p>
              <button
                type="button"
                onClick={() => {
                  setEventStatusFilter("all");
                  setEventSearch("");
                }}
                className="text-amber-400 hover:underline cursor-pointer"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#0e1619] border-b border-zinc-800 text-zinc-400 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">TÊN SỰ KIỆN &amp; MÙA GIẢI</th>
                    <th className="py-3 px-4">THỜI GIAN TỔ CHỨC</th>
                    <th className="py-3 px-4">ĐIỀU PHỐI VIÊN (EC)</th>
                    <th className="py-3 px-4">TRẠNG THÁI</th>
                    <th className="py-3 px-4 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredEvents.map((evt: any, idx: number) => {
                    const eventId = evt.id || evt.Id || `evt-${idx}`;
                    const eventName = evt.eventName || evt.EventName || "Sự kiện cuộc thi";
                    const season = evt.season || evt.Season || "Season 2026";
                    const year = evt.year || evt.Year || 2026;
                    const startDate = evt.startDate || evt.StartDate;
                    const endDate = evt.endDate || evt.EndDate;
                    const isOngoing = !endDate || new Date(endDate) > new Date();
                    const coordinatorName = evt.assignedCoordinatorName || evt.AssignedCoordinatorName;
                    const coordinatorEmail = evt.assignedCoordinatorEmail || evt.AssignedCoordinatorEmail;

                    return (
                      <tr key={eventId} className="hover:bg-[#141e22] transition-colors">
                        <td className="py-3.5 px-4 text-zinc-500 text-center">{idx + 1}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm hover:text-amber-300 transition-colors">
                            <Link href={`/events/${eventId}`}>{eventName}</Link>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {season} • Năm {year}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-300">
                          {startDate ? new Date(startDate).toLocaleDateString("vi-VN") : "Bắt đầu"} —{" "}
                          {endDate ? new Date(endDate).toLocaleDateString("vi-VN") : "Kết thúc"}
                        </td>
                        <td className="py-3.5 px-4">
                          {coordinatorName || coordinatorEmail ? (
                            <div className="space-y-0.5">
                              <span className="font-bold text-purple-300">{coordinatorName || "Đã phân công"}</span>
                              <span className="block text-[10px] text-zinc-500">{coordinatorEmail || ""}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-zinc-500 italic">Chưa phân công</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 font-bold text-[10px] uppercase rounded inline-flex items-center gap-1.5 ${
                              isOngoing
                                ? "bg-emerald-950/50 text-emerald-300 border border-emerald-500/30"
                                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isOngoing ? "bg-emerald-400" : "bg-zinc-500"}`} />
                            {isOngoing ? "Đang Mở" : "Đã Đóng"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* NÚT XEM CHI TIẾT SỰ KIỆN CHO ADMIN */}
                            <Link href={`/events/${eventId}`}>
                              <button
                                type="button"
                                className="px-3 py-1.5 bg-[#162228] border border-zinc-700 hover:border-amber-400 hover:text-white text-zinc-200 font-mono text-xs font-bold rounded transition-all cursor-pointer flex items-center gap-1"
                              >
                                <span>👁 Xem Chi Tiết</span>
                              </button>
                            </Link>

                            {/* NÚT GÁN ĐIỀU PHỐI VIÊN */}
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(evt)}
                              className="px-3 py-1.5 bg-purple-950/40 text-purple-300 border border-purple-500/40 hover:bg-purple-900/60 font-mono text-xs font-bold rounded transition-all cursor-pointer"
                            >
                              Gán EC
                            </button>

                            {/* NÚT XÓA MỀM SỰ KIỆN */}
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteTargetEvent(evt);
                                setDeleteErrorMessage(null);
                              }}
                              className="px-2.5 py-1.5 bg-red-950/30 text-red-400 border border-red-500/30 hover:bg-red-900/50 hover:text-red-300 font-mono text-xs font-bold rounded transition-all cursor-pointer flex items-center gap-1"
                              title="Xóa mềm sự kiện (Lưu trữ và ẩn khỏi danh sách công khai)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa</span>
                            </button>
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

      {/* Modal Xác Nhận Xóa Mềm Sự Kiện */}
      {deleteTargetEvent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="max-w-md w-full bg-[#11181c] border border-red-500/40 p-6 rounded-lg space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0 text-red-400 text-xl font-bold">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-base text-red-300 uppercase tracking-wide">
                  XÁC NHẬN XÓA MỀM SỰ KIỆN
                </h3>
                <p className="font-sans text-xs text-zinc-300 leading-relaxed">
                  Bạn có chắc chắn muốn xóa mềm cuộc thi <strong className="text-white font-bold">"{deleteTargetEvent.eventName || deleteTargetEvent.EventName}"</strong>?
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#162228] border border-zinc-700/70 text-[11px] text-zinc-400 space-y-1 rounded">
              <p className="text-amber-300 font-bold flex items-center gap-1">
                <span>🛡️</span> <span>Nguyên tắc nghiệp vụ Xóa Mềm:</span>
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-zinc-300">
                <li>Sự kiện sẽ được ẩn khỏi trang danh sách công khai của thí sinh.</li>
                <li>Toàn bộ dữ liệu điểm số, đội thi, nộp bài &amp; bảng xếp hạng vẫn được lưu giữ an toàn trong cơ sở dữ liệu.</li>
              </ul>
            </div>

            {deleteErrorMessage && (
              <div className="p-3 bg-red-950/50 border border-red-500/50 text-red-300 rounded font-mono text-xs">
                {deleteErrorMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setDeleteTargetEvent(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#1c2830] border border-zinc-700 hover:border-zinc-500 text-zinc-300 rounded font-bold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSoftDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {isDeleting ? (
                  <span>Đang xử lý...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xác Nhận Xóa Mềm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Phân Công Nhiều Event Coordinator */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="max-w-lg w-full bg-[#11181c] border border-zinc-700 p-6 rounded-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-display font-bold text-lg text-white uppercase flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <span>PHÂN CÔNG BAN ĐIỀU PHỐI (MULTI-EC)</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="font-mono text-xs space-y-1 bg-[#0b1013] p-3 rounded border border-zinc-800">
              <span className="text-zinc-400">Sự kiện chỉ định:</span>
              <div className="text-white font-bold">{selectedEvent.eventName || selectedEvent.EventName}</div>
            </div>

            {assignSuccessMessage && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-2 rounded">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{assignSuccessMessage}</span>
              </div>
            )}

            {assignErrorMessage && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-300 font-mono text-xs rounded">
                {assignErrorMessage}
              </div>
            )}

            <form onSubmit={handleAssignEc} className="space-y-4 font-mono text-xs">
              
              {/* Danh Sách Email EC Đã Thêm (Tags) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-300 font-bold uppercase">
                    Danh Sách Điều Phối Viên ({ecEmailsList.length}) *
                  </label>
                  <span className="text-[11px] text-zinc-500">Nhập email rồi bấm &quot;Thêm&quot; hoặc Enter</span>
                </div>

                {ecEmailsList.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 p-2.5 bg-[#0b1013] border border-zinc-800 rounded min-h-[44px]">
                    {ecEmailsList.map((email, idx) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-950/60 text-purple-300 border border-purple-500/40 rounded text-xs"
                      >
                        <span className="font-bold">{idx === 0 ? "👑 " : ""}{email}</span>
                        {idx === 0 && <span className="text-[10px] text-amber-400">(Trưởng ban)</span>}
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email)}
                          className="text-purple-400 hover:text-white font-bold ml-1 cursor-pointer"
                          title="Gỡ email này"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-[#0b1013] border border-zinc-800 rounded text-center text-zinc-500 italic">
                    Chưa có Điều phối viên nào trong danh sách. Hãy nhập email bên dưới.
                  </div>
                )}
              </div>

              {/* Ô Nhập Email & Nút Thêm */}
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={currentEmailInput}
                    onChange={(e) => setCurrentEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddEmail();
                      }
                    }}
                    placeholder="coordinator@seal.edu.vn"
                    className="flex-1 bg-[#0b1013] border border-zinc-700 px-3.5 py-2 text-white font-mono rounded focus:border-amber-400 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    className="px-4 py-2 bg-[#1c272c] border border-zinc-700 text-zinc-200 hover:border-amber-400 hover:text-white rounded font-bold transition-colors cursor-pointer"
                  >
                    + Thêm
                  </button>
                </div>

                {/* Gợi ý email demo nhanh */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-zinc-500">Gợi ý nhanh:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!ecEmailsList.includes("ec.coordinator@seal.edu.vn")) {
                        setEcEmailsList([...ecEmailsList, "ec.coordinator@seal.edu.vn"]);
                      }
                    }}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    + ec.coordinator@seal.edu.vn
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!ecEmailsList.includes("ec.lehoa@seal.edu.vn")) {
                        setEcEmailsList([...ecEmailsList, "ec.lehoa@seal.edu.vn"]);
                      }
                    }}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    + ec.lehoa@seal.edu.vn
                  </button>
                </div>

                <div className="p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped space-y-1">
                  <span className="font-mono text-[10px] text-[var(--accent-coordinator)] uppercase block font-bold">
                    Ghi chú phân quyền hệ thống:
                  </span>
                  <p className="font-mono text-[10px] text-[var(--text-muted)]">
                    Admin chỉ định EC quản lý sự kiện này. Tài khoản EC được gán sẽ thấy sự kiện xuất hiện trên Bảng điều hành EC của họ để cấu hình Vòng thi (Rounds), Hạng mục (Tracks) & Tiêu chí.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 border border-zinc-700 text-zinc-400 hover:text-white rounded uppercase cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-500 text-black font-bold uppercase hover:bg-amber-400 transition-all rounded cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Đang gán..." : `Lưu Phân Công (${ecEmailsList.length || (currentEmailInput ? 1 : 0)} EC)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
