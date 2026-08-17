"use client";

import React from "react";
import { Button, Card } from "@/components/ui";
import { EventFormState } from "@/viewModels/useCreateEventWizardViewModel";
import { Calendar, Shield, ArrowRight, Users, Clock, Lock, Info } from "lucide-react";

interface Step1EventBasicInfoProps {
  eventData: EventFormState;
  onUpdateField?: (field: keyof EventFormState, value: any) => void;
  onNext: () => void;
  isSubmitting?: boolean;
  isReadOnly?: boolean;
}

const formatDisplayDateTime = (val?: string) => {
  if (!val) return "Chưa thiết lập";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  } catch {
    return val;
  }
};

export const Step1EventBasicInfo: React.FC<Step1EventBasicInfoProps> = ({
  eventData,
  onNext,
  isSubmitting = false,
}) => {
  return (
    <Card className="bg-[#13191c] border border-[#263339] p-6 space-y-6 text-[#e1e7ec]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#263339] pb-4">
        <div>
          <h3 className="font-mono font-bold text-lg text-[#e1e7ec] uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#8b5cf6]" />
            Bước 1: Thông Tin Cơ Bản Sự Kiện
          </h3>
          <p className="text-xs font-mono text-[#8a9ba8] mt-1">
            Thông tin chung và quy mô tổ chức sự kiện.
          </p>
        </div>
      </div>

      {/* READABLE SUMMARY CARD OF STEP 1 */}
      <div className="p-6 bg-[#0a0e10] border border-[#263339] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#263339] pb-4">
          <div>
            <span className="text-[10px] font-mono text-[#8b5cf6] uppercase tracking-widest block font-bold">
              TÊN SỰ KIỆN HACKATHON
            </span>
            <h2 className="font-sans font-bold text-2xl text-[#e1e7ec] uppercase">
              {eventData.eventName || "Chưa thiết lập tên sự kiện"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#182024] border border-[#263339] font-mono text-xs font-bold text-[#e1e7ec]">
              {eventData.season ? `${eventData.season} ` : ""}{eventData.year || ""}
            </span>
            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono text-xs font-bold">
              BẢN NHÁP (DRAFT)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {/* Box 1: Cổng Đăng Ký */}
          <div className="p-3 bg-[#13191c] border border-[#263339] space-y-1.5">
            <span className="text-[10px] text-[#f59e0b] uppercase flex items-center gap-1 font-bold">
              <Clock className="w-3.5 h-3.5 text-[#f59e0b]" />
              Thời Gian Mở / Đóng Đăng Ký
            </span>
            <p className="font-bold text-[#e1e7ec] text-[11px] leading-relaxed">
              Mở: {formatDisplayDateTime(eventData.registrationStartDate)}<br />
              Đóng: {formatDisplayDateTime(eventData.registrationEndDate)}
            </p>
          </div>

          {/* Box 2: Thời Gian Sự Kiện */}
          <div className="p-3 bg-[#13191c] border border-[#263339] space-y-1.5">
            <span className="text-[10px] text-[#10b981] uppercase flex items-center gap-1 font-bold">
              <Calendar className="w-3.5 h-3.5 text-[#10b981]" />
              Thời Gian Diễn Ra Sự Kiện
            </span>
            <p className="font-bold text-[#e1e7ec] text-[11px] leading-relaxed">
              Bắt đầu: {formatDisplayDateTime(eventData.startDate)}<br />
              Bế mạc: {formatDisplayDateTime(eventData.endDate)}
            </p>
          </div>

          {/* Box 3: Quy Mô */}
          <div className="p-3 bg-[#13191c] border border-[#263339] space-y-1.5">
            <span className="text-[10px] text-[#8a9ba8] uppercase flex items-center gap-1 font-bold">
              <Users className="w-3.5 h-3.5 text-[#8b5cf6]" />
              Quy Mô Đội &amp; Số Lượng Thành Viên
            </span>
            <p className="font-bold text-[#8b5cf6] text-sm pt-0.5">
              {eventData.maxTeams ? `${eventData.maxTeams} Đội thi` : "Chưa thiết lập quy mô"}
            </p>
            <p className="text-[11px] font-bold text-[#e1e7ec]">
              {eventData.minTeamSize && eventData.maxTeamSize ? `Mỗi đội: ${eventData.minTeamSize} - ${eventData.maxTeamSize} thành viên` : "Chưa cấu hình số thành viên"}
            </p>
          </div>

          <div className="md:col-span-3 p-3 bg-[#13191c] border border-[#263339] space-y-1">
            <span className="text-[10px] text-[#8a9ba8] uppercase font-bold">Mô Tả &amp; Thể Lệ Sự Kiện</span>
            <p className="text-[#8a9ba8] leading-relaxed">
              {eventData.description || "Chưa có mô tả thể lệ cho sự kiện này."}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Navigation Button */}
      <div className="flex items-center justify-between pt-4 border-t border-[#263339] font-mono text-xs">
        <span className="text-[#8a9ba8]">
          Nhấn nút bên phải để bắt đầu Cấu hình Vòng thi &amp; Bảng đấu (Bước 2).
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-[#8b5cf6] hover:bg-purple-600 text-white font-mono font-bold text-xs uppercase flex items-center gap-2 cursor-pointer transition-colors"
        >
          <span>TIẾP TỤC CẤU HÌNH VÒNG THI (BƯỚC 2 &gt;)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
};
