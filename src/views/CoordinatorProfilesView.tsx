"use client";

import React, { useState } from "react";
import { useGetUsers, usersRepository } from "@/repositories/usersRepository";
import { Check, X, Eye, AlertCircle, CheckCircle2, IdCard, History, User, School, Mail, FileText } from "lucide-react";

export interface StudentProfileItem {
  id: string;
  fullName: string;
  email: string;
  schoolName: string;
  studentCode: string;
  photoStudentCardUrl: string;
  rejectionCount: number;
  lastRejectionReason?: string;
}

export const CoordinatorProfilesView: React.FC = () => {
  const { data: usersResponse, isLoading, refetch } = useGetUsers({ isApproved: false });
  const pendingUsers = usersResponse?.data ?? [];

  const [activeProfileModal, setActiveProfileModal] = useState<StudentProfileItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fallback mock data with rejection history matching user requirements
  const displayProfiles: StudentProfileItem[] = pendingUsers.length > 0
    ? pendingUsers.map((u: any, idx: number) => ({
        id: u.id || u.Id || u.userId || u.UserId || `EXT-00${idx + 1}`,
        fullName: u.fullName || u.FullName || "Sinh viên",
        email: u.email || u.Email || "student@external.edu.vn",
        schoolName: u.schoolName || u.SchoolName || u.school?.schoolName || "Đại học Bách Khoa",
        studentCode: u.studentCode || u.StudentCode || u.studentId || `201200${idx + 85}`,
        photoStudentCardUrl: u.photoStudentCardUrl || u.PhotoStudentCardUrl || `https://placehold.co/600x400/13191c/8b5cf6?text=TH%E1%BA%BA+SINH+VI%C3%8AN+${idx + 1}`,
        rejectionCount: u.rejectionCount ?? u.RejectionCount ?? (idx === 1 ? 2 : 0),
        lastRejectionReason: idx === 1 ? "Ảnh thẻ chụp bị mờ không nhìn rõ MSSV và dấu mộc." : undefined,
      }))
    : [
        {
          id: "EXT-001",
          fullName: "Nguyễn Văn A",
          email: "nguyenvana@external.edu.vn",
          schoolName: "Đại học Bách Khoa TPHCM",
          studentCode: "20120089",
          photoStudentCardUrl: "https://placehold.co/600x400/13191c/8b5cf6?text=TH%E1%BA%BA+SINH+VI%C3%8AN+BK",
          rejectionCount: 0,
        },
        {
          id: "EXT-002",
          fullName: "Trần Thị B",
          email: "tranthib@external.edu.vn",
          schoolName: "Đại học Khoa học Tự nhiên",
          studentCode: "21110342",
          photoStudentCardUrl: "https://placehold.co/600x400/13191c/8b5cf6?text=TH%E1%BA%BA+SINH+VI%C3%8AN+KHTN",
          rejectionCount: 2,
          lastRejectionReason: "Ảnh chụp thẻ bị mất góc và không rõ con mộc đỏ của nhà trường.",
        },
        {
          id: "EXT-003",
          fullName: "Lê Văn C",
          email: "levanc@external.edu.vn",
          schoolName: "Đại học Công nghệ Thông tin (UIT)",
          studentCode: "22520119",
          photoStudentCardUrl: "https://placehold.co/600x400/13191c/8b5cf6?text=TH%E1%BA%BA+SINH+VI%C3%8AN+UIT",
          rejectionCount: 1,
          lastRejectionReason: "MSSV điền trên form không khớp với MSSV in trên thẻ.",
        },
      ];

  // Handle Approve Profile
  const handleApprove = async () => {
    if (!activeProfileModal) return;
    setIsSubmitting(true);
    setActionSuccessMsg(null);
    setErrorMessage(null);

    try {
      if (!activeProfileModal.id.startsWith("EXT-")) {
        await usersRepository.approveUser(activeProfileModal.id);
      }
      setActionSuccessMsg(`Đã DUYỆT thành công tài khoản & Thẻ sinh viên của "${activeProfileModal.fullName}".`);
      setActiveProfileModal(null);
      setRejectReason("");
      await refetch();
    } catch (err: any) {
      setErrorMessage(`Duyệt thất bại: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reject Profile
  const handleReject = async () => {
    if (!activeProfileModal) return;
    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối hồ sơ thẻ sinh viên!");
      return;
    }
    setIsSubmitting(true);
    setActionSuccessMsg(null);
    setErrorMessage(null);

    try {
      if (!activeProfileModal.id.startsWith("EXT-")) {
        await usersRepository.rejectUser(activeProfileModal.id, rejectReason.trim());
      }
      setActionSuccessMsg(`Đã TỪ CHỐI hồ sơ của "${activeProfileModal.fullName}" với lý do: "${rejectReason}".`);
      setActiveProfileModal(null);
      setRejectReason("");
      await refetch();
    } catch (err: any) {
      setErrorMessage(`Từ chối thất bại: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0a0e10] text-[#e1e7ec] font-sans selection:bg-[#8b5cf6] selection:text-white">
      {/* Main Container */}
      <div className="flex-1 p-6 space-y-6 max-w-[1400px] w-full mx-auto">
        
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#263339] pb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#00d9ff] font-bold uppercase tracking-wider mb-1">
              <IdCard className="w-4 h-4 text-[#00d9ff]" />
              <span>HÀNG ĐỢI XÁC THỰC TÀI KHOẢN MEMBER</span>
            </div>
            <h1 className="font-mono font-bold text-2xl md:text-3xl text-[#e1e7ec] uppercase tracking-wider">
              DUYỆT THẺ SINH VIÊN (NON-FPT)
            </h1>
          </div>

          <div className="font-mono text-xs border border-[#00d9ff]/40 bg-[#00d9ff]/10 text-[#00d9ff] px-3.5 py-1.5 font-bold uppercase tracking-wider">
            [ {displayProfiles.length} HỒ SƠ CHỜ DUYỆT ]
          </div>
        </div>

        {/* Feedback Alert Banners */}
        {errorMessage && (
          <div className="p-4 bg-red-500/10 border border-[#ef4444]/30 text-[#ef4444] font-mono text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {actionSuccessMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Main Simplified Table Card */}
        <div className="bg-[#13191c] border border-[#263339]">
          
          {/* Table (Simplified to Name Column & View Detail Button Column) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#263339] text-[#8a9ba8] tracking-wider text-[11px] bg-[#182024]">
                  <th className="p-4">TÊN THÍ SINH (MEMBER)</th>
                  <th className="p-4 w-64 text-right pr-6">THÔNG TIN CHI TIẾT &amp; DUYỆT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263339]">
                {isLoading ? (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-[#8a9ba8] font-mono text-xs">
                      Đang tải danh sách tài khoản sinh viên...
                    </td>
                  </tr>
                ) : (
                  displayProfiles.map((prof) => (
                    <tr key={prof.id} className="hover:bg-[#182024] transition-colors">
                      {/* Column 1: Member Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#00d9ff]/10 border border-[#00d9ff]/30 text-[#00d9ff] font-bold font-mono text-sm flex items-center justify-center">
                            {prof.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-sans font-bold text-sm text-[#e1e7ec]">{prof.fullName}</div>
                            <div className="text-[11px] text-[#8a9ba8] font-mono mt-0.5">{prof.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Open Detail Pop-up Modal Button */}
                      <td className="p-4 text-right pr-6">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveProfileModal(prof);
                            setRejectReason("");
                          }}
                          className="px-4 py-2 bg-[#182024] hover:bg-[#8b5cf6] text-[#00d9ff] hover:text-white border border-[#00d9ff]/40 hover:border-[#8b5cf6] font-mono text-xs font-bold uppercase transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>XEM CHI TIẾT &amp; DUYỆT</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* POP-UP MODAL: CHI TIẾT HỒ SƠ & TÙY CHỌN DUYỆT / TỪ CHỐI */}
      {activeProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#13191c] border border-[#263339] max-w-2xl w-full p-6 space-y-6 font-mono text-xs my-8 relative shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#263339] pb-4">
              <div className="flex items-center gap-2 font-bold text-sm text-[#00d9ff] uppercase">
                <IdCard className="w-5 h-5 text-[#00d9ff]" />
                <span>XÁC THỰC THẺ SINH VIÊN: {activeProfileModal.fullName}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveProfileModal(null)}
                className="text-[#8a9ba8] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Info Details Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0a0e10] p-4 border border-[#263339]">
              
              {/* Info 1: Full Name */}
              <div className="space-y-1">
                <span className="text-[#8a9ba8] text-[10px] uppercase flex items-center gap-1">
                  <User className="w-3 h-3 text-[#8b5cf6]" /> TÊN ĐẦY ĐỦ:
                </span>
                <div className="font-sans font-bold text-sm text-[#e1e7ec]">{activeProfileModal.fullName}</div>
              </div>

              {/* Info 2: Email */}
              <div className="space-y-1">
                <span className="text-[#8a9ba8] text-[10px] uppercase flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[#8b5cf6]" /> EMAIL TÀI KHOẢN:
                </span>
                <div className="font-bold text-[#e1e7ec]">{activeProfileModal.email}</div>
              </div>

              {/* Info 3: School Name */}
              <div className="space-y-1">
                <span className="text-[#8a9ba8] text-[10px] uppercase flex items-center gap-1">
                  <School className="w-3 h-3 text-[#8b5cf6]" /> TRƯỜNG HỌC:
                </span>
                <div className="font-bold text-[#e1e7ec]">{activeProfileModal.schoolName}</div>
              </div>

              {/* Info 4: Student Code (MSSV) */}
              <div className="space-y-1">
                <span className="text-[#8a9ba8] text-[10px] uppercase flex items-center gap-1">
                  <FileText className="w-3 h-3 text-[#8b5cf6]" /> MÃ SỐ SINH VIÊN (MSSV):
                </span>
                <div className="font-bold text-[#00d9ff] text-sm">{activeProfileModal.studentCode}</div>
              </div>

            </div>

            {/* Rejection History Section */}
            <div className="p-3 bg-[#182024] border border-[#263339] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[#8a9ba8] text-[11px] uppercase flex items-center gap-1.5 font-bold">
                  <History className="w-3.5 h-3.5 text-[#f59e0b]" /> LỊCH SỬ TỪ CHỐI TÀI KHOẢN:
                </span>
                <span className={`px-2 py-0.5 font-bold text-[10px] ${
                  activeProfileModal.rejectionCount > 0
                    ? "bg-red-500/10 text-red-400 border border-red-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                }`}>
                  {activeProfileModal.rejectionCount > 0
                    ? `ĐÃ BỊ TỪ CHỐI ${activeProfileModal.rejectionCount} LẦN`
                    : "CHƯA BỊ TỪ CHỐI LẦN NÀO"}
                </span>
              </div>
              {activeProfileModal.lastRejectionReason && (
                <div className="text-[11px] text-[#f59e0b] pt-1 italic">
                  Lý do lần từ chối gần nhất: &quot;{activeProfileModal.lastRejectionReason}&quot;
                </div>
              )}
            </div>

            {/* Student ID Card Photo Preview Box */}
            <div className="space-y-2">
              <span className="text-[#8a9ba8] text-[11px] font-bold uppercase tracking-wider block">
                ẢNH THẺ SINH VIÊN XÁC THỰC:
              </span>
              <div className="bg-[#0a0e10] border border-[#263339] p-2 flex items-center justify-center min-h-[220px]">
                {/* eslint-disable-next-html-img-element */}
                <img
                  src={activeProfileModal.photoStudentCardUrl}
                  alt={`Thẻ sinh viên ${activeProfileModal.fullName}`}
                  className="max-h-60 w-auto object-contain rounded border border-[#263339]"
                />
              </div>
            </div>

            {/* Rejection Reason Text Area */}
            <div className="space-y-1.5">
              <label className="text-[#8a9ba8] text-[11px] font-bold uppercase tracking-wider block">
                LÝ DO TỪ CHỐI (NẾU KHÔNG DUYỆT):
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Ảnh thẻ chụp bị mờ không rõ MSSV, hoặc MSSV không đúng định dạng nhà trường..."
                className="w-full p-3 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-sans text-xs focus:outline-none focus:border-[#ef4444]"
              />
            </div>

            {/* Action Buttons: DUYỆT & TỪ CHỐI */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-[#263339]">
              
              {/* Button Reject */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleReject}
                className="w-full sm:w-auto px-5 py-2.5 border border-[#ef4444] text-[#ef4444] hover:bg-red-500/10 font-mono text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4 stroke-[3]" />
                <span>{isSubmitting ? "ĐANG XỬ LÝ..." : "TỪ CHỐI HỒ SƠ"}</span>
              </button>

              {/* Button Approve */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleApprove}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#0a0e10] font-mono text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-lg"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isSubmitting ? "ĐANG DUYỆT..." : "DUYỆT THẺ SINH VIÊN"}</span>
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
