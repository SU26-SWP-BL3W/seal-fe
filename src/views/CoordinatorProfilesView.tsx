"use client";

import React, { useState } from "react";
import { useGetUsers, usersRepository } from "@/repositories/usersRepository";
import { Check, X, Eye, AlertCircle, CheckCircle2, IdCard, History, User, School, Mail, FileText } from "lucide-react";
import { StudentProfileModal } from "@/components/domain/StudentProfileModal";

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

  // Real API pending users mapping
  const displayProfiles: StudentProfileItem[] = pendingUsers.map((u: any, idx: number) => ({
    id: u.id || u.Id || u.userId || u.UserId || "",
    fullName: u.fullName || u.FullName || "Sinh viên",
    email: u.email || u.Email || "",
    schoolName: u.schoolName || u.SchoolName || u.school?.schoolName || "Trường ĐH",
    studentCode: u.studentCode || u.StudentCode || u.studentId || "",
    photoStudentCardUrl: u.photoStudentCardUrl || u.PhotoStudentCardUrl || "",
    rejectionCount: u.rejectionCount ?? u.RejectionCount ?? 0,
    lastRejectionReason: u.lastRejectionReason || u.LastRejectionReason || undefined,
  }));

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
              <span>XÁC MINH HỒ SƠ THÍ SINH</span>
            </div>
            <h1 className="font-mono font-bold text-2xl md:text-3xl text-[#e1e7ec] uppercase tracking-wider">
              DUYỆT THẺ SINH VIÊN (NON-FPT)
            </h1>
            <p className="text-xs font-sans text-[#8a9ba8] mt-1.5 leading-relaxed max-w-3xl">
              Duyệt ảnh thẻ sinh viên, kiểm tra mã số sinh viên (MSSV) và phê duyệt quyền tham gia cho các thí sinh trường ngoài FPT.
            </p>
          </div>

          <div className="font-mono text-xs border border-[#00d9ff]/40 bg-[#00d9ff]/10 text-[#00d9ff] px-3.5 py-1.5 font-bold uppercase tracking-wider shrink-0">
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

      {/* POP-UP MODAL: CHI TIẾT HỒ SƠ SPOTLIGHT 3x4 & DUYỆT / TỪ CHỐI */}
      {activeProfileModal && (
        <StudentProfileModal
          user={{
            ...activeProfileModal,
            isApproved: false,
          }}
          isOpen={!!activeProfileModal}
          onClose={() => setActiveProfileModal(null)}
          canManage={true}
          onApprove={handleApprove}
          onReject={async (uId, reason) => {
            setRejectReason(reason);
            await handleReject();
          }}
        />
      )}

    </div>
  );
};
