"use client";

import React from "react";
import { Calendar, Info, FileText, ArrowRight, History } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useCoordinatorEventDetailViewModel } from "@/viewModels/coordinator/useCoordinatorEventDetailViewModel";

export const CoordinatorEventDetailView: React.FC = () => {
  const { state, data } = useCoordinatorEventDetailViewModel();

  const {
    eventId,
    eventName,
    season,
    year,
    startDate,
    endDate,
    description,
    status,
    isLoadingEvent,
    isLoadingLogs,
  } = state;

  const { auditLogs } = data;

  if (isLoadingEvent) {
    return (
      <div className="min-h-screen bg-[#0a0e10] flex items-center justify-center p-8 text-[#8b5cf6] font-mono text-xs">
        Đang tải dữ liệu bản ghi sự kiện...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0a0e10] text-[#e1e7ec] font-sans selection:bg-[#8b5cf6] selection:text-white">
      {/* Main Container */}
      <div className="flex-1 p-6 space-y-6 max-w-[1400px] w-full mx-auto">
        
        {/* Breadcrumb */}
        <div className="font-mono text-xs text-[#8a9ba8] flex items-center gap-2">
          <Link href="/coordinator/dashboard" className="hover:text-[#8b5cf6]">Hệ thống</Link>
          <span>&gt;</span>
          <Link href="/coordinator/dashboard" className="hover:text-[#8b5cf6]">Sự kiện</Link>
          <span>&gt;</span>
          <span className="text-[#8b5cf6] font-bold">Chi tiết</span>
        </div>

        {/* Title & Status Badge */}
        <div className="border-b border-[#263339] pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-7 h-7 text-[#8b5cf6]" />
            <h1 className="font-mono font-bold text-2xl md:text-3xl text-[#e1e7ec] uppercase tracking-wider">
              CHI TIẾT SỰ KIỆN PHỤ TRÁCH
            </h1>
          </div>

          <div className="font-mono text-xs border border-[#8b5cf6]/40 bg-[#8b5cf6]/10 text-[#8b5cf6] px-3 py-1 font-bold uppercase">
            [ TRẠNG THÁI: {status ? "ĐÃ CÔNG BỐ" : "BẢN NHÁP"} ]
          </div>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left Column: CORE INFORMATION */}
          <div className="bg-[#13191c] border border-[#263339] p-6 space-y-5 relative">
            <div className="flex items-center justify-between border-b border-[#263339] pb-3 text-[#8a9ba8] font-mono text-xs font-bold tracking-widest uppercase">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#8b5cf6]" />
                <span>THÔNG TIN CƠ BẢN SỰ KIỆN</span>
              </div>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-[#8a9ba8] tracking-wider block uppercase text-[11px]">
                  Tên sự kiện
                </label>
                <div className="w-full px-4 py-2.5 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-sans font-bold text-base">
                  {eventName}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#8a9ba8] tracking-wider block uppercase text-[11px]">
                    Mùa giải
                  </label>
                  <div className="w-full px-4 py-2.5 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-sans text-sm font-semibold">
                    {season}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[#8a9ba8] tracking-wider block uppercase text-[11px]">
                    Năm tổ chức
                  </label>
                  <div className="w-full px-4 py-2.5 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-mono text-sm font-semibold">
                    {year}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#8a9ba8] tracking-wider block uppercase text-[11px]">
                    Ngày bắt đầu
                  </label>
                  <div className="w-full px-4 py-2.5 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-mono text-sm">
                    {startDate}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[#8a9ba8] tracking-wider block uppercase text-[11px]">
                    Ngày kết thúc
                  </label>
                  <div className="w-full px-4 py-2.5 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-mono text-sm">
                    {endDate}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: EXTENDED DETAILS & WIZARD LAUNCHER */}
          <div className="bg-[#13191c] border border-[#263339] p-6 flex flex-col justify-between space-y-5 relative">
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-[#263339] pb-3 text-[#8a9ba8] font-mono text-xs font-bold tracking-widest uppercase">
                <FileText className="w-4 h-4 text-[#8b5cf6]" />
                <span>MÔ TẢ VÀ THỂ LỆ SỰ KIỆN</span>
              </div>

              <div className="space-y-1 font-mono text-xs">
                <label className="text-[#8a9ba8] tracking-wider block uppercase text-[11px]">
                  Mô tả chi tiết
                </label>
                <div className="w-full p-4 bg-[#0a0e10] border border-[#263339] text-[#8a9ba8] font-sans text-sm leading-relaxed min-h-[140px]">
                  {description || "Chưa có mô tả chi tiết."}
                </div>
              </div>
            </div>

            {/* CTA Button: OPEN EVENT CONFIG WIZARD */}
            <div className="pt-4 flex justify-end">
              <Link href={eventId ? `/coordinator/events/new?eventId=${eventId}` : "/coordinator/events/new"}>
                <button
                  type="button"
                  className="px-6 py-3 bg-[#8b5cf6] hover:bg-purple-600 text-white font-mono font-bold text-xs uppercase flex items-center gap-2 cursor-pointer transition-colors shadow-lg"
                >
                  <span>CẤU HÌNH VÒNG THI &amp; HẠNG MỤC</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>

        </div>

        {/* Nhật ký hoạt động (Audit Log) */}
        <div className="bg-[#13191c] border border-[#263339] p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#263339] pb-3 text-[#8a9ba8] font-mono text-xs font-bold tracking-widest uppercase">
            <History className="w-4 h-4 text-[#8b5cf6]" />
            <span>NHẬT KÝ THAO TÁC NHẠY CẢM ({auditLogs.length})</span>
          </div>

          {isLoadingLogs ? (
            <div className="font-mono text-xs text-[#8a9ba8] py-6 text-center">Đang tải nhật ký...</div>
          ) : auditLogs.length === 0 ? (
            <div className="font-mono text-xs text-[#8a9ba8] py-6 text-center">
              Chưa có thao tác nhạy cảm nào được ghi nhận cho sự kiện này.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="text-[#8a9ba8] uppercase text-[10px] border-b border-[#263339]">
                    <th className="text-left py-2 pr-4">Thời gian</th>
                    <th className="text-left py-2 pr-4">Người thực hiện</th>
                    <th className="text-left py-2 pr-4">Hành động</th>
                    <th className="text-left py-2">Nội dung</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log: any) => (
                    <tr key={log.id} className="border-b border-[#263339]/50">
                      <td className="py-2 pr-4 text-[#8a9ba8] whitespace-nowrap">
                        {new Date(log.createdTime).toLocaleString("vi-VN")}
                      </td>
                      <td className="py-2 pr-4 text-[#e1e7ec]">{log.actorName || log.actorUserId}</td>
                      <td className="py-2 pr-4">
                        <span className="px-2 py-0.5 bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/30 text-[10px] uppercase font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2 text-[#8a9ba8]">{log.summary || `${log.entityType} #${log.entityId}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
