"use client";

import { useState } from "react";
import { useRegister, useResendVerification } from "@/repositories/authRepository";
import { Button, Input, Field } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { Mail, Lock, User, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { useToast } from "@/providers/ToastProvider";
import { useAuth } from "@/providers/AuthProvider";
import { AlreadyLoggedInNotice } from "@/components/domain/AlreadyLoggedInNotice";
import { AuthLayout } from "@/components/layout/AuthLayout";

type RegisterStep = "form" | "success";

export function RegisterView() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState<RegisterStep>("form");

  if (currentUser) {
    return <AlreadyLoggedInNotice />;
  }

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutateAsync: registerApi, isPending } = useRegister();
  const { mutateAsync: resendApi, isPending: isResending } = useResendVerification();
  const [resendMsg, setResendMsg] = useState("");

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Họ và tên không được để trống";
    if (!email.trim()) errs.email = "Email không được để trống";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Email không hợp lệ";
    if (!password) errs.password = "Mật khẩu không được để trống";
    else if (password.length < 8) errs.password = "Mật khẩu phải ít nhất 8 ký tự";
    if (password !== confirmPassword) errs.confirmPassword = "Mật khẩu xác nhận không khớp";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Vui lòng kiểm tra và hoàn thiện các trường thông tin bắt buộc.");
      return;
    }
    setErrors({});
    try {
      await registerApi({ email: email.trim(), password, fullName: fullName.trim() });
      toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực.");
      setStep("success");
    } catch (err) {
      const apiMessage = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message;
      const finalMsg = apiMessage || "Đăng ký thất bại. Vui lòng thử lại.";
      setErrors({ submit: finalMsg });
      toast.error(finalMsg);
    }
  };

  if (step === "success") {
    return (
      <AuthLayout title="Xác thực email" description="Chúng tôi đã gửi liên kết xác thực tới email của bạn.">
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-success)]/10">
            <CheckCircle2 className="h-6 w-6 text-[var(--color-success)]" />
          </div>
        </div>
        <p className="mb-2 text-center text-sm text-[var(--text-muted)]">Email đã gửi tới:</p>
        <p className="mb-6 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] px-3 py-2 text-center text-sm text-[var(--accent-primary)]">
          {email}
        </p>
        <ul className="mb-6 space-y-2 text-sm text-[var(--text-muted)]">
          <li>1. Mở email và nhấn link xác thực</li>
          <li>2. Link có hiệu lực 24 giờ</li>
          <li>3. Sau xác thực, hoàn thiện hồ sơ sinh viên</li>
        </ul>
        <div className="flex flex-col gap-3">
          <Button
            disabled={isResending}
            className="w-full"
            onClick={async () => {
              try {
                await resendApi(email);
                setResendMsg("Đã gửi lại email xác thực.");
              } catch {
                setResendMsg("Không gửi lại được. Thử lại sau.");
              }
            }}
          >
            {isResending ? "Đang gửi…" : "Gửi lại email xác thực"}
          </Button>
          {resendMsg && <p className="text-center text-xs text-[var(--text-muted)]">{resendMsg}</p>}
          <Link href="/login">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Về trang đăng nhập
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Tạo tài khoản"
      description="Tham gia SEAL Hackathon"
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-medium text-[var(--accent-primary)] hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={handleRegister} className="space-y-4">
        <Field label="Họ và tên" required error={errors.fullName}>
          {({ id, ...aria }) => (
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                id={id}
                {...aria}
                type="text"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((p) => ({ ...p, fullName: "" }));
                }}
                className={`pl-10 ${errors.fullName ? "border-[var(--color-danger)]" : ""}`}
              />
            </div>
          )}
        </Field>

        <Field label="Email" required error={errors.email}>
          {({ id, ...aria }) => (
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                id={id}
                {...aria}
                type="email"
                placeholder="ten@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: "" }));
                }}
                className={`pl-10 ${errors.email ? "border-[var(--color-danger)]" : ""}`}
              />
            </div>
          )}
        </Field>

        <Field label="Mật khẩu" required error={errors.password} hint="Tối thiểu 8 ký tự">
          {({ id, ...aria }) => (
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                id={id}
                {...aria}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: "" }));
                }}
                className={`pl-10 pr-10 ${errors.password ? "border-[var(--color-danger)]" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}
        </Field>

        <Field label="Xác nhận mật khẩu" required error={errors.confirmPassword}>
          {({ id, ...aria }) => (
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                id={id}
                {...aria}
                type={showConfirm ? "text" : "password"}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: "" }));
                }}
                className={`pl-10 pr-10 ${errors.confirmPassword ? "border-[var(--color-danger)]" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}
        </Field>

        {errors.submit && (
          <div className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
            {errors.submit}
          </div>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Đang xử lý…" : "Tạo tài khoản"}
        </Button>
      </form>
    </AuthLayout>
  );
}
