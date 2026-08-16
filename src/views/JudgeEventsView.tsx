"use client";

import { useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useEvents } from "@/repositories/eventsRepository";
import { Link } from "@/i18n/routing";
import {
  Scale,
  Calendar,
  Clock,
  ChevronRight,
  ShieldAlert,
  Award,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";

export function JudgeEventsView() {
  const { user, activeRole, loginAsDemoRole } = useAuth();
  const { data: events = [], isLoading } = useEvents();

  // Danh sách sự kiện được phân công cho Giám khảo
  // Nếu là Giám khảo (hoặc Admin), lấy các sự kiện tương ứng
  const judgeEvents = useMemo(() => {
    if (!user) return [];
    if (user.isAdmin || user.IsAdmin) return events;
    const assignedIds = (activeRole as any)?.assignedEventIds || [activeRole?.eventId || activeRole?.EventId];
    if (assignedIds.length > 0 && assignedIds[0]) {
      return events.filter((e) => assignedIds.includes(e.id || (e as any).Id));
    }
    return events;
  }, [events, user, activeRole]);

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
            Vui lòng đăng nhập với tài khoản Giám khảo hoặc chọn nhanh vai trò Demo bên dưới để kiểm tra giao diện:
          </p>
          <div className="pt-2 flex flex-col gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => loginAsDemoRole("Judge")}
              className="w-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold py-2.5 uppercase hover:bg-amber-500 hover:text-black transition-all"
            >
              [ ⚖️ Vào Bằng Tài Khoản Giám Khảo Demo ]
            </button>
            <Link href="/login" className="w-full">
              <button className="w-full border border-zinc-700 text-zinc-300 py-2 uppercase hover:border-amber-500/40 hover:text-amber-200 transition-colors">
                Đến trang đăng nhập thật
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
              <span>// JUDGE_OPERATIONS / ASSIGNED_EVENTS</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase flex items-center gap-3">
              SỰ KIỆN PHÂN CÔNG CHẤM THI
            </h1>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="bg-[#12191c] border border-zinc-800 px-3 py-1.5 text-zinc-300">
              TỔNG SỰ KIỆN: <span className="text-amber-300 font-bold">{judgeEvents.length}</span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 font-bold uppercase">
              VAI TRÒ: GIÁM KHẢO [JUDGE]
            </div>
          </div>
        </div>

        {/* Banner lưu ý bảo mật */}
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3.5 font-mono text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="font-bold uppercase tracking-wider">
              QUY CHUẨN CHẤM ĐIỂM ẨN DANH (BR-12 ACTIVE):
            </span>
            <span className="hidden md:inline text-[11px] text-zinc-300">
              Toàn bộ bài nộp trong các Hạng mục đều được ẩn danh danh tính thí sinh và trường học.
            </span>
          </div>
          <span className="text-[10px] bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold px-2 py-0.5 uppercase">
            BẢO MẬT CAO
          </span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 text-center font-mono text-xs text-zinc-500 animate-pulse">
            ĐANG TẢI DỮ LIỆU SỰ KIỆN PHÂN CÔNG...
          </div>
        )}

        {/* Empty State */}
        {!isLoading && judgeEvents.length === 0 && (
          <div className="p-12 bg-[#0c1214] border border-zinc-800 text-center space-y-3">
            <ShieldAlert className="w-8 h-8 text-amber-400/50 mx-auto" />
            <div className="font-display text-lg text-white uppercase">Chưa có sự kiện nào được phân công</div>
            <p className="font-mono text-xs text-zinc-500 max-w-md mx-auto">
              Bạn chưa được chỉ định làm Giám khảo trong sự kiện nào. Vui lòng liên hệ Ban Tổ Chức (Event Coordinator) để được cấp quyền.
            </p>
          </div>
        )}

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {judgeEvents.map((evt) => {
            const eventId = evt.id || (evt as any).Id || "";
            const eventName = evt.eventName || (evt as any).EventName || evt.name || "Sự kiện Hackathon";
            const season = evt.season || (evt as any).Season || "Season 2026";
            const year = evt.year || (evt as any).Year || new Date().getFullYear();
            const startDate = evt.startDate || (evt as any).StartDate;
            const endDate = evt.endDate || (evt as any).EndDate;

            const isOngoing = !endDate || new Date(endDate) > new Date();

            return (
              <div
                key={eventId}
                className="bg-[#0e1518] border border-zinc-800 hover:border-amber-500/40 transition-all relative p-5 flex flex-col justify-between group shadow-sm"
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
                      className={`px-2 py-0.5 font-bold uppercase flex items-center gap-1 ${
                        isOngoing
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isOngoing ? "bg-emerald-400" : "bg-zinc-500"}`} />
                      {isOngoing ? "ĐANG MỞ CHẤM THI" : "ĐÃ KẾT THÚC"}
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
                  <div className="bg-[#12191c] p-3 border border-zinc-800 font-mono text-xs space-y-1.5">
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

                {/* Bottom CTA */}
                <div className="pt-5 mt-4 border-t border-zinc-800">
                  <Link href={`/judge/tracks`}>
                    <button className="w-full py-2.5 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-600/20 text-amber-300 border border-amber-500/40 font-mono font-bold text-xs uppercase tracking-wider hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                      <span>// TIẾP CẬN HẠNG MỤC CHẤM &gt;</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
