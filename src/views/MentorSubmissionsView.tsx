"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useMentorWorkspaceViewModel, useMentorSubmissionDetailViewModel } from "@/viewModels/useMentorWorkspaceViewModel";
import { encodeMentorFeedbackComment, parseMentorFeedbackComment } from "@/repositories/submitResultsRepository";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import {
  Code,
  PlayCircle,
  Copy,
  Check,
  Target,
  ExternalLink,
  MessageSquare,
  Trash2,
  Send,
  FileText,
  RefreshCw,
  FileQuestion,
} from "lucide-react";

export function MentorSubmissionsView() {
  const searchParams = useSearchParams();
  const teamIdParam = searchParams.get("teamId") || "";
  const trackIdParam = searchParams.get("trackId") || "";

  const {
    myTracks,
    selectedTrackId,
    submissions,
    teamNameById,
    isLoading,
  } = useMentorWorkspaceViewModel();

  const currentTrackId = trackIdParam || selectedTrackId || (myTracks[0]?.id || myTracks[0]?.Id || "");
  const currentTrack = myTracks.find((t) => (t.id || t.Id) === currentTrackId);

  const filteredSubmissions = submissions.filter((s) => {
    const sTeamId = (s.teamId || s.TeamId || "") as string;
    if (teamIdParam) return sTeamId === teamIdParam;
    return true;
  });

  const [selectedSubId, setSelectedSubId] = useState<string>("");
  const activeSubmission =
    filteredSubmissions.find((s) => (s.id || s.Id) === selectedSubId) || filteredSubmissions[0];

  const activeTeamId = (activeSubmission?.teamId || activeSubmission?.TeamId || teamIdParam) as string;
  const activeTeamName = teamNameById.get(activeTeamId) || `Đội #${activeTeamId || "---"}`;

  const { feedbacks, isLoading: isLoadingFeedbacks, createFeedback, deleteFeedback } =
    useMentorSubmissionDetailViewModel((activeSubmission?.id || activeSubmission?.Id) as string, activeTeamId);

  const [feedbackContent, setFeedbackContent] = useState("");
  const [technicalAdvice, setTechnicalAdvice] = useState("");
  const [suggestedScore, setSuggestedScore] = useState<number | "">("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const copyToClipboard = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;
    const subId = (activeSubmission.id || activeSubmission.Id) as string;
    if (!feedbackContent.trim()) {
      setErrorMsg("Vui lòng nhập nội dung nhận xét chuyên môn.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await createFeedback.mutateAsync({
        submitResultId: subId,
        comment: encodeMentorFeedbackComment({
          text: feedbackContent.trim(),
          technicalAdvice: technicalAdvice.trim() || undefined,
          suggestedScore: typeof suggestedScore === "number" ? suggestedScore : undefined,
        }),
      });
      setFeedbackContent("");
      setTechnicalAdvice("");
      setSuggestedScore("");
      setSuccessMsg("Gửi góp ý chuyên môn thành công!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Gửi nhận xét thất bại.");
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!activeSubmission) return;
    const subId = (activeSubmission.id || activeSubmission.Id) as string;
    try {
      await deleteFeedback.mutateAsync({ submitResultId: subId, feedbackId });
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Xóa nhận xét thất bại.");
    }
  };

  const repoUrl = activeSubmission?.repoUrl || activeSubmission?.RepoUrl || activeSubmission?.submissionUrl || activeSubmission?.SubmissionUrl || "";
  const demoUrl = activeSubmission?.demoUrl || activeSubmission?.DemoUrl || "";
  const slideUrl = activeSubmission?.slideUrl || activeSubmission?.SlideUrl || "";
  const description = activeSubmission?.description || activeSubmission?.Description || "Chưa có mô tả chi tiết bài nộp.";

  const breadcrumb = (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--text-muted)]">
      <Link
        href={`/mentor/teams?trackId=${currentTrackId}`}
        className="hover:text-[var(--text-primary)] transition-colors"
      >
        Danh sách đội
      </Link>
      <span>/</span>
      <span className="text-[var(--accent-mentor)]">Không gian cố vấn</span>
      <span>/</span>
      <span className="text-[var(--text-primary)]">{activeTeamName}</span>
    </nav>
  );

  return (
    <PageShell className="min-h-[calc(100vh-4rem)] flex flex-1 flex-col">
      <PageHeader
        breadcrumb={breadcrumb}
        title="Chi tiết bài nộp"
        description="Xem hồ sơ bài dự thi và gửi góp ý chuyên môn cho đội."
        actions={<Badge tone="mentor">Cố vấn chuyên môn</Badge>}
      />

      {filteredSubmissions.length > 1 && (
        <Card className="mb-6 p-4">
          <p className="mb-3 text-xs font-medium text-[var(--text-muted)]">
            Chọn bài nộp ({filteredSubmissions.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {filteredSubmissions.map((sub, idx) => {
              const subId = sub.id || sub.Id || "";
              const isSelected = (activeSubmission?.id || activeSubmission?.Id) === subId;
              const tId = (sub.teamId || sub.TeamId || "") as string;
              const tName = teamNameById.get(tId) || `Đội #${idx + 1}`;
              const roundLabel = (sub as any).roundName || (sub as any).RoundName;
              return (
                <Button
                  key={subId || idx}
                  type="button"
                  variant={isSelected ? "primary" : "secondary"}
                  accent="mentor"
                  onClick={() => setSelectedSubId(subId)}
                  className="text-xs"
                >
                  {tName}
                  {roundLabel ? ` (${roundLabel})` : ` #${idx + 1}`}
                </Button>
              );
            })}
          </div>
        </Card>
      )}

      {isLoading ? (
        <EmptyState
          icon={RefreshCw}
          title="Đang tải hồ sơ"
          description="Đang tải hồ sơ bài dự thi..."
        />
      ) : !activeSubmission ? (
        <EmptyState
          icon={FileQuestion}
          title="Không tìm thấy bài nộp"
          description="Chưa có bài nộp cho đội thi này trong hạng mục hiện tại."
        />
      ) : (
        <div className="grid flex-1 grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <Card className="space-y-4 p-5">
              <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
                <span className="text-sm font-medium text-[var(--accent-mentor)]">Bài dự thi</span>
                <Badge tone="neutral">
                  {String(activeSubmission.id || activeSubmission.Id || "SUB").substring(0, 8)}
                </Badge>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[var(--text-muted)]">Tên đội thi</span>
                <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">{activeTeamName}</h2>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-[var(--text-muted)]">Hạng mục phụ trách</span>
                <Badge tone="mentor" className="gap-1.5">
                  <Target className="h-3.5 w-3.5" />
                  {currentTrack?.trackName || currentTrack?.TrackName || "Hạng mục phụ trách"}
                </Badge>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-medium text-[var(--text-muted)]">Tóm tắt đề án</span>
                <p className="min-h-[80px] rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-3.5 text-sm leading-relaxed text-[var(--text-primary)]">
                  {description}
                </p>
              </div>
            </Card>

            <Card className="space-y-4 p-5">
              <h3 className="border-b border-[var(--border-muted)] pb-2 text-sm font-medium text-[var(--accent-primary)]">
                Liên kết mã nguồn
              </h3>

              <div className="space-y-3">
                <div className="space-y-2 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-3">
                  <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <Code className="h-3.5 w-3.5 text-[var(--accent-mentor)]" />
                    Kho mã nguồn
                  </span>
                  {repoUrl ? (
                    <div className="flex items-center gap-2">
                      <span className="flex-1 truncate rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] px-2.5 py-1.5 text-xs text-[var(--accent-primary)]">
                        {repoUrl}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        accent="mentor"
                        onClick={() => copyToClipboard(repoUrl, "repo")}
                        className="px-2.5 py-1.5"
                        aria-label="Sao chép liên kết"
                      >
                        {copiedField === "repo" ? (
                          <Check className="h-3.5 w-3.5 text-[var(--color-success)]" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <a href={repoUrl} target="_blank" rel="noreferrer">
                        <Button accent="primary" className="gap-1 px-3 py-1.5 text-xs">
                          Mở
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs italic text-[var(--text-muted)]">Đội thi chưa đính kèm link repository</span>
                  )}
                </div>

                {demoUrl && (
                  <div className="space-y-2 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-3">
                    <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      <PlayCircle className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                      Sản phẩm trực tuyến
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="flex-1 truncate rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] px-2.5 py-1.5 text-xs text-[var(--accent-primary)]">
                        {demoUrl}
                      </span>
                      <a href={demoUrl} target="_blank" rel="noreferrer">
                        <Button accent="primary" className="gap-1 px-3 py-1.5 text-xs">
                          Mở
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  </div>
                )}

                {slideUrl && (
                  <div className="space-y-2 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-3">
                    <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      <FileText className="h-3.5 w-3.5 text-[var(--color-warning)]" />
                      Slide thuyết trình
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="flex-1 truncate rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] px-2.5 py-1.5 text-xs text-[var(--color-warning)]">
                        {slideUrl}
                      </span>
                      <a href={slideUrl} target="_blank" rel="noreferrer">
                        <Button accent="primary" className="gap-1 px-3 py-1.5 text-xs">
                          Mở
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <Card className="flex flex-col justify-between space-y-4 border-[var(--accent-mentor)]/30 p-5 lg:col-span-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--accent-mentor)]/20 pb-3">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--accent-mentor)]">
                  <MessageSquare className="h-4 w-4" />
                  Góp ý & phản hồi
                </div>
                <Badge tone="mentor">{feedbacks.length} góp ý</Badge>
              </div>

              <form
                onSubmit={handleSendFeedback}
                className="space-y-3 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-4"
              >
                <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent-mentor)]">
                  Thêm góp ý mới
                </p>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[var(--text-primary)]">
                    Nội dung nhận xét & định hướng <span className="text-[var(--color-danger)]">*</span>
                  </label>
                  <textarea
                    value={feedbackContent}
                    onChange={(e) => setFeedbackContent(e.target.value)}
                    placeholder="Nhận xét về kiến trúc kĩ thuật, giải pháp, khả năng áp dụng thực tế..."
                    rows={3}
                    className="w-full rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-mentor)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[var(--text-primary)]">
                    Lời khuyên kỹ thuật
                  </label>
                  <input
                    type="text"
                    value={technicalAdvice}
                    onChange={(e) => setTechnicalAdvice(e.target.value)}
                    placeholder="VD: Nên dùng Redis cache, tối ưu Docker multi-stage..."
                    className="w-full rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-mentor)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[var(--text-primary)]">
                    Điểm tham khảo nội bộ (0–100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={suggestedScore}
                    onChange={(e) => setSuggestedScore(e.target.value ? Number(e.target.value) : "")}
                    placeholder="VD: 85"
                    className="w-32 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] px-3 py-2 text-sm font-medium text-[var(--accent-mentor)] focus:border-[var(--accent-mentor)] focus:outline-none"
                  />
                </div>

                {errorMsg && <p className="text-xs text-[var(--color-danger)]">{errorMsg}</p>}
                {successMsg && <p className="text-xs text-[var(--color-success)]">{successMsg}</p>}

                <div className="flex justify-end pt-1">
                  <Button type="submit" accent="mentor" disabled={createFeedback.isPending} className="gap-1.5">
                    <Send className="h-3.5 w-3.5" />
                    {createFeedback.isPending ? "Đang gửi..." : "Gửi góp ý"}
                  </Button>
                </div>
              </form>

              <div className="space-y-2.5">
                <span className="block text-xs font-medium text-[var(--text-muted)]">
                  Lịch sử góp ý ({feedbacks.length})
                </span>

                {isLoadingFeedbacks ? (
                  <p className="text-xs italic text-[var(--text-muted)]">Đang tải lịch sử góp ý...</p>
                ) : feedbacks.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title="Chưa có góp ý"
                    description="Chưa có nhận xét nào từ cố vấn cho bài nộp này."
                  />
                ) : (
                  <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
                    {feedbacks.map((fb) => {
                      const parsed = parseMentorFeedbackComment(fb.comment);
                      return (
                        <div
                          key={fb.id}
                          className="space-y-2 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-3.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Badge tone="mentor">{fb.mentorName || "Cố vấn"}</Badge>
                              {parsed.suggestedScore !== undefined && (
                                <span className="font-medium text-[var(--accent-primary)]">
                                  Điểm gợi ý: {parsed.suggestedScore}/100
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[var(--text-muted)]">
                                {new Date(fb.createdTime).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteFeedback(fb.id)}
                                disabled={deleteFeedback.isPending}
                                className="cursor-pointer p-0.5 text-[var(--text-muted)] transition-colors hover:text-[var(--color-danger)]"
                                title="Xóa nhận xét này"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-sm leading-relaxed text-[var(--text-primary)]">{parsed.text}</p>

                          {parsed.technicalAdvice && (
                            <div className="rounded-lg border border-[var(--accent-mentor)]/30 bg-[var(--accent-mentor)]/10 p-2 text-xs text-[var(--accent-mentor)]">
                              <strong>Khuyên dùng:</strong> {parsed.technicalAdvice}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
