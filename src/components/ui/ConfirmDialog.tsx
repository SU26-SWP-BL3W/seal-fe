"use client";

import type { ReactNode } from "react";
import { Button } from "./Button";
import { Modal, type ModalSize } from "./Modal";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  size?: ModalSize;
  /** Hành động phá hủy/không hoàn tác thì tô đỏ nút xác nhận. */
  destructive?: boolean;
  pending?: boolean;
  pendingLabel?: string;
  disabled?: boolean;
  /** Lỗi hiển thị ngay trong hộp thoại, cạnh nút gây ra lỗi. */
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Thay thế confirm()/alert() của trình duyệt cho mọi thao tác cần xác nhận.
export function ConfirmDialog({
  open,
  title,
  eyebrow,
  description,
  children,
  confirmLabel,
  cancelLabel = "Hủy",
  size = "md",
  destructive = false,
  pending = false,
  pendingLabel = "Đang xử lý...",
  disabled = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      eyebrow={eyebrow}
      description={description}
      size={size}
      dismissable={!pending}
      footer={
        <>
          <Button
            accent={destructive ? "primary" : "team"}
            onClick={onConfirm}
            disabled={pending || disabled}
            className={`flex-1 ${
              destructive
                ? "border-[var(--color-danger)] bg-[var(--color-danger)] text-[color:var(--bg-base)] hover:bg-[var(--color-danger)]/80 hover:shadow-none"
                : ""
            }`}
          >
            {pending ? pendingLabel : confirmLabel}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={pending} className="flex-1">
            {cancelLabel}
          </Button>
        </>
      }
    >
      {children}
      {error && (
        <p role="alert" className="mt-[var(--space-sm)] font-mono text-xs text-[color:var(--color-danger)]">
          {error}
        </p>
      )}
    </Modal>
  );
}
