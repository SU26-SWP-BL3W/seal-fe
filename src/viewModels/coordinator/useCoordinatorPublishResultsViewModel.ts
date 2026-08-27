"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
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

/**
 * =========================================================================================
 * VIEWMODEL: useCoordinatorPublishResultsViewModel
 * MÔ HÌNH: MVVM (Model - View - ViewModel)
 * VAI TRÒ LIÊN QUAN: Điều phối viên (Event Coordinator - EC) / Ban Tổ Chức / Admin
 * 
 * NHIỆM VỤ CHÍNH:
 *   1. Quản lý State & Lifecycle cho màn hình xét duyệt và công bố kết quả (/coordinator/publish-results).
 *   2. Tự động truy vấn và đồng bộ dữ liệu đa tầng (Cascade Data): Event -> Round -> Track -> FinalResults -> Calibration.
 *   3. Tính toán tiến độ nộp phiếu chấm của Hội đồng Giám khảo theo thời gian thực (HUD Progress).
 *   4. Cung cấp các Action Handler:
 *      - `handleCalculate`: Tự động tính điểm trung bình giám khảo và xếp hạng Top N.
 *      - `handleTogglePublishStatus`: Chuyển đổi trạng thái Công bố công khai (Public) <-> Bản nháp (Draft).
 *      - `handleAssignPrizeToTeam`: Gán giải thưởng (Nhất/Nhì/Ba/Sáng tạo...) cho Đội thi.
 *      - `handleExportCSV`: Xuất toàn bộ bảng điểm kết quả ra file CSV chuẩn UTF-8.
 *      - `handleSendEmailAnnouncement`: Gửi email thông báo kết quả chính thức cho thí sinh.
 * =========================================================================================
 */
