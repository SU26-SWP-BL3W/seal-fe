"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  useUpdateStudentProfile,
  useFptStudentVerification,
  useRequestUnblock,
  useChangePassword,
} from "@/repositories/authRepository";
import { useGetUserRejections } from "@/repositories/usersRepository";
import { useGetSchools } from "@/repositories/schoolsRepository";
import { uploadRepository } from "@/repositories/uploadRepository";
import { Button, Input, Card, Badge } from "@/components/ui";
import { useToast } from "@/providers/ToastProvider";
import {
  User,
  ShieldCheck,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  RefreshCw,
  IdCard,
  Building2,
  Mail,
  Send,
  Edit3,
  Key,
} from "lucide-react";
import type { FptStudentResponse } from "@/models/entities";

export function UserProfileView() {
  const toast = useToast();
  const { user, activeRole } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const rawRole = activeRole?.roleName || activeRole?.RoleName;
  const userEmail = (user?.email || user?.Email || "").toLowerCase();

  let roleName = "";
  if (user?.isAdmin || user?.IsAdmin) {
    roleName = "Admin";
  } else {
    roleName = rawRole || "";
    if (roleName === "EventCoordinator") roleName = "Coordinator";
    if (!roleName) {
      if (userEmail.includes("ec_") || userEmail.includes("ec.") || userEmail.includes("coordinator")) {
        roleName = "Coordinator";
      } else if (userEmail.includes("judge")) {
        roleName = "Judge";
      } else if (userEmail.includes("mentor")) {
        roleName = "Mentor";
      } else {
        roleName = "Student";
      }
    }
  }

  const isStaff =
    roleName === "Coordinator" ||
    roleName === "Admin" ||
    roleName === "Judge" ||
    roleName === "Mentor" ||
    Boolean(user?.isAdmin || user?.IsAdmin);

  // Staff Form states
  const [staffOrg, setStaffOrg] = useState("");
  const [staffBio, setStaffBio] = useState(
    roleName === "Coordinator"
      ? "Trưởng ban tổ chức phụ trách điều phối các giải đấu Hackathon & quản trị tiêu chí chuyên môn."
      : roleName === "Judge"
      ? "Hội đồng giám khảo chuyên môn đánh giá đồ án & giải pháp công nghệ."
      : roleName === "Mentor"
      ? "Cố vấn kỹ thuật đồng hành hỗ trợ các đội thi trong quá trình phát triển sản phẩm."
      : "Quản trị viên toàn quyền hệ thống SEAL."
  );

  // Student Form states
  const [schoolChoice, setSchoolChoice] = useState<"FPT" | "OTHER">(
    user?.isFpt !== false ? "FPT" : "OTHER"
  );
  const [schoolId, setSchoolId] = useState(user?.schoolId || "");
  const [studentCode, setStudentCode] = useState(user?.studentCode || user?.StudentId || "");
  const [fullName, setFullName] = useState(user?.fullName || user?.FullName || "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    user?.photoStudentCardUrl || null
  );

  // FPT Verification state
  const [fptCode, setFptCode] = useState(studentCode || "");
  const [fptResult, setFptResult] = useState<FptStudentResponse | null>(null);
  const [fptError, setFptError] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [requestUnblockSuccess, setRequestUnblockSuccess] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change password state
  const [showPasswordCard, setShowPasswordCard] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const { mutateAsync: updateProfile, isPending: isSubmittingProfile } = useUpdateStudentProfile();
  const isSubmitting = isSubmittingProfile || isUploadingPhoto;
  const { mutateAsync: verifyFpt, isPending: isVerifying } = useFptStudentVerification();
  const { mutateAsync: requestUnblock, isPending: isUnblocking } = useRequestUnblock();
  const { mutateAsync: changePassword, isPending: isChangingPassword } = useChangePassword();
  const { data: schools = [], isLoading: loadingSchools } = useGetSchools();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (!oldPassword) {
      setPasswordError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      await changePassword({
        oldPassword,
        newPassword,
        confirmNewPassword,
      });
      setPasswordSuccess(true);
      toast.success("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.";
      setPasswordError(errMsg);
      toast.error(errMsg);
    }
  };

  // Two-strike rejection history
  const { data: rejections = [] } = useGetUserRejections(user?.id);
  const rejectionCount = rejections.filter((r) => r.isActive !== false).length;
  const isBlocked = rejectionCount >= 2;
  const lastRejection = rejections[rejections.length - 1];

  const handleFileDrop = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setSubmitError("Chỉ chấp nhận định dạng file ảnh (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError("Dung lượng file ảnh không được vượt quá 5MB.");
      return;
    }
    setSubmitError("");
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);

    if (isStaff) {
      setSubmitSuccess(true);
      setIsEditing(false);
      return;
    }

    if (!studentCode.trim()) {
      setSubmitError("Vui lòng nhập Mã số sinh viên (MSSV).");
      return;
    }

    if (schoolChoice === "OTHER" && !schoolId) {
      setSubmitError("Vui lòng chọn Trường học của bạn.");
      return;
    }

    if (schoolChoice === "OTHER" && !photoPreview && !photoFile) {
      setSubmitError("Sinh viên trường ngoài FPT bắt buộc phải tải lên Ảnh thẻ sinh viên HD.");
      return;
    }

    try {
      let photoCardUrl = user?.photoStudentCardUrl || undefined;
      if (photoFile) {
        setIsUploadingPhoto(true);
        const uploaded = await uploadRepository.uploadFile(photoFile);
        photoCardUrl = uploaded.fileUrl;
      }

      await updateProfile({
        fullName: fullName.trim() || undefined,
        isFpt: schoolChoice === "FPT",
        schoolId: schoolChoice === "OTHER" ? schoolId : undefined,
        studentCode: studentCode.trim(),
        photoStudentCardUrl: photoCardUrl,
      } as any);

      setSubmitSuccess(true);
      toast.success("Cập nhật thông tin hồ sơ thành công!");
      setIsEditing(false);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || "Không thể cập nhật hồ sơ. Vui lòng thử lại sau.";
      setSubmitError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div className="hud-lattice min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-muted)] pb-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--accent-primary)] tracking-widest uppercase font-bold">
              <User className="w-3.5 h-3.5" /> QUẢN LÝ THÔNG TIN HỒ SƠ
            </div>
            <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-[var(--text-primary)] mt-1">
              {isStaff ? "HỒ SƠ CÁN BỘ & BAN TỔ CHỨC" : "HỒ SƠ CÁ NHÂN & THẺ SINH VIÊN"}
            </h1>
            <p className="font-mono text-xs text-[var(--text-muted)] mt-1">
              {isStaff
                ? "Quản lý thông tin cán bộ ban tổ chức, hội đồng chuyên môn và thông tin liên hệ."
                : "Quản lý thông tin tài khoản, cập nhật Mã Số Sinh Viên (MSSV) & Ảnh thẻ để Admin/BTC phê duyệt."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 border border-[var(--accent-primary)]/40 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 font-mono text-xs font-bold hud-clipped cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 className="w-4 h-4" />
              {isEditing ? "HỦY CẬP NHẬT" : "CHỈNH SỬA HỒ SƠ"}
            </button>
          </div>
        </div>

        {/* ── Status Banner Card ── */}
        {isStaff ? (
          /* Staff Status Banner */
          <Card className="p-6 hud-clipped border border-[var(--accent-coordinator)]/40 bg-[var(--accent-coordinator)]/5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center hud-clipped shrink-0 bg-[var(--accent-coordinator)]/10 text-[var(--accent-coordinator)] border border-[var(--accent-coordinator)]/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-mono text-[10px] font-bold tracking-widest uppercase block text-[var(--accent-coordinator)]">
                    TÀI KHOẢN CÁN BỘ BAN TỔ CHỨC
                  </span>
                  <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mt-0.5">
                    {roleName === "Coordinator"
                      ? "Tài Khoản Event Coordinator Đã Kích Hoạt"
                      : roleName === "Judge"
                      ? "Tài Khoản Giám Khảo Chấm Điểm Đã Kích Hoạt"
                      : roleName === "Mentor"
                      ? "Tài Khoản Cố Vấn Chuyên Môn Đã Kích Hoạt"
                      : "Tài Khoản Quản Trị Viên Hệ Thống (System Admin)"}
                  </h3>
                  <p className="font-mono text-xs text-[var(--text-muted)] mt-1">
                    Tài khoản của bạn đã được xác thực với đầy đủ quyền hạn vận hành trong hệ thống SEAL Hackathon.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          /* Student Status Banner */
          <Card className={`p-6 hud-clipped border ${
            isBlocked
              ? "border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5"
              : user?.isApproved
              ? "border-[var(--color-success)]/50 bg-[var(--color-success)]/5"
              : user?.isRejected
              ? "border-[var(--color-danger)]/50 bg-[var(--color-danger)]/5"
              : "border-[var(--color-warning)]/50 bg-[var(--color-warning)]/5"
          }`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 flex items-center justify-center hud-clipped shrink-0 ${
                  isBlocked
                    ? "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/30"
                    : user?.isApproved
                    ? "bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/30"
                    : user?.isRejected
                    ? "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/30"
                    : "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/30 animate-pulse"
                }`}>
                  {isBlocked ? (
                    <Lock className="w-6 h-6" />
                  ) : user?.isApproved ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : user?.isRejected ? (
                    <XCircle className="w-6 h-6" />
                  ) : (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  )}
                </div>

                <div>
                  <span className={`font-mono text-[10px] font-bold tracking-widest uppercase block ${
                    isBlocked
                      ? "text-[var(--color-danger)]"
                      : user?.isApproved
                      ? "text-[var(--color-success)]"
                      : user?.isRejected
                      ? "text-[var(--color-danger)]"
                      : "text-[var(--color-warning)]"
                  }`}>
                    {isBlocked
                      ? "TÀI KHOẢN BỊ TẠM KHÓA"
                      : user?.isApproved
                      ? "HỒ SƠ SINH VIÊN HỢP LỆ (APPROVED)"
                      : user?.isRejected
                      ? "HỒ SƠ BỊ TỪ CHỐI BỞI BAN TỔ CHỨC"
                      : "ĐANG CHỜ DUYỆT THẺ SINH VIÊN (PENDING)"}
                  </span>

                  <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mt-0.5">
                    {isBlocked
                      ? "Hồ Sơ Đã Bị Từ Chối 2 Lần — Tài Khoản Tạm Khóa"
                      : user?.isApproved
                      ? "Tài Khoản Sinh Viên Đã Được Phê Duyệt"
                      : user?.isRejected
                      ? "Hồ Sơ Của Bạn Cần Được Cập Nhật Lại"
                      : "Hồ Sơ Đang Trong Hàng Đợi Duyệt Của BTC & Admin"}
                  </h3>

                  <p className="font-mono text-xs text-[var(--text-muted)] mt-1">
                    {isBlocked
                      ? "Bạn có thể gửi Yêu cầu mở khóa (Request Unblock) bên dưới để BTC xem xét thủ công."
                      : user?.isApproved
                      ? "Bạn đã được cấp đầy đủ quyền tham gia các giải đấu Hackathon & tạo Đội thi."
                      : user?.isRejected
                      ? `Lý do từ chối: "${lastRejection?.reason || "Ảnh thẻ không rõ nét hoặc MSSV không khớp"}". Vui lòng bấm Cập nhật hồ sơ bên dưới.`
                      : "BTC và System Admin sẽ đối chiếu ảnh thẻ SV / hệ thống FPT để duyệt tài khoản trong 24h."}
                  </p>
                </div>
              </div>

              {!user?.isApproved && !isBlocked && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--bg-base)] font-mono text-xs font-bold uppercase hover:bg-white transition-all hud-clipped cursor-pointer shrink-0"
                >
                  {user?.isRejected ? "CẬP NHẬT LẠI →" : "CẬP NHẬT ẢNH THẺ →"}
                </button>
              )}
            </div>
          </Card>
        )}

        {/* ── Submission Success Toast Banner ── */}
        {submitSuccess && (
          <div className="p-4 bg-[var(--color-success)]/10 border border-[var(--color-success)]/40 font-mono text-xs text-[var(--color-success)] flex items-center justify-between hud-clipped">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Đã lưu cập nhật thông tin hồ sơ thành công!</span>
            </div>
            <button onClick={() => setSubmitSuccess(false)} className="hover:underline font-bold">
              ĐÓNG
            </button>
          </div>
        )}

        {/* ── Main Content Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Col: User Identity Card */}
          <div className="space-y-6">
            <Card className="p-6 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-6">
              <div className="flex flex-col items-center text-center pb-6 border-b border-[var(--border-muted)]">
                <div className="w-20 h-20 rounded-full bg-[var(--accent-primary)]/10 border-2 border-[var(--accent-primary)]/40 flex items-center justify-center text-[var(--accent-primary)] text-2xl font-bold font-mono mb-3">
                  {fullName ? fullName.charAt(0).toUpperCase() : (user?.fullName || user?.email || "U").charAt(0).toUpperCase()}
                </div>
                <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                  {fullName || user?.fullName || user?.FullName || user?.email || "Thí sinh"}
                </h3>
                <span className="font-mono text-xs text-[var(--text-muted)] flex items-center gap-1 mt-1">
                  <Mail className="w-3.5 h-3.5" /> {user?.email || "Chưa có email"}
                </span>
                
                {/* Dynamic Role Badge */}
                <span className={`mt-2 px-3 py-1 font-mono text-[10px] font-bold uppercase hud-clipped ${
                  roleName === "Coordinator"
                    ? "bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/30"
                    : roleName === "Judge"
                    ? "bg-[var(--accent-judge)]/10 text-[var(--accent-judge)] border border-[var(--accent-judge)]/30"
                    : roleName === "Mentor"
                    ? "bg-[#2dd4bf]/10 text-[#2dd4bf] border border-[#2dd4bf]/30"
                    : roleName === "Admin"
                    ? "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/30"
                    : "bg-[var(--accent-team)]/10 text-[var(--accent-team)] border border-[var(--accent-team)]/30"
                }`}>
                  VAI TRÒ: {
                    roleName === "Coordinator"
                      ? "BAN TỔ CHỨC"
                      : roleName === "Judge"
                      ? "GIÁM KHẢO"
                      : roleName === "Mentor"
                      ? "CỐ VẤN"
                      : roleName === "Admin"
                      ? "QUẢN TRỊ VIÊN HỆ THỐNG"
                      : "THÍ SINH (STUDENT)"
                  }
                </span>
              </div>

              {isStaff ? (
                /* Staff Professional Info Summary */
                <div className="space-y-4 font-mono text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-[var(--border-muted)]/50">
                    <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Đơn Vị Công Tác:
                    </span>
                    <span className="font-bold text-[var(--text-primary)] truncate max-w-[160px]">
                      {staffOrg || "Chưa cập nhật"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-[var(--border-muted)]/50">
                    <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                      <IdCard className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Phân Quyền:
                    </span>
                    <span className="font-bold text-[var(--accent-coordinator)]">
                      Ban Tổ Chức Hệ Thống
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-[var(--border-muted)]/50">
                    <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Trạng Thái:
                    </span>
                    <span className="font-bold text-[var(--color-success)]">
                      Đang Hoạt Động
                    </span>
                  </div>
                </div>
              ) : (
                /* Student Info Summary */
                <div className="space-y-4 font-mono text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-[var(--border-muted)]/50">
                    <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Trường Học:
                    </span>
                    <span className="font-bold text-[var(--text-primary)] truncate max-w-[160px]">
                      {schoolChoice === "FPT" ? "Trường Đại Học FPT" : (schools.find(s => s.id === schoolId || s.schoolId === schoolId)?.schoolName || (schoolId ? schoolId : "Chưa chọn trường"))}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-[var(--border-muted)]/50">
                    <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                      <IdCard className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Mã Số SV (MSSV):
                    </span>
                    <span className="font-bold text-[var(--accent-primary)]">
                      {studentCode || "Chưa cập nhật"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-[var(--border-muted)]/50">
                    <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Xác Minh FPT:
                    </span>
                    <span className={`font-bold ${schoolChoice === "FPT" ? "text-[var(--color-success)]" : "text-[var(--text-muted)]"}`}>
                      {schoolChoice === "FPT" ? "Tự động" : "Trường ngoài"}
                    </span>
                  </div>
                </div>
              )}

              {/* Student Card Photo Preview Area (Only for Students) */}
              {!isStaff && (
                <div className="pt-2">
                  <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider block font-bold mb-2">
                    ẢNH THẺ SINH VIÊN ĐÃ NỘP:
                  </span>
                  {photoPreview ? (
                    <div className="relative border border-[var(--border-muted)] bg-[var(--bg-base)] p-1 hud-clipped">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreview}
                        alt="Ảnh thẻ sinh viên"
                        className="w-full h-40 object-cover rounded-none"
                      />
                      <div className="mt-1 font-mono text-[10px] text-center text-[var(--text-muted)]">
                        Chất lượng: HD Standard
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 border border-dashed border-[var(--border-muted)] bg-[var(--bg-input)]/50 text-center font-mono text-xs text-[var(--text-muted)] hud-clipped">
                      Chưa có ảnh thẻ sinh viên.
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Rejection History Section (Only for Students) */}
            {!isStaff && rejections.length > 0 && (
              <Card className="p-6 bg-[var(--bg-panel)] border border-[var(--color-danger)]/30 hud-clipped space-y-3">
                <h4 className="font-mono text-xs font-bold text-[var(--color-danger)] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> LỊCH SỬ TỪ CHỐI HỒ SƠ ({rejections.length})
                </h4>
                <div className="space-y-2 font-mono text-xs">
                  {rejections.map((r, i) => (
                    <div key={r.id || i} className="p-3 bg-[var(--bg-base)] border border-[var(--border-muted)] space-y-1">
                      <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                        <span className="text-[var(--color-danger)] font-bold">Lần #{i + 1}</span>
                        <span>{r.createdTime ? new Date(r.createdTime).toLocaleDateString("vi-VN") : "Gần đây"}</span>
                      </div>
                      <p className="text-[var(--text-primary)]">
                        Lý do: <span className="text-[var(--color-danger)] font-semibold">{r.reason || "Ảnh thẻ không đạt tiêu chuẩn"}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Col: Form Editing */}
          <div className="md:col-span-2 space-y-6">
            {isStaff ? (
              /* Staff Professional Edit Form */
              <Card className="p-6 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-4">
                  <h3 className="font-display font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[var(--accent-primary)]" />
                    THÔNG TIN CÔNG TÁC &amp; BAN TỔ CHỨC
                  </h3>
                  <span className="font-mono text-[10px] px-2.5 py-1 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-muted)]">
                    {isEditing ? "CHẾ ĐỘ CHỈNH SỬA" : "CHẾ ĐỘ XEM"}
                  </span>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-5 font-mono text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block font-bold">
                      Họ và Tên Cán Bộ *
                    </label>
                    <Input
                      type="text"
                      value={fullName || user?.fullName || user?.FullName || ""}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block font-bold">
                      Email Công Tác
                    </label>
                    <Input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="opacity-70 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block font-bold">
                      Đơn Vị Công Tác / Bộ Môn / Viện
                    </label>
                    <Input
                      type="text"
                      value={staffOrg}
                      onChange={(e) => setStaffOrg(e.target.value)}
                      disabled={!isEditing}
                      placeholder="FPT University - Ban Công Tác Học Đường"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block font-bold">
                      Giới Thiệu Chuyên Môn / Trách Nhiệm Sự Kiện
                    </label>
                    <textarea
                      rows={3}
                      value={staffBio}
                      onChange={(e) => setStaffBio(e.target.value)}
                      disabled={!isEditing}
                      className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped focus:outline-none focus:border-[var(--accent-primary)] disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>

                  {isEditing && (
                    <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-muted)]">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsEditing(false)}
                      >
                        HỦY
                      </Button>
                      <Button type="submit" variant="primary">
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> LƯU THAY ĐỔI
                      </Button>
                    </div>
                  )}
                </form>
              </Card>
            ) : (
              /* Student Verification Form */
              <Card className="p-6 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-4">
                  <h3 className="font-display font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
                    <IdCard className="w-5 h-5 text-[var(--accent-primary)]" />
                    CẬP NHẬT THÔNG TIN &amp; THẺ SINH VIÊN
                  </h3>
                  <Badge tone={isEditing ? "warning" : "neutral"}>
                    {isEditing ? "ĐANG CHỈNH SỬA" : "CHẾ ĐỘ XEM"}
                  </Badge>
                </div>

                {submitError && (
                  <div className="p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 font-mono text-xs text-[var(--color-danger)]">
                    {submitError}
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-5 font-mono text-xs">
                  
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">
                      Họ Và Tên Sinh Viên *
                    </label>
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={!isEditing}
                      placeholder="Nhập họ và tên đầy đủ..."
                    />
                  </div>

                  {/* School Choice Dropdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">
                        Phân Loại Trường *
                      </label>
                      <select
                        value={schoolChoice}
                        onChange={(e) => setSchoolChoice(e.target.value as "FPT" | "OTHER")}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs focus:outline-none focus:border-[var(--accent-primary)]"
                      >
                        <option value="FPT">Sinh Viên FPT University</option>
                        <option value="OTHER">Sinh Viên Trường Khác (Non-FPT)</option>
                      </select>
                    </div>

                    {schoolChoice === "OTHER" && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">
                          Chọn Trường Học *
                        </label>
                        <select
                          value={schoolId}
                          onChange={(e) => setSchoolId(e.target.value)}
                          disabled={!isEditing || loadingSchools}
                          className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs focus:outline-none focus:border-[var(--accent-primary)]"
                        >
                          <option value="">-- Chọn trường học --</option>
                          {schools.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.schoolName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Student Code (MSSV) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">
                      Mã Số Sinh Viên (MSSV) *
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={studentCode}
                        onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                        disabled={!isEditing}
                        placeholder="Ví dụ: SE171234..."
                        className="flex-1"
                      />
                      {schoolChoice === "FPT" && isEditing && (
                        <Button
                          type="button"
                          variant="primary"
                          disabled={isVerifying || studentCode.length < 4}
                          onClick={async () => {
                            setFptError("");
                            try {
                              const result = await verifyFpt(studentCode);
                              setFptResult(result);
                              if (!result?.isValid) setFptError("MSSV không tìm thấy trên hệ thống FPT.");
                            } catch {
                              setFptError("Lỗi kết nối xác minh FPT.");
                            }
                          }}
                          className="flex items-center gap-1.5 px-3"
                        >
                          {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                    {fptError && <span className="text-xs text-[var(--color-danger)] font-mono">{fptError}</span>}
                  </div>

                  {/* FPT Auto-Verify Badge */}
                  {fptResult?.isValid && (
                    <div className="p-3 bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 font-mono text-xs">
                      <span className="text-[var(--color-success)] font-bold">ĐÃ XÁC MINH FPT:</span> {fptResult.fullName} ({fptResult.studentCode}) - {fptResult.major}
                    </div>
                  )}

                  {/* Photo Upload Area */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold block">
                      Tải Lên Ảnh Thẻ Sinh Viên HD (Mặt Trước) *
                    </label>
                    
                    {photoPreview ? (
                      <div className="relative border border-[var(--border-muted)] bg-[var(--bg-base)] p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photoPreview} alt="Preview" className="w-16 h-12 object-cover border border-[var(--border-muted)]" />
                          <div>
                            <span className="font-bold text-[var(--text-primary)] block">Ảnh Thẻ Sinh Viên HD</span>
                            <span className="text-[10px] text-[var(--text-muted)]">File hợp lệ (PNG/JPG)</span>
                          </div>
                        </div>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                            className="text-[var(--color-danger)] font-bold hover:underline"
                          >
                            Xóa ảnh
                          </button>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`p-6 border-2 border-dashed flex flex-col items-center justify-center hud-clipped transition-all ${
                          !isEditing ? "opacity-50 pointer-events-none" : "cursor-pointer"
                        } ${
                          isDragging ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5" : "border-[var(--border-muted)] hover:border-[var(--accent-primary)]/50"
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileDrop(f); }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                        <span className="text-xs font-mono text-[var(--text-primary)]">
                          Kéo thả file ảnh thẻ vào đây hoặc <span className="text-[var(--accent-primary)] underline">Chọn từ máy</span>
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] mt-1">Dung lượng tối đa 5MB</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileDrop(f); }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Form Action Buttons */}
                  {isEditing && (
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-muted)]">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-[var(--border-muted)] text-[var(--text-muted)] font-bold hover:bg-white/5 cursor-pointer"
                      >
                        HỦY
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-[var(--accent-primary)] text-[var(--bg-base)] font-bold hover:bg-white transition-all cursor-pointer hud-clipped flex items-center gap-2"
                      >
                        {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        GỬI CẬP NHẬT HỒ SƠ
                      </button>
                    </div>
                  )}
                </form>
              </Card>
            )}

            {/* Change Password Card */}
            <Card className="p-6 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4 text-[var(--accent-primary)]" /> ĐỔI MẬT KHẨU
                </h4>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowPasswordCard(!showPasswordCard);
                    setPasswordError("");
                    setPasswordSuccess(false);
                  }}
                  className="text-xs font-mono text-[var(--accent-primary)]"
                >
                  {showPasswordCard ? "ĐÓNG LẠI" : "THAY ĐỔI MẬT KHẨU"}
                </Button>
              </div>

              {showPasswordCard && (
                <form onSubmit={handleChangePassword} className="space-y-4 pt-2 border-t border-[var(--border-muted)]">
                  {passwordError && (
                    <div className="p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-xs font-mono text-[var(--color-danger)] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-xs font-mono text-[var(--color-success)] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      Mật khẩu đã được thay đổi thành công!
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-mono text-[var(--text-muted)] mb-1 uppercase">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped focus:outline-none focus:border-[var(--accent-primary)]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-[var(--text-muted)] mb-1 uppercase">
                        Mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="•••••••• (Tối thiểu 6 ký tự)"
                        className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped focus:outline-none focus:border-[var(--accent-primary)]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-[var(--text-muted)] mb-1 uppercase">
                        Xác nhận mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped focus:outline-none focus:border-[var(--accent-primary)]"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isChangingPassword}
                      className="justify-center flex items-center gap-2"
                    >
                      {isChangingPassword ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                      XÁC NHẬN ĐỔI MẬT KHẨU
                    </Button>
                  </div>
                </form>
              )}
            </Card>

            {/* Unblock Request Card for Blocked Accounts */}
            {!isStaff && isBlocked && (
              <Card className="p-6 bg-[var(--bg-panel)] border border-[var(--color-danger)]/40 hud-clipped space-y-4">
                <h4 className="font-mono text-sm font-bold text-[var(--color-danger)] uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4" /> YÊU CẦU MỞ KHÓA TÀI KHOẢN (REQUEST UNBLOCK)
                </h4>
                <p className="font-mono text-xs text-[var(--text-muted)] leading-relaxed">
                  Tài khoản của bạn đã vượt quá giới hạn 2 lần từ chối hồ sơ. Bạn có thể gửi yêu cầu giải trình cho Ban Tổ Chức để xem xét mở khóa thủ công.
                </p>

                {requestUnblockSuccess ? (
                  <div className="p-3 bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-xs font-mono text-[var(--color-success)] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Yêu cầu mở khóa đã được gửi tới Ban Tổ Chức. Phản hồi sẽ gửi qua email trong 24h.
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    disabled={isUnblocking}
                    onClick={async () => {
                      if (!user?.email) return;
                      await requestUnblock(user.email).catch(console.warn);
                      setRequestUnblockSuccess(true);
                    }}
                    className="w-full justify-center bg-[var(--color-danger)] text-white hover:bg-white hover:text-black font-bold"
                  >
                    {isUnblocking ? "ĐANG GỬI YÊU CẦU..." : "GỬI YÊU CẦU MỞ KHÓA CHO BTC"}
                  </Button>
                )}
              </Card>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
