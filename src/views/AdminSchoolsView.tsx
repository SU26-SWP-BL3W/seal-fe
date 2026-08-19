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
  Building2,
  MapPin,
  RefreshCw,
  CheckCircle2,
  X,
  ShieldAlert,
  Lock,
  Edit2,
  Trash2,
} from "lucide-react";
import { Link } from "@/i18n/routing";

export const AdminSchoolsView: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
  // State Tạo Mới
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolCode, setNewSchoolCode] = useState("");
  const [newSchoolAddress, setNewSchoolAddress] = useState("");
  
  // State Chỉnh Sửa
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

  // Xử lý tạo mới
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

  // Mở modal sửa
  const handleOpenEdit = (sch: any) => {
    setEditingSchool(sch);
    setEditSchoolName(sch.schoolName || sch.name || "");
    setEditSchoolCode(sch.code || sch.schoolCode || "UNIV");
    setEditSchoolAddress(sch.address || "");
    setShowEditModal(true);
  };

  // Xử lý lưu chỉnh sửa
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

  // Xử lý xóa trường
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
      <div className="min-h-[calc(100vh-4rem)] bg-[#0e1417] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#080f11] border border-[#ef4444] p-8 text-center glow-box-red relative space-y-4">
          <div className="w-12 h-12 bg-[#ef4444]/10 border border-[#ef4444] rounded-full flex items-center justify-center mx-auto text-[#ef4444]">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold uppercase text-[#ef4444]">
            YÊU CẦU QUYỀN SYSTEM ADMIN
          </h2>
          <p className="font-mono text-xs text-[#bbc9ce] leading-relaxed">
            Khu vực quản lý danh mục trường đại học chỉ dành cho Quản trị viên.
          </p>
          <div className="pt-2 flex flex-col gap-2 font-mono text-xs">
            <Link href="/login" className="w-full">
              <button className="w-full bg-[#ef4444] text-white font-bold py-2.5 uppercase hover:bg-white hover:text-[#080f11] transition-colors cursor-pointer">
                Đến trang đăng nhập
              </button>
            </Link>
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
              onClick={() => refetch()}
              className="p-2 border border-[#3c494d] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer rounded"
              title="Tải lại danh sách"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
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
              Giúp sinh viên ngoài FPT chọn trường chính xác khi xác minh thẻ sinh viên. Quản trị viên có thể Sửa hoặc Xóa các trường bị lỗi font / trùng lặp.
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
              placeholder="Tìm kiếm Mã trường, Tên trường, Địa chỉ..."
              className="w-full bg-[#161d1f] border border-[#3c494d] pl-9 pr-3.5 py-2 text-white font-mono placeholder:text-[#859398] focus:border-[#ef4444] outline-none"
            />
          </div>

          <div className="text-[#859398]">
            Hiển thị <strong>{filteredSchools.length}</strong> / {schoolsList.length} trường đại học
          </div>
        </div>

        {/* Schools Table */}
        <div className="bg-[#080f11] border border-[#3c494d] relative glow-box-red overflow-hidden">
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
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4 w-28">MÃ TRƯỜNG</th>
                    <th className="py-3 px-4">TÊN TRƯỜNG ĐẠI HỌC</th>
                    <th className="py-3 px-4">ĐỊA CHỈ / TỈNH THÀNH</th>
                    <th className="py-3 px-4 text-center w-36">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3c494d]/40">
                  {filteredSchools.map((sch: any, idx: number) => {
                    const schId = sch.id || sch.Id || sch.schoolId;
                    const code = sch.code || sch.schoolCode || "UNIV";
                    const name = sch.schoolName || sch.name || "Trường Đại Học";
                    const address = sch.address || "Việt Nam";

                    return (
                      <tr key={schId || idx} className="hover:bg-[#161d1f]/70 transition-colors">
                        <td className="py-3 px-4 text-center text-[#859398]">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-[#ef4444]">{code}</td>
                        <td className="py-3 px-4 font-bold text-white tracking-wider">{name}</td>
                        <td className="py-3 px-4 text-[#bbc9ce]">{address}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(sch)}
                              className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/40 text-amber-300 hover:bg-amber-500/20 text-[11px] font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
                              title="Chỉnh sửa thông tin trường"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Sửa</span>
                            </button>
                            <button
                              onClick={() => handleDeleteSchool(sch)}
                              disabled={isDeleting}
                              className="px-2 py-1 bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20 text-[11px] font-bold rounded flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                              title="Xóa trường học"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Xóa</span>
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
        </div>
      </div>

      {/* Modal Thêm Trường Mới */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="max-w-md w-full bg-[#080f11] border border-[#ef4444] p-6 relative glow-box-red space-y-4">
            <div className="flex items-center justify-between border-b border-[#3c494d] pb-3">
              <h3 className="font-display font-bold text-lg text-white uppercase flex items-center gap-2">
                <SchoolIcon className="w-5 h-5 text-[#ef4444]" /> THÊM TRƯỜNG ĐẠI HỌC
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#859398] hover:text-white cursor-pointer">
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
                  className="px-4 py-2 border border-[#3c494d] text-[#859398] hover:text-white uppercase cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 bg-[#ef4444] text-white font-bold uppercase hover:bg-white hover:text-[#080f11] transition-colors disabled:opacity-50 hud-clipped cursor-pointer"
                >
                  {isCreating ? "Đang Lưu..." : "// XÁC NHẬN TẠO TRƯỜNG >"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa Trường Học */}
      {showEditModal && editingSchool && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="max-w-md w-full bg-[#080f11] border border-amber-500 p-6 relative glow-box space-y-4">
            <div className="flex items-center justify-between border-b border-[#3c494d] pb-3">
              <h3 className="font-display font-bold text-lg text-white uppercase flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" /> CHỈNH SỬA TRƯỜNG ĐẠI HỌC
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-[#859398] hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMsg && (
              <div className="p-3 bg-[#10b981]/10 border border-[#10b981] text-[#10b981] font-mono text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-[#859398] uppercase">Mã Viết Tắt (Mã hiện tại)</label>
                <input
                  type="text"
                  value={editSchoolCode}
                  disabled
                  className="w-full bg-[#161d1f] border border-[#3c494d] px-3.5 py-2 text-zinc-400 font-mono uppercase cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-amber-400 font-bold uppercase">Tên Trường Đại Học *</label>
                <input
                  type="text"
                  value={editSchoolName}
                  onChange={(e) => setEditSchoolName(e.target.value)}
                  placeholder="Nhập tên trường chuẩn tiếng Việt..."
                  required
                  className="w-full bg-[#161d1f] border border-amber-500/60 px-3.5 py-2 text-white font-mono focus:border-amber-400 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#859398] uppercase">Địa Chỉ / Cơ Sở</label>
                <input
                  type="text"
                  value={editSchoolAddress}
                  onChange={(e) => setEditSchoolAddress(e.target.value)}
                  placeholder="Địa chỉ hoặc Tỉnh/Thành phố"
                  className="w-full bg-[#161d1f] border border-[#3c494d] px-3.5 py-2 text-white font-mono focus:border-amber-400 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-[#3c494d] text-[#859398] hover:text-white uppercase cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-amber-500 text-black font-bold uppercase hover:bg-white transition-colors disabled:opacity-50 hud-clipped cursor-pointer"
                >
                  {isUpdating ? "Đang Cập Nhật..." : "// LƯU THAY ĐỔI >"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
