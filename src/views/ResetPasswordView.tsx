"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { KeyRound, RefreshCw, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";
import { useResetPassword } from "@/repositories/authRepository";
import { Button, Input, Field } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { AuthLayout } from "@/components/layout/AuthLayout";

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
      <AuthLayout
        title="Liên kết không hợp lệ"
        description="Không tìm thấy mã đặt lại mật khẩu trong đường dẫn. Vui lòng kiểm tra lại liên kết từ email."
        footer={
          <Link href="/login" className="text-[var(--accent-primary)] hover:underline">
            Về trang đăng nhập
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <XCircle className="h-10 w-10 text-[var(--color-danger)]" />
          <Link href="/forgot-password" className="w-full">
            <Button className="w-full justify-center">Yêu cầu liên kết mới</Button>
          </Link>
        </div>
      </AuthLayout>
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
        err?.response?.data?.message || err?.message || "Liên kết không hợp lệ hoặc đã hết hạn (24 giờ). Vui lòng yêu cầu lại.",
      );
    }
  };

  if (done) {
    return (
      <AuthLayout
        title="Đặt lại mật khẩu thành công"
        description="Mật khẩu của bạn đã được cập nhật. Đăng nhập lại bằng mật khẩu mới."
        footer={
          <Link href="/login" className="text-[var(--accent-primary)] hover:underline">
            Về trang đăng nhập
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-[var(--color-success)]" />
          <Link href="/login" className="w-full">
            <Button className="w-full justify-center">Đăng nhập</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Đặt lại mật khẩu"
      description="Nhập mật khẩu mới cho tài khoản của bạn."
      footer={
        <Link href="/login" className="text-[var(--accent-primary)] hover:underline">
          Về trang đăng nhập
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Field label="Mật khẩu mới" required>
          {({ id }) => (
            <Input
              id={id}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              required
              autoFocus
            />
          )}
        </Field>

        <Field label="Xác nhận mật khẩu mới" required>
          {({ id }) => (
            <Input
              id={id}
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              required
            />
          )}
        </Field>

        <Button type="submit" disabled={isPending} className="w-full justify-center">
          {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Xác nhận đặt lại
        </Button>
      </form>
    </AuthLayout>
  );
}

export default ResetPasswordView;
