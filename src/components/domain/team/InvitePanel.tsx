"use client";

import { useState } from "react";
import { Badge, Button, Card, Field, Input, SkeletonRows } from "@/components/ui";
import { MAX_MEMBERS } from "./teamStatus";
import type { InvitationView } from "./types";

interface Props {
  invitations: InvitationView[];
  memberCount: number;
  /** Chỉ mời được khi đội chưa chốt hồ sơ với BTC. */
  canInvite: boolean;
  isLoading: boolean;
  loadError: boolean;
  isInviting: boolean;
  isCancelling: boolean;
  onInvite: (email: string) => Promise<void>;
  onCancel: (invitation: InvitationView) => void;
}

export function InvitePanel({
  invitations,
  memberCount,
  canInvite,
  isLoading,
  loadError,
  isInviting,
  isCancelling,
  onInvite,
  onCancel,
}: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const isFull = memberCount >= MAX_MEMBERS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setError("");
    try {
      await onInvite(value);
      setEmail("");
    } catch (err: unknown) {
      const detail = err as { message?: string; response?: { data?: { message?: string } } };
      setError(detail?.response?.data?.message || detail?.message || "Không gửi được lời mời.");
    }
  };

  return (
    <Card className="p-0">
      <h2 className="border-b border-[var(--border-muted)] px-[var(--space-lg)] py-[var(--space-md)] font-mono text-sm font-bold uppercase tracking-wider text-[color:var(--text-primary)]">
        Mời thành viên
      </h2>

      {canInvite && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--space-sm)] px-[var(--space-lg)] py-[var(--space-md)]">
          <Field
            label="Email sinh viên"
            error={error || undefined}
            hint={isFull ? `Đội đã đủ ${MAX_MEMBERS} thành viên tối đa.` : "Lời mời tự hết hạn sau 24 giờ."}
          >
            {(field) => (
              <Input
                {...field}
                type="email"
                placeholder="ten@truong.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isFull}
                required
              />
            )}
          </Field>

          <Button
            id="send-invite-btn"
            type="submit"
            variant="ghost"
            accent="team"
            disabled={!email.trim() || isFull || isInviting}
          >
            {isInviting ? "Đang gửi..." : "Gửi lời mời"}
          </Button>
        </form>
      )}

      <div className="border-t border-[var(--border-muted)] px-[var(--space-lg)] py-[var(--space-md)]">
        <div className="mb-[var(--space-sm)] flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--text-muted)]">
            Đang chờ phản hồi
          </span>
          <span className="font-mono text-xs tabular-nums text-[color:var(--text-muted)]">
            {invitations.length}
          </span>
        </div>

        {isLoading ? (
          <SkeletonRows rows={2} />
        ) : loadError ? (
          <p role="alert" className="font-mono text-xs text-pretty text-[color:var(--color-danger)]">
            Không tải được danh sách lời mời. Tải lại trang để thử lại.
          </p>
        ) : invitations.length === 0 ? (
          <p className="font-mono text-xs text-pretty text-[color:var(--text-muted)]">
            {canInvite
              ? "Chưa có lời mời nào đang chờ. Nhập email phía trên để mời đồng đội."
              : "Không có lời mời nào đang chờ."}
          </p>
        ) : (
          <ul className="flex flex-col gap-[var(--space-sm)]">
            {invitations.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-col gap-[var(--space-xs)] border border-[var(--border-muted)] bg-[var(--bg-input)]/40 px-[var(--space-sm)] py-[var(--space-sm)]"
              >
                <div className="flex items-center justify-between gap-[var(--space-sm)]">
                  <span className="truncate font-mono text-xs font-bold text-[color:var(--text-primary)]" title={inv.email}>
                    {inv.email}
                  </span>
                  <Badge tone="warning">{inv.statusLabel}</Badge>
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] text-[color:var(--text-muted)]">
                  <span className="tabular-nums">
                    {inv.sentAt ? new Date(inv.sentAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "—"}
                  </span>
                  {canInvite && (
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={() => onCancel(inv)}
                      className="font-bold uppercase tracking-widest text-[color:var(--color-danger)] underline-offset-2 hover:underline disabled:opacity-40"
                    >
                      Hủy mời
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
