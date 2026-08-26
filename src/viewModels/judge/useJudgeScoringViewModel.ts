import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useGetSubmitResultsByTrack } from "@/repositories/submitResultsRepository";
import { useGetTemplate } from "@/repositories/templatesRepository";
import { useSaveScore, useGetScoresByEventRole } from "@/repositories/scoresRepository";
import { useMyAssignedJudgeTracks } from "@/viewModels/judge/useMyAssignedJudgeTracks";
import { useEvents } from "@/repositories/eventsRepository";
import { useEventRounds } from "@/repositories/events/eventsRepository";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/providers/ToastProvider";
import { pushSystemNotification } from "@/repositories/shared/notificationsRepository";
import { scoringService } from "@/services/judge/scoringService";

const normalizeId = (id?: string | null) => (id || "").replace(/-/g, "").toLowerCase();

export function useJudgeScoringViewModel() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillSubId = searchParams?.get("subId");
  const prefillTrackId = searchParams?.get("trackId") || "";

  const { user } = useAuth();
  const userId = user?.id || user?.userId || user?.UserID || (user as any)?.Id;

  const { data: rawEvents } = useEvents();
  const eventsList = useMemo(() => {
    const ev = (Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data) || [];
    return Array.isArray(ev) ? ev : [];
  }, [rawEvents]);

  const { assignedTracks, isLoading: loadingTracks } = useMyAssignedJudgeTracks();

  const [selectedTrackId, setSelectedTrackId] = useState("");

  const urlTrackIsAssigned = useMemo(() => {
    if (!prefillTrackId || assignedTracks.length === 0) return false;
    const urlNorm = normalizeId(prefillTrackId);
    return assignedTracks.some((t) => normalizeId(t.trackId) === urlNorm);
  }, [prefillTrackId, assignedTracks]);

  const selectedTrack = useMemo(() => {
    const urlNorm = normalizeId(prefillTrackId);
    if (urlNorm && urlTrackIsAssigned) {
      return assignedTracks.find((t) => normalizeId(t.trackId) === urlNorm) || assignedTracks[0];
    }
    if (selectedTrackId) {
      const picked = assignedTracks.find((t) => normalizeId(t.trackId) === normalizeId(selectedTrackId));
      if (picked) return picked;
    }
    return assignedTracks[0];
  }, [assignedTracks, selectedTrackId, prefillTrackId, urlTrackIsAssigned]);

  // Bỏ qua trackId URL cũ (không còn role) — chuyển sang track mới nhất
  useEffect(() => {
    if (loadingTracks || assignedTracks.length === 0) return;

    const resolved = selectedTrack;
    if (!resolved?.trackId) return;

    setSelectedTrackId((prev) => {
      if (normalizeId(prev) === normalizeId(resolved.trackId)) return prev;
      return resolved.trackId;
    });

    if (prefillTrackId && !urlTrackIsAssigned) {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set("trackId", resolved.trackId);
      router.replace(`/judge/scoring?${params.toString()}`);
    }
  }, [loadingTracks, assignedTracks, selectedTrack, prefillTrackId, urlTrackIsAssigned, router, searchParams]);

  const activeTrackId = selectedTrack?.trackId || "";
  const eventId = selectedTrack?.eventId || "";
  const eventRoleId = selectedTrack?.eventRoleId || "";

  const currentEvent = useMemo(() => {
    if (!eventId) return null;
    return eventsList.find((e: any) => normalizeId(e.id || e.Id) === normalizeId(eventId));
  }, [eventsList, eventId]);

  const { data: rawRounds = [] } = useEventRounds(eventId || undefined);
  const rounds = useMemo(() => {
    return Array.isArray(rawRounds) ? rawRounds : [];
  }, [rawRounds]);

  const now = Date.now();

  const currentRound = useMemo(() => {
    if (rounds.length === 0) return null;
    return rounds.find((r: any) => {
      const sDate = r.startDate || r.StartDate;
      const eDate = r.endDate || r.EndDate;
      if (!sDate || !eDate) return false;
      const s = new Date(sDate).getTime();
      const e = new Date(eDate).getTime();
      return now >= s && now <= e;
    }) || rounds[0];
  }, [rounds, now]);

  const {
    isEventEnded,
    isSubmissionStillOpen,
    isBeforeScoringTime,
    isScoringTimeExpired,
    isScoringLocked,
  } = useMemo(
    () =>
      scoringService.evaluateScoringTimeline({
        event: currentEvent,
        round: currentRound,
        track: selectedTrack,
        now,
      }),
    [currentEvent, currentRound, selectedTrack, now]
  );

  const submissionDeadlineStr = (selectedTrack as any)?.endDate || currentRound?.endDate || currentRound?.submissionDeadline || currentEvent?.endDate;
  const scoringStartDateStr = (selectedTrack as any)?.scoringStartDate || currentRound?.scoringStartDate;
  const scoringEndDateStr = (selectedTrack as any)?.scoringEndDate || currentRound?.scoringEndDate || currentRound?.evaluationEndDate || currentEvent?.endDate;

  const currentEventTracks = useMemo(() => {
    if (!eventId) return assignedTracks;
    const currentEventNorm = normalizeId(eventId);
    return assignedTracks.filter((t) => normalizeId(t.eventId) === currentEventNorm);
  }, [assignedTracks, eventId]);

  const { data: rawSubmissions, isLoading: loadingSubmissions } =
    useGetSubmitResultsByTrack(activeTrackId, eventId);
  const apiSubmissions = useMemo(() => {
    return Array.isArray(rawSubmissions) ? rawSubmissions : [];
  }, [rawSubmissions]);

  const { data: template } = useGetTemplate(selectedTrack?.templateId);
  const criteria = useMemo(() => {
    return template?.criterias ?? [];
  }, [template]);

  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);

  useEffect(() => {
    if (apiSubmissions.length === 0) {
      setSelectedSubmission(null);
      return;
    }
    if (prefillSubId) {
      const match = apiSubmissions.find((s: any) => (s.id || s.Id) === prefillSubId);
      if (match) {
        setSelectedSubmission((prev: any) => ((prev?.id || prev?.Id) === prefillSubId ? prev : match));
        return;
      }
    }
    setSelectedSubmission((prev: any) => {
      const prevId = prev?.id || prev?.Id;
      const exists = prevId && apiSubmissions.some((s: any) => (s.id || s.Id) === prevId);
      return exists ? prev : apiSubmissions[0];
    });
  }, [prefillSubId, apiSubmissions]);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");

  const { mutateAsync: saveScoreApi, isPending: isSaving } = useSaveScore();

  const { data: rawMyScores } = useGetScoresByEventRole(eventRoleId || undefined);
  const myScores = useMemo(() => {
    return Array.isArray(rawMyScores) ? rawMyScores : [];
  }, [rawMyScores]);

  const submittedIds = useMemo(
    () => new Set(myScores.filter((s) => s.isSubmitted).map((s) => s.submitResultId)),
    [myScores],
  );

  useEffect(() => {
    if (!selectedSubmission) {
      setScores({});
      setComment("");
      return;
    }
    const currentSubId = selectedSubmission.id || selectedSubmission.Id;
    const existingScore = myScores.find((s) => (s.submitResultId || (s as any).SubmitResultId) === currentSubId);
    if (existingScore) {
      setComment((existingScore as any).comment || (existingScore as any).Comment || "");
      const detailsList = (existingScore as any).details || (existingScore as any).Details || [];
      const scoreMap: Record<string, number> = {};
      detailsList.forEach((d: any) => {
        const cId = d.criteriaId || (d as any).CriteriaId;
        if (cId) scoreMap[cId] = Number(d.value ?? (d as any).Value ?? 0);
      });
      setScores(scoreMap);
    } else {
      setScores({});
      setComment("");
    }
  }, [selectedSubmission, myScores]);

  const calculatedTotalScore = useMemo(() => {
    if (criteria.length === 0) return 0;
    const criteriaItems = criteria.map((c) => ({
      id: c.criteriaId || "",
      name: c.criteriaName || "",
      maxScore: Number(c.maxScore) || 10,
      weight: Number(c.weight) || 0,
    }));
    return scoringService.calculateTotalScore(criteriaItems, scores);
  }, [scores, criteria]);

  const handleScoreChange = (criteriaId: string, val: number, maxScore: number) => {
    const clamped = scoringService.clampScore(val, maxScore);
    setScores((prev) => ({ ...prev, [criteriaId]: clamped }));
  };

  const currentSubIndex = useMemo(() => {
    if (!selectedSubmission || apiSubmissions.length === 0) return 0;
    const currentId = selectedSubmission.id || selectedSubmission.Id;
    const idx = apiSubmissions.findIndex((s: any) => (s.id || s.Id) === currentId);
    return idx >= 0 ? idx : 0;
  }, [selectedSubmission, apiSubmissions]);

  const handlePrevSubmission = () => {
    if (currentSubIndex > 0) {
      setSelectedSubmission(apiSubmissions[currentSubIndex - 1]);
      setScores({});
      setSaveError("");
      setSaveOk("");
    }
  };

  const handleNextSubmission = () => {
    if (currentSubIndex < apiSubmissions.length - 1) {
      setSelectedSubmission(apiSubmissions[currentSubIndex + 1]);
      setScores({});
      setSaveError("");
      setSaveOk("");
    }
  };

  const handleSaveScore = async (isFinalSubmit: boolean, autoAdvance = false) => {
    if (!selectedSubmission) {
      const msg = "Vui lòng chọn bài nộp cần chấm điểm.";
      setSaveError(msg);
      toast.error(msg);
      return;
    }
    setSaveError("");
    setSaveOk("");
    const submitResultId = selectedSubmission.id || selectedSubmission.Id;
    const currentTemplateId = selectedTrack?.templateId;
    if (!submitResultId || !currentTemplateId || !eventRoleId) {
      const msg = "Thiếu submitResultId/templateId/eventRoleId thật — không thể lưu điểm.";
      setSaveError(msg);
      toast.error(msg);
      return;
    }
    const payloadDetails = criteria.map((cr) => ({
      templateId: currentTemplateId,
      criteriaId: cr.criteriaId || "",
      value: scores[cr.criteriaId || ""] ?? 0,
    }));
    try {
      await saveScoreApi({
        eventRoleId,
        submitResultId,
        comment,
        isSubmitted: isFinalSubmit,
        details: payloadDetails,
      });
      const okMsg = isFinalSubmit ? "Đã khóa và chốt điểm chính thức thành công!" : "Đã lưu nháp bảng điểm thành công.";
      setSaveOk(`[${okMsg}]`);
      toast.success(okMsg);

      if (isFinalSubmit) {
        pushSystemNotification({
          title: "Đã hoàn tất chấm điểm bài thi",
          message: `Ban Giám Khảo đã hoàn tất chấm điểm bài thi cho Hạng mục "${selectedTrack?.trackName || 'Hạng mục'}". Bảng điểm đã được ghi nhận vào hệ thống!`,
          type: "success",
        });
      }

      if (autoAdvance && currentSubIndex < apiSubmissions.length - 1) {
        setTimeout(() => handleNextSubmission(), 600);
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || "Lưu điểm thất bại — vui lòng thử lại.";
      setSaveError(errMsg);
      toast.error(errMsg);
    }
  };

  return {
    state: {
      selectedTrackId,
      selectedTrack,
      activeTrackId,
      eventId,
      currentEvent,
      currentRound,
      isEventEnded,
      isSubmissionStillOpen,
      isBeforeScoringTime,
      isScoringTimeExpired,
      isScoringLocked,
      submissionDeadlineStr,
      scoringStartDateStr,
      scoringEndDateStr,
      selectedSubmission,
      scores,
      comment,
      saveError,
      saveOk,
      isSaving,
      calculatedTotalScore,
      currentSubIndex,
      submittedIds,
      loadingTracks,
      loadingSubmissions,
    },
    data: {
      assignedTracks,
      currentEventTracks,
      apiSubmissions,
      criteria,
      template,
      myScores,
    },
    actions: {
      setSelectedTrackId,
      setSelectedSubmission,
      setComment,
      handleScoreChange,
      handlePrevSubmission,
      handleNextSubmission,
      handleSaveScore,
    },
  };
}
