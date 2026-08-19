"use client";

import React, { useState } from "react";
import { eventsRepository } from "@/repositories/eventsRepository";
import { useToast } from "@/providers/ToastProvider";

interface RevokeDraftConfirmModalProps {
  event: any;
  onClose: () => void;
  onConfirmSuccess: (updatedEvent: any) => void;
}

export const RevokeDraftConfirmModal: React.FC<RevokeDraftConfirmModalProps> = ({
  event,
  onClose,
  onConfirmSuccess,
}) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const eventId = event?.id || event?.Id || event?.eventId || event?.EventId || "";
  const evName = event?.eventName || event?.EventName || "Sự kiện";
  const teamCount = Number(event?.teamCount ?? event?.TeamCount ?? 0);
  const hasTeams = teamCount > 0;

  const handleRevoke = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Cập nhật trạng thái sự kiện về Bản Nháp (status = false)
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
        status: false, // Chuyển về bản nháp
      };

      await eventsRepository.updateEvent(eventId, payload);
      toast.success(`ĐÃ THU HỒI SỰ KIỆN "${evName}" VỀ BẢN NHÁP THÀNH CÔNG!`);
      setIsSubmitting(false);
      onConfirmSuccess({ ...event, status: false, Status: false });
    } catch (err: any) {
      setIsSubmitting(false);
      const msg = err?.response?.data?.message || err?.message || "LỖI KHI THU HỒI SỰ KIỆN VỀ BẢN NHÁP.";
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-[#0b1013] border border-amber-500/60 shadow-2xl font-mono text-xs text-zinc-300 hud-clipped overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-amber-950/20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[11px] text-amber-400 font-bold uppercase tracking-widest">
              YÊU CẦU THU HỒI VỀ BẢN NHÁP ĐỂ CHỈNH SỬA
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

          {/* Phân nhánh kiểm tra người dùng / đội thi */}
          {hasTeams ? (
            <div className="p-4 bg-red-950/30 border border-red-500/60 space-y-2.5 text-zinc-300">
              <div className="flex items-center gap-2 text-red-400 font-bold uppercase text-[11px]">
                <span>CẢNH BÁO RỦI RO: ĐÃ CÓ {teamCount} ĐỘI THI THAM GIA</span>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-300">
                Sự kiện này hiện đã có <strong className="text-red-400 font-bold">{teamCount} đội thi</strong> ghi danh trong hệ thống.
              </p>
              <ul className="list-disc list-inside text-[10px] text-zinc-400 space-y-1 pl-1">
                <li>Việc chuyển về bản nháp sẽ <strong>tạm ẩn sự kiện</strong> khỏi trang chủ.</li>
                <li>Thí sinh sẽ tạm thời không thể nộp bài hoặc đăng ký mới trong thời gian sửa.</li>
                <li>Dữ liệu bài nộp và đội thi hiện tại vẫn được giữ nguyên vẹn.</li>
              </ul>
            </div>
          ) : (
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/40 space-y-2 text-zinc-300">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[11px]">
                <span>AN TOÀN: CHƯA CÓ ĐỘI THI NÀO ĐĂNG KÝ (0 ĐỘI)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Sự kiện chưa có thí sinh đăng ký. Bạn có thể thu hồi về bản nháp để tự do chỉnh sửa ngày giờ, vòng thi và các hạng mục.
              </p>
            </div>
          )}

          <p className="text-[11px] text-zinc-400">
            Bạn có chắc chắn muốn chuyển trạng thái sự kiện sang <strong>BẢN NHÁP (INACTIVE)</strong> để mở giao diện chỉnh sửa toàn diện không?
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
            onClick={handleRevoke}
            disabled={isSubmitting}
            className={`px-5 py-2 font-bold uppercase transition-all shadow-md cursor-pointer ${
              hasTeams
                ? "bg-red-600 hover:bg-red-500 text-white shadow-red-500/20"
                : "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20"
            }`}
          >
            {isSubmitting
              ? "ĐANG THU HỒI..."
              : hasTeams
              ? "TÔI HIỂU RỦI RO, XÁC NHẬN THU HỒI"
              : "XÁC NHẬN THU HỒI VỀ NHÁP"}
          </button>
        </div>
      </div>
    </div>
  );
};
