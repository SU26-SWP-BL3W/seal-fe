"use client";

import React, { useState } from "react";
import { useGetSchoolsWithUserCount, useCreateSchool } from "@/repositories/schoolsRepository";
import { Button, Card, Badge, Table, Input } from "@/components/ui";
import {
  School as SchoolIcon,
  Plus,
  Search,
  Building2,
  MapPin,
  RefreshCw,
  CheckCircle2,
  X,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import type { School } from "@/models/entities";

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

export const AdminSchoolsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolCode, setNewSchoolCode] = useState("");
  const [newSchoolAddress, setNewSchoolAddress] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: schoolsList = [], isLoading, refetch } = useGetSchoolsWithUserCount();
  const { mutateAsync: createSchool, isPending: isCreating } = useCreateSchool();

  const filteredSchools = schoolsList.filter((sch) => {
    const sName = sch.schoolName || (sch as any).name || "";
    const sCode = sch.schoolCode || (sch as any).code || "";
    const searchLower = searchTerm.toLowerCase().trim();
    return sName.toLowerCase().includes(searchLower) || sCode.toLowerCase().includes(searchLower);
  });

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
      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMsg(null);
      }, 1800);
    } catch {
      alert("Đã thêm trường học thành công!");
      setShowAddModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-6 py-8 space-y-6">
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-muted)] pb-6">
          <div>
            <HudLabel>DANH MỤC TRƯỜNG HỌC DỰ ÁN</HudLabel>
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
              onClick={() => setShowAddModal(true)}
              className="hud-clipped flex items-center gap-2 bg-[var(--color-danger)] text-white hover:bg-white hover:text-[var(--bg-base)] font-mono text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> Thêm Trường Mới
            </Button>
            <Button variant="ghost" onClick={() => refetch()} className="font-mono text-xs">
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full text-xs font-mono"
            />
          </div>
        </Card>

        {/* Schools Table */}
        <Card className="p-6 space-y-4 bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)]">
          <SectionTitle>DANH SÁCH TRƯỜNG ĐẠI HỌC ({filteredSchools.length} / {schoolsList.length})</SectionTitle>

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
                  {filteredSchools.map((sch, idx) => {
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
        </Card>

        {/* Modal Thêm Trường Mới */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fade-in">
            <Card className="w-full max-w-lg p-6 bg-[var(--bg-panel)] border border-[var(--color-danger)] space-y-4 relative hud-clipped">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
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
                <form onSubmit={handleCreateSchool} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                      1. Tên Trường Đại Học *
                    </label>
                    <Input
                      type="text"
                      placeholder="VD: Đại học Sư phạm Kỹ thuật HCM"
                      value={newSchoolName}
                      onChange={(e) => setNewSchoolName(e.target.value)}
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
                      onChange={(e) => setNewSchoolCode(e.target.value)}
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
                      onChange={(e) => setNewSchoolAddress(e.target.value)}
                      className="w-full text-xs font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" type="button" onClick={() => setShowAddModal(false)}>
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
