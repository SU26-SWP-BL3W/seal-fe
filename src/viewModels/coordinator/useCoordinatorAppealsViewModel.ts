import { useState, useMemo } from "react";
import { appealsRepository, AppealStatus, useAppealsByRound } from "@/repositories/appealsRepository";
import { useMyEvents, useEventRounds } from "@/repositories/eventsRepository";
import { useGetTeamsByEvent } from "@/repositories/teamsRepository";
import { useGetEventRoles } from "@/repositories/staffRepository";
import { usePagination } from "@/hooks/usePagination";

export function useCoordinatorAppealsViewModel() {
  const { data: eventsList = [] } = useMyEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const eventId = selectedEventId || (eventsList[0] ? String((eventsList[0] as any).id || (eventsList[0] as any).Id || (eventsList[0] as any).eventId || (eventsList[0] as any).EventId || "") : "");

  const { data: rounds = [] } = useEventRounds(eventId);
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const roundId = selectedRoundId || (rounds[0] ? String((rounds[0] as any).id || (rounds[0] as any).Id || "") : "");

  const { data: eventRoles = [] } = useGetEventRoles(eventId);
  const judges = eventRoles.filter((r: any) => (r.roleName || r.RoleName) === "Judge");

  const { data: teams = [] } = useGetTeamsByEvent(eventId);
  const teamNameById = useMemo(() => {
    const map = new Map<string, string>();
    (teams as any[]).forEach((t) => {
      const id = t.id || t.Id;
      const name = t.name || t.Name || t.teamName || t.TeamName;
      if (id) map.set(id, name || id);
    });
    return map;
  }, [teams]);

  const { data: appeals = [], isLoading, refetch } = useAppealsByRound(roundId);
  const displayAppeals = appeals;

  const pagination = usePagination(displayAppeals, 6);

  const [selectedAppealId, setSelectedAppealId] = useState<string | null>(null);
  const [assignedJudgeId, setAssignedJudgeId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingAppealId, setRejectingAppealId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleApproveAppeal = async () => {
    if (!selectedAppealId) return;
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await appealsRepository.respondAppeal(selectedAppealId, true, "Chấp nhận đơn phúc khảo.", assignedJudgeId || undefined);
      setSuccessMessage(`Đã duyệt đơn phúc khảo và phân công Giám khảo chấm lại.`);
      setSelectedAppealId(null);
      await refetch();
    } catch (err: any) {
      setErrorMessage(`Duyệt đơn thất bại: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectAppeal = async () => {
    if (!rejectingAppealId || !rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối đơn phúc khảo!");
      return;
    }
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await appealsRepository.respondAppeal(rejectingAppealId, false, rejectReason.trim());
      setSuccessMessage(`Đã từ chối đơn phúc khảo với lý do: "${rejectReason}".`);
      setRejectingAppealId(null);
      setRejectReason("");
      await refetch();
    } catch (err: any) {
      setErrorMessage(`Từ chối đơn thất bại: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    state: {
      selectedEventId,
      selectedRoundId,
      eventId,
      roundId,
      selectedAppealId,
      assignedJudgeId,
      rejectReason,
      rejectingAppealId,
      isSubmitting,
      successMessage,
      errorMessage,
    },
    data: {
      eventsList,
      rounds,
      judges,
      teamNameById,
      appeals,
      displayAppeals,
      isLoading,
    },
    pagination,
    actions: {
      setSelectedEventId,
      setSelectedRoundId,
      setSelectedAppealId,
      setAssignedJudgeId,
      setRejectReason,
      setRejectingAppealId,
      handleApproveAppeal,
      handleRejectAppeal,
      refetch,
    },
  };
}
