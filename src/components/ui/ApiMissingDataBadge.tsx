"use client";

import React from "react";
import { Info } from "lucide-react";

interface ApiMissingDataBadgeProps {
  endpoint?: string;
  title?: string;
  message?: string;
  className?: string;
}

export const ApiMissingDataBadge: React.FC<ApiMissingDataBadgeProps> = ({
  title = "CHƯA CÓ DỮ LIỆU",
  message = "Hiện chưa có dữ liệu hiển thị cho mục này.",
  className = "",
}) => {
  return (
    <div
      className={`p-6 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped text-center flex flex-col items-center gap-2 font-mono text-xs ${className}`}
    >
      <Info className="w-6 h-6 text-[var(--text-muted)] opacity-60" />
      <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider">{title}</span>
      <p className="text-[var(--text-muted)] text-[11px] max-w-md leading-relaxed">{message}</p>
    </div>
  );
};
