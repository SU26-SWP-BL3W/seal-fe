"use client";

import React, { useMemo, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toDisplay(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function parseDatePart(val?: string): Date | null {
  if (!val) return null;
  const datePart = val.split("T")[0];
  const bits = datePart.split("-").map(Number);
  if (bits.length !== 3 || bits.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = bits;
  return new Date(y, m - 1, d);
}

function parseTimePart(val?: string, fallback = "08:00") {
  if (!val || !val.includes("T")) return fallback;
  return val.split("T")[1]?.substring(0, 5) || fallback;
}

function combine(dateKey: string, time: string) {
  return `${dateKey}T${time}`;
}

interface ReferenceRange {
  start?: string;
  end?: string;
  label?: string;
}

interface CalendarRangeFieldProps {
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
}

/**
 * Lịch chọn khoảng ngày dùng chung (thay cho <input type="date"> gốc).
 * Click ngày 1 = ghim điểm đầu; các ngày sau đó tô sáng theo vùng đã rê tới;
 * click ngày 2 (>= ngày đầu) mới chốt điểm cuối — cho thấy rõ vùng đang chọn
 * ngay trên lưới thay vì phải nhớ ngày đầu đã chọn là ngày nào.
 */
export const CalendarRangeField: React.FC<CalendarRangeFieldProps> = ({
  title,
  icon,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  withTime = true,
  referenceRange,
  startLabel = "Ngày bắt đầu",
  endLabel = "Ngày kết thúc",
  hint,
}) => {
  const startDate = parseDatePart(startValue);
  const endDate = parseDatePart(endValue);
  const refStart = parseDatePart(referenceRange?.start);
  const refEnd = parseDatePart(referenceRange?.end);

  const [viewMonth, setViewMonth] = useState(() => {
    const base = startDate || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const startTime = parseTimePart(startValue, "08:00");
  const endTime = parseTimePart(endValue, "17:00");

  const days = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [viewMonth]);

  const handlePick = (day: Date) => {
    const key = toDateKey(day);
    if (!startDate || (startDate && endDate)) {
      onStartChange(combine(key, startTime));
      onEndChange("");
      return;
    }
    if (day.getTime() < startDate.getTime()) {
      onStartChange(combine(key, startTime));
      onEndChange("");
      return;
    }
    onEndChange(combine(key, endTime));
  };

  const previewEnd = !endDate && hoverKey ? parseDatePart(hoverKey) : null;
  const rangeEndForPreview = endDate || previewEnd;

  const todayKey = toDateKey(new Date());

  return (
    <div className="p-4 bg-[var(--bg-base)] border border-[var(--border-muted)] hud-clipped space-y-3">
      <div className="flex items-center justify-between border-b border-[var(--border-muted)]/60 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--text-primary)]">
          {icon || <CalendarIcon className="w-4 h-4 text-[var(--accent-primary)]" />}
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-[var(--text-muted)] w-24 text-center">
            {MONTH_NAMES[viewMonth.getMonth()]}/{viewMonth.getFullYear()}
          </span>
          <button
            type="button"
            onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {hint && <p className="text-[10px] font-mono text-[var(--text-muted)]">{hint}</p>}

      <div
        className="grid grid-cols-7 gap-y-1 text-center"
        onMouseLeave={() => setHoverKey(null)}
      >
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-[9px] font-mono text-[var(--text-muted)] uppercase pb-1">
            {w}
          </span>
        ))}
        {days.map((day) => {
          const key = toDateKey(day);
          const inMonth = day.getMonth() === viewMonth.getMonth();
          const isStart = !!(startDate && key === toDateKey(startDate));
          const isEnd = !!(endDate && key === toDateKey(endDate));
          const lo = startDate && rangeEndForPreview ? Math.min(startDate.getTime(), rangeEndForPreview.getTime()) : null;
          const hi = startDate && rangeEndForPreview ? Math.max(startDate.getTime(), rangeEndForPreview.getTime()) : null;
          const inRange = lo !== null && hi !== null && day.getTime() > lo && day.getTime() < hi;
          const isRefEdge = !!((refStart && key === toDateKey(refStart)) || (refEnd && key === toDateKey(refEnd)));
          const isRefRange =
            !!(refStart && refEnd && day.getTime() > refStart.getTime() && day.getTime() < refEnd.getTime());
          const isToday = key === todayKey;

          return (
            <button
              key={key}
              type="button"
              disabled={!inMonth}
              onMouseEnter={() => setHoverKey(key)}
              onClick={() => handlePick(day)}
              title={isRefEdge || isRefRange ? referenceRange?.label || "Mốc tham chiếu" : undefined}
              className={[
                "relative h-7 text-[11px] font-mono flex items-center justify-center transition-colors",
                !inMonth ? "text-[var(--text-muted)]/20 cursor-default" : "cursor-pointer",
                inMonth && !isStart && !isEnd ? "text-[var(--text-primary)] hover:bg-[var(--bg-input)]" : "",
                isStart || isEnd ? "bg-[var(--accent-primary)] text-[var(--bg-base)] font-bold" : "",
                inRange && !isStart && !isEnd ? "bg-[var(--accent-primary)]/15" : "",
                isRefRange && !inRange ? "bg-cyan-400/10" : "",
                isToday && !isStart && !isEnd ? "ring-1 ring-inset ring-[var(--accent-primary)]/50" : "",
              ].join(" ")}
            >
              {day.getDate()}
              {(isRefEdge || (isRefRange && !isStart && !isEnd)) && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-cyan-400" />
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="space-y-1">
          <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">{startLabel}</span>
          <div className="font-mono text-xs text-[var(--text-primary)] bg-[var(--bg-input)] border border-[var(--border-muted)] px-2 py-1.5 hud-clipped">
            {startDate ? toDisplay(startDate) : "Chưa chọn"}
          </div>
          {withTime && (
            <input
              type="time"
              value={startTime}
              disabled={!startDate}
              onChange={(e) => startDate && onStartChange(combine(toDateKey(startDate), e.target.value))}
              className="w-full font-mono text-xs bg-[var(--bg-input)] border border-[var(--border-muted)] px-2 py-1 hud-clipped text-[var(--text-primary)] disabled:opacity-40"
            />
          )}
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">{endLabel}</span>
          <div className="font-mono text-xs text-[var(--text-primary)] bg-[var(--bg-input)] border border-[var(--border-muted)] px-2 py-1.5 hud-clipped">
            {endDate ? toDisplay(endDate) : "Chưa chọn"}
          </div>
          {withTime && (
            <input
              type="time"
              value={endTime}
              disabled={!endDate}
              onChange={(e) => endDate && onEndChange(combine(toDateKey(endDate), e.target.value))}
              className="w-full font-mono text-xs bg-[var(--bg-input)] border border-[var(--border-muted)] px-2 py-1 hud-clipped text-[var(--text-primary)] disabled:opacity-40"
            />
          )}
        </div>
      </div>

      {referenceRange && (refStart || refEnd) && (
        <p className="text-[10px] font-mono text-cyan-400 flex items-center gap-1.5 pt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block shrink-0" />
          {referenceRange.label || "Mốc tham chiếu"}: {refStart ? toDisplay(refStart) : "?"} → {refEnd ? toDisplay(refEnd) : "?"}
        </p>
      )}
    </div>
  );
};
