import { useEvents } from "@/repositories/eventsRepository";

export interface JudgeTrackItem {
  eventId: string;
  eventName: string;
  season: string;
  roundName: string;
  trackName: string;
  trackId: string;
  totalSubmissions: number;
  scoredSubmissions: number;
  pendingSubmissions: number;
  status: string;
}

export function useMyAssignedJudgeTracks() {
  const { data: rawEvents, isLoading } = useEvents();

  const events = (Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data) || [];
  const eventsList = Array.isArray(events) ? events : [];

  const assignedTracks: JudgeTrackItem[] = [];

  eventsList.forEach((ev: any) => {
    const eId = ev.id || ev.Id || ev.eventId || ev.EventId;
    const eName = ev.eventName || ev.EventName || "Sự kiện";
    const eSeason = ev.season || ev.Season || "Mùa giải";
    const tracks = ev.tracks || ev.Tracks || [];

    if (Array.isArray(tracks)) {
      tracks.forEach((track: string, idx: number) => {
        assignedTracks.push({
          eventId: eId,
          eventName: eName,
          season: eSeason,
          roundName: "Vòng 2: Bán Kết",
          trackName: track,
          trackId: `track-j-${idx + 1}`,
          totalSubmissions: 0,
          scoredSubmissions: 0,
          pendingSubmissions: 0,
          status: "PENDING",
        });
      });
    }
  });

  return {
    assignedTracks,
    isLoading,
  };
}
