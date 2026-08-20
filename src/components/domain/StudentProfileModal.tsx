"use client";

import React, { useState } from "react";
import {
  X,
  IdCard,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Crown,
  Maximize2,
  Check,
} from "lucide-react";

export interface StudentProfileData {
  id?: string;
  userId?: string;
  fullName?: string;
  email?: string;
  studentCode?: string;
  schoolName?: string;
  school?: string;
  photoStudentCardUrl?: string;
  isApproved?: boolean;
  isFpt?: boolean;
  roleName?: string;
  teamRole?: "LEADER" | "MEMBER" | string;
  rejectionCount?: number;
  lastRejectionReason?: string;
  rejectionReason?: string;
}

interface StudentProfileModalProps {
  user: StudentProfileData | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (userId: string) => Promise<void> | void;
  onReject?: (userId: string, reason: string) => Promise<void> | void;
  canManage?: boolean;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onApprove,
  onReject,
  canManage = false,
}) => {
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  if (!isOpen || !user) return null;

  const userId = user.id || user.userId || "";
  const fullName = user.fullName || "Thí sinh";
  const email = user.email || "Chưa cập nhật";
  const studentCode = user.studentCode || "";
  const schoolName = user.schoolName || user.school || (user.isFpt ? "Đại học FPT" : "Chưa cập nhật");
  const photoUrl = user.photoStudentCardUrl || "";
  const isFpt = user.isFpt || email.toLowerCase().endsWith("@fpt.edu.vn");
  const isLeader = user.teamRole === "LEADER" || user.roleName === "TeamLeader";
  const rejectionCount = user.rejectionCount ?? 0;
  const rejectionReason = user.lastRejectionReason || user.rejectionReason || "";

  const handleApprove = async () => {
    if (!onApprove || !userId) return;
    setIsProcessing(true);
    try {
      await onApprove(userId);
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Duyệt thẻ thất bại.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!onReject || !userId) return;
    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối hồ sơ thẻ sinh viên!");
      return;
    }
    setIsProcessing(true);
    try {
      await onReject(userId, rejectReason.trim());
      setRejecting(false);
      setRejectReason("");
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Từ chối hồ sơ thất bại.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-150">
      <div className="max-w-3xl w-full bg-[#0a0f12] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-[#0f171a] flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-mono text-xs font-bold uppercase tracking-wider text-cyan-400">
            <IdCard className="w-4 h-4 text-cyan-400" />
            <span>HỒ SƠ THÍ SINH &amp; MINH CHỨNG THẺ SINH VIÊN</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body: 2 Columns (Spotlight 3x4 Frame + Digital ID Sheet) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* ── COLUMN 1: SPOTLIGHT KHUNG ẢNH THẺ 3x4 (Tỷ lệ 3:4 chuẩn) ── */}
            <div className="md:col-span-5 flex flex-col items-center space-y-3">
              <div className="w-full max-w-[260px] aspect-[3/4] bg-[#070b0d] border-2 border-cyan-500/40 rounded-xl overflow-hidden relative shadow-lg shadow-cyan-950/30 flex flex-col items-center justify-center group">
                {photoUrl ? (
                  <>
                    <img
                      src={photoUrl}
                      alt={`Ảnh thẻ ${fullName}`}
                      className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3">
                      <button
                        type="button"
                        onClick={() => setShowFullImage(true)}
                        className="px-3 py-1.5 bg-cyan-500 text-black font-mono text-xs font-bold rounded-lg shadow-lg flex items-center gap-1.5 cursor-pointer hover:bg-white transition-colors"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Phóng to ảnh</span>
                      </button>
                    </div>
                  </>
                ) : isFpt ? (
                  <div className="p-6 text-center space-y-2">
                    <ShieldCheck className="w-14 h-14 text-emerald-400 mx-auto stroke-[1.5]" />
                    <span className="font-bold text-xs text-emerald-400 block uppercase font-mono">
                      FPT EDU VERIFIED
                    </span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                      Xác thực tự động qua hòm thư sinh viên FPT (@fpt.edu.vn). Miễn nộp ảnh thẻ vật lý.
                    </p>
                  </div>
                ) : (
                  <div className="p-6 text-center space-y-2">
                    <IdCard className="w-12 h-12 text-zinc-600 mx-auto stroke-[1.5]" />
                    <span className="font-mono text-xs text-zinc-400 block">Chưa tải ảnh thẻ SV</span>
                    <p className="text-[10px] text-zinc-500">Thí sinh chưa đính kèm ảnh chụp thẻ sinh viên.</p>
                  </div>
                )}

                {/* 3x4 Badge Overlay */}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded border border-zinc-700 text-[10px] font-mono text-zinc-300 font-bold">
                  ẢNH THẺ 3x4
                </div>
              </div>

              {photoUrl && (
                <button
                  type="button"
                  onClick={() => window.open(photoUrl, "_blank")}
                  className="text-cyan-400 hover:text-cyan-300 font-mono text-xs flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>[ ↗ Mở ảnh gốc toàn màn hình ]</span>
                </button>
              )}
            </div>

            {/* ── COLUMN 2: BẢNG DỮ LIỆU ĐỐI SOÁT HỒ SƠ ── */}
            <div className="md:col-span-7 space-y-4">
              
              {/* SPOTLIGHT MSSV (Được đẩy lên trên cùng) */}
              <div className="bg-[#0f171a] border-2 border-amber-500/50 p-3.5 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-zinc-400 text-[10px] font-mono uppercase tracking-wider block">
                    MÃ SỐ SINH VIÊN (MSSV)
                  </span>
                  <span className="text-amber-400 font-mono text-2xl font-black tracking-wider block">
                    {studentCode || "CHƯA CẬP NHẬT"}
                  </span>
                </div>
                {isLeader && (
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono font-bold flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" />
                    ĐỘI TRƯỞNG
                  </span>
                )}
              </div>

              {/* Thông tin cá nhân & Trường học */}
              <div className="bg-[#0f171a] border border-zinc-800 p-4 rounded-xl space-y-3 font-mono text-xs">
                <div>
                  <span className="text-zinc-400 text-[11px] block uppercase">HỌ VÀ TÊN THÍ SINH:</span>
                  <span className="text-white text-base font-bold font-sans tracking-wide block mt-0.5">
                    {fullName}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                  <div>
                    <span className="text-zinc-400 text-[11px] block uppercase">TRƯỜNG ĐẠI HỌC:</span>
                    <span className="text-zinc-200 font-sans font-medium flex items-center gap-1.5 mt-0.5">
                      <GraduationCap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      {schoolName}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 text-[11px] block uppercase">EMAIL HỆ THỐNG:</span>
                    <span className="text-cyan-300 truncate block mt-0.5" title={email}>
                      {email}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800">
                  <span className="text-zinc-400 text-[11px] block uppercase">TRẠNG THÁI HỒ SƠ:</span>
                  <div className="mt-1">
                    {rejectionCount >= 2 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-lg font-bold">
                        <AlertTriangle className="w-4 h-4" />
                        TÀI KHOẢN TẠM KHÓA (Bị từ chối {rejectionCount} lần)
                      </span>
                    ) : !isFpt && !photoUrl ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-lg font-bold">
                        <AlertTriangle className="w-4 h-4" />
                        CHƯA NỘP ẢNH THẺ SINH VIÊN (CHƯA ĐỦ ĐIỀU KIỆN DUYỆT)
                      </span>
                    ) : user.isApproved ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        THẺ SINH VIÊN HỢP LỆ &amp; ĐÃ PHÊ DUYỆT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-lg font-bold">
                        <Clock className="w-4 h-4" />
                        CHỜ QUẢN TRỊ VIÊN XÁC MINH THẺ SV
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Cảnh Báo Lý Do Từ Chối (Nếu Có) */}
              {(rejectionReason || rejectionCount > 0) && (
                <div className="p-3.5 bg-rose-950/30 border border-rose-500/40 rounded-xl font-mono text-xs space-y-1 text-rose-300">
                  <span className="font-bold flex items-center gap-1.5 uppercase">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    LỊCH SỬ TỪ CHỐI ({rejectionCount || 1} LẦN):
                  </span>
                  <p className="text-zinc-300 text-[11px] leading-relaxed font-sans">
                    {rejectionReason || "Ảnh thẻ sinh viên chưa đạt chuẩn hoặc thông tin MSSV không trùng khớp."}
                  </p>
                </div>
              )}

              {/* Form Nhập Lý Do Từ Chối (Nếu đang bấm từ chối) */}
              {rejecting && (
                <div className="p-4 bg-rose-950/40 border border-rose-500/60 rounded-xl space-y-3 font-mono text-xs animate-in fade-in">
                  <label className="text-rose-300 font-bold uppercase block">
                    Nhập lý do từ chối hồ sơ thẻ SV:
                  </label>
                  <textarea
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="VD: Ảnh thẻ bị mờ, không thấy rõ MSSV hoặc tên trường không khớp..."
                    className="w-full bg-[#080d0f] border border-rose-500/40 p-2.5 text-white rounded-lg focus:border-rose-400 outline-none text-xs"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setRejecting(false)}
                      className="px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:text-white rounded cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={isProcessing}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? "Đang gửi..." : "Xác nhận từ chối"}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-[#0f171a] flex items-center justify-between font-mono text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>

          {canManage && user.isApproved === false && !rejecting && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setRejecting(true)}
                className="px-4 py-2 bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500 hover:text-white font-bold rounded-lg transition-all cursor-pointer"
              >
                Từ Chối Thẻ SV
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isProcessing}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-lg shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{isProcessing ? "Đang lưu..." : "Phê Duyệt Thẻ SV"}</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Lightbox Phóng To Ảnh Thẻ */}
      {showFullImage && photoUrl && (
        <div
          className="fixed inset-0 bg-black/95 z-[10000] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={photoUrl}
              alt="Ảnh thẻ phóng to"
              className="max-w-full max-h-[85vh] object-contain rounded-xl border border-zinc-700 shadow-2xl"
            />
            <span className="font-mono text-xs text-zinc-400 mt-2">Bấm phím bất kỳ hoặc click vào ngoài để đóng</span>
          </div>
        </div>
      )}
    </div>
  );
};
