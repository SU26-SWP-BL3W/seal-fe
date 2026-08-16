"use client";

import { ConfirmDialog } from "@/components/ui";
import { RegistrationChecklist, type RegistrationRequirements } from "./RegistrationChecklist";

interface Props {
  open: boolean;
  teamName: string;
  eventName: string;
  requirements: RegistrationRequirements;
  canConfirm: boolean;
  isPending: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmRegistrationDialog({
  open,
  teamName,
  eventName,
  requirements,
  canConfirm,
  isPending,
  error,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <ConfirmDialog
      open={open}
      eyebrow="Xác nhận ghi danh"
      title="Ghi danh với BTC"
      description={`Đội ${teamName} — ${eventName}`}
      confirmLabel="Ghi danh"
      pendingLabel="Đang gửi..."
      pending={isPending}
      disabled={!canConfirm}
      error={error || undefined}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <RegistrationChecklist requirements={requirements} />
      <p className="mt-[var(--space-md)] font-mono text-[10px] text-pretty text-[color:var(--text-muted)]">
        Sau khi ghi danh, đội chuyển sang trạng thái chờ duyệt và không thể mời thêm thành viên cho tới khi BTC phản hồi.
      </p>
    </ConfirmDialog>
  );
}
