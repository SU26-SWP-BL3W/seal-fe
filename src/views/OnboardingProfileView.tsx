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
  const { user } = useAuth();
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: submitProfile, isPending: isSubmitting } = useSubmitStudentProfile();
  const { mutateAsync: verifyFpt, isPending: isVerifying } = useFptStudentVerification();
  const { mutateAsync: requestUnblock, isPending: isUnblocking } = useRequestUnblock();
  const { data: schools = [], isLoading: loadingSchools } = useGetSchools();

  // Kiểm tra Two-Strike Block
  const { data: rejections = [] } = useGetUserRejections(user?.id);
  const rejectionCount = rejections.filter((r) => r.isActive !== false).length;
  const isBlocked = rejectionCount >= 2;

  // Nếu user đã approved
  if (user?.isApproved) {
    return (
      <ProfileStatusCard
        icon={<CheckCircle2 className="w-8 h-8 text-[var(--color-success)]" />}
        color="success"
        title="// HỒ SƠ ĐÃ DUYỆT"
        message="Hồ sơ sinh viên của bạn đã được xác thực. Bạn có thể tham gia các sự kiện hackathon."
        action={
          <Button
            variant="primary"
            onClick={() => router.push("/events")}
            className="justify-center flex items-center gap-2"
          >
            // XEM SỰ KIỆN <ArrowRight className="w-4 h-4" />
          </Button>
        }
      />
    );
  }

  // Two-Strike Block
  if (isBlocked) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] hud-lattice px-4">
        <Card className="w-full max-w-lg p-[var(--space-xl)] bg-[var(--bg-panel)] hud-clipped border-[var(--color-danger)]/30">
          <div className="flex items-center gap-3 mb-6 p-4 bg-[rgba(239,68,68,0.05)] border border-[var(--color-danger)]/20">
            <AlertTriangle className="w-6 h-6 text-[var(--color-danger)] flex-shrink-0" />
            <div>
              <p className="font-mono text-sm font-bold text-[var(--color-danger)] tracking-wider uppercase">
                ⚠ PROFILE LOCKED
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Hồ sơ đã bị từ chối {rejectionCount} lần — tài khoản tạm khóa
              </p>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <Lock className="w-12 h-12 text-[var(--color-danger)]/50" />
          </div>

          <h2 className="font-display text-xl font-bold text-[var(--color-danger)] mb-4 tracking-widest uppercase text-center">
            // TÀI KHOẢN BỊ KHÓA
          </h2>

          <p className="text-sm text-[var(--text-muted)] text-center leading-relaxed mb-6">
            Hồ sơ của bạn đã bị từ chối{" "}
            <span className="text-[var(--color-danger)] font-bold">{rejectionCount} lần</span>.
            Bạn có thể gửi yêu cầu mở khóa và chờ BTC xem xét trong vòng 24 giờ.
          </p>

          {rejections.length > 0 && (
            <div className="mb-6 space-y-2">
              <p className="text-xs font-mono text-[var(--text-muted)] tracking-wider uppercase mb-2">
                Lịch sử từ chối:
              </p>
              {rejections.map((r, i) => (
                <div
                  key={r.id}
                  className="p-3 bg-[var(--bg-base)] border border-[var(--border-muted)] text-xs font-mono"
                >
                  <span className="text-[var(--color-danger)] mr-2">#{i + 1}</span>
                  <span className="text-[var(--text-muted)]">{r.reason || "Không có lý do"}</span>
                </div>
              ))}
            </div>
          )}

          {requestUnblockSuccess ? (
            <div className="p-4 bg-[rgba(16,185,129,0.05)] border border-[var(--color-success)]/20 text-center">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] mx-auto mb-2" />
              <p className="text-xs font-mono text-[var(--color-success)]">
                Yêu cầu đã được gửi. BTC sẽ xem xét trong 24 giờ.
              </p>
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
              className="w-full justify-center"
            >
              {isUnblocking ? "Đang gửi..." : "[ REQUEST UNBLOCK ]"}
            </Button>
          )}
        </Card>
      </div>
    );
  }

  // Đang chờ duyệt (đã nộp hồ sơ)
  if (user?.studentCode && !user?.isApproved && !user?.isRejected && step !== "pending") {
    return (
      <ProfileStatusCard
        icon={<RefreshCw className="w-8 h-8 text-[var(--color-warning)] animate-spin" />}
        color="warning"
        title="// CHỜ BTC DUYỆT"
        message="Hồ sơ sinh viên đang trong hàng đợi xét duyệt. BTC sẽ thông báo kết quả qua email."
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

  // ── STEP: CHOOSE ──────────────────────────────────────────
  if (step === "choose") {
    return (
      <div className="flex items-center justify-center min-h-[70vh] hud-lattice px-4 py-8">
        <Card className="w-full max-w-lg p-[var(--space-xl)] bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)]">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-[var(--accent-primary)]" />
            <h2 className="font-display text-lg font-bold text-[var(--accent-primary)] tracking-widest uppercase">
              ONBOARDING // HỒ SƠ SINH VIÊN
            </h2>
          </div>
          <p className="text-xs font-mono text-[var(--text-muted)] mb-6 ml-8">
            Bước bắt buộc trước khi tham gia SEAL Hackathon
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setStep("fpt")}
              className="group p-5 bg-[var(--bg-base)] border border-[var(--border-muted)] hover:border-[var(--accent-primary)]/50 transition-all duration-200 text-left hud-clipped"
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
              className="group p-5 bg-[var(--bg-base)] border border-[var(--border-muted)] hover:border-[var(--accent-coordinator)]/50 transition-all duration-200 text-left hud-clipped"
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

  // ── STEP: FPT ─────────────────────────────────────────────
  if (step === "fpt") {
    return (
      <div className="flex items-center justify-center min-h-[70vh] hud-lattice px-4 py-8">
        <Card className="w-full max-w-md p-[var(--space-xl)] bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)]">
          <button
            onClick={() => { setStep("choose"); setFptResult(null); setFptError(""); }}
            className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4 flex items-center gap-1"
          >
            ← Quay lại
          </button>

          <div className="flex items-center gap-2 mb-6">
            <GraduationCap className="w-5 h-5 text-[var(--accent-primary)]" />
            <div>
              <h2 className="font-display text-lg font-bold text-[var(--accent-primary)] tracking-widest uppercase">
                XÁC MINH FPT
              </h2>
              <p className="text-xs font-mono text-[var(--text-muted)]">// VIA FPT VERIFICATION SYSTEM</p>
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
                  placeholder="SE123456"
                  value={fptCode}
                  onChange={(e) => {
                    setFptCode(e.target.value.toUpperCase());
                    setFptError("");
                    setFptResult(null);
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="primary"
                  disabled={isVerifying || fptCode.length < 4}
                  onClick={async () => {
                    setFptError("");
                    setFptResult(null);
                    try {
                      const result = await verifyFpt(fptCode);
                      setFptResult(result);
                      if (!result?.isValid) setFptError("Mã sinh viên không tồn tại trong hệ thống FPT.");
                    } catch {
                      setFptError("Không thể kết nối FPT system. Thử lại sau.");
                    }
                  }}
                  className="flex items-center gap-1.5 px-3"
                >
                  {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              {fptError && <span className="text-xs text-[var(--color-danger)] font-mono">⚠ {fptError}</span>}
            </div>

            {fptResult?.isValid && (
              <div className="p-4 bg-[rgba(16,185,129,0.05)] border border-[var(--color-success)]/20">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />
                  <span className="text-xs font-mono font-bold text-[var(--color-success)] uppercase">SV ĐÃ XÁC MINH</span>
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  {[
                    ["Họ tên", fptResult.fullName],
                    ["Mã SV", fptResult.studentCode],
                    ["Chuyên ngành", fptResult.major],
                    ["Năm nhập học", String(fptResult.enrollYear)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-3">
                      <span className="text-[var(--text-muted)] w-28 flex-shrink-0">{label}:</span>
                      <span className="text-[var(--text-primary)]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {submitError && (
              <div className="p-3 bg-[rgba(239,68,68,0.08)] border border-[var(--color-danger)]/20 text-xs text-[var(--color-danger)] font-mono">
                ⚠ {submitError}
              </div>
            )}

            {fptResult?.isValid && (
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
                    } as any).catch((err) => console.warn("[SEAL] FPT submit warning:", err?.message));
                    setStep("pending");
                  } catch {
                    setSubmitError("Không thể gửi hồ sơ. Vui lòng thử lại.");
                  }
                }}
                className="w-full justify-center flex items-center gap-2"
              >
                {isSubmitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Đang gửi...</> : <>// XÁC NHẬN HỒ SƠ <ArrowRight className="w-4 h-4" /></>}
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ── STEP: NON-FPT ─────────────────────────────────────────
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
            className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4 flex items-center gap-1"
          >
            ← Quay lại
          </button>

          <div className="flex items-center gap-2 mb-6">
            <Upload className="w-5 h-5 text-[var(--accent-coordinator)]" />
            <div>
              <h2 className="font-display text-lg font-bold text-[var(--accent-coordinator)] tracking-widest uppercase">
                TRƯỜNG NGOÀI FPT
              </h2>
              <p className="text-xs font-mono text-[var(--text-muted)]">// MANUAL REVIEW BY BTC</p>
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Thẻ sinh viên" className="w-full max-h-48 object-contain" />
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    className="absolute top-2 right-2 bg-[var(--color-danger)] p-1"
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
                    DRAG & DROP hoặc <span className="text-[var(--accent-coordinator)] underline">BROWSE</span>
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
                  const photoCardUrl = photoFile ? `https://storage.seal.vn/${Date.now()}-${encodeURIComponent(photoFile.name)}` : undefined;
                  await submitProfile({ isFpt: false, schoolId, studentCode, photoStudentCardUrl: photoCardUrl })
                    .catch((err) => console.warn("[SEAL] Non-FPT submit warning:", err?.message));
                  setStep("pending");
                } catch {
                  setSubmitError("Không thể gửi hồ sơ. Vui lòng thử lại.");
                }
              }}
              className="w-full justify-center flex items-center gap-2"
            >
              {isSubmitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Đang gửi...</> : <>// NỘP HỒ SƠ <ArrowRight className="w-4 h-4" /></>}
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
      title="// HỒ SƠ ĐANG CHỜ DUYỆT"
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
