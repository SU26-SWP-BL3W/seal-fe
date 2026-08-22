"use client";

import React from "react";
import { Button, Card, Badge, Table, Input, Pagination } from "@/components/ui";
import {
  Plus,
  Search,
  Building2,
  MapPin,
  RefreshCw,
  CheckCircle2,
  X,
  Shield,
} from "lucide-react";
import { useAdminSchoolsViewModel } from "@/viewModels/admin/useAdminSchoolsViewModel";

export const AdminSchoolsView: React.FC = () => {
  const { state, data, pagination, actions } = useAdminSchoolsViewModel();

  const {
    searchTerm,
    showAddModal,
    newSchoolName,
    newSchoolCode,
    newSchoolAddress,
    successMsg,
    isLoading,
    isCreating,
  } = state;

  const { filteredSchools } = data;
  const { paginatedItems: paginatedSchools, currentPage: safePage, totalPages, pageSize: PAGE_SIZE, setCurrentPage } = pagination;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-6 py-8 space-y-6">
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-muted)] pb-6">
          <div>
            <div className="font-mono text-[10px] text-[var(--color-danger)] uppercase font-bold tracking-widest flex items-center gap-1.5 mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>DANH MỤC TRƯỜNG HỌC DỰ ÁN</span>
            </div>
            <h1 className="font-display font-bold text-3xl text-[var(--color-danger)] uppercase tracking-wider mt-1">
              Danh Mục Trường Đại Học Đối Tác
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
              Quản lý danh sách các Trường Đại Học có sinh viên tham gia thi đấu SEAL Hackathon.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => actions.setShowAddModal(true)}
              className="hud-clipped flex items-center gap-2 bg-[var(--color-danger)] text-white hover:bg-white hover:text-[var(--bg-base)] font-mono text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> Thêm Trường Mới
            </Button>
            <Button variant="ghost" onClick={() => actions.refetch()} className="font-mono text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Làm mới
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="p-4 bg-[var(--bg-panel)] border-[var(--border-muted)] hud-clipped">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo Tên trường / Mã trường..."
              value={searchTerm}
              onChange={(e) => actions.setSearchTerm(e.target.value)}
              className="pl-9 w-full text-xs font-mono"
            />
          </div>
        </Card>

        {/* School List Table Card */}
        <Card className="p-4 bg-[var(--bg-panel)] border-[var(--border-muted)] hud-clipped space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-[var(--color-danger)]" />
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="p-12 text-center font-mono text-xs text-[var(--text-muted)]">
              Chưa tìm thấy trường đại học phù hợp với từ khóa.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <th>MÃ TRƯỜNG</th>
                    <th>TÊN TRƯỜNG ĐẠI HỌC</th>
                    <th>ĐỊA CHỈ TRỤ SỞ</th>
                    <th>PHÂN LOẠI</th>
                    <th className="text-center">SỐ NGƯỜI DÙNG</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSchools.map((sch, idx) => {
                    const name = sch.schoolName || (sch as any).name || "Trường Đại Học";
                    const code = sch.schoolCode || (sch as any).code || `SCH-${idx + 1}`;
                    const isFpt = code.includes("FPT") || name.includes("FPT");

                    return (
                      <tr key={sch.id || idx}>
                        <td>
                          <Badge tone={isFpt ? "team" : "neutral"}>{code}</Badge>
                        </td>
                        <td>
                          <div className="font-mono font-bold text-sm text-[var(--text-primary)]">{name}</div>
                        </td>
                        <td>
                          <div className="font-mono text-xs text-[var(--text-muted)] flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                            {sch.address || "Việt Nam"}
                          </div>
                        </td>
                        <td>
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-mono font-bold border ${
                            isFpt
                              ? "bg-[rgba(56,189,248,0.1)] text-[var(--accent-team)] border-[var(--accent-team)]/30"
                              : "bg-[rgba(245,158,11,0.1)] text-[var(--color-warning)] border-[var(--color-warning)]/30"
                          }`}>
                            {isFpt ? "TRƯỜNG CHỦ TRÌ (FPTU)" : "TRƯỜNG ĐỐI TÁC (NON-FPT)"}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="font-mono text-xs font-bold text-[var(--accent-primary)]">
                            {(sch as any).userCount ?? 0}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}

          {filteredSchools.length > 0 && (
            <div className="p-4 border-t border-[var(--border-muted)]">
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={filteredSchools.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
                itemLabel="trường học"
              />
            </div>
          )}
        </Card>

        {/* Modal Thêm Trường Mới */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fade-in">
            <Card className="w-full max-w-lg p-6 bg-[var(--bg-panel)] border border-[var(--color-danger)] space-y-4 relative hud-clipped">
              <button
                type="button"
                onClick={() => actions.setShowAddModal(false)}
                className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[var(--color-danger)]" />
                  Khai Báo Trường Đại Học Mới
                </h3>
                <p className="font-mono text-xs text-[var(--text-muted)]">
                  Thêm thông tin trường đại học để cho phép sinh viên chọn trường khi Onboarding Thẻ SV.
                </p>
              </div>

              {successMsg ? (
                <div className="p-4 bg-[rgba(16,185,129,0.1)] border border-[var(--color-success)] text-[var(--color-success)] font-mono text-xs hud-clipped flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />
                  <span>{successMsg}</span>
                </div>
              ) : (
                <form onSubmit={actions.handleCreateSchool} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                      1. Tên Trường Đại Học *
                    </label>
                    <Input
                      type="text"
                      placeholder="VD: Đại học Sư phạm Kỹ thuật HCM"
                      value={newSchoolName}
                      onChange={(e) => actions.setNewSchoolName(e.target.value)}
                      className="w-full text-xs font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                      2. Mã Trường (School Code)
                    </label>
                    <Input
                      type="text"
                      placeholder="VD: HCMUTE"
                      value={newSchoolCode}
                      onChange={(e) => actions.setNewSchoolCode(e.target.value)}
                      className="w-full text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                      3. Địa Chỉ Trụ Sở
                    </label>
                    <Input
                      type="text"
                      placeholder="VD: Võ Văn Ngan, TP. Thủ Đức, TP.HCM"
                      value={newSchoolAddress}
                      onChange={(e) => actions.setNewSchoolAddress(e.target.value)}
                      className="w-full text-xs font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" type="button" onClick={() => actions.setShowAddModal(false)}>
                      Hủy Bỏ
                    </Button>
                    <Button variant="primary" type="submit" disabled={isCreating} className="bg-[var(--color-danger)] text-white">
                      {isCreating ? "Đang xử lý..." : "Tạo Trường Học Mới"}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};
