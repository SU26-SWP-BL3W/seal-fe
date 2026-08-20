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
import { Button, Input, Field, Badge } from "@/components/ui";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useToast } from "@/providers/ToastProvider";
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

const WIZARD_STEPS: { id: Step; label: string }[] = [
  { id: "choose", label: "Chọn loại hồ sơ" },
  { id: "fpt", label: "Xác minh FPT" },
  { id: "nonFpt", label: "Trường khác" },
  { id: "pending", label: "Chờ duyệt" },
];

function StepProgress({ currentStep }: { currentStep: Step }) {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);
  const activeIndex = currentIndex < 0 ? 0 : currentIndex;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-1">
        {WIZARD_STEPS.slice(0, 3).map((step, index) => {
          const isComplete = index < activeIndex;
          const isCurrent = index === activeIndex;
          return (
            <div key={step.id} className="flex flex-1 items-center gap-1">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  isComplete
                    ? "bg-[var(--color-success)]/20 text-[var(--color-success)]"
                    : isCurrent
                      ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]"
                      : "bg-[var(--bg-input)] text-[var(--text-muted)]"
                }`}
              >
                {isComplete ? "✓" : index + 1}
              </div>
              <span
                className={`hidden text-xs sm:block ${
                  isCurrent ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                }`}
              >
                {step.label}
              </span>
              {index < 2 && (
                <div
                  className={`mx-1 h-px flex-1 ${
                    index < activeIndex ? "bg-[var(--color-success)]/40" : "bg-[var(--border-muted)]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OnboardingProfileView() {
  const toast = useToast();
  const { user, logout } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("choose");
  const [fptCode, setFptCode] = useState("");
  const [fptResult, setFptResult] = useState<FptStudentResponse | null>(null);
  const [fptError, setFptError] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [customSchoolName, setCustomSchoolName] = useState("");
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
        toast.success("Xác thực thông tin sinh viên FPT thành công!");
      } else {
        const msg = "Mã sinh viên không tồn tại trong hệ thống FPT.";
        setFptError(msg);
        toast.error(msg);
      }
    } catch {
      const msg = "Không thể kết nối hệ thống FPT. Vui lòng thử lại sau.";
      setFptError(msg);
      toast.error(msg);
    }
  };

  if (user?.isApproved) {
    return (
      <ProfileStatusLayout
        icon={<CheckCircle2 className="h-10 w-10 text-[var(--color-success)]" />}
        title="Hồ sơ đã được duyệt"
        description="Hồ sơ sinh viên của bạn đã được xác thực. Bạn có thể tham gia các sự kiện hackathon."
        action={
          <Button onClick={() => router.push("/events")} className="w-full justify-center">
            Xem sự kiện <ArrowRight className="h-4 w-4" />
          </Button>
        }
      />
    );
  }

  if (isBlocked) {
    return (
      <AuthLayout
        title="Tài khoản bị khóa"
        description="Hồ sơ đã bị từ chối tối đa 2 lần. Gửi yêu cầu mở khóa để được hỗ trợ."
      >
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-4">
          <AlertTriangle className="h-6 w-6 shrink-0 text-[var(--color-danger)]" />
          <div>
            <p className="text-sm font-medium text-[var(--color-danger)]">Tài khoản tạm khóa</p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Hồ sơ đã bị từ chối {rejectionCount} lần
            </p>
          </div>
        </div>

        <div className="mb-6 flex justify-center">
          <Lock className="h-12 w-12 text-[var(--color-danger)]/50" />
        </div>

        <div className="mb-6 space-y-3">
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">
            Vui lòng gửi yêu cầu mở khóa đến Ban tổ chức kèm lý do để được hỗ trợ.
          </p>
          <div className="space-y-2 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-3">
            <p className="text-xs font-medium text-[var(--text-muted)]">Lịch sử từ chối</p>
            {rejections.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-[var(--color-danger)]">
                <span>•</span>
                <div>
                  <span className="font-medium">Lần {i + 1}:</span> {r.reason || "Không đạt yêu cầu xác minh"}
                  {r.rejectedTime && (
                    <span className="ml-2 text-[var(--text-muted)]">
                      ({new Date(r.rejectedTime).toLocaleDateString("vi-VN")})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Button
            variant="secondary"
            disabled={isUnblocking || requestUnblockSuccess}
            onClick={async () => {
              if (!user?.email) return;
              try {
                await requestUnblock(user.email).catch(console.warn);
                setRequestUnblockSuccess(true);
              } catch {
                // ignored
              }
            }}
            className="w-full justify-center border-[var(--color-danger)]/40 text-[var(--color-danger)]"
          >
            {requestUnblockSuccess ? (
              "Đã gửi yêu cầu mở khóa"
            ) : isUnblocking ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Đang gửi yêu cầu...
              </>
            ) : (
              <>
                Yêu cầu mở khóa tài khoản <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <Button variant="ghost" onClick={() => logout()} className="w-full justify-center">
            Đăng xuất
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (user?.studentCode && !user?.isApproved && !user?.isRejected && step !== "pending") {
    return (
      <ProfileStatusLayout
        icon={<RefreshCw className="h-8 w-8 animate-spin text-[var(--color-warning)]" />}
        title="Hồ sơ đang chờ duyệt"
        description="Hồ sơ sinh viên đang trong hàng đợi xét duyệt. Ban tổ chức sẽ thông báo kết quả qua email."
        sub={
          <div className="mt-4 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-3 text-left text-xs">
            <p className="text-[var(--text-muted)]">
              Mã SV: <span className="font-medium text-[var(--accent-primary)]">{user.studentCode}</span>
            </p>
          </div>
        }
      />
    );
  }

  if (step === "choose") {
    return (
      <AuthLayout
        title="Hoàn thiện hồ sơ sinh viên"
        description="Bước bắt buộc trước khi tham gia SEAL Hackathon"
        footer={
          <button
            type="button"
            onClick={() => router.push("/events")}
            className="text-[var(--accent-primary)] hover:underline"
          >
            Xem danh sách sự kiện →
          </button>
        }
      >
        <StepProgress currentStep="choose" />

        <div className="mb-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Shield className="h-4 w-4 text-[var(--accent-primary)]" />
          Chọn phương thức xác minh phù hợp với trường của bạn
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setStep("fpt")}
            className="group rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-5 text-left transition-colors hover:border-[var(--accent-primary)]/50"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/10">
              <GraduationCap className="h-5 w-5 text-[var(--accent-primary)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Sinh viên FPT</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Xác minh tự động qua hệ thống FPT.</p>
            <Badge tone="success" className="mt-3">
              Tự động
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setStep("nonFpt")}
            className="group rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-5 text-left transition-colors hover:border-[var(--accent-coordinator)]/50"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--accent-coordinator)]/20 bg-[var(--accent-coordinator)]/10">
              <Upload className="h-5 w-5 text-[var(--accent-coordinator)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Trường khác</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Upload ảnh thẻ SV để BTC duyệt.</p>
            <Badge tone="warning" className="mt-3">
              Xét duyệt thủ công
            </Badge>
          </button>
        </div>
      </AuthLayout>
    );
  }

  if (step === "fpt") {
    return (
      <AuthLayout
        title="Xác minh sinh viên FPT"
        description="Xác thực tự động qua mã sinh viên FPT Edu"
      >
        <StepProgress currentStep="fpt" />

        <button
          type="button"
          onClick={() => {
            setStep("choose");
            setFptResult(null);
            setFptError("");
          }}
          className="mb-4 flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          ← Quay lại
        </button>

        <div className="space-y-4">
          <Field label="Mã sinh viên FPT" required error={fptError || undefined}>
            {({ id, ...aria }) => (
              <div className="flex gap-2">
                <Input
                  id={id}
                  type="text"
                  placeholder="VD: SE170000"
                  value={fptCode}
                  onChange={(e) => setFptCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyFpt()}
                  disabled={isVerifyingFpt}
                  {...aria}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleVerifyFpt}
                  disabled={isVerifyingFpt || !fptCode.trim()}
                  className="shrink-0"
                >
                  {isVerifyingFpt ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Kiểm tra
                </Button>
              </div>
            )}
          </Field>

          {fptResult && (
            <div className="space-y-2 rounded-lg border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 p-4 text-sm">
              <div className="flex items-center gap-2 font-medium text-[var(--color-success)]">
                <CheckCircle2 className="h-4 w-4" />
                Xác thực thành công
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-[var(--border-muted)] pt-3 text-[var(--text-muted)]">
                <div>
                  Họ tên: <span className="font-medium text-[var(--text-primary)]">{fptResult.fullName}</span>
                </div>
                <div>
                  Mã SV: <span className="font-medium text-[var(--text-primary)]">{fptResult.studentCode}</span>
                </div>
                <div>
                  Chuyên ngành:{" "}
                  <span className="text-[var(--text-primary)]">{fptResult.major || "Kỹ thuật phần mềm"}</span>
                </div>
                <div>
                  Khóa:{" "}
                  <span className="text-[var(--text-primary)]">
                    {fptResult.enrollYear ? `K${fptResult.enrollYear - 2004}` : "K18"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {submitError && (
            <div className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2.5 text-sm text-[var(--color-danger)]">
              {submitError}
            </div>
          )}

          {fptResult && (
            <Button
              disabled={isSubmitting}
              onClick={async () => {
                setSubmitError("");
                try {
                  const fptSchool = schools.find(
                    (s) =>
                      s.schoolName?.toLowerCase().includes("fpt") ||
                      s.schoolName?.toLowerCase().includes("đại học fpt")
                  );
                  await submitProfile({
                    isFpt: true,
                    schoolId: fptSchool?.id || "",
                    studentCode: fptResult.studentCode ?? fptCode,
                    fullName: fptResult.fullName ?? undefined,
                  } as any);
                  toast.success("Đã gửi hồ sơ sinh viên FPT thành công!");
                  setStep("pending");
                } catch (err: any) {
                  const msg = err?.response?.data?.message || "Không thể gửi hồ sơ. Vui lòng thử lại.";
                  setSubmitError(msg);
                  toast.error(msg);
                }
              }}
              className="w-full justify-center"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Đang gửi...
                </>
              ) : (
                <>
                  Xác nhận hồ sơ <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </AuthLayout>
    );
  }

  if (step === "nonFpt") {
    const handleFileDrop = (file: File) => {
      if (!file.type.startsWith("image/")) {
        setSubmitError("Chỉ chấp nhận file ảnh (PNG, JPG).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError("File không được vượt quá 5MB.");
        return;
      }
      setSubmitError("");
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    };

    return (
      <AuthLayout
        title="Trường ngoài FPT"
        description="Ban tổ chức xét duyệt qua ảnh thẻ sinh viên"
      >
        <div className="mx-auto w-full max-w-lg">
          <StepProgress currentStep="nonFpt" />

          <button
            type="button"
            onClick={() => {
              setStep("choose");
              setPhotoFile(null);
              setPhotoPreview(null);
            }}
            className="mb-4 flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            ← Quay lại
          </button>

          <div className="space-y-4">
            <Field label="Trường" required>
              {({ id, ...aria }) => (
                <div className="relative">
                  <select
                    id={id}
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    disabled={loadingSchools}
                    className="w-full appearance-none rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-coordinator)] focus:outline-none"
                    {...aria}
                  >
                    <option value="">{loadingSchools ? "Đang tải..." : "Chọn trường"}</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.schoolName}
                      </option>
                    ))}
                    <option value="OTHER_CUSTOM">Trường khác (nhập tên bên dưới)</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                </div>
              )}
            </Field>

            {schoolId === "OTHER_CUSTOM" && (
              <Field label="Tên trường đại học" required>
                {({ id, ...aria }) => (
                  <Input
                    id={id}
                    type="text"
                    placeholder="Ví dụ: Trường Đại học Giao thông Vận tải"
                    value={customSchoolName}
                    onChange={(e) => setCustomSchoolName(e.target.value)}
                    {...aria}
                  />
                )}
              </Field>
            )}

            <Field label="Mã sinh viên" required>
              {({ id, ...aria }) => (
                <Input
                  id={id}
                  type="text"
                  placeholder="MSSV của bạn"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  {...aria}
                />
              )}
            </Field>

            <Field label="Ảnh thẻ sinh viên" required error={submitError || undefined}>
              {() =>
                photoPreview ? (
                  <div className="relative overflow-hidden rounded-lg border border-[var(--color-success)]/30 bg-[var(--bg-input)]">
                    <img src={photoPreview} alt="Thẻ sinh viên" className="max-h-48 w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                      className="absolute right-2 top-2 rounded-md bg-[var(--color-danger)] p-1"
                    >
                      <XCircle className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                      isDragging
                        ? "border-[var(--accent-coordinator)] bg-[var(--accent-coordinator)]/5"
                        : "border-[var(--border-muted)] hover:border-[var(--accent-coordinator)]/50"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const f = e.dataTransfer.files[0];
                      if (f) handleFileDrop(f);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mb-3 h-8 w-8 text-[var(--text-muted)]" />
                    <span className="mb-1 text-sm text-[var(--text-primary)]">
                      Kéo & thả hoặc <span className="text-[var(--accent-coordinator)] underline">tải lên</span>
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">PNG, JPG — tối đa 5MB</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileDrop(f);
                      }}
                    />
                  </div>
                )
              }
            </Field>

            <Button
              disabled={
                isSubmitting ||
                !schoolId ||
                (schoolId === "OTHER_CUSTOM" && !customSchoolName.trim()) ||
                !studentCode ||
                !photoFile
              }
              onClick={async () => {
                setSubmitError("");
                try {
                  let selectedSchoolId = schoolId;
                  if (schoolId === "OTHER_CUSTOM") {
                    const matched = schools.find((s) =>
                      s.schoolName?.toLowerCase().includes(customSchoolName.trim().toLowerCase())
                    );
                    if (matched?.id) {
                      selectedSchoolId = matched.id;
                    } else {
                      const fallback =
                        schools.find(
                          (s) =>
                            s.schoolName?.toLowerCase().includes("khác") ||
                            s.schoolName?.toLowerCase().includes("other")
                        ) || schools[0];
                      selectedSchoolId = fallback?.id || "";
                    }
                  }

                  let photoCardUrl: string | undefined;
                  if (photoFile) {
                    setIsUploadingPhoto(true);
                    const uploaded = await uploadRepository.uploadFile(photoFile);
                    photoCardUrl = uploaded.fileUrl;
                  }
                  await submitProfile({
                    isFpt: false,
                    schoolId: selectedSchoolId,
                    studentCode,
                    photoStudentCardUrl: photoCardUrl,
                  });
                  toast.success("Đã nộp hồ sơ sinh viên thành công! Vui lòng chờ xét duyệt.");
                  setStep("pending");
                } catch (err: any) {
                  const msg = err?.response?.data?.message || "Không thể gửi hồ sơ. Vui lòng thử lại.";
                  setSubmitError(msg);
                  toast.error(msg);
                } finally {
                  setIsUploadingPhoto(false);
                }
              }}
              className="w-full justify-center"
              accent="coordinator"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Đang gửi...
                </>
              ) : (
                <>
                  Nộp hồ sơ <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <ProfileStatusLayout
      icon={<RefreshCw className="h-8 w-8 animate-spin text-[var(--color-warning)]" />}
      title="Hồ sơ đang chờ duyệt"
      description="Hồ sơ của bạn đã được gửi thành công. BTC sẽ xem xét và thông báo kết quả qua email trong 1–3 ngày làm việc."
    />
  );
}

function ProfileStatusLayout({
  icon,
  title,
  description,
  sub,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  sub?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <AuthLayout title={title} description={description}>
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border-muted)] bg-[var(--bg-input)]">
          {icon}
        </div>
        {sub}
        {action && <div className="mt-6 w-full">{action}</div>}
      </div>
    </AuthLayout>
  );
}
