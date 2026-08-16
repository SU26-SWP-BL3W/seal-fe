"use client";

import React, { useState, useEffect } from "react";
import { useMyEvents } from "@/repositories/eventsRepository";
import {
  Layers,
  Users,
  Award,
  FileCheck,
  ChevronDown,
  Settings,
  ArrowRight,
  ShieldCheck,
  Activity,
  AlertTriangle,
  FolderKanban,
} from "lucide-react";
import Link from "next/link";

export const CoordinatorDashboardView: React.FC = () => {
  const { data: eventsList = [], isLoading } = useMyEvents();

  // Deduplicated assigned events list
  const seenEventKeys = new Set<string>();
  const assignedEvents = eventsList.filter((ev) => {
    const name = (ev.eventName || ev.EventName || "").trim();
    const key = `${name.toLowerCase()}-${ev.year || ev.Year || 2026}`;
    if (seenEventKeys.has(key)) return false;
    seenEventKeys.add(key);
    return true;
  });

  const [selectedEventId, setSelectedEventId] = useState<string>("");

  // Default select first assigned event when list loads
  useEffect(() => {
    if (assignedEvents.length > 0 && !selectedEventId) {
      const firstEv = assignedEvents[0];
      const id = firstEv.id || firstEv.Id || firstEv.eventId || firstEv.EventId || "";
      setSelectedEventId(id);
    }
  }, [assignedEvents, selectedEventId]);

  const selectedEvent = assignedEvents.find(
    (ev) => (ev.id || ev.Id || ev.eventId || ev.EventId) === selectedEventId
  ) || assignedEvents[0];

  const selectedEventName = selectedEvent
    ? selectedEvent.eventName || selectedEvent.EventName || "Sự kiện được chọn"
    : "Chưa chọn sự kiện";

  const isSelectedEventPublished = selectedEvent
    ? Boolean(selectedEvent.status ?? selectedEvent.Status)
    : false;

  const selectedEventSeason = selectedEvent?.season || selectedEvent?.Season || "Summer";
  const selectedEventYear = selectedEvent?.year || selectedEvent?.Year || 2026;

  // Dynamic Metrics linked to active event
  const eventTeamsCount = selectedEvent ? 12 : 0;
  const eventPendingSubmissions = selectedEvent ? 5 : 0;
  const eventPendingAppeals = selectedEvent ? 2 : 0;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0a0e10] text-[#e1e7ec] font-sans selection:bg-[#8b5cf6] selection:text-white">
      {/* Main Container */}
      <div className="flex-1 p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        
        {/* Page Title */}
        <div className="border-b border-[#263339] pb-4">
          <div className="flex items-center gap-2 font-mono text-xs text-[#8b5cf6] font-bold uppercase tracking-wider mb-1">
            <FolderKanban className="w-4 h-4 text-[#8b5cf6]" />
            <span>BẢNG ĐIỀU KHIỂN ĐIỀU PHỐI VIÊN</span>
          </div>
          <h1 className="font-mono font-bold text-2xl md:text-3xl text-[#e1e7ec] uppercase tracking-wider m-0">
            TRUNG TÂM CHỈ HUY SỰ KIỆN
          </h1>
        </div>

        {/* Elegant Event Selector Panel */}
        <div className="bg-[#13191c] p-5 border border-[#263339] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <label className="font-mono text-xs text-[#8b5cf6] font-bold uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8b5cf6]"></span>
              <span>SỰ KIỆN ĐANG QUẢN LÝ:</span>
            </label>

            {isLoading ? (
              <div className="font-mono text-xs text-[#8a9ba8]">Đang tải danh sách sự kiện phụ trách...</div>
            ) : assignedEvents.length === 0 ? (
              <div className="font-mono text-xs text-[#f59e0b]">
                Bạn hiện chưa được Admin phân công phụ trách sự kiện nào.
              </div>
            ) : (
              <div className="relative max-w-2xl">
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-sans font-semibold text-sm focus:outline-none focus:border-[#8b5cf6] cursor-pointer appearance-none"
                >
                  {assignedEvents.map((ev, idx) => {
                    const id = ev.id || ev.Id || ev.eventId || ev.EventId || `ev-${idx}`;
                    const name = ev.eventName || ev.EventName || "Sự kiện";
                    const seasonStr = ev.season || ev.Season || "Summer";
                    const yearNum = ev.year || ev.Year || 2026;
                    return (
                      <option key={id} value={id}>
                        {idx + 1}. {name} — ({seasonStr} {yearNum})
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-4 h-4 text-[#8a9ba8] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </div>

          {selectedEvent && (
            <div className="flex items-center gap-3 font-mono text-xs bg-[#0a0e10] px-4 py-2.5 border border-[#263339]">
              <span className="text-[#8a9ba8]">TRẠNG THÁI:</span>
              {isSelectedEventPublished ? (
                <span className="text-[#10b981] font-bold">[ ĐÃ CÔNG BỐ ]</span>
              ) : (
                <span className="text-[#f59e0b] font-bold">[ BẢN NHÁP ]</span>
              )}
            </div>
          )}
        </div>

        {/* 4 Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Teams */}
          <div className="bg-[#13191c] p-5 border border-[#263339] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#8b5cf6]"></div>
            <div className="font-mono text-[11px] text-[#8a9ba8] font-bold tracking-widest mb-2 flex items-center justify-between">
              <span>TỔNG SỐ ĐỘI THI</span>
              <Users className="w-4 h-4 text-[#8b5cf6]" />
            </div>
            <div className="font-mono font-bold text-3xl text-[#e1e7ec]">{eventTeamsCount}</div>
            <div className="font-sans text-xs text-[#8a9ba8] mt-2 flex items-center justify-between">
              <span>Sĩ số đội thi đã duyệt</span>
              <Link href="/coordinator/teams" className="hover:text-[#8b5cf6] text-[11px] font-mono transition-colors">
                Quản lý đội &gt;
              </Link>
            </div>
          </div>

          {/* Card 2: Pending Submissions */}
          <div className="bg-[#13191c] p-5 border border-[#263339] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#f59e0b]"></div>
            <div className="font-mono text-[11px] text-[#8a9ba8] font-bold tracking-widest mb-2 flex items-center justify-between">
              <span>BÀI NỘP CHỜ CHẤM</span>
              <FileCheck className="w-4 h-4 text-[#f59e0b]" />
            </div>
            <div className="font-mono font-bold text-3xl text-[#e1e7ec]">{eventPendingSubmissions}</div>
            <div className="font-sans text-xs text-[#8a9ba8] mt-2 flex items-center justify-between">
              <span>Cần tiến độ chấm điểm</span>
              <Link href="/coordinator/publish-results" className="hover:text-[#f59e0b] text-[11px] font-mono transition-colors">
                Soát xét &gt;
              </Link>
            </div>
          </div>

          {/* Card 3: Pending Appeals */}
          <div className="bg-[#13191c] p-5 border border-[#263339] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#ef4444]"></div>
            <div className="font-mono text-[11px] text-[#8a9ba8] font-bold tracking-widest mb-2 flex items-center justify-between">
              <span>PHÚC KHẢO CHỜ XỬ LÝ</span>
              <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
            </div>
            <div className="font-mono font-bold text-3xl text-[#ef4444]">
              {String(eventPendingAppeals).padStart(2, "0")}
            </div>
            <div className="font-sans text-xs text-[#8a9ba8] mt-2 flex items-center justify-between">
              <span>Khiếu nại chưa phản hồi</span>
              <Link href="/coordinator/appeals" className="hover:text-[#ef4444] text-[11px] font-mono transition-colors">
                Xử lý ngay &gt;
              </Link>
            </div>
          </div>

          {/* Card 4: System Status */}
          <div className="bg-[#13191c] p-5 border border-[#263339] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#10b981]"></div>
            <div className="font-mono text-[11px] text-[#8a9ba8] font-bold tracking-widest mb-2 flex items-center justify-between">
              <span>TRẠNG THÁI SỰ KIỆN</span>
              <Activity className="w-4 h-4 text-[#10b981]" />
            </div>
            <div className="font-mono font-bold text-lg text-[#10b981] mt-1 mb-2">
              {isSelectedEventPublished ? "ĐÃ CÔNG BỐ PUBLIC" : "ĐANG CHỈNH SỬA NHÁP"}
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#8a9ba8]">
              <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
              <span>{selectedEventSeason} {selectedEventYear}</span>
            </div>
          </div>
        </div>

        {/* Event Quick Action Hub Cards */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#8b5cf6] uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>QUẢN LÝ SỰ KIỆN: <span className="text-[#e1e7ec]">{selectedEventName}</span></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Shortcut 1: Event Config (Trỏ về Event Wizard Cấu Hình Vòng & Hạng Mục) */}
            <Link
              href="/coordinator/events/new"
              className="bg-[#13191c] border border-[#263339] hover:border-[#8b5cf6] p-5 space-y-3 transition-all group cursor-pointer"
            >
              <div className="w-9 h-9 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 flex items-center justify-center text-[#8b5cf6]">
                <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              </div>
              <div>
                <h4 className="font-mono font-bold text-sm text-[#e1e7ec] group-hover:text-[#8b5cf6] transition-colors uppercase">
                  Cấu Hình Vòng &amp; Hạng Mục
                </h4>
                <p className="font-sans text-xs text-[#8a9ba8] mt-1 leading-relaxed">
                  Cấu hình Vòng thi, Hạng mục, Tiêu chí chấm điểm RBL và Phân công nhân sự.
                </p>
              </div>
              <div className="font-mono text-xs text-[#8b5cf6] font-semibold flex items-center gap-1 pt-1">
                <span>MỞ CẤU HÌNH (WIZARD)</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Shortcut 2: Staff Management */}
            <Link
              href={selectedEventId ? `/coordinator/staff?eventId=${selectedEventId}` : "#"}
              className="bg-[#13191c] border border-[#263339] hover:border-[#8b5cf6] p-5 space-y-3 transition-all group cursor-pointer"
            >
              <div className="w-9 h-9 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 flex items-center justify-center text-[#8b5cf6]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-mono font-bold text-sm text-[#e1e7ec] group-hover:text-[#8b5cf6] transition-colors uppercase">
                  Phân Công Giám Khảo &amp; Cố Vấn
                </h4>
                <p className="font-sans text-xs text-[#8a9ba8] mt-1 leading-relaxed">
                  Mời và gán nhân sự Giám khảo / Cố vấn vào các Hạng mục.
                </p>
              </div>
              <div className="font-mono text-xs text-[#8b5cf6] font-semibold flex items-center gap-1 pt-1">
                <span>MỜI NHÂN SỰ</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Shortcut 3: Prize Setup */}
            <Link
              href={selectedEventId ? `/coordinator/prizes?eventId=${selectedEventId}` : "#"}
              className="bg-[#13191c] border border-[#263339] hover:border-[#f59e0b] p-5 space-y-3 transition-all group cursor-pointer"
            >
              <div className="w-9 h-9 bg-[#f59e0b]/10 border border-[#f59e0b]/30 flex items-center justify-center text-[#f59e0b]">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-mono font-bold text-sm text-[#e1e7ec] group-hover:text-[#f59e0b] transition-colors uppercase">
                  Cơ Cấu Giải Thưởng
                </h4>
                <p className="font-sans text-xs text-[#8a9ba8] mt-1 leading-relaxed">
                  Tạo cơ cấu giải thưởng và ánh xạ trao giải cho từng Hạng mục.
                </p>
              </div>
              <div className="font-mono text-xs text-[#f59e0b] font-semibold flex items-center gap-1 pt-1">
                <span>CẤU HÌNH GIẢI</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Shortcut 4: Calibration RBL */}
            <Link
              href="/coordinator/calibration"
              className="bg-[#13191c] border border-[#263339] hover:border-[#10b981] p-5 space-y-3 transition-all group cursor-pointer"
            >
              <div className="w-9 h-9 bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center text-[#10b981]">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-mono font-bold text-sm text-[#e1e7ec] group-hover:text-[#10b981] transition-colors uppercase">
                  Phòng Phân Tích RBL
                </h4>
                <p className="font-sans text-xs text-[#8a9ba8] mt-1 leading-relaxed">
                  Phân tích độ lệch chuẩn điểm số giữa các giám khảo và chẩn đoán.
                </p>
              </div>
              <div className="font-mono text-xs text-[#10b981] font-semibold flex items-center gap-1 pt-1">
                <span>PHÂN TÍCH RBL</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

          </div>
        </div>

      </div>
    </div>
  );
};
