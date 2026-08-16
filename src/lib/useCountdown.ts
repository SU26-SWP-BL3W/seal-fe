"use client";

import { useEffect, useState } from "react";

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** < 24h còn lại — dùng để bật hiệu ứng nhấp nháy cảnh báo. */
  isUrgent: boolean;
  isPast: boolean;
}

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

/** Đếm ngược tới 1 mốc thời gian ISO, tự cập nhật mỗi giây. targetIso=null -> luôn isPast. */
export function useCountdown(targetIso: string | null): CountdownParts {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetIso) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (!targetIso) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isUrgent: false, isPast: true };
  }

  const remainingMs = new Date(targetIso).getTime() - now;
  const totalMs = Math.max(0, remainingMs);

  return {
    days: Math.floor(totalMs / DAY_MS),
    hours: Math.floor((totalMs % DAY_MS) / HOUR_MS),
    minutes: Math.floor((totalMs % HOUR_MS) / MINUTE_MS),
    seconds: Math.floor((totalMs % MINUTE_MS) / 1000),
    isUrgent: totalMs > 0 && totalMs < DAY_MS,
    isPast: remainingMs <= 0,
  };
}
