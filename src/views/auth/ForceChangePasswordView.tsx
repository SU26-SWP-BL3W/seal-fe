"use client";

import { AlertTriangle, Key, RefreshCw } from "lucide-react";
import { Button, Input, Field } from "@/components/ui";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useForceChangePasswordViewModel } from "@/viewModels/auth/useForceChangePasswordViewModel";

export function ForceChangePasswordView() {
  const { state, actions } = useForceChangePasswordViewModel();
  const { oldPassword, newPassword, confirmNewPassword, error, isPending } = state;

  return (
    <AuthLayout
      title="Bắt buộc đổi mật khẩu"
      description="Tài khoản đang dùng mật khẩu tạm từ email. Đổi sang mật khẩu mới để tiếp tục sử dụng hệ thống."
    >
      <form onSubmit={actions.handleSubmit} className="space-y-4">
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
              onChange={(e) => actions.setOldPassword(e.target.value)}
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
              onChange={(e) => actions.setNewPassword(e.target.value)}
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
              onChange={(e) => actions.setConfirmNewPassword(e.target.value)}
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

export default ForceChangePasswordView;
