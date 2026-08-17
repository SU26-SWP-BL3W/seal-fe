"use client";

import { useMemo, useState } from "react";
import { useEventDetail, useEventRounds } from "@/repositories/eventsRepository";
import { extractTrackNames } from "./eventsMetadata";

export type RoundStatus = "past" | "current" | "upcoming";

export interface RoundSummary {
  id: string;
  roundNumber: number;
  roundName: string;
  registrationDate?: string;
  startDate: string;
  endDate: string;
  submissionDeadline?: string;
  evaluationEndDate?: string;
  resultAnnouncementDate?: string;
  appealDeadline?: string;
  description: string;
  deliverables?: string;
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

/** Chi tiết 1 sự kiện từ Real API Backend PostgreSQL qua API. */
export function useEventDetailViewModel(eventId: string) {
  const { data: realEvent, isLoading: loadingEvent, refetch: refetchEvent } = useEventDetail(eventId);
  const { data: realRounds = [], isLoading: loadingRounds, refetch: refetchRounds } = useEventRounds(eventId);
  const [now] = useState(() => Date.now());

  const event = useMemo(() => {
    if (!realEvent) return null;
    const ev: any = realEvent;

    return {
      id: ev.id || ev.Id || ev.eventId || ev.EventId || eventId,
      eventName: ev.eventName || ev.EventName || "Sự kiện Hackathon",
      season: ev.season || ev.Season || "Mùa Giải",
      year: Number(ev.year || ev.Year || new Date().getFullYear()),
      tagline: ev.tagline || ev.Tagline || ev.description || ev.Description || "Sự kiện cuộc thi RBL trên hệ thống SEAL",
      description: ev.description || ev.Description || "",
      startDate: ev.startDate || ev.StartDate || "",
      endDate: ev.endDate || ev.EndDate || "",
      registrationStartDate: ev.registrationStartDate || ev.RegistrationStartDate || ev.startDate || "",
      registrationEndDate: ev.registrationEndDate || ev.RegistrationEndDate || ev.endDate || "",
      maxTeams: Number(ev.maxTeams || ev.MaxTeams || 50),
      teamCount: Number(ev.teamCount || ev.TeamCount || 0),
      prizes: Array.isArray(ev.prizes || ev.Prizes)
        ? (ev.prizes || ev.Prizes).map((p: any) => ({
            id: p.id || p.Id || "",
            prizeName: p.prizeName || p.PrizeName || "",
            value: p.value || p.Value || "",
            quantity: Number(p.quantity ?? p.Quantity ?? 1),
          }))
        : [],
      tracks: extractTrackNames(ev),
    };
  }, [realEvent, eventId]);

  const rounds: RoundSummary[] = useMemo(() => {
    if (!event) return [];

    const result: RoundSummary[] = [];

    // Vòng 0: Giai đoạn đăng ký (từ registrationStartDate đến registrationEndDate)
    if (event.registrationStartDate || event.startDate) {
      const regStart = event.registrationStartDate || event.startDate;
      const regEnd = event.registrationEndDate || event.startDate;
      result.push({
        id: "reg-phase",
        roundNumber: 0,
        roundName: "Mở Cổng Nhận Hồ Sơ Đội Thi",
        startDate: regStart,
        endDate: regEnd,
        submissionDeadline: regEnd,
        evaluationEndDate: event.startDate || regEnd,
        resultAnnouncementDate: event.startDate || regEnd,
        appealDeadline: event.startDate || regEnd,
        description: "Mở cổng nhận hồ sơ thành lập Đội thi (3-5 thành viên) và ghi danh chính thức với Ban Tổ Chức.",
        deliverables: "Hồ sơ đăng ký đội thi (3-5 thành viên) & thẻ sinh viên hợp lệ.",
        status: computeRoundStatus(regStart, regEnd, now),
      });
    }

    if (Array.isArray(realRounds) && realRounds.length > 0) {
      const fetchedRounds: RoundSummary[] = realRounds.map((r: any, idx: number) => ({
        id: r.id || r.Id || r.roundId || r.RoundId || `rnd-${idx + 1}`,
        roundNumber: Number(r.roundNumber || r.RoundNumber || idx + 1),
        roundName: r.roundName || r.RoundName || `Vòng ${idx + 1}`,
        startDate: r.startDate || r.StartDate || event.startDate,
        endDate: r.endDate || r.EndDate || event.endDate,
        submissionDeadline: r.submissionDeadline || r.SubmissionDeadline || r.endDate || event.endDate,
        evaluationEndDate: r.evaluationEndDate || r.EvaluationEndDate || r.endDate || event.endDate,
        resultAnnouncementDate: r.resultAnnouncementDate || r.ResultAnnouncementDate || r.endDate || event.endDate,
        appealDeadline: r.appealDeadline || r.AppealDeadline || r.endDate || event.endDate,
        description: r.description || r.Description || "Hoàn thiện sản phẩm theo yêu cầu tiêu chí chấm thi của Hạng mục.",
        deliverables: r.deliverables || "Mã nguồn, Slide báo cáo, Video demo.",
        status: computeRoundStatus(r.startDate || r.StartDate || event.startDate, r.endDate || r.EndDate || event.endDate, now),
      }));

      result.push(...fetchedRounds);
    } else if (event.startDate && event.endDate) {
      // Nếu chưa tạo vòng thi chi tiết trong DB, hiển thị vòng thi đấu chính thức theo ngày của sự kiện
      result.push({
        id: "main-round",
        roundNumber: 1,
        roundName: "Giai Đoạn Thi Đấu & Phát Triển Giải Pháp",
        startDate: event.startDate,
        endDate: event.endDate,
        submissionDeadline: event.endDate,
        evaluationEndDate: event.endDate,
        resultAnnouncementDate: event.endDate,
        appealDeadline: event.endDate,
        description: "Các đội thi hoàn thiện mã nguồn, sản phẩm thử nghiệm và chuẩn bị báo cáo thuyết trình.",
        deliverables: "Mã nguồn, Slide thuyết trình & Video demo.",
        status: computeRoundStatus(event.startDate, event.endDate, now),
      });
    }

    return result;
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
    prizes: event?.prizes ?? [],
    deadline: currentRound?.endDate ?? null,
    deadlineRoundName: currentRound?.roundName ?? null,
    refetch: () => {
      refetchEvent();
      refetchRounds();
    },
  };
}
