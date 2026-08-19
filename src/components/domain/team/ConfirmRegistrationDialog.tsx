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
      size="lg"
      eyebrow="XÁC NHẬN GHI DANH THAM GIA GIẢI ĐẤU"
      title="GHI DANH CHÍNH THỨC VỚI BAN TỔ CHỨC"
      description={
        <span className="text-sm text-zinc-300">
          Đội <strong className="text-cyan-400 font-mono">{teamName}</strong> — Sự kiện <strong className="text-white">{eventName}</strong>
        </span>
      }
      confirmLabel="GỬI HỒ SƠ GHI DANH"
      pendingLabel="Đang gửi hồ sơ..."
      pending={isPending}
      disabled={!canConfirm}
      error={error || undefined}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <div className="space-y-4 py-1">
        <RegistrationChecklist requirements={requirements} />
        
        <div className="p-4 bg-cyan-950/30 border border-cyan-500/40 rounded space-y-2.5 hud-clipped shadow-inner">
          <p className="font-bold text-xs sm:text-sm text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
            📧 QUY TRÌNH XÉT DUYỆT TỪ BAN TỔ CHỨC:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-[13px] text-zinc-200 font-sans leading-relaxed">
            <li>Hệ thống sẽ gửi email thông báo xác nhận ghi danh tới Đội trưởng và các thành viên.</li>
            <li>Hồ sơ đội sẽ được chuyển đến Ban Tổ Chức để đối soát sĩ số (3–5 người) và tính hợp lệ của thẻ sinh viên.</li>
            <li>Nếu đạt yêu cầu, BTC sẽ <strong className="text-emerald-400">phê duyệt</strong> để đội chính thức nộp bài thi. Nếu chưa đạt, BTC sẽ <strong className="text-amber-400">trả hồ sơ kèm lý do chi tiết</strong> để đội cập nhật và nộp lại.</li>
          </ul>
        </div>
      </div>
    </ConfirmDialog>
  );
}
