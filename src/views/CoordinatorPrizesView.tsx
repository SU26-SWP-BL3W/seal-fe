"use client";

import React, { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useGetPrizesByEvent, useCreatePrize, useUpdatePrize, useDeletePrize, saveStoredPrizesForEvent } from "@/repositories/results/prizesRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { Award, CheckCircle2, AlertCircle, Plus, Trash2, Layers, DollarSign, Save, GripVertical, ArrowUp, ArrowDown, Filter } from "lucide-react";

import apiClient from "@/models/apiClient";
import { useMyEvents } from "@/repositories/eventsRepository";

export interface PrizeItemState {
  id: string;
  prizeName: string;
  quantity: number;
  value: string;
  trackName: string;
}

import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesModal } from "@/components/domain/UnsavedChangesModal";

export const CoordinatorPrizesView: React.FC = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const urlEventId = (searchParams?.get("eventId") as string) || (params?.id as string) || "";
  const { data: eventsList = [] } = useMyEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>(urlEventId);
  const [isDirty, setIsDirty] = useState(false);
  const { showModal, confirmLeave, cancelStay } = useUnsavedChanges(isDirty);

  React.useEffect(() => {
    if (eventsList.length > 0 && !selectedEventId) {
      setSelectedEventId(eventsList[0].id || eventsList[0].eventId || "");
    } else if (urlEventId && urlEventId !== selectedEventId) {
      setSelectedEventId(urlEventId);
    }
  }, [eventsList, urlEventId, selectedEventId]);

  const activeEventId = selectedEventId || urlEventId;
  const { data: dbPrizes = [] } = useGetPrizesByEvent(activeEventId);
  const { data: dbTracks = [] } = useGetTracksByEvent(activeEventId);
  const createPrizeMutation = useCreatePrize();
  const updatePrizeMutation = useUpdatePrize();
  const deletePrizeMutation = useDeletePrize();
  const [deletedPrizeIds, setDeletedPrizeIds] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper function to auto-format numeric string to "X.XXX.XXX" without sticky text suffix
  const formatCurrencyNumber = (val: string): string => {
    if (!val) return "";
    const digits = String(val).replace(/[^0-9]/g, "");
    if (!digits) return "";
    const num = parseInt(digits, 10);
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  // Dynamic tracks list from API
  const tracksList = [
    { id: "all", name: "Toàn Sự Kiện (Chung)" },
    ...dbTracks.map((t: any) => ({
      id: t.id || t.Id || t.trackId,
      name: t.trackName || t.Name || "Hạng mục",
    })),
  ];

  // Editable Prizes State
  const [prizes, setPrizes] = useState<PrizeItemState[]>([]);

  React.useEffect(() => {
    if (Array.isArray(dbPrizes) && dbPrizes.length > 0) {
      const mapped = dbPrizes.map((p: any, idx: number) => {
        const valStr = p.prizeValueVnd
          ? formatCurrencyNumber(String(p.prizeValueVnd))
          : (p.value ? formatCurrencyNumber(String(p.value)) : "1.000.000");

        return {
          id: p.id || p.Id || `prz-${idx}`,
          prizeName: p.prizeName || p.PrizeName || p.name || "Giải thưởng",
          quantity: p.quantity || p.Quantity || 1,
          value: valStr,
          trackName: p.trackName || p.TrackName || "Toàn Sự Kiện (Chung)",
        };
      });
      setPrizes(mapped);
      setDeletedPrizeIds([]);
    }
  }, [activeEventId, dbPrizes]);

  // Handle Add New Editable Prize Row
  const handleAddPrize = () => {
    setIsDirty(true);
    const nextNum = prizes.length + 1;
    setPrizes((prev) => [
      ...prev,
      {
        id: `prz-${Date.now()}`,
        prizeName: `Giải Thưởng Mới ${nextNum}`,
        quantity: 1,
        value: "1.000.000",
        trackName: "Toàn Sự Kiện (Chung)",
      },
    ]);
  };

  // Handle Remove Prize Row
  const handleRemovePrize = (id: string) => {
    if (prizes.length <= 1) return;
    setIsDirty(true);
    if (!id.startsWith("prz-")) {
      setDeletedPrizeIds((prev) => [...prev, id]);
    }
    const updated = prizes.filter((p) => p.id !== id);
    setPrizes(updated);
    if (activeEventId) {
      saveStoredPrizesForEvent(activeEventId, updated);
    }
  };

  // Handle Update Prize Field
  const handleUpdatePrize = (id: string, field: keyof PrizeItemState, value: any) => {
    setIsDirty(true);
    setPrizes((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (field === "value" && typeof value === "string") {
          const formattedVal = formatCurrencyNumber(value);
          return { ...p, [field]: formattedVal };
        }
        return { ...p, [field]: value };
      })
    );
  };

  const [filterTrack, setFilterTrack] = useState<string>("ALL");
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleMoveUp = (idx: number) => {
    if (idx <= 0) return;
    setPrizes((prev) => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[idx - 1];
      next[idx - 1] = temp;
      if (activeEventId) saveStoredPrizesForEvent(activeEventId, next);
      return next;
    });
  };

  const handleMoveDown = (idx: number) => {
    if (idx >= prizes.length - 1) return;
    setPrizes((prev) => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[idx + 1];
      next[idx + 1] = temp;
      if (activeEventId) saveStoredPrizesForEvent(activeEventId, next);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    setPrizes((prev) => {
      const updated = [...prev];
      const [draggedItem] = updated.splice(draggedIdx, 1);
      updated.splice(idx, 0, draggedItem);
      if (activeEventId) saveStoredPrizesForEvent(activeEventId, updated);
      return updated;
    });
    setDraggedIdx(idx);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  // Calculate live total prize budget in VNĐ
  const totalPrizeBudget = prizes.reduce((acc, p) => {
    const numericStr = p.value.replace(/[^0-9]/g, "");
    const val = Number(numericStr) || 0;
    return acc + val * (p.quantity || 1);
  }, 0);

  // Save All Prizes Configuration (Sửa / Xóa / Thêm mới chính xác, không trùng lặp)
  const handleSaveConfig = async () => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      if (activeEventId) {
        // 1. Xóa các giải đã bị bấm xóa trên giao diện
        for (const delId of deletedPrizeIds) {
          try {
            await deletePrizeMutation.mutateAsync(delId);
          } catch (e) {
            console.warn("Delete prize error:", e);
          }
        }
        setDeletedPrizeIds([]);

        // 2. Cập nhật các giải đã có hoặc tạo mới nếu là dòng giải mới thêm
        for (const p of prizes) {
          const isNew = p.id.startsWith("prz-");
          if (isNew) {
            await createPrizeMutation.mutateAsync({
              eventId: activeEventId,
              payload: {
                prizeName: p.prizeName,
                value: p.value,
                quantity: p.quantity,
              },
            });
          } else {
            await updatePrizeMutation.mutateAsync({
              id: p.id,
              payload: {
                prizeName: p.prizeName,
                value: p.value,
                quantity: p.quantity,
              },
            });
          }
        }

        saveStoredPrizesForEvent(activeEventId, prizes);
      }
      setSuccessMessage(`Đã ghi nhận thành công cấu hình ${prizes.length} giải thưởng với Tổng ngân sách ${totalPrizeBudget.toLocaleString("vi-VN")} VNĐ!`);
      setIsDirty(false);
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
        
        {/* Unified Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#263339] pb-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#f59e0b] font-bold uppercase tracking-wider mb-1">
              <Award className="w-4 h-4 text-[#f59e0b]" />
              <span>QUẢN LÝ GIẢI THƯỞNG BAN TỔ CHỨC</span>
            </div>
            <h1 className="font-mono font-bold text-2xl md:text-3xl text-[#e1e7ec] uppercase tracking-wider">
              THIẾT LẬP CƠ CẤU GIẢI THƯỞNG SỰ KIỆN
            </h1>
            <p className="text-xs font-sans text-[#8a9ba8] mt-1.5 leading-relaxed max-w-3xl">
              Cấu hình các giải thưởng, giá trị tiền thưởng (VNĐ) và phân bổ theo từng hạng mục thi đấu cho sự kiện.
            </p>
          </div>

          {/* Header Right Actions: Event Filter Dropdown + Add Button */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-[#13191c] border border-[#263339] px-3 py-2 font-mono text-xs">
              <span className="text-[#8a9ba8] font-bold uppercase text-[11px] shrink-0">Sự kiện:</span>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="bg-transparent text-[#f59e0b] font-bold focus:outline-none cursor-pointer max-w-[220px] truncate"
              >
                {eventsList.length > 0 ? (
                  eventsList.map((ev, idx) => (
                    <option key={ev.id || idx} value={ev.id || ev.eventId} className="bg-[#13191c] text-[#e1e7ec]">
                      {ev.eventName || ev.EventName}
                    </option>
                  ))
                ) : (
                  <option value="" className="bg-[#13191c]">Chưa có sự kiện</option>
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={handleAddPrize}
              className="px-4 py-2 bg-[#f59e0b] hover:bg-amber-400 text-[#0a0e10] font-mono text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-colors shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>THÊM GIẢI THƯỞNG</span>
            </button>
          </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#263339] pb-3">
              <div className="font-bold text-[#f59e0b] tracking-widest uppercase flex items-center gap-2">
                <Award className="w-4 h-4 text-[#f59e0b]" />
                <span>DANH SÁCH GIẢI THƯỞNG VÀ GIÁ TRỊ ({prizes.length} Giải)</span>
              </div>

              {/* Track Filter for Prizes */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[#8a9ba8] font-bold text-[11px] flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-[#f59e0b]" /> LỌC HẠNG MỤC:
                </span>
                <select
                  value={filterTrack}
                  onChange={(e) => setFilterTrack(e.target.value)}
                  className="px-3 py-1 bg-[#0a0e10] border border-[#f59e0b]/40 text-[#f59e0b] font-mono text-xs font-bold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">-- Tất cả Hạng mục --</option>
                  {tracksList.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interactive Editable Table with Drag and Drop Reordering */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#263339] text-[#8a9ba8] tracking-wider text-[11px] bg-[#0a0e10]">
                    <th className="p-3 w-10 text-center">KÉO</th>
                    <th className="p-3 w-12 text-center">STT</th>
                    <th className="p-3">TÊN GIẢI THƯỞNG *</th>
                    <th className="p-3 w-24 text-center">SỐ LƯỢNG</th>
                    <th className="p-3 w-40">GIÁ TRỊ (VNĐ) *</th>
                    <th className="p-3">HẠNG MỤC ÁP DỤNG</th>
                    <th className="p-3 w-20 text-center">THỨ TỰ</th>
                    <th className="p-3 w-12 text-center">XÓA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263339]">
                  {prizes
                    .map((p, originalIdx) => ({ p, originalIdx }))
                    .filter(({ p }) => filterTrack === "ALL" || p.trackName === filterTrack)
                    .map(({ p, originalIdx }, displayIdx) => (
                      <tr
                        key={p.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, originalIdx)}
                        onDragOver={(e) => handleDragOver(e, originalIdx)}
                        onDragEnd={handleDragEnd}
                        className={`hover:bg-[#182024] transition-all ${
                          draggedIdx === originalIdx ? "bg-[#8b5cf6]/20 opacity-50 border-2 border-dashed border-[#8b5cf6]" : ""
                        }`}
                      >
                        {/* Drag Handle */}
                        <td className="p-3 text-center cursor-grab active:cursor-grabbing text-[#8a9ba8] hover:text-[#8b5cf6]">
                          <GripVertical className="w-4 h-4 mx-auto" />
                        </td>

                        <td className="p-3 text-center text-[#8a9ba8] font-bold">0{originalIdx + 1}</td>
                      
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

                      {/* Giá trị VNĐ editable input (Strictly numeric digits only) */}
                      <td className="p-3">
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={p.value}
                            onKeyDown={(e) => {
                              // Allow control keys (Backspace, Delete, arrows, Tab, Ctrl/Cmd shortcuts)
                              if (
                                !/[0-9]/.test(e.key) &&
                                !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"].includes(e.key) &&
                                !e.ctrlKey &&
                                !e.metaKey
                              ) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => handleUpdatePrize(p.id, "value", e.target.value)}
                            placeholder="1.000.000"
                            className="w-full px-3 py-1.5 pr-10 bg-[#0a0e10] border border-[#263339] text-[#f59e0b] font-mono font-bold text-xs focus:outline-none focus:border-[#f59e0b]"
                          />
                          <span className="absolute right-3 text-[10px] font-bold text-[#8a9ba8] pointer-events-none">
                            VNĐ
                          </span>
                        </div>
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

                      {/* Thứ tự Up / Down buttons */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={originalIdx === 0}
                            onClick={() => handleMoveUp(originalIdx)}
                            className="p-1 text-[#8a9ba8] hover:text-[#8b5cf6] disabled:opacity-20 cursor-pointer"
                            title="Di chuyển lên"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={originalIdx === prizes.length - 1}
                            onClick={() => handleMoveDown(originalIdx)}
                            className="p-1 text-[#8a9ba8] hover:text-[#8b5cf6] disabled:opacity-20 cursor-pointer"
                            title="Di chuyển xuống"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
                Tổng ngân sách được tính tự động dựa trên số lượng và giá trị từng giải thưởng.
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
      <UnsavedChangesModal
        isOpen={showModal}
        onConfirmLeave={confirmLeave}
        onCancelStay={cancelStay}
      />
    </div>
  );
};
