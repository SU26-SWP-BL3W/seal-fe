"use client";

import { useMemo, useState } from "react";
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

export function JudgeScoringView() {
  const { user, activeRole } = useAuth();
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
      <div className="flex items-center justify-center min-h-[60vh] font-mono text-xs text-[#bbc9ce]">
        Vui lòng đăng nhập với tài khoản Giám khảo.
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0e1417] text-[#dde4e6] font-sans hex-bg py-8 px-4 md:px-8 selection:bg-[#ffbb2a] selection:text-[#271900]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Locking / Active Status Banner (Stitch J4) */}
        <div className="bg-[#ffbb2a]/10 border border-[#ffbb2a] text-[#ffbb2a] p-3 font-mono text-xs flex items-center justify-between shadow-[inset_0_0_8px_rgba(255,187,42,0.15)]">
          <div className="flex items-center gap-2">
            <span className="animate-pulse">⚠</span>
            <span className="font-bold uppercase tracking-wider">
              SCORING CONSOLE // RBL BLIND EVALUATION PROTOCOL
            </span>
          </div>
          <span className="text-[10px] opacity-80">HỘI ĐỒNG GIÁM KHẢO ĐỘC LẬP</span>
        </div>

        {/* Header Panel (Stitch J4) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-4 gap-4">
          <div>
            <div className="font-mono text-[11px] text-[#859398] mb-1 flex items-center gap-2 uppercase tracking-wider">
              <span className="w-2 h-2 bg-[#ffbb2a] inline-block" />
              ACTIVE TARGET // BÀI NỘP ẨN DANH
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase flex items-center gap-3">
              Chấm Điểm Bài Nộp:{" "}
              <span className="text-[#ffbb2a] tracking-tight">
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
              className="bg-[#152238] border-b-2 border-[#ffbb2a] text-white font-mono text-xs px-3 py-2 focus:outline-none"
            >
              {trackOptions.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#0e1417] text-white">
                  Track: {t.name}
                </option>
              ))}
            </select>
            <div className="font-mono text-xs text-[#ffbb2a] border border-[#ffbb2a] px-3 py-1.5 bg-[#ffbb2a]/10 font-bold uppercase">
              [ ROLE: JUDGE ]
            </div>
          </div>
        </div>

        {/* Content Grid (Stitch J4) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-[1px] bg-white/10 border border-white/10 glow-box">
          {/* Left Column: Submissions Selector (3 cols) */}
          <div className="xl:col-span-3 bg-[#1a2123] p-4 flex flex-col gap-3">
            <div className="bg-[#ffbb2a]/10 h-7 -mx-4 -mt-4 mb-2 flex items-center px-4 border-b border-[#ffbb2a]/20 font-mono text-[11px] text-[#ffbb2a] font-bold uppercase">
              DANH SÁCH BÀI NỘP ({apiSubmissions.length})
            </div>

            {loadingSubmissions ? (
              <div className="p-6 text-center font-mono text-xs text-[#ffbb2a] animate-pulse">
                Đang tải bài nộp...
              </div>
            ) : apiSubmissions.length === 0 ? (
              <div className="p-6 text-center font-mono text-xs text-[#859398]">
                Chưa có bài nộp trong Track này.
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[500px]">
                {apiSubmissions.map((sub, idx) => {
                  const id = sub.id || sub.Id;
                  const isSelected = selectedSubmission && (selectedSubmission.id || selectedSubmission.Id) === id;
                  const code = sub.displayCode || sub.DisplayCode || `SUB-${String(idx + 1).padStart(3, "0")}`;

                  return (
                    <button
                      key={id || idx}
                      type="button"
                      onClick={() => {
                        setSelectedSubmission(sub);
                        setScores({});
                        setSaveError("");
                        setSaveOk("");
                      }}
                      className={`w-full p-3 text-left font-mono text-xs border transition-all ${
                        isSelected
                          ? "bg-[#ffbb2a]/10 border-[#ffbb2a] text-[#ffbb2a] font-bold shadow-[0_0_10px_rgba(255,187,42,0.2)]"
                          : "bg-[#0e1417] border-[#3c494d] text-[#bbc9ce] hover:border-[#ffbb2a]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span>{code}</span>
                        <span className="text-[10px] px-1.5 py-0.2 border border-[#34d399]/30 text-[#34d399]">ĐÃ NỘP</span>
                      </div>
                      <p className="text-[11px] text-[#859398] truncate">
                        {sub.repoUrl || sub.RepoUrl || sub.submissionUrl || "Bài thi"}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Center Column: Criteria Evaluation Metrics (5 cols) */}
          <div className="xl:col-span-5 bg-[#1a2123] p-4 flex flex-col gap-3">
            <div className="bg-[#242b2d] h-7 -mx-4 -mt-4 mb-2 flex items-center px-4 border-b border-white/10 font-mono text-[11px] text-[#dde4e6] font-bold uppercase tracking-widest">
              EVALUATION METRICS ({criteria.length} TIÊU CHÍ)
            </div>

            {!selectedSubmission ? (
              <div className="p-12 text-center font-mono text-xs text-[#859398] space-y-3">
                <Shield className="w-10 h-10 text-[#ffbb2a]/40 mx-auto" />
                <p>Chọn một bài nộp ở cột bên trái để bắt đầu chấm điểm.</p>
              </div>
            ) : criteria.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-[#febb29]">
                Hạng mục chưa gắn Template tiêu chí đánh giá.
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                {criteria.map((cr) => {
                  const crId = cr.criteriaId || "";
                  const max = Number(cr.maxScore) || 10;
                  const currentVal = scores[crId] ?? 0;

                  return (
                    <div
                      key={crId}
                      className="p-4 bg-[#0e1417] border border-[#3c494d] hover:border-[#ffbb2a]/50 transition-colors relative group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="font-display text-sm font-bold text-white uppercase tracking-wider">
                            {cr.criteriaName}
                          </div>
                          <div className="font-mono text-[11px] text-[#859398] flex items-center gap-2 mt-1">
                            <span className="bg-[#242b2d] px-2 py-0.5 text-[10px]">Trọng số: {cr.weight}%</span>
                            <span className="bg-[#242b2d] px-2 py-0.5 text-[10px]">Tối đa: {max}đ</span>
                          </div>
                        </div>

                        {/* Point Input Box */}
                        <div className="flex items-center gap-1 bg-[#080f11] p-1 border border-[#3c494d]">
                          <button
                            type="button"
                            onClick={() => handleScoreChange(crId, Math.max(0, currentVal - 1), max)}
                            className="w-8 h-8 bg-[#1a2123] text-[#ffbb2a] font-mono font-bold hover:bg-[#ffbb2a]/20"
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
                            className="w-14 h-8 bg-[#0e1417] text-center font-mono text-base font-bold text-[#ffbb2a] border-none focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleScoreChange(crId, Math.min(max, currentVal + 1), max)}
                            className="w-8 h-8 bg-[#1a2123] text-[#ffbb2a] font-mono font-bold hover:bg-[#ffbb2a]/20"
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
                        className="w-full accent-[#ffbb2a] cursor-pointer mt-2"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Summary & Transmit (4 cols) */}
          <div className="xl:col-span-4 bg-[#1a2123] p-4 flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <div className="bg-[#ffbb2a]/10 h-7 -mx-4 -mt-4 mb-2 flex items-center px-4 border-b border-[#ffbb2a]/20 font-mono text-[11px] text-[#ffbb2a] font-bold uppercase tracking-widest">
                SUMMARY &amp; TRANSMIT
              </div>

              {selectedSubmission && (
                <div className="p-3 bg-[#0e1417] border border-[#3c494d] space-y-2 font-mono text-xs">
                  <span className="text-[#859398] text-[10px] uppercase font-bold block">LIÊN KẾT BÀI THI:</span>
                  <div className="flex flex-col gap-1.5">
                    {(selectedSubmission.repoUrl || selectedSubmission.RepoUrl || selectedSubmission.submissionUrl) && (
                      <a
                        href={selectedSubmission.repoUrl || selectedSubmission.RepoUrl || selectedSubmission.submissionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#00d9ff] hover:underline flex items-center gap-1.5 truncate"
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
                        className="text-[#f87171] hover:underline flex items-center gap-1.5 truncate"
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
                        className="text-[#fb923c] hover:underline flex items-center gap-1.5 truncate"
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
              <div className="p-4 bg-[#080f11] border border-[#ffbb2a] text-center glow-box space-y-1">
                <span className="font-mono text-[10px] text-[#859398] uppercase tracking-widest block">
                  TỔNG ĐIỂM CHUẨN RBL (THANG 10)
                </span>
                <div className="font-mono text-4xl font-extrabold text-[#ffbb2a] glow-text">
                  {calculatedTotalScore.toFixed(2)} <span className="text-sm font-normal text-[#859398]">/ 10.00</span>
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-1">
                <label className="font-mono text-[11px] text-[#859398] uppercase tracking-wider block">
                  NHẬN XÉT &amp; LÝ DO CHẤM ĐIỂM
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ghi chú đánh giá chuyên môn cho bài nộp này..."
                  className="w-full input-cyber p-3 bg-[#152238] text-white font-mono text-xs border-b-2 border-[#3c494d] focus:border-[#ffbb2a]"
                />
              </div>

              {saveError && <p className="font-mono text-xs text-[#ffb4ab]">{saveError}</p>}
              {saveOk && <p className="font-mono text-xs text-[#34d399]">{saveOk}</p>}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10 font-mono text-xs">
              <button
                type="button"
                disabled={isSaving || !selectedSubmission || criteria.length === 0}
                onClick={() => handleSaveScore(true)}
                className="w-full bg-[#ffbb2a] text-[#080f11] font-display text-sm font-bold py-3 uppercase hover:bg-white transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,187,42,0.3)]"
              >
                <Send className="w-4 h-4" /> // CHỐT BẢNG ĐIỂM (TRANSMIT_SCORE) &gt;
              </button>
              <button
                type="button"
                disabled={isSaving || !selectedSubmission || criteria.length === 0}
                onClick={() => handleSaveScore(false)}
                className="w-full border border-[#3c494d] text-[#bbc9ce] py-2 uppercase hover:border-[#ffbb2a] hover:text-white transition-colors flex items-center justify-center gap-2"
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
