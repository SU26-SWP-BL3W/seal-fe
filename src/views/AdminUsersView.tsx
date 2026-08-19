"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useGetUsers, useApproveUser, useRejectUser, useDeleteUser } from "@/repositories/usersRepository";
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
import { readApiError } from "@/repositories/submitResultsRepository";
import { StudentProfileModal } from "@/components/domain/StudentProfileModal";

export interface AdminUsersViewProps {
  mode?: "admin" | "coordinator";
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ mode = "admin" }) => {
  const { user: currentUser } = useAuth();
  const isCoordinator = mode === "coordinator" || (!currentUser?.isAdmin && !currentUser?.IsAdmin);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState(isCoordinator ? "student" : "all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals state
  const [detailUserModal, setDetailUserModal] = useState<User | null>(null);
  const [rejectUserModal, setRejectUserModal] = useState<{ userId: string; fullName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteUserModal, setDeleteUserModal] = useState<User | null>(null);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: rawUsersData, isLoading, refetch } = useGetUsers({ pageSize: 500 });
  const usersList: User[] = useMemo(() => {
    const list = rawUsersData?.data ?? (Array.isArray(rawUsersData) ? rawUsersData : []);
    return Array.isArray(list) ? list : [];
  }, [rawUsersData]);

  const { mutateAsync: approveUser } = useApproveUser();
  const { mutateAsync: rejectUser } = useRejectUser();
  const { mutateAsync: deleteUser } = useDeleteUser();

  // LOI_12: Check if user has card submission (studentCode OR photoStudentCardUrl)
  const hasCardSubmission = (u: User) => {
    const hasStudentCode = Boolean(u.studentCode && u.studentCode.trim() !== "");
    const hasPhotoCardUrl = Boolean(
      (u as any).photoStudentCardUrl && (u as any).photoStudentCardUrl.trim() !== ""
    );
    return hasStudentCode || hasPhotoCardUrl;
  };

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

      // LOI_12: EC mode - ONLY show students with card submissions
      let matchesCardSubmission = true;
      if (isCoordinator) {
        matchesCardSubmission = hasCardSubmission(u);
      }

      return matchesSearch && matchesRole && matchesStatus && matchesCardSubmission;
    });
  }, [usersList, searchTerm, roleFilter, statusFilter, isCoordinator]);

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
    if (!currentUser?.isAdmin && !currentUser?.IsAdmin) {
      alert("Chỉ Quản trị viên (Admin) mới có quyền xóa tài khoản người dùng!");
      setDeleteUserModal(null);
      return;
    }
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
      await deleteUser(targetId);
      setDeleteUserModal(null);
      setActionSuccess(`Đã xóa người dùng ${deleteUserModal.fullName} thành công.`);
      refetch();
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err) {
      setActionError("Lỗi xóa người dùng: " + readApiError(err));
    }
  };

  const hasAccess = currentUser && (currentUser.isAdmin || currentUser.IsAdmin || isCoordinator);

  if (!hasAccess) {
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
            YÊU CẦU QUYỀN TRUY CẬP
          </h2>
          <p className="font-mono text-xs text-[#bbc9ce] leading-relaxed">
            Khu vực duyệt và quản lý danh sách hồ sơ chỉ dành cho Ban Tổ Chức &amp; Quản trị viên.
          </p>
          <div className="pt-2 flex flex-col gap-2 font-mono text-xs">
            <Link href="/login" className="w-full">
              <button className="w-full bg-[#ef4444] text-white font-bold py-2.5 uppercase hover:bg-white hover:text-[#080f11] transition-colors">
                Đến trang đăng nhập
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCoordinatorView = isCoordinator;
  const dashboardUrl = isCoordinatorView ? "/coordinator/dashboard" : "/admin/dashboard";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#090e11] text-[#dde4e6] font-sans py-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
          <div>
            <div className="font-mono text-[11px] text-cyan-400 mb-1 uppercase tracking-wider">
              {isCoordinatorView ? "BAN TỔ CHỨC / DUYỆT & QUẢN LÝ HỒ SƠ THÍ SINH" : "QUẢN TRỊ HỆ THỐNG / TÀI KHOẢN & HỒ SƠ"}
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase">
              {isCoordinatorView ? "DANH SÁCH THÍ SINH & DUYỆT THẺ SINH VIÊN" : "QUẢN LÝ NGƯỜI DÙNG TOÀN HỆ THỐNG"}
            </h1>
            <p className="text-xs text-zinc-400 font-sans mt-1">
              {isCoordinatorView
                ? "Tra cứu danh sách sinh viên, xem ảnh thẻ 3x4, kiểm tra MSSV và phê duyệt/từ chối hồ sơ đăng ký tham gia cuộc thi."
                : "Quản lý và kiểm soát toàn bộ tài khoản Admin, Điều phối viên, Giám khảo, Cố vấn và Sinh viên trong toàn hệ thống."}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href={dashboardUrl}>
              <button className="px-3.5 py-2 bg-[#141f23] border border-zinc-700 hover:border-cyan-400/60 text-zinc-300 hover:text-white font-mono text-xs font-bold uppercase transition-all rounded cursor-pointer">
                <span>← Bảng Điều Hành</span>
              </button>
            </Link>
            <button
              onClick={() => refetch()}
              className="px-3.5 py-2 bg-[#141f23] border border-zinc-700 text-zinc-300 font-mono text-xs uppercase hover:border-cyan-400 hover:text-white transition-colors rounded cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Làm Mới</span>
            </button>
          </div>
        </div>

        {/* Global Action Toasts */}
        {actionSuccess && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-2 rounded">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-300 font-mono text-xs rounded">
            {actionError}
          </div>
        )}

        {/* ========================================================================= */}
        {/* BỘ LỌC TÌM KIẾM DỄ XÀI & MÀU DỊU MẮT (FILTER PILLS THAY THẾ SELECT)         */}
        {/* ========================================================================= */}
        <div className="bg-[#10171a] border border-zinc-800 p-4 rounded-lg space-y-3.5 shadow-sm">
          
          {/* Top Search Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm Họ tên, Email, Mã SV..."
                className="w-full bg-[#0b1013] border border-zinc-700 pl-9 pr-3.5 py-2 text-white font-mono text-xs rounded placeholder:text-zinc-500 focus:border-amber-400 outline-none"
              />
            </div>

            <span className="font-mono text-xs text-zinc-400">
              Kết quả: <strong className="text-white">{filteredUsers.length}</strong> / {usersList.length} người dùng
            </span>
          </div>

          {/* Dải Nút Filter Trạng Thái & Vai Trò Trực Quan (1 Chạm) */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pt-2 border-t border-zinc-800/80 text-xs font-mono">
            
            {/* Filter Trạng Thái Hồ Sơ */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-zinc-400 font-bold mr-1">TRẠNG THÁI:</span>
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded font-mono text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-amber-500 text-black font-extrabold"
                    : "bg-[#0b1013] text-zinc-400 border border-zinc-800 hover:text-white"
                }`}
              >
                Tất Cả
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("approved")}
                className={`px-3 py-1 rounded font-mono text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === "approved"
                    ? "bg-emerald-500 text-black font-extrabold"
                    : "bg-[#0b1013] text-emerald-400 border border-emerald-500/20 hover:bg-emerald-950/30"
                }`}
              >
                Đã Duyệt
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1 rounded font-mono text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === "pending"
                    ? "bg-amber-400 text-black font-extrabold"
                    : "bg-[#0b1013] text-amber-300 border border-amber-500/20 hover:bg-amber-950/30"
                }`}
              >
                Chờ Phê Duyệt
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("locked")}
                className={`px-3 py-1 rounded font-mono text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === "locked"
                    ? "bg-rose-500 text-white font-extrabold"
                    : "bg-[#0b1013] text-rose-400 border border-rose-500/20 hover:bg-rose-950/30"
                }`}
              >
                Tạm Khóa (≥2 lần)
              </button>
            </div>

            {/* Filter Vai Trò */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-zinc-400 font-bold mr-1">VAI TRÒ:</span>
              <button
                type="button"
                onClick={() => setRoleFilter("all")}
                className={`px-2.5 py-1 rounded font-mono text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === "all"
                    ? "bg-cyan-500 text-black font-extrabold"
                    : "bg-[#0b1013] text-zinc-400 border border-zinc-800 hover:text-white"
                }`}
              >
                Tất Cả
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("student")}
                className={`px-2.5 py-1 rounded font-mono text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === "student"
                    ? "bg-cyan-400 text-black font-extrabold"
                    : "bg-[#0b1013] text-zinc-400 border border-zinc-800 hover:text-white"
                }`}
              >
                Sinh Viên
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("judge")}
                className={`px-2.5 py-1 rounded font-mono text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === "judge"
                    ? "bg-amber-400 text-black font-extrabold"
                    : "bg-[#0b1013] text-zinc-400 border border-zinc-800 hover:text-white"
                }`}
              >
                Giám Khảo
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("mentor")}
                className={`px-2.5 py-1 rounded font-mono text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === "mentor"
                    ? "bg-teal-400 text-black font-extrabold"
                    : "bg-[#0b1013] text-zinc-400 border border-zinc-800 hover:text-white"
                }`}
              >
                Cố Vấn
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("coordinator")}
                className={`px-2.5 py-1 rounded font-mono text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === "coordinator"
                    ? "bg-purple-400 text-black font-extrabold"
                    : "bg-[#0b1013] text-zinc-400 border border-zinc-800 hover:text-white"
                }`}
              >
                Điều Phối Viên
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#10171a] border border-zinc-800 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#131d21]">
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              DANH SÁCH TÀI KHOẢN NGƯỜI DÙNG ({filteredUsers.length})
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center font-mono text-xs text-zinc-400 animate-pulse">
              Đang truy vấn cơ sở dữ liệu người dùng...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center font-mono text-xs text-zinc-400">
              Không tìm thấy người dùng nào phù hợp với bộ lọc tìm kiếm.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#0e1619] border-b border-zinc-800 text-zinc-400 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">HỌ VÀ TÊN</th>
                    <th className="py-3 px-4">EMAIL</th>
                    <th className="py-3 px-4">TRƯỜNG</th>
                    <th className="py-3 px-4 text-center">VAI TRÒ</th>
                    <th className="py-3 px-4 text-center">HỒ SƠ SV</th>
                    <th className="py-3 px-4 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredUsers.map((u, idx) => {
                    const userId = u.id || (u as any).Id || u.userId || "";
                    const emailLower = (u.email || "").toLowerCase();
                    const isAdm = !!u.isAdmin || !!u.IsAdmin || emailLower.includes("admin");
                    const isJudge = emailLower.includes("judge");
                    const isMentor = emailLower.includes("mentor");
                    const isCoord = emailLower.includes("ec.") || emailLower.includes("coordinator");
                    const isStaff = isAdm || isCoord || isJudge || isMentor;

                    const hasCard = Boolean(u.photoStudentCardUrl || (u as any).PhotoStudentCardUrl);
                    const isFptUser = Boolean(u.isFpt || (u.schoolName && u.schoolName.toLowerCase().includes("fpt")) || emailLower.endsWith("@fpt.edu.vn"));
                    const isLocked = (u.rejectionCount ?? 0) >= 2;
                    const isApproved = !!u.isApproved;

                    return (
                      <tr key={userId || idx} className="hover:bg-[#141e22] transition-colors">
                        <td className="py-3.5 px-4 text-zinc-500 text-center">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-bold text-white tracking-wider">
                          <button
                            onClick={() => setDetailUserModal(u)}
                            className="hover:text-amber-300 transition-colors text-left cursor-pointer"
                          >
                            {u.fullName || "Chưa cập nhật"}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-300">{u.email}</td>
                        <td className="py-3.5 px-4 text-zinc-400">{u.schoolName || (u.isFpt ? "FPT University" : "N/A")}</td>
                        <td className="py-3.5 px-4 text-center">
                          {isAdm ? (
                            <span className="px-2 py-0.5 bg-rose-950/40 text-rose-300 border border-rose-500/30 rounded font-bold text-[10px]">
                              ADMIN
                            </span>
                          ) : isCoord ? (
                            <span className="px-2 py-0.5 bg-purple-950/40 text-purple-300 border border-purple-500/30 rounded font-bold text-[10px]">
                              COORD
                            </span>
                          ) : isJudge ? (
                            <span className="px-2 py-0.5 bg-amber-950/40 text-amber-300 border border-amber-500/30 rounded font-bold text-[10px]">
                              JUDGE
                            </span>
                          ) : isMentor ? (
                            <span className="px-2 py-0.5 bg-teal-950/40 text-teal-300 border border-teal-500/30 rounded font-bold text-[10px]">
                              MENTOR
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 rounded font-bold text-[10px]">
                              STUDENT
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isStaff ? (
                            <span className="text-zinc-500 font-mono text-[11px] italic">— (Cán bộ / Chuyên gia)</span>
                          ) : isLocked ? (
                            <span className="px-2 py-0.5 bg-rose-950/40 text-rose-300 border border-rose-500/30 rounded font-bold text-[10px]">
                              KHÓA ({u.rejectionCount})
                            </span>
                          ) : !isFptUser && !hasCard ? (
                            <span className="px-2 py-0.5 bg-amber-950/40 text-amber-300 border border-amber-500/30 rounded font-bold text-[10px]">
                              THIẾU ẢNH THẺ
                            </span>
                          ) : isApproved ? (
                            <span className="px-2 py-0.5 bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 rounded font-bold text-[10px]">
                              ĐÃ DUYỆT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-950/40 text-amber-300 border border-amber-500/30 rounded font-bold text-[10px]">
                              CHỜ DUYỆT
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isApproved && !isStaff && (
                              <>
                                <button
                                  onClick={() => handleApprove(userId)}
                                  className="px-2.5 py-1 bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black font-bold text-[11px] rounded transition-all cursor-pointer"
                                  title="Duyệt thẻ SV"
                                >
                                  Duyệt
                                </button>
                                <button
                                  onClick={() => setRejectUserModal({ userId, fullName: u.fullName || u.email || "Sinh viên" })}
                                  className="px-2.5 py-1 bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white font-bold text-[11px] rounded transition-all cursor-pointer"
                                  title="Từ chối thẻ SV"
                                >
                                  Từ chối
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setDetailUserModal(u)}
                              className="px-2.5 py-1 bg-[#141f23] border border-zinc-700 hover:border-amber-400 hover:text-white text-zinc-300 font-mono text-xs rounded transition-all cursor-pointer"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-3.5 h-3.5 inline" />
                            </button>
                            {!isAdm && (currentUser?.isAdmin || currentUser?.IsAdmin) && (
                              <button
                                onClick={() => setDeleteUserModal(u)}
                                className="px-2.5 py-1 bg-[#141f23] border border-zinc-700 text-rose-400 hover:bg-rose-500 hover:text-white font-mono text-xs rounded transition-all cursor-pointer"
                                title="Xóa người dùng"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
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

      {/* Modal Chi tiết User Đầy Đủ Ảnh Thẻ 3x4, MSSV Spotlight & Thao Tác Trực Tiếp */}
      {detailUserModal && (
        <StudentProfileModal
          user={detailUserModal as any}
          isOpen={!!detailUserModal}
          onClose={() => setDetailUserModal(null)}
          canManage={true}
          onApprove={async (uId) => {
            await handleApprove(uId);
            setDetailUserModal(null);
          }}
          onReject={async (uId, reason) => {
            setActionError(null);
            try {
              await rejectUser({ userId: uId, reason });
              setDetailUserModal(null);
              setActionSuccess("Đã từ chối hồ sơ sinh viên và ghi lại lịch sử.");
              refetch();
              setTimeout(() => setActionSuccess(null), 2500);
            } catch (err) {
              setActionError("Lỗi từ chối hồ sơ: " + readApiError(err));
            }
          }}
        />
      )}

      {/* Modal Từ Chối Hồ Sơ */}
      {rejectUserModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="max-w-md w-full bg-[#11181c] border border-zinc-700 p-6 rounded-lg space-y-4 shadow-2xl">
            <h3 className="font-display font-bold text-lg text-rose-400 uppercase flex items-center gap-2">
              <UserX className="w-5 h-5" /> TỪ CHỐI HỒ SƠ SINH VIÊN
            </h3>
            <p className="font-mono text-xs text-zinc-300">
              Bạn đang từ chối hồ sơ của <strong>{rejectUserModal.fullName}</strong>. Vui lòng nhập lý do cụ thể:
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4 font-mono text-xs">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="VD: Ảnh thẻ sinh viên bị mờ, không rõ mã số hoặc không trùng khớp với họ tên đăng ký..."
                required
                rows={3}
                className="w-full bg-[#0b1013] border border-zinc-700 p-3 text-white rounded focus:border-amber-400 outline-none resize-none"
              />

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRejectUserModal(null)}
                  className="px-4 py-2 border border-zinc-700 text-zinc-400 hover:text-white rounded uppercase cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 text-white font-bold uppercase hover:bg-rose-500 transition-colors rounded cursor-pointer"
                >
                  Xác Nhận Từ Chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xóa User An Toàn */}
      {deleteUserModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="max-w-md w-full bg-[#11181c] border border-rose-500/50 p-6 rounded-lg space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="font-display font-bold text-lg uppercase text-white">XÓA TÀI KHOẢN NGƯỜI DÙNG</h3>
                <span className="font-mono text-[11px] text-rose-400 uppercase font-bold">HÀNH ĐỘNG NGUY HIỂM — KHÔNG THỂ HOÀN TÁC</span>
              </div>
            </div>

            <p className="font-mono text-xs text-zinc-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản <strong>{deleteUserModal.fullName}</strong> ({deleteUserModal.email}) khỏi hệ thống không?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setDeleteUserModal(null)}
                className="px-4 py-2 border border-zinc-700 text-zinc-400 hover:text-white rounded uppercase cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="px-5 py-2 bg-rose-600 text-white font-bold uppercase hover:bg-rose-500 transition-colors rounded cursor-pointer"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
