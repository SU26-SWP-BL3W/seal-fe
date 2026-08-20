"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { useAuth } from "@/providers/AuthProvider";
import { useGetTracksByEvent, type TrackWithStaffModel } from "@/repositories/tracksRepository";
import {
  useGetMyEventRoles,
  useGetEventRolesByEvent,
  EventRoleType,
} from "@/repositories/events/eventRolesRepository";
import {
  useGetSubmitResultsByTrack,
  useMentorFeedbacks,
  useCreateMentorFeedback,
  useDeleteMentorFeedback,
  fetchSubmitResultsByTrack,
  type SubmitResultListItem,
} from "@/repositories/submitResultsRepository";
import { useGetTeamsByEvent, useGetTeamById, type TeamListItem } from "@/repositories/teamsRepository";

const normalizeId = (id?: string | null) => (id || "").replace(/-/g, "").toLowerCase();

export interface MentorTrackStats {
  totalTeams: number;
  submissionCount: number;
  teamsWithSubmission: number;
  /** % đội đã có bài nộp trong hạng mục (0–100). */
  progressPct: number;
  mentorNames: string[];
}

export function useMentorWorkspaceViewModel() {
  const searchParams = useSearchParams();
  const queryEventId = searchParams.get("eventId") || "";
  const queryTrackId = searchParams.get("trackId") || "";

  const { user, activeRole } = useAuth();
  const userId = user?.userId || user?.UserID || user?.id || (user as any)?.Id || "";

  const { data: myEventRoles = [] } = useGetMyEventRoles(userId || undefined);

  const mentorRoles = useMemo(() => {
    return (Array.isArray(myEventRoles) ? myEventRoles : []).filter(
      (r: any) => (r.roleName || r.RoleName) === "Mentor"
    );
  }, [myEventRoles]);

  const resolvedEventId = useMemo(() => {
    if (queryTrackId) {
      const mentorForTrack = mentorRoles.find((r: any) => {
        const rTrack = normalizeId(r.trackId || r.TrackId);
        const qTrack = normalizeId(queryTrackId);
        return rTrack && qTrack && rTrack === qTrack;
      });
      if (mentorForTrack?.eventId || mentorForTrack?.EventId) {
        return mentorForTrack.eventId || mentorForTrack.EventId || "";
      }
    }
    if (queryEventId) return queryEventId;
    const firstMentorEvent = mentorRoles[0]?.eventId || mentorRoles[0]?.EventId;
    if (firstMentorEvent) return firstMentorEvent;
    if (activeRole?.eventId || (activeRole as any)?.EventId) {
      return activeRole?.eventId || (activeRole as any)?.EventId || "";
    }
    return "";
  }, [queryEventId, queryTrackId, activeRole, mentorRoles]);

  const { data: tracksData, isLoading: isLoadingTracks, refetch: refetchTracks } = useGetTracksByEvent(
    resolvedEventId || undefined
  );
  const allTracks: TrackWithStaffModel[] = Array.isArray(tracksData) ? tracksData : [];

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

  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const activeTrackId =
    queryTrackId ||
    selectedTrackId ||
    myTracks[0]?.id ||
    myTracks[0]?.Id ||
    "";

  const { data: teamsData = [], isLoading: isLoadingTeams, refetch: refetchTeams } = useGetTeamsByEvent(
    resolvedEventId || undefined
  );

  const {
    data: submissions = [],
    isLoading: isLoadingSubs,
    refetch: refetchSubmissions,
  } = useGetSubmitResultsByTrack(activeTrackId || undefined, resolvedEventId || undefined);

  // EventRoles Mentor của event — nguồn đúng để liệt kê cố vấn theo track (không lẫn Judge).
  const { data: eventRolesPage, isLoading: isLoadingEventRoles } = useGetEventRolesByEvent(
    resolvedEventId || undefined,
    { pageSize: 200, roleName: EventRoleType.Mentor }
  );
  const eventMentorRoles = useMemo(() => {
    const raw =
      (eventRolesPage as any)?.data ??
      (eventRolesPage as any)?.items ??
      eventRolesPage ??
      [];
    const list = Array.isArray(raw) ? raw : [];
    return list.filter((r: any) => {
      const rn = r.roleName || r.RoleName;
      return rn === "Mentor" || rn === EventRoleType.Mentor || rn === "2";
    });
  }, [eventRolesPage]);

  const mentorNamesByTrack = useMemo(() => {
    const map = new Map<string, string[]>();
    eventMentorRoles.forEach((r: any) => {
      const tid = normalizeId(r.trackId || r.TrackId);
      if (!tid) return;
      const name =
        r.user?.fullName ||
        r.user?.FullName ||
        r.User?.fullName ||
        r.User?.FullName ||
        r.fullName ||
        r.FullName ||
        "";
      if (!name) return;
      const existing = map.get(tid) || [];
      if (!existing.includes(name)) existing.push(name);
      map.set(tid, existing);
    });
    return map;
  }, [eventMentorRoles]);

  // Submissions theo từng track Mentor — dùng cho thống kê card + tiến độ thật.
  const myTrackIds = useMemo(
    () => myTracks.map((t) => (t.id || t.Id || "") as string).filter(Boolean),
    [myTracks]
  );

  const submissionQueries = useQueries({
    queries: myTrackIds.map((trackId) => ({
      queryKey: ["mentor-submit-results-by-track", trackId, resolvedEventId],
      queryFn: () => fetchSubmitResultsByTrack(trackId, resolvedEventId || undefined),
      enabled: !!trackId && !!resolvedEventId,
    })),
  });

  const submissionsByTrack = useMemo(() => {
    const map = new Map<string, SubmitResultListItem[]>();
    myTrackIds.forEach((trackId, idx) => {
      map.set(trackId, submissionQueries[idx]?.data ?? []);
    });
    return map;
  }, [myTrackIds, submissionQueries]);

  const teamNameById = useMemo(() => {
    const map = new Map<string, string>();
    teamsData.forEach((t: TeamListItem) => {
      const tid = (t.id || t.Id) as string;
      if (tid) map.set(tid, t.name || t.Name || "Đội thi");
    });
    return map;
  }, [teamsData]);

  const teamById = useMemo(() => {
    const map = new Map<string, TeamListItem>();
    teamsData.forEach((t: TeamListItem) => {
      const tid = (t.id || t.Id) as string;
      if (tid) map.set(tid, t);
    });
    return map;
  }, [teamsData]);

  const teamsInTrack = useMemo(() => {
    if (!activeTrackId) return [];
    const targetNorm = normalizeId(activeTrackId);
    return teamsData.filter((t) => normalizeId(t.trackId || t.TrackId) === targetNorm);
  }, [teamsData, activeTrackId]);

  const trackStatsMap = useMemo(() => {
    const map = new Map<string, MentorTrackStats>();

    myTracks.forEach((t) => {
      const tid = (t.id || t.Id || "") as string;
      if (!tid) return;
      const tidNorm = normalizeId(tid);
      const teams = teamsData.filter((tm) => normalizeId(tm.trackId || tm.TrackId) === tidNorm);
      const trackSubs = submissionsByTrack.get(tid) ?? [];
      const teamIdsWithSub = new Set(
        trackSubs
          .map((s) => normalizeId(s.teamId || (s as any).TeamId))
          .filter(Boolean)
      );
      const teamsWithSubmission = teams.filter((tm) =>
        teamIdsWithSub.has(normalizeId(tm.id || tm.Id))
      ).length;
      const totalTeams = teams.length;
      const progressPct =
        totalTeams > 0 ? Math.round((teamsWithSubmission / totalTeams) * 100) : 0;

      const fromRoles = mentorNamesByTrack.get(tidNorm) || [];
      const fallbackMentors = (t.mentors || t.Mentors || [])
        .map((m: any) => m.fullName || m.FullName || "")
        .filter(Boolean);
      // Ưu tiên EventRole Mentor; nếu API chưa có tên thì mới fallback staff mapping.
      const mentorNames = fromRoles.length > 0 ? fromRoles : fallbackMentors;

      map.set(tid, {
        totalTeams,
        submissionCount: trackSubs.length,
        teamsWithSubmission,
        progressPct,
        mentorNames,
      });
    });

    return map;
  }, [myTracks, teamsData, submissionsByTrack, mentorNamesByTrack]);

  // Chỉ đếm đội / bài thuộc các hạng mục Mentor được phân công.
  const totalTeamsCount = useMemo(() => {
    return [...trackStatsMap.values()].reduce((sum, s) => sum + s.totalTeams, 0);
  }, [trackStatsMap]);

  const totalSubmissionsCount = useMemo(() => {
    return [...trackStatsMap.values()].reduce((sum, s) => sum + s.submissionCount, 0);
  }, [trackStatsMap]);

  const isLoadingSubmissionsByTrack = submissionQueries.some((q) => q.isLoading);

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
    isLoading:
      isLoadingTracks ||
      isLoadingTeams ||
      isLoadingSubs ||
      isLoadingEventRoles ||
      isLoadingSubmissionsByTrack,
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
