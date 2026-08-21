"use client";

import React from "react";
import { Card, Input, CalendarRangeField } from "@/components/ui";
import { EventFormState } from "@/viewModels/useCreateEventWizardViewModel";
import {
  Calendar,
  Shield,
  ArrowRight,
  Users,
  Clock,
  Info,
  Save,
  FileText,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface Step1EventBasicInfoProps {
  eventData: EventFormState;
  onUpdateField?: (field: keyof EventFormState, value: any) => void;
  onNext: () => void;
  onSaveDraft?: () => void;
  isSubmitting?: boolean;
  isReadOnly?: boolean;
}

export const Step1EventBasicInfo: React.FC<Step1EventBasicInfoProps> = ({
  eventData,
  onUpdateField,
  onNext,
  onSaveDraft,
  isSubmitting = false,
  isReadOnly = false,
}) => {
  const minTeamSizeVal = Math.max(3, Number(eventData.minTeamSize) || 3);
  const maxTeamSizeVal = Math.max(minTeamSizeVal, Number(eventData.maxTeamSize) || 5);

  return (
    <Card className="bg-[#13191c] border border-[#263339] p-6 space-y-6 text-[#e1e7ec]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#263339] pb-4">
        <div>
          <h3 className="font-mono font-bold text-lg text-[#e1e7ec] uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#8b5cf6]" />
            Bước 1: Cấu Hình Thông Tin Cơ Bản &amp; Quy Mô Sự Kiện
          </h3>
          <p className="text-xs font-mono text-[#8a9ba8] mt-1">
            Event Coordinator có quyền thiết lập thời gian đăng ký, lịch trình sự kiện và quy mô số lượng đội tham gia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-[#8b5cf6]/15 border border-[#8b5cf6]/40 text-[#c084fc] font-mono text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> EC ĐƯỢC PHÉP CHỈNH SỬA
          </span>
          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono text-xs font-bold">
            BẢN NHÁP (DRAFT)
          </span>
        </div>
      </div>

      {/* FORM INPUTS */}
      <div className="p-6 bg-[#0a0e10] border border-[#263339] space-y-6">
        {/* Row 1: Tên sự kiện, Mùa giải, Năm */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-xs font-mono font-bold text-[#8a9ba8] uppercase flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#8b5cf6]" />
              Tên Sự Kiện Hackathon *
            </label>
            <Input
              type="text"
              value={eventData.eventName || ""}
              onChange={(e) => onUpdateField?.("eventName", e.target.value)}
              disabled={isReadOnly || isSubmitting}
              placeholder="Nhập tên sự kiện (ví dụ: SEAL Hackathon 2026)"
              className="bg-[#13191c] border-[#263339] text-[#e1e7ec] font-bold focus:border-[#8b5cf6]"
              required
            />
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-mono font-bold text-[#8a9ba8] uppercase">
              Mùa Giải *
            </label>
            <select
              value={eventData.season || "Mùa Hè"}
              onChange={(e) => onUpdateField?.("season", e.target.value)}
              disabled={isReadOnly || isSubmitting}
              className="h-10 w-full rounded-lg border border-[#263339] bg-[#13191c] px-3 font-mono text-xs text-[#e1e7ec] outline-none focus:border-[#8b5cf6] cursor-pointer"
            >
              <option value="Mùa Xuân">Mùa Xuân (Spring)</option>
              <option value="Mùa Hè">Mùa Hè (Summer)</option>
              <option value="Mùa Thu">Mùa Thu (Autumn)</option>
              <option value="Mùa Đông">Mùa Đông (Winter)</option>
            </select>
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-mono font-bold text-[#8a9ba8] uppercase">
              Năm Tổ Chức *
            </label>
            <Input
              type="number"
              value={eventData.year || new Date().getFullYear()}
              onChange={(e) => onUpdateField?.("year", Number(e.target.value))}
              disabled={isReadOnly || isSubmitting}
              className="bg-[#13191c] border-[#263339] text-[#e1e7ec] font-mono text-xs focus:border-[#8b5cf6]"
              required
            />
          </div>
        </div>

        {/* Row 2: Thời gian diễn ra sự kiện & Thời gian mở/đóng đăng ký */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#263339]/60">
          {/* Box 1: Thời gian diễn ra sự kiện */}
          <div>
            <CalendarRangeField
              title="Thời gian diễn ra sự kiện *"
              icon={<Calendar className="h-4 w-4 text-[#10b981]" />}
              startValue={eventData.startDate}
              endValue={eventData.endDate}
              onStartChange={(v) => onUpdateField?.("startDate", v)}
              onEndChange={(v) => onUpdateField?.("endDate", v)}
              startLabel="Khai mạc"
              endLabel="Bế mạc"
              hint="Khung thời gian chính thức diễn ra toàn bộ sự kiện."
              disabled={isReadOnly || isSubmitting}
            />
          </div>

          {/* Box 2: Thời gian mở / đóng đăng ký */}
          <div>
            <CalendarRangeField
              title="Thời gian mở / đóng cổng đăng ký"
              icon={<Clock className="h-4 w-4 text-[#f59e0b]" />}
              startValue={eventData.registrationStartDate}
              endValue={eventData.registrationEndDate}
              onStartChange={(v) => onUpdateField?.("registrationStartDate", v)}
              onEndChange={(v) => onUpdateField?.("registrationEndDate", v)}
              startLabel="Mở cổng đăng ký"
              endLabel="Đóng cổng đăng ký"
              hint="Thời hạn các đội thi tạo đội, nộp hồ sơ sinh viên và gửi duyệt BTC."
              referenceRange={{
                start: eventData.startDate,
                end: eventData.endDate,
                label: "Sự kiện diễn ra",
              }}
              disabled={isReadOnly || isSubmitting}
            />
          </div>
        </div>

        {/* Row 3: Cấu hình quy mô số đội & Số người mỗi đội */}
        <div className="pt-2 border-t border-[#263339]/60 space-y-4">
          <div className="flex items-center gap-2 font-mono text-xs text-[#8b5cf6] font-bold uppercase">
            <Users className="w-4 h-4" />
            Cấu hình Quy mô Đội Thi &amp; Sĩ Số Thành Viên
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Max Teams */}
            <div className="p-4 bg-[#13191c] border border-[#263339] space-y-2 rounded-lg">
              <label className="text-xs font-mono font-bold text-[#e1e7ec] flex items-center justify-between">
                <span>Số Đội Tham Gia Tối Đa *</span>
                <span className="text-[10px] text-[#8a9ba8] font-normal font-sans">(Max Teams)</span>
              </label>
              <Input
                type="number"
                min={1}
                max={500}
                value={eventData.maxTeams || ""}
                onChange={(e) => onUpdateField?.("maxTeams", Math.max(1, Number(e.target.value)))}
                disabled={isReadOnly || isSubmitting}
                placeholder="Ví dụ: 50"
                className="bg-[#0a0e10] border-[#263339] text-[#8b5cf6] font-bold text-sm focus:border-[#8b5cf6]"
                required
              />
              <p className="text-[11px] font-sans text-[#8a9ba8]">
                Giới hạn tổng số đội được duyệt ghi danh trong sự kiện này.
              </p>
            </div>

            {/* Min Team Size - Bắt buộc tối thiểu là 3 theo quy chế SEAL */}
            <div className="p-4 bg-[#13191c] border border-[#263339] space-y-2 rounded-lg relative">
              <label className="text-xs font-mono font-bold text-[#e1e7ec] flex items-center justify-between">
                <span className="flex items-center gap-1">
                  Sĩ Số Tối Thiểu / Đội *
                  <Lock className="w-3 h-3 text-[#10b981]" />
                </span>
                <span className="text-[10px] text-[#10b981] font-bold font-mono">TỐI THIỂU: 3</span>
              </label>
              <Input
                type="number"
                min={3}
                max={maxTeamSizeVal}
                value={minTeamSizeVal}
                onChange={(e) => {
                  const val = Math.max(3, Number(e.target.value));
                  onUpdateField?.("minTeamSize", val);
                  if (val > maxTeamSizeVal) {
                    onUpdateField?.("maxTeamSize", val);
                  }
                }}
                disabled={isReadOnly || isSubmitting}
                className="bg-[#0a0e10] border-[#263339] text-[#10b981] font-bold text-sm focus:border-[#10b981]"
                required
              />
              <div className="flex items-center gap-1 text-[11px] font-sans text-[#10b981]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Quy chế thi đấu SEAL: Bắt buộc tối thiểu 3 thành viên / đội.</span>
              </div>
            </div>

            {/* Max Team Size */}
            <div className="p-4 bg-[#13191c] border border-[#263339] space-y-2 rounded-lg">
              <label className="text-xs font-mono font-bold text-[#e1e7ec] flex items-center justify-between">
                <span>Sĩ Số Tối Đa / Đội *</span>
                <span className="text-[10px] text-[#8a9ba8] font-normal font-sans">(Max Members)</span>
              </label>
              <Input
                type="number"
                min={minTeamSizeVal}
                max={10}
                value={maxTeamSizeVal}
                onChange={(e) => onUpdateField?.("maxTeamSize", Math.max(minTeamSizeVal, Number(e.target.value)))}
                disabled={isReadOnly || isSubmitting}
                className="bg-[#0a0e10] border-[#263339] text-[#e1e7ec] font-bold text-sm focus:border-[#8b5cf6]"
                required
              />
              <p className="text-[11px] font-sans text-[#8a9ba8]">
                Số lượng thành viên tối đa trong một đội (chuẩn: 5 thành viên).
              </p>
            </div>
          </div>
        </div>

        {/* Row 4: Mô tả & Thể lệ sự kiện */}
        <div className="pt-2 border-t border-[#263339]/60 space-y-1.5">
          <label className="text-xs font-mono font-bold text-[#8a9ba8] uppercase">
            Mô Tả &amp; Thể Lệ Sự Kiện
          </label>
          <textarea
            rows={4}
            value={eventData.description || ""}
            onChange={(e) => onUpdateField?.("description", e.target.value)}
            disabled={isReadOnly || isSubmitting}
            placeholder="Nhập mô tả chi tiết, chủ đề và quy định chung của sự kiện..."
            className="w-full rounded-lg border border-[#263339] bg-[#13191c] p-3 font-sans text-xs text-[#e1e7ec] outline-none placeholder:text-[#8a9ba8]/50 focus:border-[#8b5cf6]"
          />
        </div>
      </div>

      {/* Footer Navigation Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#263339] font-mono text-xs">
        <div className="flex items-center gap-2">
          {onSaveDraft && (
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-[#182024] hover:bg-[#263339] text-[#e1e7ec] border border-[#263339] font-mono text-xs font-bold uppercase flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>LƯU BẢN NHÁP</span>
            </button>
          )}
          <span className="text-[#8a9ba8] text-[11px]">
            Lưu thay đổi hoặc bấm Tiếp tục để sang Bước 2 (Cấu hình Vòng thi).
          </span>
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-6 py-2.5 bg-[#8b5cf6] hover:bg-purple-600 text-white font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)]"
        >
          <span>TIẾP TỤC CẤU HÌNH VÒNG THI (BƯỚC 2)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
};
