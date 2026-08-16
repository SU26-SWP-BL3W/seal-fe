import { HTMLAttributes } from "react";

// HUD panel mặc định của hệ thống: nền bg-panel, viền mờ, góc vát — dùng cho
// mọi khối nội dung dạng "panel" trên dashboard. Không tự phát sáng (glow) mặc
// định — panel nào cần nhấn mạnh thì feature tự thêm class hud-glow-* riêng.
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`hud-clipped border border-[var(--border-muted)] bg-[var(--bg-panel)] p-[var(--space-lg)] ${className}`}
      {...props}
    />
  );
}
