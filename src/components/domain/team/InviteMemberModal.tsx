"use client";

import { useState } from "react";
import { Button, Card, Field, Input } from "@/components/ui";
import { AlertTriangle, CheckCircle2, Mail, ShieldAlert, Sparkles, UserPlus, X } from "lucide-react";
import { MAX_MEMBERS } from "./teamStatus";
import type { TeamMemberInvited } from "@/repositories/teamsRepository";
import { pushSystemNotification } from "@/repositories/shared/notificationsRepository";

interface Props {
  open: boolean;
  teamId: string;
  teamName: string;
  memberCount: number;
  pendingCount?: number;
  onClose: () => void;
  onInvite: (args: { teamId: string; email: string; notes?: string }) => Promise<TeamMemberInvited | any>;
}

export function InviteMemberModal({
  open,
  teamId,
  teamName,
  memberCount,
  pendingCount = 0,
  onClose,
  onInvite,
}: Props) {
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [successInfo, setSuccessInfo] = useState<{ email: string; isNewUser?: boolean } | null>(null);

  if (!open) return null;

  const isFull = memberCount >= MAX_MEMBERS;
  const isPotentialFull = (memberCount + pendingCount) >= MAX_MEMBERS && !isFull;

  const handleClose = () => {
    setEmail("");
    setNotes("");
    setError("");
    setSuccessInfo(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || isFull) return;

    setError("");
    setSuccessInfo(null);
    setIsPending(true);

    try {
      const res = await onInvite({
        teamId,
        email: value,
        notes: notes.trim() || undefined,
      });

      const isNewTemporary = Boolean(
        res?.isNewTemporaryUser || res?.IsNewTemporaryUser || (res as any)?.data?.isNewTemporaryUser
      );

      setSuccessInfo({
        email: value,
        isNewUser: isNewTemporary,
      });

      pushSystemNotification({
        title: "Gửi lời mời vào đội thi",
        message: `Đã gửi lời mời tham gia đội "${teamName}" tới ${value}.`,
        type: "info",
      });
      pushSystemNotification({
        title: "Lời mời tham gia đội thi",
        message: `Bạn nhận được lời mời gia nhập đội thi "${teamName}".`,
        type: "info",
        recipientEmail: value,
      });

      setEmail("");
      setNotes("");
    } catch (err: unknown) {
      const detail = err as { message?: string; response?: { data?: { message?: string } } };
      setError(detail?.response?.data?.message || detail?.message || "Không gửi được lời mời. Vui lòng kiểm tra lại email.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <Card className="relative w-full max-w-lg border border-[var(--accent-team)]/40 bg-[#0c1417] p-6 shadow-2xl hud-clipped font-mono">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <div className="flex size-10 items-center justify-center rounded bg-[var(--accent-team)]/10 text-[var(--accent-team)] border border-[var(--accent-team)]/30">
            <UserPlus className="size-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-team)]">
              [ MỜI THÀNH VIÊN VÀO ĐỘI ]
            </span>
            <h2 className="font-display text-lg font-bold uppercase text-white truncate max-w-[18rem] sm:max-w-xs">
              {teamName}
            </h2>
          </div>
        </div>

        {successInfo ? (
          <div className="my-6 space-y-4 rounded bg-emerald-950/40 border border-emerald-500/40 p-4 text-xs">
            <div className="flex items-start gap-3 text-emerald-400">
              <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-white uppercase tracking-wider">
                  Đã Gửi Lời Mời Thành Công!
                </p>
                <p className="text-zinc-300 font-sans">
                  Hệ thống đã gửi lời mời tham gia đội tới <strong>{successInfo.email}</strong>.
                </p>
                {successInfo.isNewUser ? (
                  <p className="mt-2 text-amber-300 bg-amber-950/50 p-2 border border-amber-500/30 rounded font-sans text-[11px]">
                    <Sparkles className="inline size-3.5 mr-1" />
                    <strong>Thành viên mới:</strong> Email này chưa có tài khoản SEAL. Hệ thống đã tự động cấp tài khoản tạm và gửi kèm thông tin đăng nhập/kích hoạt qua email.
                  </p>
                ) : (
                  <p className="mt-1 text-emerald-300/80 font-sans text-[11px]">
                    <Mail className="inline size-3.5 mr-1" />
                    Thành viên sẽ nhận được thông báo qua email và tại mục <em>Lời Mời Của Tôi</em> trên SEAL.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-emerald-500/20">
              <Button
                variant="ghost"
                onClick={() => setSuccessInfo(null)}
                className="text-xs"
              >
                Mời thêm thành viên khác
              </Button>
              <Button
                accent="team"
                onClick={handleClose}
                className="text-xs font-bold"
              >
                Hoàn tất
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-900/60 p-2.5 border border-zinc-800 rounded">
              <span>Thành viên hiện tại:</span>
              <span className="font-bold text-white">
                {memberCount}/{MAX_MEMBERS} thành viên
              </span>
            </div>

            {isFull ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] text-amber-200 flex items-center gap-2">
                <ShieldAlert className="size-4 text-amber-400 shrink-0" />
                <span>Đội đã đủ {MAX_MEMBERS}/{MAX_MEMBERS} thành viên tối đa. Không thể mời thêm.</span>
              </div>
            ) : isPotentialFull ? (
              <div className="p-2.5 bg-cyan-950/30 border border-cyan-500/30 rounded text-[11px] text-cyan-300 flex items-start gap-2">
                <AlertTriangle className="size-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  Đội có {memberCount} thành viên + {pendingCount} lời mời đang chờ phản hồi (Tổng: {memberCount + pendingCount}/5).
                </span>
              </div>
            ) : null}

            <Field
              label="Email sinh viên được mời"
              error={error || undefined}
              hint={
                isFull
                  ? `Đội đã đạt tối đa ${MAX_MEMBERS} thành viên.`
                  : "Nhập email sinh viên FPT hoặc trường ĐH. Lời mời sẽ tự hết hạn sau 24 giờ."
              }
              required
            >
              {(field) => (
                <Input
                  {...field}
                  type="email"
                  placeholder="sinhvien@fe.edu.vn / @fpt.edu.vn / @gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isFull || isPending}
                  required
                  className="bg-black/60 text-white border-zinc-700"
                />
              )}
            </Field>

            <Field
              label="Ghi chú / Lời nhắn (Không bắt buộc)"
              hint="Ví dụ: Vị trí phụ trách Backend/AI, liên hệ Zalo..."
            >
              {(field) => (
                <Input
                  {...field}
                  type="text"
                  placeholder="VD: Mời bạn gia nhập phụ trách mảng Frontend..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isFull || isPending}
                  className="bg-black/60 text-white border-zinc-700"
                />
              )}
            </Field>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isPending}
                className="text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                accent="team"
                disabled={!email.trim() || isFull || isPending}
                className="text-xs font-bold"
              >
                {isPending ? "Đang gửi lời mời..." : "Gửi Lời Mời Ngay"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
