"use client";

import { useState, useMemo } from "react";
import { useMyAssignedTracks } from "@/viewModels/useMyAssignedTracks";
import {
  useGetSubmitResultsByTrack,
  useMentorFeedbacks,
  useCreateMentorFeedback,
  useDeleteMentorFeedback,
  type SubmitResultListItem,
} from "@/repositories/submitResultsRepository";
import { useGetTeamsByEvent } from "@/repositories/teamsRepository";
import { Card, Button, Modal, Badge } from "@/components/ui";
import { RefreshCw, Compass, Info, ExternalLink, MessageSquare, Plus, Trash2 } from "lucide-react";

export function MentorSubmissionsView() {
  const { myTracks, eventId, isLoading: isLoadingTracks } = useMyAssignedTracks();
  const [explicitTrackId, setExplicitTrackId] = useState<string>("");
  const selectedTrackId = explicitTrackId || myTracks[0]?.id || myTracks[0]?.Id || "";

  const { data: submissions = [], isLoading: isLoadingSubs, refetch } = useGetSubmitResultsByTrack(
    selectedTrackId,
    eventId
  );
  const { data: teams = [] } = useGetTeamsByEvent(eventId);

  // Modal states for Mentor Feedback
  const [selectedSub, setSelectedSub] = useState<SubmitResultListItem | null>(null);

  const teamNameById = useMemo(() => {
    const map = new Map<string, string>();
    teams.forEach((t) => map.set((t.id || t.Id) as string, t.name || t.Name || "Đội thi"));
    return map;
  }, [teams]);

  const sortedSubmissions = useMemo(() => {
    return [...submissions].sort((a, b) => {
      const da = a.createdTime || a.CreatedTime || "";
      const db = b.createdTime || b.CreatedTime || "";
      return db.localeCompare(da);
    });
  }, [submissions]);

  const isLoading = isLoadingTracks || (!!selectedTrackId && isLoadingSubs);

  return (
    <div className="hud-lattice min-h-[calc(100vh-4rem)]">
      {/* Mentor Feedback Modal */}
      {selectedSub && (
        <MentorFeedbackModal
          submission={selectedSub}
          teamName={teamNameById.get((selectedSub.teamId || selectedSub.TeamId || "") as string) || "Đội thi"}
          onClose={() => setSelectedSub(null)}
        />
      )}

      <div className="max-w-[var(--container-max)] mx-auto px-6 py-8 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border-muted)]">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--accent-mentor)] tracking-widest uppercase font-bold">
              <Compass className="w-3.5 h-3.5" />
              MENTOR WORKSPACE
            </div>
            <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-[var(--text-primary)] mt-1">
              Tiến Độ Bài Nộp &amp; Cố Vấn
            </h1>
            <p className="font-mono text-xs text-[var(--text-muted)] mt-1">
              Toàn bộ bài nộp trong Hạng mục bạn phụ trách — hỗ trợ, đánh giá chuyên môn và gửi phản hồi cho đội thi.
            </p>
          </div>
          <Button variant="ghost" accent="mentor" onClick={() => refetch()} className="text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Làm mới
          </Button>
        </div>

        {myTracks.length === 0 && !isLoadingTracks ? (
          <Card className="p-10 bg-[var(--bg-panel)] border-[var(--border-muted)] hud-clipped text-center flex flex-col items-center gap-3">
            <Info className="w-8 h-8 text-[var(--text-muted)] opacity-60" />
            <p className="font-mono text-sm text-[var(--text-muted)] tracking-wide">
              Bạn chưa được phân công Cố vấn cho Hạng mục nào — chưa có bài nộp để hiển thị.
            </p>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-[var(--text-muted)] uppercase">Hạng mục:</span>
              <select
                value={selectedTrackId}
                onChange={(e) => setExplicitTrackId(e.target.value)}
                className="bg-[var(--bg-input)] border border-[var(--border-muted)] px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-mentor)]"
              >
                {myTracks.map((t) => (
                  <option key={t.id || t.Id} value={t.id || t.Id}>
                    {t.trackName || t.TrackName}
                  </option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16 font-mono text-xs text-[var(--text-muted)]">
                Đang tải danh sách bài nộp...
              </div>
            ) : sortedSubmissions.length === 0 ? (
              <Card className="p-10 bg-[var(--bg-panel)] border-[var(--border-muted)] hud-clipped text-center">
                <p className="font-mono text-sm text-[var(--text-muted)]">
                  Chưa có bài nộp nào trong Hạng mục này.
                </p>
              </Card>
            ) : (
              <div className="w-full overflow-x-auto border border-[var(--border-muted)] bg-[var(--bg-panel)] hud-clipped">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-muted)] bg-[var(--bg-base)] text-[var(--text-muted)]">
                      <th className="p-3 uppercase">Đội thi</th>
                      <th className="p-3 uppercase">Liên kết bài nộp</th>
                      <th className="p-3 uppercase">Thời gian nộp</th>
                      <th className="p-3 uppercase text-right">Cố vấn chuyên môn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-muted)]/60">
                    {sortedSubmissions.map((s) => {
                      const id = (s.id || s.Id) as string;
                      const teamId = (s.teamId || s.TeamId || "") as string;
                      const url = s.submissionUrl || s.SubmissionUrl || s.repoUrl || s.RepoUrl;
                      const createdAt = s.createdTime || s.CreatedTime;
                      return (
                        <tr key={id} className="hover:bg-[var(--accent-mentor)]/5 transition-colors">
                          <td className="p-3 font-bold text-[var(--text-primary)]">
                            {teamNameById.get(teamId) || `Đội #${teamId}`}
                          </td>
                          <td className="p-3">
                            {url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[var(--accent-mentor)] hover:underline inline-flex items-center gap-1"
                              >
                                Xem bài nộp <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-[var(--text-muted)]/50 italic">Không có liên kết</span>
                            )}
                          </td>
                          <td className="p-3 text-[var(--text-muted)]">
                            {createdAt ? new Date(createdAt).toLocaleString("vi-VN") : "—"}
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              variant="secondary"
                              accent="mentor"
                              onClick={() => setSelectedSub(s)}
                              className="text-[11px] py-1 px-2.5 inline-flex items-center gap-1.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Góp ý bài thi
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Modal Gửi Nhận Xét Của Cố Vấn ──────────────────────────────────────────
function MentorFeedbackModal({
  submission,
  teamName,
  onClose,
}: {
  submission: SubmitResultListItem;
  teamName: string;
  onClose: () => void;
}) {
  const submitResultId = (submission.id || submission.Id) as string;
  const { data: feedbacks = [], isLoading } = useMentorFeedbacks(submitResultId);
  const createFeedback = useCreateMentorFeedback();
  const deleteFeedback = useDeleteMentorFeedback();

  const [feedbackContent, setFeedbackContent] = useState("");
  const [technicalAdvice, setTechnicalAdvice] = useState("");
  const [suggestedScore, setSuggestedScore] = useState<number | "">("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackContent.trim()) {
      setErrorMsg("Vui lòng nhập nội dung nhận xét chuyên môn.");
      return;
    }
    setErrorMsg("");
    try {
      await createFeedback.mutateAsync({
        submitResultId,
        data: {
          feedbackContent: feedbackContent.trim(),
          technicalAdvice: technicalAdvice.trim() || undefined,
          suggestedScore: typeof suggestedScore === "number" ? suggestedScore : undefined,
        },
      });
      setFeedbackContent("");
      setTechnicalAdvice("");
      setSuggestedScore("");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Gửi nhận xét thất bại.");
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    try {
      await deleteFeedback.mutateAsync({ submitResultId, feedbackId });
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Xóa nhận xét thất bại.");
    }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Góp Ý Cố Vấn — ${teamName}`}
      eyebrow="HƯỚNG DẪN ĐỘI THI"
      description="Gửi đánh giá và lời khuyên kỹ thuật trực tiếp đến các thành viên của đội thi."
    >
      <div className="space-y-6 pt-2">
        {/* Form Gửi Nhận Xét Mới */}
        <form onSubmit={handleSendFeedback} className="space-y-4 bg-[var(--bg-base)] p-4 border border-[var(--accent-mentor)]/30 hud-clipped">
          <div className="font-mono text-xs font-bold text-[var(--accent-mentor)] flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> THÊM NHẬN XÉT MỚI
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-xs text-[var(--text-primary)]">
              Nội dung nhận xét &amp; định hướng <span className="text-[var(--color-danger)]">*</span>
            </label>
            <textarea
              value={feedbackContent}
              onChange={(e) => setFeedbackContent(e.target.value)}
              placeholder="Nhận xét về ý tưởng, tính khả thi, tiến độ..."
              rows={3}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-muted)] p-2.5 font-sans text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent-mentor)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-mono text-xs text-[var(--text-primary)]">
                Lời khuyên kỹ thuật / Công nghệ (Optional)
              </label>
              <input
                type="text"
                value={technicalAdvice}
                onChange={(e) => setTechnicalAdvice(e.target.value)}
                placeholder="VD: Sử dụng Redis để cache, tối ưu token API..."
                className="w-full bg-[var(--bg-input)] border border-[var(--border-muted)] px-3 py-1.5 font-sans text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-mentor)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs text-[var(--text-primary)]">
                Điểm tham khảo (0-100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={suggestedScore}
                onChange={(e) => setSuggestedScore(e.target.value ? Number(e.target.value) : "")}
                placeholder="VD: 85"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-muted)] px-3 py-1.5 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-mentor)]"
              />
            </div>
          </div>

          {errorMsg && <p className="font-mono text-xs text-[var(--color-danger)]">{errorMsg}</p>}

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="primary"
              accent="mentor"
              disabled={createFeedback.isPending}
              className="text-xs py-1.5 px-4"
            >
              {createFeedback.isPending ? "Đang gửi..." : "Gửi góp ý cho đội"}
            </Button>
          </div>
        </form>

        {/* Lịch Sử Các Lần Góp Ý */}
        <div className="space-y-3">
          <div className="font-mono text-xs font-bold text-[var(--text-muted)] uppercase">
            Lịch sử góp ý ({feedbacks.length})
          </div>

          {isLoading ? (
            <p className="font-mono text-xs text-[var(--text-muted)] italic">Đang tải lịch sử...</p>
          ) : feedbacks.length === 0 ? (
            <p className="font-mono text-xs text-[var(--text-muted)] italic">Chưa có góp ý nào cho bài nộp này.</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge tone="mentor">Mentor: {fb.mentorName || "Cố vấn"}</Badge>
                      {fb.suggestedScore !== undefined && fb.suggestedScore !== null && (
                        <span className="font-mono text-xs text-[var(--accent-judge)] font-bold">
                          Điểm gợi ý: {fb.suggestedScore}/100
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">
                        {new Date(fb.createdTime).toLocaleString("vi-VN")}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteFeedback(fb.id)}
                        disabled={deleteFeedback.isPending}
                        className="text-[var(--text-muted)] hover:text-[var(--color-danger)] transition-colors p-1"
                        title="Xóa nhận xét này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="font-sans text-xs text-[var(--text-primary)] leading-relaxed">
                    {fb.feedbackContent}
                  </p>

                  {fb.technicalAdvice && (
                    <div className="p-2 bg-[var(--bg-base)] border border-[var(--accent-mentor)]/20 font-mono text-[11px] text-[var(--accent-mentor)]">
                      💡 Khuyên dùng: {fb.technicalAdvice}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
