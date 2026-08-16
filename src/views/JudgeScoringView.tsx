"use client";

import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useGetSubmitResultsByTrack, readApiError } from "@/repositories/submitResultsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { useGetTemplate } from "@/repositories/templatesRepository";
import { useSaveScore } from "@/repositories/scoresRepository";
import {
  Award,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Shield,
  Save,
  Send,
  Code,
  Globe,
  Presentation,
  CheckCircle2,
} from "lucide-react";
import { hasEventPermission } from "@/lib/permissions";
import { Link } from "@/i18n/routing";

import { useSearchParams } from "next/navigation";

export function JudgeScoringView() {
  const searchParams = useSearchParams();
  const prefillSubId = searchParams.get("subId") || "";

  const { user, activeRole, loginAsDemoRole } = useAuth();
  const eventId = activeRole?.eventId || activeRole?.EventId || "";
  const eventRoleId = activeRole?.id || activeRole?.eventRoleId || activeRole?.EventRoleId || "";
  const assignedTrackId = activeRole?.trackId || activeRole?.TrackId || "";
  const isAuthorizedJudge = hasEventPermission(user, activeRole, eventId);

  const { data: tracks = [] } = useGetTracksByEvent(eventId || undefined);
  const trackOptions = useMemo(() => {
    const list = tracks
      .map((t) => ({
        id: t.id || t.Id || "",
        name: t.trackName || t.TrackName || "Hạng mục",
        templateId: t.templateId || t.TemplateId || "",
      }))
      .filter((t) => t.id);
    if (assignedTrackId) return list.filter((t) => t.id === assignedTrackId);
    return list;
  }, [tracks, assignedTrackId]);

  const [selectedTrackId, setSelectedTrackId] = useState("");
  const selectedTrack = trackOptions.find((t) => t.id === (selectedTrackId || trackOptions[0]?.id));
  const activeTrackId = selectedTrack?.id || "";

  const { data: apiSubmissions = [], isLoading: loadingSubmissions, refetch } =
    useGetSubmitResultsByTrack(activeTrackId, eventId);
  const { data: template } = useGetTemplate(selectedTrack?.templateId);
  const criteria = template?.criterias ?? [];

  const [selectedSubmission, setSelectedSubmission] = useState<(typeof apiSubmissions)[number] | null>(null);

  // Tu dong chon bai nop theo query param subId neu co
  useEffect(() => {
    if (prefillSubId && apiSubmissions.length > 0) {
      const match = apiSubmissions.find((s) => (s.id || s.Id) === prefillSubId);
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

  // Cong thuc tinh diem chuan RBL: TotalScore = Σ (Value / MaxScore × Weight/100) × 10
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

  const handleSaveScore = async (isFinalSubmit: boolean) => {
    if (!selectedSubmission || !eventRoleId || !selectedTrack?.templateId) {
      setSaveError("Thiếu vai trò giám khảo hoặc bộ tiêu chí của hạng mục.");
      return;
    }
    setSaveError("");
    setSaveOk("");
    const submitResultId = selectedSubmission.id || selectedSubmission.Id || "";
    const payloadDetails = criteria.map((cr) => ({
      templateId: selectedTrack.templateId,
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
      setSaveOk(isFinalSubmit ? "✓ Đã khóa và chốt điểm chính thức!" : "✓ Đã lưu nháp bảng điểm.");
    } catch (err) {
      setSaveError(readApiError(err));
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#0c1214] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#080e10] border border-amber-500/40 p-8 text-center glow-box-amber relative space-y-4">
          <div className="corner-accent-tl text-amber-400/60" />
          <div className="corner-accent-tr text-amber-400/60" />
          <div className="corner-accent-bl text-amber-400/60" />
          <div className="corner-accent-br text-amber-400/60" />
          <h2 className="font-display text-xl font-bold uppercase text-amber-300">BÀN CHẤM ĐIỂM GIÁM KHẢO</h2>
          <p className="font-mono text-xs text-zinc-400 leading-relaxed">
            Vui lòng đăng nhập hoặc bấm chọn nhanh vai trò Giám Khảo Demo để mở bàn chấm điểm RBL:
          </p>
          <div className="pt-2 flex flex-col gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => loginAsDemoRole("Judge")}
              className="w-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold py-2.5 uppercase hover:bg-amber-500 hover:text-black transition-all"
            >
              [ ⚖️ Vào Bằng Tài Khoản Giám Khảo Demo ]
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0c1214] text-[#dde4e6] font-sans hex-bg py-8 px-4 md:px-8 selection:bg-amber-500/30 selection:text-amber-200">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Locking / Active Status Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3 font-mono text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-amber-400">⚠</span>
            <span className="font-bold uppercase tracking-wider">
              SCORING CONSOLE // RBL BLIND EVALUATION PROTOCOL
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 uppercase">Hội Đồng Giám Khảo Độc Lập</span>
        </div>

        {/* Header Panel */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-4 gap-4">
          <div>
            <div className="font-mono text-[11px] text-zinc-400 mb-1 flex items-center gap-2 uppercase tracking-wider">
              <span className="w-2 h-2 bg-amber-400/80 inline-block" />
              ACTIVE TARGET // BÀI NỘP ẨN DANH
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase flex items-center gap-3">
              Chấm Điểm Bài Nộp:{" "}
              <span className="text-amber-300 tracking-tight font-mono">
                {selectedSubmission ? (selectedSubmission.displayCode || selectedSubmission.DisplayCode || "SUB-ANONYMOUS") : "CHƯA CHỌN"}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={activeTrackId}
              onChange={(e) => {
                setSelectedTrackId(e.target.value);
                setSelectedSubmission(null);
              }}
              className="bg-[#141e24] border-b-2 border-amber-500/40 text-zinc-200 font-mono text-xs px-3 py-2 focus:outline-none focus:border-amber-400"
            >
              {trackOptions.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#0c1214] text-white">
                  Track: {t.name}
                </option>
              ))}
            </select>
            <div className="font-mono text-xs text-amber-300 border border-amber-500/30 px-3 py-1.5 bg-amber-500/10 font-bold uppercase">
              [ ROLE: JUDGE ]
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-[1px] bg-zinc-800/80 border border-zinc-800 shadow-md">
          {/* Left Column: Submissions Selector (3 cols) */}
          <div className="xl:col-span-3 bg-[#131b1e] p-4 flex flex-col gap-3">
            <div className="bg-amber-500/10 h-7 -mx-4 -mt-4 mb-2 flex items-center px-4 border-b border-amber-500/20 font-mono text-[11px] text-amber-300 font-bold uppercase">
              DANH SÁCH BÀI NỘP ({apiSubmissions.length})
            </div>

            {loadingSubmissions ? (
              <div className="p-6 text-center font-mono text-xs text-amber-400/80 animate-pulse">
                Đang tải bài nộp...
              </div>
            ) : apiSubmissions.length === 0 ? (
              <div className="p-6 text-center font-mono text-xs text-zinc-500">
                Chưa có bài nộp trong Track này.
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[500px]">
                {apiSubmissions.map((sub, idx) => {
                  const subId = sub.id || sub.Id || `sub-${idx}`;
                  const isSelected = selectedSubmission && (selectedSubmission.id || selectedSubmission.Id) === subId;
                  const isGraded = (sub as any).isGraded || (sub as any).IsGraded;

                  return (
                    <button
                      key={subId}
                      type="button"
                      onClick={() => {
                        setSelectedSubmission(sub);
                        setScores({});
                        setSaveError("");
                        setSaveOk("");
                      }}
                      className={`w-full text-left p-3 border transition-all flex flex-col gap-1 relative ${
                        isSelected
                          ? "bg-[#182428] border-amber-500/60 shadow-sm"
                          : "bg-[#0f1618] border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          {sub.displayCode || sub.DisplayCode || `SUB-${subId.substring(0, 6).toUpperCase()}`}
                        </span>
                        {isGraded ? (
                          <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> ĐÃ CHẤM
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-zinc-400">CHỜ CHẤM</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Middle Column: Criteria Deck (5 cols) */}
          <div className="xl:col-span-5 bg-[#10171a] p-4 space-y-4">
            <div className="bg-amber-500/10 h-7 -mx-4 -mt-4 mb-2 flex items-center px-4 border-b border-amber-500/20 font-mono text-[11px] text-amber-300 font-bold uppercase">
              EVALUATION METRICS ({criteria.length} TIÊU CHÍ)
            </div>

            {!selectedSubmission ? (
              <div className="p-12 text-center text-zinc-500 font-mono text-xs space-y-2">
                <Shield className="w-8 h-8 mx-auto opacity-30 text-amber-400" />
                <p>Chọn một bài nộp ở cột bên trái để bắt đầu chấm điểm.</p>
              </div>
            ) : criteria.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 font-mono text-xs">
                Hạng mục chưa gắn Template tiêu chí đánh giá.
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
                {criteria.map((cr, idx) => {
                  const crId = cr.criteriaId || `crit-${idx}`;
                  const max = Number(cr.maxScore) || 10;
                  const weight = Number(cr.weight) || 0;
                  const currentVal = scores[crId] ?? 0;

                  return (
                    <div
                      key={crId}
                      className="p-3.5 bg-[#141d20] border border-zinc-800 space-y-2.5 relative hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-[10px] text-amber-400 font-bold block uppercase tracking-wider">
                            CRITERIA {idx + 1} // TRỌNG SỐ: {weight}%
                          </span>
                          <h4 className="font-bold text-white text-xs mt-0.5">{cr.criteriaName}</h4>
                        </div>

                        {/* Stepper + Input */}
                        <div className="flex items-center border border-zinc-700 bg-[#0c1214] shrink-0">
                          <button
                            type="button"
                            onClick={() => handleScoreChange(crId, Math.max(0, currentVal - 1), max)}
                            className="w-7 h-7 bg-[#162124] text-amber-300 font-mono font-bold hover:bg-amber-500/20 transition-colors"
                          >
                            -1
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={max}
                            step={0.5}
                            value={currentVal}
                            onChange={(e) => handleScoreChange(crId, Number(e.target.value), max)}
                            className="w-12 h-7 bg-[#0c1214] text-center font-mono text-xs font-bold text-amber-300 border-none focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleScoreChange(crId, Math.min(max, currentVal + 1), max)}
                            className="w-7 h-7 bg-[#162124] text-amber-300 font-mono font-bold hover:bg-amber-500/20 transition-colors"
                          >
                            +1
                          </button>
                        </div>
                      </div>

                      {/* Score Range Slider */}
                      <input
                        type="range"
                        min={0}
                        max={max}
                        step={0.5}
                        value={currentVal}
                        onChange={(e) => handleScoreChange(crId, Number(e.target.value), max)}
                        className="w-full accent-amber-500 cursor-pointer mt-1"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Summary & Transmit (4 cols) */}
          <div className="xl:col-span-4 bg-[#131b1e] p-4 flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <div className="bg-amber-500/10 h-7 -mx-4 -mt-4 mb-2 flex items-center px-4 border-b border-amber-500/20 font-mono text-[11px] text-amber-300 font-bold uppercase tracking-widest">
                SUMMARY &amp; TRANSMIT
              </div>

              {selectedSubmission && (
                <div className="p-3 bg-[#0a1215] border border-zinc-800 space-y-2 font-mono text-xs">
                  <span className="text-zinc-400 text-[10px] uppercase font-bold block">LIÊN KẾT BÀI THI:</span>
                  <div className="flex flex-col gap-1.5">
                    {(selectedSubmission.repoUrl || selectedSubmission.RepoUrl || selectedSubmission.submissionUrl) && (
                      <a
                        href={selectedSubmission.repoUrl || selectedSubmission.RepoUrl || selectedSubmission.submissionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1.5 truncate"
                      >
                        <Code className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{selectedSubmission.repoUrl || "Repo mã nguồn"}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    )}
                    {(selectedSubmission.demoUrl || selectedSubmission.DemoUrl) && (
                      <a
                        href={selectedSubmission.demoUrl || selectedSubmission.DemoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-400 hover:underline flex items-center gap-1.5 truncate"
                      >
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{selectedSubmission.demoUrl || "Live Demo"}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    )}
                    {(selectedSubmission.slideUrl || selectedSubmission.SlideUrl) && (
                      <a
                        href={selectedSubmission.slideUrl || selectedSubmission.SlideUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-orange-400 hover:underline flex items-center gap-1.5 truncate"
                      >
                        <Presentation className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{selectedSubmission.slideUrl || "Slide thuyết trình"}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Total Score Box */}
              <div className="p-4 bg-[#0a1215] border border-amber-500/30 text-center space-y-1">
                <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest block">
                  TỔNG ĐIỂM CHUẨN RBL (THANG 10)
                </span>
                <div className="font-mono text-3xl font-bold text-amber-300">
                  {calculatedTotalScore.toFixed(2)} <span className="text-xs font-normal text-zinc-400">/ 10.00</span>
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-1">
                <label className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider block">
                  NHẬN XÉT &amp; LÝ DO CHẤM ĐIỂM
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ghi chú đánh giá chuyên môn cho bài nộp này..."
                  className="w-full p-3 bg-[#0a1215] text-white font-mono text-xs border border-zinc-800 focus:border-amber-400 focus:outline-none"
                />
              </div>

              {saveError && <p className="font-mono text-xs text-red-400">{saveError}</p>}
              {saveOk && <p className="font-mono text-xs text-emerald-400">{saveOk}</p>}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800 font-mono text-xs">
              <button
                type="button"
                disabled={isSaving || !selectedSubmission || criteria.length === 0}
                onClick={() => handleSaveScore(true)}
                className="w-full bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-amber-600/25 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold py-3 uppercase hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" /> // CHỐT BẢNG ĐIỂM (TRANSMIT_SCORE) &gt;
              </button>
              <button
                type="button"
                disabled={isSaving || !selectedSubmission || criteria.length === 0}
                onClick={() => handleSaveScore(false)}
                className="w-full bg-[#0a1215] border border-zinc-700 text-zinc-300 py-2.5 uppercase hover:border-amber-500/40 hover:text-amber-200 transition-colors flex items-center justify-center gap-2 font-mono text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="w-3.5 h-3.5" /> [ Lưu Bản Nháp ]
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
