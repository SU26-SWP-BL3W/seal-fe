"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { Badge } from "@/components/ui";
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
import { ApiMissingDataBadge, ConfirmDialog } from "@/components/ui";

function pick(obj: unknown, ...keys: string[]): string {
  const rec = obj as Record<string, unknown> | null;
  if (!rec) return "";
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

function mapSubmission(raw: SubmitResultListItem): SubmissionItem {
  const repo = pick(raw, "repoUrl", "RepoUrl", "submissionUrl", "SubmissionUrl");
  const demo = pick(raw, "demoUrl", "DemoUrl");
  const slide = pick(raw, "slideUrl", "SlideUrl");
  return {
    id: pick(raw, "id", "Id"),
    teamId: pick(raw, "teamId", "TeamId"),
    teamName: pick(raw, "teamName", "TeamName"),
    trackId: pick(raw, "trackId", "TrackId"),
    trackName: pick(raw, "trackId", "TrackId"),
    roundId: "",
    roundName: "Vòng hiện tại",
    submissionUrl: repo,
    description: [repo && `Repo: ${repo}`, demo && `Demo: ${demo}`, slide && `Slide: ${slide}`]
      .filter(Boolean)
      .join("\n"),
    isActive: raw.isActive !== false && raw.IsActive !== false,
    isEliminated: false,
    createdTime: pick(raw, "createdTime", "CreatedTime"),
  };
}

// ─── Main View ────────────────────────────────────────────────────────────────
export function MySubmissionsView() {
  const { user, activeRole } = useAuth();
  const roleName = activeRole?.roleName || activeRole?.RoleName || (user?.IsAdmin ? "Admin" : "Guest");
  const isLeader = roleName === "TeamLeader";
  const eventIdFromRole = pick(activeRole, "eventId", "EventId");

  const { data: realTeam } = useMyTeam(eventIdFromRole || undefined);
  const team = realTeam;
  const teamStatus = pick(team, "status", "Status");
  const isRegistered = teamStatus === "Registered";

  const { data: rawSubs = [], isLoading } = useMySubmissions();
  const submissions = rawSubs.map(mapSubmission);
  const updateSub = useUpdateSubmission();
  const deleteSub = useDeleteSubmission();

  const [editingSub, setEditingSub] = useState<SubmissionItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubmissionItem | null>(null);
  const [actionError, setActionError] = useState("");

  const visibleSubs = submissions;

  const handleSave = async (
    id: string,
    payload: { repoUrl: string; demoUrl: string; slideUrl: string; submissionUrl: string; description: string }
  ) => {
    setActionError("");
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
      setEditingSub(null);
    } catch (err) {
      setActionError(readApiError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionError("");
    try {
      await deleteSub.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setActionError(readApiError(err));
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
            <div className="space-y-1">
              <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                Chưa Có Bài Nộp Nào
              </h3>
              <p className="font-mono text-xs text-zinc-400 max-w-md mx-auto">
                Đội của bạn chưa nộp sản phẩm thi cho các hạng mục. Hãy chuẩn bị mã nguồn GitHub, Live Demo và Slides thuyết trình để nộp bài!
              </p>
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

