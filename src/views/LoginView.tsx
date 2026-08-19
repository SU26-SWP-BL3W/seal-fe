"use client";

import { useState } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/providers/AuthProvider";
import { Link, useRouter } from "@/i18n/routing";
import { Mail, Lock, Eye, EyeOff, GraduationCap, ArrowRight } from "lucide-react";
import { SealShield } from "@/components/domain/SealShield";

import { useSearchParams } from "next/navigation";
import { useToast } from "@/providers/ToastProvider";

export function LoginView() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const isVerifiedNotice = searchParams.get("verified") === "true";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginWithCredentials, loginWithGoogleCredential } = useAuth();
  const router = useRouter();
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim() || !password) {
      const msg = "Vui lòng nhập email và mật khẩu!";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    setIsSubmitting(true);
    try {
      const targetPath = await loginWithCredentials(email, password);
      toast.success("Đăng nhập thành công!");
      router.push(targetPath);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Email hoặc mật khẩu không đúng.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
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
    try {
      const targetPath = await loginWithGoogleCredential(response.credential);
      toast.success("Đăng nhập Google thành công!");
      router.push(targetPath);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Đăng nhập Google thất bại.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    const msg = "Đăng nhập với Google bị hủy hoặc gặp sự cố.";
    setErrorMessage(msg);
    toast.error(msg);
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-12 px-4 hud-lattice font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Main Tactical Login Card */}
        <div className="p-6 sm:p-8 bg-[#0f1826] border border-[#1e2e4a] hud-clipped shadow-2xl space-y-6">
          
          {/* Header with Glowing Hexagon Badge */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center mb-1">
              <SealShield className="w-8 h-8 text-amber-400" />
            </div>

            <h1 className="font-mono text-2xl font-bold tracking-wider text-white uppercase">
              CHÀO MỪNG TRỞ LẠI
            </h1>

            <p className="font-mono text-xs text-slate-400">
              Đăng nhập vào <span className="text-amber-400 font-bold">SEAL-HMS</span> để tiếp tục
            </p>
          </div>

          {isVerifiedNotice && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-mono text-xs hud-clipped">
              Xác thực email thành công! Vui lòng đăng nhập để tiếp tục hoàn thiện hồ sơ sinh viên.
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/40 text-rose-400 font-mono text-xs hud-clipped">
              {errorMessage}
            </div>
          )}

          {/* Form Credentials */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5 font-mono">
              <label className="text-xs font-bold text-slate-200">
                Email
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="email"
                  placeholder="you@fpt.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#152238] border border-[#1e2e4a] text-slate-100 font-mono text-xs focus:border-amber-400 focus:outline-none placeholder:text-slate-500 transition-colors hud-clipped"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5 font-mono">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200">
                  Mật khẩu
                </label>
                <Link href="/forgot-password" className="text-xs text-amber-400 hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>

              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#152238] border border-[#1e2e4a] text-slate-100 font-mono text-xs focus:border-amber-400 focus:outline-none placeholder:text-slate-500 transition-colors hud-clipped"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2 pt-1 font-mono">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded border-slate-700 bg-[#152238] cursor-pointer"
                />
                <span>Nhớ tài khoản</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-[#070b14] font-mono font-bold text-sm uppercase tracking-wider hud-clipped transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2"
            >
              {isSubmitting ? "ĐANG ĐĂNG NHẬP…" : "→] ĐĂNG NHẬP"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4 font-mono">
            <div className="border-t border-[#1e2e4a] w-full" />
            <span className="bg-[#0f1826] px-3 text-[11px] text-slate-500 font-bold uppercase shrink-0">
              HOẶC
            </span>
            <div className="border-t border-[#1e2e4a] w-full" />
          </div>

          {/* Social / OAuth Login Options */}
          <div className="space-y-2.5 font-mono">
            {/* Google Login (Real Google Identity Services) */}
            <div className="flex justify-center w-full py-0.5 overflow-hidden">
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
          </div>

          {/* Footer Register Link */}
          <div className="text-center pt-3 border-t border-[#1e2e4a] font-mono text-xs text-slate-400">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="text-white hover:text-amber-400 font-bold transition-colors">
              Đăng ký ngay ›
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#EA4335"
        d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"
      />
      <path
        fill="#34A853"
        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
      />
    </svg>
  );
}
