'use client';

import { useState, FormEvent } from 'react';
import { LogIn, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export interface RegisterFormProps {
  onSubmit?: (userData: RegisterData) => Promise<void>;
  isLoading?: boolean;
  onGoogleSignup?: () => void;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function RegisterForm({ 
  onSubmit, 
  isLoading = false,
  onGoogleSignup 
}: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [localIsLoading, setLocalIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLocalIsLoading(true);

    try {
      const { fullName, email, password, confirmPassword } = formData;

      // Validation
      if (!fullName || !email || !password || !confirmPassword) {
        setError('Vui lòng điền tất cả các trường');
        setLocalIsLoading(false);
        return;
      }

      if (fullName.trim().length < 3) {
        setError('Họ tên phải có ít nhất 3 ký tự');
        setLocalIsLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Email không hợp lệ');
        setLocalIsLoading(false);
        return;
      }

      if (password.length < 8) {
        setError('Mật khẩu phải có ít nhất 8 ký tự');
        setLocalIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        setLocalIsLoading(false);
        return;
      }

      if (onSubmit) {
        await onSubmit(formData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại');
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
              ĐĂNG KÝ TÀI KHOẢN
            </h1>
            <div className="text-xs text-[#94a3b8] mt-2 text-center uppercase tracking-[0.2em] opacity-70 font-mono">
              [ INITIALIZATION PROTOCOL ]
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-sm text-red-400 text-sm font-mono">
              ⚠ {error}
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name Input */}
            <div className="space-y-2">
              <label 
                htmlFor="fullName" 
                className="block text-xs uppercase text-[#2dd4bf] tracking-widest font-mono font-semibold"
              >
                &gt; OPERATOR_NAME
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2dd4bf]/50">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  placeholder="Họ tên đầy đủ"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={isLoading_}
                  className="sci-input hud-clipped-reverse w-full pl-10 pr-4 py-3 text-sm text-[#f1f5f9] placeholder-[#475569] bg-[#0f172a]/70 border border-[#1e293b] focus:border-[#2dd4bf] focus:shadow-[0_0_10px_rgba(45,212,191,0.2)] focus:outline-none transition-all"
                  required
                />
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#2dd4bf] opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#2dd4bf] opacity-50"></div>
              </div>
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
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
                className="block text-xs uppercase text-[#2dd4bf] tracking-widest font-mono font-semibold"
              >
                &gt; DECRYPTION_KEY
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
                  value={formData.password}
                  onChange={handleChange}
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

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label 
                htmlFor="confirmPassword" 
                className="block text-xs uppercase text-[#2dd4bf] tracking-widest font-mono font-semibold"
              >
                &gt; CONFIRM_KEY
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2dd4bf]/50">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="••••••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading_}
                  className="sci-input hud-clipped-reverse w-full pl-10 pr-12 py-3 text-sm text-[#f1f5f9] placeholder-[#475569] bg-[#0f172a]/70 border border-[#1e293b] focus:border-[#2dd4bf] focus:shadow-[0_0_10px_rgba(45,212,191,0.2)] focus:outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#2dd4bf] transition-colors"
                  disabled={isLoading_}
                >
                  {showConfirmPassword ? (
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
                  {isLoading_ ? 'ĐANG KHỞI TẠO...' : 'ĐĂNG KÝ >'}
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

          {/* Google Signup Button */}
          <button
            type="button"
            onClick={onGoogleSignup}
            disabled={isLoading_}
            className="hud-clipped-reverse w-full bg-transparent hover:bg-[#1e293b]/50 text-[#f1f5f9] border border-[#24344d] hover:border-[#2dd4bf]/50 py-3 px-4 flex items-center justify-center gap-3 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
          >
            <Mail className="w-5 h-5" />
            <span className="text-sm font-medium tracking-wide">Đăng ký với Google</span>
          </button>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-[#94a3b8] font-mono">
            <p>
              Đã có tài khoản?{' '}
              <a 
                href="/login" 
                className="text-[#2dd4bf] hover:text-[#38bdf8] transition-colors underline"
              >
                ĐĂNG NHẬP
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;
