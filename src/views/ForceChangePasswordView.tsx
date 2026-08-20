"use client";

import { useState } from "react";
import { AlertTriangle, Key, RefreshCw } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useChangePassword } from "@/repositories/authRepository";
import { Button, Input, Field } from "@/components/ui";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useToast } from "@/providers/ToastProvider";
import { resolveStaffLandingPath } from "@/lib/eventRoles";

export function ForceChangePasswordView() {
  const toast = useToast();
  const { user, activeRole, allEventRoles } = useAuth();
  const { mutateAsync: changePassword, isPending } = useChangePassword();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!oldPassword) {
      const msg = "Vui lòng nhập mật khẩu tạm đã nhận qua email.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      const msg = "Mật khẩu mới phải có ít nhất 6 ký tự.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      const msg = "Mật khẩu xác nhận không khớp.";
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      await changePassword({ oldPassword, newPassword, confirmNewPassword });
      toast.success("Đổi mật khẩu mới thành công.");

      if (typeof window !== "undefined") {
        try {
          const stored = JSON.parse(localStorage.getItem("currentUser") || "{}");
          localStorage.setItem("currentUser", JSON.stringify({ ...stored, mustChangePassword: false }));
        } catch {
          // ignore
        }
        const landing = user?.isAdmin
          ? "/admin/dashboard"
          : resolveStaffLandingPath(allEventRoles) ||
            (activeRole?.roleName === "Judge"
              ? "/judge/events"
              : activeRole?.roleName === "Mentor"
              ? "/mentor"
              : activeRole?.roleName === "EventCoordinator" || activeRole?.roleName === "Coordinator"
              ? "/coordinator/dashboard"
              : activeRole?.roleName === "TeamLeader" || activeRole?.roleName === "TeamMember"
              ? "/my-team"
              : "/events");
        window.location.href = landing;
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu tạm đã nhận qua email.";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <AuthLayout
      title="Bắt buộc đổi mật khẩu"
      description="Tài khoản đang dùng mật khẩu tạm từ email. Đổi sang mật khẩu mới để tiếp tục sử dụng hệ thống."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Field label="Mật khẩu tạm (đã nhận qua email)" required>
          {({ id }) => (
            <Input
              id={id}
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              autoFocus
            />
          )}
        </Field>

        <Field label="Mật khẩu mới" required hint="Tối thiểu 6 ký tự">
          {({ id }) => (
            <Input
              id={id}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
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
              required
            />
          )}
        </Field>

        <Button type="submit" disabled={isPending} className="w-full justify-center">
          {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
          Xác nhận đổi mật khẩu
        </Button>
      </form>
    </AuthLayout>
  );
}
