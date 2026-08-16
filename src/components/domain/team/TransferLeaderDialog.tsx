"use client";

import { ConfirmDialog } from "@/components/ui";

interface Props {
  open: boolean;
  targetName: string;
  isPending: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TransferLeaderDialog({ open, targetName, isPending, error, onConfirm, onCancel }: Props) {
  return (
    <ConfirmDialog
      open={open}
      eyebrow="Chuyển quyền"
      title="Giao quyền đội trưởng"
      description={`Người nhận: ${targetName}`}
      confirmLabel="Gửi yêu cầu"
      pendingLabel="Đang gửi..."
      destructive
      pending={isPending}
      error={error || undefined}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <p className="font-mono text-xs text-pretty text-[color:var(--text-muted)]">
        Yêu cầu chờ người nhận chấp nhận trong 24 giờ. Khi họ đồng ý, bạn trở thành thành viên thường và mất quyền quản lý đội.
      </p>
    </ConfirmDialog>
  );
}
