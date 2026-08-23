import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useMyEvents, useEvents } from "@/repositories/eventsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { useGetAppealsByEvent, AppealStatus } from "@/repositories/appealsRepository";
import { useMyNotifications } from "@/repositories/notificationsRepository";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import { usePagination } from "@/hooks/usePagination";

export function useCoordinatorSubmissionsViewModel() {
  const { user: currentUser } = useAuth();
  const searchParams = useSearchParams();
  const queryEventId = searchParams.get("eventId") || searchParams.get("id") || "";
  const queryTrackId = searchParams.get("trackId") || "";

  // 1. Fetch Events
  const { data: rawMyEvents = [], isLoading: isLoadingMyEvents, refetch: refetchMyEvents } = useMyEvents();
  const { data: rawAllEvents = [], isLoading: isLoadingAllEvents, refetch: refetchAllEvents } = useEvents();

  const eventsList = useMemo(() => {
    const myEventsList = Array.isArray(rawMyEvents) ? rawMyEvents : (rawMyEvents as any)?.data ?? [];

    if (currentUser?.isAdmin) {
      const allList = Array.isArray(rawAllEvents) ? rawAllEvents : (rawAllEvents as any)?.data ?? [];
      const map = new Map<string, any>();
      allList.forEach((ev: any) => {
        const id = ev.id || ev.Id || ev.eventId || ev.EventId;
        if (id) map.set(id, ev);
      });
      myEventsList.forEach((ev: any) => {
        const id = ev.id || ev.Id || ev.eventId || ev.EventId;
        if (id && !map.has(id)) map.set(id, ev);
      });
      return Array.from(map.values());
    }

    return myEventsList;
  }, [rawMyEvents, rawAllEvents, currentUser?.isAdmin]);

  const [selectedEventId, setSelectedEventId] = useState<string>(queryEventId);
  const [selectedTrackId, setSelectedTrackId] = useState<string>(queryTrackId);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal xem chi tiết điểm số từng giám khảo chấm
  const [inspectScoresModal, setInspectScoresModal] = useState<{
    open: boolean;
    teamId?: string;
    teamName?: string;
    submitResultId?: string;
  }>({ open: false });

  useEffect(() => {
    if (queryEventId) {
      setSelectedEventId(queryEventId);
    } else if (eventsList.length > 0 && !selectedEventId) {
      const firstId = eventsList[0].id || eventsList[0].Id || eventsList[0].eventId || eventsList[0].EventId || "";
      setSelectedEventId(firstId);
    }
  }, [queryEventId, eventsList, selectedEventId]);

  useEffect(() => {
    if (queryTrackId && !selectedTrackId) {
      setSelectedTrackId(queryTrackId);
    }
  }, [queryTrackId, selectedTrackId]);

  // 2. Fetch Tracks
  const { data: eventTracks = [] } = useGetTracksByEvent(selectedEventId || undefined);

  const { data: allTracks = [] } = useQuery({
    queryKey: ["all-coordinator-tracks", eventsList.map((e: any) => e.id || e.Id || e.eventId).join(",")],
    queryFn: async () => {
      if (eventsList.length === 0) return [];
      const trackPromises = eventsList.map(async (ev: any) => {
        const evId = ev.id || ev.Id || ev.eventId || ev.EventId;
        try {
          const res = await apiClient.get<any>("/Tracks/event", {
            params: { eventId: evId, EventId: evId, PageSize: 100 },
          });
          const items =
            res.data?.data?.items ??
            res.data?.items ??
            res.data?.data ??
            (Array.isArray(res.data) ? res.data : []);
          return Array.isArray(items) ? items : [];
        } catch {
          return [];
        }
      });
      const results = await Promise.all(trackPromises);
      return results.flat();
    },
    enabled: eventsList.length > 0 && !selectedEventId,
  });

  const tracks = useMemo(() => {
    const rawList = selectedEventId ? eventTracks : allTracks;
    const map = new Map<string, any>();
    rawList.forEach((t: any) => {
      const id = t.id || t.Id || t.trackId || t.TrackId;
      if (id && !map.has(id)) map.set(id, t);
    });
    return Array.from(map.values());
  }, [selectedEventId, eventTracks, allTracks]);

  // 3. Query Submissions
  const {
    data: rawSubmissions = [],
    isLoading: isLoadingSubmissions,
    refetch: refetchSubmissions,
  } = useQuery({
    queryKey: ["coordinator-submissions", selectedEventId, selectedTrackId],
    queryFn: async () => {
      const params: Record<string, any> = { PageSize: 500 };
      if (selectedEventId) {
        params.EventId = selectedEventId;
      }
      if (selectedTrackId) {
        params.TrackId = selectedTrackId;
      }
      const res = await apiClient.get<any>("/SubmitResults", { params });
      const items =
        res.data?.data?.items ??
        res.data?.items ??
        res.data?.data ??
        (Array.isArray(res.data) ? res.data : []);
      return Array.isArray(items) ? items : [];
    },
  });

  const submissions = Array.isArray(rawSubmissions) ? rawSubmissions : [];

  // 4. Query Appeals
  const effectiveEventIdForAppeals = selectedEventId || (eventsList[0]?.id || eventsList[0]?.Id || eventsList[0]?.eventId || "");
  const { data: appeals = [], refetch: refetchAppeals } = useGetAppealsByEvent(effectiveEventIdForAppeals || undefined);
  const pendingAppealsCount = useMemo(() => {
    return appeals.filter((a) => a.status === AppealStatus.Pending).length;
  }, [appeals]);

  // 5. Query Notifications
  const { data: notifications = [] } = useMyNotifications(Boolean(currentUser));

  // 6. Filter Submissions
  const displaySubmissions = useMemo(() => {
    const validEventIds = new Set(
      eventsList.map((e: any) => (e.id || e.Id || e.eventId || e.EventId || "").replace(/-/g, "").toLowerCase()).filter(Boolean)
    );

    return submissions.filter((sub: any) => {
      if (!currentUser?.isAdmin && validEventIds.size > 0) {
        const subEventId = (sub.eventId || sub.EventId || "").replace(/-/g, "").toLowerCase();
        if (subEventId && !validEventIds.has(subEventId)) return false;
      }

      if (selectedTrackId) {
        const subTrackId = sub.trackId || sub.TrackId;
        if (subTrackId && subTrackId !== selectedTrackId) return false;
      }
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const teamName = (sub.teamName || sub.TeamName || "").toLowerCase();
      const eventName = (sub.eventName || sub.EventName || "").toLowerCase();
      const trackName = (sub.trackName || sub.TrackName || "").toLowerCase();
      return teamName.includes(term) || eventName.includes(term) || trackName.includes(term);
    });
  }, [submissions, eventsList, currentUser?.isAdmin, selectedTrackId, searchTerm]);

  // 7. Pagination
  const pagination = usePagination(displaySubmissions, 8);
  const { setCurrentPage } = pagination;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEventId, selectedTrackId, searchTerm, setCurrentPage]);

  // Metrics
  const metrics = useMemo(() => {
    const uniqueTeamsCount = new Set(submissions.map((s: any) => s.teamId || s.TeamId)).size;
    const reposCount = submissions.filter((s: any) => s.repoUrl || s.RepoUrl || s.submissionUrl || s.SubmissionUrl).length;
    const demosCount = submissions.filter((s: any) => s.demoUrl || s.DemoUrl).length;
    const slidesCount = submissions.filter((s: any) => s.slideUrl || s.SlideUrl).length;
    return {
      totalSubmissions: submissions.length,
      uniqueTeamsCount,
      reposCount,
      demosCount,
      slidesCount,
      pendingAppealsCount,
    };
  }, [submissions, pendingAppealsCount]);

  const handleRefetchAll = () => {
    refetchMyEvents();
    refetchAllEvents();
    refetchSubmissions();
    refetchAppeals();
  };

  const handleExportCSV = () => {
    if (displaySubmissions.length === 0) {
      alert("Không có dữ liệu bài nộp để xuất file!");
      return;
    }

    const headers = [
      "STT",
      "Tên Đội Thi",
      "Hạng Mục (Track)",
      "Sự Kiện",
      "GitHub Repo",
      "Live Demo",
      "Slides Pitch",
      "Thời Gian Nộp",
    ];

    const rows = displaySubmissions.map((sub: any, idx: number) => {
      const teamName = sub.teamName || sub.TeamName || `Đội #${idx + 1}`;
      const trackName = sub.trackName || sub.TrackName || "Chung";
      const eventName = sub.eventName || sub.EventName || "Sự kiện";
      const repoUrl = sub.repoUrl || sub.RepoUrl || sub.submissionUrl || sub.SubmissionUrl || "";
      const demoUrl = sub.demoUrl || sub.DemoUrl || "";
      const slideUrl = sub.slideUrl || sub.SlideUrl || "";
      const createdTime = sub.createdTime || sub.CreatedTime ? new Date(sub.createdTime || sub.CreatedTime).toLocaleString("vi-VN") : "";

      return [
        idx + 1,
        `"${teamName.replace(/"/g, '""')}"`,
        `"${trackName.replace(/"/g, '""')}"`,
        `"${eventName.replace(/"/g, '""')}"`,
        `"${repoUrl}"`,
        `"${demoUrl}"`,
        `"${slideUrl}"`,
        `"${createdTime}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `Danh_Sach_Bai_Nop_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInspectScores = (teamId: string, teamName: string, submitResultId: string) => {
    setInspectScoresModal({
      open: true,
      teamId,
      teamName,
      submitResultId,
    });
  };

  const handleCloseInspectScores = () => {
    setInspectScoresModal({ open: false });
  };

  return {
    state: {
      selectedEventId,
      selectedTrackId,
      searchTerm,
      inspectScoresModal,
    },
    data: {
      eventsList,
      tracks,
      displaySubmissions,
      metrics,
      isLoading: isLoadingSubmissions || isLoadingMyEvents || isLoadingAllEvents,
      notifications,
    },
    pagination,
    actions: {
      setSelectedEventId,
      setSelectedTrackId,
      setSearchTerm,
      handleRefetchAll,
      handleExportCSV,
      handleOpenInspectScores,
      handleCloseInspectScores,
    },
  };
}
