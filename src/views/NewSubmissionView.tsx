"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import {
  useCreateSubmission,
  useMySubmissions,
  useUpdateSubmission,
  readApiError,
  type SubmitResultRequest,
} from "@/repositories/submitResultsRepository";
import { useMyTeam } from "@/repositories/teamsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { useEventRounds } from "@/repositories/eventsRepository";
import { ApiMissingDataBadge, Badge, Button, Card, Input } from "@/components/ui";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/providers/ToastProvider";

import type { RoundItem, TrackItem, DeliverableItem, SubmissionItem, DeliverableType } from "@/viewModels/teamTypes";

import { parseLinkRules } from "@/components/domain/event-wizard/Step3TrackConfig";

// ─── Deliverable Icon Metadata ────────────────────────────────────────────────
const DELIVERABLE_LABELS: Record<DeliverableType, string> = {
  github: "GitHub repo",
  slides: "Slides / PPT",
  demo_video: "Demo video",
  deployed_url: "Live demo",
  report: "Báo cáo PDF",
  figma: "Figma design",
  other: "Link bổ sung",
};

// ─── Single Track Submission Card Component ──────────────────────────────────
function TrackSubmissionCard({
  track,
  existingSubmission,
  onSubmitSuccess,
  teamId,
  roundId,
}: {
  track: TrackItem;
  existingSubmission?: SubmissionItem;
  onSubmitSuccess: (trackId: string, updatedSub: SubmissionItem) => void;
  teamId: string;
  roundId: string;
}) {
  const toast = useToast();

  const linkRules = useMemo(() => {
    const raw = (track as any)?.submissionRuleDescription || (track as any)?.SubmissionRuleDescription || track.description;
    return parseLinkRules(raw);
  }, [track]);

  const deliverables: DeliverableItem[] = useMemo(() => {
    const list: DeliverableItem[] = [];
    if (linkRules.github !== "none") {
      list.push({
        id: "github",
        type: "github",
        label: "Mã nguồn GitHub / GitLab",
        placeholder: "https://github.com/org/repo",
        required: linkRules.github === "required",
        trackId: track.id,
      });
    }
    if (linkRules.demo !== "none") {
      list.push({
        id: "deployed_url",
        type: "demo_video",
        label: "Video Demo / Live Demo",
        placeholder: "https://youtube.com/watch?v=... hoặc https://demo.com",
        required: linkRules.demo === "required",
        trackId: track.id,
      });
    }
    if (linkRules.slides !== "none") {
      list.push({
        id: "slides",
        type: "slides",
        label: "Slide Thuyết Trình",
        placeholder: "https://docs.google.com/presentation/... hoặc Canva",
        required: linkRules.slides === "required",
        trackId: track.id,
      });
    }
    if (linkRules.figma !== "none") {
      list.push({
        id: "figma",
        type: "figma",
        label: "Thiết Kế UI/UX Figma / XD",
        placeholder: "https://figma.com/file/...",
        required: linkRules.figma === "required",
        trackId: track.id,
      });
    }
    if (linkRules.docs !== "none") {
      list.push({
        id: "docs",
        type: "report",
        label: "Báo Cáo / Tài Liệu PDF",
        placeholder: "https://docs.google.com/document/... hoặc Drive PDF",
        required: linkRules.docs === "required",
        trackId: track.id,
      });
    }
    if (list.length === 0) {
      list.push({
        id: "github",
        type: "github",
        label: "Mã nguồn GitHub / GitLab",
        placeholder: "https://github.com/org/repo",
        required: true,
        trackId: track.id,
      });
    }
    return list;
  }, [linkRules, track.id]);
  const createSubmission = useCreateSubmission();
  const updateSubmission = useUpdateSubmission();

  // Parse existing submission links if available
  const parsedExisting = useMemo(() => {
    if (!existingSubmission) return { links: {}, notes: "" };
    try {
      const parsed = JSON.parse(existingSubmission.description);
      const linkMap: Record<string, string> = {};
      if (Array.isArray(parsed?.links)) {
        parsed.links.forEach((l: { type: string; url: string }) => {
          if (l.type && l.url) linkMap[l.type] = l.url;
        });
      }
      return { links: linkMap, notes: parsed?.notes || "" };
    } catch {
      return { links: {}, notes: existingSubmission.description || "" };
    }
  }, [existingSubmission]);

  const [linkValues, setLinkValues] = useState<Record<string, string>>(parsedExisting.links);
  const [notes, setNotes] = useState(parsedExisting.notes);
  const [isSaved, setIsSaved] = useState(!!existingSubmission);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const sanitizeUrl = (url: string) => {
    const trimmed = (url || "").trim();
    if (!trimmed) return "";
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  // Check completion
  const { filledCount, requiredFilled, requiredTotal } = useMemo(() => {
    let filled = 0;
    let reqFilled = 0;
    let reqTotal = 0;
    for (const d of deliverables) {
      const rawVal = (linkValues[d.type] || linkValues[d.id] || "").trim();
      const val = sanitizeUrl(rawVal);
      const valid = val.startsWith("http://") || val.startsWith("https://");
      if (valid) filled++;
      if (d.required) {
        reqTotal++;
        if (valid) reqFilled++;
      }
    }
    return { filledCount: filled, requiredFilled: reqFilled, requiredTotal: reqTotal };
  }, [deliverables, linkValues]);

  const allRequiredDone = requiredTotal > 0 ? requiredFilled === requiredTotal : true;

  const handleLinkChange = (key: string, val: string) => {
    setLinkValues((prev) => ({ ...prev, [key]: val }));
    setIsSaved(false);
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRequiredDone) {
      setFormError("Vui lòng hoàn thành tất cả các đường link bài nộp bắt buộc.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    const sanitizedLinkValues: Record<string, string> = {};
    for (const [k, v] of Object.entries(linkValues)) {
      sanitizedLinkValues[k] = sanitizeUrl(v);
    }

    const primaryDeliverable = deliverables.find((d) => d.required);
    const primaryUrl = primaryDeliverable
      ? (sanitizedLinkValues[primaryDeliverable.type] || sanitizedLinkValues[primaryDeliverable.id] || "").trim()
      : Object.values(sanitizedLinkValues).find((v) => v.trim().length > 0) || "";

    const allLinks = deliverables.map((d) => ({
      type: d.type,
      label: d.label,
      url: (sanitizedLinkValues[d.type] || sanitizedLinkValues[d.id] || "").trim(),
      required: d.required,
    }));

    const finalRoundId = track.roundId || roundId || "";

    const payload = {
      TeamId: teamId,
      TrackId: track.id,
      RoundId: finalRoundId,
      RepoUrl: (sanitizedLinkValues.github || "").trim(),
      DemoUrl: (sanitizedLinkValues.deployed_url || sanitizedLinkValues.demo_video || "").trim(),
      SlideUrl: (sanitizedLinkValues.slides || "").trim(),
      SubmissionUrl: (sanitizedLinkValues.github || primaryUrl).trim(),
      Description: JSON.stringify({ links: allLinks, notes: notes.trim() }),
    };

    try {
      const created = existingSubmission?.id
        ? await updateSubmission.mutateAsync({ id: existingSubmission.id, data: payload } as any)
        : await createSubmission.mutateAsync(payload as any);
      const updatedItem: SubmissionItem = {
        id: (created as { id?: string })?.id || existingSubmission?.id || `sub-${Date.now()}`,
        teamId,
        roundId: finalRoundId,
        roundName: "Vòng hiện tại",
        trackId: track.id,
        trackName: track.trackName,
        submissionUrl: primaryUrl,
        description: JSON.stringify({ links: allLinks, notes: notes.trim() }),
        teamName: "",
        createdTime: new Date().toISOString(),
        isActive: true,
      };
      setIsSaved(true);
      setFormError("");
      toast.success(`Nộp bài thành công cho hạng mục "${track.trackName}".`);
      onSubmitSuccess(track.id, updatedItem);
    } catch (err) {
      const errMsg = readApiError(err);
      setFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id={`track-card-${track.id}`}
      className={`overflow-hidden rounded-lg border bg-[var(--bg-panel)] transition-colors ${
        isSaved
          ? "border-[var(--color-success)]/40"
          : allRequiredDone
          ? "border-[var(--accent-team)]/50"
          : "border-[var(--border-muted)]"
      }`}
    >
      <div className="flex flex-col justify-between gap-3 border-b border-[var(--border-muted)] bg-[var(--bg-base)]/50 px-6 py-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs text-[var(--text-muted)]">Hạng mục thi</p>
          <h2 className="mt-0.5 font-display text-xl font-semibold text-[var(--text-primary)]">
            {track.trackName}
          </h2>
          {track.description && (
            <p className="mt-1 max-w-xl text-sm text-[var(--text-muted)]">{track.description}</p>
          )}
        </div>

        <div className="shrink-0">
          {isSaved ? <Badge tone="success">Đã nộp</Badge> : <Badge tone="warning">Chưa nộp</Badge>}
        </div>
      </div>

      <form onSubmit={handleCardSubmit} className="flex flex-col gap-5 p-6">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Tài liệu cần nộp ({filledCount}/{deliverables.length})
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              Bắt buộc:{" "}
              <strong className={requiredFilled === requiredTotal ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}>
                {requiredFilled}/{requiredTotal}
              </strong>
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {deliverables.map((dlv: any) => {
              const typeLabel = DELIVERABLE_LABELS[dlv.type as DeliverableType] || DELIVERABLE_LABELS.other;
              const val = linkValues[dlv.type] || linkValues[dlv.id] || "";
              const isFilled = val.trim().length > 0;
              const isValidUrl = isFilled && (val.startsWith("http://") || val.startsWith("https://"));

              return (
                <div
                  key={dlv.id}
                  className={`flex flex-col justify-between gap-3 rounded-lg border p-4 transition-colors md:flex-row md:items-center ${
                    isValidUrl
                      ? "border-[var(--color-success)]/40 bg-[var(--color-success)]/[0.03]"
                      : isFilled
                      ? "border-[var(--color-danger)]/40 bg-[var(--color-danger)]/[0.03]"
                      : "border-[var(--border-muted)] bg-[var(--bg-base)]/40"
                  }`}
                >
                  <div className="min-w-[200px]">
                    <span className="inline-block rounded-md border border-[var(--border-muted)] bg-[var(--bg-input)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                      {typeLabel}
                    </span>
                    <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{dlv.label}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {dlv.required ? "Bắt buộc" : "Tùy chọn"}
                    </p>
                  </div>

                  <div className="min-w-0 flex-1">
                    <Input
                      type="url"
                      placeholder={dlv.placeholder || "https://..."}
                      value={val}
                      onChange={(e) => handleLinkChange(dlv.type, e.target.value)}
                      className={
                        isValidUrl
                          ? "border-[var(--color-success)]/40"
                          : isFilled
                          ? "border-[var(--color-danger)]/50"
                          : ""
                      }
                    />
                  </div>

                  <div className="shrink-0">
                    {isValidUrl ? (
                      <Badge tone="success">Đã điền</Badge>
                    ) : dlv.required ? (
                      <Badge tone="danger">Chưa điền</Badge>
                    ) : (
                      <Badge tone="neutral">Tùy chọn</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-1 flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--text-primary)]">Ghi chú thêm</label>
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setIsSaved(false);
            }}
            rows={2}
            placeholder="Ghi chú về giải pháp, tài khoản demo, v.v."
            className="w-full resize-none rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/60 focus:border-[var(--accent-team)] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-muted)]/60 pt-4">
          <div className="text-sm text-[var(--text-muted)]">
            {formError ? (
              <span role="alert" className="text-[color:var(--color-danger)]">{formError}</span>
            ) : isSaved ? (
              <span className="text-[var(--color-success)]">Đã lưu bài nộp cho hạng mục {track.trackName}</span>
            ) : (
              <span>Kiểm tra kỹ các đường link trước khi xác nhận.</span>
            )}
          </div>

          <Button
            type="submit"
            accent="team"
            disabled={!allRequiredDone || isSubmitting}
            variant={isSaved ? "ghost" : "primary"}
          >
            {isSubmitting ? "Đang xử lý..." : isSaved ? "Cập nhật bài nộp" : "Xác nhận nộp bài"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Main NewSubmissionView Component ──────────────────────────────────────────
export function NewSubmissionView() {
  const { activeRole } = useAuth();
  const eventIdFromRole =
    (activeRole as { eventId?: string; EventId?: string } | null)?.eventId ||
    (activeRole as { EventId?: string } | null)?.EventId ||
    "";
  const { data: realTeam, isLoading } = useMyTeam(eventIdFromRole || undefined);
  const team = realTeam;
  const eventId = (team as any)?.EventId || (team as any)?.eventId || eventIdFromRole;
  const teamId = (team as any)?.TeamId || (team as any)?.id || "";
  const teamTrackId = (team as any)?.TrackId || (team as any)?.trackId || "";
  const { data: tracks = [] } = useGetTracksByEvent(eventId);
  const { data: rounds = [] } = useEventRounds(eventId);
  const { data: existingSubs = [] } = useMySubmissions(teamId || undefined);
  const currentOrLastRound = rounds.find((r: any) => r.isCurrentRound || r.status === "Active" || r.status === "InProgress") || rounds[rounds.length - 1] || rounds[0];
  const roundId = currentOrLastRound?.id || currentOrLastRound?.Id || "";

  const availableTracks: TrackItem[] = (tracks as any[])
    .filter((t) => !teamTrackId || (t.id || t.Id) === teamTrackId)
    .map((t: any) => ({
      id: t.id || t.Id,
      trackName: t.trackName || t.TrackName || "",
      description: t.description || t.Description || "",
      submissionRuleDescription: t.submissionRuleDescription || t.SubmissionRuleDescription || "",
      roundId: t.roundId || t.RoundId || roundId,
      templateId: t.templateId || t.TemplateId || null,
    }));

  // Bài nộp đã có sẵn trên server, khớp theo trackId — để mở lại trang vẫn thấy đúng
  // trạng thái "đã nộp" thay vì luôn coi là nộp mới (tránh gọi nhầm create thay vì update).
  const submissionsFromServer: Record<string, SubmissionItem> = useMemo(() => {
    const map: Record<string, SubmissionItem> = {};
    for (const raw of existingSubs as any[]) {
      const trackId = raw.trackId || raw.TrackId;
      if (!trackId) continue;
      const repo = raw.repoUrl || raw.RepoUrl || raw.submissionUrl || raw.SubmissionUrl || "";
      const demo = raw.demoUrl || raw.DemoUrl || "";
      const slide = raw.slideUrl || raw.SlideUrl || "";
      map[trackId] = {
        id: raw.id || raw.Id || "",
        teamId: raw.teamId || raw.TeamId || "",
        roundId: raw.roundId || raw.RoundId || roundId,
        roundName: "Vòng hiện tại",
        trackId,
        trackName: raw.trackName || raw.TrackName || "",
        submissionUrl: repo,
        description: JSON.stringify({
          links: [
            { type: "github", label: "GitHub / GitLab repo", url: repo, required: true },
            { type: "deployed_url", label: "Live demo", url: demo, required: true },
            { type: "slides", label: "Slides", url: slide, required: true },
          ],
          notes: "",
        }),
        teamName: raw.teamName || raw.TeamName || "",
        createdTime: raw.createdTime || raw.CreatedTime || "",
        isActive: raw.isActive !== false && raw.IsActive !== false,
      };
    }
    return map;
  }, [existingSubs, roundId]);

  const [localOverrides, setLocalOverrides] = useState<Record<string, SubmissionItem>>({});
  const submissions = { ...submissionsFromServer, ...localOverrides };

  const handleTrackSubmitSuccess = (trackId: string, updatedSub: SubmissionItem) => {
    setLocalOverrides((prev) => ({
      ...prev,
      [trackId]: updatedSub,
    }));
  };

  const teamStatus = String((team as { status?: string; Status?: string } | undefined)?.status
    || (team as { Status?: string } | undefined)?.Status || "");
  const canSubmit = teamStatus === "Registered" || teamStatus === "Approved";

  if (!isLoading && (!team || !canSubmit)) {
    return (
      <PageShell className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center">
        <ApiMissingDataBadge
          title="Bạn chưa có đội thi để nộp bài"
          message="Vui lòng tạo hoặc tham gia một đội thi chính thức trước khi thực hiện nộp bài."
        />
        <Card className="mt-4 max-w-md w-full p-6 text-center">
          <p className="text-sm text-[var(--text-primary)]">
            {!team ? "Bạn chưa có đội thi." : "Trạng thái đội thi hiện tại: "}
            {team && (
              <span className="font-semibold text-[var(--color-warning)]">
                {(team as any)?.status || (team as any)?.Status}
              </span>
            )}
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Đội cần được BTC phê duyệt ghi danh trước khi thực hiện nộp bài.
          </p>
          <Link href="/my-team" className="mt-4 inline-block">
            <Button variant="ghost" accent="team">
              Về trang đội thi
            </Button>
          </Link>
        </Card>
      </PageShell>
    );
  }

  const teamName =
    (team as any)?.teamName || (team as any)?.TeamName || (team as any)?.name || (team as any)?.Name || "Đội thi";
  const eventName = (team as any)?.eventName || (team as any)?.EventName || "Sự kiện";

  return (
    <PageShell>
      <nav className="mb-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link href="/my-team" className="hover:text-[var(--accent-team)]">
          Đội thi
        </Link>
        <span>/</span>
        <Link href="/my-submissions" className="hover:text-[var(--accent-team)]">
          Danh sách bài nộp
        </Link>
        <span>/</span>
        <span className="text-[var(--text-primary)]">Nộp bài</span>
      </nav>

      <PageHeader
        title="Nộp bài thi"
        description={`Đội: ${teamName} · Sự kiện: ${eventName}`}
        actions={
          <Link href="/my-submissions">
            <Button variant="ghost">Xem quản lý bài nộp</Button>
          </Link>
        }
      />

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Hạng mục cần nộp ({availableTracks.length})
          </h2>
          <span className="text-xs text-[var(--text-muted)]">Cuộn xuống để nộp bài từng hạng mục</span>
        </div>

        {availableTracks.length === 0 ? (
          <ApiMissingDataBadge
            title="Chưa có hạng mục nộp bài"
            message="Chưa có hạng mục thi đấu nào được khởi tạo hoặc mở cổng nộp bài."
          />
        ) : (
          availableTracks.map((track) => (
            <TrackSubmissionCard
              key={track.id}
              track={track}
              existingSubmission={submissions[track.id]}
              onSubmitSuccess={handleTrackSubmitSuccess}
              teamId={teamId}
              roundId={roundId || track.roundId}
            />
          ))
        )}
      </div>
    </PageShell>
  );
}
