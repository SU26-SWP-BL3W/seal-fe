"use client";

import { useState } from "react";
import { Mail, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { useForgotPassword } from "@/repositories/authRepository";
import { Button, Card } from "@/components/ui";
import { Link } from "@/i18n/routing";

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
      // BE luôn trả cùng 1 thông báo chung dù email có tồn tại hay không (chống dò email) —
      // nên FE cũng chỉ cần biết request thành công, không cần đọc nội dung message.
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Không gửi được yêu cầu. Vui lòng thử lại.");
    }
  };

  return (
    <div className="hud-lattice min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-6">
        <div className="text-center space-y-2">
          <Mail className="w-10 h-10 text-[var(--accent-primary)] mx-auto" />
          <h1 className="font-display text-xl font-extrabold uppercase tracking-wide text-[var(--text-primary)]">
            Khôi Phục Mật Khẩu
          </h1>
          <p className="font-mono text-xs text-[var(--text-muted)] leading-relaxed">
            Nhập email đã đăng ký — nếu tài khoản tồn tại, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
          </p>
        </div>

        {sent ? (
          <div className="p-4 bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-xs font-mono text-[var(--color-success)] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Nếu email hợp lệ, liên kết đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư (hết hạn sau 24 giờ).</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-xs font-mono text-[var(--color-danger)] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-[var(--text-muted)] mb-1 uppercase">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@fpt.edu.vn"
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped focus:outline-none focus:border-[var(--accent-primary)]"
                required
                autoFocus
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
              className="w-full justify-center flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isPending ? "Đang gửi..." : "Gửi Liên Kết Đặt Lại"}
            </Button>
          </form>
        )}

        <div className="text-center">
          <Link href="/login" className="text-xs font-mono text-[var(--accent-primary)] hover:underline">
            Về Trang Đăng Nhập
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default ForgotPasswordView;
