"use client";

import React from "react";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

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
  withTime?: boolean;
  referenceRange?: ReferenceRange;
  startLabel?: string;
  endLabel?: string;
  hint?: string;
  accentColor?: "cyan" | "amber" | "purple" | "emerald" | "sky";
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
  referenceRange,
  startLabel = "Khai mạc",
  endLabel = "Bế mạc",
  hint,
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

  return (
    <div className="p-4 bg-[#141f24] border border-zinc-800 hover:border-zinc-700/80 rounded-lg space-y-3.5 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          {icon || <CalendarIcon className="w-4 h-4 text-cyan-400" />}
          <span className="font-bold text-white font-mono text-xs uppercase tracking-wide">
            {title}
          </span>
        </div>
        {daysCount !== null && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 flex items-center gap-1 border border-zinc-700">
            <Clock className="w-3 h-3 text-cyan-400" /> {daysCount} ngày
          </span>
        )}
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
            onChange={(e) => onStartChange(e.target.value)}
            required
            className="w-full px-3 py-2.5 bg-[#0a0e10] border border-zinc-700 hover:border-zinc-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white rounded font-mono text-xs outline-none transition-colors [color-scheme:dark] cursor-pointer"
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
            onChange={(e) => onEndChange(e.target.value)}
            required
            className="w-full px-3 py-2.5 bg-[#0a0e10] border border-zinc-700 hover:border-zinc-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white rounded font-mono text-xs outline-none transition-colors [color-scheme:dark] cursor-pointer"
          />
        </div>
      </div>

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
