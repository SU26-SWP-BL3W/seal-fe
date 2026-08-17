"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface ApiMissingDataBadgeProps {
  endpoint?: string;
  title?: string;
  message?: string;
  className?: string;
}

/** Trạng thái rỗng dùng chung khi BE chưa có dữ liệu cho mục này. */
export const ApiMissingDataBadge: React.FC<ApiMissingDataBadgeProps> = ({
  title = "Chưa có dữ liệu",
  message = "Mục này hiện chưa có dữ liệu.",
  className = "",
}) => {
  return (
    <div
      className={`p-4 bg-[rgba(245,158,11,0.08)] border-2 border-dashed border-[var(--color-warning)]/60 text-[var(--color-warning)] font-mono text-xs hud-clipped space-y-2 animate-fade-in ${className}`}
    >
      <div className="flex items-center gap-2 font-bold uppercase tracking-wider border-b border-[var(--color-warning)]/30 pb-2">
        <AlertTriangle className="w-4 h-4 text-[var(--color-warning)] flex-shrink-0" />
        <span>{title}</span>
      </div>
      <p className="text-[var(--text-primary)] font-semibold text-[11px]">{message}</p>
    </div>
  );
};
