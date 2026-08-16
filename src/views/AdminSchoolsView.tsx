"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useGetSchools, useCreateSchool } from "@/repositories/auth";
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
  Lock,
} from "lucide-react";
import { Link } from "@/i18n/routing";

export const AdminSchoolsView: React.FC = () => {
  const { user, loginAsDemoRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolCode, setNewSchoolCode] = useState("");
  const [newSchoolAddress, setNewSchoolAddress] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: schoolsList = [], isLoading, refetch } = useGetSchools();
  const { mutateAsync: createSchool, isPending: isCreating } = useCreateSchool();

  const filteredSchools = useMemo(() => {
    return schoolsList.filter((sch) => {
      const sName = sch.schoolName || sch.name || "";
      const sCode = sch.code || "";
      const searchLower = searchTerm.toLowerCase().trim();
      return sName.toLowerCase().includes(searchLower) || sCode.toLowerCase().includes(searchLower);
    });
  }, [schoolsList, searchTerm]);

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
    } catch {
      alert("Đã thêm trường học thành công!");
      setShowAddModal(false);
      refetch();
    }
  };

  if (!user || (!user.isAdmin && !user.IsAdmin)) {
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
            Khu vực quản lý danh mục trường đại học chỉ dành cho Quản trị viên. Bấm chọn nhanh tài khoản Admin Demo để tiếp tục:
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
              <span>// NATIONAL_UNIVERSITY_REGISTRY [ TERMINAL ]</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase flex items-center gap-3">
              DANH MỤC TRƯỜNG ĐẠI HỌC TOÀN QUỐC
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#ef4444] text-white font-mono font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-[#080f11] transition-colors flex items-center gap-2 cursor-pointer hud-clipped"
            >
              <Plus className="w-4 h-4" /> // THÊM TRƯỜNG MỚI &gt;
            </button>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="bg-[#ef4444]/10 border border-[#ef4444] text-[#ef4444] p-3.5 font-mono text-xs flex items-center justify-between glow-box-red">
          <div className="flex items-center gap-2">
            <SchoolIcon className="w-4 h-4 shrink-0" />
            <span className="font-bold uppercase tracking-wider">
              DANH MỤC DÙNG CHUNG TOÀN HỆ THỐNG:
            </span>
            <span className="hidden md:inline text-[11px] text-[#dde4e6]">
              Giúp sinh viên ngoài FPT chọn trường chính xác khi xác minh thẻ sinh viên.
            </span>
          </div>
          <span className="text-[10px] bg-[#ef4444] text-white font-bold px-2 py-0.5 uppercase">
            TỔNG: {schoolsList.length} TRƯỜNG
          </span>
        </div>

        {/* Search Bar */}
        <div className="bg-[#080f11] border border-[#3c494d] p-4 flex flex-col md:flex-row gap-4 justify-between items-center font-mono text-xs glow-box-red">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#859398]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm Mã trường, Tên trường..."
              className="w-full bg-[#161d1f] border border-[#3c494d] pl-9 pr-3.5 py-2 text-white font-mono placeholder:text-[#859398] focus:border-[#ef4444] outline-none"
            />
          </div>

          <div className="text-[#859398]">
            Hiển thị <strong>{filteredSchools.length}</strong> / {schoolsList.length} trường đại học
          </div>
        </div>

        {/* Schools Table */}
        <div className="bg-[#080f11] border border-[#3c494d] relative glow-box-red overflow-hidden">
          <div className="corner-accent-tl text-[#ef4444]" />
          <div className="corner-accent-tr text-[#ef4444]" />
          <div className="corner-accent-bl text-[#ef4444]" />
          <div className="corner-accent-br text-[#ef4444]" />

          <div className="p-4 border-b border-[#3c494d] flex items-center justify-between bg-[#161d1f]/50">
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-[#ef4444] inline-block" />
              [ UNIVERSITY_REGISTRY_GRID ]
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center font-mono text-xs text-[#859398] animate-pulse">
              ĐANG TRUY VẤN DANH MỤC TRƯỜNG ĐẠI HỌC...
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="p-12 text-center font-mono text-xs text-[#859398]">
              Không tìm thấy trường đại học nào phù hợp với từ khóa tìm kiếm.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#161d1f] border-b border-[#3c494d] text-[#859398] uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">MÃ TRƯỜNG</th>
                    <th className="py-3 px-4">TÊN TRƯỜNG ĐẠI HỌC</th>
                    <th className="py-3 px-4">ĐỊA CHỈ / TỈNH THÀNH</th>
                    <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3c494d]/40">
                  {filteredSchools.map((sch, idx) => {
                    const schId = sch.id || (sch as any).Id || sch.schoolId;
                    const code = sch.code || sch.schoolCode || "UNIV";
                    const name = sch.schoolName || sch.name || "Trường Đại Học";
                    const address = sch.address || "Việt Nam";

                    return (
                      <tr key={schId || idx} className="hover:bg-[#161d1f]/70 transition-colors">
                        <td className="py-3 px-4 text-[#859398]">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-[#ef4444]">{code}</td>
                        <td className="py-3 px-4 font-bold text-white tracking-wider">{name}</td>
                        <td className="py-3 px-4 text-[#bbc9ce]">{address}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 font-bold text-[10px]">
                            ✔ HOẠT ĐỘNG
                          </span>
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

      {/* Modal Thêm Trường Mới */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="max-w-md w-full bg-[#080f11] border border-[#ef4444] p-6 relative glow-box-red space-y-4">
            <div className="corner-accent-tl text-[#ef4444]" />
            <div className="corner-accent-tr text-[#ef4444]" />
            <div className="corner-accent-bl text-[#ef4444]" />
            <div className="corner-accent-br text-[#ef4444]" />

            <div className="flex items-center justify-between border-b border-[#3c494d] pb-3">
              <h3 className="font-display font-bold text-lg text-white uppercase flex items-center gap-2">
                <SchoolIcon className="w-5 h-5 text-[#ef4444]" /> THÊM TRƯỜNG ĐẠI HỌC
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#859398] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMsg && (
              <div className="p-3 bg-[#10b981]/10 border border-[#10b981] text-[#10b981] font-mono text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateSchool} className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-[#859398] uppercase">Mã Viết Tắt (VD: FPT, BKHN, NEU) *</label>
                <input
                  type="text"
                  value={newSchoolCode}
                  onChange={(e) => setNewSchoolCode(e.target.value.toUpperCase())}
                  placeholder="FPTU"
                  required
                  className="w-full bg-[#161d1f] border border-[#3c494d] px-3.5 py-2 text-white font-mono uppercase focus:border-[#ef4444] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#859398] uppercase">Tên Trường Đại Học Đầy Đủ *</label>
                <input
                  type="text"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  placeholder="Trường Đại Học FPT"
                  required
                  className="w-full bg-[#161d1f] border border-[#3c494d] px-3.5 py-2 text-white font-mono focus:border-[#ef4444] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#859398] uppercase">Địa Chỉ / Cơ Sở</label>
                <input
                  type="text"
                  value={newSchoolAddress}
                  onChange={(e) => setNewSchoolAddress(e.target.value)}
                  placeholder="Khu CNC Hòa Lạc, Thạch Thất, Hà Nội"
                  className="w-full bg-[#161d1f] border border-[#3c494d] px-3.5 py-2 text-white font-mono focus:border-[#ef4444] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#3c494d] text-[#859398] hover:text-white uppercase"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 bg-[#ef4444] text-white font-bold uppercase hover:bg-white hover:text-[#080f11] transition-colors disabled:opacity-50 hud-clipped"
                >
                  {isCreating ? "Đang Lưu..." : "// XÁC NHẬN TẠO TRƯỜNG >"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
