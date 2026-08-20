"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useEvents } from "@/repositories/eventsRepository";
import { Link } from "@/i18n/routing";
import {
  Scale,
  Calendar,
  Clock,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export function JudgeEventsView() {
  const { user, activeRole } = useAuth();
  const { data: rawEvents = [], isLoading } = useEvents();
  const [activeTab, setActiveTab] = useState<"all" | "ongoing" | "upcoming" | "past">("all");

  const events = useMemo(() => {
    const list = Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data || [];
    return list;
  }, [rawEvents]);

  // Danh sách sự kiện được phân công cho Giám khảo (Strict Anti-Leak)
  const judgeEvents = useMemo(() => {
    if (!user) return [];
    if (user.isAdmin || user.IsAdmin) return events;

    // Lấy các eventId được phân công cho Judge
    const assignedIds: string[] = [];
    if (Array.isArray((activeRole as any)?.assignedEventIds)) {
      assignedIds.push(...(activeRole as any).assignedEventIds);
    }
    const singleEventId = activeRole?.eventId || (activeRole as any)?.EventId;
    if (singleEventId && !assignedIds.includes(singleEventId)) {
      assignedIds.push(singleEventId);
    }

    // Kiểm tra trong danh sách eventRoles của user nếu có
    const userEventRoles = (user as any)?.eventRoles || (user as any)?.EventRoles || [];
    if (Array.isArray(userEventRoles)) {
      userEventRoles.forEach((er: any) => {
        const rName = er.roleName || er.RoleName;
        const eId = er.eventId || er.EventId;
        if (rName === "Judge" && eId && !assignedIds.includes(eId)) {
          assignedIds.push(eId);
        }
      });
    }

    // Nếu có sự kiện được phân công cụ thể
    if (assignedIds.length > 0) {
      return events.filter((e: any) => assignedIds.includes(e.id || e.Id));
    }

    // Chưa có phân công thật nào: trả về rỗng, không đoán qua email hay gán cứng event ID.
    return [];
  }, [events, user, activeRole]);

  // Phân loại sự kiện theo thời gian thực (Đang diễn ra, Sắp mở, Đã kết thúc)
  const categorizedEvents = useMemo(() => {
    const now = new Date();

    const ongoingList: any[] = [];
    const upcomingList: any[] = [];
    const pastList: any[] = [];

    judgeEvents.forEach((evt: any) => {
      const startDate = evt.startDate || (evt as any).StartDate;
      const endDate = evt.endDate || (evt as any).EndDate;

      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (end && end < now) {
        pastList.push(evt);
      } else if (start && start > now) {
        upcomingList.push(evt);
      } else {
        ongoingList.push(evt);
      }
    });

    return {
      all: judgeEvents,
      ongoing: ongoingList,
      upcoming: upcomingList,
      past: pastList,
    };
  }, [judgeEvents]);

  const displayedEvents = categorizedEvents[activeTab] || [];

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#0c1214] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#080e10] border border-amber-500/40 p-8 text-center glow-box-amber relative space-y-4">
          <div className="corner-accent-tl text-amber-400/60" />
          <div className="corner-accent-tr text-amber-400/60" />
          <div className="corner-accent-bl text-amber-400/60" />
          <div className="corner-accent-br text-amber-400/60" />
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400">
            <Scale className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold uppercase text-amber-300">
            YÊU CẦU QUYỀN GIÁM KHẢO
          </h2>
          <p className="font-mono text-xs text-zinc-400 leading-relaxed">
            Vui lòng đăng nhập với tài khoản Giám khảo để tiếp tục.
          </p>
          <div className="pt-2 flex flex-col gap-2 font-mono text-xs">
            <Link href="/login" className="w-full">
              <button className="w-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold py-2.5 uppercase hover:bg-amber-500 hover:text-black transition-all cursor-pointer">
                Đến trang đăng nhập
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0c1214] text-[#dde4e6] font-sans hex-bg py-8 px-4 md:px-8 selection:bg-amber-500/30 selection:text-amber-200">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Status Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-4 gap-4">
          <div>
            <div className="font-mono text-[11px] text-amber-400 mb-1 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-3.5 h-3.5" />
              <span>BẢNG PHÂN CÔNG SỰ KIỆN GIÁM KHẢO</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase flex items-center gap-3">
              SỰ KIỆN PHÂN CÔNG CHẤM THI
            </h1>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="bg-[#12191c] border border-zinc-800 px-3 py-1.5 text-zinc-300">
              TỔNG PHÂN CÔNG: <span className="text-amber-300 font-bold">{judgeEvents.length}</span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 font-bold uppercase">
              VAI TRÒ: GIÁM KHẢO
            </div>
          </div>
        </div>

        {/* Banner lưu ý bảo mật */}
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3.5 font-mono text-xs flex items-center justify-between rounded">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="font-bold uppercase tracking-wider">
              QUY ĐỊNH CHẤM THI ẨN DANH:
            </span>
            <span className="hidden md:inline text-[11px] text-zinc-300">
              Toàn bộ bài nộp trong các Hạng mục đều được ẩn danh danh tính thí sinh và trường học để đảm bảo tính khách quan.
            </span>
          </div>
          <span className="text-[10px] bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold px-2 py-0.5 uppercase rounded">
            KHÁCH QUAN &amp; BẢO MẬT
          </span>
        </div>

        {/* 4 Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded font-bold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-amber-500 text-black shadow-sm"
                : "bg-[#10171a] border border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            Tất Cả ({categorizedEvents.all.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ongoing")}
            className={`px-4 py-2 rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "ongoing"
                ? "bg-emerald-500 text-black shadow-sm"
                : "bg-[#10171a] border border-zinc-800 text-emerald-400 hover:border-emerald-500/50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Đang Diễn Ra / Cần Chấm ({categorizedEvents.ongoing.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`px-4 py-2 rounded font-bold transition-all cursor-pointer ${
              activeTab === "upcoming"
                ? "bg-cyan-500 text-black shadow-sm"
                : "bg-[#10171a] border border-zinc-800 text-cyan-400 hover:border-cyan-500/50"
            }`}
          >
            Sắp Khởi Tranh ({categorizedEvents.upcoming.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("past")}
            className={`px-4 py-2 rounded font-bold transition-all cursor-pointer ${
              activeTab === "past"
                ? "bg-zinc-700 text-white shadow-sm"
                : "bg-[#10171a] border border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Đã Kết Thúc ({categorizedEvents.past.length})
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 text-center font-mono text-xs text-zinc-500 animate-pulse">
            ĐANG TẢI DỮ LIỆU SỰ KIỆN PHÂN CÔNG...
          </div>
        )}

        {/* Empty State */}
        {!isLoading && displayedEvents.length === 0 && (
          <div className="p-12 bg-[#0c1214] border border-zinc-800 text-center space-y-3 rounded-lg">
            <ShieldAlert className="w-8 h-8 text-amber-400/50 mx-auto" />
            <div className="font-display text-lg text-white uppercase">
              {activeTab === "all"
                ? "Chưa có sự kiện nào được phân công"
                : `Không có sự kiện nào ở trạng thái này`}
            </div>
            <p className="font-mono text-xs text-zinc-500 max-w-md mx-auto">
              {activeTab === "all"
                ? "Bạn chưa được chỉ định làm Giám khảo trong sự kiện nào. Vui lòng liên hệ Ban Tổ Chức (Event Coordinator) để được cấp quyền."
                : "Hiện tại không có sự kiện nào thuộc danh mục đã chọn."}
            </p>
          </div>
        )}

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedEvents.map((evt: any) => {
            const eventId = evt.id || evt.Id || "";
            const eventName = evt.eventName || (evt as any).EventName || evt.name || "Sự kiện Hackathon";
            const season = evt.season || (evt as any).Season || "Season 2026";
            const year = evt.year || (evt as any).Year || new Date().getFullYear();
            const startDate = evt.startDate || (evt as any).StartDate;
            const endDate = evt.endDate || (evt as any).EndDate;

            const now = new Date();
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            const isPast = end && end < now;
            const isUpcoming = start && start > now;
            const isOngoing = !isPast && !isUpcoming;

            return (
              <div
                key={eventId}
                className="bg-[#0e1518] border border-zinc-800 hover:border-amber-500/40 transition-all relative p-5 flex flex-col justify-between group shadow-sm rounded-lg"
              >
                <div className="corner-accent-tl text-amber-400/40" />
                <div className="corner-accent-tr text-amber-400/40" />
                <div className="corner-accent-bl text-amber-400/40" />
                <div className="corner-accent-br text-amber-400/40" />

                <div className="space-y-4">
                  {/* Top Badge & Season */}
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="px-2 py-0.5 bg-[#141c20] border border-zinc-800 text-amber-300 font-bold">
                      {season} // {year}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 font-bold uppercase flex items-center gap-1 rounded ${
                        isOngoing
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : isUpcoming
                          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOngoing
                            ? "bg-emerald-400 animate-pulse"
                            : isUpcoming
                            ? "bg-cyan-400"
                            : "bg-zinc-500"
                        }`}
                      />
                      {isOngoing
                        ? "Đang Diễn Ra / Cần Chấm"
                        : isUpcoming
                        ? "Sắp Khởi Tranh"
                        : "Đã Kết Thúc"}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="font-display text-lg font-bold text-white uppercase group-hover:text-amber-300 transition-colors line-clamp-2">
                      {eventName}
                    </h3>
                    <p className="font-mono text-xs text-zinc-400 mt-1 line-clamp-2">
                      {evt.description || (evt as any).Description || "Sự kiện thi đấu lập trình và đổi mới sáng tạo SEAL."}
                    </p>
                  </div>

                  {/* Timeline */}
                  <div className="bg-[#12191c] p-3 border border-zinc-800 font-mono text-xs space-y-1.5 rounded">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="flex items-center gap-1.5 text-zinc-400">
                        <Calendar className="w-3.5 h-3.5" /> Bắt đầu:
                      </span>
                      <span>{startDate ? new Date(startDate).toLocaleDateString("vi-VN") : "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="flex items-center gap-1.5 text-zinc-400">
                        <Clock className="w-3.5 h-3.5" /> Hạn chót:
                      </span>
                      <span className="text-amber-300 font-bold">
                        {endDate ? new Date(endDate).toLocaleDateString("vi-VN") : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="pt-5 mt-4 border-t border-zinc-800">
                  {isOngoing && (
                    <Link href="/judge/tracks">
                      <button className="w-full py-2.5 bg-amber-500 text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm rounded">
                        <span>Vào Chấm Điểm Hạng Mục</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </Link>
                  )}
                  {isUpcoming && (
                    <Link href={`/events/${eventId}`}>
                      <button className="w-full py-2.5 bg-[#162228] border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs uppercase tracking-wider hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm rounded">
                        <span>Xem Thể Lệ &amp; Tiêu Chí</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </Link>
                  )}
                  {isPast && (
                    <Link href="/judge/tracks">
                      <button className="w-full py-2.5 bg-[#12191c] border border-zinc-700 text-zinc-300 font-mono font-bold text-xs uppercase tracking-wider hover:border-zinc-500 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer rounded">
                        <span>Xem Lại Bảng Điểm Đã Chấm</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

