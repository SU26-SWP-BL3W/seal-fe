"use client";

import { GoogleLogin } from "@react-oauth/google";
import { Button, Input, Field } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { Mail, Lock, User, Eye, EyeOff, CheckCircle2, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { AlreadyLoggedInNotice } from "@/components/domain/AlreadyLoggedInNotice";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useRegisterViewModel } from "@/viewModels/auth/useRegisterViewModel";

export function RegisterView() {
  const { state, actions } = useRegisterViewModel();

  const {
    step,
    fullName,
    email,
    password,
    confirmPassword,
    showPassword,
    showConfirm,
    errors,
    isAccountCreated,
    isNavigating,
    isPending,
    isResending,
    resendMsg,
    returnUrl,
    currentUser,
  } = state;

  if (currentUser && !isNavigating) {
    return <AlreadyLoggedInNotice />;
  }

  if (step === "success") {
    const loginTarget = `/login?email=${encodeURIComponent(email)}${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ""}`;
    return (
      <AuthLayout
        title="Tài khoản đã được tạo"
        description="Hệ thống đã lưu thông tin tài khoản. Kiểm tra email để kích hoạt nếu cần."
      >
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-success)]/10">
            <CheckCircle2 className="h-6 w-6 text-[var(--color-success)]" />
          </div>
        </div>
        <p className="mb-2 text-center text-sm text-[var(--text-muted)]">Email:</p>
        <p className="mb-6 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] px-3 py-2 text-center text-sm text-[var(--accent-primary)]">
          {email}
        </p>
        <ul className="mb-6 space-y-2 text-sm text-[var(--text-muted)]">
          <li>1. Kiểm tra hộp thư hoặc Spam để bấm liên kết kích hoạt.</li>
          <li>2. Có thể đăng nhập ngay hoặc gửi lại email xác thực.</li>
          <li>3. Sau khi đăng nhập: hoàn thiện hồ sơ sinh viên hoặc tham gia đội thi.</li>
        </ul>
        <div className="flex flex-col gap-3">
          <Link href={loginTarget}>
            <Button className="w-full">
              <ArrowRight className="mr-2 h-4 w-4" />
              Đăng nhập ngay
            </Button>
          </Link>
          <Button
            variant="ghost"
            disabled={isResending}
            className="w-full"
            onClick={actions.handleResend}
          >
            {isResending ? "Đang gửi…" : "Gửi lại email xác thực"}
          </Button>
          {resendMsg && <p className="text-center text-xs text-[var(--text-muted)]">{resendMsg}</p>}
          <Link href="/register">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Đăng ký tài khoản khác
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const footerLoginUrl = `/login${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`;

  return (
    <AuthLayout
      title="Tạo tài khoản"
      description="Tham gia SEAL Hackathon"
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link href={footerLoginUrl} className="font-medium text-[var(--accent-primary)] hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      <div className="mb-4 space-y-3">
        <div className="flex w-full justify-center overflow-hidden py-0.5">
          <GoogleLogin
            onSuccess={actions.handleGoogleSuccess}
            onError={actions.handleGoogleError}
            theme="filled_black"
            shape="rectangular"
            text="signup_with"
            size="large"
            width="100%"
          />
        </div>
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-[var(--border-muted)]" />
          <span className="shrink-0 bg-[var(--bg-panel)] px-3 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Hoặc đăng ký bằng email
          </span>
          <div className="w-full border-t border-[var(--border-muted)]" />
        </div>
      </div>

      <form onSubmit={actions.handleRegister} className="space-y-4">
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
                  actions.setFullName(e.target.value);
                  if (errors.fullName) actions.setErrors({ ...errors, fullName: "" });
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
                  actions.setEmail(e.target.value);
                  if (errors.email) actions.setErrors({ ...errors, email: "" });
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
                  actions.setPassword(e.target.value);
                  if (errors.password) actions.setErrors({ ...errors, password: "" });
                }}
                className={`pl-10 pr-10 ${errors.password ? "border-[var(--color-danger)]" : ""}`}
              />
              <button
                type="button"
                onClick={() => actions.setShowPassword(!showPassword)}
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
                  actions.setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) actions.setErrors({ ...errors, confirmPassword: "" });
                }}
                className={`pl-10 pr-10 ${errors.confirmPassword ? "border-[var(--color-danger)]" : ""}`}
              />
              <button
                type="button"
                onClick={() => actions.setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}
        </Field>

        {errors.submit && (
          <div className="space-y-2 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{errors.submit}</p>
            </div>
            {isAccountCreated && (
              <Link href={`/login?email=${encodeURIComponent(email)}`} className="block">
                <Button className="w-full text-xs">Đăng nhập ngay</Button>
              </Link>
            )}
          </div>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Đang xử lý…" : "Tạo tài khoản"}
        </Button>
      </form>
    </AuthLayout>
  );
}
