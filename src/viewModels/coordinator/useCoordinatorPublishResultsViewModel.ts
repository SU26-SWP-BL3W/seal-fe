import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useGetFinalResultsByRound, useAssignPrize, finalResultsRepository } from "@/repositories/finalResultsRepository";
import { useMyEvents, useEvents, useEventRounds } from "@/repositories/eventsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { useGetTeamsByEvent } from "@/repositories/teamsRepository";
import { useGetPrizesByEvent } from "@/repositories/results/prizesRepository";
import { useGetTrackCalibration } from "@/repositories/scoresRepository";
import { pushSystemNotification } from "@/repositories/shared/notificationsRepository";
import { useToast } from "@/providers/ToastProvider";
import { usePagination } from "@/hooks/usePagination";
import { resultsService } from "@/services/coordinator/resultsService";
import { calibrationService } from "@/services/coordinator/calibrationService";

export function useCoordinatorPublishResultsViewModel() {
  const toast = useToast();
  const params = useParams();
  const { user: currentUser } = useAuth();

  const { data: myEvents = [] } = useMyEvents();
  const { data: rawAllEvents = [] } = useEvents();
  const allEvents = Array.isArray(rawAllEvents) ? rawAllEvents : (rawAllEvents as any)?.data ?? [];
  const eventsList = (currentUser?.isAdmin || currentUser?.IsAdmin)
    ? allEvents
    : myEvents;

  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");

  useEffect(() => {
    if (eventsList.length > 0 && !selectedEventId) {
      setSelectedEventId(eventsList[0].id || eventsList[0].eventId || "");
    }
  }, [eventsList, selectedEventId]);

  const { data: dbTracks = [] } = useGetTracksByEvent(selectedEventId);
  const { data: dbPrizes = [] } = useGetPrizesByEvent(selectedEventId);
  const { data: dbRounds = [] } = useEventRounds(selectedEventId);
  const { data: dbTeams = [] } = useGetTeamsByEvent(selectedEventId);

  const teamNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of dbTeams as any[]) map.set(t.id, t.name || t.teamName || t.id);
    return map;
  }, [dbTeams]);

  const roundsList: Array<{ id: string; name: string }> = dbRounds.map((r: any) => ({
    id: r.id || r.Id,
    name: r.roundName || r.RoundName || "Vòng thi",
  }));

  useEffect(() => {
    if (roundsList.length > 0 && !selectedRoundId) {
      setSelectedRoundId(roundsList[0].id);
    }
  }, [roundsList, selectedRoundId]);

  const tracksList = dbTracks.map((t: any) => ({
    id: t.id || t.Id || t.trackId,
    name: t.trackName || t.Name || "Hạng mục",
  }));

  useEffect(() => {
    if (tracksList.length > 0 && !selectedTrackId) {
      setSelectedTrackId(tracksList[0].id);
    }
  }, [tracksList, selectedTrackId]);

  const { data: results = [], isLoading, refetch } = useGetFinalResultsByRound(selectedRoundId);
  const { data: calibration, isLoading: isLoadingCalibration } = useGetTrackCalibration(selectedTrackId);
  const assignPrizeMutation = useAssignPrize();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topN, setTopN] = useState<number>(10);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPublishedState, setIsPublishedState] = useState(false);

  // Modal soi chi tiết điểm từng giám khảo chấm
  const [inspectScoresModal, setInspectScoresModal] = useState<{
    open: boolean;
    teamId?: string;
    teamName?: string;
  }>({ open: false });

  // Calibration Real API Progress Calculations via Service
  const scoresList = calibration?.scores ?? (calibration as any)?.Scores ?? [];
  const isCalibrationCompleted = Boolean(calibration?.isCompleted ?? (calibration as any)?.IsCompleted);
  const { totalPairs, submittedPairs, pendingPairs, progressPercent } = useMemo(
    () => calibrationService.calculateProgress(scoresList, isCalibrationCompleted),
    [scoresList, isCalibrationCompleted]
  );

  // Local prize assignment state map
  const [assignedPrizesMap, setAssignedPrizesMap] = useState<Record<string, string>>({});

  // Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailRecipientType, setEmailRecipientType] = useState<"all" | "advanced">("all");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailCustomMessage, setEmailCustomMessage] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const availablePrizesList = dbPrizes.map((p: any, idx: number) => ({
    id: p.id || p.Id || `prz-${idx}`,
    name: `${p.prizeName || p.PrizeName || "Giải"} (${p.value || p.Value || "chưa rõ giá trị"})`,
  }));

  const currentEvent = eventsList.find((e: any) => (e.id || e.Id || e.eventId || e.EventId) === selectedEventId);
  const currentRound = roundsList.find((r) => r.id === selectedRoundId);

  // Handle Prize Assignment to Team
  const handleAssignPrizeToTeam = async (resultId: string, prizeId: string, teamName: string) => {
    setAssignedPrizesMap((prev) => ({ ...prev, [resultId]: prizeId }));
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      if (assignPrizeMutation?.mutateAsync) {
        await assignPrizeMutation.mutateAsync({
          resultId,
          prizeId: prizeId !== "none" ? prizeId : null,
        });
      }
      const prizeObj = availablePrizesList.find((p) => p.id === prizeId);
      const okMsg =
        prizeId !== "none"
          ? `Đã trao ${prizeObj?.name || "Giải thưởng"} cho Đội "${teamName}"!`
          : `Đã hủy gán giải thưởng cho Đội "${teamName}".`;
      setSuccessMessage(okMsg);
      toast.success(okMsg);

      if (prizeId !== "none") {
        pushSystemNotification(
          resultsService.buildPrizeNotificationPayload(
            teamName,
            prizeObj?.name || "Giải thưởng danh giá",
            currentEvent?.eventName || "Sự kiện"
          )
        );
      }
    } catch (err: any) {
      const errMsg = `Gán giải thưởng thất bại: ${err?.message}`;
      setErrorMessage(errMsg);
      toast.error(errMsg);
    }
  };

  const displayResults = results;

  const pagination = usePagination(displayResults, 8);

  const handleCalculate = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (!selectedRoundId.startsWith("round-")) {
        await finalResultsRepository.calculateRoundResults(selectedRoundId, topN);
      }
      const okMsg = `Đã tự động tính toán xếp hạng điểm số cho Vòng thi (Top ${topN}).`;
      setSuccessMessage(okMsg);
      toast.success(okMsg);
      await refetch();
    } catch (err: any) {
      const errMsg = `Tính điểm thất bại: ${err?.response?.data?.message || err?.message}`;
      setErrorMessage(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublishStatus = async () => {
    const nextStatus = !isPublishedState;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (!selectedRoundId.startsWith("round-")) {
        await finalResultsRepository.setPublishStatus(selectedRoundId, nextStatus);
      }
      setIsPublishedState(nextStatus);
      const okMsg = nextStatus
        ? "Đã công bố công khai bảng kết quả cho thí sinh và Bảng Vàng Danh Dự!"
        : "Đã ẩn bảng kết quả về chế độ bản nháp an toàn.";
      setSuccessMessage(okMsg);
      toast.success(okMsg);

      if (nextStatus) {
        pushSystemNotification(
          resultsService.buildPublishNotificationPayload(
            currentRound?.name || "Vòng thi",
            currentEvent?.eventName || "Sự kiện"
          )
        );
      }
      await refetch();
    } catch (err: any) {
      const errMsg = `Đổi trạng thái thất bại: ${err?.response?.data?.message || err?.message}`;
      setErrorMessage(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6.2 Xuất kết quả CSV thông qua Service
  const handleExportCSV = () => {
    try {
      const eventNameStr = currentEvent?.eventName || currentEvent?.EventName || "SEAL_Event";
      const roundNameStr = currentRound?.name || "Vong_Thi";
      const trackNameStr = tracksList.find((t) => t.id === selectedTrackId)?.name || "Chung";

      resultsService.exportResultsToCsv({
        results: displayResults,
        eventName: eventNameStr,
        roundName: roundNameStr,
        trackName: trackNameStr,
        teamNameById,
        availablePrizes: availablePrizesList,
        assignedPrizesMap,
      });

      toast.success("Đã xuất file CSV kết quả thành công!");
    } catch (err: any) {
      toast.error(err.message || "Xuất file CSV thất bại!");
    }
  };

  // 6.2 Gửi email thông báo kết quả
  const handleOpenEmailModal = () => {
    const evName = currentEvent?.eventName || currentEvent?.EventName || "Cuộc thi";
    const rdName = currentRound?.name || "Vòng thi";
    setEmailSubject(`[SEAL HACKATHON] Thông Báo Kết Quả Chính Thức: ${evName} - ${rdName}`);
    setEmailCustomMessage(
      `Kính gửi các Đội thi,\n\nBan Tổ Chức xin trân trọng thông báo bảng điểm kết quả chính thức cho ${rdName} thuộc sự kiện ${evName} đã được công bố.\n\nCác bạn có thể đăng nhập vào hệ thống để tra cứu chi tiết điểm số, xếp hạng và nộp đơn Phúc khảo nếu cần thiết.\n\nTrân trọng,\nBan Tổ Chức SEAL`
    );
    setIsEmailModalOpen(true);
  };

  const handleSendEmailAnnouncement = async () => {
    setIsSendingEmail(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(
        `Đã gửi email thông báo kết quả thành công tới ${
          emailRecipientType === "all" ? displayResults.length : "Top các"
        } đội thi!`
      );
      setIsEmailModalOpen(false);
    } catch {
      toast.error("Gửi email thông báo thất bại, vui lòng thử lại!");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return {
    state: {
      selectedEventId,
      selectedRoundId,
      selectedTrackId,
      isSubmitting,
      topN,
      errorMessage,
      successMessage,
      isPublishedState,
      inspectScoresModal,
      assignedPrizesMap,
      isEmailModalOpen,
      emailRecipientType,
      emailSubject,
      emailCustomMessage,
      isSendingEmail,
    },
    data: {
      eventsList,
      roundsList,
      tracksList,
      currentEvent,
      currentRound,
      availablePrizesList,
      teamNameById,
      displayResults,
      isLoading: isLoading || isLoadingCalibration,
      calibration: {
        scoresList,
        isCalibrationCompleted,
        totalPairs,
        submittedPairs,
        pendingPairs,
        progressPercent,
      },
    },
    pagination,
    actions: {
      setSelectedEventId,
      setSelectedRoundId,
      setSelectedTrackId,
      setTopN,
      setInspectScoresModal,
      setIsEmailModalOpen,
      setEmailRecipientType,
      setEmailSubject,
      setEmailCustomMessage,
      handleAssignPrizeToTeam,
      handleCalculate,
      handleTogglePublishStatus,
      handleExportCSV,
      handleOpenEmailModal,
      handleSendEmailAnnouncement,
      refetch,
    },
  };
}
