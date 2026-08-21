"use client";

import { useMemo, useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { useGetSubmitResultsByTrack } from "@/repositories/submitResultsRepository";
import { useGetTemplate } from "@/repositories/templatesRepository";
import { useSaveScore, useGetScoresByEventRole } from "@/repositories/scoresRepository";
import { useMyAssignedJudgeTracks } from "@/viewModels/useMyAssignedJudgeTracks";
import { useEvents } from "@/repositories/eventsRepository";
import { useEventRounds } from "@/repositories/events/eventsRepository";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/providers/ToastProvider";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { Scale, ChevronLeft, ChevronRight } from "lucide-react";
import { pushSystemNotification } from "@/repositories/shared/notificationsRepository";

const normalizeId = (id?: string | null) => (id || "").replace(/-/g, "").toLowerCase();

function formatDateTime(iso?: string): string {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })} ${d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function JudgeScoringView() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const prefillSubId = searchParams?.get("subId");
  const prefillTrackId = searchParams?.get("trackId") || "";

  const { user } = useAuth();
  const userId = user?.id || user?.userId || user?.UserID || (user as any)?.Id;

  // Lấy danh sách sự kiện để xác định trạng thái mở / đóng niêm phong
  const { data: rawEvents } = useEvents();
  const eventsList = useMemo(() => {
    const ev = (Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data) || [];
    return Array.isArray(ev) ? ev : [];
  }, [rawEvents]);

  // Danh sách Track được phân công làm Giám Khảo
  const { assignedTracks, isLoading: loadingTracks } = useMyAssignedJudgeTracks();

  const [selectedTrackId, setSelectedTrackId] = useState("");

  // Tìm chính xác Track được chọn theo trackId truyền qua URL (chuẩn hóa ID tránh lệch gạch nối)
  const selectedTrack = useMemo(() => {
    const targetNorm = normalizeId(selectedTrackId) || normalizeId(prefillTrackId);
    if (!targetNorm && assignedTracks.length > 0) return assignedTracks[0];
    return assignedTracks.find((t) => normalizeId(t.trackId) === targetNorm) || assignedTracks[0];
  }, [assignedTracks, selectedTrackId, prefillTrackId]);

  const activeTrackId = selectedTrack?.trackId || "";
  const eventId = selectedTrack?.eventId || "";
  const eventRoleId = selectedTrack?.eventRoleId || "";

  const currentEvent = useMemo(() => {
    if (!eventId) return null;
    return eventsList.find((e: any) => normalizeId(e.id || e.Id) === normalizeId(eventId));
  }, [eventsList, eventId]);

  // Lấy danh sách vòng thi để xác định khung giờ nộp bài và chấm điểm
  const { data: rawRounds = [] } = useEventRounds(eventId || undefined);
  const rounds = useMemo(() => {
    return Array.isArray(rawRounds) ? rawRounds : [];
  }, [rawRounds]);

  const now = Date.now();

  // Kiểm tra sự kiện đã đóng / kết thúc chưa
  const isEventEnded = Boolean(
    currentEvent && (currentEvent.status === false || (currentEvent.endDate && new Date(currentEvent.endDate).getTime() < now))
  );

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

  const submissionDeadlineStr = (selectedTrack as any)?.endDate || currentRound?.endDate || currentRound?.submissionDeadline || currentEvent?.endDate;
  const scoringStartDateStr = (selectedTrack as any)?.scoringStartDate || currentRound?.scoringStartDate;
  const scoringEndDateStr = (selectedTrack as any)?.scoringEndDate || currentRound?.scoringEndDate || currentRound?.evaluationEndDate || currentEvent?.endDate;

  const submissionDeadlineTime = submissionDeadlineStr ? new Date(submissionDeadlineStr).getTime() : null;
  const scoringStartTime = scoringStartDateStr ? new Date(scoringStartDateStr).getTime() : null;
  const scoringEndTime = scoringEndDateStr ? new Date(scoringEndDateStr).getTime() : null;

  // 1. Đang trong thời gian nộp bài (thí sinh vẫn còn quyền nộp/sửa bài -> chưa được chấm)
  const isSubmissionStillOpen = Boolean(!isEventEnded && submissionDeadlineTime && !isNaN(submissionDeadlineTime) && now <= submissionDeadlineTime);

  // 2. Chưa tới giờ mở cổng chấm điểm (chưa đến ScoringStartDate)
  const isBeforeScoringTime = Boolean(!isEventEnded && !isSubmissionStillOpen && scoringStartTime && !isNaN(scoringStartTime) && now < scoringStartTime);

  // 3. Đã quá hạn chấm điểm (quá ScoringEndDate)
  const isScoringTimeExpired = Boolean(!isEventEnded && scoringEndTime && !isNaN(scoringEndTime) && now > scoringEndTime);

  // 4. Bàn chấm có bị khóa chỉnh sửa không?
  const isScoringLocked = isEventEnded || isSubmissionStillOpen || isBeforeScoringTime || isScoringTimeExpired;

  // Lọc chỉ các Track thuộc ĐÚNG sự kiện hiện tại mà Giám khảo này được phân công
  const currentEventTracks = useMemo(() => {
    if (!eventId) return assignedTracks;
    const currentEventNorm = normalizeId(eventId);
    return assignedTracks.filter((t) => normalizeId(t.eventId) === currentEventNorm);
  }, [assignedTracks, eventId]);

  const { data: rawSubmissions = [], isLoading: loadingSubmissions } =
    useGetSubmitResultsByTrack(activeTrackId, eventId);
  const apiSubmissions = useMemo(() => {
    return Array.isArray(rawSubmissions) ? rawSubmissions : [];
  }, [rawSubmissions]);

  const { data: template } = useGetTemplate(selectedTrack?.templateId);
  const criteria = useMemo(() => {
    return template?.criterias ?? [];
  }, [template]);

  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);

  // Tự động chọn bài nộp đầu tiên hoặc theo query param
  useEffect(() => {
    if (prefillSubId && apiSubmissions.length > 0) {
      const match = apiSubmissions.find((s: any) => (s.id || s.Id) === prefillSubId);
      if (match) setSelectedSubmission(match);
    } else if (!selectedSubmission && apiSubmissions.length > 0) {
      setSelectedSubmission(apiSubmissions[0]);
    }
  }, [prefillSubId, apiSubmissions, selectedSubmission]);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");

  const { mutateAsync: saveScoreApi, isPending: isSaving } = useSaveScore();

  const { data: myScores = [] } = useGetScoresByEventRole(eventRoleId || undefined);
  const submittedIds = useMemo(
    () => new Set(myScores.filter((s) => s.isSubmitted).map((s) => s.submitResultId)),
    [myScores],
  );

  // Tự động nạp lại điểm số từng tiêu chí và nhận xét nếu giám khảo đã chấm/lưu nháp trước đó
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
      if (Array.isArray(detailsList) && detailsList.length > 0) {
        const loaded: Record<string, number> = {};
        detailsList.forEach((d: any) => {
          const cId = d.criteriaId || d.CriteriaId;
          if (cId) {
            loaded[cId] = Number(d.value ?? d.Value ?? 0);
          }
        });
        setScores(loaded);
      } else {
        setScores({});
      }
    } else {
      setScores({});
      setComment("");
    }
  }, [selectedSubmission, myScores]);

  // Tính tổng điểm RBL theo trọng số
  const calculatedTotalScore = useMemo(() => {
    let totalWeightedRatio = 0;
    let totalWeight = 0;
    criteria.forEach((cr) => {
      const crId = cr.criteriaId || "";
      const val = scores[crId] ?? 0;
      const max = Number(cr.maxScore) || 10;
      const w = Number(cr.weight) || 0;
      totalWeightedRatio += (val / max) * w;
      totalWeight += w;
    });
    if (totalWeight === 0) return 0;
    return Math.min(10, Math.max(0, Number(((totalWeightedRatio / totalWeight) * 10).toFixed(2))));
  }, [scores, criteria]);

  const handleScoreChange = (criteriaId: string, val: number, maxScore: number) => {
    const clamped = Math.min(maxScore, Math.max(0, val));
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
      setSaveOk(`[✓ ${okMsg}]`);
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

  if (!user) {
    return (
      <PageShell className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <EmptyState
            icon={Scale}
            title="Bàn chấm điểm giám khảo"
            description="Vui lòng đăng nhập với tài khoản Giám khảo để mở bàn chấm điểm."
            action={
              <Link href="/login">
                <Button accent="judge">Đến trang đăng nhập</Button>
              </Link>
            }
          />
        </Card>
      </PageShell>
    );
  }

  const sub = selectedSubmission;
  const subId = sub?.id || sub?.Id || "";
  const displayCode = subId ? `SUB-${String(subId).slice(0, 8).toUpperCase()}` : "";
  const submissionUrl = sub?.submissionUrl || sub?.SubmissionUrl || "";
  const isGraded = submittedIds.has(subId);

  if (loadingTracks && assignedTracks.length === 0) {
    return (
      <PageShell className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="py-12 text-center">
          <p className="animate-pulse text-sm text-[var(--text-muted)]">
            Đang kết nối hạng mục phân công chấm thi…
          </p>
        </Card>
      </PageShell>
    );
  }

  if (!loadingTracks && assignedTracks.length === 0) {
    return (
      <PageShell className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <EmptyState
            icon={Scale}
            title="Chưa được phân công hạng mục nào"
            description="Vui lòng liên hệ Ban Tổ Chức để được cấp quyền chấm điểm trong sự kiện."
            action={
              <Link href="/events">
                <Button variant="secondary" accent="judge">
                  Quay lại danh sách sự kiện
                </Button>
              </Link>
            }
          />
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell className="flex min-h-[calc(100vh-4rem)] max-w-[1600px] flex-col space-y-4">
        <PageHeader
          breadcrumb={
            eventId ? (
              <Link
                href={`/events/${eventId}`}
                className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--accent-judge)]"
              >
                <ChevronLeft className="h-4 w-4" />
                Quay lại chi tiết sự kiện
              </Link>
            ) : (
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--accent-judge)]"
              >
                <ChevronLeft className="h-4 w-4" />
                Khám phá sự kiện
              </Link>
            )
          }
          title="Bàn chấm giám khảo"
          description={selectedTrack?.trackName || "Hạng mục"}
        />

        {currentEventTracks.length > 1 && (
          <Card className="flex flex-wrap items-center gap-2 p-3">
            <span className="text-xs font-medium text-[var(--text-muted)]">Chọn hạng mục:</span>
            {currentEventTracks.map((t) => {
              const isCurrent = normalizeId(t.trackId) === normalizeId(activeTrackId);
              return (
                <Button
                  key={t.trackId}
                  type="button"
                  variant={isCurrent ? "primary" : "secondary"}
                  accent="judge"
                  className="text-xs"
                  onClick={() => {
                    setSelectedTrackId(t.trackId);
                    setSelectedSubmission(null);
                  }}
                >
                  {t.trackName}
                </Button>
              );
            })}
          </Card>
        )}

        {/* ── BANNER TRẠNG THÁI KHUNG GIỜ NỘP BÀI & CHẤM ĐIỂM ── */}
        {isEventEnded ? (
          <div className="p-3.5 bg-zinc-900/90 border border-amber-500/50 hud-clipped flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs shadow-sm">
            <div className="flex items-center gap-2 text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="font-bold uppercase">
                [ 🔒 ĐÃ NIÊM PHONG: SỰ KIỆN ĐÃ KẾT THÚC // CHẾ ĐỘ XEM ĐIỂM CHỈ ĐỌC ]
              </span>
            </div>
            {eventId && (
              <Link href={`/events/${eventId}/leaderboard`}>
                <button className="px-3.5 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-black font-bold uppercase text-[11px] hud-clipped transition-all cursor-pointer">
                  [ XEM BẢNG XẾP HẠNG SỰ KIỆN &gt; ]
                </button>
              </Link>
            )}
          </div>
        ) : isSubmissionStillOpen ? (
          <div className="p-3.5 bg-amber-950/40 border border-amber-500/50 hud-clipped flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs shadow-sm">
            <div className="space-y-1 text-amber-300">
              <div className="flex items-center gap-2 font-bold uppercase">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span>[ ⏳ ĐANG TRONG THỜI GIAN NỘP BÀI // THÍ SINH CÒN QUYỀN NỘP &amp; SỬA BÀI ]</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans pl-4.5">
                Bàn chấm điểm sẽ chính thức mở sau khi kết thúc nộp bài: <strong className="text-amber-200">{formatDateTime(submissionDeadlineStr)}</strong>
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold uppercase text-[11px] hud-clipped shrink-0">
              [ CHƯA MỞ CHẤM ]
            </span>
          </div>
        ) : isBeforeScoringTime ? (
          <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/50 hud-clipped flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs shadow-sm">
            <div className="space-y-1 text-cyan-300">
              <div className="flex items-center gap-2 font-bold uppercase">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>[ ⏳ CHƯA ĐẾN KHUNG GIỜ CHẤM ĐIỂM CỦA HẠNG MỤC ]</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans pl-4.5">
                Cổng chấm điểm sẽ mở vào lúc: <strong className="text-cyan-200">{formatDateTime(scoringStartDateStr)}</strong>
              </p>
            </div>
            <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold uppercase text-[11px] hud-clipped shrink-0">
              [ CHỜ MỞ CỔNG ]
            </span>
          </div>
        ) : isScoringTimeExpired ? (
          <div className="p-3.5 bg-zinc-900/90 border border-zinc-700 hud-clipped flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs shadow-sm">
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
              <span className="font-bold uppercase">
                [ 🔒 ĐÃ HẾT HẠN CHẤM ĐIỂM CỦA HẠNG MỤC NÀY // ĐIỂM SỐ ĐÃ ĐƯỢC ĐÓNG BĂNG ]
              </span>
            </div>
            {eventId && (
              <Link href={`/events/${eventId}/leaderboard`}>
                <button className="px-3.5 py-1.5 bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-white hover:text-black font-bold uppercase text-[11px] hud-clipped transition-all cursor-pointer">
                  [ XEM BẢNG XẾP HẠNG &gt; ]
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 hud-clipped flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs shadow-sm">
            <div className="flex items-center gap-2 text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold uppercase">
                [ ● CỔNG CHẤM ĐIỂM ĐANG MỞ ]
              </span>
            </div>
            <span className="text-zinc-400 text-[11px]">
              Hạn chót chấm điểm: <strong className="text-emerald-300">{scoringEndDateStr ? formatDateTime(scoringEndDateStr) : "Theo kế hoạch sự kiện"}</strong>
            </span>
          </div>
        )}

        {/* ── NẾU ĐANG TRONG THỜI GIAN NỘP BÀI HOẶC CHƯA ĐẾN GIỜ CHẤM: HIỂN THỊ MÀN HÌNH CHỜ GIÁM KHẢO (ẨN HOÀN TOÀN BẢNG ĐIỂM) ── */}
        {(isSubmissionStillOpen || isBeforeScoringTime) ? (
          <div className="flex-1 bg-[#10171a] border border-amber-500/40 p-8 md:p-12 hud-clipped flex flex-col items-center justify-center text-center space-y-6 shadow-lg font-mono">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-300 text-3xl animate-pulse">
              ⏳
            </div>

            <div className="space-y-2 max-w-xl">
              <span className="px-3 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase hud-clipped inline-block">
                [ CỔNG CHẤM ĐIỂM CHƯA MỞ ]
              </span>
              <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white uppercase tracking-wide">
                {isSubmissionStillOpen ? "Thí Sinh Đang Trong Thời Gian Nộp Bài" : "Chưa Đến Khung Giờ Chấm Điểm"}
              </h2>
              <p className="font-sans text-sm text-zinc-300 leading-relaxed pt-2">
                {isSubmissionStillOpen
                  ? "Các đội thi hiện đang trong thời gian nộp và hoàn thiện đề án. Để bảo đảm tính bảo mật, công bằng và quyền chỉnh sửa của thí sinh, toàn bộ bài nộp và Bàn chấm điểm sẽ tự động mở sau khi hết hạn nộp bài."
                  : "Khung giờ đánh giá của Hội đồng Giám khảo chưa bắt đầu. Cổng chấm điểm sẽ tự động kích hoạt khi đến thời gian quy định."}
              </p>
            </div>

            {/* Thông tin mốc thời gian */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg w-full pt-2">
              <div className="p-4 bg-[#090e11] border border-zinc-800 space-y-1 hud-clipped">
                <span className="text-[10px] text-zinc-500 uppercase block font-bold">Hạn Khóa Nộp Bài:</span>
                <span className="text-amber-300 font-bold text-sm block">
                  {formatDateTime(submissionDeadlineStr)}
                </span>
              </div>

              <div className="p-4 bg-[#090e11] border border-zinc-800 space-y-1 hud-clipped">
                <span className="text-[10px] text-zinc-500 uppercase block font-bold">Mở Cổng Chấm Điểm:</span>
                <span className="text-cyan-300 font-bold text-sm block">
                  {formatDateTime(scoringStartDateStr || submissionDeadlineStr)}
                </span>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              {eventId && (
                <Link href={`/events/${eventId}`}>
                  <button className="px-5 py-2.5 bg-amber-500 hover:bg-white text-black font-bold uppercase text-xs hud-clipped transition-all cursor-pointer shadow-sm">
                    [ &lt; QUAY LẠI TRANG SỰ KIỆN ]
                  </button>
                </Link>
              )}
              <Link href="/profile">
                <button className="px-4 py-2.5 bg-[#141f23] border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-bold uppercase text-xs hud-clipped transition-all cursor-pointer">
                  [ HỒ SƠ &amp; PHÂN CÔNG ]
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <Card className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between">
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Badge tone="judge">{selectedTrack?.trackName}</Badge>
                <span className="text-xs text-[var(--text-muted)]">
                  Tiến độ:{" "}
                  <strong className="font-semibold text-[var(--color-success)]">
                    {submittedIds.size} / {apiSubmissions.length}
                  </strong>{" "}
                  bài đã chấm
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <Button
                  type="button"
                  variant="secondary"
                  accent="judge"
                  className="shrink-0 text-xs"
                  onClick={handlePrevSubmission}
                  disabled={currentSubIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Bài trước
                </Button>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {apiSubmissions.map((item: any, idx: number) => {
                    const itemId = item.id || item.Id || `sub-${idx}`;
                    const isSelected = (sub?.id || sub?.Id) === itemId;
                    const itemGraded = submittedIds.has(itemId);
                    const code = `SUB-${String(itemId).slice(0, 6).toUpperCase()}`;

                    return (
                      <Button
                        key={itemId}
                        type="button"
                        variant={isSelected ? "primary" : itemGraded ? "secondary" : "ghost"}
                        accent={itemGraded && !isSelected ? "primary" : "judge"}
                        className={`shrink-0 text-xs ${itemGraded && !isSelected ? "border-[var(--color-success)]/40 text-[var(--color-success)]" : ""}`}
                        onClick={() => {
                          setSelectedSubmission(item);
                          setScores({});
                          setSaveError("");
                          setSaveOk("");
                        }}
                      >
                        {code}
                        {itemGraded && <span className="text-[10px]">✓</span>}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  accent="judge"
                  className="shrink-0 text-xs"
                  onClick={handleNextSubmission}
                  disabled={currentSubIndex >= apiSubmissions.length - 1}
                >
                  Bài tiếp
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            {/* ── TẦNG 3: BỐ CỤC 2 CỘT (HỒ SƠ BÀI THI & BẢNG CHẤM RUBRIC) ── */}
            {apiSubmissions.length === 0 ? (
              <div className="flex-1 bg-[#10171a] border border-zinc-800 p-12 text-center flex flex-col items-center justify-center gap-3 hud-clipped">
                <div className="font-mono text-xs text-amber-400 font-bold uppercase">[ CHƯA CÓ BÀI THI ]</div>
                <h3 className="font-display text-base font-bold text-white uppercase">Hạng mục này hiện chưa có bài nộp nào</h3>
                <p className="text-xs text-zinc-400 max-w-md">
                  Khi các đội thi thuộc Hạng mục nộp bài giải pháp, danh sách bài thi sẽ tự động hiển thị tại đây để bạn chấm điểm.
                </p>
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

                {/* ── CỘT TRÁI (55% / 7 COLS): HỒ SƠ BÀI DỰ THI ẨN DANH ── */}
                <div className="lg:col-span-7 bg-[#10171a] border border-zinc-800 p-5 md:p-6 hud-clipped flex flex-col justify-between space-y-4 shadow-sm">
                  <div className="space-y-4">
                    {/* Header bài thi */}
                    <div className="border-b border-zinc-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-extrabold uppercase hud-clipped">
                          {displayCode || "SUB-ANON"}
                        </span>
                        <h2 className="font-display text-base md:text-lg font-bold text-white uppercase">
                          Bài Dự Thi Ẩn Danh
                        </h2>
                      </div>
                      <span className="font-mono text-[11px] text-zinc-400 uppercase">
                        Vị trí: {currentSubIndex + 1} / {apiSubmissions.length}
                      </span>
                    </div>

                    {/* Cam kết bảo mật ẩn danh */}
                    <div className="p-3 bg-[#090e11] border border-zinc-800 text-zinc-400 font-mono text-xs space-y-1 hud-clipped">
                      <div className="text-amber-400 font-bold text-[11px] uppercase">
                        [ NGUYÊN TẮC CHẤM THI ẨN DANH ]
                      </div>
                      <p className="text-[11px] leading-relaxed text-zinc-400">
                        Toàn bộ thông tin định danh thí sinh và trường học đã được ẩn. Vui lòng chấm điểm độc lập dựa trên chất lượng sản phẩm và khung Rubric.
                      </p>
                    </div>

                    {/* Mô tả giải pháp */}
                    <div className="space-y-2">
                      <span className="font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                        [ TÓM TẮT GIẢI PHÁP &amp; NỘI DUNG ]
                      </span>
                      <div className="p-4 bg-[#090e11] border border-zinc-800 font-sans text-xs text-zinc-200 leading-relaxed min-h-[100px] hud-clipped">
                        {sub?.description || sub?.Description || "Đội thi đã nộp sản phẩm hoàn thiện. Vui lòng nhấn nút bên dưới để mở liên kết kiểm tra mã nguồn và sản phẩm thực tế."}
                      </div>
                    </div>

                    {/* Danh mục tài liệu / Liên kết bài nộp */}
                    <div className="space-y-2">
                      <span className="font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                        [ LIÊN KẾT BÀI NỘP / SẢN PHẨM ]
                      </span>
                      {submissionUrl ? (
                        <div className="p-3 bg-[#090e11] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hud-clipped">
                          <div className="min-w-0 flex-1 font-mono text-xs text-cyan-300 truncate">
                            {submissionUrl}
                          </div>
                          <a
                            href={submissionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-cyan-500 text-black hover:bg-white font-mono text-xs font-bold uppercase transition-all hud-clipped cursor-pointer shrink-0 text-center"
                          >
                            [ XEM BÀI NỘP TRỰC TIẾP &gt; ]
                          </a>
                        </div>
                      ) : (
                        <div className="p-3 bg-[#090e11] border border-zinc-800 text-zinc-500 font-mono text-xs text-center hud-clipped">
                          [ ĐỘI THI CHƯA ĐÍNH KÈM LIÊN KẾT SẢN PHẨM ]
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer bài nộp */}
                  <div className="pt-3 border-t border-zinc-800 flex items-center justify-between font-mono text-xs text-zinc-500">
                    <span>Trạng thái: {isGraded ? <strong className="text-emerald-400 font-bold">[ ĐÃ CHỐT ĐIỂM ]</strong> : <strong className="text-amber-400 font-bold">[ ĐANG CHỜ CHẤM ]</strong>}</span>
                    <span>Mã số: {subId || "—"}</span>
                  </div>
                </div>

                {/* ── CỘT PHẢI (45% / 5 COLS): KHUNG CHẤM ĐIỂM RUBRIC ── */}
                <div className="lg:col-span-5 bg-[#10171a] border border-amber-500/40 p-5 md:p-6 hud-clipped flex flex-col justify-between space-y-4 shadow-lg">
                  <div className="space-y-4">
                    {/* Tổng điểm RBL */}
                    <div className="p-4 bg-[#090e11] border border-amber-500/40 text-center space-y-1 hud-clipped">
                      <span className="font-mono text-[11px] text-amber-400 uppercase tracking-widest font-bold block">
                        [ TỔNG ĐIỂM RBL CHUNG CUỘC ]
                      </span>
                      <div className="font-mono text-3xl sm:text-4xl font-extrabold text-amber-300 flex items-baseline justify-center gap-1.5">
                        <span>{calculatedTotalScore.toFixed(2)}</span>
                        <span className="text-sm font-normal text-zinc-500">/ 10.00 đ</span>
                      </div>
                    </div>

                    {/* Danh sách Tiêu chí Rubric */}
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {criteria.map((cr, idx) => {
                        const crId = cr.criteriaId || `crit-${idx}`;
                        const max = Number(cr.maxScore) || 10;
                        const weight = Number(cr.weight) || 0;
                        const currentVal = scores[crId] ?? 0;
                        const weightedScore = ((currentVal / max) * weight) / 10;

                        return (
                          <div
                            key={crId}
                            className="p-3 bg-[#090e11] border border-zinc-800 space-y-2 hud-clipped hover:border-zinc-700 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2 font-mono text-xs">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase hud-clipped">
                                  {weight}%
                                </span>
                                <span className="font-bold text-white text-xs">{cr.criteriaName}</span>
                              </div>
                              <span className="text-emerald-400 font-bold text-xs">
                                +{weightedScore.toFixed(2)} đ
                              </span>
                            </div>

                            {cr.description && (
                              <p className="font-sans text-[11px] text-zinc-400 line-clamp-2">
                                {cr.description}
                              </p>
                            )}

                            {/* Nút chọn nhanh & Bộ điều chỉnh Stepper */}
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800">
                              <div className="flex items-center gap-1">
                                {[5.0, 7.0, 8.5, 10.0].map((val) => {
                                  const isSelected = Math.abs(currentVal - val) < 0.1;
                                  return (
                                    <button
                                      key={val}
                                      type="button"
                                      disabled={isScoringLocked}
                                      onClick={() => handleScoreChange(crId, val, max)}
                                      className={`px-2 py-1 font-mono text-xs font-bold transition-all hud-clipped ${
                                        isSelected
                                          ? "bg-amber-500 text-black font-extrabold"
                                          : "bg-[#141f23] text-zinc-400 border border-zinc-700 hover:text-white"
                                      } ${isScoringLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                    >
                                      {val.toFixed(1)}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="flex items-center gap-1 bg-[#141f23] p-0.5 border border-zinc-700 hud-clipped">
                                <button
                                  type="button"
                                  disabled={isScoringLocked}
                                  onClick={() => handleScoreChange(crId, Math.max(0, currentVal - 0.5), max)}
                                  className={`w-7 h-7 bg-zinc-800 text-amber-300 font-mono font-bold text-sm transition-all flex items-center justify-center ${
                                    isScoringLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-amber-500 hover:text-black cursor-pointer"
                                  }`}
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  max={max}
                                  step={0.5}
                                  disabled={isScoringLocked}
                                  value={currentVal === 0 ? "" : currentVal}
                                  placeholder="0.0"
                                  onChange={(e) => handleScoreChange(crId, Number(e.target.value), max)}
                                  className="w-12 h-7 bg-transparent text-center font-mono text-sm font-extrabold text-amber-300 focus:outline-none disabled:opacity-60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                  type="button"
                                  disabled={isScoringLocked}
                                  onClick={() => handleScoreChange(crId, Math.min(max, currentVal + 0.5), max)}
                                  className={`w-7 h-7 bg-zinc-800 text-amber-300 font-mono font-bold text-sm transition-all flex items-center justify-center ${
                                    isScoringLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-amber-500 hover:text-black cursor-pointer"
                                  }`}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Nhận xét chuyên môn */}
                    <div className="space-y-1.5">
                      <span className="font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                        [ NHẬN XÉT CHUYÊN MÔN ]
                      </span>
                      <textarea
                        value={comment}
                        disabled={isScoringLocked}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Ghi chú đánh giá chuyên môn dành cho đội thi..."
                        className="w-full h-20 p-2.5 bg-[#090e11] text-white font-sans text-xs border border-zinc-800 focus:border-amber-400 focus:outline-none transition-colors leading-relaxed resize-none hud-clipped disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      {saveError && <p className="font-mono text-[11px] text-red-400">{saveError}</p>}
                      {saveOk && <p className="font-mono text-[11px] text-emerald-400">{saveOk}</p>}
                    </div>
                  </div>

                  {/* Các nút hành động */}
                  <div className="space-y-2 pt-2 border-t border-amber-500/20 font-mono text-xs">
                    {isScoringLocked ? (
                      <div className="p-3 bg-[#090e11] border border-zinc-800 text-center text-zinc-400 font-bold uppercase text-xs hud-clipped">
                        {isEventEnded
                          ? "[ 🔒 ĐÃ NIÊM PHONG: SỰ KIỆN ĐÃ ĐÓNG - KHÔNG THỂ THAY ĐỔI ĐIỂM ]"
                          : "[ 🔒 ĐÃ NIÊM PHONG: ĐÃ HẾT HẠN CHẤM ĐIỂM CỦA HẠNG MỤC ]"}
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleSaveScore(true, true)}
                          className="w-full py-3 bg-amber-500 hover:bg-white text-black font-extrabold uppercase transition-all cursor-pointer hud-clipped shadow-md disabled:opacity-40"
                        >
                          [ CHỐT ĐIỂM &amp; CHUYỂN BÀI TIẾP THEO &gt; ]
                        </button>

                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleSaveScore(false)}
                          className="w-full py-2 bg-[#141f23] border border-zinc-700 text-zinc-300 hover:text-white hover:border-amber-500/50 font-bold uppercase transition-all cursor-pointer hud-clipped disabled:opacity-40"
                        >
                          [ LƯU TẠM BẢN NHÁP ]
                        </button>
                      </>
                    )}
                  </div>
                </div>

              </div>
            )}
          </>
        )}

    </PageShell>
  );
}
