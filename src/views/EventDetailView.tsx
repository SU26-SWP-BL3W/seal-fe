"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { useEventDetailViewModel, type RoundSummary } from "@/viewModels/useEventDetailViewModel";
import type { PrizeItem } from "@/viewModels/eventsMetadata";
import { useCountdown } from "@/lib/useCountdown";
import { useGetEventRolesByUser } from "@/repositories/events/eventRolesRepository";
import { useMyTeam } from "@/repositories/teamsRepository";
import { ComprehensiveEventEditModal } from "@/components/domain/ComprehensiveEventEditModal";
import { AvailableTeamsList } from "@/components/domain/team";
import { PageShell } from "@/components/layout/PageShell";
import { Badge, Button, Card, EmptyState, HexagonLoader, StatCard } from "@/components/ui";
import { AlertTriangle, ChevronRight } from "lucide-react";

function formatVnd(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)} ₫`;
}

function formatShortDate(iso?: string): string {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(iso?: string): string {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })} ${d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

const normalizeId = (id?: string | null) => (id || "").replace(/-/g, "").toLowerCase();

const DETAIL_TABS = [
  { id: "timeline" as const, label: "Lịch trình" },
  { id: "tracks" as const, label: "Hạng mục" },
  { id: "prizes" as const, label: "Giải thưởng" },
  { id: "rules" as const, label: "Thể lệ" },
  { id: "teams" as const, label: "Đội thi" },
];

export function EventDetailView({ eventId: propEventId }: { eventId?: string }) {
  const params = useParams();
  const eventId = propEventId || (params?.id as string) || "evt-01";

  const { user, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState<"timeline" | "tracks" | "prizes" | "rules" | "teams">("timeline");

  const {
    event,
    eventName,
    season,
    year,
    tagline,
    description,
    tracks,
    trackItems,
    rounds,
    teamCount,
    maxTeams,
    prizes,
    totalPrizeVnd,
    deadline,
    deadlineRoundName,
    isLoading,
    notFound,
    refetch,
  } = useEventDetailViewModel(eventId);

  const currentUserId = user?.id || user?.userId || user?.UserID || (user as any)?.Id;
  const { data: userRolesResult } = useGetEventRolesByUser(currentUserId, { pageSize: 100 });
  const userRoles = useMemo(() => {
    const raw = (userRolesResult as any)?.data?.items ?? (userRolesResult as any)?.items ?? (Array.isArray(userRolesResult) ? userRolesResult : []);
    return Array.isArray(raw) ? raw : [];
  }, [userRolesResult]);

  const { data: myTeamResult } = useMyTeam();
  const myTeam = (myTeamResult as any)?.team ?? myTeamResult;

  const targetEventId = normalizeId(eventId);

  // Lọc tất cả các vai trò của người dùng trong chính eventId này (Khớp chính xác qua ID chuẩn hóa)
  const myEventRoles = useMemo(() => {
    return userRoles.filter(
      (r: any) => normalizeId(r.eventId || r.EventId) === targetEventId
    );
  }, [userRoles, targetEventId]);

  const judgeRoles = useMemo(() => {
    return myEventRoles.filter((r: any) => (r.roleName || r.RoleName) === "Judge");
  }, [myEventRoles]);

  const mentorRoles = useMemo(() => {
    return myEventRoles.filter((r: any) => (r.roleName || r.RoleName) === "Mentor");
  }, [myEventRoles]);

  const hasJudgeRole = judgeRoles.length > 0;
  const hasMentorRole = mentorRoles.length > 0;

  // Kiểm tra sự kiện đã đóng / kết thúc chưa
  const isEventEnded = Boolean(
    event && (event.status === false || (event.endDate && new Date(event.endDate).getTime() < Date.now()))
  );

  // XÁC ĐỊNH CHÍNH XÁC VAI TRÒ CỦA NGƯỜI DÙNG ĐỐI VỚI SỰ KIỆN NÀY (EVENT-SCOPED ROLE)
  const roleName = useMemo(() => {
    if (!user) return "Guest";
    if (user.isAdmin || user.IsAdmin) return "Admin";

    if (myEventRoles.length > 0) {
      const roleNames = myEventRoles.map((r: any) => r.roleName || r.RoleName);
      if (roleNames.some((rn: string) => rn === "EventCoordinator" || rn === "Coordinator")) return "Coordinator";
      if (roleNames.includes("Judge") && roleNames.includes("Mentor")) return "JudgeAndMentor";
      if (roleNames.some((rn: string) => rn === "Judge")) return "Judge";
      if (roleNames.some((rn: string) => rn === "Mentor")) return "Mentor";
      if (roleNames.some((rn: string) => rn === "TeamLeader")) return "TeamLeader";
      if (roleNames.some((rn: string) => rn === "TeamMember")) return "TeamMember";
      return roleNames[0] || "Guest";
    }

    const assignedIds = (activeRole?.assignedEventIds || activeRole?.AssignedEventIds || []).map((id: string) => normalizeId(id));
    if (activeRole && (normalizeId(activeRole.eventId) === targetEventId || normalizeId(activeRole.EventId) === targetEventId || assignedIds.includes(targetEventId))) {
      const rn = activeRole.roleName || activeRole.RoleName;
      if (rn === "EventCoordinator") return "Coordinator";
      if (rn === "Judge") return "Judge";
      if (rn === "Mentor") return "Mentor";
      if (rn === "TeamLeader") return "TeamLeader";
      if (rn === "TeamMember") return "TeamMember";
      return rn || "Guest";
    }

    if (myTeam && (normalizeId(myTeam.eventId) === targetEventId || normalizeId(myTeam.EventId) === targetEventId)) {
      return myTeam.isLeader ? "TeamLeader" : "TeamMember";
    }

    return "Guest";
  }, [user, myEventRoles, activeRole, targetEventId, myTeam]);

  const countdown = useCountdown(deadline);

  const [isComprehensiveEditOpen, setIsComprehensiveEditOpen] = useState(false);

  if (isLoading) {
    return (
      <PageShell className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center">
        <HexagonLoader />
        <p className="mt-4 text-sm text-[var(--text-muted)]">Đang tải thông tin sự kiện...</p>
      </PageShell>
    );
  }

  if (notFound || !event) {
    return (
      <PageShell className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <EmptyState
          title="Không tìm thấy sự kiện"
          description="Sự kiện không tồn tại hoặc bạn không có quyền truy cập."
          action={
            <Link href="/events">
              <Button variant="secondary">Quay lại danh sách sự kiện</Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  return (
    <>
      <PageShell className="min-h-[calc(100vh-4rem)] space-y-6">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-muted)] pb-4">
          <div className="flex min-w-0 items-center gap-2 text-sm text-[var(--text-muted)]">
            <Link href="/events" className="shrink-0 transition-colors hover:text-[var(--accent-primary)]">
              Khám phá sự kiện
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate font-medium text-[var(--text-primary)]">
              {eventName || "Chi tiết sự kiện"}
            </span>
          </div>
          {(season || year) && (
            <Badge tone="info">
              {season}{year ? ` · ${year}` : ""}
            </Badge>
          )}
        </nav>

        {/* Unverified student alert — roleName never equals "Student" (Guest / Team*) */}
        {Boolean(user) &&
          !(user?.isApproved ?? (user as { IsApproved?: boolean })?.IsApproved) &&
          !hasJudgeRole &&
          !hasMentorRole &&
          roleName !== "Coordinator" &&
          roleName !== "Admin" && (
          <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-warning)]" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Hồ sơ sinh viên chưa được duyệt
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Bạn có thể xem thể lệ, lịch trình và giải thưởng. Để đăng ký đội hoặc nộp bài, hãy hoàn thiện hồ sơ sinh viên.
                </p>
              </div>
            </div>
            <Link href="/onboarding/profile" className="shrink-0">
              <Button variant="secondary" accent="primary" className="border-[var(--color-warning)]/40">
                Cập nhật hồ sơ
              </Button>
            </Link>
          </div>
        )}

        {/* Hero */}
        <Card className="space-y-6 p-6 md:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {isEventEnded ? (
                  <Badge tone="neutral">Đã kết thúc</Badge>
                ) : (
                  <Badge tone="success">Đang mở</Badge>
                )}
                <span className="text-xs text-[var(--text-muted)]">
                  {teamCount}/{maxTeams} đội đã đăng ký
                </span>
              </div>

              <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl md:text-4xl">
                {eventName}
              </h1>

              {tagline && tagline.trim() !== description?.trim() && (
                <p className="text-sm text-[var(--accent-primary)]">{tagline}</p>
              )}
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                {description || "Đấu trường công nghệ quy mô lớn dành cho sinh viên toàn quốc do Ban quản trị SEAL phê duyệt."}
              </p>
            </div>

            {deadline && (
              <div className="shrink-0 space-y-2 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-4 lg:w-72">
                <p className="text-xs font-medium text-[var(--accent-primary)]">
                  {deadlineRoundName || "Hạn chót giai đoạn"}
                </p>
                <p className="font-display text-xl font-semibold tabular-nums text-[var(--text-primary)]">
                  {countdown.isPast || isEventEnded
                    ? "Đã kết thúc"
                    : `${countdown.days} ngày ${countdown.hours} giờ ${countdown.minutes} phút`}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Hạn chót: {formatShortDate(deadline)}
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 border-t border-[var(--border-muted)] pt-6 sm:grid-cols-4">
            <StatCard
              label="Tổng giải thưởng"
              value={totalPrizeVnd > 0 ? formatVnd(totalPrizeVnd) : prizes.length > 0 ? `${prizes.length} hạng mục` : "Đang cập nhật"}
              accent="var(--color-success)"
            />
            <StatCard
              label="Hạng mục dự thi"
              value={tracks.length === 1 ? "1 bảng đấu" : `${tracks.length} chuyên môn`}
              accent="var(--accent-primary)"
            />
            <StatCard
              label="Đội ghi danh"
              value={`${teamCount} / ${maxTeams}`}
              accent="var(--accent-team)"
            />
            <StatCard
              label="Tổng số vòng thi"
              value={`${rounds.length} giai đoạn`}
              accent="var(--accent-coordinator)"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-muted)] pt-4">
            <p className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span className={`h-2 w-2 rounded-full ${isEventEnded ? "bg-zinc-500" : "bg-emerald-400"}`} />
              {isEventEnded ? "Sự kiện đã đóng" : "Sự kiện chính thức trên hệ thống SEAL"}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {user?.isAdmin && (
                <>
                  <Link href="/admin/dashboard">
                    <Button variant="secondary" accent="primary" className="border-[var(--color-danger)]/40 text-[var(--color-danger)]">
                      Bảng điều hành
                    </Button>
                  </Link>
                  <Button type="button" variant="secondary" onClick={() => setIsComprehensiveEditOpen(true)}>
                    Chỉnh sửa sự kiện
                  </Button>
                </>
              )}

              {roleName === "Coordinator" && (
                <>
                  <Link href="/coordinator/dashboard">
                    <Button variant="secondary" accent="coordinator">Quản trị BTC</Button>
                  </Link>
                  <Button type="button" variant="secondary" accent="coordinator" onClick={() => setIsComprehensiveEditOpen(true)}>
                    Chỉnh sửa sự kiện
                  </Button>
                </>
              )}

              {(roleName === "TeamLeader" || roleName === "TeamMember") && (
                <Link href={`/my-team?eventId=${eventId}`}>
                  <Button accent="team">Quản lý đội / nộp bài</Button>
                </Link>
              )}

              {!hasJudgeRole && !hasMentorRole && roleName === "Guest" && user && !isEventEnded && (
                <Link href={`/my-team?eventId=${eventId}`}>
                  <Button accent="team">Đăng ký đội thi</Button>
                </Link>
              )}

              {!user && !isEventEnded && (
                <>
                  <Link href="/register">
                    <Button>Đăng ký tài khoản</Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="secondary">Đăng nhập</Button>
                  </Link>
                </>
              )}

              <Link href={`/events/${eventId}/leaderboard`}>
                <Button variant="secondary">Bảng xếp hạng</Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Mission workspace dock */}
        {(hasJudgeRole || hasMentorRole) && (
          <div className="space-y-4 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-5 md:p-6">
            <div className="flex flex-col gap-2 border-b border-[var(--border-muted)] pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${isEventEnded ? "bg-[var(--text-muted)]" : "bg-[var(--accent-primary)] animate-pulse"}`} />
                <h2 className="font-display text-sm font-semibold text-[var(--text-primary)]">
                  {isEventEnded ? "Nhiệm vụ chuyên môn đã hoàn tất" : "Bàn làm việc chuyên môn"}
                </h2>
                <Badge tone="info">
                  {judgeRoles.length + mentorRoles.length} nhiệm vụ
                </Badge>
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {isEventEnded ? "Sự kiện đã đóng — dữ liệu đã niêm phong" : "Tác vụ trực tiếp theo từng hạng mục được phân công"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {judgeRoles.map((r: any, idx: number) => {
                const matchedTrack = trackItems.find(t => normalizeId(t.id) === normalizeId(r.trackId || r.TrackId));
                const trackName = matchedTrack?.trackName || r.trackName || r.TrackName || "Hạng mục";
                const trackId = matchedTrack?.id || r.trackId || r.TrackId;

                return (
                  <div
                    key={`dock-j-${idx}`}
                    className="flex flex-col justify-between space-y-3 rounded-lg border border-[var(--accent-judge)]/40 bg-[var(--bg-input)]/40 p-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Badge tone="judge">
                          {isEventEnded ? "Giám khảo — đã hoàn tất" : "Giám khảo"}
                        </Badge>
                        <span className={`text-xs ${isEventEnded ? "text-[var(--text-muted)]" : "text-[var(--color-success)]"}`}>
                          {isEventEnded ? "Đã khép lại" : "Đang mở cổng"}
                        </span>
                      </div>
                      <h3 className="pt-1 font-display text-base font-semibold text-[var(--text-primary)] sm:text-lg">
                        {trackName}
                      </h3>
                      <p className="line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">
                        {matchedTrack?.description || "Phụ trách đánh giá chuyên môn và chấm điểm các bài thi thuộc Hạng mục theo khung Rubric."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-[var(--accent-judge)]/20 pt-2">
                      <span className="text-xs text-[var(--text-muted)]">
                        {isEventEnded ? "Trạng thái: Đã niêm phong" : "Nhiệm vụ: Chấm điểm bài thi"}
                      </span>
                      <Link href={`/judge/scoring?trackId=${trackId}`}>
                        <Button
                          accent="judge"
                          variant={isEventEnded ? "secondary" : "primary"}
                          className="text-xs"
                        >
                          {isEventEnded ? "Xem lại bài đã chấm" : "Vào chấm điểm track này"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}

              {mentorRoles.map((r: any, idx: number) => {
                const matchedTrack = trackItems.find(t => normalizeId(t.id) === normalizeId(r.trackId || r.TrackId));
                const trackName = matchedTrack?.trackName || r.trackName || r.TrackName || "Hạng mục";
                const trackId = matchedTrack?.id || r.trackId || r.TrackId;

                return (
                  <div
                    key={`dock-m-${idx}`}
                    className="flex flex-col justify-between space-y-3 rounded-lg border border-[var(--accent-mentor)]/40 bg-[var(--bg-input)]/40 p-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Badge tone="mentor">
                          {isEventEnded ? "Cố vấn — đã hoàn tất" : "Cố vấn"}
                        </Badge>
                        <span className={`text-xs ${isEventEnded ? "text-[var(--text-muted)]" : "text-[var(--accent-mentor)]"}`}>
                          {isEventEnded ? "Đã khép lại" : "Đồng hành đội thi"}
                        </span>
                      </div>
                      <h3 className="pt-1 font-display text-base font-semibold text-[var(--text-primary)] sm:text-lg">
                        {trackName}
                      </h3>
                      <p className="line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">
                        {matchedTrack?.description || "Hỗ trợ định hướng kỹ thuật, giải đáp thắc mắc và cố vấn chuyên môn cho các đội thi trong Hạng mục."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-[var(--accent-mentor)]/20 pt-2">
                      <span className="text-xs text-[var(--text-muted)]">
                        {isEventEnded ? "Trạng thái: Đã khép lại" : "Nhiệm vụ: Hỗ trợ & cố vấn"}
                      </span>
                      <Link href={`/mentor/teams?eventId=${targetEventId}&trackId=${trackId}`}>
                        <Button
                          accent="mentor"
                          variant={isEventEnded ? "secondary" : "primary"}
                          className="text-xs"
                        >
                          {isEventEnded ? "Xem danh sách đội thi" : "Vào không gian hỗ trợ"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div
          role="tablist"
          aria-label="Chi tiết sự kiện"
          className="flex flex-wrap gap-1 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-1"
        >
          {DETAIL_TABS.map((tab) => {
            const count =
              tab.id === "timeline" ? rounds.length
              : tab.id === "tracks" ? tracks.length
              : tab.id === "teams" ? teamCount
              : null;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`event-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`event-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-md px-3 py-2.5 text-center text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)] ${
                  isActive
                    ? "bg-[var(--accent-primary)]/15 font-medium text-[var(--accent-primary)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab.label}
                {count != null && (
                  <span className={`ml-1 text-xs ${isActive ? "opacity-80" : "opacity-60"}`}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab: Timeline */}
        {activeTab === "timeline" && (
          <div
            role="tabpanel"
            id="event-panel-timeline"
            aria-labelledby="event-tab-timeline"
            className="space-y-8 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-6 md:p-8"
          >
            <div className="flex flex-col justify-between gap-4 border-b border-[var(--border-muted)] pb-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-medium text-[var(--accent-primary)]">
                  Timeline tiến trình vòng thi
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
                  Lộ trình toàn bộ cuộc thi
                </h2>
              </div>
              <Badge tone="info">
                Tổng số: {rounds.length} giai đoạn
              </Badge>
            </div>

            <div className="space-y-6">
              {rounds.map((round: RoundSummary, index: number) => {
                const isCurrent = round.status === "current";
                const isPast = round.status === "past";
                const isRegistration = index === 0;

                return (
                  <div
                    key={round.id || index}
                    className={`space-y-4 rounded-lg border p-5 transition-all sm:p-6 ${
                      isCurrent
                        ? "border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/5"
                        : isPast
                        ? "border-[var(--border-muted)] bg-[var(--bg-input)]/40 opacity-80"
                        : "border-[var(--border-muted)] bg-[var(--bg-input)]/40 hover:border-[var(--border-muted)]"
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-3 border-b border-[var(--border-muted)] pb-3 sm:flex-row sm:items-center">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="info">
                            {isRegistration ? "Giai đoạn tuyển sinh" : `Vòng thi số ${index}`}
                          </Badge>
                          <span className="text-xs text-[var(--text-muted)]">
                            Thời gian: <strong className="text-[var(--text-primary)]">{formatShortDate(round.startDate)} — {formatShortDate(round.endDate)}</strong>
                          </span>
                        </div>
                        <h3 className="font-display text-base font-semibold text-[var(--text-primary)] sm:text-lg">
                          {round.roundName}
                        </h3>
                      </div>

                      <div className="self-start sm:self-auto">
                        <Badge tone={isCurrent ? "info" : isPast ? "neutral" : "info"}>
                          {isCurrent ? "Đang diễn ra" : isPast ? "Đã kết thúc" : "Sắp mở"}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">
                      {round.description}
                    </p>

                    <div className="grid grid-cols-1 gap-2.5 pt-1 text-xs sm:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-0.5 rounded-md border border-[var(--border-muted)] bg-[var(--bg-input)] p-2.5">
                        <span className="block text-[10px] text-[var(--text-muted)]">
                          Mở cổng &amp; bắt đầu
                        </span>
                        <span className="block font-semibold text-[var(--text-primary)]">{formatDateTime(round.startDate)}</span>
                      </div>

                      <div className="space-y-0.5 rounded-md border border-[var(--border-muted)] bg-[var(--bg-input)] p-2.5">
                        <span className="block text-[10px] text-[var(--text-muted)]">
                          Hạn khóa nộp bài
                        </span>
                        <span className="block font-semibold text-[var(--accent-primary)]">
                          {formatDateTime(round.submissionDeadline || round.endDate)}
                        </span>
                      </div>

                      <div className="space-y-0.5 rounded-md border border-[var(--border-muted)] bg-[var(--bg-input)] p-2.5">
                        <span className="block text-[10px] text-[var(--text-muted)]">
                          Hội đồng đánh giá
                        </span>
                        <span className="block font-semibold text-[var(--accent-coordinator)]">
                          {formatDateTime(round.evaluationEndDate || round.endDate)}
                        </span>
                      </div>

                      <div className="space-y-0.5 rounded-md border border-[var(--border-muted)] bg-[var(--bg-input)] p-2.5">
                        <span className="block text-[10px] text-[var(--text-muted)]">
                          Công bố kết quả
                        </span>
                        <span className="block font-semibold text-[var(--color-success)]">
                          {formatDateTime(round.resultAnnouncementDate || round.endDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between gap-3 border-t border-[var(--border-muted)] pt-3 text-xs sm:flex-row sm:items-center">
                      <div className="text-[var(--text-muted)]">
                        {isRegistration ? "Yêu cầu hồ sơ: " : "Yêu cầu nộp: "}
                        <strong className="text-[var(--text-primary)]">
                          {isRegistration ? "Hồ sơ đăng ký đội thi (3-5 thành viên) & thẻ sinh viên hợp lệ." : (round.deliverables || "Mã nguồn, Slide thuyết trình & Video demo.")}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Tracks */}
        {activeTab === "tracks" && (
          <div
            role="tabpanel"
            id="event-panel-tracks"
            aria-labelledby="event-tab-tracks"
            className="space-y-6 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-6 md:p-8"
          >
            <div className="flex flex-col justify-between gap-3 border-b border-[var(--border-muted)] pb-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-medium text-[var(--accent-primary)]">
                  Chủ đề &amp; hạng mục thi đấu
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
                  Định hướng đề tài &amp; phân công chuyên môn
                </h2>
              </div>
              <Badge tone="info" className="self-start sm:self-auto">
                {tracks.length} hạng mục thi đấu
              </Badge>
            </div>

            <div className="space-y-5">
              {trackItems.map((track, idx) => {
                const tId = normalizeId(track.id);
                const trackRole = myEventRoles.find((r: any) => {
                  const rTrackId = normalizeId(r.trackId || r.TrackId);
                  if (rTrackId && tId && rTrackId === tId) return true;
                  const rTrackName = (r.trackName || r.TrackName || "").trim().toLowerCase();
                  const tTrackName = (track.trackName || "").trim().toLowerCase();
                  if (rTrackName && tTrackName && rTrackName === tTrackName) return true;
                  return false;
                });

                const roleInThisTrack = trackRole?.roleName || trackRole?.RoleName;
                const isJudgeThisTrack = roleInThisTrack === "Judge";
                const isMentorThisTrack = roleInThisTrack === "Mentor";

                return (
                  <div
                    key={track.id || idx}
                    className={`space-y-4 rounded-lg border p-6 transition-all ${
                      isJudgeThisTrack
                        ? "border-[var(--accent-judge)]/40 bg-[var(--bg-input)]/40"
                        : isMentorThisTrack
                        ? "border-[var(--accent-mentor)]/40 bg-[var(--bg-input)]/40"
                        : "border-[var(--border-muted)] bg-[var(--bg-input)]/40 hover:border-[var(--border-muted)]"
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-3 border-b border-[var(--border-muted)] pb-3 sm:flex-row sm:items-center">
                      <div className="space-y-1">
                        <Badge
                          tone={isJudgeThisTrack ? "judge" : isMentorThisTrack ? "mentor" : "info"}
                        >
                          Track 0{idx + 1}
                        </Badge>
                        <h3 className="font-display text-lg font-semibold text-[var(--text-primary)] sm:text-xl">
                          {track.trackName}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {isJudgeThisTrack && (
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="judge">Bạn là giám khảo</Badge>
                            <Link href={`/judge/scoring?trackId=${track.id}`}>
                              <Button accent="judge" className="text-xs">
                                Vào bàn chấm điểm
                              </Button>
                            </Link>
                          </div>
                        )}

                        {isMentorThisTrack && (
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="mentor">Bạn là cố vấn chuyên môn</Badge>
                            <Link href={`/mentor/teams?eventId=${targetEventId}&trackId=${track.id}`}>
                              <Button accent="mentor" className="text-xs">
                                Vào không gian hỗ trợ
                              </Button>
                            </Link>
                          </div>
                        )}

                        {!isJudgeThisTrack && !isMentorThisTrack && (
                          <Badge tone="neutral">Thể lệ &amp; đề tài</Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">
                      {track.description || `Định hướng nghiên cứu và phát triển giải pháp công nghệ thuộc Hạng mục ${track.trackName}. Đồ án được đánh giá theo khung tiêu chí Rubric chuẩn mực.`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Prizes */}
        {activeTab === "prizes" && (
          <div
            role="tabpanel"
            id="event-panel-prizes"
            aria-labelledby="event-tab-prizes"
            className="space-y-4 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-6 md:p-8"
          >
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
              Cơ cấu giải thưởng toàn giải
            </h2>

            {prizes.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                Ban tổ chức chưa công bố cơ cấu giải thưởng cho sự kiện này
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
                {prizes.map((p: PrizeItem, idx: number) => (
                  <div
                    key={p.id || idx}
                    className={`space-y-3 rounded-lg border bg-[var(--bg-input)]/40 p-6 text-center ${
                      idx === 0
                        ? "border-[var(--accent-judge)]/40"
                        : "border-[var(--border-muted)]"
                    }`}
                  >
                    <h3 className={`text-sm font-semibold ${idx === 0 ? "text-[var(--accent-judge)]" : "text-[var(--text-muted)]"}`}>
                      {p.prizeName}
                    </h3>
                    <div className="font-display text-2xl font-semibold text-[var(--text-primary)]">{p.value}</div>
                    {p.quantity > 1 && (
                      <p className="text-xs text-[var(--text-muted)]">Số lượng: {p.quantity}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Rules */}
        {activeTab === "rules" && (
          <div
            role="tabpanel"
            id="event-panel-rules"
            aria-labelledby="event-tab-rules"
            className="space-y-4 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-6 md:p-8"
          >
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
              Thể lệ &amp; quy định tham gia
            </h2>

            <div className="space-y-3 pt-2 text-sm leading-relaxed text-[var(--text-muted)]">
              <div className="space-y-1.5 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)]/40 p-4">
                <h4 className="font-display text-sm font-semibold text-[var(--text-primary)]">1. Điều kiện tham dự</h4>
                <p>Sinh viên các trường đại học/cao đẳng toàn quốc đã hoàn tất xác thực thẻ sinh viên hợp lệ trên hệ thống SEAL.</p>
              </div>

              <div className="space-y-1.5 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)]/40 p-4">
                <h4 className="font-display text-sm font-semibold text-[var(--text-primary)]">2. Quy định lập đội</h4>
                <p>Mỗi đội thi bao gồm từ 3 đến 5 thành viên. Mỗi thí sinh chỉ được ghi danh tham gia trong 1 đội thi duy nhất tại cùng một giải đấu.</p>
              </div>

              <div className="space-y-1.5 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)]/40 p-4">
                <h4 className="font-display text-sm font-semibold text-[var(--text-primary)]">3. Quy chế chấm điểm ẩn danh</h4>
                <p>Toàn bộ bài dự thi trong các Hạng mục đều được ẩn danh danh tính thí sinh và tên trường học để đảm bảo tính khách quan và công bằng tuyệt đối từ Hội đồng Giám khảo.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Teams */}
        {activeTab === "teams" && (
          <div
            role="tabpanel"
            id="event-panel-teams"
            aria-labelledby="event-tab-teams"
            className="space-y-6 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-6 md:p-8"
          >
            <div className="flex flex-col justify-between gap-4 border-b border-[var(--border-muted)] pb-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-medium text-[var(--accent-primary)]">
                  Không gian đội thi &amp; tìm đồng đội
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
                  Đội thi đang tuyển thành viên
                </h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Khám phá các đội thi đang tham gia sự kiện và liên hệ Đội trưởng qua email để đề nghị gia nhập đội.
                </p>
              </div>

              {user && !isEventEnded && (roleName === "Guest" || roleName === "TeamLeader" || roleName === "TeamMember") && (
                <Link href={`/my-team?eventId=${eventId}`}>
                  <Button accent="team" className="text-xs">
                    Quản lý / tạo đội
                  </Button>
                </Link>
              )}
            </div>

            <AvailableTeamsList
              eventId={eventId}
              eventName={eventName}
            />
          </div>
        )}
      </PageShell>

      {isComprehensiveEditOpen && (
        <ComprehensiveEventEditModal
          event={{
            id: eventId,
            eventName,
            season,
            year,
            tagline,
            description,
            maxTeams,
          }}
          onClose={() => setIsComprehensiveEditOpen(false)}
          onSuccess={() => refetch()}
        />
      )}
    </>
  );
}
