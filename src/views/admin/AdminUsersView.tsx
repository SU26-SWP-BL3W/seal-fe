"use client";

import React from "react";
import { Button, Card, Badge, Table, Input, Pagination } from "@/components/ui";
import {
  Search,
  UserCheck,
  UserX,
  Lock,
  Plus,
  RefreshCw,
  CheckCircle2,
  X,
  Building2,
  Eye,
  FileText,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { useAdminUsersViewModel } from "@/viewModels/admin/useAdminUsersViewModel";

export interface AdminUsersViewProps {
  mode?: "admin" | "coordinator";
}

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

export const AdminUsersView: React.FC<AdminUsersViewProps> = () => {
  const { state, data, pagination, actions } = useAdminUsersViewModel();

  const {
    searchTerm,
    roleFilter,
    statusFilter,
    detailUserModal,
    rejectUserModal,
    rejectReason,
    isLoading,
    createUserModalOpen,
    createUserError,
    createUserForm,
    editUserModal,
    editUserError,
    editUserForm,
    isCreatingUser,
    isUpdatingUser,
  } = state;

  const { usersList, filteredUsers, schoolsList } = data;
  const { currentPage: safePage, totalPages, pageSize: PAGE_SIZE, paginatedItems: pagedUsers, setCurrentPage } = pagination;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-6 py-8 space-y-6">
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-muted)] pb-6">
          <div>
            <HudLabel>QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG</HudLabel>
            <h1 className="font-display font-bold text-3xl text-[var(--color-danger)] uppercase tracking-wider mt-1">
              Quản Lý Danh Sách Tài Khoản
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
              Dành riêng cho System Admin: Quản lý phân quyền, duyệt hồ sơ thẻ sinh viên &amp; gán Event Coordinator.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => actions.setCreateUserModalOpen(true)}
              className="hud-clipped flex items-center gap-2 bg-[var(--accent-primary)] text-white hover:bg-white hover:text-[var(--bg-base)] font-mono text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> Tạo Tài Khoản
            </Button>
            <Link href="/admin/events/new">
              <Button variant="primary" className="hud-clipped flex items-center gap-2 bg-[var(--color-danger)] text-white hover:bg-white hover:text-[var(--bg-base)] font-mono text-xs font-bold">
                <Plus className="w-4 h-4" /> Tạo Sự Kiện Mới
              </Button>
            </Link>
            <Button variant="ghost" onClick={() => actions.refetch()} className="font-mono text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Làm mới
            </Button>
          </div>
        </div>

        {/* Filter Control Bar */}
        <Card className="p-4 bg-[var(--bg-panel)] border-[var(--border-muted)] hud-clipped space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase block font-bold">
                Tìm kiếm theo Tên / Email / Mã SV:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                <Input
                  type="text"
                  placeholder="Nhập từ khóa tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => actions.setSearchTerm(e.target.value)}
                  className="pl-9 w-full text-xs font-mono"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase block font-bold">
                Phân loại Vai trò (Role):
              </label>
              <select
                value={roleFilter}
                onChange={(e) => actions.setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs focus:outline-none focus:border-[var(--color-danger)] cursor-pointer"
              >
                <option value="all">Tất cả Vai trò (All Roles)</option>
                <option value="admin">System Admin</option>
                <option value="coordinator">Event Coordinator</option>
                <option value="judge">Giám Khảo</option>
                <option value="mentor">Mentor</option>
                <option value="student">Thí Sinh (Student)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase block font-bold">
                Trạng thái Duyệt Hồ sơ:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => actions.setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs focus:outline-none focus:border-[var(--color-danger)] cursor-pointer"
              >
                <option value="all">Tất cả Trạng thái</option>
                <option value="approved">Đã Phê Duyệt (Approved)</option>
                <option value="pending">Đang Chờ Duyệt (Pending)</option>
                <option value="locked">Bị Khóa Hồ Sơ (Locked)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Users Data Table */}
        <Card className="p-6 space-y-4 bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)]">
          <SectionTitle>DANH SÁCH TÀI KHOẢN HỆ THỐNG ({filteredUsers.length} / {usersList.length})</SectionTitle>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-[var(--color-danger)]" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center font-mono text-xs text-[var(--text-muted)]">
              Không tìm thấy tài khoản phù hợp với điều kiện tìm kiếm.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <th>HỌ VÀ TÊN / EMAIL</th>
                    <th>MÃ SV &amp; TRƯỜNG HỌC</th>
                    <th>VAI TRÒ (SYSTEM ROLE)</th>
                    <th>TRẠNG THÁI HỒ SƠ</th>
                    <th className="text-center">THAO TÁC XEM &amp; DUYỆT</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map((u) => {
                    const isLocked = (u.rejectionCount ?? 0) >= 2;
                    const userId = u.id || u.userId || "";
                    const userEmailLower = (u.email || "").toLowerCase();
                    const isStaffOrAdmin = u.isAdmin || userEmailLower.includes("admin") || userEmailLower.includes("ec.coordinator");

                    return (
                      <tr key={userId}>
                        <td>
                          <div className="font-mono font-bold text-sm text-[var(--text-primary)]">
                            {u.fullName || "User SEAL"}
                          </div>
                          <div className="font-mono text-xs text-[var(--color-danger)] font-bold">{u.email}</div>
                        </td>
                        <td>
                          <div className="font-mono text-xs text-[var(--text-primary)]">
                            {u.studentCode ? `MSSV: ${u.studentCode}` : (isStaffOrAdmin ? "Cán bộ Ban Tổ Chức" : "Chưa cập nhật")}
                          </div>
                          <div className="font-mono text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-[var(--text-muted)]" />
                            {u.schoolName || (u.isFpt ? "Đại học FPT" : "Trường Đối Tác")}
                          </div>
                        </td>
                        <td>
                          {u.isAdmin || userEmailLower.includes("admin") ? (
                            <Badge tone="danger">SYSTEM ADMIN</Badge>
                          ) : userEmailLower.includes("ec.coordinator") ? (
                            <Badge tone="coordinator">EVENT COORDINATOR</Badge>
                          ) : userEmailLower.includes("judge") ? (
                            <Badge tone="judge">GIÁM KHẢO</Badge>
                          ) : userEmailLower.includes("mentor") ? (
                            <Badge tone="warning">MENTOR</Badge>
                          ) : (
                            <Badge tone="team">THÍ SINH</Badge>
                          )}
                        </td>
                        <td>
                          {isLocked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-[rgba(239,68,68,0.1)] text-[var(--color-danger)] border border-[var(--color-danger)]/30">
                              <Lock className="w-3 h-3" /> KHÓA 2 GẬY
                            </span>
                          ) : u.isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-[rgba(16,185,129,0.1)] text-[var(--color-success)] border border-[var(--color-success)]/30">
                              ĐÃ PHÊ DUYỆT
                            </span>
                          ) : u.isRejected ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-[rgba(239,68,68,0.1)] text-[var(--color-danger)] border border-[var(--color-danger)]/30">
                              ✕ ĐÃ TỪ CHỐI
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-[rgba(245,158,11,0.1)] text-[var(--color-warning)] border border-[var(--color-warning)]/30">
                              ⏳ CHỜ DUYỆT THẺ
                            </span>
                          )}
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => actions.setDetailUserModal(u)}
                              className="text-xs font-mono border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
                            >
                              <Eye className="w-3.5 h-3.5" /> SOI CHI TIẾT
                            </Button>
                            {!isStaffOrAdmin && (
                              <Button
                                variant="ghost"
                                onClick={() => actions.setSelectedUserForEc(u)}
                                className="text-xs font-mono border-[var(--accent-coordinator)] text-[var(--accent-coordinator)] hover:bg-[var(--accent-coordinator)]/10"
                              >
                                <UserCheck className="w-3.5 h-3.5" /> Gán EC
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card>

        {/* Modal 1: Xem Chi Tiết Đầy Đủ Hồ Sơ User */}
        {detailUserModal && (() => {
          const userEmailLower = (detailUserModal.email || "").toLowerCase();
          const isStaffOrAdmin = detailUserModal.isAdmin || userEmailLower.includes("admin") || userEmailLower.includes("ec.coordinator") || userEmailLower.includes("judge") || userEmailLower.includes("mentor");

          return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
              <Card className="w-full max-w-2xl bg-[var(--bg-panel)] border border-[var(--color-danger)] hud-clipped p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
                <button
                  type="button"
                  onClick={() => actions.setDetailUserModal(null)}
                  className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="border-b border-[var(--border-muted)] pb-4">
                  <HudLabel>
                    {isStaffOrAdmin ? "THÔNG TIN TÀI KHOẢN NHÂN SỰ & CHUYÊN GIA" : "THÔNG TIN THẺ SINH VIÊN TÀI KHOẢN"}
                  </HudLabel>
                  <h3 className="font-display font-bold text-xl text-[var(--text-primary)] uppercase tracking-wider mt-1">
                    {detailUserModal.fullName}
                  </h3>
                  <p className="font-mono text-xs text-[var(--accent-primary)]">Email: {detailUserModal.email}</p>
                </div>

                {isStaffOrAdmin ? (
                  <div className="space-y-6 font-mono text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2.5 p-4 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">1. Thông tin cá nhân &amp; Vai trò:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--text-muted)]">Vai trò hệ thống:</span>
                          {detailUserModal.isAdmin || userEmailLower.includes("admin") ? (
                            <Badge tone="danger">SYSTEM ADMIN</Badge>
                          ) : userEmailLower.includes("ec.coordinator") ? (
                            <Badge tone="coordinator">EVENT COORDINATOR</Badge>
                          ) : userEmailLower.includes("judge") ? (
                            <Badge tone="judge">GIÁM KHẢO</Badge>
                          ) : (
                            <Badge tone="warning">MENTOR</Badge>
                          )}
                        </div>
                        <div>Đơn vị công tác: <strong className="text-[var(--text-primary)]">{detailUserModal.schoolName || "Ban Tổ Chức System"}</strong></div>
                        <div>Mã số quản trị: <strong className="text-[var(--accent-primary)]">{detailUserModal.id || detailUserModal.userId || "STAFF-01"}</strong></div>
                      </div>

                      <div className="space-y-2.5 p-4 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">2. Trạng thái phân quyền:</span>
                        <div>Trạng thái hoạt động: <span className="text-[var(--color-success)] font-bold">TÀI KHOẢN KÍCH HOẠT HỢP LỆ</span></div>
                        <div>Quyền truy cập: <span className="text-[var(--accent-team)] font-semibold">Bảng điều hành &amp; Control Center</span></div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-muted)]">
                      <Button variant="ghost" onClick={() => actions.setDetailUserModal(null)} className="font-mono text-xs border border-[var(--border-muted)] px-4">
                        ĐÓNG
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => actions.openEditUserModal(detailUserModal)}
                        className="font-mono text-xs flex items-center gap-1.5"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Sửa Thông Tin
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 font-mono text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">1. Thông tin sinh viên &amp; Trường:</span>
                        <div>Mã SV: <strong className="text-[var(--text-primary)]">{detailUserModal.studentCode || "Chưa cập nhật"}</strong></div>
                        <div>Trường học: <strong className="text-[var(--text-primary)]">{detailUserModal.schoolName || (detailUserModal.isFpt ? "Đại học FPT" : "Chưa chọn trường")}</strong></div>
                        <div>Xác minh FPT: <strong className="text-[var(--accent-team)]">{detailUserModal.isFpt ? "SV FPT (Tự động)" : "SV Non-FPT (Cần duyệt thẻ)"}</strong></div>
                        <div>Ngày đăng ký: <strong className="text-[var(--text-muted)]">{detailUserModal.createdTime ? new Date(detailUserModal.createdTime).toLocaleDateString("vi-VN") : "Hôm nay"}</strong></div>
                      </div>

                      <div className="space-y-2 p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped">
                        <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">2. Trạng thái &amp; Lịch sử duyệt thẻ:</span>
                        <div>Số lần bị từ chối: <strong className={detailUserModal.rejectionCount && detailUserModal.rejectionCount >= 2 ? "text-[var(--color-danger)] font-bold" : "text-[var(--color-success)]"}>{detailUserModal.rejectionCount ?? 0} / 2 lần</strong></div>
                        {detailUserModal.rejectionReason && (
                          <div className="p-2 bg-[rgba(239,68,68,0.1)] border border-[var(--color-danger)]/30 text-[10px] text-[var(--color-danger)]">
                            Lý do từ chối trước: {detailUserModal.rejectionReason}
                          </div>
                        )}
                        <div>Trạng thái hiện tại: {detailUserModal.isApproved ? (
                          <span className="text-[var(--color-success)] font-bold">ĐÃ PHÊ DUYỆT HỒ SƠ</span>
                        ) : (
                          <span className="text-[var(--color-warning)] font-bold">⏳ ĐANG CHỜ PHÊ DUYỆT</span>
                        )}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="font-mono text-xs text-[var(--accent-primary)] font-bold uppercase block">
                        3. Ảnh Chụp Thẻ Sinh Viên Thực Tế (Physical Student Card Inspection):
                      </span>
                      <div className="w-full h-56 bg-black border border-[var(--border-muted)] hud-clipped flex items-center justify-center relative overflow-hidden group">
                        {detailUserModal.photoStudentCardUrl ? (
                          <img
                            src={detailUserModal.photoStudentCardUrl}
                            alt="Thẻ Sinh Viên"
                            className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-center font-mono text-xs text-[var(--text-muted)] space-y-2">
                            <FileText className="w-10 h-10 text-[var(--accent-primary)] mx-auto opacity-50" />
                            <p>[ Chưa Upload Ảnh Thẻ Sinh Viên HD: {detailUserModal.fullName} ]</p>
                            <p className="text-[10px] opacity-70">Mặt trước thẻ SV có khớp với Họ tên &amp; Mã số SV không?</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--border-muted)]">
                      <Button variant="ghost" onClick={() => actions.setDetailUserModal(null)} className="font-mono text-xs">
                        Đóng
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => actions.openEditUserModal(detailUserModal)}
                          className="font-mono text-xs flex items-center gap-1.5"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Sửa
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            actions.setRejectUserModal({
                              userId: detailUserModal.id || detailUserModal.userId || "",
                              fullName: detailUserModal.fullName || "User",
                            });
                          }}
                          className="font-mono text-xs text-[var(--color-danger)] border-[var(--color-danger)]/40 hover:bg-[var(--color-danger)]/10"
                        >
                          <UserX className="w-3.5 h-3.5" /> Từ Chối Hồ Sơ
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => actions.handleApprove(detailUserModal.id || detailUserModal.userId || "")}
                          className="font-mono text-xs bg-[var(--color-success)] text-white hover:bg-white hover:text-black font-bold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Phê Duyệt Hồ Sơ
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          );
        })()}

        {/* Modal 2: Form Nhập Lý Do Từ Chối Hồ Sơ */}
        {rejectUserModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <Card className="w-full max-w-md bg-[var(--bg-panel)] border border-[var(--color-danger)] hud-clipped p-6 space-y-4 relative">
              <button
                type="button"
                onClick={() => actions.setRejectUserModal(null)}
                className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg text-[var(--color-danger)] uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Từ Chối Hồ Sơ Thẻ Sinh Viên
                </h3>
                <p className="font-mono text-xs text-[var(--text-muted)]">
                  Nhập lý do chi tiết từ chối hồ sơ của <strong className="text-white">{rejectUserModal.fullName}</strong>. Thông báo kèm lý do sẽ được gửi trực tiếp tới email tài khoản.
                </p>
              </div>

              <form onSubmit={actions.handleRejectSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                    Lý do từ chối (Ghi rõ nguyên nhân để sinh viên sửa lại) *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="VD: Ảnh chụp thẻ sinh viên bị mờ nét, không nhìn rõ mã số sinh viên hoặc không phải thẻ chính chủ..."
                    value={rejectReason}
                    onChange={(e) => actions.setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs focus:outline-none focus:border-[var(--color-danger)] resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" type="button" onClick={() => actions.setRejectUserModal(null)}>
                    Hủy Bỏ
                  </Button>
                  <Button variant="primary" type="submit" className="bg-[var(--color-danger)] text-white font-mono text-xs font-bold">
                    Xác Nhận Từ Chối
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {filteredUsers.length > 0 && (
          <div className="p-4 border-t border-[var(--border-muted)]">
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={filteredUsers.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemLabel="người dùng"
            />
          </div>
        )}

        {/* Modal 4: Tạo Tài Khoản Thủ Công */}
        {createUserModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <Card className="w-full max-w-lg bg-[var(--bg-panel)] border border-[var(--accent-primary)] hud-clipped p-6 space-y-4 relative">
              <button
                type="button"
                onClick={() => actions.setCreateUserModalOpen(false)}
                className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[var(--accent-primary)]" /> Tạo Tài Khoản Mới
                </h3>
                <p className="font-mono text-xs text-[var(--text-muted)]">
                  Admin tạo trực tiếp — tài khoản được duyệt &amp; xác thực email ngay, không cần luồng đăng ký.
                </p>
              </div>

              {createUserError && (
                <div className="p-3 bg-[rgba(239,68,68,0.1)] border border-[var(--color-danger)]/40 text-[var(--color-danger)] font-mono text-xs">
                  {createUserError}
                </div>
              )}

              <form onSubmit={actions.handleCreateUserSubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Email *</label>
                    <Input
                      type="email"
                      required
                      value={createUserForm.email}
                      onChange={(e) => actions.setCreateUserForm({ ...createUserForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Mật khẩu *</label>
                    <Input
                      type="text"
                      required
                      minLength={6}
                      value={createUserForm.password}
                      onChange={(e) => actions.setCreateUserForm({ ...createUserForm, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Họ và Tên *</label>
                  <Input
                    type="text"
                    required
                    value={createUserForm.fullName}
                    onChange={(e) => actions.setCreateUserForm({ ...createUserForm, fullName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Trường học *</label>
                    <select
                      required
                      value={createUserForm.schoolId}
                      onChange={(e) => actions.setCreateUserForm({ ...createUserForm, schoolId: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs"
                    >
                      <option value="">-- Chọn trường --</option>
                      {schoolsList.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.schoolName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Mã SV (nếu là SV)</label>
                    <Input
                      type="text"
                      value={createUserForm.studentCode}
                      onChange={(e) => actions.setCreateUserForm({ ...createUserForm, studentCode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 font-mono text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createUserForm.isStudent}
                      onChange={(e) => actions.setCreateUserForm({ ...createUserForm, isStudent: e.target.checked })}
                    />
                    Là sinh viên (Thí sinh)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createUserForm.isAdmin}
                      onChange={(e) => actions.setCreateUserForm({ ...createUserForm, isAdmin: e.target.checked })}
                    />
                    Cấp quyền System Admin
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" type="button" onClick={() => actions.setCreateUserModalOpen(false)}>
                    Hủy Bỏ
                  </Button>
                  <Button variant="primary" type="submit" disabled={isCreatingUser}>
                    {isCreatingUser ? "Đang tạo..." : "Tạo Tài Khoản"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Modal 5: Sửa Thông Tin Tài Khoản */}
        {editUserModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <Card className="w-full max-w-lg bg-[var(--bg-panel)] border border-[var(--accent-primary)] hud-clipped p-6 space-y-4 relative">
              <button
                type="button"
                onClick={() => actions.setEditUserModal(null)}
                className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-[var(--accent-primary)]" /> Sửa Tài Khoản
                </h3>
                <p className="font-mono text-xs text-[var(--accent-primary)]">{editUserModal.email}</p>
              </div>

              {editUserError && (
                <div className="p-3 bg-[rgba(239,68,68,0.1)] border border-[var(--color-danger)]/40 text-[var(--color-danger)] font-mono text-xs">
                  {editUserError}
                </div>
              )}

              <form onSubmit={actions.handleEditUserSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Họ và Tên *</label>
                  <Input
                    type="text"
                    required
                    value={editUserForm.fullName}
                    onChange={(e) => actions.setEditUserForm({ ...editUserForm, fullName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Trường học *</label>
                    <select
                      required
                      value={editUserForm.schoolId}
                      onChange={(e) => actions.setEditUserForm({ ...editUserForm, schoolId: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs"
                    >
                      <option value="">-- Chọn trường --</option>
                      {schoolsList.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.schoolName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Mã SV</label>
                    <Input
                      type="text"
                      value={editUserForm.studentCode}
                      onChange={(e) => actions.setEditUserForm({ ...editUserForm, studentCode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 font-mono text-xs pt-1 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editUserForm.isStudent}
                      onChange={(e) => actions.setEditUserForm({ ...editUserForm, isStudent: e.target.checked })}
                    />
                    Là sinh viên
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editUserForm.isAdmin}
                      onChange={(e) => actions.setEditUserForm({ ...editUserForm, isAdmin: e.target.checked })}
                    />
                    System Admin
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editUserForm.isApproved}
                      onChange={(e) => actions.setEditUserForm({ ...editUserForm, isApproved: e.target.checked })}
                    />
                    Đã phê duyệt
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" type="button" onClick={() => actions.setEditUserModal(null)}>
                    Hủy Bỏ
                  </Button>
                  <Button variant="primary" type="submit" disabled={isUpdatingUser}>
                    {isUpdatingUser ? "Đang lưu..." : "Lưu Thay Đổi"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};
