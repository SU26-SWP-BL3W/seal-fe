import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import { useAuth } from "@/providers/AuthProvider";
import { useEvents } from "@/repositories/eventsRepository";
import { fetchSubmitResultsByTrack } from "@/repositories/submitResultsRepository";
import { fetchScoresByEventRole } from "@/repositories/scoresRepository";
import { useGetMyEventRoles } from "@/repositories/eventRolesRepository";
import type { TrackWithStaffModel } from "@/repositories/tracksRepository";
import type { PagedResult } from "@/models/types";

export interface JudgeTrackItem {
  eventId: string;
  eventName: string;
  season: string;
  roundName: string;
  trackName: string;
  trackId: string;
  templateId: string;
  /** EventRole ID THẬT của giám khảo cho ĐÚNG track này — mỗi track có 1 EventRole
   * riêng, không dùng chung 1 ID cho mọi track (gửi nhầm sẽ gắn phiếu chấm sai vai trò). */
  eventRoleId: string;
  totalSubmissions: number;
  scoredSubmissions: number;
  pendingSubmissions: number;
  status: string;
  /** Mốc thời gian THẬT của track (EC cấu hình, override Round) — để gate cổng chấm ở FE
   * đọc đúng ngày của track, không fallback nhầm sang ngày của Round. */
  endDate?: string;
  scoringStartDate?: string;
  scoringEndDate?: string;
}

async function fetchTracksByEvent(eventId: string): Promise<TrackWithStaffModel[]> {
  const res = await apiClient.get<PagedResult<TrackWithStaffModel>>("/Tracks/event", {
    params: { EventId: eventId, PageSize: 100 },
  });
  return res.data?.data ?? [];
}

