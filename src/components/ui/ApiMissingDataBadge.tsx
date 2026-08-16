"use client";

import React from "react";
import { AlertTriangle, Server } from "lucide-react";

interface ApiMissingDataBadgeProps {
  endpoint: string;
  title?: string;
  message?: string;
  className?: string;
}

export const ApiMissingDataBadge: React.FC<ApiMissingDataBadgeProps> = ({
  endpoint,
  title = "CHƯA CÓ DỮ LIỆU BACKEND (MISSING API DATA)",
  message = "Database Backend chưa có bản ghi hoặc API chưa được feed dữ liệu phù hợp.",
  className = "",
}) => {
  return (
    <div
      className={`p-4 bg-[rgba(245,158,11,0.08)] border-2 border-dashed border-[var(--color-warning)]/60 text-[var(--color-warning)] font-mono text-xs hud-clipped space-y-2 animate-fade-in ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[var(--color-warning)]/30 pb-2">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 text-[var(--color-warning)] flex-shrink-0 animate-pulse" />
          <span>⚠️ {title}</span>
        </div>
        <span className="px-2 py-0.5 bg-[var(--color-warning)]/20 text-[var(--color-warning)] text-[10px] font-bold uppercase hud-clipped">
          STRICT REAL API MODE
        </span>
      </div>

      <div className="space-y-1 text-[11px]">
        <p className="text-[var(--text-primary)] font-semibold">{message}</p>
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <Server className="w-3.5 h-3.5 text-[var(--color-warning)]" />
          <span>Endpoint API:</span>
          <code className="px-1.5 py-0.5 bg-black/40 text-[var(--accent-primary)] font-bold">
            {endpoint}
          </code>
        </div>
      </div>
    </div>
  );
};
