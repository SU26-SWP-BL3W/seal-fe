"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { appealsRepository, AppealStatus, useGetAppealsByEvent } from "@/repositories/appealsRepository";
import { useAuth } from "@/providers/AuthProvider";
import { useMyEvents, useEvents } from "@/repositories/eventsRepository";
import { useGetTeamsByEvent } from "@/repositories/teamsRepository";
import { useGetTracksByEvent } from "@/repositories/events/tracksRepository";
import { useQueries } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import { Check, X, AlertCircle, CheckCircle2, UserPlus, Filter, ChevronDown, ArrowLeft, RefreshCw, Layers, Award, ArrowRight, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui";

function formatSeasonYear(season?: string, year?: number | string): string {
  if (!season) return year ? `${year}` : "";
  if (year && !season.includes(String(year))) return `${season} ${year}`;
  return season;
}

export const CoordinatorAppealsView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const searchParams = useSearchParams();
  const queryEventId = searchParams.get("eventId") || searchParams.get("id") || "";

  const { data: rawMyEvents = [] } = useMyEvents();
  const { data: rawAllEvents = [] } = useEvents();

  const eventsList = useMemo(() => {
    const myEventsList = Array.isArray(rawMyEvents) ? rawMyEvents : (rawMyEvents as any)?.data ?? [];
    if (currentUser?.isAdmin) {
      const allList = Array.isArray(rawAllEvents) ? rawAllEvents : (rawAllEvents as any)?.data ?? [];
      const map = new Map<string, any>();
      allList.forEach((ev: any) => {
        const id = ev.id || ev.Id || ev.eventId || ev.EventId;
        if (id) map.set(id, ev);
      });
      myEventsList.forEach((ev: any) => {
        const id = ev.id || ev.Id || ev.eventId || ev.EventId;
        if (id && !map.has(id)) map.set(id, ev);
      });
      return Array.from(map.values());
    }
    return myEventsList;
  }, [rawMyEvents, rawAllEvents, currentUser?.isAdmin]);

  // Đếm số lượng đơn phúc khảo cho từng sự kiện để hiển thị trực tiếp trong dropdown
  const allEventsAppealsQueries = useQueries({
    queries: eventsList.map((ev: any) => {
      const eId = ev.id || ev.Id || ev.eventId || ev.EventId;
      return {
        queryKey: ["appealsByEvent", eId],
        queryFn: async () => {
          if (!eId) return [];
          try {
            const roundsRes = await apiClient.get<any>("/Rounds/event", {
              params: { EventId: eId, eventId: eId, PageSize: 100 },
            });
            const rawRounds =
              roundsRes.data?.data?.items ??
              roundsRes.data?.items ??
              roundsRes.data?.data ??
              roundsRes.data ??
              [];
            const rounds: any[] = Array.isArray(rawRounds) ? rawRounds : [];
            if (rounds.length === 0) return [];
            const perRound = await Promise.all(
              rounds.map(async (r) => {
                const roundId = r.id || r.Id;
                if (!roundId) return [];
                try {
                  const res = await apiClient.get<any>(`/Appeals/round/${roundId}`, {
                    params: { PageSize: 200 },
                  });
                  const rawAppeals =
                    res.data?.data?.items ??
                    res.data?.items ??
                    res.data?.data ??
                    (Array.isArray(res.data) ? res.data : []);
                  return Array.isArray(rawAppeals) ? rawAppeals : [];
                } catch {
                  return [];
                }
              })
            );
            return perRound.flat();
          } catch {
            return [];
          }
        },
        enabled: !!eId,
      };
    }),
  });

  const appealsCountByEventId = useMemo(() => {
    const map = new Map<string, { pending: number; total: number }>();
    eventsList.forEach((ev: any, idx: number) => {
      const eId = ev.id || ev.Id || ev.eventId || ev.EventId;
      const rawData = allEventsAppealsQueries[idx]?.data;
      const appealsList = Array.isArray(rawData) ? rawData : [];
      const pendingCount = appealsList.filter(
        (a: any) =>
          a.status === AppealStatus.Pending ||
          a.status === 0 ||
          (a as any).Status === 0 ||
          (a as any).status === "Pending"
      ).length;
      if (eId) map.set(eId, { pending: pendingCount, total: appealsList.length });
    });
    return map;
  }, [eventsList, allEventsAppealsQueries]);

  const [selectedEventId, setSelectedEventId] = useState<string>(queryEventId);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");

  useEffect(() => {
    if (queryEventId) {
      setSelectedEventId(queryEventId);
    } else if (eventsList.length > 0 && !selectedEventId) {
      // Ưu tiên chọn sự kiện đang có đơn phúc khảo chờ xử lý
      const eventWithPending = eventsList.find((ev: any) => {
        const id = ev.id || ev.Id || ev.eventId || ev.EventId || "";
        return (appealsCountByEventId.get(id)?.pending || 0) > 0;
      });
      const firstId =
        eventWithPending?.id ||
        eventWithPending?.Id ||
        eventsList[0].id ||
        eventsList[0].Id ||
        eventsList[0].eventId ||
        eventsList[0].EventId ||
        "";
      setSelectedEventId(firstId);
    }
  }, [queryEventId, eventsList, selectedEventId, appealsCountByEventId]);

  const { data: appeals = [], isLoading, refetch } = useGetAppealsByEvent(selectedEventId || undefined);
  const { data: teams = [] } = useGetTeamsByEvent(selectedEventId || undefined);
  const { data: tracks = [] } = useGetTracksByEvent(selectedEventId || undefined);

  const teamNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of teams as any[]) {
      const id = t.id || t.Id || t.teamId || t.TeamId;
      const name = t.name || t.Name || t.teamName || t.TeamName;
      if (id && name) map.set(id, name);
    }
    return map;
  }, [teams]);

  const judges = useMemo(() => {
    const map = new Map<string, { id: string; fullName: string }>();
    for (const track of tracks as any[]) {
      for (const j of track.judges || track.Judges || []) {
        const jId = j?.id || j?.Id;
        if (jId) {
          map.set(jId, { id: jId, fullName: j.fullName || j.FullName || j.email || j.Email || jId });
        }
      }
    }
    return Array.from(map.values());
  }, [tracks]);

  const judgeNameById = useMemo(() => {
    const map = new Map<string, string>();
    judges.forEach((j) => map.set(j.id, j.fullName));
    return map;
  }, [judges]);

  // Bộ lọc theo trạng thái
  const displayAppeals = useMemo(() => {
    return appeals.filter((a: any) => {
      const s = a.status !== undefined ? a.status : a.Status;
      const isPending = s === AppealStatus.Pending || s === 0 || s === "Pending";
      const isApproved = s === AppealStatus.Approved || s === 1 || s === "Approved";
      const isRejected = s === AppealStatus.Rejected || s === 2 || s === "Rejected";

      if (statusFilter === "PENDING") return isPending;
      if (statusFilter === "APPROVED") return isApproved;
      if (statusFilter === "REJECTED") return isRejected;
      return true;
    });
  }, [appeals, statusFilter]);

  const pendingCount = useMemo(
    () =>
      appeals.filter(
        (a: any) =>
          a.status === AppealStatus.Pending ||
          a.status === 0 ||
          (a as any).Status === 0 ||
          (a as any).status === "Pending"
      ).length,
    [appeals]
  );
  const approvedCount = useMemo(
    () =>
      appeals.filter(
        (a: any) =>
          a.status === AppealStatus.Approved ||
          a.status === 1 ||
          (a as any).Status === 1 ||
          (a as any).status === "Approved"
      ).length,
    [appeals]
  );
  const rejectedCount = useMemo(
    () =>
      appeals.filter(
        (a: any) =>
          a.status === AppealStatus.Rejected ||
          a.status === 2 ||
          (a as any).Status === 2 ||
          (a as any).status === "Rejected"
      ).length,
    [appeals]
  );

  const [selectedAppealId, setSelectedAppealId] = useState<string | null>(null);
  const [assignedJudgeId, setAssignedJudgeId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingAppealId, setRejectingAppealId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (judges.length > 0 && !assignedJudgeId) setAssignedJudgeId(judges[0].id);
  }, [judges, assignedJudgeId]);

  const handleApproveAppeal = async () => {
    if (!selectedAppealId) return;
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await appealsRepository.respondAppeal(
        selectedAppealId,
        true,
        "Chấp nhận đơn phúc khảo.",
        assignedJudgeId || undefined,
      );
      setSuccessMessage(`Đã duyệt đơn phúc khảo và phân công giám khảo chấm lại.`);
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
      await appealsRepository.respondAppeal(rejectingAppealId, false, rejectReason.trim());
      setSuccessMessage(`Đã từ chối đơn phúc khảo với lý do: "${rejectReason}".`);
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
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link href={`/coordinator/submissions${selectedEventId ? `?eventId=${selectedEventId}` : ""}`} className="text-xs font-mono text-[#8a9ba8] hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>QUAY LẠI QUẢN LÝ BÀI NỘP</span>
          </Link>
          <Button
            variant="ghost"
            onClick={() => refetch()}
            className="text-xs font-mono text-[#8a9ba8] hover:text-white flex items-center gap-1 border border-[#263339]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>LÀM MỚI</span>
          </Button>
        </div>

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
                  eventsList.map((ev: any, idx: number) => {
                    const id = ev.id || ev.Id || ev.eventId || ev.EventId;
                    const name = ev.eventName || ev.EventName || ev.name || ev.Name || "Sự kiện";
                    const timeTag = formatSeasonYear(ev.season || ev.Season, ev.year || ev.Year);
                    const stats = appealsCountByEventId.get(id);
                    const pendingBadge =
                      stats && stats.pending > 0
                        ? `[⚠️ ${stats.pending} đơn chờ]`
                        : stats && stats.total > 0
                        ? `[✓ ${stats.total} đơn]`
                        : `[0 đơn]`;
                    return (
                      <option key={id || idx} value={id}>
                        {name} {timeTag ? `(${timeTag})` : ""} — {pendingBadge}
                      </option>
                    );
                  })
                ) : (
                  <option value="">Chưa có sự kiện nào được phân công</option>
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

        {/* Workflow Action Box: Sau khi xử lý phúc khảo -> Chuyển sang công bố lại điểm */}
        <div className="bg-[#13191c] p-4 border border-[#8b5cf6]/40 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#8b5cf6]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-[#e1e7ec] uppercase">LUỒNG KẾT THÚC PHÚC KHẢO & CÔNG BỐ ĐIỂM</div>
              <div className="text-[#8a9ba8] font-sans text-xs mt-0.5">
                Sau khi Giám khảo chấm thẩm định lại xong đơn phúc khảo, hãy chuyển sang trang <strong className="text-[#8b5cf6]">Công Bố Kết Quả</strong> để tính lại điểm số Top 10 và cập nhật Bảng Vàng Danh Dự.
              </div>
            </div>
          </div>
          <Link
            href={`/coordinator/publish-results${selectedEventId ? `?eventId=${selectedEventId}` : ""}`}
            className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold tracking-wider uppercase transition-colors shrink-0 flex items-center gap-2"
          >
            <span>CÔNG BỐ & CẬP NHẬT BẢNG VÀNG</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setStatusFilter("PENDING")}
            className={`px-4 py-2 border font-bold uppercase transition-colors flex items-center gap-2 cursor-pointer ${
              statusFilter === "PENDING"
                ? "bg-[#f59e0b]/20 border-[#f59e0b] text-[#f59e0b]"
                : "bg-[#13191c] border-[#263339] text-[#8a9ba8] hover:text-[#e1e7ec]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>CHỜ DUYỆT ({pendingCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("APPROVED")}
            className={`px-4 py-2 border font-bold uppercase transition-colors flex items-center gap-2 cursor-pointer ${
              statusFilter === "APPROVED"
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                : "bg-[#13191c] border-[#263339] text-[#8a9ba8] hover:text-[#e1e7ec]"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ĐÃ DUYỆT ({approvedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("REJECTED")}
            className={`px-4 py-2 border font-bold uppercase transition-colors flex items-center gap-2 cursor-pointer ${
              statusFilter === "REJECTED"
                ? "bg-red-500/20 border-red-500 text-red-400"
                : "bg-[#13191c] border-[#263339] text-[#8a9ba8] hover:text-[#e1e7ec]"
            }`}
          >
            <X className="w-3.5 h-3.5" />
            <span>ĐÃ TỪ CHỐI ({rejectedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-4 py-2 border font-bold uppercase transition-colors flex items-center gap-2 cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-[#8b5cf6]/20 border-[#8b5cf6] text-[#8b5cf6]"
                : "bg-[#13191c] border-[#263339] text-[#8a9ba8] hover:text-[#e1e7ec]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>TẤT CẢ ({appeals.length})</span>
          </button>
        </div>

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
                  <th className="p-4 w-36">TRẠNG THÁI</th>
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
                ) : displayAppeals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#8a9ba8]">
                      Không có đơn phúc khảo nào trong mục này.
                    </td>
                  </tr>
                ) : (
                  displayAppeals.map((apl: any) => {
                    const aplId = apl.id || apl.Id || "";
                    const teamId = apl.teamId || apl.TeamId;
                    const subId = apl.submitResultId || apl.SubmitResultId || "";
                    const reason = apl.reason || apl.Reason || "";
                    const createdTime = apl.createdTime || apl.CreatedTime;
                    const team = teamNameById.get(teamId) || teamId || "Đội thi";
                    const s = apl.status !== undefined ? apl.status : apl.Status;
                    const isPending = s === AppealStatus.Pending || s === 0 || s === "Pending";
                    const isApproved = s === AppealStatus.Approved || s === 1 || s === "Approved";
                    const isRejected = s === AppealStatus.Rejected || s === 2 || s === "Rejected";
                    const assignedJName = apl.assignedJudgeId ? (judgeNameById.get(apl.assignedJudgeId) || apl.assignedJudgeId) : null;

                    return (
                      <tr key={aplId} className="hover:bg-[#182024] transition-colors">
                        <td className="p-4 text-[#e1e7ec] font-bold">{aplId.slice(0, 8).toUpperCase()}</td>
                        <td className="p-4 font-sans font-bold text-sm text-[#e1e7ec]">{team}</td>
                        <td className="p-4 text-[#8b5cf6]">{subId.slice(0, 8).toUpperCase()}</td>
                        <td className="p-4 text-[#8a9ba8] truncate max-w-xs" title={reason}>{reason}</td>
                        <td className="p-4 text-[#8a9ba8]">{createdTime ? new Date(createdTime).toLocaleString("vi-VN") : "—"}</td>
                        <td className="p-4">
                          {isPending && (
                            <span className="text-[#f59e0b] font-semibold text-[10px]">
                              [ CHỜ XỬ LÝ ]
                            </span>
                          )}
                          {isApproved && (
                            <div className="space-y-0.5">
                              <span className="text-emerald-400 font-semibold text-[10px] block">
                                [ ĐÃ DUYỆT ]
                              </span>
                              {assignedJName && (
                                <span className="text-[9px] text-[#8a9ba8] block">
                                  GK: {assignedJName}
                                </span>
                              )}
                            </div>
                          )}
                          {isRejected && (
                            <span className="text-[#ef4444] font-semibold text-[10px]">
                              [ ĐÃ TỪ CHỐI ]
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="p-4 text-right pr-6">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => setSelectedAppealId(aplId)}
                                className="px-3.5 py-1.5 bg-[#8b5cf6] text-white hover:bg-purple-600 font-mono text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>DUYỆT</span>
                              </button>

                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => setRejectingAppealId(aplId)}
                                className="px-3.5 py-1.5 border border-[#ef4444] text-[#ef4444] hover:bg-red-500/10 font-mono text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>TỪ CHỐI</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#8a9ba8] font-mono italic">
                              Đã hoàn tất
                            </span>
                          )}
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
              <span>Duyệt đơn &amp; Phân công Giám khảo chấm lại</span>
            </div>
            <p className="text-xs text-[#8a9ba8]">
              Khi duyệt đơn, giám khảo được chọn sẽ nhận được quyền chấm lại bài nộp này.
            </p>
            <div>
              <label className="text-[10px] text-[#8a9ba8] font-mono uppercase block mb-1">
                Chọn Giám khảo chấm lại:
              </label>
              <select
                value={assignedJudgeId}
                onChange={(e) => setAssignedJudgeId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-mono text-xs focus:border-[#8b5cf6] outline-none cursor-pointer"
              >
                {judges.length > 0 ? (
                  judges.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.fullName}
                    </option>
                  ))
                ) : (
                  <option value="">Chưa có giám khảo nào trong các hạng mục</option>
                )}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setSelectedAppealId(null)}
                className="px-4 py-2 border border-[#263339] text-[#8a9ba8] hover:text-white font-mono text-xs cursor-pointer"
              >
                HỦY
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleApproveAppeal}
                className="px-4 py-2 bg-[#8b5cf6] text-white hover:bg-purple-600 font-mono text-xs font-bold cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "ĐANG DUYỆT..." : "XÁC NHẬN DUYỆT"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Từ chối đơn */}
      {rejectingAppealId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#13191c] border border-[#263339] p-6 max-w-md w-full space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-mono font-bold text-xs uppercase">
              <X className="w-4 h-4" />
              <span>Từ chối đơn phúc khảo</span>
            </div>
            <div>
              <label className="text-[10px] text-[#8a9ba8] font-mono uppercase block mb-1">
                Lý do từ chối <span className="text-red-400">*</span>:
              </label>
              <textarea
                rows={3}
                required
                placeholder="Nhập lý do từ chối đơn khiếu nại (ví dụ: Đơn nộp quá hạn, bài thi đã chấm đúng thang điểm)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-mono text-xs focus:border-red-400 outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setRejectingAppealId(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 border border-[#263339] text-[#8a9ba8] hover:text-white font-mono text-xs cursor-pointer"
              >
                HỦY
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleRejectAppeal}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 font-mono text-xs font-bold cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "ĐANG TỪ CHỐI..." : "XÁC NHẬN TỪ CHỐI"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
