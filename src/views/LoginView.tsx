"use client";

import { useState } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/providers/AuthProvider";
import { Link, useRouter } from "@/i18n/routing";
import { Mail, Lock, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/providers/ToastProvider";
import { AlreadyLoggedInNotice } from "@/components/domain/AlreadyLoggedInNotice";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button, Input, Field } from "@/components/ui";

export function LoginView() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const isVerifiedNotice = searchParams.get("verified") === "true";
  const initialEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const { user: currentUser, loginWithCredentials, loginWithGoogleCredential } = useAuth();
  const router = useRouter();

  if (currentUser && !isNavigating) {
    return <AlreadyLoggedInNotice />;
  }

  if (isNavigating) {
    return (
      <div className="min-h-screen bg-[#0a0e10] flex items-center justify-center font-mono text-xs text-[#00d9ff]">
        <div className="flex items-center gap-3 bg-[#13191c] p-6 border border-[#263339] shadow-2xl">
          <RefreshCw className="w-5 h-5 animate-spin text-[#00d9ff]" />
          <span>Đang đăng nhập thành công &amp; chuyển hướng vào hệ thống...</span>
        </div>
      </div>
    );
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim() || !password) {
      const msg = "Vui lòng nhập email và mật khẩu.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    setIsSubmitting(true);
    const returnUrl = searchParams.get("returnUrl") || searchParams.get("redirect");
    try {
      const defaultPath = await loginWithCredentials(email, password);
      setIsNavigating(true);
      toast.success("Đăng nhập thành công!");
      router.push(returnUrl ? decodeURIComponent(returnUrl) : defaultPath);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Email hoặc mật khẩu không đúng.";
      setErrorMessage(msg);
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      const msg = "Không nhận được token xác thực từ Google.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    const returnUrl = searchParams.get("returnUrl") || searchParams.get("redirect");
    try {
      const defaultPath = await loginWithGoogleCredential(response.credential);
      setIsNavigating(true);
      toast.success("Đăng nhập Google thành công!");
      router.push(returnUrl ? decodeURIComponent(returnUrl) : defaultPath);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "Đăng nhập Google thất bại.";
      setErrorMessage(msg);
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    const msg = "Đăng nhập với Google bị hủy hoặc gặp sự cố.";
    setErrorMessage(msg);
    toast.error(msg);
  };

  return (
    <AuthLayout
      title="Chào mừng trở lại"
      description="Đăng nhập vào SEAL để tiếp tục"
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-medium text-[var(--accent-primary)] hover:underline">
            Đăng ký ngay
          </Link>
        </>
      }
    >
      {isVerifiedNotice && (
        <div className="mb-4 rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-3 py-2.5 text-sm text-[var(--color-success)]">
          Xác thực email thành công. Vui lòng đăng nhập để hoàn thiện hồ sơ sinh viên.
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2.5 text-sm text-[var(--color-danger)]">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <Field label="Email">
          {({ id }) => (
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                id={id}
                type="email"
                placeholder="you@fpt.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          )}
        </Field>

        <Field label="Mật khẩu">
          {({ id }) => (
            <div className="space-y-1">
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs text-[var(--accent-primary)] hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input
                  id={id}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </Field>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-muted)]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border-muted)] accent-[var(--accent-primary)]"
          />
          Nhớ tài khoản
        </label>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border-muted)]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[var(--bg-panel)] px-2 text-[var(--text-muted)]">Hoặc</span>
        </div>
      </div>

      <div className="flex justify-center overflow-hidden">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          theme="filled_black"
          shape="rectangular"
          text="signin_with"
          size="large"
          width="100%"
        />
      </div>
    </AuthLayout>
  );
}
