import { useState, useMemo } from "react";
import { useEvents, useEventRounds } from "@/repositories/eventsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { useGetTeamsByEvent } from "@/repositories/teamsRepository";
import { useGetPrizesByEvent } from "@/repositories/results/prizesRepository";
import { useGetFinalResultsByRound } from "@/repositories/results/finalResultsRepository";
import { usePagination } from "@/hooks/usePagination";

export interface TableTeam {
  rank: number;
  teamCode: string;
  teamName: string;
  projectName: string;
  school: string;
  track: string;
  roundName: string;
  score: number;
  status: string;
  prizeTitle?: string;
  isAdvanced?: boolean;
}

export function useLeaderboardViewModel(eventId?: string) {
  const { data: eventsList = [] } = useEvents();
  const isEventScoped = Boolean(eventId && eventId !== "all");
  const [selectedEventId, setSelectedEventId] = useState<string>(eventId || "all");

  const effectiveEventId = isEventScoped ? eventId : selectedEventId !== "all" ? selectedEventId : (eventsList[0] ? ((eventsList[0] as any).id || (eventsList[0] as any).eventId) : undefined);

  // Truy vấn thông tin sự kiện, vòng thi, hạng mục, đội thi và giải thưởng
  const currentEventData = useMemo(() => {
    if (!effectiveEventId) return null;
    return (eventsList as any[]).find((e) => (e.id || e.Id || e.eventId || e.EventId) === effectiveEventId);
  }, [eventsList, effectiveEventId]);

  const { data: dbRounds = [] } = useEventRounds(effectiveEventId);
  const { data: dbTracks = [] } = useGetTracksByEvent(effectiveEventId);
  const { data: dbTeams = [] } = useGetTeamsByEvent(effectiveEventId);
  const { data: dbPrizes = [] } = useGetPrizesByEvent(effectiveEventId);

  const event = {
    id: effectiveEventId || "event-seal-2026",
    eventName: currentEventData?.eventName || currentEventData?.EventName || "SEAL Hackathon 2026",
    season: currentEventData?.season || currentEventData?.Season || "Mùa Hè",
    totalPrizeVnd: 200000000,
  };

  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const [selectedRound, setSelectedRound] = useState<string>("all");

  // Map tra cứu nhanh Đội thi & Giải thưởng
  const teamMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const t of dbTeams as any[]) map.set(t.id || t.Id, t);
    return map;
  }, [dbTeams]);

  const prizeMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const p of dbPrizes as any[]) map.set(p.id || p.Id, p);
    return map;
  }, [dbPrizes]);

  const trackMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const tr of dbTracks as any[]) map.set(tr.id || tr.Id, tr);
    return map;
  }, [dbTracks]);

  const roundsMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const r of dbRounds as any[]) map.set(r.id || r.Id, r);
    return map;
  }, [dbRounds]);

  const activeRoundId = useMemo(() => {
    if (selectedRound !== "all") return selectedRound;
    if (dbRounds.length > 0) return (dbRounds[0] as any).id || (dbRounds[0] as any).Id || "";
    return "";
  }, [selectedRound, dbRounds]);

  const activeTrackId = selectedTrack !== "all" ? selectedTrack : undefined;

  // Gọi API lấy kết quả đã công bố (IsPublished = true)
  const { data: rawFinalResults = [] } = useGetFinalResultsByRound(
    activeRoundId || undefined,
    { trackId: activeTrackId, pageSize: 100 }
  );

  const realResults: TableTeam[] = useMemo(() => {
    if (!rawFinalResults || rawFinalResults.length === 0) return [];

    return rawFinalResults.map((fr: any, idx: number) => {
      const team = teamMap.get(fr.teamId) || {};
      const prize = fr.prizeId ? prizeMap.get(fr.prizeId) : null;
      const track = fr.trackId ? trackMap.get(fr.trackId) : (team.trackId ? trackMap.get(team.trackId) : null);
      const round = fr.roundId ? roundsMap.get(fr.roundId) : null;

      const rank = fr.rank ?? (idx + 1);
      const score = Number(fr.finalScore || fr.FinalScore || 0);

      return {
        rank,
        teamCode: (team.id || fr.teamId || `T${idx + 1}`).slice(0, 8).toUpperCase(),
        teamName: team.name || team.teamName || `Đội #${(fr.teamId || "").slice(-4) || idx + 1}`,
        projectName: team.description || "Dự án công nghệ dự thi",
        school: team.schoolName || "FPT University",
        track: track?.trackName || track?.name || "Chung",
        roundName: round?.roundName || "Vòng Chung Kết",
        score,
        status: fr.isAdvanced ? "Thăng Hạng" : "Hoàn Thành",
        prizeTitle: prize ? prize.prizeName : undefined,
        isAdvanced: Boolean(fr.isAdvanced),
      };
    });
  }, [rawFinalResults, teamMap, prizeMap, trackMap, roundsMap]);

  const filteredResults = realResults.filter((r) => {
    if (selectedTrack !== "all" && r.track !== selectedTrack) return false;
    if (selectedRound !== "all" && !r.roundName.includes(selectedRound)) return false;
    return true;
  });

  const pagination = usePagination(filteredResults, 10);

  const topPodiumTeams = useMemo(() => {
    if (filteredResults.length === 0) return [];
    return filteredResults.slice(0, 3).map((r, idx) => ({
      eventName: event.eventName,
      season: event.season,
      teamName: r.teamName,
      projectName: r.projectName,
      school: r.school || "SEAL Candidate",
      track: r.track,
      score: r.score,
      prizeTitle: r.prizeTitle || ((idx + 1) === 1 ? "QUÁN QUÂN" : (idx + 1) === 2 ? "Á QUÂN 1" : "Á QUÂN 2"),
      prizeVnd: (idx + 1) === 1 ? 50_000_000 : (idx + 1) === 2 ? 30_000_000 : 20_000_000,
      rank: (idx + 1) as 1 | 2 | 3,
    }));
  }, [filteredResults, event.eventName, event.season]);

  return {
    state: {
      isEventScoped,
      selectedEventId,
      selectedTrack,
      selectedRound,
      event,
    },
    data: {
      eventsList,
      filteredResults,
      topPodiumTeams,
    },
    pagination,
    actions: {
      setSelectedEventId,
      setSelectedTrack,
      setSelectedRound,
    },
  };
}
