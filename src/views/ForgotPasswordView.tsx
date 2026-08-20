"use client";

import { useState } from "react";
import { Mail, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { useForgotPassword } from "@/repositories/authRepository";
import { Button, Input, Field } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { AuthLayout } from "@/components/layout/AuthLayout";

export function ForgotPasswordView() {
  const { mutateAsync: forgotPassword, isPending } = useForgotPassword();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
          (err as Error)?.message ||
          "Không gửi được yêu cầu. Vui lòng thử lại.",
      );
    }
  };

  return (
    <AuthLayout
      title="Khôi phục mật khẩu"
      description="Nhập email đã đăng ký. Nếu tài khoản tồn tại, chúng tôi sẽ gửi liên kết đặt lại mật khẩu."
      footer={
        <Link href="/login" className="text-[var(--accent-primary)] hover:underline">
          Về trang đăng nhập
        </Link>
      }
    >
      {sent ? (
        <div className="flex items-start gap-2 rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-3 py-3 text-sm text-[var(--color-success)]">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Nếu email hợp lệ, liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư (hết
            hạn sau 24 giờ).
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <Field label="Email">
            {({ id }) => (
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input
                  id={id}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ban@fpt.edu.vn"
                  className="pl-10"
                  required
                  autoFocus
                />
              </div>
            )}
          </Field>

          <Button type="submit" disabled={isPending} className="flex w-full items-center justify-center gap-2">
            <Send className="h-4 w-4" />
            {isPending ? "Đang gửi…" : "Gửi liên kết đặt lại"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export default ForgotPasswordView;
