'use client';

import { useState, FormEvent } from 'react';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Link } from '@/i18n/routing';

export interface LoginFormProps {
  onSubmit?: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  onGoogleLogin?: () => void;
}

export function LoginForm({ 
  onSubmit, 
  isLoading = false,
  onGoogleLogin 
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [localIsLoading, setLocalIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLocalIsLoading(true);

    try {
      if (!email || !password) {
        setError('Vui lòng nhập email và mật khẩu');
        setLocalIsLoading(false);
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Email không hợp lệ');
        setLocalIsLoading(false);
        return;
      }

      if (onSubmit) {
        await onSubmit(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
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
            <h1 className="font-display text-3xl font-bold text-[#2dd4bf] uppercase tracking-widest text-center">
              ĐĂNG NHẬP HỆ THỐNG
            </h1>
            <div className="text-xs text-[#94a3b8] mt-2 text-center uppercase tracking-[0.2em] opacity-70 font-mono">
              [ SECURE ACCESS REQUIRED ]
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-sm text-red-400 text-sm font-mono">
              ⚠ {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
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
                  name="email"
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
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className="block text-xs uppercase text-[#2dd4bf] tracking-widest font-mono font-semibold flex justify-between items-center"
              >
                <span>&gt; DECRYPTION_KEY</span>
                <Link 
                  href="/forgot-password" 
                  className="text-[#94a3b8] hover:text-[#2dd4bf] transition-colors hover:underline text-xs font-normal"
                >
                  RESET_KEY?
                </Link>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2dd4bf]/50">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading_}
                  className="sci-input hud-clipped-reverse w-full pl-10 pr-12 py-3 text-sm text-[#f1f5f9] placeholder-[#475569] bg-[#0f172a]/70 border border-[#1e293b] focus:border-[#2dd4bf] focus:shadow-[0_0_10px_rgba(45,212,191,0.2)] focus:outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#2dd4bf] transition-colors"
                  disabled={isLoading_}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#2dd4bf] opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#2dd4bf] opacity-50"></div>
              </div>
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
                  {isLoading_ ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP >'}
                  {!isLoading_ && <LogIn className="w-4 h-4" />}
                </span>
              </span>
              <div className="absolute inset-0 h-full w-full bg-gradient-to-b from-transparent via-white/20 to-transparent -translate-y-full group-hover:animate-[scan_1.5s_ease-in-out_infinite]"></div>
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-[#24344d] after:h-px after:flex-1 after:bg-[#24344d]">
            <span className="text-xs text-[#94a3b8] uppercase tracking-widest font-mono">OR</span>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={isLoading_}
            className="hud-clipped-reverse w-full bg-transparent hover:bg-[#1e293b]/50 text-[#f1f5f9] border border-[#24344d] hover:border-[#2dd4bf]/50 py-3 px-4 flex items-center justify-center gap-3 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
          >
            
            <span className="text-sm font-medium tracking-wide">Đăng nhập với Google</span>
          </button>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-[#94a3b8] font-mono">
            <p>
              Chưa có tài khoản?{' '}
              <Link 
                href="/register" 
                className="text-[#2dd4bf] hover:text-[#38bdf8] transition-colors underline"
              >
                ĐĂNG KÝ NGAY
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
