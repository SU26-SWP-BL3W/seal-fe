"use client";

import React, { useState } from "react";
import { eventsRepository } from "@/repositories/eventsRepository";
import { useToast } from "@/providers/ToastProvider";

interface ActivatePublicConfirmModalProps {
  event: any;
  onClose: () => void;
  onConfirmSuccess: () => void;
}

export const ActivatePublicConfirmModal: React.FC<ActivatePublicConfirmModalProps> = ({
  event,
  onClose,
  onConfirmSuccess,
}) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const eventId = event?.id || event?.Id || event?.eventId || event?.EventId || "";
  const evName = event?.eventName || event?.EventName || "Sự kiện";

  const handleActivate = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        eventName: event.eventName || event.EventName,
        season: event.season || event.Season || "Summer",
        year: Number(event.year || event.Year) || new Date().getFullYear(),
        maxTeams: Number(event.maxTeams || event.MaxTeams) || 50,
        description: event.description || event.Description || "",
        startDate: event.startDate || event.StartDate || new Date().toISOString(),
        endDate: event.endDate || event.EndDate || new Date().toISOString(),
        registrationStartDate: event.registrationStartDate || event.RegistrationStartDate,
        registrationEndDate: event.registrationEndDate || event.RegistrationEndDate,
        status: true, // Kích hoạt công khai
      };

      await eventsRepository.updateEvent(eventId, payload);
      toast.success(`ĐÃ KÍCH HOẠT CÔNG KHAI SỰ KIỆN "${evName}" THÀNH CÔNG!`);
      setIsSubmitting(false);
      onConfirmSuccess();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      const msg = err?.response?.data?.message || err?.message || "LỖI KHI KÍCH HOẠT CÔNG KHAI SỰ KIỆN.";
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-[#0b1013] border border-emerald-500/60 shadow-2xl font-mono text-xs text-zinc-300 hud-clipped overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-emerald-950/20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest">
              XÁC NHẬN KÍCH HOẠT CÔNG KHAI SỰ KIỆN
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-2.5 py-1 border border-zinc-700 hover:border-white text-zinc-400 hover:text-white font-bold uppercase text-[10px] cursor-pointer"
          >
            ĐÓNG [ESC]
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">SỰ KIỆN MỤC TIÊU:</span>
            <h3 className="text-sm font-bold text-white uppercase mt-0.5">{evName}</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">Mã sự kiện: {eventId}</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500 text-red-200 font-bold uppercase">
              [LỖI] {errorMsg}
            </div>
          )}

          <div className="p-4 bg-emerald-950/20 border border-emerald-500/40 space-y-2 text-zinc-300">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[11px]">
              <span>✓ MỞ CỔNG THI ĐẤU &amp; HIỂN THỊ CÔNG KHAI</span>
            </div>
            <ul className="list-disc list-inside text-[11px] text-zinc-300 space-y-1 pl-1">
              <li>Sự kiện sẽ được <strong>hiển thị công khai</strong> trên Trang chủ và Cổng tuyển sinh.</li>
              <li>Thí sinh và các đội thi có thể bắt đầu đăng ký và nộp bài theo lộ trình.</li>
              <li>Ban Điều Phối (EC) có thể tiến hành phân bổ Giám khảo và Cố vấn.</li>
            </ul>
          </div>

          <p className="text-[11px] text-zinc-400">
            Bạn có chắc chắn muốn chuyển trạng thái sự kiện sang <strong>HOẠT ĐỘNG (PUBLIC)</strong> ngay bây giờ không?
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-800 bg-[#0b1013]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-zinc-700 hover:border-white text-zinc-400 hover:text-white font-bold uppercase transition-colors cursor-pointer"
          >
            HỦY BỎ
          </button>
          <button
            type="button"
            onClick={handleActivate}
            disabled={isSubmitting}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            {isSubmitting ? "ĐANG KÍCH HOẠT..." : "XÁC NHẬN MỞ CÔNG KHAI"}
          </button>
        </div>
      </div>
    </div>
  );
};
