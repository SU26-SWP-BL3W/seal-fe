"use client";

import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useGetSubmitResultsByTrack } from "@/repositories/submitResultsRepository";
import { useGetTemplate } from "@/repositories/templatesRepository";
import { useSaveScore, useGetScoresByEventRole } from "@/repositories/scoresRepository";
import { useMyAssignedJudgeTracks } from "@/viewModels/useMyAssignedJudgeTracks";
import {
  Award,
  Save,
  Send,
  Code,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/providers/ToastProvider";

export function JudgeScoringView() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const prefillSubId = searchParams?.get("subId");
  const prefillTrackId = searchParams?.get("trackId") || "";

  const { user, loginAsDemoRole } = useAuth();

  // Dùng chung logic với Bảng Phân Công (useMyAssignedJudgeTracks) — đảm bảo bàn
  // chấm điểm thấy được MỌI track thật được gán, kể cả ở sự kiện khác với sự kiện
  // "chính" lúc đăng nhập (1 giám khảo có thể được phân công nhiều track/nhiều event).
  const { assignedTracks, isLoading: loadingTracks } = useMyAssignedJudgeTracks();

  const [selectedTrackId, setSelectedTrackId] = useState("");
  const selectedTrack =
    assignedTracks.find((t) => t.trackId === (selectedTrackId || prefillTrackId)) || assignedTracks[0];
  const activeTrackId = selectedTrack?.trackId || "";
  const eventId = selectedTrack?.eventId || "";
  // EventRoleId ĐÚNG theo track đang chấm — 1 giám khảo có thể có nhiều EventRole
  // (mỗi track 1 cái), gửi nhầm sẽ gắn phiếu chấm vào track/vai trò khác.
  const eventRoleId = selectedTrack?.eventRoleId || "";

  const { data: rawSubmissions = [], isLoading: loadingSubmissions, refetch } =
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

  // "Đã chấm" thật = có phiếu chấm (Score) isSubmitted=true cho bài này — SubmitResult
  // không có field isGraded/IsGraded nào (BE không trả field đó, đã kiểm tra trực tiếp DTO).
  const { data: myScores = [] } = useGetScoresByEventRole(eventRoleId || undefined);
  const submittedIds = useMemo(
    () => new Set(myScores.filter((s) => s.isSubmitted).map((s) => s.submitResultId)),
    [myScores],
  );

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
      setSaveOk(`✓ ${okMsg}`);
      toast.success(okMsg);
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
      <div className="min-h-[calc(100vh-4rem)] bg-[#0b1013] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#11181c] border border-amber-500/40 p-8 text-center relative space-y-4 shadow-xl">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold uppercase text-white">BÀN CHẤM ĐIỂM GIÁM KHẢO</h2>
          <p className="font-sans text-xs text-zinc-400 leading-relaxed">
            Vui lòng đăng nhập hoặc bấm chọn nhanh vai trò Giám Khảo Demo để mở bàn chấm điểm:
          </p>
          <div className="pt-2 flex flex-col gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => loginAsDemoRole("Judge")}
              className="w-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold py-2.5 uppercase hover:bg-amber-500 hover:text-black transition-all cursor-pointer shadow-md"
            >
              [ ⚖️ Vào Bằng Tài Khoản Giám Khảo Demo ]
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sub = selectedSubmission;
  const subId = sub?.id || sub?.Id || "";
  const displayCode = subId ? `SUB-${String(subId).slice(0, 8).toUpperCase()}` : "";
  const submissionUrl = sub?.submissionUrl || sub?.SubmissionUrl || "";
  const isGraded = submittedIds.has(subId);

  if (loadingTracks && assignedTracks.length === 0) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-[#0a0f12] text-center p-6 text-zinc-500 font-mono text-xs animate-pulse">
        Đang tải hạng mục được phân công...
      </div>
    );
  }

  if (!loadingTracks && assignedTracks.length === 0) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-[#0a0f12] text-center p-6">
        <div className="max-w-md space-y-3">
          <Award className="w-10 h-10 text-amber-400/60 mx-auto" />
          <h2 className="font-display text-lg font-bold text-white uppercase">Chưa được phân công Hạng mục nào</h2>
          <p className="text-xs text-zinc-400">
            Vui lòng liên hệ Ban Tổ Chức (Event Coordinator) để được cấp quyền chấm điểm.
          </p>
        </div>
      </div>
    );
  }

  if (!loadingSubmissions && apiSubmissions.length === 0) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-[#0a0f12] text-center p-6">
        <div className="max-w-md space-y-3">
          <Award className="w-10 h-10 text-amber-400/60 mx-auto" />
          <h2 className="font-display text-lg font-bold text-white uppercase">Chưa có bài nộp để chấm</h2>
          <p className="text-xs text-zinc-400">
            Hạng mục {selectedTrack?.trackName || "này"} hiện chưa có bài nộp nào từ đội thi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden bg-[#0a0f12] text-[#dde4e6] font-sans p-3 md:px-5 md:py-2.5 flex flex-col justify-between space-y-2 selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* ========================================================================= */}
      {/* TẦNG 1: MASTER NAVIGATION BAR (BỘ ĐIỀU KHIỂN CHUYỂN BÀI TO RÕ NỔI BẬT)      */}
      {/* ========================================================================= */}
      <div className="bg-[#10171a] border border-zinc-800 px-3 py-1.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 rounded-lg shadow-sm shrink-0">
        
        {/* Track Title */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold uppercase rounded">
            GIÁM KHẢO
          </span>
          <span className="font-mono text-xs font-bold text-white truncate max-w-[200px] sm:max-w-none">
            {selectedTrack?.trackName || "—"}
          </span>
        </div>

        {/* PROMINENT NAVIGATION POD (BỘ NÚT CHUYỂN BÀI TO RÕ & TAB CHỌN BÀI) */}
        <div className="flex items-center gap-2">
          {/* Nút Bài Trước To Rõ */}
          <button
            type="button"
            onClick={handlePrevSubmission}
            disabled={currentSubIndex === 0}
            className="px-3 py-1.5 bg-[#162227] text-zinc-200 border border-zinc-600 hover:border-amber-400 hover:text-white rounded font-mono text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-sm"
          >
            <span>◀</span>
            <span>Bài Trước</span>
          </button>

          {/* Dải Tab Bài Nộp */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {apiSubmissions.map((item: any, idx: number) => {
              const itemId = item.id || item.Id || `sub-${idx}`;
              const isSelected = (sub?.id || sub?.Id) === itemId;
              const itemGraded = submittedIds.has(itemId);
              const code = `SUB-${String(itemId).slice(0, 8).toUpperCase()}`;

              return (
                <button
                  key={itemId}
                  type="button"
                  onClick={() => {
                    setSelectedSubmission(item);
                    setScores({});
                    setSaveError("");
                    setSaveOk("");
                  }}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? "bg-amber-500 text-black border-amber-400 font-extrabold shadow-md"
                      : itemGraded
                      ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50"
                      : "bg-[#141f23] text-zinc-300 border-zinc-700 hover:text-white hover:border-zinc-500"
                  }`}
                >
                  {itemGraded && <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{code}</span>
                </button>
              );
            })}
          </div>

          {/* Nút Bài Tiếp Theo To Rõ & Nổi Bật */}
          <button
            type="button"
            onClick={handleNextSubmission}
            disabled={currentSubIndex === apiSubmissions.length - 1}
            className="px-3.5 py-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/50 hover:bg-amber-500 hover:text-black rounded font-mono text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-sm"
          >
            <span>Bài Tiếp Theo</span>
            <span>▶</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TẦNG 2: BANNER HỒ SƠ ĐỀ TÀI & 3 NÚT TÀI LIỆU NẰM NGANG ĐẦY ĐỦ              */}
      {/* ========================================================================= */}
      <div className="bg-[#10171a] border border-zinc-800 p-3 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="space-y-0.5 min-w-0 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded shrink-0">
              {displayCode || "—"}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              Bài dự thi ẩn danh
            </h2>
          </div>
          <p className="text-xs text-zinc-300 truncate leading-relaxed">
            Danh tính đội thi được ẩn để đảm bảo chấm điểm khách quan.
          </p>
        </div>

        {/* Bài nộp thật chỉ có 1 link duy nhất (SubmissionUrl) — không có 3 field repo/demo/slide riêng ở BE */}
        <div className="flex items-center gap-2 shrink-0">
          {submissionUrl ? (
            <a
              href={submissionUrl}
              target="_blank"
              rel="noreferrer"
              className="py-1.5 px-3 bg-[#121f26] hover:bg-[#182a33] text-cyan-300 border border-cyan-500/40 rounded font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Code className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Xem Bài Nộp ↗</span>
            </a>
          ) : (
            <span className="py-1.5 px-3 bg-[#141f23] text-zinc-500 border border-zinc-700 rounded font-mono text-xs">
              Chưa có link bài nộp
            </span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TẦNG 3: BÀN CHẤM ĐIỂM (CHIA 70% TIÊU CHÍ / 30% TỔNG KẾT & CHỐT BÀI)        */}
      {/* ========================================================================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2.5 min-h-0 overflow-hidden">
        
        {/* CỘT TRÁI (8 COLS / 68%): 3 TIÊU CHÍ CHẤM ĐIỂM */}
        <div className="lg:col-span-8 flex flex-col justify-between gap-2 h-full overflow-hidden">
          {criteria.map((cr, idx) => {
            const crId = cr.criteriaId || `crit-${idx}`;
            const max = Number(cr.maxScore) || 10;
            const weight = Number(cr.weight) || 0;
            const currentVal = scores[crId] ?? 0;
            const weightedScore = ((currentVal / max) * weight) / 10;

            return (
              <div
                key={crId}
                className="flex-1 bg-[#10171a] border border-zinc-800 p-3 rounded-lg flex flex-col justify-between hover:border-zinc-700 transition-colors gap-2 overflow-hidden shadow-sm"
              >
                {/* Header: Name + Weighted Score */}
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold rounded">
                        {weight}%
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        {cr.criteriaName}
                      </h4>
                    </div>
                    
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 border border-emerald-500/30 rounded shrink-0">
                      +{weightedScore.toFixed(2)} đ
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">
                    {cr.description}
                  </p>
                </div>

                {/* Score Controls: Clean Numbers + Big Stepper Pod */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 gap-2">
                  <div className="flex items-center gap-1.5">
                    {[5.0, 7.0, 8.5, 10.0].map((val) => {
                      const isSelected = Math.abs(currentVal - val) < 0.1;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleScoreChange(crId, val, max)}
                          className={`px-3 py-1 rounded font-mono text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-amber-500 text-black font-extrabold shadow-sm"
                              : "bg-[#141f23] text-zinc-300 border border-zinc-700 hover:border-zinc-500 hover:text-white"
                          }`}
                        >
                          {val.toFixed(1)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Big Score Pod */}
                  <div className="flex items-center gap-1.5 bg-[#090e10] p-1 border border-zinc-700 rounded-md shrink-0">
                    <button
                      type="button"
                      title="Giảm 0.5 điểm"
                      onClick={() => handleScoreChange(crId, Math.max(0, currentVal - 0.5), max)}
                      className="w-8 h-8 bg-[#182327] hover:bg-amber-500 hover:text-black text-amber-300 rounded font-mono font-bold text-sm transition-all flex items-center justify-center cursor-pointer"
                    >
                      –
                    </button>

                    <input
                      type="number"
                      min={0}
                      max={max}
                      step={0.5}
                      value={currentVal === 0 ? "" : currentVal}
                      placeholder="0.0"
                      onChange={(e) => handleScoreChange(crId, Number(e.target.value), max)}
                      className="w-14 h-8 bg-transparent text-center font-mono text-lg font-extrabold text-amber-300 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />

                    <button
                      type="button"
                      title="Tăng 0.5 điểm"
                      onClick={() => handleScoreChange(crId, Math.min(max, currentVal + 0.5), max)}
                      className="w-8 h-8 bg-[#182327] hover:bg-amber-500 hover:text-black text-amber-300 rounded font-mono font-bold text-sm transition-all flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CỘT PHẢI (4 COLS / 32%): TỔNG KẾT, NHẬN XÉT & CHỐT ĐIỂM */}
        <div className="lg:col-span-4 bg-[#10171a] border border-amber-500/40 p-3.5 rounded-lg shadow-lg flex flex-col justify-between gap-3 h-full overflow-hidden">
          
          {/* Tổng Điểm Spotlight */}
          <div className="text-center py-2 bg-[#090e10] border border-zinc-800 rounded-lg space-y-0.5">
            <span className="font-mono text-[11px] text-amber-400 uppercase tracking-widest block font-bold">
              ★ TỔNG ĐIỂM RBL CHUNG CUỘC:
            </span>
            <div className="font-mono text-4xl font-extrabold text-amber-300 flex items-baseline justify-center gap-1.5">
              <span>{calculatedTotalScore.toFixed(2)}</span>
              <span className="text-sm font-normal text-zinc-400">/ 10.00 đ</span>
            </div>
          </div>

          {/* Qualitative Feedback Compact Area */}
          <div className="flex-1 flex flex-col justify-between gap-1 overflow-hidden">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Nhận Xét Chuyên Môn</span>
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ghi chú đánh giá chuyên môn dành cho đội thi..."
              className="w-full flex-1 min-h-[60px] p-2.5 bg-[#090e10] text-white font-sans text-xs border border-zinc-800 rounded focus:border-amber-400 focus:outline-none transition-colors leading-relaxed resize-none"
            />

            {saveError && <p className="font-mono text-[10px] text-red-400">{saveError}</p>}
            {saveOk && <p className="font-mono text-[10px] text-emerald-400">{saveOk}</p>}
          </div>

          {/* Action Buttons Stack */}
          <div className="space-y-2 shrink-0">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveScore(true, true)}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black rounded font-mono text-xs font-extrabold uppercase hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span>CHỐT ĐIỂM &amp; CHUYỂN BÀI &gt;</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveScore(false)}
              className="w-full py-2 bg-[#141f23] border border-zinc-700 text-zinc-300 rounded font-mono text-xs font-bold uppercase hover:border-amber-500/40 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu Bản Nháp</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

