"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useGetUsers, useApproveUser, useRejectUser } from "@/repositories/usersRepository";
import {
  Search,
  RefreshCw,
  CheckCircle2,
  Lock,
  Eye,
  AlertTriangle,
  UserX,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import type { User } from "@/models/entities";
import { readApiError } from "@/repositories/submitResultsRepository";
import { StudentProfileModal } from "@/components/domain/StudentProfileModal";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/ui/Pagination";

export const CoordinatorProfilesView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals state
  const [detailUserModal, setDetailUserModal] = useState<User | null>(null);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: rawUsersData, isLoading, refetch } = useGetUsers({ pageSize: 500 });
  const usersList: User[] = useMemo(() => {
    const list = rawUsersData?.data ?? (Array.isArray(rawUsersData) ? rawUsersData : []);
    return Array.isArray(list) ? list : [];
  }, [rawUsersData]);

  const { mutateAsync: approveUser } = useApproveUser();
  const { mutateAsync: rejectUser } = useRejectUser();

  // Helper: Check if user has card submission (studentCode OR photoStudentCardUrl)
  const hasCardSubmission = (u: User) => {
    const hasStudentCode = Boolean(u.studentCode && u.studentCode.trim() !== "");
    const hasPhotoCardUrl = Boolean(
      (u as any).photoStudentCardUrl && (u as any).photoStudentCardUrl.trim() !== ""
    );
    return hasStudentCode || hasPhotoCardUrl;
  };

  // Filtered Candidate Students List
  const filteredCandidates = useMemo(() => {
    return usersList.filter((u) => {
      const emailLower = (u.email || "").toLowerCase();

      // Only candidate student accounts
      const isStudentRole =
        !u.isAdmin &&
        !emailLower.includes("admin") &&
        !emailLower.includes("ec.") &&
        !emailLower.includes("coordinator") &&
        !emailLower.includes("judge") &&
        !emailLower.includes("mentor");

      if (!isStudentRole) return false;

      // Must have card submission for EC inspection
      if (!hasCardSubmission(u)) return false;

      // Search term
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        (u.fullName || "").toLowerCase().includes(searchLower) ||
        (u.email || "").toLowerCase().includes(searchLower) ||
        (u.studentCode || "").toLowerCase().includes(searchLower) ||
        (u.schoolName || "").toLowerCase().includes(searchLower);

      // Status filter
      let matchesStatus = true;
      if (statusFilter === "approved") matchesStatus = !!u.isApproved;
      else if (statusFilter === "pending") matchesStatus = !u.isApproved && (u.rejectionCount ?? 0) < 2;
      else if (statusFilter === "locked") matchesStatus = (u.rejectionCount ?? 0) >= 2;

      return matchesSearch && matchesStatus;
    });
  }, [usersList, searchTerm, statusFilter]);

  const {
    paginatedItems: paginatedCandidates,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setCurrentPage,
    setPageSize,
  } = usePagination(filteredCandidates, 8);

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

  const handleReject = async (userId: string, reason: string) => {
    setActionError(null);
    try {
      await rejectUser({ userId, reason });
      setActionSuccess("Đã từ chối hồ sơ sinh viên và ghi nhận lịch sử.");
      refetch();
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err) {
      setActionError("Lỗi từ chối hồ sơ: " + readApiError(err));
    }
  };

  const isCoordinatorAccess = Boolean(currentUser);

  if (!isCoordinatorAccess) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#0e1417] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#080f11] border border-[#ef4444] p-8 text-center glow-box-red relative space-y-4">
          <div className="w-12 h-12 bg-[#ef4444]/10 border border-[#ef4444] rounded-full flex items-center justify-center mx-auto text-[#ef4444]">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold uppercase text-[#ef4444]">
            YÊU CẦU QUYỀN TRUY CẬP
          </h2>
          <p className="font-mono text-xs text-[#bbc9ce] leading-relaxed">
            Trang duyệt hồ sơ thẻ sinh viên dành riêng cho Ban Tổ Chức (Event Coordinator).
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#090e11] text-[#dde4e6] font-sans py-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
          <div>
            <div className="font-mono text-[11px] text-cyan-400 mb-1 uppercase tracking-wider">
              BAN TỔ CHỨC / DUYỆT &amp; QUẢN LÝ HỒ SƠ THÍ SINH
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase">
              DANH SÁCH THÍ SINH &amp; DUYỆT THẺ SINH VIÊN
            </h1>
            <p className="text-xs text-zinc-400 font-sans mt-1">
              Tra cứu danh sách sinh viên, xem ảnh thẻ 3x4, kiểm tra MSSV và phê duyệt/từ chối hồ sơ đăng ký tham gia cuộc thi.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/coordinator/dashboard">
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

        {/* Action Notifications */}
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

        {/* Filter Bar */}
        <div className="bg-[#10171a] border border-zinc-800 p-4 rounded-lg space-y-3.5 shadow-sm">
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
              Kết quả: <strong className="text-white">{filteredCandidates.length}</strong> / {usersList.length} thí sinh
            </span>
          </div>

          <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-800/80 text-xs font-mono">
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
        </div>

        {/* Candidates Table (No Role Column, No Inline Quick Action Buttons) */}
        <div className="bg-[#10171a] border border-zinc-800 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#131d21]">
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              DANH SÁCH THÍ SINH &amp; DUYỆT THẺ SINH VIÊN ({filteredCandidates.length})
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center font-mono text-xs text-zinc-400 animate-pulse">
              Đang truy vấn cơ sở dữ liệu sinh viên...
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="p-12 text-center font-mono text-xs text-zinc-400">
              Không tìm thấy hồ sơ sinh viên nào phù hợp với bộ lọc tìm kiếm.
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
                    <th className="py-3 px-4 text-center">HỒ SƠ SV</th>
                    <th className="py-3 px-4 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {paginatedCandidates.map((u, idx) => {
                    const userId = u.id || (u as any).Id || u.userId || "";
                    const isLocked = (u.rejectionCount ?? 0) >= 2;
                    const isApproved = !!u.isApproved;

                    return (
                      <tr key={userId || idx} className="hover:bg-[#141e22] transition-colors">
                        <td className="py-3.5 px-4 text-zinc-500 text-center">{(currentPage - 1) * pageSize + idx + 1}</td>
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
                          {isLocked ? (
                            <span className="px-2 py-0.5 bg-rose-950/40 text-rose-300 border border-rose-500/30 rounded font-bold text-[10px]">
                              KHÓA ({u.rejectionCount})
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
                            <button
                              onClick={() => setDetailUserModal(u)}
                              className="px-2.5 py-1 bg-[#141f23] border border-zinc-700 hover:border-amber-400 hover:text-white text-zinc-300 font-mono text-xs rounded transition-all cursor-pointer flex items-center gap-1.5"
                              title="Xem ảnh 3x4, MSSV & Phê duyệt/Từ chối"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Xem &amp; Duyệt</span>
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

          {filteredCandidates.length > 0 && (
            <div className="p-4 border-t border-zinc-800">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemLabel="thí sinh"
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal View Detail 3x4 Photo & MSSV Inspection */}
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
            await handleReject(uId, reason);
            setDetailUserModal(null);
          }}
        />
      )}
    </div>
  );
};
