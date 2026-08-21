"use client";

import React from "react";
import { Button, Card, Badge } from "@/components/ui";
import { useGetTeamScoreBreakdown } from "@/repositories/scoresRepository";
import {
  UserCheck,
  Award,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sliders,
  X,
  RefreshCw,
  FileCode,
  AlertCircle,
  Eye,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  teamId?: string;
  teamName?: string;
  submitResultId?: string;
}

export function SubmissionJudgeScoresModal({
  open,
  onClose,
  teamId,
  teamName = "Đội thi",
  submitResultId,
}: Props) {
  const {
    data: breakdown,
    isLoading,
    isError,
    refetch,
  } = useGetTeamScoreBreakdown(open ? teamId : undefined);

  if (!open) return null;

  // Filter submissions by submitResultId if specified
  const allSubmissions = breakdown?.submissions || [];
  const targetSubmissions = submitResultId
    ? allSubmissions.filter(
        (s) => (s.submitResultId || (s as any).SubmitResultId) === submitResultId
      )
    : allSubmissions;

  const activeSubmissionsList =
    targetSubmissions.length > 0 ? targetSubmissions : allSubmissions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in font-mono text-xs">
      <Card className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-[#a855f7] bg-[#0c1417] p-6 shadow-2xl hud-clipped text-[var(--text-primary)]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="border-b border-[var(--border-muted)] pb-4 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#a855f7] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#a855f7]">
              [ CHI TIẾT ĐIỂM GIÁM KHẢO CHẤM ]
            </span>
          </div>
          <h2 className="font-display text-xl font-bold uppercase text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-[#a855f7]" />
            Bảng Điểm Giám Khảo — {breakdown?.teamName || teamName}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Theo dõi chi tiết điểm số từng tiêu chí, nhận xét và trạng thái nộp phiếu chấm của tất cả Giám khảo trong hội đồng.
          </p>
        </div>

        {/* Content */}
        <div className="py-4 space-y-6">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#a855f7]">
              <RefreshCw className="w-7 h-7 animate-spin" />
              <span className="font-bold">Đang tải bảng điểm chi tiết từ các Giám khảo...</span>
            </div>
          ) : isError ? (
            <div className="p-6 bg-red-950/30 border border-red-500/40 text-red-300 rounded text-center space-y-3">
              <AlertCircle className="w-8 h-8 mx-auto text-red-400" />
              <p>Không thể tải dữ liệu điểm chấm của đội thi này.</p>
              <Button variant="ghost" onClick={() => refetch()} className="text-xs border border-red-500/50">
                Thử lại
              </Button>
            </div>
          ) : activeSubmissionsList.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[var(--border-muted)] rounded bg-[var(--bg-input)] space-y-2">
              <FileCode className="w-8 h-8 mx-auto text-[var(--text-muted)] opacity-50" />
              <p className="font-bold text-[var(--text-primary)]">Chưa có phiếu chấm điểm nào từ Giám khảo</p>
              <p className="text-[11px] text-[var(--text-muted)]">
                Giám khảo chưa mở phiếu chấm hoặc chưa lưu điểm cho bài nộp của đội thi này.
              </p>
            </div>
          ) : (
            activeSubmissionsList.map((sub, sIdx) => {
              const judgeScores = sub.judgeScores || [];

              return (
                <div key={sub.submitResultId || sIdx} className="space-y-4">
                  {/* Round & Track Meta Strip */}
                  <div className="p-3 bg-[var(--bg-input)] border border-[#a855f7]/30 rounded flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 bg-[#a855f7]/20 border border-[#a855f7]/40 text-[#a855f7] rounded font-bold">
                        Vòng: {sub.roundName || "Vòng thi"}
                      </span>
                      <span className="text-[var(--accent-team)] font-bold">
                        Hạng mục: {sub.trackName || "Chung"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                      <span>Trạng thái vòng:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded ${
                          sub.roundPublished
                            ? "bg-emerald-950/50 text-emerald-300 border border-emerald-500/40"
                            : "bg-amber-950/50 text-amber-300 border border-amber-500/40"
                        }`}
                      >
                        {sub.roundPublished ? "Đã công bố điểm" : "Chưa công bố điểm"}
                      </span>
                    </div>
                  </div>

                  {/* Judges Scorecards */}
                  {judgeScores.length === 0 ? (
                    <div className="p-6 text-center text-[var(--text-muted)] italic border border-[var(--border-muted)] rounded">
                      Chưa có Giám khảo nào nộp điểm cho bài thi vòng này.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {judgeScores.map((jScore, jIdx) => {
                        const criteriaList = jScore.criteria || [];
                        const isDone = jScore.isSubmitted;

                        return (
                          <div
                            key={jIdx}
                            className="border border-[var(--border-muted)] bg-[var(--bg-panel)] rounded p-4 space-y-3 hud-clipped hover:border-[#a855f7]/50 transition-colors"
                          >
                            {/* Judge Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-muted)]/60 pb-3">
                              <div className="flex items-center gap-2.5">
                                <div className="size-8 rounded-full bg-[#a855f7]/20 border border-[#a855f7]/40 flex items-center justify-center font-bold text-[#a855f7]">
                                  <UserCheck className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="font-bold text-sm text-white flex items-center gap-2">
                                    <span>{jScore.judgeName || `Giám khảo #${jIdx + 1}`}</span>
                                  </div>
                                  <span className="text-[10px] text-[var(--text-muted)]">
                                    Thành viên Hội đồng Giám khảo
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                {/* Submission status badge */}
                                <span
                                  className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 border ${
                                    isDone
                                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                                      : "bg-amber-950/60 text-amber-300 border-amber-500/40"
                                  }`}
                                >
                                  {isDone ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Đã chốt phiếu chấm</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                                      <span>Bản nháp (Đang chấm)</span>
                                    </>
                                  )}
                                </span>

                                {/* Total score badge */}
                                <div className="px-3 py-1 bg-black/60 border border-[#a855f7]/50 rounded text-right">
                                  <span className="text-[10px] text-[var(--text-muted)] block uppercase">Tổng điểm:</span>
                                  <span className="font-mono text-base font-bold text-[#00d9ff]">
                                    {jScore.totalScore ? Number(jScore.totalScore).toFixed(2) : "0.00"}{" "}
                                    <span className="text-xs text-[var(--text-muted)]">/ 10</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Criteria Score Table */}
                            {criteriaList.length > 0 && (
                              <div className="overflow-x-auto border border-[var(--border-muted)]/60 rounded bg-[#0a0e10]">
                                <table className="w-full text-left font-mono text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-[var(--border-muted)]/60 bg-[var(--bg-input)] text-[var(--text-muted)] text-[10px] uppercase">
                                      <th className="p-2.5">Tiêu Chí Đánh Giá</th>
                                      <th className="p-2.5 text-center w-28">Điểm Chấm</th>
                                      <th className="p-2.5 text-center w-24">Trọng Số</th>
                                      <th className="p-2.5 text-right w-28">Điểm Quy Đổi</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[var(--border-muted)]/40">
                                    {criteriaList.map((crit, cIdx) => {
                                      const val = Number(crit.value || 0);
                                      const max = Number(crit.maxScore || 10);
                                      const weight = Number(crit.weight || 0);
                                      const weightedVal = max > 0 ? (val / max) * weight : 0;

                                      return (
                                        <tr key={cIdx} className="hover:bg-white/5">
                                          <td className="p-2.5 font-bold text-[var(--text-primary)]">
                                            {crit.criteriaName || `Tiêu chí #${cIdx + 1}`}
                                          </td>
                                          <td className="p-2.5 text-center font-bold text-[#00d9ff]">
                                            {val} / {max}
                                          </td>
                                          <td className="p-2.5 text-center text-[var(--text-muted)]">
                                            {weight}%
                                          </td>
                                          <td className="p-2.5 text-right font-bold text-emerald-400">
                                            +{weightedVal.toFixed(2)}%
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Judge Comment Box */}
                            <div className="p-3 bg-[var(--bg-input)]/80 border border-[var(--border-muted)]/50 rounded space-y-1">
                              <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-[#a855f7]" />
                                <span>Nhận Xét &amp; Phản Hồi Từ Giám Khảo:</span>
                              </div>
                              <p className="font-sans text-xs text-zinc-200 leading-relaxed italic pl-5">
                                {jScore.comment ? `"${jScore.comment}"` : "Giám khảo không để lại lời nhắn kèm theo."}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border-muted)] pt-3 flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-muted)]">
            Quyền xem dành riêng cho Event Coordinator &amp; System Admin
          </span>
          <Button variant="ghost" onClick={onClose} className="font-mono text-xs border border-[var(--border-muted)]">
            Đóng
          </Button>
        </div>
      </Card>
    </div>
  );
}
