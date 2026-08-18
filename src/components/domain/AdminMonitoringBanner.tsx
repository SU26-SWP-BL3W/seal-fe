"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";

interface AdminMonitoringBannerProps {
  eventId?: string;
  eventName?: string;
}

export const AdminMonitoringBanner: React.FC<AdminMonitoringBannerProps> = ({
  eventId,
  eventName,
}) => {
  const { user } = useAuth();
  const isAdmin = Boolean(user?.isAdmin || user?.IsAdmin);

  // Chỉ hiển thị banner khi người xem là System Admin đang ở chế độ giám sát
  if (!isAdmin) return null;

  return (
    <div className="w-full bg-[#160b0d] border-b-2 border-red-500/80 px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono shadow-lg shadow-red-950/30 z-40 sticky top-0">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
        <div>
          <span className="text-[11px] text-red-400 font-bold uppercase tracking-widest block">
            CHẾ ĐỘ GIÁM SÁT DÀNH CHO ADMIN (ADMIN MONITORING MODE)
          </span>
          {eventName && (
            <p className="text-[10px] text-zinc-400">
              Đang theo dõi sự kiện: <strong className="text-white font-bold">{eventName}</strong> {eventId && `(ID: ${eventId})`}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {eventId && (
          <Link href={`/admin/events/${eventId}`}>
            <button
              type="button"
              className="px-3 py-1.5 bg-red-950/40 border border-red-500/50 hover:border-red-400 text-red-300 hover:text-white font-bold text-[10px] uppercase transition-colors cursor-pointer"
            >
              ← QUAY LẠI CHI TIẾT SỰ KIỆN
            </button>
          </Link>
        )}

        <Link href="/admin/events">
          <button
            type="button"
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase shadow-md shadow-red-600/30 transition-all cursor-pointer"
          >
            ← QUAY VỀ ADMIN PANEL
          </button>
        </Link>
      </div>
    </div>
  );
};
