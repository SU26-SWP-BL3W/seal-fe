"use client";

import React, { useState, useEffect, useMemo } from "react";

export interface DeliverableCheckItem {
  key: string;
  label: string;
  isSubmitted: boolean;
}

export interface TeamCountdownTimerProps {
  roundName?: string;
  deadline?: string; // ISO string
  startDate?: string; // ISO string
  deliverables?: DeliverableCheckItem[];
  className?: string;
}

export const TeamCountdownTimer: React.FC<TeamCountdownTimerProps> = ({
  roundName = "VÒNG THI HIỆN TẠI",
  deadline,
  startDate,
  deliverables = [],
  className = "",
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  const deadlineTimestamp = useMemo(() => {
    if (!deadline) return 0;
    const d = new Date(deadline);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }, [deadline]);

  const startTimestamp = useMemo(() => {
    if (!startDate) return 0;
    const s = new Date(startDate);
    return isNaN(s.getTime()) ? 0 : s.getTime();
  }, [startDate]);

  // Update countdown every second
  useEffect(() => {
    if (!deadlineTimestamp) return;

    const calculate = () => {
      const now = Date.now();
      const diff = deadlineTimestamp - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [deadlineTimestamp]);

  // Calculate elapsed progress percentage
  const progressPercent = useMemo(() => {
    if (!deadlineTimestamp || !startTimestamp) return 0;
    const total = deadlineTimestamp - startTimestamp;
    if (total <= 0) return 100;
    const elapsed = Date.now() - startTimestamp;
    const pct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    return pct;
  }, [deadlineTimestamp, startTimestamp]);

  const pad = (n: number) => String(n).padStart(2, "0");

  const formattedDeadline = useMemo(() => {
    if (!deadline) return "Chưa thiết lập";
    const d = new Date(deadline);
    if (isNaN(d.getTime())) return deadline;
    return `${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} • ${d.toLocaleDateString("vi-VN")}`;
  }, [deadline]);

  return (
    <div className={`bg-[#0f171c] border border-zinc-800 p-5 hud-clipped font-mono text-xs space-y-4 ${className}`}>
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
            THỜI GIAN ĐẾM NGƯỢC NỘP BÀI
          </span>
          <div className="font-bold text-sm text-white uppercase tracking-wider mt-0.5">
            {roundName}
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] text-zinc-500 uppercase block">Hạn chót:</span>
          <span className="font-bold text-zinc-300 text-xs">{formattedDeadline}</span>
        </div>
      </div>

      {/* Digits Display */}
      {timeLeft.isExpired ? (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-center font-bold uppercase hud-clipped">
          [ĐÃ HẾT HẠN NỘP BÀI CHO VÒNG THI NÀY]
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
          <div className="p-3 bg-[#141f23] border border-zinc-800 hud-clipped">
            <div className="font-display font-bold text-xl sm:text-2xl text-white">
              {pad(timeLeft.days)}
            </div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">NGÀY</div>
          </div>

          <div className="p-3 bg-[#141f23] border border-zinc-800 hud-clipped">
            <div className="font-display font-bold text-xl sm:text-2xl text-white">
              {pad(timeLeft.hours)}
            </div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">GIỜ</div>
          </div>

          <div className="p-3 bg-[#141f23] border border-zinc-800 hud-clipped">
            <div className="font-display font-bold text-xl sm:text-2xl text-white">
              {pad(timeLeft.minutes)}
            </div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">PHÚT</div>
          </div>

          <div className="p-3 bg-[#141f23] border border-zinc-800 hud-clipped">
            <div className="font-display font-bold text-xl sm:text-2xl text-[#38bdf8]">
              {pad(timeLeft.seconds)}
            </div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">GIÂY</div>
          </div>
        </div>
      )}

      {/* Progress Bar (if start timestamp available) */}
      {startTimestamp > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span>Tiến độ thời gian vòng thi</span>
            <span className="font-bold text-zinc-300">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#141f23] border border-zinc-800 hud-clipped overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Deliverables Checklist (if provided) */}
      {deliverables.length > 0 && (
        <div className="pt-2 border-t border-zinc-800/80 space-y-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
            YÊU CẦU BÀI NỘP CỦA ĐỘI THI:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {deliverables.map((deliv) => (
              <span
                key={deliv.key}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase hud-clipped ${
                  deliv.isSubmitted
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-zinc-800/80 text-zinc-400 border border-zinc-700"
                }`}
              >
                {deliv.isSubmitted ? "[X]" : "[ ]"} {deliv.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
