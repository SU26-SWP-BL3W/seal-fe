"use client";

import React, { useState } from "react";
import { useMyEvents } from "@/repositories/eventsRepository";
import { Download, AlertTriangle, ChevronLeft, ChevronRight, Activity, Filter, ChevronDown } from "lucide-react";

export const CoordinatorCalibrationView: React.FC = () => {
  const { data: eventsList = [] } = useMyEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  React.useEffect(() => {
    if (eventsList.length > 0 && !selectedEventId) {
      setSelectedEventId(eventsList[0].id || eventsList[0].eventId || "");
    }
  }, [eventsList, selectedEventId]);

  const handleExportCsv = () => {
    const csvContent = "TEAM_ALIAS,J-ALPHA,J-BETA,J-GAMMA,J-DELTA,INTER_RATER_DELTA\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Rater_Variance_Matrix_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0a0e10] text-[#e1e7ec] font-sans selection:bg-[#8b5cf6] selection:text-white">
      {/* Main Container */}
      <div className="flex-1 p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        
        {/* Event Selector Filter Bar */}
        <div className="bg-[#13191c] p-4 border border-[#263339] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3 flex-1">
            <Filter className="w-4 h-4 text-[#8b5cf6] shrink-0" />
            <span className="text-[#8b5cf6] font-bold uppercase tracking-wider shrink-0">SỰ KIỆN ĐANG QUẢN LÝ:</span>
            <div className="relative flex-1 max-w-xl">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-semibold cursor-pointer appearance-none focus:outline-none focus:border-[#8b5cf6]"
              >
                {eventsList.length > 0 ? (
                  eventsList.map((ev, idx) => (
                    <option key={ev.id || idx} value={ev.id || ev.eventId}>
                      {ev.eventName || ev.EventName} ({ev.season} {ev.year})
                    </option>
                  ))
                ) : (
                  <option value="">Chưa có sự kiện nào trong hệ thống</option>
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8a9ba8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Title Header Area */}
        <div className="border-b border-[#263339] pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#8b5cf6] font-bold uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4 text-[#8b5cf6]" />
              <span>CHẨN ĐOÁN &amp; PHÂN TÍCH ĐIỂM SỐ</span>
            </div>
            <h1 className="font-mono font-bold text-2xl md:text-3xl text-[#e1e7ec] uppercase tracking-wider">
              PHÒNG PHÂN TÍCH VÀ CHẨN ĐOÁN ĐIỂM SỐ
            </h1>
            <p className="font-sans text-xs text-[#8a9ba8] mt-1">
              Phân tích độ lệch chuẩn điểm số giữa các giám khảo và chẩn đoán dữ liệu chấm điểm.
            </p>
          </div>
        </div>

        {/* 3 Modules Grid (Left: 8 cols, Right: 4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Main Area: Chart & Table (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Module 1: SCORE_DISTRIBUTION (Box Plot Chart Visual) */}
            <div className="bg-[#13191c] border border-[#263339] p-6 space-y-6 relative">
              <div className="flex items-center justify-between border-b border-[#263339] pb-3 font-mono text-xs">
                <div className="font-bold text-[#8b5cf6] tracking-widest uppercase">
                  BIỂU ĐỒ PHÂN BỔ ĐIỂM SỐ THEO GIÁM KHẢO
                </div>
                <div className="text-[#8a9ba8] text-[11px] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                  <span>Ghi nhận live</span>
                </div>
              </div>

              {/* Box Plot Simulation Bars */}
              <div className="h-48 border-b border-l border-[#263339] relative flex items-end justify-around px-8 pt-4">
                
                {/* Horizontal Guide Lines */}
                <div className="absolute top-10 left-0 w-full h-[1px] bg-[#263339]/50 border-t border-dashed border-[#263339]"></div>
                <div className="absolute top-24 left-0 w-full h-[1px] bg-[#263339]/50 border-t border-dashed border-[#263339]"></div>
                <div className="absolute top-36 left-0 w-full h-[1px] bg-[#263339]/50 border-t border-dashed border-[#263339]"></div>

                {/* Bar 1: J-ALPHA */}
                <div className="flex flex-col items-center gap-2 z-10">
                  <div className="w-12 h-28 border border-[#f59e0b] bg-[#f59e0b]/10 relative flex flex-col justify-between items-center py-2">
                    <div className="w-full h-[1px] bg-[#f59e0b]"></div>
                    <div className="w-full h-[2px] bg-[#f59e0b]"></div>
                    <div className="w-full h-[1px] bg-[#f59e0b]"></div>
                  </div>
                  <span className="font-mono text-[11px] text-[#8a9ba8]">J-ALPHA</span>
                </div>

                {/* Bar 2: J-BETA */}
                <div className="flex flex-col items-center gap-2 z-10">
                  <div className="w-12 h-20 border border-[#8b5cf6] bg-[#8b5cf6]/10 relative flex flex-col justify-between items-center py-2">
                    <div className="w-full h-[1px] bg-[#8b5cf6]"></div>
                    <div className="w-full h-[2px] bg-[#8b5cf6]"></div>
                    <div className="w-full h-[1px] bg-[#8b5cf6]"></div>
                  </div>
                  <span className="font-mono text-[11px] text-[#8a9ba8]">J-BETA</span>
                </div>

                {/* Bar 3: J-GAMMA */}
                <div className="flex flex-col items-center gap-2 z-10">
                  <div className="w-12 h-32 border border-[#ec4899] bg-[#ec4899]/10 relative flex flex-col justify-between items-center py-2">
                    <div className="w-full h-[1px] bg-[#ec4899]"></div>
                    <div className="w-full h-[2px] bg-[#ec4899]"></div>
                    <div className="w-full h-[1px] bg-[#ec4899]"></div>
                  </div>
                  <span className="font-mono text-[11px] text-[#8a9ba8]">J-GAMMA</span>
                </div>

                {/* Bar 4: J-DELTA */}
                <div className="flex flex-col items-center gap-2 z-10">
                  <div className="w-12 h-24 border border-[#10b981] bg-[#10b981]/10 relative flex flex-col justify-between items-center py-2">
                    <div className="w-full h-[1px] bg-[#10b981]"></div>
                    <div className="w-full h-[2px] bg-[#10b981]"></div>
                    <div className="w-full h-[1px] bg-[#10b981]"></div>
                  </div>
                  <span className="font-mono text-[11px] text-[#8a9ba8]">J-DELTA</span>
                </div>

              </div>
            </div>

            {/* Module 2: RATER_VARIANCE_MATRIX (Data Table) */}
            <div className="bg-[#13191c] border border-[#263339] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#263339] pb-3">
                <div className="font-mono text-xs font-bold text-[#8b5cf6] tracking-widest uppercase">
                  MA TRẬN LỆCH ĐIỂM ĐỐI SOÁT GIÁM KHẢO
                </div>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-3 py-1 border border-[#263339] text-[#e1e7ec] hover:border-[#8b5cf6] font-mono text-[11px] cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#8b5cf6]" />
                  <span>XUẤT_EXCEL_CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-[#263339] text-[#8a9ba8] tracking-wider text-[11px]">
                      <th className="p-3">MÃ ĐỘI THI</th>
                      <th className="p-3 text-center">J-ALPHA</th>
                      <th className="p-3 text-center">J-BETA</th>
                      <th className="p-3 text-center">J-GAMMA</th>
                      <th className="p-3 text-center">J-DELTA</th>
                      <th className="p-3 text-right pr-4">ĐỘ LỆCH TỐI ĐA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#263339]">
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#8a9ba8]">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Activity className="w-8 h-8 text-[#8a9ba8]/40" />
                          <p className="font-semibold text-sm">Chưa có dữ liệu chẩn đoán đối soát cho sự kiện này</p>
                          <p className="text-xs text-[#8a9ba8]/70">Dữ liệu lệch điểm giữa các giám khảo sẽ tự động xuất hiện khi các bài thi bắt đầu được chấm.</p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Sidebar: AUDIT_LOG_STREAM (4 cols) */}
          <div className="lg:col-span-4 bg-[#13191c] border border-[#263339] p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#263339] pb-3 font-mono text-xs">
                <div className="font-bold text-[#8b5cf6] tracking-widest uppercase">
                  NHẬT KÝ THAO TÁC HỆ THỐNG
                </div>
                <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
              </div>

              {/* Stream List */}
              <div className="space-y-3 font-mono text-xs">
                <div className="p-6 bg-[#0a0e10] border border-[#263339] text-center text-[#8a9ba8]">
                  <p className="text-xs">Chưa ghi nhận nhật ký chấm điểm nào.</p>
                </div>
              </div>
            </div>

            {/* Bottom Stream Pagination */}
            <div className="pt-4 border-t border-[#263339] flex items-center justify-between font-mono text-xs text-[#8a9ba8]">
              <button className="p-1 hover:text-[#8b5cf6] border border-[#263339] disabled:opacity-40" disabled><ChevronLeft className="w-4 h-4" /></button>
              <span>TRANG 0 / 0</span>
              <button className="p-1 hover:text-[#8b5cf6] border border-[#263339] disabled:opacity-40" disabled><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
