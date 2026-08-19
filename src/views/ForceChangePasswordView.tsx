"use client";

import { useState } from "react";
import { AlertTriangle, Key, RefreshCw, ShieldAlert } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useChangePassword } from "@/repositories/authRepository";
import { Button, Card } from "@/components/ui";
import { useToast } from "@/providers/ToastProvider";

// Chặn TOÀN BỘ app (không có nav, không có nút bỏ qua) cho tới khi tài khoản tạm
// đổi xong mật khẩu — AppLayoutWrapper redirect mọi trang khác về đây khi
// user.mustChangePassword === true.
export function ForceChangePasswordView() {
  const toast = useToast();
  const { user } = useAuth();
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
      toast.success("Đổi mật khẩu mới thành công!");

      // Cập nhật cờ trong session đã lưu rồi reload cứng để AuthProvider tự
      // fetch lại /Users/profile — tránh phải mở rộng AuthContext chỉ để lộ 1 setter.
      if (typeof window !== "undefined") {
        try {
          const stored = JSON.parse(localStorage.getItem("currentUser") || "{}");
          localStorage.setItem("currentUser", JSON.stringify({ ...stored, mustChangePassword: false }));
        } catch {
          // bỏ qua nếu localStorage hỏng — reload vẫn lấy đúng dữ liệu từ /Users/profile
        }
        window.location.href = user?.isAdmin ? "/admin/dashboard" : "/events";
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu tạm đã nhận qua email.";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="hud-lattice min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-6">
        <div className="text-center space-y-2">
          <ShieldAlert className="w-10 h-10 text-[var(--accent-primary)] mx-auto" />
          <h1 className="font-display text-xl font-extrabold uppercase tracking-wide text-[var(--text-primary)]">
            Bắt Buộc Đổi Mật Khẩu
          </h1>
          <p className="font-mono text-xs text-[var(--text-muted)] leading-relaxed">
            Tài khoản của bạn đang dùng mật khẩu tạm được cấp qua email. Đổi sang mật khẩu mới để tiếp tục sử dụng hệ thống.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-xs font-mono text-[var(--color-danger)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-[var(--text-muted)] mb-1 uppercase">
              Mật khẩu tạm (đã nhận qua email)
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped focus:outline-none focus:border-[var(--accent-primary)]"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[var(--text-muted)] mb-1 uppercase">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="•••••••• (Tối thiểu 6 ký tự)"
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped focus:outline-none focus:border-[var(--accent-primary)]"
              required
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
            {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            XÁC NHẬN ĐỔI MẬT KHẨU
          </Button>
        </form>
      </Card>
    </div>
  );
}
