"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useAppealsByRound, appealsRepository } from "@/repositories/appealsRepository";
import { useMyEvents } from "@/repositories/eventsRepository";
import { Check, X, AlertCircle, CheckCircle2, UserPlus, Filter, ChevronDown } from "lucide-react";

export const CoordinatorAppealsView: React.FC = () => {
  const params = useParams();
  const roundId = (params?.roundId as string) || "round-phase-02";

  const { data: eventsList = [] } = useMyEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  React.useEffect(() => {
    if (eventsList.length > 0 && !selectedEventId) {
      setSelectedEventId(eventsList[0].id || eventsList[0].eventId || "");
    }
  }, [eventsList, selectedEventId]);

  const { data: appeals = [], isLoading, refetch } = useAppealsByRound(roundId);

  const [selectedAppealId, setSelectedAppealId] = useState<string | null>(null);
  const [assignedJudgeId, setAssignedJudgeId] = useState("judge-01");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingAppealId, setRejectingAppealId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const displayAppeals = appeals;

  const handleApproveAppeal = async () => {
    if (!selectedAppealId) return;
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      if (!selectedAppealId.startsWith("APL-")) {
        await appealsRepository.respondAppeal(selectedAppealId, true, "Chấp nhận đơn phúc khảo.", assignedJudgeId);
      }
      setSuccessMessage(`Đã duyệt đơn phúc khảo ${selectedAppealId} và phân công Giám khảo (${assignedJudgeId}) chấm lại.`);
      setSelectedAppealId(null);
      await refetch();
    } catch (err: any) {
      setErrorMessage(`Duyệt đơn thất bại: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectAppeal = async () => {
    if (!rejectingAppealId || !rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối đơn phúc khảo!");
      return;
    }
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      if (!rejectingAppealId.startsWith("APL-")) {
        await appealsRepository.respondAppeal(rejectingAppealId, false, rejectReason.trim());
      }
      setSuccessMessage(`Đã từ chối đơn phúc khảo ${rejectingAppealId} với lý do: "${rejectReason}".`);
      setRejectingAppealId(null);
      setRejectReason("");
      await refetch();
    } catch (err: any) {
      setErrorMessage(`Từ chối đơn thất bại: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0a0e10] text-[#e1e7ec] font-sans selection:bg-[#8b5cf6] selection:text-white">
      {/* Main Container */}
      <div className="flex-1 p-6 space-y-6 max-w-[1500px] w-full mx-auto">
        
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

        {/* Title Header */}
        <div className="border-b border-[#263339] pb-4">
          <h1 className="font-mono font-bold text-2xl md:text-3xl text-[#e1e7ec] uppercase tracking-wider">
            HÀNG ĐỢI XỬ LÝ PHÚC KHẢO
          </h1>
          <p className="font-sans text-xs text-[#8a9ba8] mt-1">
            Tiếp nhận và giải quyết khiếu nại điểm số từ các đội thi trong sự kiện.
          </p>
        </div>

        {/* Global Feedback Banners */}
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

        {/* Main Table Box */}
        <div className="bg-[#13191c] border border-[#263339]">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#263339] text-[#8a9ba8] tracking-wider text-[11px] bg-[#0a0e10]">
                  <th className="p-4 w-32">MÃ ĐƠN</th>
                  <th className="p-4 w-40">TÊN ĐỘI THI</th>
                  <th className="p-4 w-36">MÃ BÀI NỘP</th>
                  <th className="p-4">LÝ DO KHIẾU NẠI</th>
                  <th className="p-4 w-44">THỜI GIAN</th>
                  <th className="p-4 w-28">TRẠNG THÁI</th>
                  <th className="p-4 w-44 text-right pr-6">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263339]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#8a9ba8]">
                      Đang tải danh sách đơn phúc khảo...
                    </td>
                  </tr>
                ) : (
                  displayAppeals.map((apl: any) => {
                    const id = apl.id || apl.Id || apl.appealId || "APL-9200";
                    const team = apl.teamName || apl.TeamName || "Team";
                    const subRef = apl.submissionRef || apl.SubmissionRef || "SUB-0000";
                    const reason = apl.primaryReason || apl.Reason || "Lý do phúc khảo...";
                    const time = apl.timestamp || apl.CreatedTime || "2023-10-24 14:00Z";

                    return (
                      <tr key={id} className="hover:bg-[#182024] transition-colors">
                        <td className="p-4 text-[#e1e7ec] font-bold">{id}</td>
                        <td className="p-4 font-sans font-bold text-sm text-[#e1e7ec]">{team}</td>
                        <td className="p-4 text-[#8b5cf6]">{subRef}</td>
                        <td className="p-4 text-[#8a9ba8] truncate max-w-xs">{reason}</td>
                        <td className="p-4 text-[#8a9ba8]">{time}</td>
                        <td className="p-4">
                          <span className="text-[#f59e0b] font-semibold text-[10px]">
                            [ CHỜ XỬ LÝ ]
                          </span>
                        </td>
                        
                        {/* Action Buttons (DUYỆT / TỪ CHỐI) */}
                        <td className="p-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => setSelectedAppealId(id)}
                              className="px-3.5 py-1.5 bg-[#8b5cf6] text-white hover:bg-purple-600 font-mono text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>DUYỆT</span>
                            </button>

                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => setRejectingAppealId(id)}
                              className="px-3.5 py-1.5 border border-[#ef4444] text-[#ef4444] hover:bg-red-500/10 font-mono text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>TỪ CHỐI</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal Duyệt đơn & Phân công Giám khảo */}
      {selectedAppealId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#13191c] border border-[#263339] p-6 max-w-md w-full space-y-4">
            <div className="flex items-center gap-2 text-[#8b5cf6] font-mono font-bold text-xs uppercase">
              <UserPlus className="w-4 h-4" />
              <span>DUYỆT ĐƠN PHÚC KHẢO &amp; GÁN GIÁM KHẢO CHẤM LẠI</span>
            </div>

            <p className="text-xs text-[#e1e7ec] font-sans">
              Đơn phúc khảo <strong className="text-[#8b5cf6]">{selectedAppealId}</strong> sẽ được phê duyệt. Vui lòng chọn Giám khảo phụ trách chấm lại bài nộp:
            </p>

            <div className="space-y-1 font-mono text-xs">
              <label className="text-[#8a9ba8]">Chọn Giám khảo chấm lại:</label>
              <select
                value={assignedJudgeId}
                onChange={(e) => setAssignedJudgeId(e.target.value)}
                className="w-full p-2.5 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-mono text-xs focus:outline-none focus:border-[#8b5cf6]"
              >
                <option value="judge-01">Giám khảo 01 - Tiến sĩ Nguyễn Văn A (Cloud Expert)</option>
                <option value="judge-02">Giám khảo 02 - Thạc sĩ Trần Thị B (Security Specialist)</option>
                <option value="judge-03">Giám khảo 03 - Kỹ sư Lê Văn C (Senior Architect)</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedAppealId(null)}
                disabled={isSubmitting}
                className="px-4 py-1.5 border border-[#263339] text-xs font-mono text-[#e1e7ec] hover:bg-[#263339]/50"
              >
                HỦY
              </button>
              <button
                onClick={handleApproveAppeal}
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-[#8b5cf6] text-white font-mono text-xs font-semibold"
              >
                {isSubmitting ? "Đang xử lý..." : "XÁC NHẬN DUYỆT & GÁN"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Từ Chối Đơn Phúc Khảo */}
      {rejectingAppealId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#13191c] border border-[#ef4444]/40 p-6 max-w-md w-full space-y-4">
            <div className="flex items-center gap-2 text-[#ef4444] font-mono font-bold text-xs uppercase">
              <AlertCircle className="w-4 h-4" />
              <span>TỪ CHỐI ĐƠN PHÚC KHẢO</span>
            </div>

            <div className="space-y-1 font-mono text-xs">
              <label className="text-[#8a9ba8]">Lý do từ chối phúc khảo (bắt buộc):</label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Đội thi nộp khiếu nại quá thời hạn quy định hoặc không cung cấp minh chứng rõ ràng..."
                className="w-full p-3 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-sans text-xs focus:outline-none focus:border-[#ef4444]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setRejectingAppealId(null);
                  setRejectReason("");
                }}
                disabled={isSubmitting}
                className="px-4 py-1.5 border border-[#263339] text-xs font-mono text-[#e1e7ec] hover:bg-[#263339]/50"
              >
                HỦY
              </button>
              <button
                onClick={handleRejectAppeal}
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-[#ef4444] text-white font-mono text-xs font-semibold"
              >
                {isSubmitting ? "Đang xử lý..." : "XÁC NHẬN TỪ CHỐI"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
