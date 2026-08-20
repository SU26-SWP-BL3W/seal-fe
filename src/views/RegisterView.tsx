"use client";

import { useState } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useRegister, useResendVerification } from "@/repositories/authRepository";
import { Button, Input, Field } from "@/components/ui";
import { Link, useRouter } from "@/i18n/routing";
import { Mail, Lock, User, Eye, EyeOff, CheckCircle2, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { useToast } from "@/providers/ToastProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useSearchParams } from "next/navigation";
import { AlreadyLoggedInNotice } from "@/components/domain/AlreadyLoggedInNotice";
import { AuthLayout } from "@/components/layout/AuthLayout";

type RegisterStep = "form" | "success";

export function RegisterView() {
  const { user: currentUser, loginWithGoogleCredential } = useAuth();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const returnUrl = searchParams.get("returnUrl") || searchParams.get("redirect") || "";

  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<RegisterStep>("form");

  if (currentUser) {
    return <AlreadyLoggedInNotice />;
  }

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAccountCreated, setIsAccountCreated] = useState(false);

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
      toast.success("Đăng ký tài khoản thành công!");
      setStep("success");
    } catch (err: unknown) {
      const apiMessage =
        (err as { response?: { data?: { message?: string }; message?: string }; message?: string })
          ?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "";

      // Backend báo lỗi không gửi được email xác thực → tài khoản đã được tạo
      if (
        apiMessage.toLowerCase().includes("không gửi được email xác thực") ||
        apiMessage.toLowerCase().includes("email xác thực")
      ) {
        toast.success("Tài khoản đã được tạo thành công trong hệ thống!");
        setIsAccountCreated(true);
        setStep("success");
        return;
      }

      if (apiMessage.toLowerCase().includes("đã tồn tại")) {
        setErrors({
          submit: `Email "${email.trim()}" đã được đăng ký trước đó. Bạn có thể đăng nhập ngay hoặc sử dụng tính năng quên mật khẩu.`,
        });
        setIsAccountCreated(true);
        toast.error(`Email "${email.trim()}" đã tồn tại trong hệ thống.`);
        return;
      }

      const finalMsg = apiMessage || "Đăng ký thất bại. Vui lòng kiểm tra kết nối và thử lại.";
      setErrors({ submit: finalMsg });
      toast.error(finalMsg);
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      toast.error("Không nhận được token xác thực từ Google.");
      return;
    }
    try {
      const targetPath = await loginWithGoogleCredential(response.credential);
      toast.success("Đăng ký / Đăng nhập Google thành công!");
      router.push(returnUrl ? decodeURIComponent(returnUrl) : targetPath);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as { message?: string })?.message ||
        "Đăng nhập Google thất bại.";
      toast.error(msg);
    }
  };

  const handleGoogleError = () => {
    toast.error("Đăng nhập với Google bị hủy hoặc gặp sự cố.");
  };

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
            onClick={async () => {
              try {
                await resendApi(email);
                setResendMsg("Đã gửi lại yêu cầu xác thực tới hệ thống.");
                toast.success("Đã gửi lại email xác thực thành công!");
              } catch {
                setResendMsg("Không gửi lại được qua email. Bạn có thể thử đăng nhập trực tiếp.");
              }
            }}
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
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
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
