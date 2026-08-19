"use client";

import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Dòng mã ngắn phía trên tiêu đề, giữ đúng ngôn ngữ HUD của hệ thống. */
  eyebrow?: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  /** Đặt false cho thao tác đang chạy dở để tránh đóng nhầm giữa chừng. */
  dismissable?: boolean;
}

// Dialog dùng chung cho toàn app: một kiểu backdrop, đóng bằng Esc hoặc click nền,
// focus bị giữ trong hộp thoại và trả lại đúng phần tử đã mở nó.
export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  description,
  children,
  footer,
  size = "md",
  dismissable = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  const requestClose = useCallback(() => {
    if (dismissable) onClose();
  }, [dismissable, onClose]);

  useEffect(() => {
    if (!open) return;

    openerRef.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        requestClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = overflow;
      openerRef.current?.focus?.();
    };
  }, [open, requestClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[var(--space-md)]">
      <div
        className="absolute inset-0 bg-[var(--bg-base)]/80"
        aria-hidden="true"
        onClick={requestClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`hud-clipped relative z-10 w-full ${SIZE_CLASS[size]} border border-[var(--border-muted)] bg-[var(--bg-panel)] shadow-lg`}
      >
        <div className="border-b border-[var(--border-muted)] px-[var(--space-lg)] py-[var(--space-md)]">
          {eyebrow && (
            <div className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--text-muted)]">
              {eyebrow}
            </div>
          )}
          <h2
            id={titleId}
            className="mt-1 font-display text-lg font-bold uppercase text-balance text-[color:var(--text-primary)]"
          >
            {title}
          </h2>
          {description && (
            <p id={descId} className="mt-1 font-mono text-xs text-pretty text-[color:var(--text-muted)]">
              {description}
            </p>
          )}
        </div>

        {children && <div className="px-[var(--space-lg)] py-[var(--space-md)]">{children}</div>}

        {footer && (
          <div className="flex gap-[var(--space-sm)] border-t border-[var(--border-muted)] px-[var(--space-lg)] py-[var(--space-md)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
