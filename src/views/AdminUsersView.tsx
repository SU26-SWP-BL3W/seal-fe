"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useGetUsers, useApproveUser, useRejectUser, useDeleteUser } from "@/repositories/usersRepository";
import {
  Users,
  Search,
  Lock,
  RefreshCw,
  CheckCircle2,
  Eye,
  AlertTriangle,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import type { User } from "@/models/entities";
import { readApiError } from "@/repositories/submitResultsRepository";
import { StudentProfileModal } from "@/components/domain/StudentProfileModal";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, Badge, Card, Input, EmptyState } from "@/components/ui";

export interface AdminUsersViewProps {
  mode?: "admin" | "coordinator";
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-[var(--accent-coordinator)]/15 text-[var(--accent-coordinator)]"
          : "text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]"
      }`}
    >
      {children}
    </button>
  );
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ mode = "admin" }) => {
  const { user: currentUser } = useAuth();
  const isCoordinator = mode === "coordinator" || (!currentUser?.isAdmin && !currentUser?.IsAdmin);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState(isCoordinator ? "student" : "all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

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

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const hasCardSubmission = (u: User) => {
    const hasStudentCode = Boolean(u.studentCode && u.studentCode.trim() !== "");
    const hasPhotoCardUrl = Boolean(
      (u as any).photoStudentCardUrl && (u as any).photoStudentCardUrl.trim() !== ""
    );
    return hasStudentCode || hasPhotoCardUrl;
  };

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        (u.fullName || "").toLowerCase().includes(searchLower) ||
        (u.email || "").toLowerCase().includes(searchLower) ||
        (u.studentCode || "").toLowerCase().includes(searchLower) ||
        (u.schoolName || "").toLowerCase().includes(searchLower);

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

      let matchesStatus = true;
      if (statusFilter === "approved") matchesStatus = !!u.isApproved;
      else if (statusFilter === "pending") matchesStatus = !u.isApproved && (u.rejectionCount ?? 0) < 2;
      else if (statusFilter === "locked") matchesStatus = (u.rejectionCount ?? 0) >= 2;

      let matchesCardSubmission = true;
      if (isCoordinator) {
        matchesCardSubmission = hasCardSubmission(u);
      }

      return matchesSearch && matchesRole && matchesStatus && matchesCardSubmission;
    });
  }, [usersList, searchTerm, roleFilter, statusFilter, isCoordinator]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedUsers = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, safePage]);

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

    if (targetId === currentUser?.id || targetId === currentUser?.userId) {
      alert("CẢNH BÁO AN TOÀN: Bạn không thể tự xóa tài khoản của chính mình!");
      setDeleteUserModal(null);
      return;
    }

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
      <PageShell className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="max-w-md space-y-4 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-danger)] bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-semibold text-[var(--color-danger)]">
            Yêu cầu quyền truy cập
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Khu vực duyệt và quản lý danh sách hồ sơ chỉ dành cho Ban Tổ Chức và Quản trị viên.
          </p>
          <Link href="/login">
            <Button variant="primary" accent="primary" className="w-full">
              Đến trang đăng nhập
            </Button>
          </Link>
        </Card>
      </PageShell>
    );
  }

  const isCoordinatorView = isCoordinator;
  const dashboardUrl = isCoordinatorView ? "/coordinator/dashboard" : "/admin/dashboard";

  return (
    <PageShell className="min-h-[calc(100vh-4rem)] space-y-6">
      <PageHeader
        title={isCoordinatorView ? "Danh sách thí sinh" : "Quản lý người dùng"}
        description={
          isCoordinatorView
            ? "Tra cứu sinh viên, xem ảnh thẻ, kiểm tra MSSV và phê duyệt hoặc từ chối hồ sơ đăng ký."
            : "Quản lý tài khoản admin, điều phối viên, giám khảo, cố vấn và sinh viên trong hệ thống."
        }
        breadcrumb={
          <nav className="text-xs text-[var(--text-muted)]">
            <Link href={dashboardUrl} className="hover:text-[var(--accent-coordinator)]">
              {isCoordinatorView ? "Coordinator" : "Admin"}
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-[var(--text-primary)]">Người dùng</span>
          </nav>
        }
        actions={
          <>
            <Link href={dashboardUrl}>
              <Button variant="secondary" accent="coordinator">
                Bảng điều hành
              </Button>
            </Link>
            <Button variant="ghost" accent="coordinator" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
          </>
        }
      />

      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 p-3 text-sm text-[var(--color-success)]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]">
          {actionError}
        </div>
      )}

      <Card className="space-y-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              type="search"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm họ tên, email, mã SV..."
              className="pl-9"
            />
          </div>
          <span className="text-sm text-[var(--text-muted)]">
            Kết quả: <strong className="text-[var(--text-primary)]">{filteredUsers.length}</strong> / {usersList.length}
          </span>
        </div>

        <div className="space-y-3 border-t border-[var(--border-muted)] pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-[var(--text-muted)]">Trạng thái:</span>
            <FilterPill active={statusFilter === "all"} onClick={() => handleStatusFilterChange("all")}>
              Tất cả
            </FilterPill>
            <FilterPill active={statusFilter === "approved"} onClick={() => handleStatusFilterChange("approved")}>
              Đã duyệt
            </FilterPill>
            <FilterPill active={statusFilter === "pending"} onClick={() => handleStatusFilterChange("pending")}>
              Chờ phê duyệt
            </FilterPill>
            <FilterPill active={statusFilter === "locked"} onClick={() => handleStatusFilterChange("locked")}>
              Tạm khóa (≥2 lần)
            </FilterPill>
          </div>

          {!isCoordinatorView && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-medium text-[var(--text-muted)]">Vai trò:</span>
              <FilterPill active={roleFilter === "all"} onClick={() => handleRoleFilterChange("all")}>
                Tất cả
              </FilterPill>
              <FilterPill active={roleFilter === "student"} onClick={() => handleRoleFilterChange("student")}>
                Sinh viên
              </FilterPill>
              <FilterPill active={roleFilter === "judge"} onClick={() => handleRoleFilterChange("judge")}>
                Giám khảo
              </FilterPill>
              <FilterPill active={roleFilter === "mentor"} onClick={() => handleRoleFilterChange("mentor")}>
                Cố vấn
              </FilterPill>
              <FilterPill active={roleFilter === "coordinator"} onClick={() => handleRoleFilterChange("coordinator")}>
                Điều phối viên
              </FilterPill>
            </div>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-[var(--border-muted)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Danh sách tài khoản ({filteredUsers.length})
          </h2>
        </div>

        {isLoading ? (
          <EmptyState
            icon={RefreshCw}
            title="Đang tải dữ liệu"
            description="Đang truy vấn cơ sở dữ liệu người dùng..."
          />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Không tìm thấy người dùng"
            description="Không có người dùng phù hợp với bộ lọc tìm kiếm."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] table-fixed text-left text-sm">
              <thead className="border-b border-[var(--border-muted)] bg-[var(--bg-base)]">
                <tr>
                  <th className="w-12 px-4 py-3 text-center text-xs font-medium text-[var(--text-muted)]">#</th>
                  <th className="w-[22%] px-4 py-3 text-xs font-medium text-[var(--text-muted)]">Họ và tên</th>
                  <th className="w-[24%] px-4 py-3 text-xs font-medium text-[var(--text-muted)]">Email</th>
                  <th className="w-[18%] px-4 py-3 text-xs font-medium text-[var(--text-muted)]">Trường</th>
                  <th className="w-[10%] px-4 py-3 text-center text-xs font-medium text-[var(--text-muted)]">Vai trò</th>
                  <th className="w-[12%] px-4 py-3 text-center text-xs font-medium text-[var(--text-muted)]">Hồ sơ SV</th>
                  <th className="w-[14%] px-4 py-3 text-right text-xs font-medium text-[var(--text-muted)]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-muted)]/60">
                {paginatedUsers.map((u, idx) => {
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
                    <tr key={userId || idx} className="transition-colors hover:bg-[var(--bg-input)]/50">
                      <td className="px-4 py-3 text-center text-[var(--text-muted)]">
                        {(safePage - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="truncate px-4 py-3 font-medium text-[var(--text-primary)]">
                        <button
                          type="button"
                          onClick={() => setDetailUserModal(u)}
                          className="cursor-pointer truncate text-left hover:text-[var(--accent-coordinator)]"
                          title={u.fullName || "Chưa cập nhật"}
                        >
                          {u.fullName || "Chưa cập nhật"}
                        </button>
                      </td>
                      <td className="truncate px-4 py-3 text-[var(--text-muted)]" title={u.email}>
                        {u.email}
                      </td>
                      <td className="truncate px-4 py-3 text-[var(--text-muted)]">
                        {u.schoolName || (u.isFpt ? "FPT University" : "N/A")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isAdm ? (
                          <Badge tone="danger">Admin</Badge>
                        ) : isCoord ? (
                          <Badge tone="coordinator">Coord</Badge>
                        ) : isJudge ? (
                          <Badge tone="judge">Judge</Badge>
                        ) : isMentor ? (
                          <Badge tone="mentor">Mentor</Badge>
                        ) : (
                          <Badge tone="team">Student</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isStaff ? (
                          <span className="text-xs italic text-[var(--text-muted)]">— Cán bộ</span>
                        ) : isLocked ? (
                          <Badge tone="danger">Khóa ({u.rejectionCount})</Badge>
                        ) : !isFptUser && !hasCard ? (
                          <Badge tone="warning">Thiếu ảnh thẻ</Badge>
                        ) : isApproved ? (
                          <Badge tone="success">Đã duyệt</Badge>
                        ) : (
                          <Badge tone="warning">Chờ duyệt</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5 whitespace-nowrap">
                          {!isApproved && !isStaff && (
                            <>
                              <Button
                                variant="ghost"
                                accent="coordinator"
                                onClick={() => handleApprove(userId)}
                                className="h-8 px-2.5 text-xs"
                              >
                                Duyệt
                              </Button>
                              <Button
                                variant="ghost"
                                accent="primary"
                                onClick={() =>
                                  setRejectUserModal({ userId, fullName: u.fullName || u.email || "Sinh viên" })
                                }
                                className="h-8 px-2.5 text-xs"
                              >
                                Từ chối
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            accent="coordinator"
                            onClick={() => setDetailUserModal(u)}
                            className="h-8 w-8 p-0"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {!isAdm && (currentUser?.isAdmin || currentUser?.IsAdmin) && (
                            <Button
                              variant="ghost"
                              accent="primary"
                              onClick={() => setDeleteUserModal(u)}
                              className="h-8 w-8 p-0"
                              title="Xóa người dùng"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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

        {filteredUsers.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--border-muted)] px-4 py-4 text-xs text-[var(--text-muted)] sm:flex-row">
            <div>
              Hiển thị{" "}
              <span className="font-medium text-[var(--text-primary)]">
                {(safePage - 1) * PAGE_SIZE + 1}
              </span>
              {" – "}
              <span className="font-medium text-[var(--text-primary)]">
                {Math.min(safePage * PAGE_SIZE, filteredUsers.length)}
              </span>
              {" / "}
              <span className="font-medium text-[var(--accent-coordinator)]">
                {filteredUsers.length}
              </span>{" "}
              người dùng (tối đa {PAGE_SIZE}/trang)
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  accent="coordinator"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="h-8 px-2.5 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Trước
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  if (
                    totalPages > 7 &&
                    p !== 1 &&
                    p !== totalPages &&
                    Math.abs(p - safePage) > 1
                  ) {
                    if (p === 2 || p === totalPages - 1) {
                      return (
                        <span key={p} className="select-none px-1 text-[var(--text-muted)]">
                          …
                        </span>
                      );
                    }
                    return null;
                  }

                  const isActivePage = p === safePage;
                  return (
                    <Button
                      key={p}
                      variant={isActivePage ? "primary" : "ghost"}
                      accent="coordinator"
                      onClick={() => setCurrentPage(p)}
                      className="h-8 w-8 px-0 text-xs"
                    >
                      {p}
                    </Button>
                  );
                })}

                <Button
                  variant="ghost"
                  accent="coordinator"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="h-8 px-2.5 text-xs"
                >
                  Sau
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

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

      {rejectUserModal && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-md space-y-4 p-6">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-[var(--color-danger)]">
              Từ chối hồ sơ sinh viên
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              Bạn đang từ chối hồ sơ của <strong>{rejectUserModal.fullName}</strong>. Vui lòng nhập lý do cụ thể:
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="VD: Ảnh thẻ sinh viên bị mờ, không rõ mã số hoặc không trùng khớp với họ tên đăng ký..."
                required
                rows={3}
                className="w-full resize-none rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
              />

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setRejectUserModal(null)}>
                  Hủy bỏ
                </Button>
                <Button type="submit" variant="primary" accent="primary">
                  Xác nhận từ chối
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {deleteUserModal && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-md space-y-4 border-[var(--color-danger)]/50 p-6">
            <div className="flex items-center gap-3 text-[var(--color-danger)]">
              <AlertTriangle className="h-8 w-8 shrink-0" />
              <div>
                <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                  Xóa tài khoản người dùng
                </h3>
                <span className="text-xs text-[var(--color-danger)]">
                  Hành động nguy hiểm — không thể hoàn tác
                </span>
              </div>
            </div>

            <p className="text-sm text-[var(--text-muted)]">
              Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản{" "}
              <strong>{deleteUserModal.fullName}</strong> ({deleteUserModal.email}) khỏi hệ thống không?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setDeleteUserModal(null)}>
                Hủy bỏ
              </Button>
              <Button type="button" variant="primary" accent="primary" onClick={handleDeleteUser}>
                Xác nhận xóa
              </Button>
            </div>
          </Card>
        </div>
      )}
    </PageShell>
  );
};
