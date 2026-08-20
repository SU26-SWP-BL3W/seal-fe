"use client";

import React, { useState, useEffect } from "react";
import { useMyEvents } from "@/repositories/eventsRepository";
import { useGetRoundsByEvent } from "@/repositories/events/roundsRepository";
import { useGetPendingTeams } from "@/repositories/teamsRepository";
import { useGetUsers } from "@/repositories/usersRepository";
import {
  Layers,
  Users,
  FileCheck,
  ChevronDown,
  ArrowRight,
  Activity,
  AlertTriangle,
  FolderKanban,
  Calendar,
} from "lucide-react";
import Link from "next/link";

function formatDateStr(dateStr?: string) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export const CoordinatorDashboardView: React.FC = () => {
  const { data: eventsList = [], isLoading } = useMyEvents();
  const { data: _pendingTeams = [] } = useGetPendingTeams();
  const { data: _pendingUsersData } = useGetUsers({ isApproved: false });
  const appealsList: { status?: number | string; Status?: string }[] = [];

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

  const activeEventId = selectedEventId || (selectedEvent?.id || selectedEvent?.Id || selectedEvent?.eventId || selectedEvent?.EventId || "");
  const { data: roundsPagedData, isLoading: isLoadingRounds } = useGetRoundsByEvent(activeEventId || undefined);

  const [localDraftRounds, setLocalDraftRounds] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && activeEventId) {
      try {
        const rawDraft = localStorage.getItem(`seal_wizard_draft_${activeEventId}`);
        if (rawDraft) {
          const parsed = JSON.parse(rawDraft);
          if (Array.isArray(parsed.rounds) && parsed.rounds.length > 0) {
            setLocalDraftRounds(parsed.rounds);
            return;
          }
        }
      } catch {
        // ignore
      }
      setLocalDraftRounds([]);
    }
  }, [activeEventId]);

  const realRoundsRaw = localDraftRounds.length > 0
    ? localDraftRounds
    : ((roundsPagedData as any)?.data || (roundsPagedData as any)?.items || (Array.isArray(roundsPagedData) ? roundsPagedData : (selectedEvent?.rounds || [])));
  const realRounds = Array.isArray(realRoundsRaw) ? realRoundsRaw : [];

  const selectedEventName = selectedEvent
    ? selectedEvent.eventName || selectedEvent.EventName || "Sự kiện được chọn"
    : "Chưa chọn sự kiện";

  const isSelectedEventPublished = selectedEvent
    ? Boolean(selectedEvent.status ?? selectedEvent.Status)
    : false;

  const selectedEventSeason = selectedEvent?.season || selectedEvent?.Season || "Summer";
  const selectedEventYear = selectedEvent?.year || selectedEvent?.Year || 2026;

  // Dynamic Metrics linked to active event
  const eventTeamsCount = selectedEvent ? ((selectedEvent as any).teamsCount ?? (selectedEvent as any).teamCount ?? 0) : 0;
  const eventPendingSubmissions = 0;
  const eventPendingAppeals = appealsList.length;

  // High-level Event Milestones (Clean, non-cluttered timeline cards)
  const now = new Date();
  const regStart = selectedEvent?.registrationStartDate || (selectedEvent as any)?.RegistrationStartDate;
  const regEnd = selectedEvent?.registrationEndDate || (selectedEvent as any)?.RegistrationEndDate;

  interface EventMilestone {
    id: string;
    stepNumber: number;
    title: string;
    categoryTag: string;
    submissionStart?: string;
    submissionEnd?: string;
    scoringStart?: string;
    scoringEnd?: string;
    status: "completed" | "active" | "upcoming";
    badgeText: string;
    badgeBg: string;
  }

  const eventMilestones: EventMilestone[] = [];

  // Milestone 1: Mở đăng ký đội thi
  let regStatus: "completed" | "active" | "upcoming" = "upcoming";
  let regBadgeBg = "bg-[#263339] text-[#8a9ba8]";
  let regBadgeText = "SẮP TỚI";
  if (regStart && regEnd) {
    const sDate = new Date(regStart);
    const eDate = new Date(regEnd);
    if (now > eDate) {
      regStatus = "completed";
      regBadgeText = "ĐÃ HOÀN THÀNH";
      regBadgeBg = "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40";
    } else if (now >= sDate && now <= eDate) {
      regStatus = "active";
      regBadgeText = "ĐANG MỞ ĐĂNG KÝ";
      regBadgeBg = "bg-[#00d9ff]/20 text-[#00d9ff] border border-[#00d9ff]/40";
    }
  }

  eventMilestones.push({
    id: "ms-reg",
    stepNumber: 1,
    title: "Mở Đăng Ký Đội Thi",
    categoryTag: "THỦ TỤC BAN ĐẦU",
    submissionStart: regStart || "",
    submissionEnd: regEnd || "",
    status: regStatus,
    badgeText: regBadgeText,
    badgeBg: regBadgeBg,
  });

  // Milestone for each Round
  if (realRounds.length > 0) {
    realRounds.forEach((r: any, idx: number) => {
      const roundNum = r.roundNumber || r.RoundNumber || idx + 1;
      const roundName = r.roundName || r.RoundName || `Vòng ${roundNum}`;
      const rStart = r.startDate || r.StartDate;
      const rEnd = r.endDate || r.EndDate;
      const scStart = r.scoringStartDate || r.ScoringStartDate;
      const scEnd = r.scoringEndDate || r.ScoringEndDate;

      let roundStatus: "completed" | "active" | "upcoming" = "upcoming";
      let roundBadgeBg = "bg-[#263339] text-[#8a9ba8]";
      let roundBadgeText = "SẮP TỚI";

      const checkEnd = scEnd ? new Date(scEnd) : (rEnd ? new Date(rEnd) : null);
      const checkStart = rStart ? new Date(rStart) : null;

      if (checkEnd && now > checkEnd) {
        roundStatus = "completed";
        roundBadgeText = "ĐÃ HOÀN THÀNH";
        roundBadgeBg = "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40";
      } else if (checkStart && now >= checkStart && checkEnd && now <= checkEnd) {
        roundStatus = "active";
        roundBadgeText = "ĐANG DIỄN RA";
        roundBadgeBg = "bg-[#8b5cf6]/20 text-[#c084fc] border border-[#8b5cf6]/40";
      }

      eventMilestones.push({
        id: `ms-round-${idx}`,
        stepNumber: eventMilestones.length + 1,
        title: roundName,
        categoryTag: `VÒNG THI CHÍNH THỨC ${roundNum}`,
        submissionStart: rStart || "",
        submissionEnd: rEnd || "",
        scoringStart: scStart || "",
        scoringEnd: scEnd || "",
        status: roundStatus,
        badgeText: roundBadgeText,
        badgeBg: roundBadgeBg,
      });
    });
  }

  // Final Milestone: Phúc khảo & Trao giải Gala
  eventMilestones.push({
    id: "ms-final",
    stepNumber: eventMilestones.length + 1,
    title: "Phúc Khảo & Trao Giải Gala",
    categoryTag: "TỔNG KẾT SỰ KIỆN",
    submissionStart: selectedEvent?.endDate || (selectedEvent as any)?.EndDate || "",
    status: isSelectedEventPublished ? "completed" : "upcoming",
    badgeText: isSelectedEventPublished ? "ĐÃ CÔNG BỐ" : "CHỜ CÔNG BỐ",
    badgeBg: isSelectedEventPublished ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40" : "bg-[#263339] text-[#8a9ba8]",
  });

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

        {/* Clean Modern Event Roadmap / Milestones Stepper */}
        <div className="bg-[#13191c] border border-[#263339] p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#263339] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 flex items-center justify-center text-[#8b5cf6]">
                <Layers className="w-4 h-4 text-[#8b5cf6]" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-sm text-[#e1e7ec] uppercase tracking-wider m-0">
                  TIẾN ĐỘ &amp; MỐC SỰ KIỆN CHÍNH
                </h3>
                <p className="font-mono text-xs text-[#8a9ba8] m-0">
                  {selectedEventName} — Tổng hợp {eventMilestones.length} mốc tiến độ quan trọng
                </p>
              </div>
            </div>
            <Link
              href={activeEventId ? `/coordinator/events/new?eventId=${activeEventId}` : "/coordinator/events/new"}
              className="font-mono text-xs text-[#8b5cf6] hover:underline flex items-center gap-1.5 font-bold bg-[#8b5cf6]/10 px-3 py-1.5 border border-[#8b5cf6]/30 transition-all hover:bg-[#8b5cf6]/20"
            >
              <span>CHỈNH SỬA VÒNG (WIZARD)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Grid Layout of Milestone Cards */}
          {isLoadingRounds ? (
            <div className="font-mono text-xs text-[#8a9ba8] p-4">Đang tải tiến độ sự kiện...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {eventMilestones.map((ms) => {
                const isActive = ms.status === "active";
                const isDone = ms.status === "completed";

                return (
                  <div
                    key={ms.id}
                    className={`bg-[#0a0e10] p-4 border transition-all flex flex-col justify-between space-y-3 relative overflow-hidden group ${
                      isActive
                        ? "border-[#00d9ff] shadow-[0_0_15px_rgba(0,217,255,0.15)]"
                        : isDone
                        ? "border-[#10b981]/40"
                        : "border-[#263339]"
                    }`}
                  >
                    {/* Top Accent Line */}
                    <div
                      className={`absolute top-0 left-0 w-full h-[2px] ${
                        isActive ? "bg-[#00d9ff]" : isDone ? "bg-[#10b981]" : "bg-[#263339]"
                      }`}
                    ></div>

                    {/* Milestone Card Header */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-[#8b5cf6] tracking-wider uppercase flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded bg-[#8b5cf6]/20 text-[#c084fc] flex items-center justify-center text-[9px]">
                            {ms.stepNumber}
                          </span>
                          <span>{ms.categoryTag}</span>
                        </span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 font-bold ${ms.badgeBg}`}>
                          {ms.badgeText}
                        </span>
                      </div>

                      <h4 className="font-mono font-bold text-sm text-[#e1e7ec] pt-1">{ms.title}</h4>
                    </div>

                    {/* Sub-dates Box inside the Card */}
                    <div className="bg-[#13191c] p-2.5 border border-[#263339] space-y-1.5 font-mono text-xs">
                      {ms.submissionStart && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#8a9ba8] flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#00d9ff]" /> Nộp bài:
                          </span>
                          <span className="text-[#e1e7ec] font-bold">
                            {formatDateStr(ms.submissionStart)} — {formatDateStr(ms.submissionEnd)}
                          </span>
                        </div>
                      )}

                      {ms.scoringStart && (
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#263339]/60">
                          <span className="text-[#8a9ba8] flex items-center gap-1">
                            <Activity className="w-3 h-3 text-[#10b981]" /> Chấm điểm:
                          </span>
                          <span className="text-[#10b981] font-bold">
                            {formatDateStr(ms.scoringStart)} — {formatDateStr(ms.scoringEnd)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