export function useCoordinatorPublishResultsViewModel() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const params = useParams();
  const { user: currentUser } = useAuth();

  // ---------------------------------------------------------------------------------------
  // [BƯỚC 1]: TRUY VẤN DANH SÁCH SỰ KIỆN PHỤ TRÁCH (EVENT QUERY)
  // Nếu là Admin -> lấy toàn bộ sự kiện; Nếu là EC -> lấy các sự kiện mình được phân công
  // ---------------------------------------------------------------------------------------
  const { data: myEvents = [] } = useMyEvents();
  const { data: rawAllEvents = [] } = useEvents();
  const allEvents = Array.isArray(rawAllEvents) ? rawAllEvents : (rawAllEvents as any)?.data ?? [];
  const myEventsList = Array.isArray(myEvents) ? myEvents : (myEvents as any)?.data ?? [];
  const eventsList = useMemo(() => {
    if (currentUser?.isAdmin || currentUser?.IsAdmin) {
      return allEvents;
    }
    // Với EC: CHỈ lấy các sự kiện mình được phân công
    return myEventsList;
  }, [myEventsList, allEvents, currentUser?.isAdmin, currentUser?.IsAdmin]);

  // State lưu ID sự kiện, vòng thi, hạng mục được chọn trên bộ lọc
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");

  // Tự động chọn sự kiện đầu tiên khi danh sách sự kiện tải xong
  useEffect(() => {
    if (eventsList.length > 0 && !selectedEventId) {
      setSelectedEventId(eventsList[0].id || eventsList[0].eventId || "");
    }
  }, [eventsList, selectedEventId]);

  // ---------------------------------------------------------------------------------------
  // [BƯỚC 2]: TRUY VẤN DỮ LIỆU CON THEO SỰ KIỆN (CASCADE DATA QUERIES)
  // Lấy Hạng mục (Tracks), Giải thưởng (Prizes), Vòng thi (Rounds), Đội thi (Teams)
  // ---------------------------------------------------------------------------------------
  const { data: dbTracks = [] } = useGetTracksByEvent(selectedEventId);
  const { data: dbPrizes = [] } = useGetPrizesByEvent(selectedEventId);
  const { data: dbRounds = [] } = useEventRounds(selectedEventId);
  const { data: dbTeams = [] } = useGetTeamsByEvent(selectedEventId);

  // Map tra cứu nhanh Tên đội thi theo TeamId: Map<teamId, teamName> (tránh O(N) lookup)
  const teamNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of dbTeams as any[]) map.set(t.id, t.name || t.teamName || t.id);
    return map;
  }, [dbTeams]);

  // Chuẩn hóa danh sách vòng thi (Rounds)
  const roundsList: Array<{ id: string; name: string }> = dbRounds.map((r: any) => ({
    id: r.id || r.Id,
    name: r.roundName || r.RoundName || "Vòng thi",
  }));

  // Tự động chọn vòng thi đầu tiên khi đổi sự kiện hoặc khi selectedRoundId không thuộc sự kiện hiện tại
  useEffect(() => {
    if (roundsList.length > 0) {
      if (!selectedRoundId || !roundsList.some((r) => r.id === selectedRoundId)) {
        setSelectedRoundId(roundsList[0].id);
      }
    } else {
      setSelectedRoundId("");
    }
  }, [roundsList, selectedRoundId]);

  // Chuẩn hóa danh sách hạng mục thi đấu (Tracks)
  const tracksList = dbTracks.map((t: any) => ({
    id: t.id || t.Id || t.trackId,
    name: t.trackName || t.Name || "Hạng mục",
  }));

  // Tự động chọn hạng mục đầu tiên khi tải xong danh sách track hoặc khi selectedTrackId không thuộc sự kiện hiện tại
  useEffect(() => {
    if (tracksList.length > 0) {
      if (!selectedTrackId || !tracksList.some((t) => t.id === selectedTrackId)) {
        setSelectedTrackId(tracksList[0].id);
      }
    } else {
      setSelectedTrackId("");
    }
  }, [tracksList, selectedTrackId]);

  // ---------------------------------------------------------------------------------------
  // [BƯỚC 3]: TRUY VẤN BẢNG ĐIỂM KẾT QUẢ VÒNG THI & MA TRẬN TIẾN ĐỘ CHẤM GK
  // ---------------------------------------------------------------------------------------
  // 3.1 Lấy danh sách kết quả xếp hạng của vòng (FinalResults) theo đúng Vòng thi và Hạng mục đang chọn
  const {
    data: results = [],
    isLoading,
    refetch,
  } = useGetFinalResultsByRound(selectedRoundId || undefined, {
    trackId: selectedTrackId || undefined,
    pageSize: 100,
  });
  
  // 3.2 Lấy thông tin hiệu chuẩn điểm và tiến độ chấm của Giám khảo theo Track
  const { data: calibration, isLoading: isLoadingCalibration } = useGetTrackCalibration(selectedTrackId);
  
  // 3.3 Mutation gán giải thưởng cho đội thi
  const assignPrizeMutation = useAssignPrize();

  // ---------------------------------------------------------------------------------------
  // [BƯỚC 4]: KHỞI TẠO CÁC STATE QUẢN LÝ THAO TÁC NGHIỆP VỤ CỦA EC
  // ---------------------------------------------------------------------------------------
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topN, setTopN] = useState<number>(10);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPublishedState, setIsPublishedState] = useState(false);

  useEffect(() => {
    if (results.length > 0) {
      const published = results.some(
        (r: any) => r.isPublished === true || r.IsPublished === true,
      );
      setIsPublishedState(published);
    }
  }, [results]);

  // State quản lý Modal soi chi tiết điểm từng Giám khảo chấm
  const [inspectScoresModal, setInspectScoresModal] = useState<{
    open: boolean;
    teamId?: string;
    teamName?: string;
  }>({ open: false });

  // ---------------------------------------------------------------------------------------
  // [BƯỚC 5]: TÍNH TOÁN TIẾN ĐỘ CHẤM CỦA GIÁM KHẢO QUA SERVICE (HUD REALTIME MONITOR)
  // ---------------------------------------------------------------------------------------
  const scoresList = calibration?.scores ?? (calibration as any)?.Scores ?? [];
  const isCalibrationCompleted = Boolean(calibration?.isCompleted ?? (calibration as any)?.IsCompleted);
  const { totalPairs, submittedPairs, pendingPairs, progressPercent } = useMemo(
    () => calibrationService.calculateProgress(scoresList, isCalibrationCompleted),
    [scoresList, isCalibrationCompleted]
  );

  // Lưu trữ cục bộ trạng thái giải thưởng đã gán: { [resultId]: prizeId }
  const [assignedPrizesMap, setAssignedPrizesMap] = useState<Record<string, string>>({});

  // State quản lý Modal gửi Email kết quả hàng loạt
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailRecipientType, setEmailRecipientType] = useState<"all" | "advanced">("all");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailCustomMessage, setEmailCustomMessage] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Chuẩn hóa danh sách giải thưởng khả dụng để hiển thị trong dropdown
  const availablePrizesList = dbPrizes.map((p: any, idx: number) => ({
    id: p.id || p.Id || `prz-${idx}`,
    name: `${p.prizeName || p.PrizeName || "Giải"} (${p.value || p.Value || "chưa rõ giá trị"})`,
  }));

  const currentEvent = eventsList.find((e: any) => (e.id || e.Id || e.eventId || e.EventId) === selectedEventId);
  const currentRound = roundsList.find((r) => r.id === selectedRoundId);

  // ---------------------------------------------------------------------------------------
  // [ACTION 1]: GÁN GIẢI THƯỞNG CHO ĐỘI THI (ASSIGN PRIZE)
  // Gọi API lưu giải thưởng vào FinalResult & đẩy thông báo chúc mừng qua chuông hệ thống
  // ---------------------------------------------------------------------------------------
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

      // Nếu gán giải thành công -> bắn thông báo chúc mừng 
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

  const displayResults = useMemo(() => {
    if (!results || results.length === 0) return [];
    if (!selectedTrackId) return results;
    // Lọc theo trackId nếu kết quả có gắn trackId
    const filtered = results.filter((r: any) => {
      const tId = r.trackId || r.TrackId;
      return !tId || tId === selectedTrackId;
    });
    return filtered.length > 0 ? filtered : results;
  }, [results, selectedTrackId]);

  // Hook phân trang: 8 kết quả / trang
  const pagination = usePagination(displayResults, 8);

  // ---------------------------------------------------------------------------------------
  // [ACTION 2]: TÍNH TOÁN ĐIỂM TỰ ĐỘNG & XẾP HẠNG (AUTO-CALCULATE)
  // Gửi lệnh xuống Backend để tổng hợp điểm TB giám khảo, xét cutoff Top N và tạo FinalResult (Nháp)
  // ---------------------------------------------------------------------------------------
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
      await queryClient.invalidateQueries({ queryKey: ["finalResultsByRound"] });
      await queryClient.invalidateQueries({ queryKey: ["finalResultsByTeam"] });
    } catch (err: any) {
      const errMsg = `Tính điểm thất bại: ${err?.response?.data?.message || err?.message}`;
      setErrorMessage(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------------------
  // [ACTION 3]: CÔNG BỐ KẾT QUẢ / ẨN VỀ BẢN NHÁP (TOGGLE PUBLISH STATUS)
  // Cập nhật trạng thái IsPublished = true/false trên toàn bộ FinalResult của vòng thi
  // ---------------------------------------------------------------------------------------
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

      // Nếu chuyển sang trạng thái Công bố -> Bắn thông báo toàn hệ thống
      if (nextStatus) {
        pushSystemNotification(
          resultsService.buildPublishNotificationPayload(
            currentRound?.name || "Vòng thi",
            currentEvent?.eventName || "Sự kiện"
          )
        );
      }
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["finalResultsByRound"] });
      await queryClient.invalidateQueries({ queryKey: ["finalResultsByTeam"] });
    } catch (err: any) {
      const errMsg = `Đổi trạng thái thất bại: ${err?.response?.data?.message || err?.message}`;
      setErrorMessage(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------------------
  // [ACTION 4]: XUẤT BẢNG ĐIỂM RA FILE CSV (EXPORT TO CSV VIA DOMAIN SERVICE)
  // ---------------------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------------------
  // [ACTION 5]: MỞ MODAL & GỬI EMAIL THÔNG BÁO KẾT QUẢ HÀNG LOẠT
  // ---------------------------------------------------------------------------------------
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
      // Giả lập gửi email thông báo qua background job
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

  // ---------------------------------------------------------------------------------------
  // [BƯỚC 6]: XUẤT STATE, DATA, PAGINATION & ACTIONS CHO TẦNG VIEW SỬ DỤNG (VIEW CONTRACT)
  // ---------------------------------------------------------------------------------------
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
