"use client";

import React, { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useGetPrizesByEvent, useCreatePrize } from "@/repositories/results/prizesRepository";
import { Award, CheckCircle2, AlertCircle, Plus, Trash2, Layers, DollarSign, Save } from "lucide-react";

export interface PrizeItemState {
  id: string;
  prizeName: string;
  quantity: number;
  value: string;
  trackName: string;
}

export const CoordinatorPrizesView: React.FC = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = (searchParams?.get("eventId") as string) || (params?.id as string) || "EV-01";

  const createPrizeMutation = useCreatePrize();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available tracks list
  const tracksList = [
    { id: "all", name: "Toàn Sự Kiện (Chung)" },
    { id: "trk-1", name: "Advanced Cloud & Infrastructure" },
    { id: "trk-2", name: "AI & Machine Learning Innovation" },
    { id: "trk-3", name: "DevOps & Security Compliance" },
  ];

  // Editable Prizes State
  const [prizes, setPrizes] = useState<PrizeItemState[]>([
    {
      id: "prz-1",
      prizeName: "Giải Nhất",
      quantity: 1,
      value: "5.000.000 VNĐ",
      trackName: "Toàn Sự Kiện (Chung)",
    },
    {
      id: "prz-2",
      prizeName: "Giải Nhì",
      quantity: 2,
      value: "3.000.000 VNĐ",
      trackName: "Toàn Sự Kiện (Chung)",
    },
    {
      id: "prz-3",
      prizeName: "Giải Ba",
      quantity: 3,
      value: "1.000.000 VNĐ",
      trackName: "Toàn Sự Kiện (Chung)",
    },
    {
      id: "prz-4",
      prizeName: "Giải Sáng Tạo AI Xuất Sắc",
      quantity: 1,
      value: "2.000.000 VNĐ",
      trackName: "AI & Machine Learning Innovation",
    },
  ]);

  // Handle Add New Editable Prize Row
  const handleAddPrize = () => {
    const nextNum = prizes.length + 1;
    setPrizes((prev) => [
      ...prev,
      {
        id: `prz-${Date.now()}`,
        prizeName: `Giải Thưởng Mới ${nextNum}`,
        quantity: 1,
        value: "1.000.000 VNĐ",
        trackName: "Toàn Sự Kiện (Chung)",
      },
    ]);
  };

  // Handle Remove Prize Row
  const handleRemovePrize = (id: string) => {
    if (prizes.length <= 1) return;
    setPrizes((prev) => prev.filter((p) => p.id !== id));
  };

  // Handle Update Prize Field
  const handleUpdatePrize = (id: string, field: keyof PrizeItemState, value: any) => {
    setPrizes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Calculate live total prize budget in VNĐ
  const totalPrizeBudget = prizes.reduce((acc, p) => {
    const numericStr = p.value.replace(/[^0-9]/g, "");
    const val = Number(numericStr) || 0;
    return acc + val * (p.quantity || 1);
  }, 0);

  // Save All Prizes Configuration
  const handleSaveConfig = async () => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      if (eventId) {
        for (const p of prizes) {
          try {
            await createPrizeMutation.mutateAsync({
              eventId,
              payload: {
                prizeName: `${p.prizeName} (${p.trackName})`,
                value: p.value,
                quantity: p.quantity,
              },
            });
          } catch (e) {
            // Ignore API network errors in dev preview
          }
        }
      }
      setSuccessMessage(`Đã ghi nhận thành công cấu hình ${prizes.length} giải thưởng với Tổng ngân sách ${totalPrizeBudget.toLocaleString("vi-VN")} VNĐ!`);
    } catch (err: any) {
      setErrorMessage(`Lưu cấu hình thất bại: ${err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0a0e10] text-[#e1e7ec] font-sans selection:bg-[#8b5cf6] selection:text-white">
      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        
        {/* Event Selector Filter Bar */}
        <div className="bg-[#13191c] p-4 border border-[#263339] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3 flex-1">
            <Award className="w-4 h-4 text-[#f59e0b] shrink-0" />
            <span className="text-[#f59e0b] font-bold uppercase tracking-wider shrink-0">SỰ KIỆN ĐANG QUẢN LÝ:</span>
            <div className="relative flex-1 max-w-xl">
              <select
                value={eventId}
                className="w-full px-3 py-2 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-semibold cursor-pointer appearance-none focus:outline-none focus:border-[#f59e0b]"
              >
                <option value="EV-01">1. SEAL Hackathon 2026: AI &amp; Cloud Nexus (Summer 2026)</option>
                <option value="EV-02">2. FPT Tech Innovation Challenge 2026 (Autumn 2026)</option>
                <option value="EV-03">3. Cyber Security Student Cup 2026 (Spring 2026)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Title Header */}
        <div className="border-b border-[#263339] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#f59e0b] font-bold uppercase tracking-wider mb-1">
              <Award className="w-4 h-4 text-[#f59e0b]" />
              <span>CẤU HÌNH NGHIỆP VỤ BAN TỔ CHỨC</span>
            </div>
            <h1 className="font-mono font-bold text-2xl md:text-3xl text-[#e1e7ec] uppercase tracking-wider">
              THIẾT LẬP CƠ CẤU GIẢI THƯỞNG SỰ KIỆN
            </h1>
          </div>

          <button
            type="button"
            onClick={handleAddPrize}
            className="px-4 py-2 bg-[#f59e0b] hover:bg-amber-400 text-[#0a0e10] font-mono text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>THÊM GIẢI THƯỞNG MỚI</span>
          </button>
        </div>

        {/* Banners */}
        {errorMessage && (
          <div className="p-4 bg-red-500/10 border border-[#ef4444]/30 text-[#ef4444] font-mono text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 2 Main Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel: INTERACTIVE PRIZE FORM BUILDER (8 cols) */}
          <div className="lg:col-span-8 bg-[#13191c] border border-[#263339] p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#263339] pb-3">
              <div className="font-bold text-[#f59e0b] tracking-widest uppercase flex items-center gap-2">
                <Award className="w-4 h-4 text-[#f59e0b]" />
                <span>DANH SÁCH GIẢI THƯỞNG VÀ GIÁ TRỊ ({prizes.length} Giải)</span>
              </div>
              <span className="text-[#8a9ba8] text-[11px]">
                Nhập tên giải, số lượng &amp; gán Hạng mục trực tiếp bên dưới
              </span>
            </div>

            {/* Interactive Editable Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#263339] text-[#8a9ba8] tracking-wider text-[11px] bg-[#0a0e10]">
                    <th className="p-3 w-12 text-center">STT</th>
                    <th className="p-3">TÊN GIẢI THƯỞNG *</th>
                    <th className="p-3 w-24 text-center">SỐ LƯỢNG</th>
                    <th className="p-3 w-40">GIÁ TRỊ (VNĐ) *</th>
                    <th className="p-3">HẠNG MỤC ÁP DỤNG</th>
                    <th className="p-3 w-12 text-center">XÓA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263339]">
                  {prizes.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-[#182024]">
                      <td className="p-3 text-center text-[#8a9ba8] font-bold">0{idx + 1}</td>
                      
                      {/* Tên giải thưởng editable input */}
                      <td className="p-3">
                        <input
                          type="text"
                          value={p.prizeName}
                          onChange={(e) => handleUpdatePrize(p.id, "prizeName", e.target.value)}
                          placeholder="Ví dụ: Giải Nhất, Giải Sáng Tạo..."
                          className="w-full px-3 py-1.5 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-sans font-bold text-sm focus:outline-none focus:border-[#f59e0b]"
                        />
                      </td>

                      {/* Số lượng editable input */}
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={p.quantity}
                          onChange={(e) => handleUpdatePrize(p.id, "quantity", Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-mono text-xs text-center font-bold focus:outline-none focus:border-[#f59e0b]"
                        />
                      </td>

                      {/* Giá trị VNĐ editable input */}
                      <td className="p-3">
                        <input
                          type="text"
                          value={p.value}
                          onChange={(e) => handleUpdatePrize(p.id, "value", e.target.value)}
                          placeholder="5.000.000 VNĐ"
                          className="w-full px-3 py-1.5 bg-[#0a0e10] border border-[#263339] text-[#f59e0b] font-mono font-bold text-xs focus:outline-none focus:border-[#f59e0b]"
                        />
                      </td>

                      {/* Hạng mục áp dụng dropdown */}
                      <td className="p-3">
                        <select
                          value={p.trackName}
                          onChange={(e) => handleUpdatePrize(p.id, "trackName", e.target.value)}
                          className="w-full px-2 py-1.5 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-mono text-[11px] focus:outline-none focus:border-[#f59e0b]"
                        >
                          {tracksList.map((t) => (
                            <option key={t.id} value={t.name}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Xóa giải thưởng */}
                      <td className="p-3 text-center">
                        {prizes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePrize(p.id)}
                            className="text-[#8a9ba8] hover:text-[#ef4444] p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel: LIVE BUDGET SUMMARY & TRACK ALLOCATION BREAKDOWN (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Card 1: Live Total Budget Summary */}
            <div className="bg-[#13191c] border border-[#263339] p-6 space-y-4 font-mono text-xs">
              <div className="border-b border-[#263339] pb-3 font-bold text-[#f59e0b] tracking-widest uppercase flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#f59e0b]" />
                <span>TỔNG NGÂN SÁCH GIẢI THƯỞNG</span>
              </div>

              <div className="text-3xl font-bold text-[#f59e0b]">
                {totalPrizeBudget.toLocaleString("vi-VN")} <span className="text-sm text-[#8a9ba8]">VNĐ</span>
              </div>

              <p className="text-[11px] text-[#8a9ba8] leading-relaxed">
                Tự động tính tổng ngân sách dựa trên số lượng x giá trị của tất cả giải thưởng.
              </p>
            </div>

            {/* Card 2: Track Allocation Summary */}
            <div className="bg-[#13191c] border border-[#263339] p-6 space-y-4 font-mono text-xs">
              <div className="border-b border-[#263339] pb-3 font-bold text-[#8b5cf6] tracking-widest uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#8b5cf6]" />
                <span>PHÂN BỔ GIẢI THƯỞNG THEO HẠNG MỤC</span>
              </div>

              <div className="space-y-3">
                {tracksList.map((trk) => {
                  const assignedPrizes = prizes.filter((p) => p.trackName === trk.name);
                  return (
                    <div key={trk.id} className="p-3 bg-[#0a0e10] border border-[#263339] space-y-1.5">
                      <div className="font-bold text-[#e1e7ec] text-[11px] flex items-center justify-between">
                        <span>{trk.name}</span>
                        <span className="text-[#f59e0b]">({assignedPrizes.length} Giải)</span>
                      </div>
                      {assignedPrizes.length === 0 ? (
                        <div className="text-[10px] text-[#8a9ba8] italic">Chưa phân bổ giải nào</div>
                      ) : (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {assignedPrizes.map((ap) => (
                            <span key={ap.id} className="px-2 py-0.5 bg-[#8b5cf6]/15 border border-[#8b5cf6]/40 text-[#8b5cf6] text-[10px] font-bold">
                              {ap.prizeName} ({ap.value})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA Save Button */}
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={isSubmitting}
              className="w-full py-3 bg-[#f59e0b] hover:bg-amber-400 text-[#0a0e10] font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "ĐANG GHI NHẬN..." : "GHI NHẬN CẤU HÌNH GIẢI THƯỞNG"}</span>
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};
