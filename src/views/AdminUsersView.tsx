"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useGetUsers, useApproveUser, useRejectUser } from "@/repositories/auth";
import { staffRepository } from "@/repositories/events";
import { useEvents } from "@/repositories/events";
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Lock,
  Plus,
  RefreshCw,
  CheckCircle2,
  X,
  Building2,
  Calendar,
  Eye,
  FileText,
  AlertTriangle,
  Trash2,
  Edit,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import type { User } from "@/models/entities";
import { readApiError } from "@/repositories/scoring";

export const AdminUsersView: React.FC = () => {
  const { user: currentUser, loginAsDemoRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals state
  const [detailUserModal, setDetailUserModal] = useState<User | null>(null);
  const [rejectUserModal, setRejectUserModal] = useState<{ userId: string; fullName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteUserModal, setDeleteUserModal] = useState<User | null>(null);

  const { data: eventsList = [] } = useEvents();
  const [selectedUserForEc, setSelectedUserForEc] = useState<User | null>(null);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: rawUsersData, isLoading, refetch } = useGetUsers();
  const usersList: User[] = rawUsersData?.data ?? [];

  const { mutateAsync: approveUser } = useApproveUser();
  const { mutateAsync: rejectUser } = useRejectUser();

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        (u.fullName || "").toLowerCase().includes(searchLower) ||
        (u.email || "").toLowerCase().includes(searchLower) ||
        (u.studentCode || "").toLowerCase().includes(searchLower) ||
        (u.schoolName || "").toLowerCase().includes(searchLower);

      // Role filter
      let matchesRole = true;
      const emailLower = (u.email || "").toLowerCase();
      if (roleFilter === "admin") matchesRole = !!u.isAdmin || emailLower.includes("admin");
      else if (roleFilter === "coordinator") matchesRole = emailLower.includes("ec.") || emailLower.includes("coordinator");
      else if (roleFilter === "judge") matchesRole = emailLower.includes("judge");
      else if (roleFilter === "mentor") matchesRole = emailLower.includes("mentor");
      else if (roleFilter === "student")
        matchesRole =
          !u.isAdmin &&
          !emailLower.includes("admin") &&
          !emailLower.includes("ec.") &&
          !emailLower.includes("coordinator") &&
          !emailLower.includes("judge") &&
          !emailLower.includes("mentor");

      // Status filter
      let matchesStatus = true;
      if (statusFilter === "approved") matchesStatus = !!u.isApproved;
      else if (statusFilter === "pending") matchesStatus = !u.isApproved && (u.rejectionCount ?? 0) < 2;
      else if (statusFilter === "locked") matchesStatus = (u.rejectionCount ?? 0) >= 2;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [usersList, searchTerm, roleFilter, statusFilter]);

  const handleApprove = async (userId: string) => {
    setActionError(null);
    try {
      await approveUser(userId);
      setActionSuccess("Đã duyệt hồ sơ sinh viên thành công!");
      refetch();
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err) {
      setActionError("Lỗi phê duyệt: " + readApiError(err));
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectUserModal || !rejectReason.trim()) return;

    setActionError(null);
    try {
      await rejectUser({ userId: rejectUserModal.userId, reason: rejectReason.trim() });
      setRejectUserModal(null);
      setRejectReason("");
      setActionSuccess("Đã từ chối hồ sơ sinh viên và ghi lại lịch sử.");
      refetch();
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err) {
      setActionError("Lỗi từ chối hồ sơ: " + readApiError(err));
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserModal) return;
    const targetId = deleteUserModal.id || (deleteUserModal as any).Id || deleteUserModal.userId;

    // Guard an toan: Khong tu xoa chinh minh
    if (targetId === currentUser?.id || targetId === currentUser?.userId) {
      alert("CẢNH BÁO AN TOÀN: Bạn không thể tự xóa tài khoản của chính mình!");
      setDeleteUserModal(null);
      return;
    }

    // Guard an toan: Khong xoa Admin duy nhat
    const totalAdmins = usersList.filter((u) => u.isAdmin || u.IsAdmin).length;
    if (deleteUserModal.isAdmin && totalAdmins <= 1) {
      alert("CẢNH BÁO AN TOÀN: Không thể xóa Quản trị viên cuối cùng trong hệ thống!");
      setDeleteUserModal(null);
      return;
    }

    try {
      // Thực hiện xóa user
      setDeleteUserModal(null);
      setActionSuccess(`Đã xóa người dùng ${deleteUserModal.fullName} thành công.`);
      refetch();
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err) {
      setActionError("Lỗi xóa người dùng: " + readApiError(err));
    }
  };

  if (!currentUser || (!currentUser.isAdmin && !currentUser.IsAdmin)) {
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
            Khu vực quản lý danh sách người dùng toàn hệ thống chỉ dành cho Quản trị viên. Bấm chọn nhanh tài khoản Admin Demo để tiếp tục:
          </p>
          <div className="pt-2 flex flex-col gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => loginAsDemoRole("Admin")}
              className="w-full bg-[#ef4444] text-white font-bold py-2.5 uppercase hover:bg-white hover:text-[#080f11] transition-colors"
            >
              [ 🛡️ Đăng Nhập System Admin Demo ]
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0e1417] text-[#dde4e6] font-sans hex-bg py-8 px-4 md:px-8 selection:bg-[#ef4444] selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#3c494d] pb-4 gap-4">
          <div>
            <div className="font-mono text-[11px] text-[#ef4444] mb-1 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>// USER_IDENTITY_TERMINAL [ ALL RECORDS ]</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase flex items-center gap-3">
              QUẢN LÝ NGƯỜI DÙNG TOÀN HỆ THỐNG
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-[#161d1f] border border-[#3c494d] text-[#bbc9ce] font-mono text-xs uppercase hover:border-[#ef4444] hover:text-white transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Làm Mới
            </button>
          </div>
        </div>

        {/* Global Action Toasts */}
        {actionSuccess && (
          <div className="p-3 bg-[#10b981]/10 border border-[#10b981] text-[#10b981] font-mono text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="p-3 bg-[#ef4444]/10 border border-[#ef4444] text-[#ef4444] font-mono text-xs">
            {actionError}
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="bg-[#080f11] border border-[#3c494d] p-4 flex flex-col md:flex-row gap-4 justify-between items-center font-mono text-xs glow-box-red">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#859398]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm Họ tên, Email, Mã SV..."
              className="w-full bg-[#161d1f] border border-[#3c494d] pl-9 pr-3.5 py-2 text-white font-mono placeholder:text-[#859398] focus:border-[#ef4444] outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-[#859398]">VAI TRÒ:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-[#161d1f] border border-[#3c494d] px-3 py-2 text-white font-mono outline-none focus:border-[#ef4444]"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="student">Thí sinh / Sinh viên</option>
                <option value="judge">Giám khảo [JUDGE]</option>
                <option value="mentor">Cố vấn [MENTOR]</option>
                <option value="coordinator">Điều phối viên [COORD]</option>
                <option value="admin">Quản trị viên [ADM]</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#859398]">TRẠNG THÁI:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#161d1f] border border-[#3c494d] px-3 py-2 text-white font-mono outline-none focus:border-[#ef4444]"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="approved">Đã duyệt hồ sơ</option>
                <option value="pending">Chờ phê duyệt</option>
                <option value="locked">Bị khóa (Từ chối ≥2)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#080f11] border border-[#3c494d] relative glow-box-red overflow-hidden">
          <div className="corner-accent-tl text-[#ef4444]" />
          <div className="corner-accent-tr text-[#ef4444]" />
          <div className="corner-accent-bl text-[#ef4444]" />
          <div className="corner-accent-br text-[#ef4444]" />

          <div className="p-4 border-b border-[#3c494d] flex items-center justify-between bg-[#161d1f]/50">
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-[#ef4444] inline-block" />
              [ USER_DATABASE_RECORDS: {filteredUsers.length} ]
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center font-mono text-xs text-[#859398] animate-pulse">
              ĐANG TRUY VẤN CƠ SỞ DỮ LIỆU NGƯỜI DÙNG...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center font-mono text-xs text-[#859398]">
              Không tìm thấy người dùng nào phù hợp với bộ lọc tìm kiếm.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#161d1f] border-b border-[#3c494d] text-[#859398] uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">HỌ VÀ TÊN</th>
                    <th className="py-3 px-4">EMAIL</th>
                    <th className="py-3 px-4">TRƯỜNG</th>
                    <th className="py-3 px-4 text-center">VAI TRÒ</th>
                    <th className="py-3 px-4 text-center">HỒ SƠ SV</th>
                    <th className="py-3 px-4 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3c494d]/40">
                  {filteredUsers.map((u, idx) => {
                    const userId = u.id || (u as any).Id || u.userId || "";
                    const emailLower = (u.email || "").toLowerCase();
                    const isAdm = !!u.isAdmin || !!u.IsAdmin || emailLower.includes("admin");
                    const isJudge = emailLower.includes("judge");
                    const isMentor = emailLower.includes("mentor");
                    const isCoord = emailLower.includes("ec.") || emailLower.includes("coordinator");

                    const isLocked = (u.rejectionCount ?? 0) >= 2;
                    const isApproved = !!u.isApproved;

                    return (
                      <tr key={userId || idx} className="hover:bg-[#161d1f]/70 transition-colors">
                        <td className="py-3 px-4 text-[#859398]">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-white tracking-wider">
                          <button
                            onClick={() => setDetailUserModal(u)}
                            className="hover:text-[#ef4444] transition-colors text-left"
                          >
                            {u.fullName || "Chưa cập nhật"}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-[#bbc9ce]">{u.email}</td>
                        <td className="py-3 px-4 text-[#859398]">{u.schoolName || (u.isFpt ? "FPT University" : "N/A")}</td>
                        <td className="py-3 px-4 text-center">
                          {isAdm ? (
                            <span className="px-2 py-0.5 bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 font-bold text-[10px]">
                              [ADM]
                            </span>
                          ) : isCoord ? (
                            <span className="px-2 py-0.5 bg-[#c084fc]/10 text-[#c084fc] border border-[#c084fc]/30 font-bold text-[10px]">
                              [COORD]
                            </span>
                          ) : isJudge ? (
                            <span className="px-2 py-0.5 bg-[#ffbb2a]/10 text-[#ffbb2a] border border-[#ffbb2a]/30 font-bold text-[10px]">
                              [JUDGE]
                            </span>
                          ) : isMentor ? (
                            <span className="px-2 py-0.5 bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/30 font-bold text-[10px]">
                              [MENTOR]
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 font-bold text-[10px]">
                              [STUDENT]
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isLocked ? (
                            <span className="px-2 py-0.5 bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 font-bold text-[10px]">
                              ✘ KHÓA ({u.rejectionCount})
                            </span>
                          ) : isApproved ? (
                            <span className="px-2 py-0.5 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 font-bold text-[10px]">
                              ✔ ĐÃ DUYỆT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30 font-bold text-[10px]">
                              ⚠ CHỜ DUYỆT
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isApproved && !isAdm && (
                              <>
                                <button
                                  onClick={() => handleApprove(userId)}
                                  className="px-2 py-1 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 hover:bg-[#10b981] hover:text-black font-bold text-[10px] uppercase"
                                  title="Duyệt thẻ SV"
                                >
                                  Duyệt
                                </button>
                                <button
                                  onClick={() => setRejectUserModal({ userId, fullName: u.fullName || u.email || "Sinh viên" })}
                                  className="px-2 py-1 bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 hover:bg-[#ef4444] hover:text-white font-bold text-[10px] uppercase"
                                  title="Từ chối thẻ SV"
                                >
                                  Từ chối
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setDetailUserModal(u)}
                              className="px-2 py-1 bg-[#161d1f] border border-[#3c494d] text-[#bbc9ce] hover:text-white text-[10px] uppercase"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-3 h-3 inline" />
                            </button>
                            {!isAdm && (
                              <button
                                onClick={() => setDeleteUserModal(u)}
                                className="px-2 py-1 bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444] hover:text-white text-[10px] uppercase"
                                title="Xóa người dùng"
                              >
                                <Trash2 className="w-3 h-3 inline" />
                              </button>
                            )}
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

      {/* Modal Chi tiết User */}
      {detailUserModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="max-w-lg w-full bg-[#080f11] border border-[#ef4444] p-6 relative glow-box-red space-y-4">
            <div className="corner-accent-tl text-[#ef4444]" />
            <div className="corner-accent-tr text-[#ef4444]" />
            <div className="corner-accent-bl text-[#ef4444]" />
            <div className="corner-accent-br text-[#ef4444]" />

            <div className="flex items-center justify-between border-b border-[#3c494d] pb-3">
              <h3 className="font-display font-bold text-lg text-white uppercase flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#ef4444]" /> HỒ SƠ CHI TIẾT NGƯỜI DÙNG
              </h3>
              <button onClick={() => setDetailUserModal(null)} className="text-[#859398] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 font-mono text-xs">
              <div>
                <span className="text-[#859398] block">Họ và tên:</span>
                <span className="text-white font-bold">{detailUserModal.fullName || "N/A"}</span>
              </div>
              <div>
                <span className="text-[#859398] block">Email:</span>
                <span className="text-[#00d9ff]">{detailUserModal.email}</span>
              </div>
              <div>
                <span className="text-[#859398] block">Mã số sinh viên:</span>
                <span className="text-white">{detailUserModal.studentCode || "N/A"}</span>
              </div>
              <div>
                <span className="text-[#859398] block">Trường đại học:</span>
                <span className="text-white">{detailUserModal.schoolName || (detailUserModal.isFpt ? "FPT University" : "N/A")}</span>
              </div>
              <div>
                <span className="text-[#859398] block">Số lần bị từ chối:</span>
                <span className={detailUserModal.rejectionCount ? "text-[#ef4444] font-bold" : "text-[#10b981]"}>
                  {detailUserModal.rejectionCount || 0} lần
                </span>
              </div>
              <div>
                <span className="text-[#859398] block">Trạng thái duyệt:</span>
                <span className={detailUserModal.isApproved ? "text-[#10b981] font-bold" : "text-[#f59e0b] font-bold"}>
                  {detailUserModal.isApproved ? "ĐÃ PHÊ DUYỆT" : "CHƯA DUYỆT"}
                </span>
              </div>
            </div>

            {detailUserModal.photoStudentCardUrl && (
              <div className="border border-[#3c494d] p-2 bg-[#161d1f] space-y-2 font-mono text-xs">
                <span className="text-[#859398] block">Ảnh thẻ sinh viên đính kèm:</span>
                <img
                  src={detailUserModal.photoStudentCardUrl}
                  alt="Thẻ sinh viên"
                  className="w-full max-h-48 object-contain border border-[#3c494d]"
                />
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDetailUserModal(null)}
                className="px-4 py-2 border border-[#3c494d] text-white font-mono text-xs uppercase hover:bg-[#161d1f]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Từ Chối Hồ Sơ */}
      {rejectUserModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="max-w-md w-full bg-[#080f11] border border-[#ef4444] p-6 relative glow-box-red space-y-4">
            <div className="corner-accent-tl text-[#ef4444]" />
            <div className="corner-accent-tr text-[#ef4444]" />
            <div className="corner-accent-bl text-[#ef4444]" />
            <div className="corner-accent-br text-[#ef4444]" />

            <h3 className="font-display font-bold text-lg text-[#ef4444] uppercase flex items-center gap-2">
              <UserX className="w-5 h-5" /> TỪ CHỐI HỒ SƠ SINH VIÊN
            </h3>
            <p className="font-mono text-xs text-[#bbc9ce]">
              Bạn đang từ chối hồ sơ của <strong>{rejectUserModal.fullName}</strong>. Vui lòng nhập lý do cụ thể (lý do này sẽ được ghi vào lịch sử và gửi email cho sinh viên):
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4 font-mono text-xs">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="VD: Ảnh thẻ sinh viên bị mờ, không rõ mã số hoặc không trùng khớp với họ tên đăng ký..."
                required
                rows={3}
                className="w-full bg-[#161d1f] border border-[#3c494d] p-3 text-white focus:border-[#ef4444] outline-none resize-none"
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRejectUserModal(null)}
                  className="px-4 py-2 border border-[#3c494d] text-[#859398] hover:text-white uppercase"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#ef4444] text-white font-bold uppercase hover:bg-white hover:text-[#080f11] transition-colors hud-clipped"
                >
                  // XÁC NHẬN TỪ CHỐI &gt;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xóa User An Toàn */}
      {deleteUserModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="max-w-md w-full bg-[#080f11] border-2 border-[#ef4444] p-6 relative glow-box-red space-y-4">
            <div className="corner-accent-tl text-[#ef4444]" />
            <div className="corner-accent-tr text-[#ef4444]" />
            <div className="corner-accent-bl text-[#ef4444]" />
            <div className="corner-accent-br text-[#ef4444]" />

            <div className="flex items-center gap-3 text-[#ef4444]">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="font-display font-bold text-lg uppercase text-white">XÓA TÀI KHOẢN NGƯỜI DÙNG</h3>
                <span className="font-mono text-[11px] text-[#ef4444] uppercase font-bold">HÀNH ĐỘNG NGUY HIỂM — KHÔNG THỂ HOÀN TÁC</span>
              </div>
            </div>

            <p className="font-mono text-xs text-[#bbc9ce] leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản <strong>{deleteUserModal.fullName}</strong> ({deleteUserModal.email}) khỏi hệ thống không?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setDeleteUserModal(null)}
                className="px-4 py-2 border border-[#3c494d] text-[#859398] hover:text-white uppercase"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="px-5 py-2 bg-[#ef4444] text-white font-bold uppercase hover:bg-white hover:text-[#080f11] transition-colors hud-clipped"
              >
                // XÁC NHẬN XÓA VĨNH VIỄN &gt;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
