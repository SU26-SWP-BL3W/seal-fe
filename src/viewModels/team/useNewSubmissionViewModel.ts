import { useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useMySubmissions } from "@/repositories/submitResultsRepository";
import { useMyTeam } from "@/repositories/teamsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { useEventRounds } from "@/repositories/eventsRepository";
import type { TrackItem, SubmissionItem } from "@/viewModels/team/teamTypes";

export function useNewSubmissionViewModel() {
  const { activeRole } = useAuth();
  const eventIdFromRole =
    (activeRole as { eventId?: string; EventId?: string } | null)?.eventId ||
    (activeRole as { EventId?: string } | null)?.EventId ||
    "";
  const { data: realTeam, isLoading } = useMyTeam(eventIdFromRole || undefined);
  const team = realTeam;
  const eventId = (team as any)?.EventId || (team as any)?.eventId || eventIdFromRole;
  const teamId = (team as any)?.TeamId || (team as any)?.id || "";
  const teamTrackId = (team as any)?.TrackId || (team as any)?.trackId || "";
  const { data: tracks = [] } = useGetTracksByEvent(eventId);
  const { data: rounds = [] } = useEventRounds(eventId);
  const { data: existingSubs = [] } = useMySubmissions();
  // Chọn vòng đang MỞ (now nằm trong [startDate, endDate]), không phải luôn lấy vòng
  // cuối cùng — sự kiện có ≥2 vòng thì vòng cuối thường chưa mở, khiến nộp bài luôn bị
  // BE từ chối dù vòng trước đó đang mở thật.
  const now = new Date();
  const openRound = (rounds as any[]).find((r) => {
    const start = r.startDate || r.StartDate;
    const end = r.endDate || r.EndDate;
    if (!start || !end) return false;
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return startTime <= now.getTime() && now.getTime() <= endTime;
  });
  const roundId = openRound
    ? (openRound.id || openRound.Id || "")
    : rounds.length
      ? (rounds[rounds.length - 1].id || rounds[rounds.length - 1].Id || "")
      : "";

  const availableTracks: TrackItem[] = (tracks as any[])
    .filter((t) => !teamTrackId || (t.id || t.Id) === teamTrackId)
    .map((t: any) => ({
      id: t.id || t.Id,
      trackName: t.trackName || t.TrackName || "",
      description: t.description || t.Description || "",
      roundId,
      templateId: t.templateId || t.TemplateId || null,
    }));

  const submissionsFromServer: Record<string, SubmissionItem> = useMemo(() => {
    const map: Record<string, SubmissionItem> = {};
    for (const raw of existingSubs as any[]) {
      const trackId = raw.trackId || raw.TrackId;
      if (!trackId) continue;
      const repo = raw.repoUrl || raw.RepoUrl || raw.submissionUrl || raw.SubmissionUrl || "";
      const demo = raw.demoUrl || raw.DemoUrl || "";
      const slide = raw.slideUrl || raw.SlideUrl || "";
      map[trackId] = {
        id: raw.id || raw.Id || "",
        teamId: raw.teamId || raw.TeamId || "",
        roundId: "",
        roundName: "Vòng hiện tại",
        trackId,
        trackName: raw.trackName || raw.TrackName || "",
        submissionUrl: repo,
        description: JSON.stringify({
          links: [
            { type: "github", label: "GitHub / GitLab repo", url: repo, required: true },
            { type: "deployed_url", label: "Live demo", url: demo, required: true },
            { type: "slides", label: "Slides", url: slide, required: true },
          ],
          notes: "",
        }),
        teamName: raw.teamName || raw.TeamName || "",
        createdTime: raw.createdTime || raw.CreatedTime || "",
        isActive: raw.isActive !== false && raw.IsActive !== false,
        isEliminated: false,
      };
    }
    return map;
  }, [existingSubs]);

  const [localOverrides, setLocalOverrides] = useState<Record<string, SubmissionItem>>({});
  const submissions = { ...submissionsFromServer, ...localOverrides };

  const handleTrackSubmitSuccess = (trackId: string, updatedSub: SubmissionItem) => {
    setLocalOverrides((prev) => ({
      ...prev,
      [trackId]: updatedSub,
    }));
  };

  const teamStatus = String((team as { status?: string; Status?: string } | undefined)?.status
    || (team as { Status?: string } | undefined)?.Status || "");
  const canSubmit = teamStatus === "Registered" || teamStatus === "Approved";

  return {
    state: {
      team,
      eventId,
      teamId,
      roundId,
      canSubmit,
      isLoading,
    },
    data: {
      availableTracks,
      submissions,
      tracks,
      rounds,
    },
    actions: {
      handleTrackSubmitSuccess,
    },
  };
}
