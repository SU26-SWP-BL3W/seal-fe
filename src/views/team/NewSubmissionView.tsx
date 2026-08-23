"use client";

import React, { useState, useMemo } from "react";
import { Link } from "@/i18n/routing";
import {
  useCreateSubmission,
  useUpdateSubmission,
  readApiError,
  type SubmitResultRequest,
} from "@/repositories/submitResultsRepository";
import { ApiMissingDataBadge } from "@/components/ui";
import { pushSystemNotification } from "@/repositories/shared/notificationsRepository";
import type { TrackItem, DeliverableItem, SubmissionItem, DeliverableType } from "@/viewModels/team/teamTypes";
import { useNewSubmissionViewModel } from "@/viewModels/team/useNewSubmissionViewModel";
import { validateDeliverableByType } from "@/lib/linkValidators";

const DELIVERABLE_ICONS: Record<DeliverableType, { label: string; badgeColor: string }> = {
  github:       { label: "GITHUB REPO",     badgeColor: "text-[var(--text-primary)] border-[var(--border-muted)] bg-[var(--bg-input)]" },
  slides:       { label: "SLIDES / PPT",    badgeColor: "text-[#fb923c] border-[#fb923c]/30 bg-[#fb923c]/10" },
  demo_video:   { label: "DEMO VIDEO",      badgeColor: "text-[#f87171] border-[#f87171]/30 bg-[#f87171]/10" },
  deployed_url: { label: "LIVE DEMO URL",   badgeColor: "text-[var(--color-success)] border-[var(--color-success)]/30 bg-[var(--color-success)]/10" },
  report:       { label: "BÁO CÁO PDF",     badgeColor: "text-[#facc15] border-[#facc15]/30 bg-[#facc15]/10" },
  figma:        { label: "FIGMA DESIGN",    badgeColor: "text-[#c084fc] border-[#c084fc]/30 bg-[#c084fc]/10" },
  other:        { label: "LINK BỔ SUNG",    badgeColor: "text-[var(--text-muted)] border-[var(--border-muted)] bg-[var(--bg-input)]" },
};

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
  const deliverables: DeliverableItem[] = [
    { id: "github", type: "github", label: "GitHub / GitLab repo", placeholder: "https://github.com/org/repo", required: true, trackId: track.id },
    { id: "deployed_url", type: "deployed_url", label: "Live demo", placeholder: "https://demo.example.com", required: true, trackId: track.id },
    { id: "slides", type: "slides", label: "Slides", placeholder: "https://docs.google.com/presentation/...", required: true, trackId: track.id },
  ];
  const createSubmission = useCreateSubmission();
  const updateSubmission = useUpdateSubmission();

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

  const { filledCount, requiredFilled, requiredTotal } = useMemo(() => {
    let filled = 0;
    let reqFilled = 0;
    let reqTotal = 0;
    for (const d of deliverables) {
      const val = (linkValues[d.type] || linkValues[d.id] || "").trim();
      const valid = val.length > 0 && validateDeliverableByType(d.type, val, false).isValid;
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
    if (!allRequiredDone) return;

    for (const d of deliverables) {
      const val = (linkValues[d.type] || linkValues[d.id] || "").trim();
      const check = validateDeliverableByType(d.type, val, d.required);
      if (!check.isValid) {
        setFormError(check.errorMessage || "Link không hợp lệ.");
        return;
      }
    }

    setIsSubmitting(true);
    const primaryDeliverable = deliverables.find((d) => d.required);
    const primaryUrl = primaryDeliverable
      ? (linkValues[primaryDeliverable.type] || linkValues[primaryDeliverable.id] || "").trim()
      : Object.values(linkValues).find((v) => v.trim().length > 0) || "";

    const allLinks = deliverables.map((d) => ({
      type: d.type,
      label: d.label,
      url: (linkValues[d.type] || linkValues[d.id] || "").trim(),
      required: d.required,
    }));

    const payload = {
      TeamId: teamId,
      TrackId: track.id,
      RoundId: roundId,
      RepoUrl: (linkValues.github || "").trim(),
      DemoUrl: (linkValues.deployed_url || "").trim(),
      SlideUrl: (linkValues.slides || "").trim(),
      SubmissionUrl: (linkValues.github || primaryUrl).trim(),
      Description: JSON.stringify({ links: allLinks, notes }),
    };

    try {
      const created = existingSubmission?.id
        ? await updateSubmission.mutateAsync({ id: existingSubmission.id, data: payload as Partial<SubmitResultRequest> })
        : await createSubmission.mutateAsync(payload as SubmitResultRequest);
      const updatedItem: SubmissionItem = {
        id: (created as { id?: string })?.id || existingSubmission?.id || `sub-${Date.now()}`,
        teamId,
        roundId,
        roundName: "Vòng hiện tại",
        trackId: track.id,
        trackName: track.trackName,
        submissionUrl: primaryUrl,
        description: JSON.stringify({ links: allLinks, notes }),
        teamName: "",
        createdTime: new Date().toISOString(),
        isActive: true,
        isEliminated: false,
      };
      setIsSaved(true);
      setFormError("");
      pushSystemNotification({
        title: "Nộp bài thi thành công",
        message: `Đội thi đã nộp bài thành công cho Hạng mục "${track.trackName}". Hệ thống đã gửi bài đến Ban Giám Khảo & Cố vấn!`,
        type: "success",
      });
      pushSystemNotification({
        title: "Bài nộp mới cần chấm điểm",
        message: `Có bài nộp mới từ Đội thi cho Hạng mục "${track.trackName}". Hãy kiểm tra bàn chấm điểm!`,
        type: "info",
      });
      onSubmitSuccess(track.id, updatedItem);
    } catch (err) {
      setFormError(readApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id={`track-card-${track.id}`}
      className={`bg-[var(--bg-panel)] border hud-clipped transition-all duration-200 overflow-hidden ${
        isSaved
          ? "border-[var(--color-success)]/40 shadow-[0_0_20px_rgba(52,211,153,0.06)]"
          : allRequiredDone
          ? "border-[var(--accent-team)]/50 shadow-[0_0_20px_rgba(103,200,240,0.06)]"
          : "border-[var(--border-muted)]"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-[var(--border-muted)] bg-[var(--bg-base)]/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[var(--accent-team)] uppercase tracking-widest font-bold">
              HẠNG MỤC THI THẤU
            </span>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">·</span>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">#{track.id}</span>
          </div>
          <h2 className="font-display text-xl font-bold text-[var(--text-primary)] mt-0.5">
            {track.trackName}
          </h2>
          <p className="font-mono text-xs text-[var(--text-muted)] mt-1 max-w-xl">
            {track.description}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {isSaved ? (
            <div className="flex items-center gap-2 px-3 py-1.5 border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 font-mono text-xs font-bold text-[var(--color-success)] uppercase tracking-wider hud-clipped">
              <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
              ĐÃ NỘP BÀI
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 font-mono text-xs font-bold text-[var(--color-warning)] uppercase tracking-wider hud-clipped">
              <span className="w-2 h-2 rounded-full bg-[var(--color-warning)] animate-ping" />
              CHƯA NỘP
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleCardSubmit} className="p-6 flex flex-col gap-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              DANH SÁCH TÀI LIỆU CẦN NỘP ({filledCount}/{deliverables.length})
            </span>
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              Bắt buộc: <strong className={requiredFilled === requiredTotal ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"}>{requiredFilled}/{requiredTotal}</strong>
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {deliverables.map((dlv: any) => {
              const meta = (DELIVERABLE_ICONS as any)[dlv.type] || DELIVERABLE_ICONS.other;
              const val = linkValues[dlv.type] || linkValues[dlv.id] || "";
              const isFilled = val.trim().length > 0;
              const isValidUrl = isFilled && validateDeliverableByType(dlv.type, val, false).isValid;

              return (
                <div
                  key={dlv.id}
                  className={`p-4 border transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isValidUrl
                      ? "border-[var(--color-success)]/40 bg-[var(--color-success)]/[0.02]"
                      : isFilled
                      ? "border-[var(--color-danger)]/40 bg-[var(--color-danger)]/[0.02]"
                      : "border-[var(--border-muted)] bg-[var(--bg-base)]/40 hover:border-[var(--border-muted)]/80"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <span className={`px-2 py-1 font-mono text-[10px] font-bold border ${meta.badgeColor}`}>
                      {meta.label}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                        {dlv.label}
                      </span>
                      {dlv.required ? (
                        <span className="font-mono text-[9px] text-[var(--color-danger)] uppercase font-semibold">
                          * Bắt buộc
                        </span>
                      ) : (
                        <span className="font-mono text-[9px] text-[var(--text-muted)] uppercase">
                          Tuỳ chọn
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <input
                      type="url"
                      placeholder={dlv.placeholder || "https://..."}
                      value={val}
                      onChange={(e) => handleLinkChange(dlv.type, e.target.value)}
                      className={`w-full px-3 py-2 bg-[var(--bg-input)] border font-mono text-xs focus:outline-none transition-colors ${
                        isValidUrl
                          ? "border-[var(--color-success)]/40 focus:border-[var(--color-success)] text-[var(--text-primary)]"
                          : isFilled
                          ? "border-[var(--color-danger)]/50 text-[var(--color-danger)]"
                          : "border-[var(--border-muted)] focus:border-[var(--accent-team)] text-[var(--text-primary)]"
                      }`}
                    />
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {isValidUrl ? (
                      <span className="font-mono text-[10px] font-bold text-[var(--color-success)] flex items-center gap-1 border border-[var(--color-success)]/30 px-2 py-1 bg-[var(--color-success)]/10">
                        ĐÃ ĐIỀN
                      </span>
                    ) : dlv.required ? (
                      <span className="font-mono text-[10px] font-bold text-[var(--color-danger)] flex items-center gap-1 border border-[var(--color-danger)]/30 px-2 py-1 bg-[var(--color-danger)]/10">
                        CHƯA ĐIỀN
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] text-[var(--text-muted)] border border-[var(--border-muted)] px-2 py-1">
                        TUỲ Ý
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-1">
          <label className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
            GHI CHÚ THÊM BÀI NỘP HẠNG MỤC NÀY
          </label>
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setIsSaved(false);
            }}
            rows={2}
            placeholder="Ghi chú chi tiết về giải pháp, tài khoản demo, v.v..."
            className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] focus:border-[var(--accent-team)] font-mono text-xs text-[var(--text-primary)] focus:outline-none transition-colors resize-none placeholder:text-[var(--text-muted)]/40"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[var(--border-muted)]/60">
          <div className="font-mono text-xs text-[var(--text-muted)] flex items-center gap-3">
            {formError ? (
              <span role="alert" className="text-[color:var(--color-danger)]">{formError}</span>
            ) : isSaved ? (
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-success)] font-semibold flex items-center gap-1">
                  Đã lưu bài nộp cho hạng mục {track.trackName}
                </span>
                <Link
                  href="/my-submissions"
                  className="text-[var(--accent-team)] hover:underline font-bold text-[11px] ml-2 flex items-center gap-0.5"
                >
                  [ Xem danh sách bài nộp → ]
                </Link>
              </div>
            ) : (
              <span>Vui lòng kiểm tra kỹ các đường link trước khi xác nhận.</span>
            )}
          </div>

          <button
            type="submit"
            disabled={!allRequiredDone || isSubmitting}
            className={`hud-clipped px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-all focus:outline-none cursor-pointer ${
              isSaved
                ? "bg-transparent border border-[var(--accent-team)] text-[var(--accent-team)] hover:bg-[var(--accent-team)]/10"
                : allRequiredDone
                ? "bg-[var(--accent-team)] text-[var(--bg-base)] hover:bg-white hover:shadow-[0_0_15px_rgba(103,200,240,0.4)]"
                : "bg-[var(--bg-input)] text-[var(--text-muted)] border border-[var(--border-muted)] opacity-50 cursor-not-allowed"
            }`}
          >
            {isSubmitting
              ? "ĐANG XỬ LÝ..."
              : isSaved
              ? "CẬP NHẬT BÀI NỘP"
              : "XÁC NHẬN NỘP BÀI"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function NewSubmissionView() {
  const { state, data, actions } = useNewSubmissionViewModel();
  const { team, teamId, roundId, canSubmit, submitBlockReason, isLoading } = state;
  const { availableTracks, submissions } = data;

  if (!isLoading && (!team || !canSubmit)) {
    const windowClosed = submitBlockReason === "window-closed";
    return (
      <div className="hud-lattice min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 space-y-4">
        <div className="max-w-md w-full bg-[var(--bg-panel)] border border-[var(--color-warning)]/40 hud-clipped p-8 text-center">
          <div className="font-mono text-[10px] text-[var(--color-warning)] tracking-widest uppercase mb-3">
            {windowClosed ? "CỔNG NỘP BÀI ĐÃ ĐÓNG" : "CHƯA ĐỦ ĐIỀU KIỆN NỘP BÀI"}
          </div>
          <p className="font-mono text-sm text-[var(--text-primary)] mb-4 leading-relaxed">
            {!team ? "Bạn chưa có đội thi." : windowClosed ? "Hạng mục hoặc vòng thi không còn trong thời gian nộp bài." : `Trạng thái đội thi hiện tại: `}
            {team && !windowClosed && <span className="font-bold text-[var(--color-warning)]">{(team as any)?.status || (team as any)?.Status}</span>}
            <br />
            <span className="text-xs text-[var(--text-muted)] mt-1 block">
              {windowClosed
                ? "Không thể nộp hoặc sửa bài ngoài cửa sổ hạng mục. Liên hệ điều phối viên nếu cần gia hạn."
                : "Đội cần được BTC phê duyệt ghi danh trước khi thực hiện nộp bài."}
            </span>
          </p>
          <Link href="/my-team">
            <button className="hud-clipped px-5 py-2.5 border border-[var(--accent-team)] text-[var(--accent-team)] font-mono text-xs tracking-wider uppercase hover:bg-[var(--accent-team)]/10 transition-colors">
              ← VỀ TRANG ĐỘI THI
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="hud-lattice min-h-[calc(100vh-4rem)] pb-16">
      <div className="max-w-[var(--container-max)] mx-auto px-6 py-8">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--text-muted)] mb-6">
          <Link href="/my-team" className="hover:text-[var(--accent-team)] transition-colors">
            ĐỘI THI
          </Link>
          <span>›</span>
          <Link href="/my-submissions" className="hover:text-[var(--accent-team)] transition-colors">
            DANH SÁCH BÀI NỘP
          </Link>
          <span>›</span>
          <span className="text-[var(--accent-team)] font-bold">NỘP BÀI THEO HẠNG MỤC</span>
        </div>

        {/* Page Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 mb-8 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped shadow-sm">
          <div>
            <span className="font-mono text-[10px] text-[var(--accent-team)] tracking-[0.25em] uppercase font-bold">
              CỔNG NỘP BÀI THI CHÍNH THỨC
            </span>
            <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-[var(--text-primary)] mt-1">
              Nộp Bài Thi Hackathon
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 font-mono text-xs text-[var(--text-muted)]">
              <span>Đội: <strong className="text-[var(--accent-team)]">{(team as any)?.teamName || (team as any)?.TeamName || (team as any)?.name || (team as any)?.Name || "Đội Thi"}</strong></span>
              <span>·</span>
              <span>Sự kiện:</span>
              <Link
                href={`/events/${(team as any)?.eventId || (team as any)?.EventId || ""}`}
                className="text-[var(--accent-primary)] hover:underline flex items-center gap-1 border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded-none font-bold"
              >
                <span>{(team as any)?.eventName || (team as any)?.EventName || "Sự kiện"}</span>
                <span className="text-[10px]">↗ XEM CHI TIẾT SỰ KIỆN</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href={`/events/${(team as any)?.eventId || (team as any)?.EventId || ""}/leaderboard`}>
              <button className="hud-clipped px-4 py-2.5 border border-[var(--accent-judge)]/40 bg-[var(--accent-judge)]/10 text-[var(--accent-judge)] font-mono text-xs font-bold tracking-wider uppercase hover:bg-[var(--accent-judge)]/20 transition-colors">
                BẢNG XẾP HẠNG
              </button>
            </Link>
            <Link href="/my-team">
              <button className="hud-clipped px-4 py-2.5 border border-[var(--accent-team)]/40 bg-[var(--accent-team)]/10 text-[var(--accent-team)] font-mono text-xs font-bold tracking-wider uppercase hover:bg-[var(--accent-team)]/20 transition-colors">
                ĐỘI THI
              </button>
            </Link>
            <Link href="/my-submissions">
              <button className="hud-clipped px-5 py-2.5 border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs font-bold tracking-wider uppercase hover:border-[var(--accent-team)] hover:text-[var(--accent-team)] transition-colors">
                QUẢN LÝ BÀI NỘP
              </button>
            </Link>
          </div>
        </div>

        {/* Scrollable Track Submissions Section List */}
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest text-[var(--text-primary)] flex items-center gap-2">
              <span>HẠNG MỤC CẦN NỘP BÀI</span>
              <span className="text-xs text-[var(--text-muted)] font-normal">({availableTracks.length} hạng mục)</span>
            </h2>
            <span className="font-mono text-xs text-[var(--text-muted)]">
              Cuộn xuống để xem và nộp bài cho từng hạng mục
            </span>
          </div>

          {availableTracks.length === 0 ? (
            <ApiMissingDataBadge
              title="CHƯA MỞ CỔNG NỘP BÀI"
              message="Chưa có Hạng mục thi đấu nào được mở cổng nộp bài cho sự kiện này."
            />
          ) : (
            availableTracks.map((track) => (
              <TrackSubmissionCard
                key={track.id}
                track={track}
                existingSubmission={submissions[track.id]}
                onSubmitSuccess={actions.handleTrackSubmitSuccess}
                teamId={teamId}
                roundId={roundId || track.roundId}
              />
            ))
          )}
        </div>

      </div>
    </div>
  );
}
