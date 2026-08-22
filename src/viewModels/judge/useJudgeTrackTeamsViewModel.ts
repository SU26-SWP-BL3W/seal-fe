import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useGetSubmitResultsByTrack } from "@/repositories/submitResultsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { useGetScoresByEventRole } from "@/repositories/scoresRepository";
import { usePagination } from "@/hooks/usePagination";

export function useJudgeTrackTeamsViewModel() {
  const params = useParams();
  const trackId = (params?.trackId as string) || "";
  const { user, activeRole } = useAuth();
  const eventId = activeRole?.eventId || activeRole?.EventId || "";

  const { data: tracks = [] } = useGetTracksByEvent(eventId || undefined);
  const currentTrack = tracks.find((t) => (t.id || t.Id) === trackId);
  const trackName = currentTrack?.trackName || (currentTrack as { TrackName?: string })?.TrackName || "Hạng mục chuyên môn";

  const { data: rawSubmissions = [], isLoading: isLoadingSubs } = useGetSubmitResultsByTrack(trackId, eventId);
  const submissions = useMemo(() => {
    return Array.isArray(rawSubmissions) ? rawSubmissions : [];
  }, [rawSubmissions]);

  const pagination = usePagination(submissions, 8);

  const eventRoleId = activeRole?.id || activeRole?.eventRoleId || "";

  const { data: myScores = [] } = useGetScoresByEventRole(eventRoleId || undefined);
  const submittedIds = useMemo(
    () => new Set(myScores.filter((s) => s.isSubmitted).map((s) => s.submitResultId)),
    [myScores],
  );

  const evaluatedCount = submissions.filter((s: { id?: string; Id?: string }) =>
    submittedIds.has(s.id || s.Id || ""),
  ).length;
  const pendingCount = submissions.length - evaluatedCount;

  return {
    state: {
      trackId,
      eventId,
      trackName,
      isLoadingSubs,
      evaluatedCount,
      pendingCount,
      submittedIds,
    },
    data: {
      currentTrack,
      submissions,
      myScores,
    },
    pagination,
  };
}
