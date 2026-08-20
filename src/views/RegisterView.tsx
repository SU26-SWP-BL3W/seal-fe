"use client";

import { useState } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useRegister, useResendVerification } from "@/repositories/authRepository";
import { Button, Input, Card } from "@/components/ui";
import { Link, useRouter } from "@/i18n/routing";
import { Shield, Mail, Lock, User, Eye, EyeOff, CheckCircle2, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { useToast } from "@/providers/ToastProvider";
import { useAuth } from "@/providers/AuthProvider";
import { AlreadyLoggedInNotice } from "@/components/domain/AlreadyLoggedInNotice";

type RegisterStep = "form" | "success";

export function RegisterView() {
  const { user: currentUser, loginWithGoogleCredential } = useAuth();
  const router = useRouter();
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
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message || err?.message || "";
      
      // Nếu Backend báo lỗi không gửi được email xác thực, bản chất tài khoản ĐÃ ĐƯỢC TẠO trong Database
      if (apiMessage.toLowerCase().includes("không gửi được email xác thực") || apiMessage.toLowerCase().includes("email xác thực")) {
        toast.success("Tài khoản đã được tạo thành công trong hệ thống!");
        setIsAccountCreated(true);
        setStep("success");
        return;
      }

      // Nếu email đã tồn tại trong hệ thống
      if (apiMessage.toLowerCase().includes("đã tồn tại")) {
        setErrors({
          submit: `Email "${email.trim()}" đã được đăng ký trước đó. Bạn có thể đăng nhập ngay hoặc sử dụng tính năng quên mật khẩu.`,
        });
        setIsAccountCreated(true);
        toast.error(`Email "${email.trim()}" đã tồn tại trong hệ thống.`);
        return;
      }

      const finalMsg = apiMessage || "Đăng ký thất bại. Vui lòng kiểm tra kết nối và thử lại.";
      setErrors({
        submit: finalMsg,
      });
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
      router.push(targetPath);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Đăng nhập Google thất bại.";
      toast.error(msg);
    }
  };

  const handleGoogleError = () => {
    toast.error("Đăng nhập với Google bị hủy hoặc gặp sự cố.");
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
            TÀI KHOẢN ĐÃ ĐƯỢC TẠO
          </h2>
          <p className="text-sm font-body text-[var(--text-muted)] mb-2 leading-relaxed">
            Hệ thống đã lưu thông tin tài khoản cho email:
          </p>
          <p className="font-mono text-[var(--accent-primary)] mb-6 text-sm border border-[var(--border-muted)] px-4 py-2 bg-[var(--bg-input)] hud-clipped font-bold">
            {email}
          </p>

          <div className="space-y-3 text-xs font-mono text-[var(--text-muted)] text-left mb-6 bg-[var(--bg-base)] p-4 border border-[var(--border-muted)]">
            <div className="flex items-start gap-2">
              <span className="text-[var(--color-success)] font-bold">01.</span>
              <span>Kiểm tra hộp thư đến hoặc mục <b>Spam/Thư rác</b> để bấm liên kết kích hoạt.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[var(--color-success)] font-bold">02.</span>
              <span>Nếu không nhận được thư, bạn có thể bấm <b>&quot;Đăng nhập ngay&quot;</b> hoặc dùng chức năng gửi lại email.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[var(--color-success)] font-bold">03.</span>
              <span>Sau khi đăng nhập: hoàn thiện hồ sơ sinh viên hoặc tham gia đội thi.</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/login">
              <Button variant="primary" className="w-full justify-center flex items-center gap-2 font-bold py-3">
                <ArrowRight className="w-4 h-4" />
                ĐĂNG NHẬP NGAY
              </Button>
            </Link>
            <Button
              variant="ghost"
              disabled={isResending}
              className="w-full justify-center border border-[var(--border-muted)] text-xs font-mono"
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
              {isResending ? "Đang gửi..." : "Gửi lại email xác thực"}
            </Button>
            {resendMsg && <p className="text-xs font-mono text-amber-400">{resendMsg}</p>}
            <Link href="/register">
              <Button variant="ghost" className="w-full justify-center flex items-center gap-2 text-xs font-mono text-zinc-400">
                <ArrowLeft className="w-3.5 h-3.5" />
                Đăng ký tài khoản khác
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

        {/* Google OAuth Quick Sign-Up */}
        <div className="mb-4 space-y-2">
          <div className="flex justify-center w-full py-0.5 overflow-hidden">
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

          <div className="relative flex items-center justify-center my-3 font-mono">
            <div className="border-t border-[var(--border-muted)] w-full" />
            <span className="bg-[var(--bg-panel)] px-3 text-[11px] text-zinc-500 font-bold uppercase shrink-0">
              HOẶC ĐĂNG KÝ BẰNG EMAIL
            </span>
            <div className="border-t border-[var(--border-muted)] w-full" />
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
            <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p>{errors.submit}</p>
              </div>
              {isAccountCreated && (
                <div className="pt-2 border-t border-rose-500/30 flex items-center gap-2">
                  <Link href="/login" className="w-full">
                    <Button variant="primary" className="w-full justify-center text-xs py-2">
                      ➔ ĐĂNG NHẬP NGAY
                    </Button>
                  </Link>
                </div>
              )}
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

