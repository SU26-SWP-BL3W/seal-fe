"use client";

import React from "react";
import { Input } from "@/components/ui";
import {
  Calendar,
  UploadCloud,
  FileCheck,
  Scale,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

export interface RoundTimelineValues {
  startDate: string;
  endDate: string;
  scoringStartDate?: string;
  scoringEndDate?: string;
  appealStartDate?: string;
  appealEndDate?: string;
}

interface RoundTimelinePickerProps {
  values: RoundTimelineValues;
  onChange: (field: keyof RoundTimelineValues, value: string) => void;
  title?: string;
}

export const RoundTimelinePicker: React.FC<RoundTimelinePickerProps> = ({
  values,
  onChange,
  title = "Mốc thời gian của vòng thi",
}) => {
  // Helper calculate days between dates
  const getDaysCount = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return null;
    const s = new Date(startStr);
    const e = new Date(endStr);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : null;
  };

  const subDays = getDaysCount(values.startDate, values.endDate);
  const scoreDays = getDaysCount(values.scoringStartDate, values.scoringEndDate);
  const appealDays = getDaysCount(values.appealStartDate, values.appealEndDate);

  // Simple validation warnings
  let warningMessage: string | null = null;
  if (values.startDate && values.endDate && values.startDate > values.endDate) {
    warningMessage = "Ngày mở nộp bài phải diễn ra trước ngày hạn chót!";
  } else if (values.endDate && values.scoringStartDate && values.scoringStartDate < values.endDate) {
    warningMessage = "Ngày bắt đầu chấm điểm nên diễn ra từ ngày hạn chót nộp bài!";
  } else if (values.scoringStartDate && values.scoringEndDate && values.scoringStartDate > values.scoringEndDate) {
    warningMessage = "Ngày kết thúc chấm điểm phải diễn ra sau ngày bắt đầu chấm!";
  } else if (values.appealStartDate && values.appealEndDate && values.appealStartDate > values.appealEndDate) {
    warningMessage = "Ngày đóng phúc khảo phải diễn ra sau ngày mở phúc khảo!";
  }

  // Helper normalize datetime for datetime-local input (YYYY-MM-DDTHH:mm)
  const toDateTimeLocal = (val?: string, defaultTime = "08:00") => {
    if (!val) return "";
    if (val.includes("T")) {
      const parts = val.split("T");
      const datePart = parts[0];
      const timePart = parts[1]?.substring(0, 5) || defaultTime;
      return `${datePart}T${timePart}`;
    }
    return `${val}T${defaultTime}`;
  };

  return (
    <div className="p-5 bg-[var(--bg-base)] border border-[var(--border-muted)] hud-clipped space-y-5">
      {/* Header & Stepper Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-muted)] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-coordinator)]/10 border border-[var(--accent-coordinator)]/30 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-[var(--accent-coordinator)]" />
          </div>
          <div>
            <h4 className="font-mono font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
              {title}
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              Cấu hình ngày &amp; giờ chính xác mở/đóng Form Nộp bài, Chấm điểm và Phúc khảo
            </p>
          </div>
        </div>

        {/* Phase Flow Indicator Pill */}
        <div className="flex items-center gap-1 text-[10px] font-mono font-bold px-3 py-1 bg-[var(--bg-panel)] border border-[var(--border-muted)] rounded-full text-[var(--text-muted)]">
          <span className="text-amber-400 flex items-center gap-1">
            <UploadCloud className="w-3 h-3" /> Nộp bài
          </span>
          <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
          <span className="text-cyan-400 flex items-center gap-1">
            <FileCheck className="w-3 h-3" /> Chấm điểm
          </span>
          <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
          <span className="text-purple-400 flex items-center gap-1">
            <Scale className="w-3 h-3" /> Phúc khảo
          </span>
        </div>
      </div>

      {/* 3 Phase Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Phase 1: Submission */}
        <div className="p-4 rounded-lg bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-3 relative group">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
              <UploadCloud className="w-4 h-4 text-amber-400" />
              <span>GIAI ĐOẠN 1: NỘP BÀI</span>
            </div>
            {subDays !== null && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" /> {subDays} ngày
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--text-muted)] flex items-center justify-between">
                <span>1. Mở nộp bài (Giờ/Ngày)</span>
                <span className="text-amber-400 font-bold">*</span>
              </label>
              <Input
                type="datetime-local"
                value={toDateTimeLocal(values.startDate, "08:00")}
                onChange={(e) => onChange("startDate", e.target.value)}
                className="font-mono text-xs border-amber-500/30 focus:border-amber-400 bg-[var(--bg-input)] text-[var(--text-primary)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--text-muted)] flex items-center justify-between">
                <span>2. Hạn chót nộp bài (Khóa Form)</span>
                <span className="text-amber-400 font-bold">*</span>
              </label>
              <Input
                type="datetime-local"
                value={toDateTimeLocal(values.endDate, "23:59")}
                onChange={(e) => onChange("endDate", e.target.value)}
                className="font-mono text-xs border-amber-500/30 focus:border-amber-400 bg-[var(--bg-input)] text-[var(--text-primary)]"
              />
            </div>
          </div>
        </div>

        {/* Phase 2: Scoring */}
        <div className="p-4 rounded-lg bg-gradient-to-b from-cyan-500/10 via-cyan-500/5 to-transparent border border-cyan-500/30 space-y-3 relative group">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              <span>GIAI ĐOẠN 2: CHẤM ĐIỂM</span>
            </div>
            {scoreDays !== null && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" /> {scoreDays} ngày
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--text-muted)] flex items-center justify-between">
                <span>3. Bắt đầu chấm (Mở Form Giám khảo)</span>
                <span className="text-cyan-400 font-bold">*</span>
              </label>
              <Input
                type="datetime-local"
                value={toDateTimeLocal(values.scoringStartDate || values.endDate, "08:00")}
                onChange={(e) => onChange("scoringStartDate", e.target.value)}
                className="font-mono text-xs border-cyan-500/30 focus:border-cyan-400 bg-[var(--bg-input)] text-[var(--text-primary)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--text-muted)] flex items-center justify-between">
                <span>4. Kết thúc chấm (Khóa Form Giám khảo)</span>
                <span className="text-cyan-400 font-bold">*</span>
              </label>
              <Input
                type="datetime-local"
                value={toDateTimeLocal(values.scoringEndDate, "23:59")}
                onChange={(e) => onChange("scoringEndDate", e.target.value)}
                className="font-mono text-xs border-cyan-500/30 focus:border-cyan-400 bg-[var(--bg-input)] text-[var(--text-primary)]"
              />
            </div>
          </div>
        </div>

        {/* Phase 3: Appeal */}
        <div className="p-4 rounded-lg bg-gradient-to-b from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/30 space-y-3 relative group">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-purple-400">
              <Scale className="w-4 h-4 text-purple-400" />
              <span>GIAI ĐOẠN 3: PHÚC KHẢO</span>
            </div>
            {appealDays !== null ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" /> {appealDays} ngày
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">
                Tùy chọn
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--text-muted)]">
                5. Mở phúc khảo (Mở Form Khiếu nại)
              </label>
              <Input
                type="datetime-local"
                value={toDateTimeLocal(values.appealStartDate, "08:00")}
                onChange={(e) => onChange("appealStartDate", e.target.value)}
                className="font-mono text-xs border-purple-500/30 focus:border-purple-400 bg-[var(--bg-input)] text-[var(--text-primary)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--text-muted)]">
                6. Đóng phúc khảo (Khóa Form Khiếu nại)
              </label>
              <Input
                type="datetime-local"
                value={toDateTimeLocal(values.appealEndDate, "23:59")}
                onChange={(e) => onChange("appealEndDate", e.target.value)}
                className="font-mono text-xs border-purple-500/30 focus:border-purple-400 bg-[var(--bg-input)] text-[var(--text-primary)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Validation Status Footer */}
      {warningMessage ? (
        <div className="px-3 py-2 bg-[rgba(245,158,11,0.1)] border border-[var(--color-warning)] text-[var(--color-warning)] font-mono text-xs rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{warningMessage}</span>
        </div>
      ) : (
        values.startDate && values.endDate && values.scoringEndDate && (
          <div className="px-3 py-1.5 bg-[rgba(16,185,129,0.08)] border border-[var(--color-success)]/40 text-[var(--color-success)] font-mono text-[11px] rounded flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[var(--color-success)]" />
            <span>Mốc thời gian hợp lệ — Đã sẵn sàng cho giai đoạn chấm và thăng vòng!</span>
          </div>
        )
      )}
    </div>
  );
};
