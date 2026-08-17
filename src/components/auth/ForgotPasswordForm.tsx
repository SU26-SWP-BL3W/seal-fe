import { useState, FormEvent } from 'react';
import { LogIn, Mail, ArrowLeft, Check } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useToast } from '@/providers/ToastProvider';

export interface ForgotPasswordFormProps {
  onSubmit?: (email: string) => Promise<void>;
  isLoading?: boolean;
}

export type ForgotPasswordStep = 'email' | 'verify' | 'reset' | 'success';

export function ForgotPasswordForm({ 
  onSubmit, 
  isLoading = false
}: ForgotPasswordFormProps) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [error, setError] = useState('');
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLocalIsLoading(true);

    try {
      if (!email) {
        const msg = 'Vui lòng nhập email';
        setError(msg);
        toast.error(msg);
        setLocalIsLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const msg = 'Email không hợp lệ';
        setError(msg);
        toast.error(msg);
        setLocalIsLoading(false);
        return;
      }

      if (onSubmit) {
        await onSubmit(email);
      }

      toast.success('Đã gửi mã xác thực tới email của bạn!');
      setStep('verify');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      setError(msg);
      toast.error(msg);
    } finally {
      setLocalIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLocalIsLoading(true);

    try {
      if (!verificationCode) {
        setError('Vui lòng nhập mã xác thực');
        setLocalIsLoading(false);
        return;
      }

      // TODO: Call verification API
      // For now, just move to next step
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLocalIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLocalIsLoading(true);

    try {
      if (!newPassword || !confirmPassword) {
        setError('Vui lòng nhập mật khẩu');
        setLocalIsLoading(false);
        return;
      }

      if (newPassword.length < 8) {
        setError('Mật khẩu phải có ít nhất 8 ký tự');
        setLocalIsLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        setLocalIsLoading(false);
        return;
      }

      // TODO: Call reset password API
      // For now, just move to success step
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLocalIsLoading(false);
    }
  };

  const isLoading_ = isLoading || localIsLoading;

  return (
    <div className="relative z-10 w-full max-w-md">
      {/* Outer border with glowing effect */}
      <div className="hud-clipped p-[2px] bg-gradient-to-br from-[#2dd4bf] to-[#38bdf8]">
        {/* Inner content panel */}
        <div 
          className="hud-clipped bg-[#111a2e] p-8 shadow-[0_0_30px_rgba(45,212,191,0.1)]"
        >
          {/* Header Section */}
          <div className="mb-8 border-b border-[#24344d] pb-4">
            <h1 className="font-display text-2xl font-bold text-[#2dd4bf] uppercase tracking-widest text-center">
              {step === 'success' ? 'HOÀN THÀNH' : 'KHÔI PHỤC MẬT KHẨU'}
            </h1>
            <div className="text-xs text-[#94a3b8] mt-2 text-center uppercase tracking-[0.2em] opacity-70 font-mono">
              {step === 'email' && '[ PHASE 1: EMAIL VERIFICATION ]'}
              {step === 'verify' && '[ PHASE 2: CODE CONFIRMATION ]'}
              {step === 'reset' && '[ PHASE 3: PASSWORD RESET ]'}
              {step === 'success' && '[ SYSTEM RESTORED ]'}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-sm text-red-400 text-sm font-mono">
              ⚠ {error}
            </div>
          )}

          {/* Step 1: Email Input */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <label 
                  htmlFor="email" 
                  className="block text-xs uppercase text-[#2dd4bf] tracking-widest font-mono font-semibold"
                >
                  &gt; TARGET_EMAIL
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2dd4bf]/50">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="user@sector7.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading_}
                    className="sci-input hud-clipped-reverse w-full pl-10 pr-4 py-3 text-sm text-[#f1f5f9] placeholder-[#475569] bg-[#0f172a]/70 border border-[#1e293b] focus:border-[#2dd4bf] focus:shadow-[0_0_10px_rgba(45,212,191,0.2)] focus:outline-none transition-all"
                    required
                  />
                  {/* Decorative corner accent */}
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#2dd4bf] opacity-50"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#2dd4bf] opacity-50"></div>
                </div>
                <p className="text-xs text-[#94a3b8] mt-2">Nhập email đã đăng ký để nhận mã khôi phục</p>
              </div>

              <button
                type="submit"
                disabled={isLoading_}
                className="hud-clipped w-full bg-[#2dd4bf] hover:bg-[#26c0a8] disabled:bg-[#0f4f46] text-[#0a0f1d] py-3 px-4 font-display font-bold text-lg uppercase tracking-wider transition-all duration-300 group relative overflow-hidden disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                    {isLoading_ ? '...' : '//'}
                  </span>
                  <span className="flex items-center gap-2">
                    {isLoading_ ? 'ĐANG GỬI...' : 'GỬI MÃ >'}
                    {!isLoading_ && <Mail className="w-4 h-4" />}
                  </span>
                </span>
                <div className="absolute inset-0 h-full w-full bg-gradient-to-b from-transparent via-white/20 to-transparent -translate-y-full group-hover:animate-[scan_1.5s_ease-in-out_infinite]"></div>
              </button>
            </form>
          )}

          {/* Step 2: Verification Code */}
          {step === 'verify' && (
            <form onSubmit={handleVerifySubmit} className="space-y-6">
              <div className="space-y-2">
                <label 
                  htmlFor="code" 
                  className="block text-xs uppercase text-[#2dd4bf] tracking-widest font-mono font-semibold"
                >
                  &gt; VERIFICATION_CODE
                </label>
                <div className="relative">
                  <input
                    id="code"
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                    disabled={isLoading_}
                    maxLength={6}
                    className="sci-input hud-clipped-reverse w-full px-4 py-3 text-sm text-center text-[#f1f5f9] placeholder-[#475569] bg-[#0f172a]/70 border border-[#1e293b] focus:border-[#2dd4bf] focus:shadow-[0_0_10px_rgba(45,212,191,0.2)] focus:outline-none transition-all font-mono tracking-widest"
                    required
                  />
                  {/* Decorative corner accent */}
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#2dd4bf] opacity-50"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#2dd4bf] opacity-50"></div>
                </div>
                <p className="text-xs text-[#94a3b8] mt-2">Nhập 6 chữ số mã được gửi đến email</p>
              </div>

              <button
                type="submit"
                disabled={isLoading_}
                className="hud-clipped w-full bg-[#2dd4bf] hover:bg-[#26c0a8] disabled:bg-[#0f4f46] text-[#0a0f1d] py-3 px-4 font-display font-bold text-lg uppercase tracking-wider transition-all duration-300 group relative overflow-hidden disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                    {isLoading_ ? '...' : '//'}
                  </span>
                  <span>Xác thực &gt;</span>
                </span>
                <div className="absolute inset-0 h-full w-full bg-gradient-to-b from-transparent via-white/20 to-transparent -translate-y-full group-hover:animate-[scan_1.5s_ease-in-out_infinite]"></div>
              </button>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-6">
              {/* New Password */}
              <div className="space-y-2">
                <label 
                  htmlFor="newPassword" 
                  className="block text-xs uppercase text-[#2dd4bf] tracking-widest font-mono font-semibold"
                >
                  &gt; NEW_PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading_}
                    className="sci-input hud-clipped-reverse w-full px-4 py-3 pr-12 text-sm text-[#f1f5f9] placeholder-[#475569] bg-[#0f172a]/70 border border-[#1e293b] focus:border-[#2dd4bf] focus:shadow-[0_0_10px_rgba(45,212,191,0.2)] focus:outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#2dd4bf] transition-colors"
                    disabled={isLoading_}
                  >
                    {showPassword ? '✕' : '◉'}
                  </button>
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#2dd4bf] opacity-50"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#2dd4bf] opacity-50"></div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label 
                  htmlFor="confirmPassword" 
                  className="block text-xs uppercase text-[#2dd4bf] tracking-widest font-mono font-semibold"
                >
                  &gt; CONFIRM_PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading_}
                    className="sci-input hud-clipped-reverse w-full px-4 py-3 pr-12 text-sm text-[#f1f5f9] placeholder-[#475569] bg-[#0f172a]/70 border border-[#1e293b] focus:border-[#2dd4bf] focus:shadow-[0_0_10px_rgba(45,212,191,0.2)] focus:outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#2dd4bf] transition-colors"
                    disabled={isLoading_}
                  >
                    {showConfirmPassword ? '✕' : '◉'}
                  </button>
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#2dd4bf] opacity-50"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#2dd4bf] opacity-50"></div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading_}
                className="hud-clipped w-full bg-[#2dd4bf] hover:bg-[#26c0a8] disabled:bg-[#0f4f46] text-[#0a0f1d] py-3 px-4 font-display font-bold text-lg uppercase tracking-wider transition-all duration-300 group relative overflow-hidden disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                    {isLoading_ ? '...' : '//'}
                  </span>
                  <span className="flex items-center gap-2">
                    {isLoading_ ? 'ĐANG CẬP NHẬT...' : 'CẬP NHẬT MẬT KHẨU >'}
                    {!isLoading_ && <LogIn className="w-4 h-4" />}
                  </span>
                </span>
                <div className="absolute inset-0 h-full w-full bg-gradient-to-b from-transparent via-white/20 to-transparent -translate-y-full group-hover:animate-[scan_1.5s_ease-in-out_infinite]"></div>
              </button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="space-y-6 text-center py-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-[#2dd4bf] uppercase">Mật khẩu đã được cập nhật</h2>
                <p className="text-sm text-[#94a3b8]">Bạn có thể đăng nhập với mật khẩu mới</p>
              </div>
              <Link
                href="/login"
                className="hud-clipped inline-block w-full bg-[#2dd4bf] hover:bg-[#26c0a8] text-[#0a0f1d] py-3 px-4 font-display font-bold uppercase tracking-wider transition-all"
              >
                Quay về Đăng nhập
              </Link>
            </div>
          )}

          {/* Back Link */}
          {step !== 'success' && (
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  if (step === 'verify') setStep('email');
                  else if (step === 'reset') setStep('verify');
                }}
                className="text-xs text-[#94a3b8] hover:text-[#2dd4bf] transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-3 h-3" />
                Quay lại
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordForm;
