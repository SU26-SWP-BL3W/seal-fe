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
      title="XÁC THỰC THẤT BẠI"
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
