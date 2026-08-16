
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm';
import { useRouter } from 'next/navigation';

export function VerifyEmailView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'user@example.com';
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (code: string) => {
    setIsLoading(true);

    try {
      // TODO: Integrate with actual verification API
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Xác thực thất bại');
      }

      // Redirect to dashboard/home on success
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Verification error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      // TODO: Integrate with actual resend API
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Không thể gửi lại mã');
      }
    } catch (err) {
      console.error('Resend error:', err);
      throw err;
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0f1d] text-[#f1f5f9] antialiased flex items-center justify-center relative overflow-hidden">
      {/* Hexagon Pattern Background */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 17.3V51.9L30 69.2L0 51.9V17.3Z' fill='none' stroke='%232dd4bf' stroke-width='1'/%3E%3Cpath d='M30 69.2L60 86.5V104M30 69.2L0 86.5V104M30 -17.3V0' fill='none' stroke='%232dd4bf' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f1d] via-transparent to-[#0a0f1d] opacity-80 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1d] via-transparent to-[#0a0f1d] opacity-80 pointer-events-none" />

      {/* Radial Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2dd4bf]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-md mx-4 p-1">
        {/* Decorative Top Header */}
        <div className="mb-8 text-center">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#2dd4bf] mb-2">
            // SEAL EMAIL VERIFICATION
          </div>
          <div className="text-xs font-mono uppercase tracking-widest text-[#94a3b8]">
            Email Confirmation Protocol v1.0
          </div>
        </div>

        {/* Verify Email Form */}
        <VerifyEmailForm 
          email={email}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onResendEmail={handleResendEmail}
        />

        {/* Footer Info */}
        <div className="mt-8 text-center text-[10px] font-mono text-[#475569] uppercase tracking-wider">
          <p>PROTECTED BY ENCRYPTION • AUDIT LOGGED</p>
        </div>
      </div>

      {/* Decorative Corner Elements */}
      <div className="fixed top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-[#2dd4bf]/30 pointer-events-none hidden md:block" />
      <div className="fixed bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-[#2dd4bf]/30 pointer-events-none hidden md:block" />

      {/* Global Scan Line Animation */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        .hud-clipped {
          clip-path: polygon(
            15px 0,
            100% 0,
            100% calc(100% - 15px),
            calc(100% - 15px) 100%,
            0 100%,
            0 15px
          );
        }

        .hud-clipped-reverse {
          clip-path: polygon(
            0 0,
            calc(100% - 15px) 0,
            100% 15px,
            100% 100%,
            15px 100%,
            0 calc(100% - 15px)
          );
        }

        .sci-input {
          background-color: rgba(15, 24, 38, 0.7);
          border: 1px solid #1e293b;
          transition: all 0.3s ease;
        }

        .sci-input:focus {
          border-color: #2dd4bf;
          box-shadow: 0 0 10px rgba(45, 212, 191, 0.2);
          outline: none;
        }
      `}</style>
    </main>
  );
}

export default VerifyEmailView;

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useVerifyEmail, useResendVerification } from "@/repositories/authRepository";
import { Button, Card } from "@/components/ui";
import { Link, useRouter } from "@/i18n/routing";
import { CheckCircle2, XCircle, ArrowRight, Shield, RefreshCw } from "lucide-react";

export function VerifyEmailView() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [resendEmail, setResendEmail] = useState("");
  const { mutateAsync: resendApi, isPending: isResending } = useResendVerification();

  const { data, isLoading, isError, error } = useVerifyEmail(token);
  // apiClient da nem loi khi envelope bao that bai, nen query resolve nghia la xac thuc thanh cong.
  const isSuccessState = !isError && data !== undefined && data !== false;

  // Tự động chuyển hướng sang Login sau 3 giây nếu thành công
  useEffect(() => {
    if (isSuccessState) {
      const timer = setTimeout(() => {
        router.push("/login?verified=true");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccessState, router]);

  // ── Token missing ────────────────────────────────────────────
  if (!token) {
    return (
      <StateCard
        icon={<XCircle className="w-8 h-8 text-[var(--color-danger)]" />}
        iconColor="danger"
        title="LIÊN KẾT KHÔNG HỢP LỆ"
        message="Không tìm thấy mã xác thực trong URL. Vui lòng kiểm tra lại đường dẫn từ email."
        actions={
          <Link href="/login" className="w-full flex justify-center">
            <Button variant="primary" className="w-full justify-center">
              Về Trang Đăng Nhập
            </Button>
          </Link>
        }
      />
    );
  }

  // ── Loading ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] hud-lattice px-4">
        <Card className="w-full max-w-md p-[var(--space-xl)] bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)] text-center">
          {/* Hexagon loader */}
          <div className="flex justify-center mb-6">
            <svg className="w-16 h-16 animate-spin" viewBox="0 0 100 100">
              <polygon
                points="50,5 91,27.5 91,72.5 50,95 9,72.5 9,27.5"
                fill="none"
                stroke="var(--accent-primary)"
                strokeWidth="2"
                strokeDasharray="240"
                strokeDashoffset="60"
              />
              <polygon
                points="50,18 80,35 80,65 50,82 20,65 20,35"
                fill="rgba(0, 217, 255, 0.08)"
                stroke="var(--accent-primary)"
                strokeWidth="1"
              />
            </svg>
          </div>
          <h2 className="font-display text-[length:var(--fs-heading-md)] font-bold text-[var(--accent-primary)] mb-2 tracking-widest uppercase">
            ĐANG XÁC THỰC
          </h2>
          <p className="text-sm font-mono text-[var(--text-muted)]">
            Đang kiểm tra mã xác nhận email của bạn...
          </p>
        </Card>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────
  if (isSuccessState) {
    return (
      <StateCard
        icon={<CheckCircle2 className="w-8 h-8 text-[var(--color-success)]" />}
        iconColor="success"
        title="XÁC THỰC EMAIL THÀNH CÔNG"
        message="Email của bạn đã được xác thực thành công. Vui lòng đăng nhập để tiếp tục hoàn thành hồ sơ sinh viên."
        subContent={
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
              <RefreshCw className="w-3 h-3 animate-spin text-[var(--color-success)]" />
              Tự động chuyển đến trang đăng nhập sau 3 giây...
            </div>
          </div>
        }
        actions={
          <Link href="/login?verified=true" className="w-full flex justify-center">
            <Button variant="primary" className="w-full justify-center flex items-center gap-2">
              ĐĂNG NHẬP ĐỂ HOÀN THÀNH HỒ SƠ <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        }
      />
    );
  }

  // ── Error ────────────────────────────────────────────────────
  const errorMessage =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    "Token xác thực không hợp lệ hoặc đã hết hạn (24 giờ).";

  return (
    <StateCard
      icon={<XCircle className="w-8 h-8 text-[var(--color-danger)]" />}
      iconColor="danger"
      title="// XÁC THỰC THẤT BẠI"
      message={errorMessage}
      subContent={
        <div className="mt-4 p-3 bg-[rgba(239,68,68,0.05)] border border-[var(--color-danger)]/20 text-xs font-mono text-[var(--text-muted)] text-left">
          <p className="mb-1 text-[var(--color-danger)] font-medium">Nguyên nhân có thể:</p>
          <ul className="space-y-1 list-none">
            <li>• Link đã được sử dụng trước đó</li>
            <li>• Link hết hạn sau 24 giờ kể từ khi đăng ký</li>
            <li>• Đường dẫn bị sao chép không đầy đủ</li>
          </ul>
        </div>
      }
      actions={
        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email đăng ký"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            className="px-4 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs"
          />
          <Button
            variant="primary"
            disabled={!resendEmail.trim() || isResending}
            className="w-full justify-center"
            onClick={async () => {
              try { await resendApi(resendEmail.trim()); alert("Đã gửi lại email xác thực."); }
              catch { alert("Không gửi lại được."); }
            }}
          >
            {isResending ? "Đang gửi..." : "Gửi lại email xác thực"}
          </Button>
          <Link href="/register">
            <Button variant="primary" className="w-full justify-center">
              Đăng Ký Lại
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="w-full justify-center">
              Về Trang Đăng Nhập
            </Button>
          </Link>
        </div>
      }
    />
  );
}

// ─── Helper Component ─────────────────────────────────────────

function StateCard({
  icon,
  iconColor,
  title,
  message,
  subContent,
  actions,
}: {
  icon: React.ReactNode;
  iconColor: "success" | "danger" | "warning";
  title: string;
  message: string;
  subContent?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const colorMap = {
    success: "var(--color-success)",
    danger: "var(--color-danger)",
    warning: "var(--color-warning)",
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] hud-lattice px-4">
      <Card className="w-full max-w-md p-[var(--space-xl)] bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)]">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-16 h-16 flex items-center justify-center"
            style={{
              background: `rgba(${iconColor === "success" ? "16,185,129" : iconColor === "danger" ? "239,68,68" : "245,158,11"},0.08)`,
              border: `1px solid ${colorMap[iconColor]}30`,
            }}
          >
            {icon}
          </div>
        </div>

        {/* SEAL logo */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-[var(--accent-primary)]" />
          <span className="font-display text-xs text-[var(--accent-primary)] tracking-widest uppercase">
            XÁC THỰC TÀI KHOẢN SEAL
          </span>
        </div>

        <h2
          className="font-display text-[length:var(--fs-heading-md)] font-bold mb-3 tracking-widest uppercase text-center"
          style={{ color: colorMap[iconColor] }}
        >
          {title}
        </h2>

        <p className="text-sm font-body text-[var(--text-muted)] text-center leading-relaxed">
          {message}
        </p>

        {subContent}

        {actions && <div className="mt-6">{actions}</div>}
      </Card>
    </div>
  );
}

