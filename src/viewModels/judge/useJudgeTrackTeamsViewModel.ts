import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetSubmitResultsByTrack } from "@/repositories/submitResultsRepository";
import { useGetScoresByEventRole } from "@/repositories/scoresRepository";
import { usePagination } from "@/hooks/usePagination";
import { useMyAssignedJudgeTracks } from "@/viewModels/judge/useMyAssignedJudgeTracks";

const normalizeId = (id?: string | null) => (id || "").replace(/-/g, "").toLowerCase();

export function useJudgeTrackTeamsViewModel() {
  const params = useParams();
  const router = useRouter();
  const trackIdFromUrl = (params?.trackId as string) || "";

  const { assignedTracks, isLoading: loadingTracks } = useMyAssignedJudgeTracks();

  const assignedTrack = useMemo(() => {
    const urlNorm = normalizeId(trackIdFromUrl);
    if (urlNorm) {
      const match = assignedTracks.find((t) => normalizeId(t.trackId) === urlNorm);
      if (match) return match;
    }
    return assignedTracks[0];
  }, [assignedTracks, trackIdFromUrl]);

  const trackId = assignedTrack?.trackId || trackIdFromUrl;
  const eventId = assignedTrack?.eventId || "";
  const eventRoleId = assignedTrack?.eventRoleId || "";
  const trackName = assignedTrack?.trackName || "Hạng mục chuyên môn";

  // Bỏ qua trackId URL cũ — dùng track mới nhất được phân công
  useEffect(() => {
    if (loadingTracks || assignedTracks.length === 0) return;
    const resolved = assignedTrack;
    if (!resolved?.trackId) return;
    if (trackIdFromUrl && normalizeId(trackIdFromUrl) !== normalizeId(resolved.trackId)) {
      router.replace(`/judge/tracks/${resolved.trackId}/teams`);
    }
  }, [loadingTracks, assignedTracks, assignedTrack, trackIdFromUrl, router]);

  const { data: rawSubmissions = [], isLoading: isLoadingSubs } = useGetSubmitResultsByTrack(
    trackId || undefined,
    eventId || undefined,
  );
  const submissions = useMemo(() => {
    return Array.isArray(rawSubmissions) ? rawSubmissions : [];
  }, [rawSubmissions]);

  const pagination = usePagination(submissions, 8);

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
      isLoadingSubs: loadingTracks || isLoadingSubs,
      evaluatedCount,
      pendingCount,
      submittedIds,
    },
    data: {
      currentTrack: assignedTrack,
      submissions,
      myScores,
    },
    pagination,
  };
}
