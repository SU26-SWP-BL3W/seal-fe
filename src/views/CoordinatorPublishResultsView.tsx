"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useGetFinalResultsByRound, useAssignPrize, finalResultsRepository } from "@/repositories/finalResultsRepository";
import { useMyEvents, useEventRounds } from "@/repositories/eventsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { useGetTeamsByEvent } from "@/repositories/teamsRepository";
import { useGetPrizesByEvent } from "@/repositories/results/prizesRepository";
import { Eye, EyeOff, RefreshCw, AlertCircle, CheckCircle2, Award, ChevronDown, Filter, Layers } from "lucide-react";

export const CoordinatorPublishResultsView: React.FC = () => {
  const params = useParams();

  const { data: eventsList = [] } = useMyEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");

  React.useEffect(() => {
    if (eventsList.length > 0 && !selectedEventId) {
      setSelectedEventId(eventsList[0].id || eventsList[0].eventId || "");
    }
  }, [eventsList, selectedEventId]);

  const { data: dbTracks = [] } = useGetTracksByEvent(selectedEventId);
  const { data: dbPrizes = [] } = useGetPrizesByEvent(selectedEventId);
  const { data: dbRounds = [] } = useEventRounds(selectedEventId);
  const { data: dbTeams = [] } = useGetTeamsByEvent(selectedEventId);

  const teamNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const t of dbTeams as any[]) map.set(t.id, t.name || t.teamName || t.id);
    return map;
  }, [dbTeams]);

  const roundsList: Array<{ id: string; name: string }> = dbRounds.map((r: any) => ({
    id: r.id || r.Id,
    name: r.roundName || r.RoundName || "Vòng thi",
  }));

  React.useEffect(() => {
    if (roundsList.length > 0 && !selectedRoundId) {
      setSelectedRoundId(roundsList[0].id);
    }
  }, [roundsList, selectedRoundId]);

  const tracksList = dbTracks.map((t: any) => ({
    id: t.id || t.Id || t.trackId,
    name: t.trackName || t.Name || "Hạng mục",
  }));

  React.useEffect(() => {
    if (tracksList.length > 0 && !selectedTrackId) {
      setSelectedTrackId(tracksList[0].id);
    }
  }, [tracksList, selectedTrackId]);

  const { data: results = [], isLoading, refetch } = useGetFinalResultsByRound(selectedRoundId);
  const assignPrizeMutation = useAssignPrize();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topN, setTopN] = useState<number>(10);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPublishedState, setIsPublishedState] = useState(false);

  // Local prize assignment state map
  const [assignedPrizesMap, setAssignedPrizesMap] = useState<Record<string, string>>({});

  const availablePrizesList = dbPrizes.map((p: any, idx: number) => ({
    id: p.id || p.Id || `prz-${idx}`,
    name: `${p.prizeName || p.PrizeName || "Giải"} (${p.value || p.Value || "chưa rõ giá trị"})`,
  }));

  // Handle Prize Assignment to Team
  const handleAssignPrizeToTeam = async (resultId: string, prizeId: string, teamName: string) => {
    setAssignedPrizesMap((prev) => ({ ...prev, [resultId]: prizeId }));
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      if (assignPrizeMutation?.mutateAsync && !resultId.startsWith("res-")) {
        await assignPrizeMutation.mutateAsync({
          resultId,
          prizeId: prizeId !== "none" ? prizeId : null,
        });
      }
      const prizeObj = availablePrizesList.find((p) => p.id === prizeId);
      setSuccessMessage(
        prizeId !== "none"
          ? `Đã trao ${prizeObj?.name || 'Giải thưởng'} cho Đội "${teamName}"!`
          : `Đã hủy gán giải thưởng cho Đội "${teamName}".`
      );
    } catch (err: any) {
      setErrorMessage(`Gán giải thưởng thất bại: ${err?.message}`);
    }
  };

  const displayResults = results;

  const handleCalculate = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (!selectedRoundId.startsWith("round-")) {
        await finalResultsRepository.calculateRoundResults(selectedRoundId, topN);
      }
      setSuccessMessage(`Đã tự động tính toán xếp hạng điểm số cho Vòng thi (Top ${topN}).`);
      await refetch();
    } catch (err: any) {
      setErrorMessage(`Tính điểm thất bại: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublishStatus = async () => {
    const nextStatus = !isPublishedState;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (!selectedRoundId.startsWith("round-")) {
        await finalResultsRepository.setPublishStatus(selectedRoundId, nextStatus);
      }
      setIsPublishedState(nextStatus);
      setSuccessMessage(
        nextStatus
          ? "Đã công bố công khai bảng kết quả cho thí sinh và Bảng Vàng Danh Dự!"
          : "Đã ẩn bảng kết quả về chế độ bản nháp an toàn."
      );
      await refetch();
    } catch (err: any) {
      setErrorMessage(`Đổi trạng thái thất bại: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0a0e10] text-[#e1e7ec] font-sans selection:bg-[#8b5cf6] selection:text-white">
      {/* Main Container */}
      <div className="flex-1 p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        
        {/* Cascade Filter Bar: Event, Round & Track */}
        <div className="bg-[#13191c] p-4 border border-[#263339] grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          
          {/* Filter 1: Event */}
          <div className="space-y-1">
            <label className="text-[#8b5cf6] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <Filter className="w-3.5 h-3.5 text-[#8b5cf6]" />
              SỰ KIỆN PHỤ TRÁCH *
            </label>
            <div className="relative">
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

          {/* Filter 2: Round */}
          <div className="space-y-1">
            <label className="text-[#8b5cf6] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <Layers className="w-3.5 h-3.5 text-[#8b5cf6]" />
              VÒNG THI (ROUND) *
            </label>
            <div className="relative">
              <select
                value={selectedRoundId}
                onChange={(e) => setSelectedRoundId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-semibold cursor-pointer appearance-none focus:outline-none focus:border-[#8b5cf6]"
              >
                {roundsList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8a9ba8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Filter 3: Track */}
          <div className="space-y-1">
            <label className="text-[#8b5cf6] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <Award className="w-3.5 h-3.5 text-[#8b5cf6]" />
              HẠNG MỤC THI ĐẤU (TRACK) *
            </label>
            <div className="relative">
              <select
                value={selectedTrackId}
                onChange={(e) => setSelectedTrackId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0e10] border border-[#263339] text-[#00d9ff] font-semibold cursor-pointer appearance-none focus:outline-none focus:border-[#8b5cf6]"
              >
                {tracksList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8a9ba8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#263339] pb-4">
          <div>
            <h1 className="font-mono font-bold text-2xl md:text-3xl text-[#e1e7ec] uppercase tracking-wider">
              XÉT KẾT QUẢ VÒNG THI &amp; HẠNG MỤC
            </h1>
            <p className="font-sans text-xs text-[#8a9ba8] mt-1 max-w-2xl">
              Kiểm tra bảng điểm xếp hạng, gán Giải thưởng cho Đội thi đạt thứ hạng cao và Công bố Bảng Vàng Danh Dự.
            </p>
          </div>

          {/* Top Right Action Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCalculate}
              className="px-4 py-2 border border-[#263339] text-[#e1e7ec] hover:border-[#8b5cf6] font-mono text-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-[#8b5cf6]" />
              <span>TÍNH ĐIỂM TỰ ĐỘNG</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleTogglePublishStatus}
              className={`px-5 py-2 border font-mono text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                isPublishedState
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold"
                  : "bg-[#13191c] border-[#263339] text-[#f59e0b] hover:border-[#f59e0b]"
              }`}
            >
              {isPublishedState ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4 text-[#f59e0b]" />}
              <span>{isPublishedState ? "ẨN VỀ BẢN NHÁP" : "CÔNG BỐ KẾT QUẢ"}</span>
            </button>
          </div>
        </div>

        {/* Global Alert Messages */}
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

        {/* Main Data Grid */}
        <div className="bg-[#13191c] border border-[#263339]">
          {/* Header */}
          <div className="h-10 bg-[#182024] flex items-center justify-between px-4 border-b border-[#263339] font-mono text-xs text-[#8a9ba8] font-bold tracking-widest uppercase">
            <span>
              BẢNG XẾP HẠNG MA TRẬN ĐIỂM{tracksList.find((t) => t.id === selectedTrackId)?.name ? ` — [ ${tracksList.find((t) => t.id === selectedTrackId)?.name} ]` : ""}
            </span>
            <span className={isPublishedState ? "text-[#10b981]" : "text-[#f59e0b]"}>
              {isPublishedState ? "ĐÃ CÔNG BỐ PUBLIC" : "CHẾ ĐỘ BẢN NHÁP"}
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#263339] text-[#8a9ba8] tracking-wider text-[11px] bg-[#0a0e10]">
                  <th className="p-4 w-16 text-center">HẠNG</th>
                  <th className="p-4">TÊN ĐỘI THI THẮNG GIẢI</th>
                  <th className="p-4 w-32 text-right">TỔNG ĐIỂM</th>
                  <th className="p-4 w-32 text-center">KẾT QUẢ</th>
                  <th className="p-4 w-64">CƠ CHẾ GÁN GIẢI THƯỞNG (PRIZE)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263339]">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#8a9ba8]">
                      Đang tải ma trận điểm kết quả...
                    </td>
                  </tr>
                ) : (
                  displayResults.map((r: any, idx: number) => {
                    const rankStr = String(r.rank || idx + 1).padStart(2, "0");
                    const name = teamNameById.get(r.teamId) || r.teamName || r.TeamName || r.teamId;
                    const uid = `KQ: ${(r.id || "").slice(0, 8).toUpperCase()}`;
                    const score = Number(r.finalScore || r.totalScore || r.TotalScore || 0).toFixed(2);
                    const isAdv = r.isAdvanced !== undefined ? Boolean(r.isAdvanced) : idx < 2;

                    const assignedPrizeId = assignedPrizesMap[r.id] ?? r.prizeId ?? "none";

                    return (
                      <tr key={r.id || idx} className="hover:bg-[#182024] transition-colors">
                        <td className="p-4 text-center font-bold text-base text-[#8b5cf6]">{rankStr}</td>
                        <td className="p-4">
                          <div className="font-sans font-bold text-sm text-[#e1e7ec]">{name}</div>
                          <div className="text-[10px] text-[#8a9ba8] font-mono mt-0.5">{uid}</div>
                        </td>
                        <td className="p-4 text-right font-bold text-base text-[#e1e7ec]">{score}</td>
                        <td className="p-4 text-center">
                          {isAdv ? (
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold uppercase">
                              [ THĂNG HẠNG ]
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-semibold uppercase">
                              [ BỊ LOẠI ]
                            </span>
                          )}
                        </td>
                        
                        {/* CƠ CHẾ GÁN GIẢI THƯỞNG DROPDOWN */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-[#f59e0b] shrink-0" />
                            <select
                              value={assignedPrizeId}
                              onChange={(e) => handleAssignPrizeToTeam(r.id || `res-0${idx + 1}`, e.target.value, name)}
                              className="w-full px-2.5 py-1.5 bg-[#0a0e10] border border-[#263339] text-[#f59e0b] font-mono text-xs font-bold focus:outline-none focus:border-[#f59e0b] cursor-pointer"
                            >
                              <option value="none">— Chưa gán giải —</option>
                              {availablePrizesList.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Pagination */}
          <div className="p-3 bg-[#0a0e10] border-t border-[#263339] flex items-center justify-between font-mono text-xs text-[#8a9ba8]">
            <div>TỔNG SỐ BẢN GHI: {String(displayResults.length).padStart(2, "0")}</div>
            <div className="flex items-center gap-1">
              <button className="px-2 py-0.5 border border-[#263339] hover:border-[#8b5cf6] text-xs">&lt;</button>
              <button className="px-2 py-0.5 border border-[#263339] hover:border-[#8b5cf6] text-xs">&gt;</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
