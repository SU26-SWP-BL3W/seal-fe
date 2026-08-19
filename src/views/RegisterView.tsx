"use client";

import { useState } from "react";
import { useRegister, useResendVerification } from "@/repositories/authRepository";
import { Button, Input, Card } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { Shield, Mail, Lock, User, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { useToast } from "@/providers/ToastProvider";

type RegisterStep = "form" | "success";

export function RegisterView() {
  const toast = useToast();
  const [step, setStep] = useState<RegisterStep>("form");
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
      toast.success("Đăng ký tài khoản thành công! Vui lòng kiểm tra email để xác thực.");
      setStep("success");
    } catch (err) {
      const apiMessage = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message;
      const finalMsg = apiMessage || "Đăng ký thất bại. Vui lòng kiểm tra kết nối và thử lại.";
      setErrors({
        submit: finalMsg,
      });
      toast.error(finalMsg);
    }
  };

  if (step === "success") {
    return (
      <div className="flex items-center justify-center min-h-[70vh] hud-lattice px-4">
        <Card className="w-full max-w-md p-[var(--space-xl)] bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)] text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.1)] border border-[var(--color-success)]/30 flex items-center justify-center hud-glow-success animate-pulse">
                <Mail className="w-7 h-7 text-[var(--color-success)]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[var(--color-success)] rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-[var(--bg-base)]" />
              </div>
            </div>
          </div>

          <h2 className="font-display text-[length:var(--fs-heading-md)] font-bold text-[var(--color-success)] mb-3 tracking-widest uppercase">
            XÁC THỰC EMAIL
          </h2>
          <p className="text-sm font-body text-[var(--text-muted)] mb-2 leading-relaxed">
            Chúng tôi đã gửi email xác thực tới:
          </p>
          <p className="font-mono text-[var(--accent-primary)] mb-6 text-sm border border-[var(--border-muted)] px-4 py-2 bg-[var(--bg-input)] hud-clipped">
            {email}
          </p>

          <div className="space-y-3 text-xs font-mono text-[var(--text-muted)] text-left mb-6 bg-[var(--bg-base)] p-4 border border-[var(--border-muted)]">
            <div className="flex items-start gap-2">
              <span className="text-[var(--accent-primary)]">01.</span>
              <span>Mở email và nhấn vào link xác thực</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[var(--accent-primary)]">02.</span>
              <span>Link có hiệu lực trong vòng 24 giờ</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[var(--accent-primary)]">03.</span>
              <span>Sau xác thực: hoàn thành hồ sơ sinh viên</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              disabled={isResending}
              className="w-full justify-center"
              onClick={async () => {
                try {
                  await resendApi(email);
                  setResendMsg("Đã gửi lại email xác thực.");
                } catch {
                  setResendMsg("Không gửi lại được. Thử lại sau.");
                }
              }}
            >
              {isResending ? "Đang gửi..." : "Gửi lại email xác thực"}
            </Button>
            {resendMsg && <p className="text-xs font-mono text-[var(--text-muted)]">{resendMsg}</p>}
            <Link href="/login">
              <Button variant="ghost" className="w-full justify-center flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Về Trang Đăng Nhập
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] hud-lattice px-4 py-8">
      <Card className="w-full max-w-md p-[var(--space-xl)] bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-[rgba(0,217,255,0.1)] border border-[var(--accent-primary)]/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h2 className="font-display text-[length:var(--fs-heading-md)] font-bold text-[var(--accent-primary)] tracking-widest uppercase leading-none">
              SEAL
            </h2>
            <p className="text-xs font-mono text-[var(--text-muted)] tracking-wider uppercase">
              TẠO TÀI KHOẢN
            </p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase flex items-center gap-1.5">
              <User className="w-3 h-3" />
              Họ và tên <span className="text-[var(--color-danger)]">*</span>
            </label>
            <Input
              type="text"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors((p) => ({ ...p, fullName: "" }));
              }}
              className={errors.fullName ? "border-[var(--color-danger)]" : ""}
            />
            {errors.fullName && (
              <span className="text-xs text-[var(--color-danger)] font-mono">
                {errors.fullName}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase flex items-center gap-1.5">
              <Mail className="w-3 h-3" />
              Email <span className="text-[var(--color-danger)]">*</span>
            </label>
            <Input
              type="email"
              placeholder="ten@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: "" }));
              }}
              className={errors.email ? "border-[var(--color-danger)]" : ""}
            />
            {errors.email && (
              <span className="text-xs text-[var(--color-danger)] font-mono">
                {errors.email}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              Mật khẩu <span className="text-[var(--color-danger)]">*</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Tối thiểu 8 ký tự"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: "" }));
                }}
                className={`pr-10 ${errors.password ? "border-[var(--color-danger)]" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <span className="text-xs text-[var(--color-danger)] font-mono">
                {errors.password}
              </span>
            )}
          </div>

          {/* Xác nhận mật khẩu */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              Xác nhận mật khẩu <span className="text-[var(--color-danger)]">*</span>
            </label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: "" }));
                }}
                className={`pr-10 ${errors.confirmPassword ? "border-[var(--color-danger)]" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="text-xs text-[var(--color-danger)] font-mono">
                {errors.confirmPassword}
              </span>
            )}
          </div>

          {errors.submit && (
            <div className="p-3 bg-[rgba(239,68,68,0.1)] border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-xs font-mono">
              {errors.submit}
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="mt-2 w-full justify-center"
          >
            {isPending ? "Đang xử lý..." : "TẠO TÀI KHOẢN >"}
          </Button>
        </form>

        <div className="mt-5 pt-4 border-t border-[var(--border-muted)] text-center">
          <span className="text-sm font-mono text-[var(--text-muted)]">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-[var(--accent-primary)] hover:underline font-medium">
              Đăng nhập
            </Link>
          </span>
        </div>
      </Card>
    </div>
  );
}
