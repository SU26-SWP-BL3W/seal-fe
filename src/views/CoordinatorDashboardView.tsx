"use client";

import React, { useState, useEffect } from "react";
import apiClient from "@/models/apiClient";
import { useMyEvents, eventsRepository, type MyEventModel } from "@/repositories/eventsRepository";
import { useGetRoundsByEvent } from "@/repositories/events/roundsRepository";
import { useGetPendingTeams } from "@/repositories/teamsRepository";
import { useGetUsers } from "@/repositories/usersRepository";
import {
  Layers,
  ChevronDown,
  ArrowRight,
  Activity,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge, Card, Button } from "@/components/ui";

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
  const { data: pendingTeams = [] } = useGetPendingTeams();
  const { data: pendingUsersData } = useGetUsers({ isApproved: false });
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
    badgeTone: "neutral" | "success" | "info" | "warning";
  }

  const eventMilestones: EventMilestone[] = [];

  // Milestone 1: Mở đăng ký đội thi
  let regStatus: "completed" | "active" | "upcoming" = "upcoming";
  let regBadgeText = "Sắp tới";
  let regBadgeTone: EventMilestone["badgeTone"] = "neutral";
  if (regStart && regEnd) {
    const sDate = new Date(regStart);
    const eDate = new Date(regEnd);
    if (now > eDate) {
      regStatus = "completed";
      regBadgeText = "Đã hoàn thành";
      regBadgeTone = "success";
    } else if (now >= sDate && now <= eDate) {
      regStatus = "active";
      regBadgeText = "Đang mở đăng ký";
      regBadgeTone = "info";
    }
  }

  eventMilestones.push({
    id: "ms-reg",
    stepNumber: 1,
    title: "Mở đăng ký đội thi",
    categoryTag: "Thủ tục ban đầu",
    submissionStart: regStart || "",
    submissionEnd: regEnd || "",
    status: regStatus,
    badgeText: regBadgeText,
    badgeTone: regBadgeTone,
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
      let roundBadgeText = "Sắp tới";
      let roundBadgeTone: EventMilestone["badgeTone"] = "neutral";

      const checkEnd = scEnd ? new Date(scEnd) : (rEnd ? new Date(rEnd) : null);
      const checkStart = rStart ? new Date(rStart) : null;

      if (checkEnd && now > checkEnd) {
        roundStatus = "completed";
        roundBadgeText = "Đã hoàn thành";
        roundBadgeTone = "success";
      } else if (checkStart && now >= checkStart && checkEnd && now <= checkEnd) {
        roundStatus = "active";
        roundBadgeText = "Đang diễn ra";
        roundBadgeTone = "info";
      }

      eventMilestones.push({
        id: `ms-round-${idx}`,
        stepNumber: eventMilestones.length + 1,
        title: roundName,
        categoryTag: `Vòng thi ${roundNum}`,
        submissionStart: rStart || "",
        submissionEnd: rEnd || "",
        scoringStart: scStart || "",
        scoringEnd: scEnd || "",
        status: roundStatus,
        badgeText: roundBadgeText,
        badgeTone: roundBadgeTone,
      });
    });
  }

  // Final Milestone: Phúc khảo & Trao giải Gala
  eventMilestones.push({
    id: "ms-final",
    stepNumber: eventMilestones.length + 1,
    title: "Phúc khảo & trao giải",
    categoryTag: "Tổng kết sự kiện",
    submissionStart: selectedEvent?.endDate || (selectedEvent as any)?.EndDate || "",
    status: isSelectedEventPublished ? "completed" : "upcoming",
    badgeText: isSelectedEventPublished ? "Đã công bố" : "Chờ công bố",
    badgeTone: isSelectedEventPublished ? "success" : "warning",
  });

  const pendingProfilesCount = Array.isArray((pendingUsersData as any)?.items)
    ? (pendingUsersData as any).items.length
    : Array.isArray((pendingUsersData as any)?.data?.items)
    ? (pendingUsersData as any).data.items.length
    : 0;

  return (
    <PageShell className="max-w-[1600px]">
      <PageHeader
        title="Tổng quan sự kiện"
        description="Theo dõi tiến độ, số liệu và mốc quan trọng của sự kiện đang phụ trách."
        actions={
          assignedEvents.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px]">
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] px-4 py-2 pr-10 text-sm text-[var(--text-primary)] focus:border-[var(--accent-coordinator)] focus:outline-none"
                >
                  {assignedEvents.map((ev, idx) => {
                    const id = ev.id || ev.Id || ev.eventId || ev.EventId || `ev-${idx}`;
                    const name = ev.eventName || ev.EventName || "Sự kiện";
                    const seasonStr = ev.season || ev.Season || "Summer";
                    const yearNum = ev.year || ev.Year || 2026;
                    return (
                      <option key={id} value={id}>
                        {name} ({seasonStr} {yearNum})
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              </div>
              {selectedEvent && (
                <Badge tone={isSelectedEventPublished ? "success" : "warning"}>
                  {isSelectedEventPublished ? "Đã công bố" : "Bản nháp"}
                </Badge>
              )}
            </div>
          ) : undefined
        }
      />

      {isLoading ? (
        <p className="text-sm text-[var(--text-muted)]">Đang tải danh sách sự kiện...</p>
      ) : assignedEvents.length === 0 ? (
        <Card className="p-6 text-sm text-[var(--color-warning)]">
          Bạn chưa được phân công phụ trách sự kiện nào.
        </Card>
      ) : (
        <div className="space-y-6">
          {(pendingTeams.length > 0 || pendingProfilesCount > 0) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {pendingTeams.length > 0 && (
                <Link href="/coordinator/teams">
                  <Card className="flex items-center justify-between border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5 p-4 transition-colors hover:border-[var(--color-warning)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Đội chờ duyệt</p>
                      <p className="text-xs text-[var(--text-muted)]">Cần phê duyệt đăng ký</p>
                    </div>
                    <span className="font-display text-2xl font-semibold text-[var(--color-warning)]">{pendingTeams.length}</span>
                  </Card>
                </Link>
              )}
              {pendingProfilesCount > 0 && (
                <Link href="/coordinator/profiles">
                  <Card className="flex items-center justify-between border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5 p-4 transition-colors hover:border-[var(--color-warning)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Hồ sơ chờ duyệt</p>
                      <p className="text-xs text-[var(--text-muted)]">Sinh viên cần xét duyệt</p>
                    </div>
                    <span className="font-display text-2xl font-semibold text-[var(--color-warning)]">{pendingProfilesCount}</span>
                  </Card>
                </Link>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Tổng số đội thi"
              value={eventTeamsCount}
              subtext="Sĩ số đội đã duyệt"
              accent="var(--accent-coordinator)"
            />
            <StatCard
              label="Bài nộp chờ chấm"
              value={eventPendingSubmissions}
              subtext="Cần tiến độ chấm điểm"
              accent="var(--color-warning)"
            />
            <StatCard
              label="Phúc khảo chờ xử lý"
              value={String(eventPendingAppeals).padStart(2, "0")}
              subtext="Khiếu nại chưa phản hồi"
              accent="var(--color-danger)"
            />
            <StatCard
              label="Trạng thái sự kiện"
              value={isSelectedEventPublished ? "Đã công bố" : "Đang chỉnh sửa"}
              subtext={`${selectedEventSeason} ${selectedEventYear}`}
              accent={isSelectedEventPublished ? "var(--color-success)" : "var(--color-warning)"}
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <Link href="/coordinator/teams">
              <Button variant="ghost" accent="coordinator" className="text-xs">Quản lý đội</Button>
            </Link>
            <Link href="/coordinator/publish-results">
              <Button variant="ghost" accent="coordinator" className="text-xs">Soát xét kết quả</Button>
            </Link>
            <Link href="/coordinator/appeals">
              <Button variant="ghost" accent="coordinator" className="text-xs">Xử lý phúc khảo</Button>
            </Link>
          </div>

          <Card className="space-y-5 p-6">
            <div className="flex flex-col justify-between gap-3 border-b border-[var(--border-muted)] pb-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--accent-coordinator)]/30 bg-[var(--accent-coordinator)]/10">
                  <Layers className="h-4 w-4 text-[var(--accent-coordinator)]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">Tiến độ & mốc sự kiện</h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {selectedEventName} — {eventMilestones.length} mốc
                  </p>
                </div>
              </div>
              <Link href={activeEventId ? `/coordinator/events/new?eventId=${activeEventId}` : "/coordinator/events/new"}>
                <Button variant="ghost" accent="coordinator" className="text-xs">
                  Chỉnh sửa vòng <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {isLoadingRounds ? (
              <p className="text-sm text-[var(--text-muted)]">Đang tải tiến độ sự kiện...</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {eventMilestones.map((ms) => (
                  <div
                    key={ms.id}
                    className={`rounded-lg border bg-[var(--bg-input)]/50 p-4 ${
                      ms.status === "active"
                        ? "border-[var(--accent-primary)]/50"
                        : ms.status === "completed"
                        ? "border-[var(--color-success)]/40"
                        : "border-[var(--border-muted)]"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-[var(--accent-coordinator)]/20 text-[10px] font-medium text-[var(--accent-coordinator)]">
                          {ms.stepNumber}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">{ms.categoryTag}</span>
                      </div>
                      <Badge tone={ms.badgeTone}>{ms.badgeText}</Badge>
                    </div>

                    <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">{ms.title}</h3>

                    <div className="space-y-1.5 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-2.5 text-xs">
                      {ms.submissionStart && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 text-[var(--text-muted)]">
                            <Calendar className="h-3 w-3" /> Nộp bài
                          </span>
                          <span className="font-mono text-[var(--text-primary)]">
                            {formatDateStr(ms.submissionStart)} — {formatDateStr(ms.submissionEnd)}
                          </span>
                        </div>
                      )}
                      {ms.scoringStart && (
                        <div className="flex items-center justify-between gap-2 border-t border-[var(--border-muted)]/60 pt-1.5">
                          <span className="flex items-center gap-1 text-[var(--text-muted)]">
                            <Activity className="h-3 w-3" /> Chấm điểm
                          </span>
                          <span className="font-mono text-[var(--color-success)]">
                            {formatDateStr(ms.scoringStart)} — {formatDateStr(ms.scoringEnd)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </PageShell>
  );
};
