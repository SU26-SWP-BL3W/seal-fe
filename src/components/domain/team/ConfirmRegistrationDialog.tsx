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
      eyebrow="Xác nhận ghi danh tham gia giải đấu"
      title="Ghi danh chính thức với Ban Tổ Chức"
      description={`Đội ${teamName} — ${eventName}`}
      confirmLabel="Gửi hồ sơ ghi danh"
      pendingLabel="Đang gửi hồ sơ..."
      pending={isPending}
      disabled={!canConfirm}
      error={error || undefined}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <RegistrationChecklist requirements={requirements} />
      <div className="mt-4 p-3 bg-cyan-950/20 border border-cyan-500/30 font-mono text-[11px] text-cyan-200/90 space-y-1.5 hud-clipped">
        <p className="font-bold text-cyan-300 uppercase">📧 Quy trình xét duyệt từ Ban Tổ Chức:</p>
        <ul className="list-disc pl-4 space-y-1 text-[10px] text-zinc-300 font-sans">
          <li>Hệ thống sẽ gửi email thông báo xác nhận ghi danh tới Đội trưởng và các thành viên.</li>
          <li>Hồ sơ đội sẽ được chuyển đến Ban Tổ Chức để đối soát sĩ số (3–5 người) và tính hợp lệ của thẻ sinh viên.</li>
          <li>Nếu đạt yêu cầu, BTC sẽ <strong>phê duyệt</strong> để đội chính thức nộp bài thi. Nếu chưa đạt, BTC sẽ <strong>trả hồ sơ kèm lý do chi tiết</strong> để đội cập nhật và nộp lại.</li>
        </ul>
      </div>
    </ConfirmDialog>
  );
}
