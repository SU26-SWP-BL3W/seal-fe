"use client";

import React, { useState } from "react";
import { useMyEvents } from "@/repositories/eventsRepository";
import { Download, AlertTriangle, ChevronLeft, ChevronRight, Activity, Filter, ChevronDown } from "lucide-react";

export const CoordinatorCalibrationView: React.FC = () => {
  const { data: eventsList = [] } = useMyEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>("EV-01");

  const handleExportCsv = () => {
    const csvContent = "TEAM_ALIAS,J-ALPHA,J-BETA,J-GAMMA,J-DELTA,INTER_RATER_DELTA\nT-884,8.5,8.2,8.8,8.4,0.6\nT-901,9.0,6.5,9.2,8.9,2.7\nT-214,7.1,7.3,7.0,7.4,0.4\nT-555,6.0,5.8,6.2,6.1,0.4";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `RBL_Rater_Variance_Matrix_${Date.now()}.csv`);
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
                  <>
                    <option value="EV-01">1. SEAL Hackathon 2026: AI &amp; Cloud Nexus (Summer 2026)</option>
                    <option value="EV-02">2. FPT Tech Innovation Challenge 2026 (Autumn 2026)</option>
                    <option value="EV-03">3. Cyber Security Student Cup 2026 (Spring 2026)</option>
                  </>
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
              <span>CHẨN ĐOÁN &amp; PHÂN TÍCH RBL</span>
            </div>
            <h1 className="font-mono font-bold text-2xl md:text-3xl text-[#e1e7ec] uppercase tracking-wider">
              PHÒNG PHÂN TÍCH VÀ CHẨN ĐOÁN RBL
            </h1>
            <p className="font-sans text-xs text-[#8a9ba8] mt-1">
              Phân tích độ lệch chuẩn điểm số giữa các giám khảo và chẩn đoán dữ liệu chấm điểm (Rubric-Based Leveling Diagnostics).
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
                    {/* Row 1: T-884 */}
                    <tr className="hover:bg-[#182024]">
                      <td className="p-3 font-bold text-[#8b5cf6]">T-884</td>
                      <td className="p-3 text-center">8.5</td>
                      <td className="p-3 text-center">8.2</td>
                      <td className="p-3 text-center">8.8</td>
                      <td className="p-3 text-center">8.4</td>
                      <td className="p-3 text-right pr-4 font-bold text-[#e1e7ec]">0.6</td>
                    </tr>

                    {/* Row 2: T-901 (Variance Anomaly > 2.0 Warning) */}
                    <tr className="bg-red-500/5 hover:bg-red-500/10">
                      <td className="p-3 font-bold text-[#8b5cf6]">T-901</td>
                      <td className="p-3 text-center">9.0</td>
                      <td className="p-3 text-center font-bold text-[#f59e0b]">6.5</td>
                      <td className="p-3 text-center">9.2</td>
                      <td className="p-3 text-center">8.9</td>
                      <td className="p-3 text-right pr-4 font-bold text-[#ef4444] flex items-center justify-end gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>2.7</span>
                      </td>
                    </tr>

                    {/* Row 3: T-214 */}
                    <tr className="hover:bg-[#182024]">
                      <td className="p-3 font-bold text-[#8b5cf6]">T-214</td>
                      <td className="p-3 text-center">7.1</td>
                      <td className="p-3 text-center">7.3</td>
                      <td className="p-3 text-center">7.0</td>
                      <td className="p-3 text-center">7.4</td>
                      <td className="p-3 text-right pr-4 font-bold text-[#e1e7ec]">0.4</td>
                    </tr>

                    {/* Row 4: T-555 */}
                    <tr className="hover:bg-[#182024]">
                      <td className="p-3 font-bold text-[#8b5cf6]">T-555</td>
                      <td className="p-3 text-center">6.0</td>
                      <td className="p-3 text-center">5.8</td>
                      <td className="p-3 text-center">6.2</td>
                      <td className="p-3 text-center">6.1</td>
                      <td className="p-3 text-right pr-4 font-bold text-[#e1e7ec]">0.4</td>
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
                {/* Log Item 1 */}
                <div className="p-3 bg-[#0a0e10] border border-[#263339] space-y-1">
                  <div className="flex justify-between text-[11px] text-[#8a9ba8]">
                    <span>14:01:22 UTC</span>
                    <span className="text-[#e1e7ec]">GIÁM KHẢO BETA</span>
                  </div>
                  <div className="text-[#10b981] font-bold">Nộp Điểm Thành Công</div>
                  <div className="text-[11px] text-[#8a9ba8]/80">Cập nhật điểm cho T-901</div>
                </div>

                {/* Log Item 2 */}
                <div className="p-3 bg-amber-500/10 border border-[#f59e0b]/30 space-y-1">
                  <div className="flex justify-between text-[11px] text-[#8a9ba8]">
                    <span>13:58:40 UTC</span>
                    <span className="text-[#f59e0b] font-bold">HỆ THỐNG TỰ ĐỘNG</span>
                  </div>
                  <div className="text-[#f59e0b] font-bold">Bật Cảnh Báo Lệch Điểm</div>
                  <div className="text-[11px] text-[#f59e0b]/90">Phát hiện độ lệch &gt; 2.0 tại đội T-901</div>
                </div>

                {/* Log Item 3 */}
                <div className="p-3 bg-[#0a0e10] border border-[#263339] space-y-1">
                  <div className="flex justify-between text-[11px] text-[#8a9ba8]">
                    <span>13:55:10 UTC</span>
                    <span className="text-[#e1e7ec]">GIÁM KHẢO GAMMA</span>
                  </div>
                  <div className="text-[#e1e7ec] font-bold">Bắt Đầu Phiên Chấm</div>
                  <div className="text-[11px] text-[#8a9ba8]/80">Xác thực thành công qua Token</div>
                </div>

                {/* Log Item 4 */}
                <div className="p-3 bg-[#0a0e10] border border-[#263339] space-y-1">
                  <div className="flex justify-between text-[11px] text-[#8a9ba8]">
                    <span>13:42:05 UTC</span>
                    <span className="text-[#e1e7ec]">GIÁM KHẢO ALPHA</span>
                  </div>
                  <div className="text-[#10b981] font-bold">Nộp Điểm Hàng Loạt</div>
                  <div className="text-[11px] text-[#8a9ba8]/80">Hoàn tất chấm: T-884, T-214</div>
                </div>
              </div>
            </div>

            {/* Bottom Stream Pagination */}
            <div className="pt-4 border-t border-[#263339] flex items-center justify-between font-mono text-xs text-[#8a9ba8]">
              <button className="p-1 hover:text-[#8b5cf6] border border-[#263339]"><ChevronLeft className="w-4 h-4" /></button>
              <span>TRANG 01 / 42</span>
              <button className="p-1 hover:text-[#8b5cf6] border border-[#263339]"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
