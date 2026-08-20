'use client';

import { useState, FormEvent } from 'react';
import { Mail, Check, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';

export interface VerifyEmailFormProps {
  email?: string;
  onSubmit?: (code: string) => Promise<void>;
  isLoading?: boolean;
  onResendEmail?: () => Promise<void>;
}

export function VerifyEmailForm({ 
  email = 'user@example.com',
  onSubmit, 
  isLoading = false,
  onResendEmail
}: VerifyEmailFormProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLocalIsLoading(true);

    try {
      if (!verificationCode) {
        setError('Vui lòng nhập mã xác thực');
        setLocalIsLoading(false);
        return;
      }

      if (verificationCode.length !== 6) {
        setError('Mã xác thực phải có 6 chữ số');
        setLocalIsLoading(false);
        return;
      }

      if (onSubmit) {
        await onSubmit(verificationCode);
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLocalIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setLocalIsLoading(true);
    setResendCountdown(60);

    try {
      if (onResendEmail) {
        await onResendEmail();
      }

      // Countdown timer
      const interval = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi gửi lại mã');
      setResendCountdown(0);
    } finally {
      setLocalIsLoading(false);
    }
  };

  const isLoading_ = isLoading || localIsLoading;
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

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
            <h1 className="font-display text-3xl font-bold text-[#2dd4bf] uppercase tracking-widest text-center">
              XÁC THỰC EMAIL
            </h1>
            <div className="text-xs text-[#94a3b8] mt-2 text-center uppercase tracking-[0.2em] opacity-70 font-mono">
              [ EMAIL CONFIRMATION PROTOCOL ]
            </div>
          </div>

          {/* Success State */}
          {success ? (
            <div className="space-y-6 text-center py-8">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center animate-pulse">
                  <Check className="w-10 h-10 text-green-400" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-[#2dd4bf] uppercase">Email xác thực thành công</h2>
                <p className="text-sm text-[#94a3b8]">Tài khoản của bạn đã được kích hoạt</p>
              </div>
              <Link
                href="/login"
                className="hud-clipped inline-block w-full bg-[#2dd4bf] hover:bg-[#26c0a8] text-[#0a0f1d] py-3 px-4 font-display font-bold uppercase tracking-wider transition-all"
              >
                Tiếp tục đăng nhập
              </Link>
            </div>
          ) : (
            <>
              {/* Info Text */}
              <div className="mb-6 p-4 bg-[#0f172a]/50 border border-[#2dd4bf]/30 rounded-sm text-center">
                <p className="text-sm text-[#94a3b8] font-mono">
                  Chúng tôi đã gửi mã xác thực 6 chữ số tới:
                </p>
                <p className="text-base text-[#2dd4bf] font-semibold mt-2">
                  {maskedEmail}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-sm text-red-400 text-sm font-mono">
                  {error}
                </div>
              )}

              {/* Verification Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Verification Code Input */}
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
                      className="sci-input hud-clipped-reverse w-full px-4 py-4 text-center text-3xl text-[#f1f5f9] placeholder-[#475569] bg-[#0f172a]/70 border border-[#1e293b] focus:border-[#2dd4bf] focus:shadow-[0_0_10px_rgba(45,212,191,0.2)] focus:outline-none transition-all font-mono tracking-[0.5em] font-bold"
                      required
                    />
                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#2dd4bf] opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#2dd4bf] opacity-50"></div>
                  </div>
                  <p className="text-xs text-[#94a3b8] text-center mt-2">Nhập 6 chữ số mã xác thực</p>
                </div>

                {/* Submit Button */}
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
                      {isLoading_ ? 'ĐANG XÁC THỰC...' : 'XÁC THỰC >'}
                      {!isLoading_ && <Check className="w-4 h-4" />}
                    </span>
                  </span>
                  <div className="absolute inset-0 h-full w-full bg-gradient-to-b from-transparent via-white/20 to-transparent -translate-y-full group-hover:animate-[scan_1.5s_ease-in-out_infinite]"></div>
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-[#24344d] after:h-px after:flex-1 after:bg-[#24344d]">
                <span className="text-xs text-[#94a3b8] uppercase tracking-widest font-mono">OR</span>
              </div>

              {/* Resend Link */}
              <div className="space-y-2">
                <p className="text-xs text-[#94a3b8] text-center font-mono">
                  Không nhận được mã?
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading_ || resendCountdown > 0}
                  className="hud-clipped-reverse w-full bg-transparent hover:bg-[#1e293b]/50 text-[#f1f5f9] border border-[#24344d] hover:border-[#2dd4bf]/50 py-3 px-4 font-mono text-sm uppercase tracking-wide transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resendCountdown > 0 
                    ? `GỬI LẠI TRONG ${resendCountdown}S` 
                    : '> GỬI LẠI MÃ'}
                </button>
              </div>

              {/* Back Link */}
              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-xs text-[#94a3b8] hover:text-[#2dd4bf] transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailForm;
