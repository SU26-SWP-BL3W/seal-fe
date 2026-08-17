"use client";

import { useState, useRef } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import {
  useSubmitStudentProfile,
  useFptStudentVerification,
  useRequestUnblock,
} from "@/repositories/authRepository";
import { useGetUserRejections } from "@/repositories/usersRepository";
import { useGetSchools } from "@/repositories/schoolsRepository";
import { uploadRepository } from "@/repositories/uploadRepository";
import { Button, Input, Card, Badge } from "@/components/ui";
import {
  Shield,
  GraduationCap,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  ArrowRight,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import type { FptStudentResponse } from "@/models/entities";

type Step = "choose" | "fpt" | "nonFpt" | "pending";

export function OnboardingProfileView() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("choose");
  const [fptCode, setFptCode] = useState("");
  const [fptResult, setFptResult] = useState<FptStudentResponse | null>(null);
  const [fptError, setFptError] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [requestUnblockSuccess, setRequestUnblockSuccess] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: submitProfile, isPending: isSubmittingProfile } = useSubmitStudentProfile();
  const isSubmitting = isSubmittingProfile || isUploadingPhoto;
  const { mutateAsync: verifyFpt, isPending: isVerifyingFpt } = useFptStudentVerification();
  const { mutateAsync: requestUnblock, isPending: isUnblocking } = useRequestUnblock();
  const { data: schools = [], isLoading: loadingSchools } = useGetSchools();

  const { data: rejections = [] } = useGetUserRejections(user?.id);
  const rejectionCount = rejections.filter((r) => r.isActive !== false).length;
  const isBlocked = rejectionCount >= 2;

  const handleVerifyFpt = async () => {
    setFptError("");
    setFptResult(null);
    try {
      const result = await verifyFpt(fptCode);
      if (result?.isValid) {
        setFptResult(result);
      } else {
        setFptError("Mã sinh viên không tồn tại trong hệ thống FPT.");
      }
    } catch {
      setFptError("Không thể kết nối hệ thống. Vui lòng thử lại sau.");
    }
  };

  if (user?.isApproved) {
    return (
      <ProfileStatusCard
        icon={<CheckCircle2 className="w-8 h-8 text-[var(--color-success)]" />}
        color="success"
        title="HỒ SƠ ĐÃ ĐƯỢC DUYỆT"
        message="Hồ sơ sinh viên của bạn đã được xác thực. Bạn có thể tham gia các sự kiện hackathon."
        action={
          <Button
            variant="primary"
            onClick={() => router.push("/events")}
            className="justify-center flex items-center gap-2"
          >
            XEM SỰ KIỆN <ArrowRight className="w-4 h-4" />
          </Button>
        }
      />
    );
  }

  if (isBlocked) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] hud-lattice px-4">
        <Card className="w-full max-w-lg p-[var(--space-xl)] bg-[var(--bg-panel)] hud-clipped border-[var(--color-danger)]/30">
          <div className="flex items-center gap-3 mb-6 p-4 bg-[rgba(239,68,68,0.05)] border border-[var(--color-danger)]/20">
            <AlertTriangle className="w-6 h-6 text-[var(--color-danger)] flex-shrink-0" />
            <div>
              <p className="font-mono text-sm font-bold text-[var(--color-danger)] tracking-wider uppercase">
                ⚠ TÀI KHOẢN TẠM KHÓA
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Hồ sơ đã bị từ chối {rejectionCount} lần — tài khoản cần yêu cầu mở khóa
              </p>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <Lock className="w-12 h-12 text-[var(--color-danger)]/50" />
          </div>

          <h2 className="font-display text-xl font-bold text-[var(--color-danger)] mb-4 tracking-widest uppercase text-center">
            TÀI KHOẢN BỊ KHÓA
          </h2>

          <div className="space-y-3 mb-6">
            <p className="text-xs font-mono text-[var(--text-muted)] leading-relaxed">
              Hồ sơ của bạn đã bị từ chối tối đa 2 lần. Vui lòng gửi yêu cầu mở khóa đến Ban Tổ Chức kèm lý do để được hỗ trợ.
            </p>
            <div className="p-3 bg-[var(--bg-base)] border border-[var(--color-danger)]/20 space-y-2">
              <p className="text-[11px] font-mono text-[var(--text-muted)] font-bold uppercase">Lịch sử từ chối:</p>
              {rejections.map((r, i) => (
                <div key={i} className="text-xs font-mono flex items-start gap-2 text-[var(--color-danger)]">
                  <span>•</span>
                  <div>
                    <span className="font-bold">Lần {i + 1}:</span> {r.reason || "Không đạt yêu cầu xác minh"}
                    {r.rejectedTime && (
                      <span className="text-[10px] text-[var(--text-muted)] ml-2">
                        ({new Date(r.rejectedTime).toLocaleDateString("vi-VN")})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {submitError && (
              <div className="p-3 bg-[rgba(239,68,68,0.08)] border border-[var(--color-danger)]/20 text-xs text-[var(--color-danger)] font-mono">
                ⚠ {submitError}
              </div>
            )}
            <Button
              variant="secondary"
              disabled={isUnblocking || requestUnblockSuccess}
              onClick={async () => {
                if (!user?.email) return;
                setSubmitError("");
                try {
                  await requestUnblock(user.email);
                  setRequestUnblockSuccess(true);
                } catch (err: any) {
                  setSubmitError(err?.response?.data?.message || "Không thể gửi yêu cầu mở khóa. Vui lòng thử lại.");
                }
              }}
              className="w-full justify-center flex items-center gap-2 border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[rgba(239,68,68,0.1)]"
            >
              {requestUnblockSuccess ? (
                <>✓ ĐÃ GỬI YÊU CẦU MỞ KHÓA</>
              ) : isUnblocking ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Đang gửi yêu cầu...</>
              ) : (
                <>YÊU CẦU MỞ KHÓA TÀI KHOẢN <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => logout()}
              className="w-full justify-center"
            >
              ĐĂNG XUẤT
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (user?.studentCode && !user?.isApproved && !user?.isRejected && step !== "pending") {
    return (
      <ProfileStatusCard
        icon={<RefreshCw className="w-8 h-8 text-[var(--color-warning)] animate-spin" />}
        color="warning"
        title="HỒ SƠ ĐANG CHỜ DUYỆT"
        message="Hồ sơ sinh viên đang trong hàng đợi xét duyệt. Ban Tổ Chức sẽ thông báo kết quả qua email."
        sub={
          <div className="mt-4 p-3 bg-[var(--bg-base)] border border-[var(--border-muted)] text-xs font-mono text-left">
            <p className="text-[var(--text-muted)]">
              Mã SV: <span className="text-[var(--accent-primary)]">{user.studentCode}</span>
            </p>
          </div>
        }
        action={null}
      />
    );
  }

  if (step === "choose") {
    return (
      <div className="flex items-center justify-center min-h-[70vh] hud-lattice px-4 py-8">
        <Card className="w-full max-w-lg p-[var(--space-xl)] bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)]">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-[var(--accent-primary)]" />
            <h2 className="font-display text-lg font-bold text-[var(--accent-primary)] tracking-widest uppercase">
              HOÀN THIỆN HỒ SƠ SINH VIÊN
            </h2>
          </div>
          <p className="text-xs font-mono text-[var(--text-muted)] mb-6 ml-8">
            Bước bắt buộc trước khi tham gia SEAL Hackathon
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setStep("fpt")}
              className="group p-5 bg-[var(--bg-base)] border border-[var(--border-muted)] hover:border-[var(--accent-primary)]/50 transition-all duration-200 text-left hud-clipped cursor-pointer"
            >
              <div className="w-10 h-10 bg-[rgba(0,217,255,0.08)] border border-[var(--accent-primary)]/20 flex items-center justify-center mb-3">
                <GraduationCap className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <p className="font-mono text-sm font-bold text-[var(--text-primary)] tracking-wider mb-1">
                SINH VIÊN FPT
              </p>
              <p className="text-xs text-[var(--text-muted)] mb-3">Xác minh tự động qua hệ thống FPT.</p>
              <Badge tone="success" className="text-[10px]">AUTO-VERIFY</Badge>
            </button>

            <button
              onClick={() => setStep("nonFpt")}
              className="group p-5 bg-[var(--bg-base)] border border-[var(--border-muted)] hover:border-[var(--accent-coordinator)]/50 transition-all duration-200 text-left hud-clipped cursor-pointer"
            >
              <div className="w-10 h-10 bg-[rgba(167,139,250,0.08)] border border-[var(--accent-coordinator)]/20 flex items-center justify-center mb-3">
                <Upload className="w-5 h-5 text-[var(--accent-coordinator)]" />
              </div>
              <p className="font-mono text-sm font-bold text-[var(--text-primary)] tracking-wider mb-1">
                TRƯỜNG KHÁC
              </p>
              <p className="text-xs text-[var(--text-muted)] mb-3">Upload ảnh thẻ SV để BTC duyệt.</p>
              <Badge tone="warning" className="text-[10px]">MANUAL REVIEW</Badge>
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === "fpt") {
    return (
      <div className="flex items-center justify-center min-h-[70vh] hud-lattice px-4 py-8">
        <Card className="w-full max-w-md p-[var(--space-xl)] bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)]">
          <button
            onClick={() => { setStep("choose"); setFptResult(null); setFptError(""); }}
            className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4 flex items-center gap-1 cursor-pointer"
          >
            ← Quay lại
          </button>

          <div className="flex items-center gap-2 mb-6">
            <GraduationCap className="w-5 h-5 text-[var(--accent-primary)]" />
            <div>
              <h2 className="font-display text-lg font-bold text-[var(--accent-primary)] tracking-widest uppercase">
                XÁC MINH SINH VIÊN FPT
              </h2>
              <p className="text-xs font-mono text-[var(--text-muted)]">Xác thực tự động qua mã sinh viên FPT Edu</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                Mã sinh viên FPT <span className="text-[var(--color-danger)]">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="VD: SE170000"
                  value={fptCode}
                  onChange={(e) => setFptCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyFpt()}
                  disabled={isVerifyingFpt}
                />
                <Button
                  variant="secondary"
                  onClick={handleVerifyFpt}
                  disabled={isVerifyingFpt || !fptCode.trim()}
                  className="shrink-0 flex items-center gap-1.5"
                >
                  {isVerifyingFpt ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Kiểm tra
                </Button>
              </div>
            </div>

            {fptError && (
              <div className="p-3 bg-[rgba(239,68,68,0.08)] border border-[var(--color-danger)]/20 text-xs text-[var(--color-danger)] font-mono">
                ⚠ {fptError}
              </div>
            )}

            {fptResult && (
              <div className="p-4 bg-[rgba(0,217,255,0.05)] border border-[var(--accent-primary)]/30 text-xs font-mono space-y-2">
                <div className="flex items-center gap-2 text-[var(--color-success)] font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác thực thành công!</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[var(--text-muted)] pt-2 border-t border-[var(--border-muted)]">
                  <div>Họ tên: <span className="text-[var(--text-primary)] font-bold">{fptResult.fullName}</span></div>
                  <div>Mã SV: <span className="text-[var(--text-primary)] font-bold">{fptResult.studentCode}</span></div>
                  <div>Chuyên ngành: <span className="text-[var(--text-primary)]">{fptResult.major || "Kỹ thuật phần mềm"}</span></div>
                  <div>Khóa: <span className="text-[var(--text-primary)]">{fptResult.enrollYear ? `K${fptResult.enrollYear - 2004}` : "K18"}</span></div>
                </div>
              </div>
            )}

            {fptResult && (
              <Button
                variant="primary"
                disabled={isSubmitting}
                onClick={async () => {
                  setSubmitError("");
                  try {
                    await submitProfile({
                      isFpt: true,
                      studentCode: fptResult.studentCode ?? fptCode,
                      fullName: fptResult.fullName ?? undefined,
                    } as any);
                    setStep("pending");
                  } catch (err: any) {
                    setSubmitError(err?.response?.data?.message || "Không thể gửi hồ sơ. Vui lòng thử lại.");
                  }
                }}
                className="w-full justify-center flex items-center gap-2"
              >
                {isSubmitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Đang gửi...</> : <>XÁC NHẬN HỒ SƠ <ArrowRight className="w-4 h-4" /></>}
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (step === "nonFpt") {
    const handleFileDrop = (file: File) => {
      if (!file.type.startsWith("image/")) { setSubmitError("Chỉ chấp nhận file ảnh (PNG, JPG)."); return; }
      if (file.size > 5 * 1024 * 1024) { setSubmitError("File không được vượt quá 5MB."); return; }
      setSubmitError("");
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    };

    return (
      <div className="flex items-center justify-center min-h-[70vh] hud-lattice px-4 py-8">
        <Card className="w-full max-w-lg p-[var(--space-xl)] bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)]">
          <button
            onClick={() => { setStep("choose"); setPhotoFile(null); setPhotoPreview(null); }}
            className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4 flex items-center gap-1 cursor-pointer"
          >
            ← Quay lại
          </button>

          <div className="flex items-center gap-2 mb-6">
            <Upload className="w-5 h-5 text-[var(--accent-coordinator)]" />
            <div>
              <h2 className="font-display text-lg font-bold text-[var(--accent-coordinator)] tracking-widest uppercase">
                TRƯỜNG NGOÀI FPT
              </h2>
              <p className="text-xs font-mono text-[var(--text-muted)]">Ban tổ chức xét duyệt qua ảnh thẻ sinh viên</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                Trường <span className="text-[var(--color-danger)]">*</span>
              </label>
              <div className="relative">
                <select
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  disabled={loadingSchools}
                  className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-sm focus:outline-none focus:border-[var(--accent-coordinator)] appearance-none"
                >
                  <option value="">{loadingSchools ? "Đang tải..." : "-- Chọn trường --"}</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.schoolName}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                Mã sinh viên <span className="text-[var(--color-danger)]">*</span>
              </label>
              <Input
                type="text"
                placeholder="MSSV của bạn"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                Ảnh thẻ sinh viên <span className="text-[var(--color-danger)]">*</span>
              </label>
              {photoPreview ? (
                <div className="relative border border-[var(--color-success)]/30 bg-[var(--bg-base)]">
                  <img src={photoPreview} alt="Thẻ sinh viên" className="w-full max-h-48 object-contain" />
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    className="absolute top-2 right-2 bg-[var(--color-danger)] p-1 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div
                  className={`w-full p-6 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hud-clipped transition-all ${
                    isDragging ? "border-[var(--accent-coordinator)] bg-[rgba(167,139,250,0.05)]" : "border-[var(--border-muted)] hover:border-[var(--accent-coordinator)]/50"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileDrop(f); }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-[var(--text-muted)] mb-3" />
                  <span className="text-xs font-mono text-[var(--text-primary)] mb-1">
                    KÉO & THẢ hoặc <span className="text-[var(--accent-coordinator)] underline">TẢI LÊN</span>
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">PNG, JPG — Max 5MB</span>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileDrop(f); }} />
                </div>
              )}
            </div>

            {submitError && (
              <div className="p-3 bg-[rgba(239,68,68,0.08)] border border-[var(--color-danger)]/20 text-xs text-[var(--color-danger)] font-mono">
                ⚠ {submitError}
              </div>
            )}

            <Button
              variant="primary"
              disabled={isSubmitting || !schoolId || !studentCode || !photoFile}
              onClick={async () => {
                setSubmitError("");
                try {
                  let photoCardUrl: string | undefined;
                  if (photoFile) {
                    setIsUploadingPhoto(true);
                    const uploaded = await uploadRepository.uploadFile(photoFile);
                    photoCardUrl = uploaded.fileUrl;
                  }
                  await submitProfile({ isFpt: false, schoolId, studentCode, photoStudentCardUrl: photoCardUrl });
                  setStep("pending");
                } catch (err: any) {
                  setSubmitError(err?.response?.data?.message || "Không thể gửi hồ sơ. Vui lòng thử lại.");
                } finally {
                  setIsUploadingPhoto(false);
                }
              }}
              className="w-full justify-center flex items-center gap-2"
            >
              {isSubmitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Đang gửi...</> : <>NỘP HỒ SƠ <ArrowRight className="w-4 h-4" /></>}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ── STEP: PENDING ─────────────────────────────────────────
  return (
    <ProfileStatusCard
      icon={<RefreshCw className="w-8 h-8 text-[var(--color-warning)] animate-spin" />}
      color="warning"
      title="HỒ SƠ ĐANG CHỜ DUYỆT"
      message="Hồ sơ của bạn đã được gửi thành công. BTC sẽ xem xét và thông báo kết quả qua email trong 1-3 ngày làm việc."
      action={null}
    />
  );
}

// ─── Helper ────────────────────────────────────────────────────

function ProfileStatusCard({
  icon, color, title, message, sub, action,
}: {
  icon: React.ReactNode;
  color: "success" | "warning" | "danger";
  title: string;
  message: string;
  sub?: React.ReactNode;
  action: React.ReactNode | null;
}) {
  const colorVar = { success: "var(--color-success)", warning: "var(--color-warning)", danger: "var(--color-danger)" }[color];
  return (
    <div className="flex items-center justify-center min-h-[70vh] hud-lattice px-4">
      <Card className="w-full max-w-md p-[var(--space-xl)] bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)] text-center">
        <div className="flex justify-center mb-6 mx-auto w-16 h-16 items-center"
          style={{ background: `${colorVar}10`, border: `1px solid ${colorVar}30` }}>
          {icon}
        </div>
        <h2 className="font-display text-lg font-bold mb-3 tracking-widest uppercase" style={{ color: colorVar }}>{title}</h2>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">{message}</p>
        {sub}
        {action && <div className="mt-6">{action}</div>}
      </Card>
    </div>
  );
}
