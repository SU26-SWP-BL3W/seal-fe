"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  useGetPrizesByEvent,
  useCreatePrize,
  useUpdatePrize,
  useDeletePrize,
  type Prize,
} from "@/repositories/results/prizesRepository";
import { useMyEvents } from "@/repositories/eventsRepository";
import { Award, CheckCircle2, AlertCircle, Plus, Trash2, DollarSign, Save, ChevronDown } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/ui/Pagination";

interface DraftPrize {
  id: string;
  isNew: boolean;
  prizeName: string;
  quantity: number;
  value: string;
}

const toDraft = (p: Prize): DraftPrize => ({
  id: p.id || (p as any).Id || "",
  isNew: false,
  prizeName: p.prizeName || (p as any).PrizeName || "",
  quantity: p.quantity || (p as any).Quantity || 1,
  value: p.value || (p as any).Value || "",
});

export const CoordinatorPrizesView: React.FC = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: eventsList = [] } = useMyEvents();

  const [selectedEventId, setSelectedEventId] = useState<string>(
    (searchParams?.get("eventId") as string) || (params?.id as string) || ""
  );
  const eventId =
    selectedEventId ||
    (eventsList[0]
      ? String((eventsList[0] as any).id || (eventsList[0] as any).Id || (eventsList[0] as any).eventId || (eventsList[0] as any).EventId || "")
      : "");

  const { data: serverPrizes = [], isLoading: isLoadingPrizes } = useGetPrizesByEvent(eventId);
  const createPrizeMutation = useCreatePrize();
  const updatePrizeMutation = useUpdatePrize();
  const deletePrizeMutation = useDeletePrize();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [prizes, setPrizes] = useState<DraftPrize[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  useEffect(() => {
    setPrizes((serverPrizes as Prize[]).map(toDraft));
    setRemovedIds([]);
  }, [serverPrizes]);

  const handleAddPrize = () => {
    setPrizes((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, isNew: true, prizeName: "", quantity: 1, value: "" },
    ]);
  };

  const handleRemovePrize = (id: string, isNew?: boolean) => {
    setPrizes((prev) => prev.filter((p) => p.id !== id));
    if (!isNew) {
      setRemovedIds((prev) => [...prev, id]);
    }
  };

  const handleUpdatePrize = (id: string, field: keyof DraftPrize, value: any) => {
    setPrizes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const prizeEntries = useMemo(() => {
    return prizes.map((p, originalIdx) => ({ p, originalIdx }));
  }, [prizes]);

  const {
    paginatedItems: paginatedPrizeEntries,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setCurrentPage,
    setPageSize,
  } = usePagination(prizeEntries, 5);

  const totalPrizeBudget = prizes.reduce((acc, p) => {
    const val = Number(p.value.replace(/[^0-9]/g, "")) || 0;
    return acc + val * (p.quantity || 1);
  }, 0);

  const handleSaveConfig = async () => {
    if (!eventId) return;
    const invalid = prizes.some((p) => !p.prizeName.trim() || !p.value.trim());
    if (invalid) {
      setErrorMessage("Vui lòng nhập đầy đủ Tên giải thưởng và Giá trị cho tất cả các dòng.");
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      for (const id of removedIds) {
        await deletePrizeMutation.mutateAsync(id);
      }
      for (const p of prizes) {
        const payload = { prizeName: p.prizeName.trim(), value: p.value.trim(), quantity: p.quantity };
        if (p.isNew) {
          await createPrizeMutation.mutateAsync({ eventId, payload });
        } else {
          await updatePrizeMutation.mutateAsync({ id: p.id, payload });
        }

        saveStoredPrizesForEvent(activeEventId, prizes);
      }
      setRemovedIds([]);
      setSuccessMessage(`Đã lưu thành công ${prizes.length} giải thưởng — Tổng ngân sách ${totalPrizeBudget.toLocaleString("vi-VN")} VNĐ.`);
    } catch (err: any) {
      setErrorMessage(`Lưu cấu hình thất bại: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0a0e10] text-[#e1e7ec] font-sans selection:bg-[#8b5cf6] selection:text-white">
      <div className="flex-1 p-6 space-y-6 max-w-[1600px] w-full mx-auto">

        {/* Event Selector Filter Bar */}
        <div className="bg-[#13191c] p-4 border border-[#263339] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3 flex-1">
            <Award className="w-4 h-4 text-[#f59e0b] shrink-0" />
            <span className="text-[#f59e0b] font-bold uppercase tracking-wider shrink-0">SỰ KIỆN ĐANG QUẢN LÝ:</span>
            <div className="relative flex-1 max-w-xl">
              <select
                value={eventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-semibold cursor-pointer appearance-none focus:outline-none focus:border-[#f59e0b]"
              >
                <option value="">-- Chọn sự kiện --</option>
                {eventsList.map((ev: any, idx: number) => {
                  const id = ev.id || ev.Id || ev.eventId || ev.EventId || `ev-${idx}`;
                  return (
                    <option key={id} value={id}>
                      {ev.eventName || ev.EventName} ({ev.season || ev.Season} {ev.year || ev.Year})
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8a9ba8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
            disabled={!eventId}
            className="px-4 py-2 bg-[#f59e0b] hover:bg-amber-400 text-[#0a0e10] font-mono text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
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

          {/* Left Panel: Prize table (8 cols) */}
          <div className="lg:col-span-8 bg-[#13191c] border border-[#263339] p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#263339] pb-3">
              <div className="font-bold text-[#f59e0b] tracking-widest uppercase flex items-center gap-2">
                <Award className="w-4 h-4 text-[#f59e0b]" />
                <span>DANH SÁCH GIẢI THƯỞNG VÀ GIÁ TRỊ ({prizes.length} Giải)</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#263339] text-[#8a9ba8] tracking-wider text-[11px] bg-[#0a0e10]">
                    <th className="p-3 w-12 text-center">STT</th>
                    <th className="p-3">TÊN GIẢI THƯỞNG *</th>
                    <th className="p-3 w-24 text-center">SỐ LƯỢNG</th>
                    <th className="p-3 w-48">GIÁ TRỊ *</th>
                    <th className="p-3 w-12 text-center">XÓA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263339]">
                  {isLoadingPrizes ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#8a9ba8]">
                        Đang tải danh sách giải thưởng...
                      </td>
                    </tr>
                  ) : prizeEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#8a9ba8]">
                        Chưa có giải thưởng nào cho sự kiện này. Bấm &quot;Thêm giải thưởng mới&quot; để bắt đầu.
                      </td>
                    </tr>
                  ) : (
                    paginatedPrizeEntries.map(({ p, originalIdx }) => (
                      <tr key={p.id} className="hover:bg-[#182024]">
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

                        {/* Số lượng */}
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

                        {/* Giá trị */}
                        <td className="p-3">
                          <input
                            type="text"
                            value={p.value}
                            onChange={(e) => handleUpdatePrize(p.id, "value", e.target.value)}
                            placeholder="5.000.000 VNĐ"
                            className="w-full px-3 py-1.5 bg-[#0a0e10] border border-[#263339] text-[#f59e0b] font-mono font-bold text-xs focus:outline-none focus:border-[#f59e0b]"
                          />
                        </td>

                        {/* Nút xóa */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemovePrize(p.id, p.isNew)}
                            className="text-[#8a9ba8] hover:text-[#ef4444] p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {prizeEntries.length > 0 && (
              <div className="p-4 border-t border-[#263339]">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  itemLabel="giải thưởng"
                />
              </div>
            )}
          </div>

          {/* Right Panel: Live Budget Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#13191c] border border-[#263339] p-6 space-y-5 font-mono text-xs">
              <div className="border-b border-[#263339] pb-3 flex items-center justify-between">
                <span className="font-bold text-[#e1e7ec] uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#f59e0b]" />
                  TỔNG KẾT NGÂN SÁCH GIẢI
                </span>
                <span className="text-[10px] text-[#8a9ba8]">{prizes.length} Hạng mục giải</span>
              </div>

              <div className="p-4 bg-[#0a0e10] border border-[#263339] space-y-2">
                <span className="text-[10px] text-[#8a9ba8] uppercase block">Tổng Giá Trị Giải Thưởng:</span>
                <div className="text-2xl font-bold text-[#f59e0b] tracking-wider">
                  {totalPrizeBudget.toLocaleString("vi-VN")} <span className="text-sm text-[#8a9ba8]">VNĐ</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={isSubmitting || !eventId}
                className="w-full py-3 bg-[#f59e0b] hover:bg-amber-400 text-[#0a0e10] font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-[#f59e0b]/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? "ĐANG LƯU..." : "LƯU CƠ CẤU GIẢI THƯỞNG"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
