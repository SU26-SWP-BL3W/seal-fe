"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useGetSubmitResultsByTrack, readApiError } from "@/repositories/submitResultsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { useGetTemplate } from "@/repositories/templatesRepository";
import { useSaveScore } from "@/repositories/scoresRepository";
import { Button, Card, Badge, Input } from "@/components/ui";
import { Award, AlertTriangle, RefreshCw, ExternalLink, Shield, Save, Send } from "lucide-react";
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
    const list = tracks.map((t) => ({
      id: t.id || t.Id || "",
      name: t.trackName || t.TrackName || "Hạng mục",
      templateId: t.templateId || t.TemplateId || "",
    })).filter((t) => t.id);
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
      setSaveOk(isFinalSubmit ? "Đã chốt bảng điểm." : "Đã lưu nháp.");
    } catch (err) {
      setSaveError(readApiError(err));
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] font-mono text-xs text-[var(--text-muted)]">
        Vui lòng đăng nhập với tài khoản Giám khảo.
      </div>
    );
  }

  if (!isAuthorizedJudge) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] font-mono text-xs text-[var(--text-muted)]">
        Trang này dành cho giám khảo của sự kiện đang chọn.
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[var(--container-max)] mx-auto hud-lattice min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 border-b border-[var(--border-muted)] pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[rgba(251,191,36,0.1)] border border-[var(--accent-judge)]/30 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-[var(--accent-judge)]" />
          </div>
          <div>
            <h1 className="font-display text-xl md:text-2xl font-bold text-[var(--accent-judge)] tracking-widest uppercase">
              Chấm điểm bài thi
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)]">
              Hạng mục: {selectedTrack?.name || "—"} · Tên đội ẩn với giám khảo
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <Link href={`/events/${eventId}/leaderboard`}>
            <Button variant="ghost" accent="judge" className="border border-[var(--accent-judge)]/40 text-[var(--accent-judge)] text-xs font-mono font-bold">
              Bảng xếp hạng
            </Button>
          </Link>
          <select
            value={activeTrackId}
            onChange={(e) => {
              setSelectedTrackId(e.target.value);
              setSelectedSubmission(null);
            }}
            className="px-4 py-2 bg-[var(--bg-input)] border border-[var(--accent-judge)]/30 text-[var(--text-primary)] font-mono text-xs focus:outline-none hud-clipped cursor-pointer"
          >
            {trackOptions.length === 0 && <option value="">Chưa có hạng mục</option>}
            {trackOptions.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <Button variant="ghost" onClick={() => refetch()} className="text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-base font-bold text-white uppercase tracking-widest border-b border-[var(--border-muted)] pb-2">
            Danh sách bài nộp ({apiSubmissions.length})
          </h2>
          {loadingSubmissions ? (
            <div className="p-8 text-center text-xs font-mono text-[var(--text-muted)]">Đang tải...</div>
          ) : apiSubmissions.length === 0 ? (
            <p className="font-mono text-xs text-[var(--text-muted)]">
              Chưa có bài nộp trong hạng mục này, hoặc bạn chưa được phân công.
            </p>
          ) : (
            <div className="space-y-3">
              {apiSubmissions.map((sub, idx) => {
                const id = sub.id || sub.Id;
                const isSelected = selectedSubmission && (selectedSubmission.id || selectedSubmission.Id) === id;
                const code = sub.displayCode || sub.DisplayCode || `T${idx + 1}`;
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
                    className={`w-full p-4 text-left transition-all duration-200 hud-clipped border ${
                      isSelected
                        ? "bg-[rgba(251,191,36,0.1)] border-[var(--accent-judge)] shadow-sm"
                        : "bg-[var(--bg-panel)] border-[var(--border-muted)] hover:border-[var(--accent-judge)]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-[var(--accent-judge)]">{code}</span>
                      <Badge tone="neutral">Đã nộp</Badge>
                    </div>
                    <p className="text-xs font-mono text-[var(--text-primary)] font-bold line-clamp-2">
                      {sub.repoUrl || sub.RepoUrl || sub.submissionUrl || sub.SubmissionUrl || "Bài nộp"}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="font-display text-lg font-bold text-[var(--accent-judge)] uppercase tracking-widest border-b border-[var(--border-muted)] pb-2">
            Bảng điểm theo tiêu chí
          </h2>
          {!selectedSubmission ? (
            <Card className="p-12 text-center text-xs font-mono text-[var(--text-muted)] hud-clipped border-[var(--border-muted)] flex flex-col items-center justify-center min-h-[300px]">
              <Shield className="w-12 h-12 text-[var(--accent-judge)]/40 mb-3" />
              Chọn một bài nộp bên trái để chấm.
            </Card>
          ) : (
            <Card className="p-6 bg-[var(--bg-panel)] border-[var(--border-muted)] hud-clipped space-y-6">
              <div className="p-4 bg-[var(--bg-base)] border border-[var(--accent-judge)]/30 flex items-center justify-between hud-clipped">
                <div>
                  <span className="text-[10px] font-mono text-[var(--accent-judge)] uppercase font-bold block mb-1">
                    Bài nộp ẩn danh
                  </span>
                  <a
                    href={selectedSubmission.repoUrl || selectedSubmission.RepoUrl || selectedSubmission.submissionUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-[var(--accent-primary)] hover:underline flex items-center gap-1 font-bold"
                  >
                    {selectedSubmission.repoUrl || selectedSubmission.submissionUrl || "Mở repo"}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Điểm tạm tính</span>
                  <span className="font-mono text-2xl font-bold text-[var(--accent-judge)]">{calculatedTotalScore} / 10</span>
                </div>
              </div>

              {criteria.length === 0 && (
                <p className="font-mono text-xs text-[var(--color-warning)] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Hạng mục chưa gắn bộ tiêu chí.
                </p>
              )}

              <div className="space-y-5">
                {criteria.map((cr) => {
                  const crId = cr.criteriaId || "";
                  const max = Number(cr.maxScore) || 10;
                  const currentVal = scores[crId] ?? 0;
                  return (
                    <div key={crId} className="p-4 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[var(--text-primary)]">{cr.criteriaName}</span>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="text-[var(--text-muted)]">Trọng số: {cr.weight}%</span>
                          <span className="text-[var(--accent-judge)] font-bold">[{currentVal} / {max}]</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min={0}
                          max={max}
                          step={0.5}
                          value={currentVal}
                          onChange={(e) => handleScoreChange(crId, Number(e.target.value), max)}
                          className="flex-1 accent-[var(--accent-judge)] cursor-pointer"
                        />
                        <Input
                          type="number"
                          min={0}
                          max={max}
                          step={0.5}
                          value={currentVal}
                          onChange={(e) => handleScoreChange(crId, Number(e.target.value), max)}
                          className="w-20 text-center font-bold"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">Nhận xét</label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped focus:outline-none focus:border-[var(--accent-judge)]"
                />
              </div>

              {saveError && <p role="alert" className="font-mono text-xs text-[color:var(--color-danger)]">{saveError}</p>}
              {saveOk && <p className="font-mono text-xs text-[color:var(--color-success)]">{saveOk}</p>}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-muted)]">
                <Button variant="ghost" disabled={isSaving || criteria.length === 0} onClick={() => handleSaveScore(false)} className="flex items-center gap-1.5 text-xs font-mono">
                  <Save className="w-4 h-4" /> {isSaving ? "Đang gửi..." : "Lưu nháp"}
                </Button>
                <Button disabled={isSaving || criteria.length === 0} onClick={() => handleSaveScore(true)} className="flex items-center gap-1.5 text-xs font-mono bg-[var(--accent-judge)] text-black font-bold">
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Chốt bảng điểm
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
