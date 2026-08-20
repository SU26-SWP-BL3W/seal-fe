"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  useGetSchools,
  useCreateSchool,
  useUpdateSchool,
  useDeleteSchool,
} from "@/repositories/schoolsRepository";
import {
  School as SchoolIcon,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  X,
  Lock,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, Badge, Card, Input, EmptyState } from "@/components/ui";

export const AdminSchoolsView: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolCode, setNewSchoolCode] = useState("");
  const [newSchoolAddress, setNewSchoolAddress] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any | null>(null);
  const [editSchoolName, setEditSchoolName] = useState("");
  const [editSchoolCode, setEditSchoolCode] = useState("");
  const [editSchoolAddress, setEditSchoolAddress] = useState("");

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: rawSchools = [], isLoading, refetch } = useGetSchools();
  const schoolsList = useMemo(() => {
    const list = Array.isArray(rawSchools) ? rawSchools : [];
    return list;
  }, [rawSchools]);

  const { mutateAsync: createSchool, isPending: isCreating } = useCreateSchool();
  const { mutateAsync: updateSchool, isPending: isUpdating } = useUpdateSchool();
  const { mutateAsync: deleteSchool, isPending: isDeleting } = useDeleteSchool();

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const filteredSchools = useMemo(() => {
    return schoolsList.filter((sch: any) => {
      const sName = sch.schoolName || sch.name || "";
      const sCode = sch.code || sch.schoolCode || "";
      const sAddress = sch.address || "";
      const searchLower = searchTerm.toLowerCase().trim();
      return (
        sName.toLowerCase().includes(searchLower) ||
        sCode.toLowerCase().includes(searchLower) ||
        sAddress.toLowerCase().includes(searchLower)
      );
    });
  }, [schoolsList, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredSchools.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedSchools = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredSchools.slice(start, start + PAGE_SIZE);
  }, [filteredSchools, safePage]);

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;

    try {
      await createSchool({
        schoolName: newSchoolName.trim(),
        code: newSchoolCode.trim() || newSchoolName.trim().substring(0, 5).toUpperCase(),
        address: newSchoolAddress.trim() || "Việt Nam",
      });
      setSuccessMsg(`Đã tạo trường học "${newSchoolName}" thành công!`);
      setNewSchoolName("");
      setNewSchoolCode("");
      setNewSchoolAddress("");
      refetch();
      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Tạo trường học thất bại.");
    }
  };

  const handleOpenEdit = (sch: any) => {
    setEditingSchool(sch);
    setEditSchoolName(sch.schoolName || sch.name || "");
    setEditSchoolCode(sch.code || sch.schoolCode || "UNIV");
    setEditSchoolAddress(sch.address || "");
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool || !editSchoolName.trim()) return;

    const schId = editingSchool.id || editingSchool.Id || editingSchool.schoolId;
    if (!schId) {
      alert("Không tìm thấy mã ID của trường học.");
      return;
    }

    try {
      await updateSchool({
        id: schId,
        data: {
          schoolName: editSchoolName.trim(),
          address: editSchoolAddress.trim() || "Việt Nam",
        },
      });
      setSuccessMsg(`Cập nhật thông tin trường "${editSchoolName}" thành công!`);
      refetch();
      setTimeout(() => {
        setShowEditModal(false);
        setEditingSchool(null);
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Cập nhật trường học thất bại.");
    }
  };

  const handleDeleteSchool = async (sch: any) => {
    const schId = sch.id || sch.Id || sch.schoolId;
    const name = sch.schoolName || sch.name || "Trường học này";
    if (!schId) return;

    const ok = window.confirm(`Bạn có chắc chắn muốn xóa trường "${name}" khỏi danh mục hệ thống không?`);
    if (!ok) return;

    try {
      await deleteSchool(schId);
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Xóa trường học thất bại.");
    }
  };

  if (!user || (!user.isAdmin && !user.IsAdmin)) {
    return (
      <PageShell className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="max-w-md space-y-4 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-danger)] bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-semibold text-[var(--color-danger)]">
            Yêu cầu quyền system admin
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Khu vực quản lý danh mục trường đại học chỉ dành cho Quản trị viên.
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

  return (
    <PageShell className="min-h-[calc(100vh-4rem)] space-y-6">
      <PageHeader
        title="Danh mục trường đại học"
        description="Danh mục dùng chung toàn hệ thống — giúp sinh viên ngoài FPT chọn trường chính xác khi xác minh thẻ sinh viên."
        breadcrumb={
          <nav className="text-xs text-[var(--text-muted)]">
            <Link href="/admin/dashboard" className="hover:text-[var(--accent-primary)]">
              Admin
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-[var(--text-primary)]">Trường học</span>
          </nav>
        }
        actions={
          <>
            <Button variant="ghost" accent="primary" onClick={() => refetch()} title="Tải lại danh sách">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="primary" accent="primary" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4" />
              Thêm trường mới
            </Button>
          </>
        }
      />

      <div className="flex items-center justify-between rounded-lg border border-[var(--accent-primary)]/30 bg-[var(--bg-panel)] p-4">
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <SchoolIcon className="h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
          <span>Quản trị viên có thể sửa hoặc xóa các trường bị lỗi font / trùng lặp.</span>
        </div>
        <Badge tone="info">Tổng: {schoolsList.length} trường</Badge>
      </div>

      <Card className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            type="search"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tìm mã, tên trường, địa chỉ..."
            className="pl-9"
          />
        </div>
        <span className="text-sm text-[var(--text-muted)]">
          Hiển thị <strong className="text-[var(--text-primary)]">{filteredSchools.length}</strong> / {schoolsList.length}
        </span>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-[var(--border-muted)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Danh sách trường</h2>
        </div>

        {isLoading ? (
          <EmptyState
            icon={RefreshCw}
            title="Đang tải dữ liệu"
            description="Đang truy vấn danh mục trường đại học..."
          />
        ) : filteredSchools.length === 0 ? (
          <EmptyState
            icon={SchoolIcon}
            title="Không tìm thấy trường"
            description="Không có trường đại học phù hợp với từ khóa tìm kiếm."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="border-b border-[var(--border-muted)] bg-[var(--bg-base)]">
                <tr>
                  <th className="w-12 px-4 py-3 text-center text-xs font-medium text-[var(--text-muted)]">#</th>
                  <th className="w-[15%] px-4 py-3 text-xs font-medium text-[var(--text-muted)]">Mã trường</th>
                  <th className="w-[38%] px-4 py-3 text-xs font-medium text-[var(--text-muted)]">Tên trường</th>
                  <th className="w-[30%] px-4 py-3 text-xs font-medium text-[var(--text-muted)]">Địa chỉ</th>
                  <th className="w-[17%] px-4 py-3 text-center text-xs font-medium text-[var(--text-muted)]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-muted)]/40">
                {paginatedSchools.map((sch: any, idx: number) => {
                  const schId = sch.id || sch.Id || sch.schoolId;
                  const code = sch.code || sch.schoolCode || "UNIV";
                  const name = sch.schoolName || sch.name || "Trường Đại Học";
                  const address = sch.address || "Việt Nam";

                  return (
                    <tr key={schId || idx} className="transition-colors hover:bg-[var(--bg-input)]/50">
                      <td className="px-4 py-3 text-center text-[var(--text-muted)]">
                        {(safePage - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--accent-primary)]">{code}</td>
                      <td className="truncate px-4 py-3 font-medium text-[var(--text-primary)]" title={name}>
                        {name}
                      </td>
                      <td className="truncate px-4 py-3 text-[var(--text-muted)]" title={address}>
                        {address}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            accent="primary"
                            onClick={() => handleOpenEdit(sch)}
                            className="h-8 px-2.5 text-xs"
                          >
                            <Edit2 className="h-3 w-3" />
                            Sửa
                          </Button>
                          <Button
                            variant="ghost"
                            accent="primary"
                            onClick={() => handleDeleteSchool(sch)}
                            disabled={isDeleting}
                            className="h-8 px-2.5 text-xs"
                          >
                            <Trash2 className="h-3 w-3" />
                            Xóa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredSchools.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--border-muted)] px-4 py-4 text-xs text-[var(--text-muted)] sm:flex-row">
            <div>
              Hiển thị{" "}
              <span className="font-medium text-[var(--text-primary)]">
                {(safePage - 1) * PAGE_SIZE + 1}
              </span>
              {" – "}
              <span className="font-medium text-[var(--text-primary)]">
                {Math.min(safePage * PAGE_SIZE, filteredSchools.length)}
              </span>
              {" / "}
              <span className="font-medium text-[var(--accent-primary)]">
                {filteredSchools.length}
              </span>{" "}
              trường (tối đa {PAGE_SIZE}/trang)
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  accent="primary"
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
                      accent="primary"
                      onClick={() => setCurrentPage(p)}
                      className="h-8 w-8 px-0 text-xs"
                    >
                      {p}
                    </Button>
                  );
                })}

                <Button
                  variant="ghost"
                  accent="primary"
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-md space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-[var(--text-primary)]">
                <SchoolIcon className="h-5 w-5 text-[var(--accent-primary)]" />
                Thêm trường đại học
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {successMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 p-3 text-xs text-[var(--color-success)]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateSchool} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-muted)]">Mã viết tắt (VD: FPT, BKHN) *</label>
                <Input
                  type="text"
                  value={newSchoolCode}
                  onChange={(e) => setNewSchoolCode(e.target.value.toUpperCase())}
                  placeholder="FPTU"
                  required
                  className="uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-muted)]">Tên trường đại học *</label>
                <Input
                  type="text"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  placeholder="Trường Đại Học FPT"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-muted)]">Địa chỉ / cơ sở</label>
                <Input
                  type="text"
                  value={newSchoolAddress}
                  onChange={(e) => setNewSchoolAddress(e.target.value)}
                  placeholder="Khu CNC Hòa Lạc, Thạch Thất, Hà Nội"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                  Hủy bỏ
                </Button>
                <Button type="submit" variant="primary" accent="primary" disabled={isCreating}>
                  {isCreating ? "Đang lưu..." : "Xác nhận tạo trường"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showEditModal && editingSchool && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-md space-y-4 border-[var(--color-warning)]/50 p-6">
            <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-[var(--text-primary)]">
                <Edit2 className="h-5 w-5 text-[var(--color-warning)]" />
                Chỉnh sửa trường đại học
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {successMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 p-3 text-xs text-[var(--color-success)]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-muted)]">Mã viết tắt (mã hiện tại)</label>
                <Input type="text" value={editSchoolCode} disabled className="cursor-not-allowed opacity-60 uppercase" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--color-warning)]">Tên trường đại học *</label>
                <Input
                  type="text"
                  value={editSchoolName}
                  onChange={(e) => setEditSchoolName(e.target.value)}
                  placeholder="Nhập tên trường chuẩn tiếng Việt..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-muted)]">Địa chỉ / cơ sở</label>
                <Input
                  type="text"
                  value={editSchoolAddress}
                  onChange={(e) => setEditSchoolAddress(e.target.value)}
                  placeholder="Địa chỉ hoặc Tỉnh/Thành phố"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
                  Hủy bỏ
                </Button>
                <Button type="submit" variant="primary" accent="primary" disabled={isUpdating}>
                  {isUpdating ? "Đang cập nhật..." : "Lưu thay đổi"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </PageShell>
  );
};
