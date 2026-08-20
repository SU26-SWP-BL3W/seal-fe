"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { useQueryClient } from "@tanstack/react-query";
import { useMyTeam } from "@/repositories/teamsRepository";
import {
  useMySubmissions,
  useDeleteSubmission,
  useUpdateSubmission,
  useMentorFeedbacks,
  readApiError,
  parseMentorFeedbackComment,
  type SubmitResultListItem,
} from "@/repositories/submitResultsRepository";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, Button, Card, Field, Input } from "@/components/ui";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import {
  FolderOpen,
  Code,
  Globe,
  Presentation,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Scale,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X,
} from "lucide-react";

export function MySubmissionsView() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: teamResponse } = useMyTeam();
  const team = (teamResponse as any)?.team ?? teamResponse;

  const teamId = team?.id || team?.Id || "";
  const isLeader = (team?.members || []).some(
    (m: any) => (m.userId === user?.id || m.userId === user?.userId) && (m.roleName === "TeamLeader" || m.roleName === "Leader"),
  );
  const isRegistered = team?.status === "Registered" || team?.status === "Approved";

  const { data: submissions = [], isLoading: isLoadingSubs, refetch } = useMySubmissions(teamId);

  const [editingSub, setEditingSub] = useState<SubmitResultListItem | null>(null);
  const [editRepo, setEditRepo] = useState("");
  const [editDemo, setEditDemo] = useState("");
  const [editSlide, setEditSlide] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editError, setEditError] = useState("");

  const updateMutation = useUpdateSubmission();
  const deleteMutation = useDeleteSubmission();

  const handleOpenEdit = (sub: SubmitResultListItem) => {
    setEditingSub(sub);
    setEditRepo(sub.repoUrl || sub.RepoUrl || sub.submissionUrl || sub.SubmissionUrl || "");
    setEditDemo(sub.demoUrl || sub.DemoUrl || "");
    setEditSlide(sub.slideUrl || sub.SlideUrl || "");
    setEditDesc(sub.description || sub.Description || "");
    setEditError("");
  };

  const sanitizeUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    const subId = editingSub.id || editingSub.Id || "";
    const repoFormatted = sanitizeUrl(editRepo);
    const demoFormatted = sanitizeUrl(editDemo);
    const slideFormatted = sanitizeUrl(editSlide);

    if (!repoFormatted && !demoFormatted && !slideFormatted) {
      setEditError("Vui lòng điền ít nhất một đường dẫn hợp lệ cho bài nộp.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: subId,
        data: {
          RepoUrl: repoFormatted,
          DemoUrl: demoFormatted,
          SlideUrl: slideFormatted,
          SubmissionUrl: repoFormatted || demoFormatted || slideFormatted,
          Description: editDesc.trim(),
        },
      });
      setEditingSub(null);
      toast.success("Cập nhật bài nộp thành công.");
      queryClient.invalidateQueries({ queryKey: ["submitResults"] });
      queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
      refetch();
    } catch (err) {
      const msg = readApiError(err);
      setEditError(msg);
      toast.error(msg);
    }
  };

  const handleDelete = async (sub: SubmitResultListItem) => {
    const subId = sub.id || sub.Id || "";
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài nộp này không?")) return;
    try {
      await deleteMutation.mutateAsync(subId);
      toast.success("Đã xóa bài nộp thành công.");
      queryClient.invalidateQueries({ queryKey: ["submitResults"] });
      queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
      refetch();
    } catch (err) {
      const msg = readApiError(err);
      toast.error("Không thể xóa bài nộp: " + msg);
    }
  };

  if (!user) {
    return (
      <PageShell className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Danh sách bài nộp đội thi</h2>
          <p className="text-sm text-[var(--text-muted)]">Vui lòng đăng nhập để xem danh sách bài nộp của đội.</p>
          <Link href="/login">
            <Button className="w-full">Đến trang đăng nhập</Button>
          </Link>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Danh sách bài nộp"
        description="Quản lý bài dự thi theo vòng thi của đội."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => refetch()} className="text-xs">
              <RefreshCw className="size-3.5" /> Làm mới
            </Button>
            <Link href="/submissions/new">
              <Button accent="team" className="text-xs">
                <Plus className="size-4" /> Nộp bài mới
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Đội"
          value={team?.name || team?.Name || "Chưa có đội"}
          accent="var(--accent-team)"
        />
        <StatCard
          label="Vai trò"
          value={isLeader ? "Trưởng nhóm" : "Thành viên"}
        />
        <StatCard
          label="Trạng thái"
          value={team?.status || "—"}
          accent={isRegistered ? "var(--color-success)" : "var(--color-warning)"}
        />
      </div>

      <Card className="overflow-hidden p-0">
        {isLoadingSubs ? (
          <div className="p-12 text-center text-sm text-[var(--text-muted)]">Đang tải bài nộp...</div>
        ) : submissions.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={FolderOpen}
              title="Chưa có bài nộp"
              description="Đội của bạn chưa có bài nộp nào trên hệ thống."
              action={
                <Link href="/submissions/new">
                  <Button accent="team">Nộp bài đầu tiên</Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-muted)] bg-[var(--bg-input)]/50 text-xs text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-medium">Vòng thi</th>
                  <th className="px-4 py-3 font-medium">Liên kết bài nộp</th>
                  <th className="px-4 py-3 font-medium">Thời gian nộp</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-muted)]">
                {submissions.map((sub, idx) => {
                  const id = sub.id || sub.Id || `sub-${idx}`;
                  const isEliminated = (sub as any).isTeamDisqualified || (sub as any).IsTeamDisqualified;
                  const isActive = sub.isActive ?? sub.IsActive ?? true;

                  return (
                    <tr key={id} className="transition-colors hover:bg-[var(--bg-input)]/30">
                      <td className="whitespace-nowrap px-4 py-4 font-medium text-[var(--text-primary)]">
                        {(sub as any).roundName || (sub as any).RoundName || `Vòng ${idx + 1}`}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {(sub.repoUrl || sub.RepoUrl || sub.submissionUrl || sub.SubmissionUrl) && (
                            <LinkChip
                              href={(sub.repoUrl || sub.RepoUrl || sub.submissionUrl || sub.SubmissionUrl) || "#"}
                              icon={<Code className="size-3" />}
                              label="Repo"
                            />
                          )}
                          {(sub.demoUrl || sub.DemoUrl) && (
                            <LinkChip
                              href={(sub.demoUrl || sub.DemoUrl) || "#"}
                              icon={<Globe className="size-3" />}
                              label="Demo"
                            />
                          )}
                          {(sub.slideUrl || sub.SlideUrl) && (
                            <LinkChip
                              href={(sub.slideUrl || sub.SlideUrl) || "#"}
                              icon={<Presentation className="size-3" />}
                              label="Slides"
                            />
                          )}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-[var(--text-muted)]">
                        {sub.createdTime || sub.CreatedTime
                          ? new Date(sub.createdTime || sub.CreatedTime || "").toLocaleString("vi-VN")
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        {isEliminated ? (
                          <Badge tone="danger">Bị loại</Badge>
                        ) : !isActive ? (
                          <Badge tone="neutral">Đã hủy</Badge>
                        ) : (
                          <Badge tone="success">Đã nộp</Badge>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isActive && !isEliminated && (
                            <Button
                              variant="ghost"
                              onClick={() => handleOpenEdit(sub)}
                              disabled={!isRegistered || !isLeader}
                              title={!isLeader ? "Chỉ trưởng nhóm mới có quyền sửa bài" : "Chỉnh sửa liên kết"}
                              className="px-2 py-1 text-xs"
                            >
                              <Edit className="size-3" /> Sửa
                            </Button>
                          )}

                          <Link href={`/appeals?subId=${id}`}>
                            <Button variant="ghost" className="px-2 py-1 text-xs" title="Gửi đơn phúc khảo">
                              <Scale className="size-3" /> Phúc khảo
                            </Button>
                          </Link>

                          {isLeader && (
                            <Button
                              variant="ghost"
                              onClick={() => handleDelete(sub)}
                              className="px-2 py-1 text-xs text-[var(--color-danger)] hover:border-[var(--color-danger)]"
                              title="Xóa bài nộp"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {submissions.length > 0 && (
        <section className="mt-8 space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
            <MessageSquare className="size-5 text-[var(--accent-mentor)]" />
            Góp ý từ cố vấn
          </h2>
          <div className="flex flex-col gap-3">
            {submissions.map((sub, idx) => (
              <TeamSubmissionFeedbackDrawer key={sub.id || sub.Id || idx} submitResultId={sub.id || sub.Id || ""} />
            ))}
          </div>
        </section>
      )}

      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Card className="relative w-full max-w-xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
              <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">Chỉnh sửa bài nộp</h3>
              <button
                type="button"
                onClick={() => setEditingSub(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <Field label="Repo URL" required>
                {(props) => (
                  <Input
                    {...props}
                    type="url"
                    required
                    value={editRepo}
                    onChange={(e) => setEditRepo(e.target.value)}
                  />
                )}
              </Field>

              <Field label="Demo video / Live app URL" required>
                {(props) => (
                  <Input
                    {...props}
                    type="url"
                    required
                    value={editDemo}
                    onChange={(e) => setEditDemo(e.target.value)}
                  />
                )}
              </Field>

              <Field label="Slide thuyết trình URL" required>
                {(props) => (
                  <Input
                    {...props}
                    type="url"
                    required
                    value={editSlide}
                    onChange={(e) => setEditSlide(e.target.value)}
                  />
                )}
              </Field>

              <Field label="Ghi chú cập nhật">
                {(props) => (
                  <textarea
                    {...props}
                    rows={2}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                  />
                )}
              </Field>

              {editError && (
                <p role="alert" className="text-xs text-[var(--color-danger)]">
                  {editError}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-[var(--border-muted)] pt-4">
                <Button type="button" variant="ghost" onClick={() => setEditingSub(null)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} accent="team">
                  {updateMutation.isPending ? "Đang lưu..." : "Cập nhật"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </PageShell>
  );
}

function LinkChip({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-[var(--border-muted)] bg-[var(--bg-input)] px-2.5 py-1 text-xs text-[var(--accent-primary)] transition-colors hover:border-[var(--accent-primary)]"
    >
      {icon}
      {label}
      <ExternalLink className="size-2.5" />
    </a>
  );
}

function TeamSubmissionFeedbackDrawer({ submitResultId }: { submitResultId: string }) {
  const { data: feedbacks = [] } = useMentorFeedbacks(submitResultId);
  const [isOpen, setIsOpen] = useState(false);

  if (feedbacks.length === 0) return null;

  return (
    <Card className="p-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left text-sm text-[var(--text-primary)] transition-colors hover:text-[var(--accent-mentor)]"
      >
        <span className="flex items-center gap-2 font-medium">
          <MessageSquare className="size-4 text-[var(--accent-mentor)]" />
          Nhận xét cố vấn ({feedbacks.length})
        </span>
        {isOpen ? <ChevronUp className="size-4 text-[var(--text-muted)]" /> : <ChevronDown className="size-4 text-[var(--text-muted)]" />}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3 border-t border-[var(--border-muted)] pt-3">
          {feedbacks.map((fb) => {
            const parsed = parseMentorFeedbackComment(fb.comment);
            return (
              <div key={fb.id} className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)]/50 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[var(--accent-mentor)]">Mentor: {fb.mentorName || "Cố vấn"}</span>
                  {parsed.suggestedScore !== undefined && (
                    <span className="text-xs text-[var(--color-warning)]">Điểm gợi ý: {parsed.suggestedScore}/100</span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-[var(--text-primary)]">&ldquo;{parsed.text}&rdquo;</p>
                {parsed.technicalAdvice && (
                  <p className="rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] p-2 text-xs text-[var(--text-muted)]">
                    Lời khuyên kỹ thuật: {parsed.technicalAdvice}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
