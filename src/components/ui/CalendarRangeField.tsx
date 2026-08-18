"use client";

import React from "react";
import { Calendar as CalendarIcon, Clock, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";

interface ReferenceRange {
  start?: string;
  end?: string;
  label?: string;
}

export interface CalendarRangeFieldProps {
  title: string;
  icon?: React.ReactNode;
  startValue: string;
  endValue: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  minDate?: string;
  maxDate?: string;
  withTime?: boolean;
  referenceRange?: ReferenceRange;
  startLabel?: string;
  endLabel?: string;
  hint?: string;
  accentColor?: "cyan" | "amber" | "purple" | "emerald" | "sky";
  disabled?: boolean;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDisplayDateTime(val?: string) {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    const dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return `${dateStr} ${timeStr}`;
  } catch {
    return val;
  }
}

function toDateTimeLocal(val?: string, fallbackTime = "08:00") {
  if (!val) return "";
  if (val.includes("T")) {
    const parts = val.split("T");
    const datePart = parts[0];
    const timePart = parts[1]?.substring(0, 5) || fallbackTime;
    return `${datePart}T${timePart}`;
  }
  return `${val}T${fallbackTime}`;
}

export const CalendarRangeField: React.FC<CalendarRangeFieldProps> = ({
  title,
  icon,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  minDate,
  maxDate,
  referenceRange,
  startLabel = "Khai mạc",
  endLabel = "Bế mạc",
  hint,
  disabled = false,
}) => {
  // Calculate duration if both dates exist
  const getDaysCount = () => {
    if (!startValue || !endValue) return null;
    const s = new Date(startValue);
    const e = new Date(endValue);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : null;
  };

  const daysCount = getDaysCount();

  // Bounds validation checks
  const minMinAttr = minDate ? toDateTimeLocal(minDate, "00:00") : undefined;
  const maxMaxAttr = maxDate ? toDateTimeLocal(maxDate, "23:59") : undefined;

  const startDt = startValue ? new Date(startValue) : null;
  const endDt = endValue ? new Date(endValue) : null;
  const minDt = minDate ? new Date(minDate) : null;
  const maxDt = maxDate ? new Date(maxDate) : null;

  const errors: string[] = [];
  if (startDt && endDt && startDt > endDt) {
    errors.push("Thời gian bắt đầu không thể diễn ra sau thời gian kết thúc.");
  }
  if (startDt && minDt && startDt < minDt) {
    errors.push(`Thời gian bắt đầu (${formatDisplayDateTime(startValue)}) nằm trước giới hạn tối thiểu (${formatDisplayDateTime(minDate)}).`);
  }
  if (endDt && maxDt && endDt > maxDt) {
    errors.push(`Thời gian kết thúc (${formatDisplayDateTime(endValue)}) vượt quá giới hạn cuộc thi (${formatDisplayDateTime(maxDate)}).`);
  }

  // Quick action presets
  const applyAddDays = (days: number) => {
    if (!startValue) return;
    const s = new Date(startValue);
    if (isNaN(s.getTime())) return;
    s.setDate(s.getDate() + days);
    const dateStr = s.toISOString().substring(0, 10);
    const timeStr = startValue.includes("T") ? startValue.split("T")[1]?.substring(0, 5) || "17:00" : "17:00";
    onEndChange(`${dateStr}T${timeStr}`);
  };

  const matchReference = () => {
    if (referenceRange?.start) onStartChange(toDateTimeLocal(referenceRange.start, "08:00"));
    if (referenceRange?.end) onEndChange(toDateTimeLocal(referenceRange.end, "17:00"));
  };

  return (
    <div className={`p-4 bg-[#141f24] border ${errors.length > 0 ? "border-red-500/50 bg-red-950/10" : "border-zinc-800 hover:border-zinc-700/80"} rounded-lg space-y-3.5 transition-colors shadow-sm`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800/80 pb-2.5 gap-2">
        <div className="flex items-center gap-2">
          {icon || <CalendarIcon className="w-4 h-4 text-cyan-400" />}
          <span className="font-bold text-white font-mono text-xs uppercase tracking-wide">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {daysCount !== null && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 flex items-center gap-1 border border-zinc-700">
              <Clock className="w-3 h-3 text-cyan-400" /> {daysCount} ngày
            </span>
          )}
          {errors.length === 0 && startValue && endValue && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3 h-3" /> HỢP LỆ
            </span>
          )}
        </div>
      </div>

      {/* Date-time inputs grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Date */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-zinc-400 block font-medium">
            Thời gian {startLabel.toLowerCase()} (Ngày & Giờ):
          </label>
          <input
            type="datetime-local"
            value={toDateTimeLocal(startValue, "08:00")}
            min={minMinAttr}
            max={maxMaxAttr}
            disabled={disabled}
            onChange={(e) => onStartChange(e.target.value)}
            required
            className="w-full px-3 py-2.5 bg-[#0a0e10] border border-zinc-700 hover:border-zinc-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white rounded font-mono text-xs outline-none transition-colors [color-scheme:dark] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* End Date */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-zinc-400 block font-medium">
            Thời gian {endLabel.toLowerCase()} (Ngày & Giờ):
          </label>
          <input
            type="datetime-local"
            value={toDateTimeLocal(endValue, "17:00")}
            min={startValue ? toDateTimeLocal(startValue, "00:00") : minMinAttr}
            max={maxMaxAttr}
            disabled={disabled}
            onChange={(e) => onEndChange(e.target.value)}
            required
            className="w-full px-3 py-2.5 bg-[#0a0e10] border border-zinc-700 hover:border-zinc-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white rounded font-mono text-xs outline-none transition-colors [color-scheme:dark] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Inline Errors / Bounds Notices */}
      {errors.length > 0 && (
        <div className="p-2.5 bg-red-950/60 border border-red-500/50 rounded text-red-300 font-mono text-[11px] space-y-1">
          <div className="flex items-center gap-1.5 font-bold uppercase">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>CẢNH BÁO VI PHẠM THỜI GIAN</span>
          </div>
          <ul className="list-disc pl-4 space-y-0.5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Helper Hints & Reference */}
      {(hint || (referenceRange && (referenceRange.start || referenceRange.end))) && (
        <div className="pt-1 text-[10px] font-mono space-y-1 border-t border-zinc-800/40">
          {referenceRange && (referenceRange.start || referenceRange.end) && (
            <p className="text-cyan-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span>
                {referenceRange.label || "Mốc tham chiếu"}:{" "}
                <span className="font-bold text-zinc-200">
                  {formatDisplayDateTime(referenceRange.start)} → {formatDisplayDateTime(referenceRange.end)}
                </span>
              </span>
            </p>
          )}
          {hint && <p className="text-zinc-400">{hint}</p>}
        </div>
      )}
    </div>
  );
};
