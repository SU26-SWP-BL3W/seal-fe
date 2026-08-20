"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { KeyRound, RefreshCw, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";
import { useResetPassword } from "@/repositories/authRepository";
import { Button, Card } from "@/components/ui";
import { Link } from "@/i18n/routing";

export function ResetPasswordView() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { mutateAsync: resetPassword, isPending } = useResetPassword();

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="hud-lattice min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-4 text-center">
          <XCircle className="w-10 h-10 text-[var(--color-danger)] mx-auto" />
          <h1 className="font-display text-xl font-extrabold uppercase tracking-wide text-[var(--text-primary)]">
            Liên Kết Không Hợp Lệ
          </h1>
          <p className="font-mono text-xs text-[var(--text-muted)]">
            Không tìm thấy mã đặt lại mật khẩu trong đường dẫn. Vui lòng kiểm tra lại liên kết từ email.
          </p>
          <Link href="/forgot-password" className="w-full flex justify-center">
            <Button variant="primary" className="w-full justify-center">Yêu Cầu Liên Kết Mới</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword || newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      await resetPassword({ token, newPassword });
      setDone(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Liên kết không hợp lệ hoặc đã hết hạn (24 giờ). Vui lòng yêu cầu lại."
      );
    }
  };

  return (
    <div className="hud-lattice min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-6">
        {done ? (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-[var(--color-success)] mx-auto" />
            <h1 className="font-display text-xl font-extrabold uppercase tracking-wide text-[var(--text-primary)]">
              Đặt Lại Mật Khẩu Thành Công
            </h1>
            <p className="font-mono text-xs text-[var(--text-muted)]">
              Mật khẩu của bạn đã được cập nhật. Đăng nhập lại bằng mật khẩu mới.
            </p>
            <Link href="/login" className="w-full flex justify-center">
              <Button variant="primary" className="w-full justify-center">Về Trang Đăng Nhập</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2">
              <KeyRound className="w-10 h-10 text-[var(--accent-primary)] mx-auto" />
              <h1 className="font-display text-xl font-extrabold uppercase tracking-wide text-[var(--text-primary)]">
                Đặt Lại Mật Khẩu
              </h1>
              <p className="font-mono text-xs text-[var(--text-muted)]">Nhập mật khẩu mới cho tài khoản của bạn.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-xs font-mono text-[var(--color-danger)] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] mb-1 uppercase">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="•••••••• (Tối thiểu 6 ký tự)"
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped focus:outline-none focus:border-[var(--accent-primary)]"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] mb-1 uppercase">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped focus:outline-none focus:border-[var(--accent-primary)]"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isPending}
                className="w-full justify-center flex items-center gap-2"
              >
                {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                XÁC NHẬN ĐẶT LẠI
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}

export default ResetPasswordView;
