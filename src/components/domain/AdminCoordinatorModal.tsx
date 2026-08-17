"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  UserCheck,
  UserX,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Trash2,
  Shield,
  Info,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useGetEventRoles, staffRepository } from "@/repositories/staffRepository";
import type { User, EventRole } from "@/models/entities";

interface AdminCoordinatorModalProps {
  event: any;
  onClose: () => void;
  onSuccess: () => void;
  allUsers: User[];
}

export const AdminCoordinatorModal: React.FC<AdminCoordinatorModalProps> = ({
  event,
  onClose,
  onSuccess,
  allUsers,
}) => {
  const eventId = event?.id || event?.Id || event?.eventId || event?.EventId || "";
  const eventName = event?.eventName || event?.EventName || "Sự kiện cuộc thi";

  const {
    data: rawRoles = [],
    isLoading: isLoadingRoles,
    refetch: refetchRoles,
  } = useGetEventRoles(eventId);

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

  // State nhập / tìm kiếm
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

  // Kiểm tra nếu là email mới hoàn toàn (chưa có trong database)
  const isNewEmail = useMemo(() => {
    const clean = searchQuery.trim();
    return !matchedUser && clean.includes("@") && clean.includes(".");
  }, [matchedUser, searchQuery]);

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
      onSuccess();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || "Gỡ vai trò thất bại.");
    } finally {
      setRemovingRoleId(null);
    }
  };

  // Xử lý Phân công / Gửi thư mời
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

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
          eventId: eventId,
          roleName: "EventCoordinator",
        });
        setIsSubmitting(false);

        if (res && res.success !== false) {
          setActionSuccess(
            `Đã phân công ${matchedUser.fullName || matchedUser.email} làm Điều Phối Viên cho sự kiện thành công!`
          );
          handleClearSelection();
          await refetchRoles();
          onSuccess();
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

    // Luồng 2: Nếu là Email mới chưa có tài khoản -> Gọi API Mời + Tạo tài khoản tạm
    try {
      const fullNameToUse = customFullName.trim() || emailToUse.split("@")[0];
      const res = await staffRepository.inviteCoordinator({
        eventId: eventId,
        email: emailToUse,
        fullName: fullNameToUse,
        notes: `Mời làm Event Coordinator cho sự kiện ${eventName}`,
      });
      setIsSubmitting(false);

      if (res && (res.success !== false || (res as any).invitationId || (res as any).id)) {
        setActionSuccess(
          `Đã gửi thư mời và kích hoạt tài khoản tạm cho "${emailToUse}" thành công!`
        );
        handleClearSelection();
        await refetchRoles();
        onSuccess();
        setTimeout(() => setActionSuccess(null), 3500);
      } else {
        setActionError((res as any)?.message || "Gửi thư mời thất bại. Vui lòng kiểm tra định dạng email.");
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setActionError(err?.response?.data?.message || err?.message || "Lỗi gửi thư mời Điều phối viên.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
      <Card className="w-full max-w-2xl bg-[#0e1619] border border-purple-500/40 rounded-xl space-y-5 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-zinc-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-zinc-800 pb-4 space-y-1">
          <div className="font-mono text-[11px] text-purple-400 uppercase tracking-widest flex items-center gap-2 font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>EXECUTIVE ADMIN // EVENT COORDINATOR HUB</span>
          </div>
          <h2 className="font-display font-bold text-2xl text-white uppercase flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-purple-400" />
            Quản Lý Điều Phối Viên Sự Kiện
          </h2>
          <p className="font-mono text-xs text-zinc-400">
            Sự kiện: <strong className="text-purple-300 font-bold">"{eventName}"</strong>
          </p>
        </div>

        {/* Toasts thông báo kết quả */}
        {actionSuccess && (
          <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-mono text-xs flex items-center gap-2.5 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="p-3.5 bg-rose-950/60 border border-rose-500/50 text-rose-300 font-mono text-xs flex items-center gap-2.5 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* KHỐI 1: DANH SÁCH ĐIỀU PHỐI VIÊN ĐANG PHỤ TRÁCH SỰ KIỆN NÀY                */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              ĐIỀU PHỐI VIÊN ĐANG PHỤ TRÁCH ({currentCoordinators.length} EC)
            </h3>
            <button
              type="button"
              onClick={() => refetchRoles()}
              className="text-[11px] font-mono text-zinc-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
              title="Tải lại danh sách"
            >
              <RefreshCw className="w-3 h-3" /> Làm mới
            </button>
          </div>

          {isLoadingRoles ? (
            <div className="p-4 text-center font-mono text-xs text-zinc-500 bg-[#0a0f12] border border-zinc-800 rounded-lg animate-pulse">
              Đang tải danh sách Điều phối viên...
            </div>
          ) : currentCoordinators.length === 0 ? (
            <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-lg flex items-start gap-2.5 text-amber-300 font-mono text-xs">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Chưa có Điều phối viên nào phụ trách</strong>
                Sự kiện này chưa được gán Event Coordinator. Vui lòng tìm kiếm tài khoản có sẵn hoặc gửi thư mời bên dưới.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentCoordinators.map((c: any) => {
                const roleId = c.id || c.Id || c.eventRoleId || c.EventRoleId;
                const email = c.user?.email || c.User?.Email || c.email || c.Email || "coordinator@seal.edu.vn";
                const fullName = c.user?.fullName || c.User?.FullName || c.fullName || email.split("@")[0];
                const isRemoving = removingRoleId === roleId;

                return (
                  <div
                    key={roleId || email}
                    className="p-3 bg-[#121c20] border border-zinc-800 hover:border-purple-500/40 rounded-lg flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-bold text-white truncate flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                        <span className="truncate">{fullName}</span>
                      </div>
                      <div className="font-mono text-[11px] text-zinc-400 truncate mt-0.5">{email}</div>
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-purple-950/40 text-purple-300 border border-purple-500/30 rounded text-[9px] font-mono font-bold uppercase">
                        ACTIVE COORDINATOR
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isRemoving}
                      onClick={() => handleRemoveCoordinator(roleId, fullName)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 rounded transition-all cursor-pointer shrink-0"
                      title="Thu hồi quyền EC này khỏi sự kiện"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* KHỐI 2: Ô TÌM KIẾM THÔNG MINH, KIỂM TRA ROLE VÀ MỜI TÀI KHOẢN TẠM           */}
        {/* ========================================================================= */}
        <div className="pt-4 border-t border-zinc-800 space-y-4">
          <div className="space-y-1">
            <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-purple-400" />
              THÊM HOẶC MỜI ĐIỀU PHỐI VIÊN MỚI
            </h3>
            <p className="font-mono text-[11px] text-zinc-400">
              Gõ tìm kiếm tên/email cán bộ trong database hoặc nhập email mới để hệ thống tự động gửi thư mời tạo tài khoản tạm.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 relative">
              <label className="text-xs font-mono text-zinc-300 uppercase font-bold flex items-center justify-between">
                <span>TÌM KIẾM TÀI KHOẢN HOẶC NHẬP EMAIL *</span>
                {selectedUser && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-purple-400 hover:text-purple-300 text-[10px] lowercase cursor-pointer"
                  >
                    (chọn lại)
                  </button>
                )}
              </label>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (selectedUser) setSelectedUser(null);
                  }}
                  placeholder="Gõ họ tên, email cán bộ hoặc nhập email mới (VD: ec.dhfpt@fe.edu.vn)..."
                  className={`w-full bg-[#0a0f12] border pl-9 pr-8 py-2.5 text-white font-mono text-xs rounded-lg outline-none transition-all ${
                    isStudent
                      ? "border-rose-500 focus:border-rose-400"
                      : matchedUser
                      ? "border-emerald-500/80 focus:border-emerald-400"
                      : isNewEmail
                      ? "border-purple-500 focus:border-purple-400"
                      : "border-zinc-700 focus:border-purple-400"
                  }`}
                  required
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown Danh Sách Gợi Ý Từ Database */}
              {searchMatches.length > 0 && !selectedUser && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#10181c] border border-zinc-700 rounded-lg shadow-2xl z-20 max-h-52 overflow-y-auto divide-y divide-zinc-800">
                  <div className="p-2 bg-[#0b1013] text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">
                    KẾT QUẢ TÌM THẤY TỪ DATABASE ({searchMatches.length}):
                  </div>
                  {searchMatches.map((u: any) => {
                    const uEmail = u.email || u.Email;
                    const uName = u.fullName || u.FullName || uEmail;
                    const uRole = (u.roleName || u.RoleName || "").toLowerCase();
                    const isStu = Boolean(u.isStudent || u.IsStudent || u.studentCode || u.StudentCode || uRole === "student");
                    const isAdm = Boolean(u.isAdmin || u.IsAdmin || uRole.includes("admin"));
                    const isEcRole = uRole.includes("coordinator") || uEmail.includes("coordinator") || uEmail.includes("ec.");

                    return (
                      <button
                        key={u.id || u.Id || uEmail}
                        type="button"
                        onClick={() => handleSelectUser(u)}
                        className="w-full p-2.5 text-left hover:bg-[#152025] flex items-center justify-between gap-2 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="font-mono text-xs font-bold text-white truncate">{uName}</div>
                          <div className="font-mono text-[11px] text-zinc-400 truncate">{uEmail}</div>
                        </div>

                        <div>
                          {isStu ? (
                            <span className="px-2 py-0.5 bg-rose-950/40 text-rose-300 border border-rose-500/30 rounded text-[9px] font-mono font-bold uppercase">
                              SINH VIÊN
                            </span>
                          ) : isAdm ? (
                            <span className="px-2 py-0.5 bg-amber-950/40 text-amber-300 border border-amber-500/30 rounded text-[9px] font-mono font-bold uppercase">
                              ADMIN
                            </span>
                          ) : isEcRole ? (
                            <span className="px-2 py-0.5 bg-purple-950/40 text-purple-300 border border-purple-500/30 rounded text-[9px] font-mono font-bold uppercase">
                              COORDINATOR
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 rounded text-[9px] font-mono font-bold uppercase">
                              CÁN BỘ
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ===================================================================== */}
            {/* DYNAMIC FEEDBACK BOX THEO KẾT QUẢ PHÂN TÍCH                            */}
            {/* ===================================================================== */}
            {isStudent && matchedUser && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-500/50 rounded-lg flex items-start gap-2.5 text-rose-300 font-mono text-xs">
                <UserX className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold uppercase">⛔ CẢNH BÁO XUNG ĐỘT VAI TRÒ:</strong>
                  Tài khoản <strong>"{matchedUser.fullName}"</strong> có vai trò Sinh viên (Thí sinh). Theo điều lệ cuộc thi, thí sinh không được phép kiêm nhiệm vai trò Ban tổ chức / Điều phối viên!
                </div>
              </div>
            )}

            {isAlreadyEc && (
              <div className="p-3.5 bg-amber-950/40 border border-amber-500/50 rounded-lg flex items-start gap-2.5 text-amber-300 font-mono text-xs">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold uppercase">ℹ️ ĐÃ LÀ ĐIỀU PHỐI VIÊN:</strong>
                  Tài khoản <strong>"{matchedUser?.fullName || searchQuery}"</strong> đã được phân công phụ trách sự kiện này từ trước.
                </div>
              </div>
            )}

            {matchedUser && !isStudent && !isAlreadyEc && (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/50 rounded-lg flex items-start gap-2.5 text-emerald-300 font-mono text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold uppercase">✔ TÀI KHOẢN HỢP LỆ TRONG HỆ THỐNG:</strong>
                  Tìm thấy cán bộ <strong>"{matchedUser.fullName}"</strong> ({matchedUser.email}). Sẵn sàng gán vai trò trực tiếp vào sự kiện này.
                </div>
              </div>
            )}

            {isNewEmail && !matchedUser && (
              <div className="space-y-3">
                <div className="p-3.5 bg-purple-950/40 border border-purple-500/50 rounded-lg flex items-start gap-2.5 text-purple-300 font-mono text-xs">
                  <Mail className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold uppercase">💡 EMAIL MỚI — MỜI QUA TÀI KHOẢN TẠM:</strong>
                    Email <strong>"{searchQuery}"</strong> chưa có tài khoản trong hệ thống. Hệ thống sẽ tự động tạo <strong>Tài khoản tạm (IsTemporary)</strong> và gửi email kích hoạt + thư mời tham gia Ban tổ chức sự kiện.
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-zinc-300 uppercase font-bold">
                    HỌ VÀ TÊN NGƯỜI ĐƯỢC MỜI (TÙY CHỌN)
                  </label>
                  <input
                    type="text"
                    value={customFullName}
                    onChange={(e) => setCustomFullName(e.target.value)}
                    placeholder="VD: ThS. Nguyễn Văn A..."
                    className="w-full bg-[#0a0f12] border border-zinc-700 px-3.5 py-2 text-white font-mono text-xs rounded-lg focus:border-purple-400 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
              <Button
                variant="ghost"
                type="button"
                onClick={onClose}
                className="text-xs font-mono text-zinc-400 hover:text-white"
              >
                Đóng
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting || isStudent || isAlreadyEc || !searchQuery.trim()}
                className="text-xs font-mono font-bold px-5 bg-purple-600 hover:bg-purple-500 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  "Đang xử lý..."
                ) : matchedUser ? (
                  "GÁN VAI TRÒ TRỰC TIẾP"
                ) : (
                  "GỬI THƯ MỜI & TẠO TÀI KHOẢN TẠM"
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};
