"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, Badge, Input, ApiMissingDataBadge } from "@/components/ui";
import { useEvents } from "@/repositories/eventsRepository";
import { useGetUsers } from "@/repositories/usersRepository";
import { useGetEventRoles, staffRepository } from "@/repositories/staffRepository";
import type { User, EventRole } from "@/models/entities";
import { Link, useRouter } from "@/i18n/routing";
import {
  UserCheck,
  Calendar,
  Search,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Trash2,
  Shield,
  Info,
  RefreshCw,
  UserPlus,
  ExternalLink,
  Users,
} from "lucide-react";

function pickEventId(ev: any): string {
  return ev?.id || ev?.Id || ev?.eventId || ev?.EventId || "";
}

export function AdminCoordinatorsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEventId = searchParams.get("eventId") || "";

  // Lấy danh sách toàn bộ sự kiện & người dùng
  const { data: rawEvents = [], isLoading: isLoadingEvents } = useEvents();
  const eventsList: any[] = Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data ?? [];

  const { data: rawUsers = [], isLoading: isLoadingUsers } = useGetUsers();
  const allUsers: User[] = Array.isArray(rawUsers) ? rawUsers : (rawUsers as any)?.data ?? [];

  // State chọn sự kiện
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId);

  // Tự động chọn sự kiện đầu tiên nếu chưa có eventId được chỉ định
  useEffect(() => {
    if (!selectedEventId && eventsList.length > 0) {
      const firstId = pickEventId(eventsList[0]);
      if (firstId) setSelectedEventId(firstId);
    }
  }, [eventsList, selectedEventId]);

  // Cập nhật khi query param thay đổi
  useEffect(() => {
    if (initialEventId && initialEventId !== selectedEventId) {
      setSelectedEventId(initialEventId);
    }
  }, [initialEventId]);

  const selectedEvent = useMemo(() => {
    return eventsList.find((e) => pickEventId(e) === selectedEventId) || null;
  }, [eventsList, selectedEventId]);

  // Lấy danh sách nhân sự của sự kiện được chọn
  const {
    data: rawRoles = [],
    isLoading: isLoadingRoles,
    refetch: refetchRoles,
  } = useGetEventRoles(selectedEventId);

  // Lọc ra các Điều phối viên đang phụ trách sự kiện này
  const currentCoordinators: EventRole[] = useMemo(() => {
    const list = Array.isArray(rawRoles) ? rawRoles : [];
    return list.filter((r: any) => {
      const roleName = r.roleName || r.RoleName;
      return (
        roleName === "EventCoordinator" ||
        roleName === 0 ||
        (typeof roleName === "string" && roleName.toLowerCase().includes("coordinator"))
      );
    });
  }, [rawRoles]);

  // State nhập / tìm kiếm ứng viên
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [customFullName, setCustomFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingRoleId, setRemovingRoleId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Tìm kiếm tức thì trong database
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 1 || selectedUser) return [];

    return allUsers
      .filter((u: any) => {
        const name = (u.fullName || u.FullName || "").toLowerCase();
        const email = (u.email || u.Email || "").toLowerCase();
        const studentCode = (u.studentCode || u.StudentCode || "").toLowerCase();
        return name.includes(q) || email.includes(q) || studentCode.includes(q);
      })
      .slice(0, 6);
  }, [allUsers, searchQuery, selectedUser]);

  // Phân tích trạng thái người dùng được chọn hoặc email gõ vào
  const matchedUser: User | null = useMemo(() => {
    if (selectedUser) return selectedUser;
    const clean = searchQuery.trim().toLowerCase();
    if (!clean) return null;
    return (
      allUsers.find(
        (u: any) => (u.email || u.Email || "").toLowerCase() === clean
      ) || null
    );
  }, [selectedUser, searchQuery, allUsers]);

  // Kiểm tra vai trò Sinh viên (Student)
  const isStudent = useMemo(() => {
    if (!matchedUser) return false;
    const u: any = matchedUser;
    const roleName = (u.roleName || u.RoleName || "").toLowerCase();
    return Boolean(
      u.isStudent ||
      u.IsStudent ||
      u.studentCode ||
      u.StudentCode ||
      roleName === "student"
    );
  }, [matchedUser]);

  // Kiểm tra nếu người này đã là EC của sự kiện này
  const isAlreadyEc = useMemo(() => {
    if (!matchedUser) return false;
    const uId = matchedUser.id || (matchedUser as any).Id || matchedUser.userId || (matchedUser as any).UserId;
    return currentCoordinators.some((c: any) => (c.userId || c.UserId) === uId);
  }, [matchedUser, currentCoordinators]);

  // Xử lý chọn người dùng từ dropdown gợi ý
  const handleSelectUser = (u: User) => {
    setSelectedUser(u);
    setSearchQuery(u.email || "");
    setActionError(null);
  };

  // Xử lý hủy chọn để gõ lại
  const handleClearSelection = () => {
    setSelectedUser(null);
    setSearchQuery("");
    setCustomFullName("");
    setActionError(null);
  };

  // Xử lý gỡ vai trò EC
  const handleRemoveCoordinator = async (roleId: string, name: string) => {
    const ok = window.confirm(`Bạn có chắc chắn muốn thu hồi quyền Điều phối viên của "${name}" khỏi sự kiện này không?`);
    if (!ok) return;

    setRemovingRoleId(roleId);
    setActionError(null);
    try {
      await staffRepository.removeEventRole(roleId);
      setActionSuccess(`Đã thu hồi quyền Điều phối viên của ${name} thành công!`);
      await refetchRoles();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || "Gỡ vai trò thất bại.");
    } finally {
      setRemovingRoleId(null);
    }
  };

  // Xử lý Phân công
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!selectedEventId) {
      setActionError("Vui lòng chọn một sự kiện để phân công.");
      return;
    }

    const emailToUse = searchQuery.trim().toLowerCase();
    if (!emailToUse) {
      setActionError("Vui lòng nhập hoặc chọn email của Điều Phối Viên.");
      return;
    }

    if (isStudent) {
      setActionError("Thí sinh (Sinh viên) không được phép làm Điều phối viên theo quy chế cuộc thi!");
      return;
    }

    if (isAlreadyEc) {
      setActionError("Người này đã là Điều phối viên phụ trách sự kiện này rồi!");
      return;
    }

    setIsSubmitting(true);

    // Luồng 1: Nếu là tài khoản có sẵn trong hệ thống -> Gán vai trò trực tiếp
    if (matchedUser) {
      const realUserId = matchedUser.id || (matchedUser as any).Id || matchedUser.userId || (matchedUser as any).UserId;
      try {
        const res = await staffRepository.assignRoleDirectly({
          userId: realUserId,
          eventId: selectedEventId,
          roleName: "EventCoordinator",
        });
        setIsSubmitting(false);

        if (res && res.success !== false) {
          setActionSuccess(
            `Đã phân công ${matchedUser.fullName || matchedUser.email} làm Điều Phối Viên cho sự kiện thành công!`
          );
          handleClearSelection();
          await refetchRoles();
          setTimeout(() => setActionSuccess(null), 3000);
        } else {
          setActionError("Phân công vai trò thất bại. Vui lòng kiểm tra lại quyền.");
        }
      } catch (err: any) {
        setIsSubmitting(false);
        setActionError(err?.response?.data?.message || err?.message || "Lỗi phân công vai trò.");
      }
      return;
    }

    // Luồng 2: Nếu là Email mới chưa có tài khoản -> Mời & tạo tài khoản tạm
    try {
      const res = await staffRepository.inviteCoordinator({
        eventId: selectedEventId,
        email: emailToUse,
        fullName: customFullName.trim() || undefined,
      });
      setIsSubmitting(false);

      if (res) {
        setActionSuccess(`Đã gửi thư mời và gán quyền Điều Phối Viên cho ${emailToUse} thành công!`);
        handleClearSelection();
        await refetchRoles();
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        setActionError("Không thể gửi thư mời điều phối viên.");
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setActionError(err?.response?.data?.message || err?.message || "Lỗi gửi thư mời nhân sự.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#090e11] text-[#dde4e6] font-sans py-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500 tracking-widest uppercase">
          <span className="text-red-400 font-bold">SEAL ADMIN</span>
          <span>&gt;</span>
          <Link href="/admin/events" className="hover:text-white transition-colors">
            SỰ KIỆN
          </Link>
          <span>&gt;</span>
          <span className="text-white font-bold">PHÂN CÔNG EVENT COORDINATOR</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <div className="font-mono text-[11px] text-amber-400 uppercase tracking-wider mb-1">
              COORDINATOR APPOINTMENT &amp; ACCESS CONTROL
            </div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-white uppercase tracking-wider flex items-center gap-2.5">
              <UserCheck className="w-6 h-6 text-red-500" />
              Phân Công Trưởng Ban Điều Phối (EC)
            </h1>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              Trao quyền điều phối, cấu hình bộ tiêu chí, duyệt hồ sơ thí sinh và chấm thi cho Ban tổ chức từng sự kiện.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/admin/events">
              <button
                type="button"
                className="font-mono text-xs border border-zinc-700 hover:border-zinc-500 bg-[#141f23] text-zinc-300 hover:text-white px-3.5 py-2 rounded flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                ← QUAY LẠI SỰ KIỆN
              </button>
            </Link>

            {selectedEventId && (
              <Link href={`/coordinator/dashboard?eventId=${selectedEventId}`}>
                <button
                  type="button"
                  className="font-mono text-xs bg-purple-950/20 border border-purple-500/40 text-purple-300 hover:bg-purple-950/40 px-3.5 py-2 rounded flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> 👁️ Giám Sát EC
                </button>
              </Link>
            )}

            <button
              type="button"
              onClick={() => refetchRoles()}
              className="font-mono text-xs border border-zinc-700 hover:border-zinc-500 bg-[#141f23] text-zinc-300 hover:text-white px-3.5 py-2 rounded flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Làm Mới
            </button>
          </div>
        </div>

        {/* Event Selector Deck */}
        <div className="p-5 bg-[#0f171c] border border-zinc-800 rounded space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> BƯỚC 1: CHỌN SỰ KIỆN CẦN PHÂN CÔNG
            </span>
            <span className="text-xs text-zinc-400">
              {eventsList.length} sự kiện có sẵn
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-8">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full h-10 px-4 py-2 bg-[#141f23] border border-zinc-700 text-white font-mono text-xs rounded focus:border-red-500 outline-none"
              >
                <option value="">-- CHỌN SỰ KIỆN TRONG DANH SÁCH --</option>
                {eventsList.map((ev) => {
                  const id = pickEventId(ev);
                  const name = ev.eventName || ev.EventName || "Sự kiện";
                  const season = ev.season || ev.Season || "";
                  const year = ev.year || ev.Year || "";
                  return (
                    <option key={id} value={id}>
                      {name} [{season} {year}] (ID: {id.slice(0, 8)}...)
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedEvent && (
              <div className="md:col-span-4 h-10 flex items-center gap-2 bg-[#141f23] px-3 border border-zinc-700 rounded font-mono text-xs">
                <span className="text-zinc-400">MÙA GIẢI:</span>
                <span className="text-red-400 font-bold">
                  {selectedEvent.season || selectedEvent.Season || "Summer"} {selectedEvent.year || selectedEvent.Year || 2026}
                </span>
                <span className="text-zinc-400 ml-auto">
                  {selectedEvent.status !== false ? "● MỞ" : "○ ĐÓNG"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notifications & Status Banner */}
        {actionSuccess && (
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded flex items-center gap-2.5 text-xs text-emerald-300 font-mono">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="p-3.5 bg-red-950/40 border border-red-500/40 rounded flex items-center gap-2.5 text-xs text-red-300 font-mono">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* 2-Column Work Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Phân Công EC Mới (5 cols) */}
          <div className="lg:col-span-5 space-y-4 font-mono text-xs">
            <div className="p-5 bg-[#0f171c] border border-zinc-800 rounded space-y-4">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-red-400" />
                  Gán / Mời Điều Phối Viên
                </h3>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Nhập email hoặc tìm kiếm tài khoản Giảng viên / Cán bộ trong hệ thống.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Search & Input User */}
                <div className="space-y-1.5 relative">
                  <label className="text-[11px] text-zinc-400 font-bold uppercase block tracking-wider">
                    EMAIL HOẶC TÊN NGƯỜI DÙNG:
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="vd: coordinator@fpt.edu.vn hoặc tên..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (selectedUser) setSelectedUser(null);
                      }}
                      className="w-full pl-9 pr-3 text-xs h-10 bg-[#141f23] border border-zinc-700 focus:border-red-500 text-white rounded outline-none"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Dropdown Gợi Ý Tìm Kiếm Tức Thì */}
                  {searchMatches.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#0f171c] border border-zinc-700 shadow-2xl z-30 rounded overflow-hidden">
                      <div className="p-1.5 bg-[#141f23] border-b border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider">
                        Gợi ý tài khoản trong hệ thống ({searchMatches.length}):
                      </div>
                      {searchMatches.map((u: any) => {
                        const name = u.fullName || u.FullName || "Không tên";
                        const email = u.email || u.Email || "";
                        const isStud = Boolean(u.isStudent || u.IsStudent || u.studentCode);
                        return (
                          <div
                            key={u.id || u.Id || email}
                            onClick={() => handleSelectUser(u)}
                            className="p-2.5 hover:bg-white/[0.04] cursor-pointer border-b border-zinc-800/60 flex items-center justify-between transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-bold text-white truncate">{name}</div>
                              <div className="text-[10px] text-zinc-400 truncate">{email}</div>
                            </div>
                            {isStud ? (
                              <span className="px-1.5 py-0.5 text-[9px] bg-amber-950/40 text-amber-300 border border-amber-500/30 rounded shrink-0">
                                Thí sinh
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-[9px] bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 rounded shrink-0">
                                Cán bộ
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Hiển thị Thông Tin Người Dùng Được Chọn */}
                {matchedUser && (
                  <div className="p-3 bg-[#141f23] border border-zinc-700 rounded space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                        TÀI KHOẢN XÁC ĐỊNH:
                      </span>
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="text-[10px] text-red-400 hover:underline cursor-pointer"
                      >
                        Đổi tài khoản khác
                      </button>
                    </div>
                    <div className="font-bold text-white">
                      {matchedUser.fullName || (matchedUser as any).FullName || "Cán bộ"}
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                      <Mail className="w-3 h-3" /> {matchedUser.email}
                    </div>

                    {isStudent && (
                      <div className="mt-2 p-2 bg-amber-950/40 border border-amber-500/40 text-amber-300 text-[10px] flex items-center gap-1.5 rounded">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Tài khoản này là Sinh viên, không thể làm Điều phối viên.</span>
                      </div>
                    )}

                    {isAlreadyEc && (
                      <div className="mt-2 p-2 bg-purple-950/40 border border-purple-500/40 text-purple-300 text-[10px] flex items-center gap-1.5 rounded">
                        <Shield className="w-3.5 h-3.5 shrink-0" />
                        <span>Người này hiện ĐÃ LÀ Điều phối viên của sự kiện này.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Nếu là Email mới hoàn toàn -> Cho phép nhập Họ tên */}
                {!matchedUser && searchQuery.includes("@") && searchQuery.includes(".") && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-zinc-400 font-bold uppercase block tracking-wider">
                      HỌ VÀ TÊN (TÙY CHỌN):
                    </label>
                    <input
                      type="text"
                      placeholder="vd: ThS. Nguyễn Văn A"
                      value={customFullName}
                      onChange={(e) => setCustomFullName(e.target.value)}
                      className="w-full px-3 text-xs h-10 bg-[#141f23] border border-zinc-700 focus:border-red-500 text-white rounded outline-none"
                      disabled={isSubmitting}
                    />
                    <span className="text-[10px] text-cyan-400 block">
                      ℹ️ Hệ thống sẽ gửi thư mời kích hoạt tài khoản EC qua email này.
                    </span>
                  </div>
                )}

                {/* Nút Phân Công */}
                <button
                  type="submit"
                  disabled={isSubmitting || isStudent || isAlreadyEc || !selectedEventId || !searchQuery.trim()}
                  className="w-full font-mono text-xs bg-red-600 hover:bg-red-500 text-white font-bold h-10 rounded flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang Phân Công...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" /> Xác Nhận Phân Công EC
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="p-4 bg-[#0f171c] border border-zinc-800 rounded font-mono text-[11px] text-zinc-400 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-red-400" /> QUYỀN HẠN CỦA EVENT COORDINATOR:
              </div>
              <ul className="list-disc pl-4 space-y-1">
                <li>Toàn quyền cấu hình bộ tiêu chí &amp; mẫu đánh giá cho các Track.</li>
                <li>Duyệt đăng ký đội thi và hồ sơ thẻ sinh viên Non-FPT.</li>
                <li>Phân bổ ban giám khảo, giám sát tiến độ chấm điểm RBL.</li>
                <li>Tính điểm và công bố bảng vàng kết quả sự kiện.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Danh Sách EC Đang Phụ Trách (7 cols) */}
          <div className="lg:col-span-7">
            <div className="p-6 bg-[#0f171c] border border-zinc-800 rounded space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-400" />
                  Danh Sách Điều Phối Viên Hiện Tại ({currentCoordinators.length})
                </h3>
                <span className="text-[10px] text-zinc-400">
                  Sự kiện: {selectedEvent?.eventName || selectedEvent?.EventName || "Chưa chọn"}
                </span>
              </div>

              {!selectedEventId ? (
                <div className="py-12 text-center text-xs text-zinc-400">
                  Vui lòng chọn một sự kiện ở trên để xem danh sách Điều Phối Viên.
                </div>
              ) : isLoadingRoles ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-red-400">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Đang tải danh sách nhân sự sự kiện...</span>
                </div>
              ) : currentCoordinators.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-zinc-700 bg-[#141f23] rounded text-xs space-y-2 p-6">
                  <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
                  <div className="font-bold text-white">CHƯA CÓ ĐIỀU PHỐI VIÊN NÀO</div>
                  <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                    Sự kiện này hiện chưa có Trưởng ban điều phối. Hãy sử dụng form bên trái để gán ít nhất một EC phụ trách.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentCoordinators.map((c: any, idx) => {
                    const roleId = c.id || c.Id || c.roleId || c.RoleId || `ec-${idx}`;
                    const uName = c.fullName || c.FullName || c.userName || c.UserName || "Điều phối viên";
                    const uEmail = c.email || c.Email || "coordinator@seal.edu.vn";
                    const isRemoving = removingRoleId === roleId;

                    return (
                      <div
                        key={roleId}
                        className="p-4 bg-[#141f23] border border-purple-500/30 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-500/60 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-purple-950/50 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold shrink-0">
                            {uName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">{uName}</div>
                            <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1.5">
                              <Mail className="w-3 h-3 shrink-0" /> {uEmail}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-purple-950/40 text-purple-300 border border-purple-500/30 rounded uppercase">
                            Coordinator
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveCoordinator(roleId, uName)}
                            disabled={isRemoving}
                            className="text-[11px] text-red-400 hover:bg-red-950/40 hover:text-red-300 border border-red-500/30 px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors"
                            title="Thu hồi quyền EC"
                          >
                            {isRemoving ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            <span>Thu Hồi</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
