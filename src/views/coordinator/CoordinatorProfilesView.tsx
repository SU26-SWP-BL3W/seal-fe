"use client";

import React from "react";
import { Search, RefreshCw, CheckCircle2, Lock, Eye } from "lucide-react";
import { Link } from "@/i18n/routing";
import { StudentProfileModal } from "@/components/domain/StudentProfileModal";
import { Pagination } from "@/components/ui/Pagination";
import { useCoordinatorProfilesViewModel } from "@/viewModels/coordinator/useCoordinatorProfilesViewModel";

export const CoordinatorProfilesView: React.FC = () => {
  const { state, data, pagination, actions } = useCoordinatorProfilesViewModel();

  const {
    searchTerm,
    statusFilter,
    detailUserModal,
    actionSuccess,
    actionError,
    isLoading,
    isCoordinatorAccess,
  } = state;

  const { usersList, filteredCandidates } = data;
  const { paginatedItems: paginatedCandidates, currentPage, totalPages, totalItems, pageSize, setCurrentPage, setPageSize } = pagination;

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
              onClick={() => actions.refetch()}
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
                onChange={(e) => actions.setSearchTerm(e.target.value)}
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
              onClick={() => actions.setStatusFilter("all")}
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
              onClick={() => actions.setStatusFilter("approved")}
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
              onClick={() => actions.setStatusFilter("pending")}
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
              onClick={() => actions.setStatusFilter("locked")}
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

        {/* Candidates Table */}
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
                            onClick={() => actions.setDetailUserModal(u)}
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
                              onClick={() => actions.setDetailUserModal(u)}
                              className="px-2.5 py-1 bg-[#141f23] border border-zinc-700 hover:border-amber-400 hover:text-white text-zinc-300 font-mono text-xs rounded transition-all cursor-pointer flex items-center gap-1.5"
                              title="Xem ảnh 3x4, MSSV &amp; Phê duyệt/Từ chối"
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
          onClose={() => actions.setDetailUserModal(null)}
          canManage={true}
          onApprove={async (uId) => {
            await actions.handleApprove(uId);
            actions.setDetailUserModal(null);
          }}
          onReject={async (uId, reason) => {
            await actions.handleReject(uId, reason);
            actions.setDetailUserModal(null);
          }}
        />
      )}
    </div>
  );
};
