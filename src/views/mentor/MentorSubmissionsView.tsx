"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { useMentorWorkspaceViewModel, useMentorSubmissionDetailViewModel } from "@/viewModels/mentor/useMentorWorkspaceViewModel";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, Button, Badge, EmptyState } from "@/components/ui";
import { useToast } from "@/providers/ToastProvider";
import { pushSystemNotification } from "@/repositories/shared/notificationsRepository";
import {
  Code,
  PlayCircle,
  Presentation,
  Copy,
  Check,
  Clock,
  MessageSquare,
  Plus,
  Trash2,
  ExternalLink,
  Info,
  Send,
  ChevronLeft,
  Users,
} from "lucide-react";

function parseSubmissionNotes(raw: string | null | undefined): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed.notes === "string") {
      return parsed.notes.trim();
    }
  } catch {
    // Chuỗi thường từ seeder / mô tả thuần.
  }
  return raw.trim();
}

const normalizeId = (id?: string | null) => (id || "").replace(/-/g, "").toLowerCase();

function hostFromRepoUrl(url: string): string {
  if (/github\.com/i.test(url)) return "GitHub";
  if (/gitlab\.com/i.test(url)) return "GitLab";
  return "Chưa xác định";
}

export function MentorSubmissionsView() {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamIdParam = searchParams.get("teamId") || "";
  const trackIdParam = searchParams.get("trackId") || "";
  const [selectedSubId, setSelectedSubId] = useState("");

  const {
    myTracks,
    selectedTrackId,
    submissions,
    teamNameById,
    teamById,
    isLoading,
    eventId,
  } = useMentorWorkspaceViewModel();

  const currentTrackId = trackIdParam || selectedTrackId || (myTracks[0]?.id || myTracks[0]?.Id || "");
  const currentTrack = myTracks.find((t) => (t.id || t.Id) === currentTrackId);
  const trackName = currentTrack?.trackName || currentTrack?.TrackName || "Hạng mục phụ trách";

  const filteredSubmissions = submissions.filter((s) => {
    const sTeamId = String(s.teamId || s.TeamId || "").replace(/-/g, "").toLowerCase();
    const sTrackId = String(s.trackId || s.TrackId || "").replace(/-/g, "").toLowerCase();
    if (teamIdParam && sTeamId !== teamIdParam.replace(/-/g, "").toLowerCase()) return false;
    if (currentTrackId && sTrackId && sTrackId !== currentTrackId.replace(/-/g, "").toLowerCase()) return false;
    return true;
  });

  const activeSubmission =
    filteredSubmissions.find((s) => (s.id || s.Id) === selectedSubId) || filteredSubmissions[0];
  const activeTeamId = (activeSubmission?.teamId || activeSubmission?.TeamId || teamIdParam) as string;
  const listTeam = teamById.get(activeTeamId);
  const activeTeamName =
    teamNameById.get(activeTeamId) ||
    listTeam?.name ||
    listTeam?.Name ||
    `Đội #${activeTeamId || "---"}`;

  const { teamDetail, feedbacks, isLoading: isLoadingFeedbacks, createFeedback, deleteFeedback } =
    useMentorSubmissionDetailViewModel((activeSubmission?.id || activeSubmission?.Id) as string, activeTeamId);

  const [feedbackContent, setFeedbackContent] = useState("");
  const [technicalAdvice, setTechnicalAdvice] = useState("");
  const [suggestedScore, setSuggestedScore] = useState<number | "">("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

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
    try {
      await createFeedback.mutateAsync({
        submitResultId: subId,
        data: {
          feedbackContent: feedbackContent.trim(),
          technicalAdvice: technicalAdvice.trim() || undefined,
          suggestedScore: typeof suggestedScore === "number" ? suggestedScore : undefined,
        },
      });
      toast.success("Đã gửi nhận xét cho đội thi.");
      pushSystemNotification({
        title: "Cố vấn đã gửi nhận xét bài thi",
        message: `Cố vấn chuyên môn đã gửi nhận xét cho bài thi của đội "${activeTeamName}".`,
        type: "info",
      });
      setFeedbackContent("");
      setTechnicalAdvice("");
      setSuggestedScore("");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = ax?.response?.data?.message || ax?.message || "Gửi nhận xét thất bại.";
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!activeSubmission) return;
    const subId = (activeSubmission.id || activeSubmission.Id) as string;
    try {
      await deleteFeedback.mutateAsync({ submitResultId: subId, feedbackId });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(ax?.response?.data?.message || ax?.message || "Xóa nhận xét thất bại.");
    }
  };

  const repoUrl = activeSubmission?.repoUrl || activeSubmission?.RepoUrl || activeSubmission?.submissionUrl || activeSubmission?.SubmissionUrl || "";
  const demoUrl = activeSubmission?.demoUrl || activeSubmission?.DemoUrl || "";
  const slideUrl = activeSubmission?.slideUrl || activeSubmission?.SlideUrl || "";
  const rawDescription = activeSubmission?.description || activeSubmission?.Description || "";
  const submissionNotes = parseSubmissionNotes(rawDescription);
  const teamAbstract = (teamDetail?.description || listTeam?.description || listTeam?.Description || "").trim();
  const showNotes = submissionNotes && submissionNotes !== teamAbstract;
  const isActive = activeSubmission?.isActive !== false && activeSubmission?.IsActive !== false;
  const createdAt = activeSubmission?.createdTime || activeSubmission?.CreatedTime;

  if (!user) {
    return (
      <PageShell className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <EmptyState
            icon={Users}
            title="Yêu cầu quyền cố vấn"
            description="Vui lòng đăng nhập với tài khoản Cố vấn để xem bài nộp."
            action={
              <Link href="/login">
                <Button accent="mentor">Đến trang đăng nhập</Button>
              </Link>
            }
          />
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell className="min-h-[calc(100vh-4rem)] space-y-6">
      <PageHeader
        breadcrumb={
          <Link
            href={`/mentor/teams?trackId=${currentTrackId}`}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--accent-mentor)]"
          >
            <ChevronLeft className="h-4 w-4" />
            Trở về danh sách đội
          </Link>
        }
        title="Chi tiết bài nộp"
        description={trackName}
        actions={
          <>
            <Badge tone="mentor">{activeTeamName}</Badge>
            {eventId && (
              <Link href={`/events/${eventId}`}>
                <Button variant="secondary" accent="mentor" className="text-xs">
                  Chi tiết sự kiện
                </Button>
              </Link>
            )}
          </>
        }
      />

      {myTracks.length > 1 && (
        <Card className="flex flex-wrap items-center gap-2 p-3">
          <span className="text-xs font-medium text-[var(--text-muted)]">Chọn hạng mục:</span>
          {myTracks.map((t) => {
            const tid = String(t.id || t.Id || "");
            const isCurrent = normalizeId(tid) === normalizeId(currentTrackId);
            return (
              <Button
                key={tid}
                type="button"
                variant={isCurrent ? "primary" : "secondary"}
                accent="mentor"
                className="text-xs"
                onClick={() => {
                  setSelectedSubId("");
                  router.push(
                    teamIdParam
                      ? `/mentor/submissions?teamId=${teamIdParam}&trackId=${tid}`
                      : `/mentor/submissions?trackId=${tid}`,
                  );
                }}
              >
                {t.trackName || t.TrackName}
              </Button>
            );
          })}
        </Card>
      )}

      {filteredSubmissions.length > 1 && (
        <Card className="flex flex-wrap items-center gap-2 p-3">
          <span className="text-xs font-medium text-[var(--text-muted)]">Chọn bài nộp:</span>
          {filteredSubmissions.map((item, idx) => {
            const itemId = String(item.id || item.Id || `sub-${idx}`);
            const isSelected = String(activeSubmission?.id || activeSubmission?.Id || "") === itemId;
            const code = `SUB-${itemId.slice(0, 6).toUpperCase()}`;
            return (
              <Button
                key={itemId}
                type="button"
                variant={isSelected ? "primary" : "secondary"}
                accent="mentor"
                className="text-xs"
                onClick={() => setSelectedSubId(itemId)}
              >
                {code}
              </Button>
            );
          })}
        </Card>
      )}

      {isLoading ? (
        <Card className="py-12 text-center">
          <p className="animate-pulse text-sm text-[var(--text-muted)]">Đang tải chi tiết bài nộp…</p>
        </Card>
      ) : !activeSubmission ? (
        <EmptyState
          icon={Info}
          title="Chưa có bài nộp"
          description="Chưa tìm thấy bài nộp cho đội thi này trong hạng mục hiện tại."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="space-y-4 lg:col-span-4">
              <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
                Thông tin đội thi
              </h2>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Tên đội</p>
                <p className="font-display text-xl font-semibold text-[var(--text-primary)]">{activeTeamName}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Hạng mục</p>
                <Badge tone="mentor">{trackName}</Badge>
              </div>
              <div>
                <p className="mb-1 text-xs text-[var(--text-muted)]">Mô tả dự án</p>
                <p className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-3 text-sm leading-relaxed text-[var(--text-muted)]">
                  {teamAbstract || "Đội chưa nhập mô tả dự án."}
                </p>
              </div>
            </Card>

            <Card className="space-y-4 lg:col-span-8">
              <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
                Tài liệu nộp bài
              </h2>
              <ArtifactRow
                icon={Code}
                label="Kho mã nguồn"
                url={repoUrl}
                empty="Chưa cung cấp repository"
                copied={copiedField === "repo"}
                onCopy={() => copyToClipboard(repoUrl, "repo")}
              />
              <ArtifactRow
                icon={PlayCircle}
                label="Live demo"
                url={demoUrl}
                empty="Chưa cung cấp demo"
                copied={copiedField === "demo"}
                onCopy={() => copyToClipboard(demoUrl, "demo")}
              />
              <ArtifactRow
                icon={Presentation}
                label="Slide thuyết trình"
                url={slideUrl}
                empty="Chưa cung cấp slide"
                copied={copiedField === "slide"}
                onCopy={() => copyToClipboard(slideUrl, "slide")}
              />
              {showNotes && (
                <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)]">
                  <p className="border-b border-[var(--border-muted)] px-3 py-2 text-xs font-medium text-[var(--text-muted)]">
                    Ghi chú bài nộp
                  </p>
                  <p className="p-3 text-sm leading-relaxed text-[var(--text-muted)]">{submissionNotes}</p>
                </div>
              )}
            </Card>
          </div>

          <Card>
            <h2 className="mb-4 font-display text-base font-semibold text-[var(--text-primary)]">
              Trạng thái bài nộp
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Nền tảng repo</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{hostFromRepoUrl(repoUrl)}</p>
              </div>
              <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Thời điểm nộp</p>
                <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]">
                  <Clock className="h-3.5 w-3.5 text-[var(--accent-mentor)]" />
                  {createdAt ? new Date(createdAt).toLocaleString("vi-VN") : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Hiệu lực</p>
                <Badge tone={isActive ? "success" : "danger"}>{isActive ? "Đang hiệu lực" : "Không hiệu lực"}</Badge>
              </div>
            </div>
          </Card>

          <Card className="space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[var(--accent-mentor)]" />
                <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
                  Góp ý cố vấn
                </h2>
              </div>
              <Badge tone="mentor">{feedbacks.length} nhận xét</Badge>
            </div>

            <form onSubmit={handleSendFeedback} className="space-y-4 rounded-lg border border-[var(--accent-mentor)]/30 bg-[var(--bg-input)] p-4">
              <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--accent-mentor)]">
                <Plus className="h-4 w-4" />
                Thêm góp ý chuyên môn
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Nội dung nhận xét <span className="text-[var(--color-danger)]">*</span>
                </label>
                <textarea
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  placeholder="Nhận xét về kiến trúc, giải pháp, khả năng áp dụng thực tế..."
                  rows={3}
                  className="w-full rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-mentor)]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Lời khuyên kỹ thuật</label>
                  <input
                    type="text"
                    value={technicalAdvice}
                    onChange={(e) => setTechnicalAdvice(e.target.value)}
                    placeholder="Ví dụ: nên cache, tách Dockerfile multi-stage..."
                    className="w-full rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-mentor)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Điểm tham khảo (0–10)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    value={suggestedScore}
                    onChange={(e) => setSuggestedScore(e.target.value ? Number(e.target.value) : "")}
                    placeholder="8.5"
                    className="w-full rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-mentor)]"
                  />
                </div>
              </div>

              {errorMsg && <p className="text-sm font-medium text-[var(--color-danger)]">{errorMsg}</p>}

              <div className="flex justify-end">
                <Button type="submit" accent="mentor" disabled={createFeedback.isPending}>
                  <Send className="h-3.5 w-3.5" />
                  {createFeedback.isPending ? "Đang gửi..." : "Gửi góp ý"}
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Lịch sử góp ý ({feedbacks.length})
              </p>
              {isLoadingFeedbacks ? (
                <p className="text-sm text-[var(--text-muted)]">Đang tải lịch sử góp ý...</p>
              ) : feedbacks.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">Chưa có nhận xét nào cho bài nộp này.</p>
              ) : (
                <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                  {feedbacks.map((fb) => (
                    <div key={fb.id} className="space-y-2 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="mentor">{fb.mentorName || "Cố vấn"}</Badge>
                          {fb.suggestedScore !== undefined && fb.suggestedScore !== null && (
                            <span className="text-sm font-medium text-[var(--accent-mentor)]">
                              Điểm gợi ý: {fb.suggestedScore}/{fb.suggestedScore > 10 ? 100 : 10}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--text-muted)]">
                            {new Date(fb.createdTime).toLocaleString("vi-VN")}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteFeedback(fb.id)}
                            disabled={deleteFeedback.isPending}
                            className="p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--color-danger)]"
                            title="Xóa nhận xét này"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-[var(--text-primary)]">{fb.feedbackContent}</p>
                      {fb.technicalAdvice && (
                        <p className="rounded-md border border-[var(--accent-mentor)]/30 bg-[var(--accent-mentor)]/10 p-2.5 text-xs text-[var(--accent-mentor)]">
                          Khuyên dùng: {fb.technicalAdvice}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </PageShell>
  );
}

function ArtifactRow({
  icon: Icon,
  label,
  url,
  empty,
  copied,
  onCopy,
}: {
  icon: typeof Code;
  label: string;
  url: string;
  empty: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)]">
      <div className="flex w-12 items-center justify-center border-r border-[var(--border-muted)]">
        <Icon className="h-4 w-4 text-[var(--accent-mentor)]" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-2">
        <span className="text-[10px] font-medium uppercase text-[var(--text-muted)]">{label}</span>
        <span className="truncate text-sm font-medium text-[var(--text-primary)]">{url || empty}</span>
      </div>
      {url && (
        <>
          <button
            type="button"
            onClick={onCopy}
            className="flex w-10 items-center justify-center border-l border-[var(--border-muted)] text-[var(--text-muted)] hover:bg-[var(--bg-panel)]"
            title="Sao chép liên kết"
          >
            {copied ? <Check className="h-4 w-4 text-[var(--color-success)]" /> : <Copy className="h-4 w-4" />}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex w-10 items-center justify-center border-l border-[var(--border-muted)] text-[var(--text-muted)] transition-colors hover:bg-[var(--accent-mentor)] hover:text-[var(--bg-base)]"
            title="Mở liên kết"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </>
      )}
    </div>
  );
}
