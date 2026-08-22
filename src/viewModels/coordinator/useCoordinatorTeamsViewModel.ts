import { useState, useMemo, useEffect } from "react";
import {
  useGetPendingTeams,
  useApproveTeamRegistration,
  useRejectTeamRegistration,
  useGetTeamsByEvent,
  useDisqualifyTeam,
  useGetTeamById,
} from "@/repositories/teamsRepository";
import { useMyEvents } from "@/repositories/eventsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";

function pickId(item: any): string {
  return item?.id || item?.Id || item?.eventId || item?.EventId || item?.TeamId || "";
}

export type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "DISQUALIFIED";

export function useCoordinatorTeamsViewModel() {
  const [rejectModal, setRejectModal] = useState<{ teamId: string; teamName: string; isDisqualify?: boolean } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detailModal, setDetailModal] = useState<any | null>(null);
  const [eventId, setEventId] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  const { data: myEvents = [] } = useMyEvents();

  useEffect(() => {
    if (!eventId && myEvents.length > 0) {
      const firstId = pickId(myEvents[0]);
      if (firstId) setEventId(firstId);
    }
  }, [myEvents, eventId]);

  const { data: tracks = [] } = useGetTracksByEvent(eventId);

  const {
    data: allTeamsByEventRaw = [],
    isLoading: isLoadingAll,
    refetch: refetchAllTeams,
  } = useGetTeamsByEvent(eventId);

  const {
    data: rawPendingTeams = [],
    isLoading: isLoadingPending,
    refetch: refetchPending,
  } = useGetPendingTeams();

  const { mutateAsync: approveTeam, isPending: isApproving } = useApproveTeamRegistration();
  const { mutateAsync: rejectTeam, isPending: isRejecting } = useRejectTeamRegistration();
  const { mutateAsync: disqualifyTeam, isPending: isDisqualifying } = useDisqualifyTeam();

  const isLoading = isLoadingAll || isLoadingPending;

  const handleRefresh = () => {
    refetchAllTeams();
    refetchPending();
  };

  const getNormalizedStatus = (rawStatus: any): "Pending" | "Approved" | "Disqualified" | "Rejected" | "Forming" => {
    if (rawStatus === 3 || rawStatus === "3" || rawStatus === "PendingApproval" || rawStatus === "Pending") return "Pending";
    if (rawStatus === 1 || rawStatus === "1" || rawStatus === "Registered" || rawStatus === "Approved") return "Approved";
    if (rawStatus === 2 || rawStatus === "2" || rawStatus === "Disqualified") return "Disqualified";
    if (rawStatus === 4 || rawStatus === "4" || rawStatus === "Rejected") return "Rejected";
    if (rawStatus === 0 || rawStatus === "0" || rawStatus === "Forming") return "Forming";
    return "Pending";
  };

  const combinedTeams = useMemo(() => {
    const map = new Map<string, any>();

    (Array.isArray(allTeamsByEventRaw) ? allTeamsByEventRaw : []).forEach((t: any) => {
      const id = pickId(t);
      if (id) {
        map.set(id, {
          ...t,
          id,
          normalizedStatus: getNormalizedStatus(t.status ?? t.Status),
        });
      }
    });

    (Array.isArray(rawPendingTeams) ? rawPendingTeams : []).forEach((t: any) => {
      const tEvId = t.eventId || t.EventId || "";
      if (!eventId || tEvId === eventId) {
        const id = pickId(t);
        if (id) {
          const existing = map.get(id);
          map.set(id, {
            ...existing,
            ...t,
            id,
            normalizedStatus: "Pending",
          });
        }
      }
    });

    return Array.from(map.values());
  }, [allTeamsByEventRaw, rawPendingTeams, eventId]);

  const filteredTeams = useMemo(() => {
    return combinedTeams.filter((t: any) => {
      if (selectedTrackId !== "ALL") {
        const tTrackId = t.trackId || t.TrackId || "";
        if (tTrackId !== selectedTrackId) return false;
      }

      if (statusFilter === "PENDING" && t.normalizedStatus !== "Pending") return false;
      if (statusFilter === "APPROVED" && t.normalizedStatus !== "Approved") return false;
      if (statusFilter === "DISQUALIFIED" && t.normalizedStatus !== "Disqualified" && t.normalizedStatus !== "Rejected") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const name = (t.name || t.Name || t.teamName || t.TeamName || "").toLowerCase();
        const desc = (t.description || t.Description || "").toLowerCase();
        if (!name.includes(q) && !desc.includes(q)) return false;
      }

      return true;
    });
  }, [combinedTeams, selectedTrackId, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let disqualified = 0;
    combinedTeams.forEach((t: any) => {
      if (t.normalizedStatus === "Pending") pending++;
      else if (t.normalizedStatus === "Approved") approved++;
      else if (t.normalizedStatus === "Disqualified" || t.normalizedStatus === "Rejected") disqualified++;
    });
    return { all: combinedTeams.length, pending, approved, disqualified };
  }, [combinedTeams]);

  const totalPages = Math.max(1, Math.ceil(filteredTeams.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedTeams = filteredTeams.slice(startIndex, startIndex + PAGE_SIZE);

  const detailTeamId = detailModal ? pickId(detailModal) : undefined;
  const { data: teamDetail, isLoading: isLoadingDetail } = useGetTeamById(detailTeamId);
  const detailMembers = teamDetail?.members ?? [];

  const handleApprove = async (teamId: string) => {
    try {
      await approveTeam(teamId);
      setDetailModal(null);
      handleRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Duyệt đội thi thất bại. Vui lòng thử lại.");
    }
  };

  const handleConfirmRejectOrDisqualify = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lý do cụ thể.");
      return;
    }

    try {
      if (rejectModal.isDisqualify) {
        await disqualifyTeam({ teamId: rejectModal.teamId, reason: rejectReason });
      } else {
        await rejectTeam({ teamId: rejectModal.teamId, reason: rejectReason });
      }
      setRejectModal(null);
      setRejectReason("");
      setDetailModal(null);
      handleRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Thao tác thất bại. Vui lòng thử lại.");
    }
  };

  return {
    state: {
      rejectModal,
      rejectReason,
      detailModal,
      eventId,
      selectedTrackId,
      statusFilter,
      searchQuery,
      currentPage: safePage,
      totalPages,
      totalItems: filteredTeams.length,
      pageSize: PAGE_SIZE,
      isApproving,
      isRejecting,
      isDisqualifying,
    },
    data: {
      myEvents,
      tracks,
      paginatedTeams,
      counts,
      isLoading,
      teamDetail,
      detailMembers,
      isLoadingDetail,
    },
    actions: {
      setRejectModal,
      setRejectReason,
      setDetailModal,
      setEventId,
      setSelectedTrackId,
      setStatusFilter,
      setSearchQuery,
      setCurrentPage,
      handleRefresh,
      handleApprove,
      handleConfirmRejectOrDisqualify,
      pickId,
    },
  };
}
