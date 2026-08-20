"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { Badge } from "@/components/ui";
import { useToast } from "@/providers/ToastProvider";
import { pushSystemNotification } from "@/repositories/shared/notificationsRepository";
import { MessageSquare, ChevronDown, ChevronUp, GitBranch, Globe, Presentation, FileText, CheckCircle2, AlertTriangle, Sparkles, Scale, Trash2, Edit3, ArrowRight, Trophy, Plus, Users } from "lucide-react";
import type { SubmissionItem, DeliverableItem } from "@/viewModels/teamTypes";

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ sub }: { sub: SubmissionItem }) {
  if (sub.isEliminated)
    return (
      <span className="font-mono text-[9px] px-2 py-0.5 border bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/30 tracking-widest uppercase">
        ✗ BỊ LOẠI
      </span>
    );
  if (!sub.isActive)
    return (
      <span className="font-mono text-[9px] px-2 py-0.5 border bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--border-muted)] tracking-widest uppercase">
        ĐÃ HỦY
      </span>
    );
  return (
    <span className="font-mono text-[9px] px-2 py-0.5 border bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30 tracking-widest uppercase">
      ✓ ĐÃ NỘP
    </span>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function parseExistingSub(sub: SubmissionItem) {
  let repo = sub.submissionUrl || "";
  let demo = "";
  let slide = "";
  let notes = "";

  try {
    const parsed = JSON.parse(sub.description);
    if (parsed?.links && Array.isArray(parsed.links)) {
      for (const l of parsed.links) {
        if (l.type === "github" || l.type?.includes("repo")) repo = l.url || repo;
        if (l.type === "deployed_url" || l.type?.includes("demo")) demo = l.url || demo;
        if (l.type === "slides" || l.type?.includes("slide")) slide = l.url || slide;
      }
    }
    notes = parsed?.notes || "";
  } catch {
    const lines = (sub.description || "").split("\n");
    for (const line of lines) {
      if (line.toLowerCase().startsWith("repo:")) repo = line.substring(5).trim();
      else if (line.toLowerCase().startsWith("demo:")) demo = line.substring(5).trim();
      else if (line.toLowerCase().startsWith("slide:")) slide = line.substring(6).trim();
      else notes += (notes ? "\n" : "") + line;
    }
  }

  return { repo, demo, slide, notes };
}

function EditModal({
  sub,
  onClose,
  onSave,
}: {
  sub: SubmissionItem;
  onClose: () => void;
  onSave: (id: string, payload: { repoUrl: string; demoUrl: string; slideUrl: string; submissionUrl: string; description: string }) => void;
}) {
  const initial = parseExistingSub(sub);
  const [repoUrl, setRepoUrl] = useState(initial.repo);
  const [demoUrl, setDemoUrl] = useState(initial.demo);
  const [slideUrl, setSlideUrl] = useState(initial.slide);
  const [notes, setNotes] = useState(initial.notes);

  const handleSave = () => {
    const primaryUrl = repoUrl.trim() || demoUrl.trim() || slideUrl.trim();
    const allLinks = [
      { type: "github", label: "GitHub / GitLab repo", url: repoUrl.trim(), required: true },
      { type: "deployed_url", label: "Live demo", url: demoUrl.trim(), required: true },
      { type: "slides", label: "Slides", url: slideUrl.trim(), required: true },
    ];
    const descJson = JSON.stringify({ links: allLinks, notes: notes.trim() });
    
    onSave(sub.id, {
      repoUrl: repoUrl.trim(),
      demoUrl: demoUrl.trim(),
      slideUrl: slideUrl.trim(),
      submissionUrl: primaryUrl,
      description: descJson,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--bg-base)]/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-[var(--bg-panel)] border border-[var(--accent-team)]/40 hud-clipped shadow-[0_0_40px_rgba(56,189,248,0.1)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-muted)]">
          <div>
            <div className="font-mono text-[10px] text-[var(--accent-team)] tracking-widest uppercase opacity-70">
              {"// CHỈNH SỬA BÀI NỘP"}
            </div>
            <div className="font-mono text-sm font-bold text-[var(--text-primary)] mt-0.5">
              {sub.roundName || "Vòng thi"} · {sub.trackName || "Hạng mục"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-[var(--text-muted)] hover:text-white transition-colors text-lg leading-none focus:outline-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              GitHub / GitLab Repository URL <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="url"
              value={repoUrl}
              placeholder="https://github.com/your-org/your-repo"
              onChange={(e) => setRepoUrl(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] focus:border-[var(--accent-team)] font-mono text-sm focus:outline-none transition-all text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Live Demo / Website URL <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="url"
              value={demoUrl}
              placeholder="https://your-demo.vercel.app"
              onChange={(e) => setDemoUrl(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] focus:border-[var(--accent-team)] font-mono text-sm focus:outline-none transition-all text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Slides Thuyết Trình URL <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              type="url"
              value={slideUrl}
              placeholder="https://docs.google.com/presentation/d/..."
              onChange={(e) => setSlideUrl(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] focus:border-[var(--accent-team)] font-mono text-sm focus:outline-none transition-all text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Ghi Chú &amp; Hướng Dẫn Chấm
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ghi chú thêm thông tin tài khoản demo, hướng dẫn chạy dự án..."
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] focus:border-[var(--accent-team)] font-mono text-sm focus:outline-none transition-all text-[var(--text-primary)] resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-[var(--border-muted)]">
          <button
            id="save-edit-btn"
            onClick={handleSave}
            className="flex-1 hud-clipped px-4 py-2.5 bg-[var(--accent-team)] text-[var(--bg-base)] font-mono font-bold text-xs tracking-wider uppercase transition-all hover:bg-white focus:outline-none cursor-pointer"
          >
            LƯU THAY ĐỔI
          </button>
          <button
            onClick={onClose}
            className="hud-clipped px-4 py-2.5 border border-[var(--border-muted)] text-[var(--text-muted)] font-mono text-xs tracking-wider uppercase hover:border-[var(--accent-primary)] hover:text-white transition-colors focus:outline-none cursor-pointer"
          >
            HỦY
          </button>
        </div>
      </div>
    </div>
  );
}

import { useMyTeam } from "@/repositories/teamsRepository";
import {
  useMySubmissions,
  useUpdateSubmission,
  useDeleteSubmission,
  useMentorFeedbacks,
  readApiError,
  type SubmitResultListItem,
} from "@/repositories/submitResultsRepository";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/ui/Pagination";
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
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  X,
} from "lucide-react";

// ─── Main View ────────────────────────────────────────────────────────────────
export function MySubmissionsView() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: teamResponse, isLoading: isLoadingTeam } = useMyTeam();
  const team = (teamResponse as any)?.team ?? teamResponse;

  const teamId = team?.id || team?.Id || "";
  const isLeader = (team?.members || []).some(
    (m: any) => (m.userId === user?.id || m.userId === user?.userId) && (m.roleName === "TeamLeader" || m.roleName === "Leader"),
  );
  const isRegistered = team?.status === "Registered" || team?.status === "Approved";

  const { data: submissions = [], isLoading: isLoadingSubs, refetch } = useMySubmissions(teamId);

  const {
    paginatedItems: paginatedSubmissions,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setCurrentPage,
    setPageSize,
  } = usePagination(submissions, 5);

  // Edit Modal State
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
      await updateSub.mutateAsync({
        id,
        data: {
          RepoUrl: payload.repoUrl,
          DemoUrl: payload.demoUrl,
          SlideUrl: payload.slideUrl,
          SubmissionUrl: payload.submissionUrl,
          Description: payload.description,
        },
      });
      toast.success("🎉 Đã cập nhật nội dung bài nộp thành công!");
      pushSystemNotification({
        title: "Cập nhật bài nộp thành công",
        message: "Đội thi đã cập nhật thông tin bài nộp. Hệ thống đã đồng bộ tới Ban Giám Khảo & Cố vấn!",
        type: "success",
      });
      setEditingSub(null);
    } catch (err) {
      const msg = readApiError(err);
      setActionError(msg);
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionError("");
    try {
      await deleteSub.mutateAsync(deleteTarget.id);
      toast.info("Đã xóa bài nộp thành công.");
      pushSystemNotification({
        title: "Đã xóa bài nộp",
        message: "Bài nộp đã được hủy bỏ và gỡ khỏi danh sách chấm điểm.",
        type: "warning",
      });
      setDeleteTarget(null);
    } catch (err) {
      const msg = readApiError(err);
      setActionError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="hud-lattice min-h-[calc(100vh-4rem)]">
      {/* Edit Modal */}
      {editingSub && (
        <EditModal
          sub={editingSub}
          onClose={() => { setEditingSub(null); setActionError(""); }}
          onSave={handleSave}
        />
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa bài nộp?"
        description="Hành động này gửi lệnh xóa lên máy chủ, không hoàn tác được."
        confirmLabel="Xóa bài"
        destructive
        pending={deleteSub.isPending}
        error={actionError}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteTarget(null); setActionError(""); }}
      />

      <div className="max-w-[var(--container-max)] mx-auto px-6 py-8">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="font-mono text-[10px] text-[var(--accent-team)] tracking-[0.25em] uppercase font-bold">
              SUBMISSION MANAGEMENT
            </span>
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-[var(--text-primary)] mt-1">
              Bài Nộp Của Đội
            </h1>
            {team && (
              <p className="font-mono text-xs text-[var(--text-muted)] mt-1 flex flex-wrap items-center gap-2">
                <span>Đội: <span className="text-[var(--accent-team)] font-bold">{pick(team, "name", "Name", "teamName", "TeamName") || "Đội thi"}</span></span>
                <span>·</span>
                <span>Sự kiện:</span>
                <Link
                  href={`/events/${pick(team, "eventId", "EventId")}`}
                  className="text-[var(--accent-primary)] hover:underline flex items-center gap-1 border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded-none font-bold"
                >
                  <span>{pick(team, "eventName", "EventName") || "Sự kiện"}</span>
                  <span className="text-[10px]">↗ XEM CHI TIẾT</span>
                </Link>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/events/${pick(team, "eventId", "EventId")}/leaderboard`}>
              <button className="hud-clipped px-4 py-3 border border-[var(--accent-judge)]/40 bg-[var(--accent-judge)]/10 text-[var(--accent-judge)] font-mono text-xs font-bold tracking-wider uppercase hover:bg-[var(--accent-judge)]/20 transition-all focus:outline-none whitespace-nowrap">
                🏆 BẢNG XẾP HẠNG
              </button>
            </Link>

            {isRegistered ? (
              <Link href="/submissions/new">
                <button
                  id="new-submission-btn"
                  className="hud-clipped px-6 py-3 bg-[var(--accent-team)] text-[var(--bg-base)] font-mono font-bold tracking-wider uppercase text-sm transition-all duration-200 hover:bg-white hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] focus:outline-none whitespace-nowrap"
                >
                  + NỘP BÀI MỚI
                </button>
              </Link>
            ) : (
              <div
                className="hud-clipped px-6 py-3 bg-[var(--bg-panel)] border border-[var(--border-muted)] font-mono text-xs text-[var(--text-muted)] tracking-wider uppercase cursor-not-allowed"
                title={!team ? "Bạn chưa có đội thi" : "Đội cần được BTC xác nhận trước khi nộp bài"}
              >
                {!team ? "CHƯA CÓ ĐỘI" : `TRẠNG THÁI: ${teamStatus.toUpperCase()}`}
              </div>
            )}
          </div>
        </div>

        {/* ── Stats Summary Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] block">TỔNG SỐ BÀI NỘP</span>
            <span className="font-display text-2xl font-bold text-[var(--text-primary)]">{visibleSubs.length}</span>
          </div>
          <div className="p-4 bg-[var(--bg-panel)] border border-[var(--color-success)]/30 hud-clipped">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-success)] block">ĐÃ NỘP HỢP LỆ</span>
            <span className="font-display text-2xl font-bold text-[var(--color-success)]">
              {visibleSubs.filter(s => s.isActive && !s.isEliminated).length}
            </span>
          </div>
          <div className="p-4 bg-[var(--bg-panel)] border border-[var(--accent-mentor)]/30 hud-clipped">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-mentor)] block">CỐ VẤN / FEEDBACK</span>
            <span className="font-display text-2xl font-bold text-[var(--accent-mentor)]">Sẵn sàng</span>
          </div>
          <div className="p-4 bg-[var(--bg-panel)] border border-[var(--accent-team)]/30 hud-clipped">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-team)] block">TRẠNG THÁI ĐỘI</span>
            <span className="font-display text-lg font-bold text-[var(--accent-team)] truncate">
              {teamStatus ? teamStatus.toUpperCase() : "CHƯA CÓ ĐỘI"}
            </span>
          </div>
        </div>

        {/* ── Warning banners ── */}
        {team && !isRegistered && (
          <div className="mb-6 p-4 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 hud-clipped">
            <p className="font-mono text-xs text-[var(--color-warning)]">
              ⚠ Chỉ có thể nộp bài sau khi đội được BTC <strong>phê duyệt đăng ký</strong>.
              Trạng thái hiện tại: <span className="font-bold uppercase">{teamStatus || "Pending"}</span>
            </p>
          </div>
        )}
        {!team && (
          <div className="mb-6 p-4 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 hud-clipped">
            <p className="font-mono text-xs text-[var(--color-danger)]">
              ✗ Bạn chưa có đội thi.{" "}
              <Link href="/my-team" className="underline hover:text-white">Tạo hoặc tham gia đội</Link>.
            </p>
          </div>
        )}

        {actionError && (
          <p role="alert" className="mb-4 font-mono text-xs text-[color:var(--color-danger)]">
            {actionError}
          </p>
        )}

        {/* ── Table ── */}
        {isLoading ? (
          <p className="font-mono text-xs text-[color:var(--text-muted)] py-10 text-center">Đang tải bài nộp...</p>
        ) : visibleSubs.length === 0 ? (
          <div className="p-8 bg-[var(--bg-panel)] border border-dashed border-zinc-700 text-center space-y-4 hud-clipped">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
              <FileText className="w-6 h-6" />
            </div>

            {/* Command Grid Table Panel (Stitch T5) */}
            <div className="bg-[#1a2123] border border-white/10 glow-box flex flex-col">
              {/* Panel Header Bar */}
              <div className="h-8 bg-[#38bdf8]/10 border-b border-[#38bdf8]/30 flex items-center px-4 justify-between font-mono text-xs">
                <span className="text-[#38bdf8] font-bold tracking-widest">[ SUBMISSION_GRID ]</span>
                <span className="text-[#38bdf8]/70 text-[10px]">SYNC: ACTIVE ({submissions.length} BÀI NỘP)</span>
              </div>

              {isLoadingSubs ? (
                <div className="p-12 text-center font-mono text-xs text-[#00d9ff] animate-pulse">
                  [ SYSTEM_LOG: FETCHING_SUBMISSIONS... ]
                </div>
              ) : submissions.length === 0 ? (
                <div className="p-12 text-center font-mono text-xs text-[#859398] space-y-3">
                  <p>Đội của bạn chưa có bài nộp nào được lưu trên hệ thống.</p>
                  <Link href="/submissions/new">
                    <button className="bg-[#00d9ff] text-[#080f11] font-bold px-4 py-2 uppercase text-xs hover:bg-white transition-colors">
                      [ Nộp Bài Thi Đầu Tiên ]
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="border-b border-[#3c494d]/60 bg-[#0e1417]/80 text-[#859398]">
                        <th className="py-3 px-4 uppercase tracking-wider">VÒNG THI</th>
                        <th className="py-3 px-4 uppercase tracking-wider">LIÊN KẾT BÀI NỘP (3 URLS)</th>
                        <th className="py-3 px-4 uppercase tracking-wider">THỜI GIAN NỘP</th>
                        <th className="py-3 px-4 uppercase tracking-wider">TRẠNG THÁI</th>
                        <th className="py-3 px-4 uppercase tracking-wider text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3c494d]/40">
                      {paginatedSubmissions.map((sub, idx) => {
                        const id = sub.id || sub.Id || `sub-${idx}`;
                        const isEliminated = (sub as any).isTeamDisqualified || (sub as any).IsTeamDisqualified;
                        const isActive = sub.isActive ?? sub.IsActive ?? true;

                        return (
                          <tr key={id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="py-4 px-4 font-bold text-white whitespace-nowrap">
                              {(sub as any).roundName || (sub as any).RoundName || `Vòng ${(currentPage - 1) * pageSize + idx + 1}`}
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex flex-wrap items-center gap-2">
                                {(sub.repoUrl || sub.RepoUrl || sub.submissionUrl || sub.SubmissionUrl) && (
                                  <a
                                    href={(sub.repoUrl || sub.RepoUrl || sub.submissionUrl || sub.SubmissionUrl) || undefined}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0e1417] border border-[#00d9ff]/30 text-[#00d9ff] hover:border-[#00d9ff] text-[11px]"
                                  >
                                    <Code className="w-3 h-3" /> Repo
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                                {(sub.demoUrl || sub.DemoUrl) && (
                                  <a
                                    href={(sub.demoUrl || sub.DemoUrl) || undefined}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0e1417] border border-[#f87171]/30 text-[#f87171] hover:border-[#f87171] text-[11px]"
                                  >
                                    <Globe className="w-3 h-3" /> Live Demo
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                                {(sub.slideUrl || sub.SlideUrl) && (
                                  <a
                                    href={(sub.slideUrl || sub.SlideUrl) || undefined}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0e1417] border border-[#fb923c]/30 text-[#fb923c] hover:border-[#fb923c] text-[11px]"
                                  >
                                    <Presentation className="w-3 h-3" /> Slides
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-4 text-[#859398] whitespace-nowrap text-[11px]">
                              {sub.createdTime || sub.CreatedTime ? new Date(sub.createdTime || sub.CreatedTime || "").toLocaleString("vi-VN") : "—"}
                            </td>

                            <td className="py-4 px-4 whitespace-nowrap">
                              {isEliminated ? (
                                <span className="px-2 py-0.5 border border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffb4ab] text-[10px] font-bold uppercase">
                                  BỊ LOẠI
                                </span>
                              ) : !isActive ? (
                                <span className="px-2 py-0.5 border border-[#859398]/30 bg-[#859398]/10 text-[#859398] text-[10px] font-bold uppercase">
                                  ĐÃ HỦY
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 border border-[#34d399]/30 bg-[#34d399]/10 text-[#34d399] text-[10px] font-bold uppercase">
                                  ĐÃ NỘP
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                {isActive && !isEliminated && (
                                  <button
                                    onClick={() => handleOpenEdit(sub)}
                                    disabled={!isRegistered || !isLeader}
                                    title={!isLeader ? "Chỉ Trưởng nhóm mới có quyền sửa bài" : "Chỉnh sửa liên kết"}
                                    className={`px-2.5 py-1 border text-[11px] uppercase flex items-center gap-1 ${isRegistered && isLeader
                                        ? "border-[#00d9ff]/40 text-[#00d9ff] hover:bg-[#00d9ff]/10"
                                        : "border-[#3c494d] text-[#859398] opacity-40 cursor-not-allowed"
                                      }`}
                                  >
                                    <Edit className="w-3 h-3" /> Sửa
                                  </button>
                                )}

                                <Link href={`/appeals?subId=${id}`}>
                                  <button
                                    className="px-2.5 py-1 border border-[#febb29]/40 text-[#febb29] hover:bg-[#febb29]/10 text-[11px] uppercase flex items-center gap-1"
                                    title="Gửi đơn phúc khảo điểm số"
                                  >
                                    <Scale className="w-3 h-3" /> Phúc khảo
                                  </button>
                                </Link>

                                {isLeader && (
                                  <button
                                    onClick={() => handleDelete(sub)}
                                    className="px-2 py-1 border border-[#ffb4ab]/30 text-[#ffb4ab] hover:bg-[#ffb4ab]/10 text-[11px]"
                                    title="Xóa bài nộp"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
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

              {submissions.length > 0 && (
                <div className="p-3 border-t border-[#3c494d]/40">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    itemLabel="bài nộp"
                  />
                </div>
              )}
            </div>
            {isRegistered && (
              <div className="pt-2">
                <Link href="/submissions/new">
                  <button className="px-6 py-2.5 bg-[var(--accent-team)] text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-white transition-all">
                    + NỘP BÀI THI CHO HẠNG MỤC NGAY
                  </button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[var(--border-muted)] bg-[var(--bg-base)]">
              {[
                { label: "VÒNG THI",   col: "col-span-2" },
                { label: "HẠNG MỤC",  col: "col-span-2" },
                { label: "SẢN PHẨM / LINK NỘP", col: "col-span-4" },
                { label: "TRẠNG THÁI",col: "col-span-2" },
                { label: "THAO TÁC",  col: "col-span-2" },
              ].map(h => (
                <div key={h.label} className={`font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase ${h.col}`}>
                  {h.label}
                </div>
              ))}
            </div>

            {visibleSubs.map(sub => {
              const parsed = parseExistingSub(sub);
              return (
                <div key={sub.id} className="border-b border-[var(--border-muted)] last:border-0">
                  <div className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-[rgba(56,189,248,0.02)] transition-colors items-center">
                    {/* Vòng */}
                    <div className="col-span-2 font-mono text-xs text-[var(--text-primary)] font-semibold">
                      {sub.roundName}
                    </div>

                    {/* Track */}
                    <div className="col-span-2 font-mono text-xs text-[var(--text-muted)]">
                      {sub.trackName}
                    </div>

                    {/* URL Deliverables */}
                    <div className="col-span-4 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {parsed.repo && (
                          <a
                            href={parsed.repo}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-0.5 bg-black/60 border border-zinc-700 hover:border-cyan-400 text-cyan-300 font-mono text-[10px] flex items-center gap-1 transition-colors"
                          >
                            <GitBranch className="w-3 h-3" />
                            <span>Repo ↗</span>
                          </a>
                        )}
                        {parsed.demo && (
                          <a
                            href={parsed.demo}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-0.5 bg-black/60 border border-zinc-700 hover:border-emerald-400 text-emerald-300 font-mono text-[10px] flex items-center gap-1 transition-colors"
                          >
                            <Globe className="w-3 h-3" />
                            <span>Demo ↗</span>
                          </a>
                        )}
                        {parsed.slide && (
                          <a
                            href={parsed.slide}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-0.5 bg-black/60 border border-zinc-700 hover:border-amber-400 text-amber-300 font-mono text-[10px] flex items-center gap-1 transition-colors"
                          >
                            <Presentation className="w-3 h-3" />
                            <span>Slides ↗</span>
                          </a>
                        )}
                      </div>
                      {parsed.notes && (
                        <p className="font-mono text-[10px] text-zinc-400 line-clamp-1 italic">
                          📝 {parsed.notes}
                        </p>
                      )}
                    </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <StatusBadge sub={sub} />
                    {sub.isEliminated && sub.eliminatedReason && (
                      <p className="font-mono text-[9px] text-[var(--color-danger)]/70 mt-1">{sub.eliminatedReason}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex flex-wrap gap-1.5 items-center">
                    {sub.isActive && !sub.isEliminated && (
                      <button
                        id={`edit-sub-${sub.id}`}
                        onClick={() => setEditingSub(sub)}
                        disabled={!isRegistered || !isLeader}
                        title={
                          !isRegistered
                            ? "Đội thi cần được BTC duyệt đăng ký mới được phép sửa bài"
                            : !isLeader
                            ? "Chỉ Trưởng đội thi mới có quyền chỉnh sửa bài nộp"
                            : "Chỉnh sửa nội dung bài nộp"
                        }
                        className={`font-mono text-[10px] px-2 py-1 border transition-colors uppercase flex items-center gap-1 ${
                          isRegistered && isLeader
                            ? "border-[var(--accent-team)]/40 text-[var(--accent-team)] hover:bg-[var(--accent-team)]/10 cursor-pointer"
                            : "border-[var(--border-muted)] text-[var(--text-muted)] opacity-40 cursor-not-allowed"
                        }`}
                      >
                        ✏ SỬA BÀI
                      </button>
                    )}
                      <button
                        type="button"
                        onClick={() => { setActionError(""); setDeleteTarget(sub); }}
                        disabled={!isRegistered || !isLeader}
                        className={`font-mono text-[10px] px-2 py-1 border uppercase ${
                          isRegistered && isLeader
                            ? "border-[var(--color-danger)]/40 text-[color:var(--color-danger)]"
                            : "border-[var(--border-muted)] text-[var(--text-muted)] opacity-40 cursor-not-allowed"
                        }`}
                      >
                        Xóa
                      </button>
                      <Link href={`/appeals?subId=${sub.id}`}>
                        <button
                          className="font-mono text-[10px] px-2 py-1 border border-[var(--accent-coordinator)]/40 text-[var(--accent-coordinator)] hover:bg-[var(--accent-coordinator)]/10 transition-colors uppercase"
                          title="Nộp đơn phúc khảo cho bài nộp này"
                        >
                          Phúc khảo
                        </button>
                      </Link>
                  </div>
                </div>

                {/* Mentor Feedback Sub-Section */}
                <SubmissionMentorFeedbackSection submitResultId={sub.id} />
              </div>
            );
          })}
          </div>
        )}

        {/* Footer */}
        {visibleSubs.length > 0 && (
          <div className="mt-4 flex items-center justify-between font-mono text-xs text-[var(--text-muted)]">
            <span>
              Tổng: <span className="text-[var(--text-primary)] font-bold">{visibleSubs.length}</span> bài nộp
            </span>
            <Link href="/my-team" className="hover:text-[var(--accent-team)] transition-colors">
              ← Về trang đội thi
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mentor Feedback Section For Teams ──────────────────────────────────────
function SubmissionMentorFeedbackSection({ submitResultId }: { submitResultId: string }) {
  const { data: feedbacks = [] } = useMentorFeedbacks(submitResultId);
  const [isOpen, setIsOpen] = useState(false);

  if (feedbacks.length === 0) return null;

  return (
    <div className="border-t border-[var(--border-muted)]/50 bg-[var(--bg-base)]/50 px-5 py-2.5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full font-mono text-xs text-[var(--accent-mentor)] hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2 font-bold">
          <MessageSquare className="w-3.5 h-3.5" />
          Nhận xét của Cố vấn ({feedbacks.length})
        </span>
        <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
          {isOpen ? "Thu gọn" : "Xem chi tiết"}
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {isOpen && (
        <div className="space-y-3 pt-3 mt-2 border-t border-[var(--border-muted)]/40">
          {feedbacks.map((fb: any) => (
            <div
              key={fb.id}
              className="p-3 bg-[var(--bg-input)] border border-[var(--accent-mentor)]/30 hud-clipped space-y-1.5"
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
                <span className="font-mono text-[10px] text-[var(--text-muted)]">
                  {new Date(fb.createdTime).toLocaleString("vi-VN")}
                </span>
              </div>

              <p className="font-sans text-xs text-[var(--text-primary)] leading-relaxed">
                "{fb.feedbackContent}"
              </p>

              {fb.technicalAdvice && (
                <div className="p-2 bg-[var(--bg-base)] border border-[var(--accent-mentor)]/20 font-mono text-[11px] text-[var(--accent-mentor)]">
                  💡 Lời khuyên kỹ thuật: {fb.technicalAdvice}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

