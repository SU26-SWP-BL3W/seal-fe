"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useGetTracksByEvent, type TrackWithStaffModel } from "@/repositories/tracksRepository";
import { useGetMyEventRoles } from "@/repositories/events/eventRolesRepository";
import {
  useGetSubmitResultsByTrack,
  useMentorFeedbacks,
  useCreateMentorFeedback,
  useDeleteMentorFeedback,
  type SubmitResultListItem,
} from "@/repositories/submitResultsRepository";
import { useGetTeamsByEvent, useGetTeamById, type TeamListItem } from "@/repositories/teamsRepository";

const normalizeId = (id?: string | null) => (id || "").replace(/-/g, "").toLowerCase();

export function useMentorWorkspaceViewModel() {
  const searchParams = useSearchParams();
  const queryEventId = searchParams.get("eventId") || "";
  const queryTrackId = searchParams.get("trackId") || "";

  const { user, activeRole } = useAuth();
  const userId = user?.userId || user?.UserID || user?.id || (user as any)?.Id || "";

  // 1. Fetch user's event roles from DB to get all assigned mentor tracks
  const { data: myEventRoles = [] } = useGetMyEventRoles(userId || undefined);

  const mentorRoles = useMemo(() => {
    return (Array.isArray(myEventRoles) ? myEventRoles : []).filter(
      (r: any) => (r.roleName || r.RoleName) === "Mentor"
    );
  }, [myEventRoles]);

  // Determine active eventId: priority searchParam > activeRole > mentorRoles[0]
  const resolvedEventId = useMemo(() => {
    if (queryEventId) return queryEventId;
    if (activeRole?.eventId || (activeRole as any)?.EventId) return activeRole.eventId || (activeRole as any).EventId;
    const firstMentorEvent = mentorRoles[0]?.eventId || mentorRoles[0]?.EventId;
    return firstMentorEvent || "";
  }, [queryEventId, activeRole, mentorRoles]);

  // 2. Fetch all tracks for current event
  const { data: tracksData, isLoading: isLoadingTracks, refetch: refetchTracks } = useGetTracksByEvent(
    resolvedEventId || undefined
  );
  const allTracks: TrackWithStaffModel[] = Array.isArray(tracksData) ? tracksData : [];

  // Filter tracks assigned to current mentor (cả qua EventRoles DB và qua Staff mapping)
  const myTracks = useMemo(() => {
    if (!userId) return allTracks;
    const currentEventNorm = normalizeId(resolvedEventId);

    const assignedTrackIds = new Set(
      mentorRoles
        .filter((r: any) => {
          if (!currentEventNorm) return true;
          const rEvNorm = normalizeId(r.eventId || r.EventId);
          return !rEvNorm || rEvNorm === currentEventNorm;
        })
        .map((r: any) => normalizeId(r.trackId || r.TrackId))
        .filter(Boolean)
    );

    return allTracks.filter((t) => {
      const tid = normalizeId(t.id || t.Id);
      if (assignedTrackIds.has(tid)) return true;
      const mentors = t.mentors || t.Mentors || [];
      return mentors.some((m) => normalizeId(m.id || m.Id) === normalizeId(userId));
    });
  }, [allTracks, userId, mentorRoles, resolvedEventId]);

  // Selected Track ID state
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const activeTrackId =
    queryTrackId ||
    selectedTrackId ||
    myTracks[0]?.id ||
    myTracks[0]?.Id ||
    allTracks[0]?.id ||
    allTracks[0]?.Id ||
    "";

  // 3. Fetch Teams for current event
  const { data: teamsData = [], isLoading: isLoadingTeams, refetch: refetchTeams } = useGetTeamsByEvent(
    resolvedEventId || undefined
  );

  // 4. Fetch Submissions for active track
  const {
    data: submissions = [],
    isLoading: isLoadingSubs,
    refetch: refetchSubmissions,
  } = useGetSubmitResultsByTrack(activeTrackId || undefined, resolvedEventId || undefined);

  // Map of teamId -> teamName
  const teamNameById = useMemo(() => {
    const map = new Map<string, string>();
    teamsData.forEach((t: TeamListItem) => {
      const tid = (t.id || t.Id) as string;
      if (tid) map.set(tid, t.name || t.Name || "Đội thi");
    });
    return map;
  }, [teamsData]);

  // Map of teamId -> TeamListItem
  const teamById = useMemo(() => {
    const map = new Map<string, TeamListItem>();
    teamsData.forEach((t: TeamListItem) => {
      const tid = (t.id || t.Id) as string;
      if (tid) map.set(tid, t);
    });
    return map;
  }, [teamsData]);

  // Teams in the active track
  const teamsInTrack = useMemo(() => {
    if (!activeTrackId) return teamsData;
    const targetNorm = normalizeId(activeTrackId);
    return teamsData.filter((t) => normalizeId(t.trackId || t.TrackId) === targetNorm);
  }, [teamsData, activeTrackId]);

  // Combined track stats for M1
  const trackStatsMap = useMemo(() => {
    const map = new Map<string, { totalTeams: number; submissionCount: number }>();
    allTracks.forEach((t) => {
      const tid = (t.id || t.Id) as string;
      if (!tid) return;
      const tidNorm = normalizeId(tid);
      const teams = teamsData.filter((tm) => normalizeId(tm.trackId || tm.TrackId) === tidNorm);
      map.set(tid, { totalTeams: teams.length, submissionCount: 0 });
    });
    return map;
  }, [allTracks, teamsData]);

  // Overall counts for top HUD in M1
  const totalTeamsCount = teamsData.length;
  const totalSubmissionsCount = submissions.length;

  return {
    eventId: resolvedEventId,
    userId,
    myTracks,
    allTracks,
    selectedTrackId: activeTrackId,
    setSelectedTrackId,
    teams: teamsData,
    teamsInTrack,
    teamNameById,
    teamById,
    submissions,
    totalTeamsCount,
    totalSubmissionsCount,
    trackStatsMap,
    isLoading: isLoadingTracks || isLoadingTeams || isLoadingSubs,
    refetchAll: () => {
      refetchTracks();
      refetchTeams();
      refetchSubmissions();
    },
  };
}

export function useMentorSubmissionDetailViewModel(submitResultId: string | undefined, teamId: string | undefined) {
  const { data: teamDetail, isLoading: isLoadingTeam } = useGetTeamById(teamId);
  const { data: feedbacks = [], isLoading: isLoadingFeedbacks } = useMentorFeedbacks(submitResultId);
  const createFeedback = useCreateMentorFeedback();
  const deleteFeedback = useDeleteMentorFeedback();

  return {
    teamDetail,
    feedbacks,
    isLoading: isLoadingTeam || isLoadingFeedbacks,
    createFeedback,
    deleteFeedback,
  };
}
