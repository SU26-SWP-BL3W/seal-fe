import { useState, useMemo } from "react";
import { useEvents } from "@/repositories/eventsRepository";
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
}

export function useLeaderboardViewModel(eventId?: string) {
  const { data: eventsList = [] } = useEvents();
  const isEventScoped = Boolean(eventId && eventId !== "all");
  const [selectedEventId, setSelectedEventId] = useState<string>(eventId || "all");

  const event = {
    id: eventId || "event-seal-2026",
    eventName: "SEAL Hackathon 2026",
    season: "Mùa Hè",
    totalPrizeVnd: 200000000,
  };

  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const [selectedRound, setSelectedRound] = useState<string>("all");

  const realResults: TableTeam[] = [];

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
      prizeTitle: (idx + 1) === 1 ? "QUÁN QUÂN" : (idx + 1) === 2 ? "Á QUÂN 1" : "Á QUÂN 2",
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