export function useMyAssignedJudgeTracks() {
  const { user, activeRole } = useAuth();
  const { data: rawEvents, isLoading: loadingEvents } = useEvents();
  const assignedTrackId = activeRole?.trackId || (activeRole as any)?.TrackId || "";
  const userId = user?.id || (user as any)?.userId || "";
  const isAdmin = Boolean(user?.isAdmin || user?.IsAdmin);

  const events = (Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data) || [];
  const eventsList = Array.isArray(events) ? events : [];

  // Toàn bộ EventRole thật của user này — nguồn để suy ra eventRoleId ĐÚNG theo từng track.
  const { data: myEventRoles = [], isLoading: loadingRoles } = useGetMyEventRoles(userId || undefined);
  const eventRoleIdByTrack = useMemo(() => {
    const map = new Map<string, string>();
    myEventRoles.forEach((r) => {
      if (r.roleName === "Judge" && r.trackId) map.set(r.trackId, r.id);
    });
    return map;
  }, [myEventRoles]);
  // Vai trò cấp Event (không gắn track cụ thể) — fallback khi track không map được.
  const fallbackEventRoleId =
    activeRole?.id || activeRole?.eventRoleId || (activeRole as any)?.EventRoleId || "";

  const eventMeta = useMemo(() => {
    const map = new Map<string, { name: string; season: string }>();
    eventsList.forEach((e: any) => {
      const id = e.id || e.Id;
      if (id) map.set(id, { name: e.eventName || e.EventName || "Sự kiện", season: e.season || e.Season || "" });
    });
    return map;
  }, [eventsList]);

  // Sự kiện có khả năng liên quan tới giám khảo này (Admin xem hết để đối chiếu).
  const candidateEventIds = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return eventsList.map((e: any) => e.id || e.Id).filter(Boolean);
    const ids = myEventRoles
      .filter((r) => r.roleName === "Judge")
      .map((r) => r.eventId)
      .filter(Boolean);
    const single = activeRole?.eventId || (activeRole as any)?.EventId;
    if (single) ids.push(single);
    return [...new Set(ids)];
  }, [user, isAdmin, activeRole, eventsList, myEventRoles]);

  // Tracks/event trả kèm judges[] thật — đây mới là nguồn xác định "track của tôi",
  // đúng hơn activeRole.trackId (chỉ 1 track được chọn làm vai trò chính lúc đăng nhập,
  // trong khi 1 giám khảo có thể được phân công nhiều track, thậm chí nhiều sự kiện).
  const trackQueries = useQueries({
    queries: candidateEventIds.map((eId) => ({
      queryKey: ["tracks-by-event", eId],
      queryFn: () => fetchTracksByEvent(eId),
      enabled: !!eId,
    })),
  });

  const baseTracks = useMemo(() => {
    const list: Omit<JudgeTrackItem, "totalSubmissions" | "scoredSubmissions" | "pendingSubmissions" | "status">[] = [];

    candidateEventIds.forEach((eId, idx) => {
      const tracks = trackQueries[idx]?.data ?? [];
      const meta = eventMeta.get(eId);

      tracks.forEach((t: any) => {
        const trackId = t.id || t.Id || "";
        if (!trackId) return;

        if (!isAdmin) {
          const judges = t.judges || t.Judges;
          const judgeIds: string[] = (judges || []).map((j: any) => (j.id || j.Id || "").replace(/-/g, "").toLowerCase()).filter(Boolean);
          const hasJudgeList = Array.isArray(judges) && judges.length > 0;
          const normUserId = (userId || "").replace(/-/g, "").toLowerCase();
          const normTrackId = (trackId || "").replace(/-/g, "").toLowerCase();
          const isRealAssigned = normUserId && judgeIds.includes(normUserId);
          const isFallbackAssigned = assignedTrackId && (assignedTrackId.replace(/-/g, "").toLowerCase() === normTrackId);
          const isDirectRoleAssigned = myEventRoles.some((r: any) => {
            const rn = r.roleName || r.RoleName;
            const rTId = (r.trackId || r.TrackId || "").replace(/-/g, "").toLowerCase();
            return rn === "Judge" && rTId === normTrackId;
          });

          if (!isDirectRoleAssigned && !isRealAssigned) return;
        }

        list.push({
          eventId: eId,
          eventName: meta?.name || "Sự kiện",
          season: meta?.season || "",
          roundName: "Vòng Chuyên Môn",
          trackName: t.trackName || t.TrackName || "Hạng mục",
          trackId,
          templateId: t.templateId || t.TemplateId || "",
          eventRoleId: eventRoleIdByTrack.get(trackId) || fallbackEventRoleId,
          // Mang theo mốc thời gian THẬT của track để gate cổng chấm không đọc nhầm ngày Round.
          endDate: (t as any).endDate || (t as any).EndDate,
          scoringStartDate: (t as any).scoringStartDate || (t as any).ScoringStartDate,
          scoringEndDate: (t as any).scoringEndDate || (t as any).ScoringEndDate,
        });
      });
    });

    return list;
  }, [candidateEventIds, trackQueries, eventMeta, isAdmin, userId, assignedTrackId, eventRoleIdByTrack, fallbackEventRoleId]);

  // Bài nộp thật của từng track (song song — không gọi hook trong vòng lặp được nên dùng useQueries).
  const submissionQueries = useQueries({
    queries: baseTracks.map((t) => ({
      queryKey: ["submit-results-by-track", t.trackId, t.eventId],
      queryFn: () => fetchSubmitResultsByTrack(t.trackId, t.eventId),
      enabled: !!t.trackId && !!t.eventId,
    })),
  });

  // Phiếu chấm thật theo TỪNG eventRoleId (1 giám khảo nhiều track = nhiều eventRoleId,
  // phải gọi song song từng cái — gọi 1 lần duy nhất theo activeRole sẽ bỏ sót track khác).
  const uniqueEventRoleIds = useMemo(
    () => [...new Set(baseTracks.map((t) => t.eventRoleId).filter(Boolean))],
    [baseTracks],
  );
  const scoreQueries = useQueries({
    queries: uniqueEventRoleIds.map((erId) => ({
      queryKey: ["scores-by-event-role", erId],
      queryFn: () => fetchScoresByEventRole(erId),
      enabled: !!erId,
    })),
  });
  const submittedIds = useMemo(() => {
    const set = new Set<string>();
    scoreQueries.forEach((q) => {
      const list = Array.isArray(q.data) ? q.data : ((q.data as any)?.data ?? []);
      list.forEach((s: any) => {
        if (s.isSubmitted) set.add(s.submitResultId);
      });
    });
    return set;
  }, [scoreQueries]);

  const assignedTracks: JudgeTrackItem[] = useMemo(() => {
    return baseTracks.map((t, idx) => {
      const rawList = submissionQueries[idx]?.data ?? [];
      const normTrackId = (t.trackId || "").replace(/-/g, "").toLowerCase();
      const submissions = rawList.filter((s: any) => {
        const sTrackId = (s.trackId || s.TrackId || "").replace(/-/g, "").toLowerCase();
        return !sTrackId || sTrackId === normTrackId;
      });
      const total = submissions.length;
      const scored = submissions.filter((s) => submittedIds.has(s.id || s.Id || "")).length;
      return {
        ...t,
        totalSubmissions: total,
        scoredSubmissions: scored,
        pendingSubmissions: Math.max(0, total - scored),
        status: total > 0 && scored === total ? "DONE" : "PENDING",
      };
    });
  }, [baseTracks, submissionQueries, submittedIds]);

  const isLoading =
    loadingEvents ||
    loadingRoles ||
    trackQueries.some((q) => q.isLoading) ||
    submissionQueries.some((q) => q.isLoading) ||
    scoreQueries.some((q) => q.isLoading);

  const refetch = () => {
    trackQueries.forEach((q) => q.refetch());
    submissionQueries.forEach((q) => q.refetch());
    scoreQueries.forEach((q) => q.refetch());
  };

  return {
    assignedTracks,
    isLoading,
    refetch,
  };
}
