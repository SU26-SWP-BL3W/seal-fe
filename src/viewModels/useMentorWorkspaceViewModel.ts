"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useGetTracksByEvent, type TrackWithStaffModel } from "@/repositories/tracksRepository";
import {
  useGetSubmitResultsByTrack,
  useMentorFeedbacks,
  useCreateMentorFeedback,
  useDeleteMentorFeedback,
  type SubmitResultListItem,
} from "@/repositories/submitResultsRepository";
import { useGetTeamsByEvent, useGetTeamById, type TeamListItem } from "@/repositories/teamsRepository";

export function useMentorWorkspaceViewModel() {
  const { user, activeRole } = useAuth();
  const eventId = activeRole?.eventId || activeRole?.EventId || "";
  const userId = user?.userId || user?.UserID || user?.id || "";

  // 1. Fetch all tracks for current event
  const { data: tracksData, isLoading: isLoadingTracks, refetch: refetchTracks } = useGetTracksByEvent(eventId || undefined);
  const allTracks: TrackWithStaffModel[] = Array.isArray(tracksData) ? tracksData : [];

  // Filter tracks assigned to current mentor
  const myTracks = useMemo(() => {
    if (!userId) return allTracks;
    return allTracks.filter((t) => {
      const mentors = t.mentors || t.Mentors || [];
      return mentors.some((m) => (m.id || m.Id) === userId);
    });
  }, [allTracks, userId]);

  // Selected Track ID state
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const activeTrackId = selectedTrackId || myTracks[0]?.id || myTracks[0]?.Id || "";

  // 2. Fetch Teams for current event
  const { data: teamsData = [], isLoading: isLoadingTeams, refetch: refetchTeams } = useGetTeamsByEvent(eventId);

  // 3. Fetch Submissions for active track
  const {
    data: submissions = [],
    isLoading: isLoadingSubs,
    refetch: refetchSubmissions,
  } = useGetSubmitResultsByTrack(activeTrackId, eventId);

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
    return teamsData.filter((t) => (t.trackId || t.TrackId) === activeTrackId);
  }, [teamsData, activeTrackId]);

  // Combined track stats for M1
  const trackStatsMap = useMemo(() => {
    const map = new Map<string, { totalTeams: number; submissionCount: number }>();
    allTracks.forEach((t) => {
      const tid = (t.id || t.Id) as string;
      if (!tid) return;
      const teams = teamsData.filter((tm) => (tm.trackId || tm.TrackId) === tid);
      map.set(tid, { totalTeams: teams.length, submissionCount: 0 });
    });
    return map;
  }, [allTracks, teamsData]);

  // Overall counts for top HUD in M1
  const totalTeamsCount = teamsData.length;
  const totalSubmissionsCount = submissions.length;

  return {
    eventId,
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
