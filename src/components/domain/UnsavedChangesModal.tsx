"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onConfirmLeave: () => void;
  onCancelStay: () => void;
  title?: string;
  message?: string;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onConfirmLeave,
  onCancelStay,
  title = "CẢNH BÁO: CHƯA LƯU THAY ĐỔI",
  message = "Bạn có thông tin đang chỉnh sửa dở dang chưa được lưu. Nếu rời khỏi trang hoặc đóng cửa sổ này, toàn bộ tiến trình vừa nhập sẽ bị mất.",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#0f171d] border border-amber-500/50 p-6 shadow-2xl font-mono text-xs space-y-5 hud-clipped relative">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <span>{title}</span>
          </div>
          <button
            type="button"
            onClick={onCancelStay}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Message */}
        <div className="space-y-3">
          <p className="text-zinc-200 font-sans text-xs leading-relaxed">
            {message}
          </p>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed rounded">
            <strong>* Lưu ý:</strong> Bạn chỉ nhận được thông báo này vì hệ thống phát hiện có dữ liệu đã bị chỉnh sửa chưa bấm Lưu.
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onConfirmLeave}
            className="px-4 py-2.5 bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer hud-clipped"
          >
            RỜI TRANG (BỎ THAY ĐỔI)
          </button>

          <button
            type="button"
            onClick={onCancelStay}
            className="px-5 py-2.5 bg-[var(--accent-primary)] hover:bg-white text-[var(--bg-base)] font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer hud-clipped shadow-md"
          >
            Ở LẠI TIẾP TỤC CHỈNH SỬA
          </button>
        </div>
      </div>
    </div>
  );
};
