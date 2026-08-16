"use client";

import { useMemo, useState } from "react";
import { useEventDetail, useEventRounds } from "@/repositories/eventsRepository";

export type RoundStatus = "past" | "current" | "upcoming";

export interface RoundSummary {
  id: string;
  roundNumber: number;
  roundName: string;
  registrationDate?: string;
  startDate: string;
  endDate: string;
  submissionDeadline?: string;
  resultAnnouncementDate?: string;
  appealDeadline?: string;
  description: string;
  status: RoundStatus;
}

function computeRoundStatus(startIso: string, endIso: string, now: number): RoundStatus {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (isNaN(start) || isNaN(end)) return "upcoming";
  if (now < start) return "upcoming";
  if (now > end) return "past";
  return "current";
}

/** Chi tiết 1 sự kiện từ Real API Backend. */
export function useEventDetailViewModel(eventId: string) {
  const { data: realEvent, isLoading: loadingEvent } = useEventDetail(eventId);
  const { data: realRounds = [], isLoading: loadingRounds } = useEventRounds(eventId);
  const [now] = useState(() => Date.now());

  const event = useMemo(() => {
    if (!realEvent) return null;
    const ev: any = realEvent;
    return {
      id: ev.id || ev.Id || ev.eventId || ev.EventId || eventId,
      eventName: ev.eventName || ev.EventName || "Sự kiện Hackathon",
      season: ev.season || ev.Season || "Mùa Giải",
      year: Number(ev.year || ev.Year || 2026),
      tagline: ev.tagline || ev.Tagline || ev.description || ev.Description || "Sự kiện cuộc thi RBL trên hệ thống SEAL",
      description: ev.description || ev.Description || "",
      startDate: ev.startDate || ev.StartDate || "",
      endDate: ev.endDate || ev.EndDate || "",
      registrationStartDate: ev.registrationStartDate || ev.RegistrationStartDate || ev.startDate || "",
      registrationEndDate: ev.registrationEndDate || ev.RegistrationEndDate || ev.endDate || "",
      maxTeams: Number(ev.maxTeams || ev.MaxTeams || 50),
      teamCount: Number(ev.teamCount || ev.TeamCount || 0),
      totalPrizeVnd: Number(ev.totalPrizeVnd || ev.TotalPrizeVnd || 0),
      tracks: Array.isArray(ev.tracks || ev.Tracks) ? (ev.tracks || ev.Tracks) : ["RBL Project"],
    };
  }, [realEvent, eventId]);

  const rounds: RoundSummary[] = useMemo(() => {
    if (!event) return [];

    const regRound: RoundSummary = {
      id: "reg-phase",
      roundNumber: 0,
      roundName: "Mở Form Đăng Ký Đội Thi",
      startDate: event.registrationStartDate,
      endDate: event.registrationEndDate,
      description: "Mở cổng nhận hồ sơ thành lập Đội thi, mời thành viên và ghi danh chính thức với Ban Tổ Chức.",
      status: computeRoundStatus(event.registrationStartDate, event.registrationEndDate, now),
    };

    const fetchedRounds: RoundSummary[] = (realRounds || []).map((r: any, idx: number) => ({
      id: r.id || r.Id || r.roundId || r.RoundId || `rnd-${idx}`,
      roundNumber: Number(r.roundNumber || r.RoundNumber || idx + 1),
      roundName: r.roundName || r.RoundName || `Vòng ${idx + 1}`,
      startDate: r.startDate || r.StartDate || "",
      endDate: r.endDate || r.EndDate || "",
      description: r.description || r.Description || "",
      status: computeRoundStatus(r.startDate || r.StartDate || "", r.endDate || r.EndDate || "", now),
    }));

    return [regRound, ...fetchedRounds];
  }, [event, realRounds, now]);

  const currentRound = rounds.find((r) => r.status === "current") ?? null;

  return {
    isLoading: loadingEvent || loadingRounds,
    notFound: !loadingEvent && !event,
    eventName: event?.eventName ?? "",
    season: event?.season ?? "",
    year: event?.year ?? 0,
    tagline: event?.tagline ?? "",
    description: event?.description ?? "",
    tracks: event?.tracks ?? [],
    rounds,
    teamCount: event?.teamCount ?? 0,
    maxTeams: event?.maxTeams ?? 0,
    totalPrizeVnd: event?.totalPrizeVnd ?? 0,
    deadline: currentRound?.endDate ?? null,
    deadlineRoundName: currentRound?.roundName ?? null,
  };
}
