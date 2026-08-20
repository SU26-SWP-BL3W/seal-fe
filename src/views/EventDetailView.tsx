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

        {/* Unverified student alert */}
        {roleName === "Student" && !user?.isApproved && (
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

        {/* ── BÀN LÀM VIỆC CHUYÊN MÔN CỦA BẠN (MISSION WORKSPACE DOCK - MẪU 1) ── */}
        {(hasJudgeRole || hasMentorRole) && (
          <div className="bg-[#10171a] border border-zinc-800 p-5 md:p-6 space-y-4 hud-clipped relative shadow-md">
            {/* Dock Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isEventEnded ? "bg-zinc-500" : "bg-cyan-400 animate-pulse"}`} />
                <h2 className="text-cyan-400 font-bold uppercase tracking-wider text-sm">
                  {isEventEnded ? "[ NHIỆM VỤ CHUYÊN MÔN ĐÃ HOÀN TẤT ]" : "[ BÀN LÀM VIỆC CHUYÊN MÔN CỦA BẠN ]"}
                </h2>
                <span className="px-2 py-0.5 bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold uppercase hud-clipped">
                  {judgeRoles.length + mentorRoles.length} Nhiệm vụ
                </span>
              </div>
              <span className="text-zinc-500 text-[11px] uppercase">
                {isEventEnded ? "SỰ KIỆN ĐÃ ĐÓNG // DỮ LIỆU ĐÃ NIÊM PHONG" : "Tác vụ trực tiếp theo từng Hạng mục được phân công"}
              </span>
            </div>

            {/* Grid Cards for each assigned track */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Judge Track Cards */}
              {judgeRoles.map((r: any, idx: number) => {
                const matchedTrack = trackItems.find(t => normalizeId(t.id) === normalizeId(r.trackId || r.TrackId));
                const trackName = matchedTrack?.trackName || r.trackName || r.TrackName || "Hạng mục";
                const trackId = matchedTrack?.id || r.trackId || r.TrackId;

                return (
                  <div
                    key={`dock-j-${idx}`}
                    className="bg-[#181308] border border-amber-500/50 p-4 space-y-3 hud-clipped flex flex-col justify-between shadow-[0_0_15px_rgba(245,158,11,0.08)]"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 font-mono text-xs">
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase text-[10px] hud-clipped">
                          {isEventEnded ? "VAI TRÒ: GIÁM KHẢO [ĐÃ HOÀN TẤT]" : "VAI TRÒ: GIÁM KHẢO CHẤM ĐIỂM"}
                        </span>
                        <span className={`text-[10px] uppercase font-mono ${isEventEnded ? "text-zinc-400" : "text-emerald-400"}`}>
                          {isEventEnded ? "[• ĐÃ KHÉP LẠI]" : "[• ĐANG MỞ CỔNG]"}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-base sm:text-lg text-white uppercase pt-1">
                        {trackName}
                      </h3>
                      <p className="font-sans text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                        {matchedTrack?.description || "Phụ trách đánh giá chuyên môn và chấm điểm các bài thi thuộc Hạng mục theo khung Rubric."}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between gap-3 font-mono text-xs">
                      <span className="text-zinc-400 text-[11px]">{isEventEnded ? "Trạng thái: Đã niêm phong" : "Nhiệm vụ: Chấm điểm bài thi"}</span>
                      <Link href={`/judge/scoring?trackId=${trackId}`}>
                        <button className={`px-4 py-1.5 font-bold uppercase text-xs hud-clipped cursor-pointer transition-all shadow-sm ${
                          isEventEnded
                            ? "bg-[#141f23] border border-zinc-700 hover:border-amber-400 text-zinc-300 hover:text-white"
                            : "bg-amber-500 text-black hover:bg-white"
                        }`}>
                          {isEventEnded ? "[ XEM LẠI BÀI ĐÃ CHẤM (CHẾ ĐỘ XEM) > ]" : "[ VÀO CHẤM ĐIỂM TRACK NÀY > ]"}
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}

              {/* Mentor Track Cards */}
              {mentorRoles.map((r: any, idx: number) => {
                const matchedTrack = trackItems.find(t => normalizeId(t.id) === normalizeId(r.trackId || r.TrackId));
                const trackName = matchedTrack?.trackName || r.trackName || r.TrackName || "Hạng mục";
                const trackId = matchedTrack?.id || r.trackId || r.TrackId;

                return (
                  <div
                    key={`dock-m-${idx}`}
                    className="bg-[#081716] border border-teal-500/50 p-4 space-y-3 hud-clipped flex flex-col justify-between shadow-[0_0_15px_rgba(45,212,191,0.08)]"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 font-mono text-xs">
                        <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold uppercase text-[10px] hud-clipped">
                          {isEventEnded ? "VAI TRÒ: CỐ VẤN [ĐÃ HOÀN TẤT]" : "VAI TRÒ: CỐ VẤN CHUYÊN MÔN"}
                        </span>
                        <span className={`text-[10px] uppercase font-mono ${isEventEnded ? "text-zinc-400" : "text-teal-400"}`}>
                          {isEventEnded ? "[• ĐÃ KHÉP LẠI]" : "[• ĐỒNG HÀNH ĐỘI THI]"}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-base sm:text-lg text-white uppercase pt-1">
                        {trackName}
                      </h3>
                      <p className="font-sans text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                        {matchedTrack?.description || "Hỗ trợ định hướng kỹ thuật, giải đáp thắc mắc và cố vấn chuyên môn cho các đội thi trong Hạng mục."}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-teal-500/20 flex items-center justify-between gap-3 font-mono text-xs">
                      <span className="text-zinc-400 text-[11px]">{isEventEnded ? "Trạng thái: Đã khép lại" : "Nhiệm vụ: Hỗ trợ & cố vấn"}</span>
                      <Link href={`/mentor/teams?trackId=${trackId}`}>
                        <button className={`px-4 py-1.5 font-bold uppercase text-xs hud-clipped cursor-pointer transition-all shadow-sm ${
                          isEventEnded
                            ? "bg-[#141f23] border border-zinc-700 hover:border-teal-400 text-zinc-300 hover:text-white"
                            : "bg-teal-500 text-black hover:bg-white"
                        }`}>
                          {isEventEnded ? "[ XEM DANH SÁCH ĐỘI THI > ]" : "[ VÀO KHÔNG GIAN HỖ TRỢ > ]"}
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-1">
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
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-md px-3 py-2.5 text-center text-sm transition-colors ${
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

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: LỊCH TRÌNH TIẾN TRÌNH VÒNG THI
           ───────────────────────────────────────────────────────────── */}
        {activeTab === "timeline" && (
          <div className="bg-[#10171a] border border-zinc-800 p-6 md:p-8 space-y-8 hud-clipped">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800 font-mono">
              <div>
                <div className="text-xs text-cyan-400 uppercase tracking-widest font-bold">
                  [ TIMELINE TIẾN TRÌNH VÒNG THI ]
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-white mt-1">
                  Lộ Trình Toàn Bộ Cuộc Thi
                </h2>
              </div>

              <div className="text-xs text-zinc-400">
                <span className="px-3 py-1 bg-[#0b1013] border border-zinc-800 uppercase">
                  Tổng số: <strong className="text-cyan-300 font-bold">{rounds.length} Giai đoạn</strong>
                </span>
              </div>
            </div>

            {/* Timeline Rounds Container */}
            <div className="space-y-6">
              {rounds.map((round: RoundSummary, index: number) => {
                const isCurrent = round.status === "current";
                const isPast = round.status === "past";
                const isRegistration = index === 0;

                return (
                  <div
                    key={round.id || index}
                    className={`p-5 sm:p-6 border transition-all space-y-4 hud-clipped ${
                      isCurrent
                        ? "bg-[#131e24] border-cyan-500/60 shadow-[0_0_25px_rgba(0,217,255,0.1)]"
                        : isPast
                        ? "bg-[#0b1013]/90 border-zinc-800/80 opacity-85"
                        : "bg-[#0b1013] border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    {/* Round Header & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3 font-mono">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 hud-clipped">
                            {isRegistration ? "GIAI ĐOẠN TUYỂN SINH" : `VÒNG THI SỐ ${index}`}
                          </span>
                          <span className="text-xs text-zinc-400">
                            Thời gian: <strong>{formatShortDate(round.startDate)} — {formatShortDate(round.endDate)}</strong>
                          </span>
                        </div>
                        <h3 className="font-display font-bold text-white text-base sm:text-lg uppercase">
                          {round.roundName}
                        </h3>
                      </div>

                      <div className="self-start sm:self-auto">
                        <span
                          className={`px-3 py-1 font-mono text-xs font-bold uppercase hud-clipped ${
                            isCurrent
                              ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 animate-pulse"
                              : isPast
                              ? "bg-zinc-800 text-zinc-400"
                              : "bg-cyan-950/40 text-cyan-300 border border-cyan-500/30"
                          }`}
                        >
                          {isCurrent ? "[ ĐANG DIỄN RA ]" : isPast ? "[ ĐÃ KẾT THÚC ]" : "[ SẮP MỞ ]"}
                        </span>
                      </div>
                    </div>

                    {/* Round Description */}
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                      {round.description}
                    </p>

                    {/* Milestone Dates Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 font-mono text-xs">
                      <div className="p-2.5 bg-[#0e161a] border border-zinc-800/80 space-y-0.5 hud-clipped">
                        <span className="text-[10px] text-zinc-500 uppercase block">
                          Mở Cổng &amp; Bắt Đầu:
                        </span>
                        <span className="text-white font-bold block">{formatDateTime(round.startDate)}</span>
                      </div>

                      <div className="p-2.5 bg-[#0e161a] border border-zinc-800/80 space-y-0.5 hud-clipped">
                        <span className="text-[10px] text-zinc-500 uppercase block">
                          Hạn Khóa Nộp Bài:
                        </span>
                        <span className="text-cyan-300 font-bold block">
                          {formatDateTime(round.submissionDeadline || round.endDate)}
                        </span>
                      </div>

                      <div className="p-2.5 bg-[#0e161a] border border-zinc-800/80 space-y-0.5 hud-clipped">
                        <span className="text-[10px] text-zinc-500 uppercase block">
                          Hội Đồng Đánh Giá:
                        </span>
                        <span className="text-purple-300 font-bold block">
                          {formatDateTime(round.evaluationEndDate || round.endDate)}
                        </span>
                      </div>

                      <div className="p-2.5 bg-[#0e161a] border border-zinc-800/80 space-y-0.5 hud-clipped">
                        <span className="text-[10px] text-zinc-500 uppercase block">
                          Công Bố Kết Quả:
                        </span>
                        <span className="text-emerald-300 font-bold block">
                          {formatDateTime(round.resultAnnouncementDate || round.endDate)}
                        </span>
                      </div>
                    </div>

                    {/* Deliverables Strip */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800/80 font-mono text-xs">
                      <div className="text-zinc-400">
                        {isRegistration ? "Yêu cầu hồ sơ: " : "Yêu cầu nộp: "}
                        <strong className="text-zinc-200">
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

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: CHỦ ĐỀ & HẠNG MỤC THI ĐẤU (TRACK-FIRST LISTING)
           ───────────────────────────────────────────────────────────── */}
        {activeTab === "tracks" && (
          <div className="bg-[#10171a] border border-zinc-800 p-6 md:p-8 space-y-6 hud-clipped">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4 font-mono">
              <div>
                <div className="text-xs text-cyan-400 uppercase tracking-widest font-bold">
                  [ CHỦ ĐỀ &amp; HẠNG MỤC THI ĐẤU ]
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-white mt-1">
                  Định Hướng Đề Tài &amp; Phân Công Chuyên Môn
                </h2>
              </div>

              <span className="px-3 py-1 bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase self-start sm:self-auto hud-clipped">
                {tracks.length} Hạng Mục Thi Đấu
              </span>
            </div>

            {/* List of Tracks */}
            <div className="space-y-5">
              {trackItems.map((track, idx) => {
                const tId = normalizeId(track.id);
                // Kiểm tra xem user có vai trò gì trong track này không (khớp theo trackId hoặc trackName)
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
                    className={`p-6 space-y-4 hud-clipped transition-all border ${
                      isJudgeThisTrack
                        ? "bg-[#181308] border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.12)]"
                        : isMentorThisTrack
                        ? "bg-[#081716] border-teal-500/60 shadow-[0_0_20px_rgba(45,212,191,0.12)]"
                        : "bg-[#0b1013] border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3 font-mono">
                      <div className="space-y-1">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase hud-clipped ${
                          isJudgeThisTrack
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : isMentorThisTrack
                            ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                            : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                        }`}>
                          TRACK 0{idx + 1}
                        </span>
                        <h3 className="text-lg sm:text-xl font-display font-bold text-white uppercase">
                          {track.trackName}
                        </h3>
                      </div>

                      {/* Track-Specific Contextual Role Badge & CTA */}
                      <div className="flex flex-wrap items-center gap-2">
                        {isJudgeThisTrack && (
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/50 text-xs font-bold uppercase hud-clipped">
                              [ BẠN LÀ GIÁM KHẢO ]
                            </span>
                            <Link href={`/judge/scoring?trackId=${track.id}`}>
                              <button className="px-4 py-1.5 bg-amber-500 text-black hover:bg-white text-xs font-bold uppercase hud-clipped cursor-pointer transition-all shadow-sm">
                                [ VÀO BÀN CHẤM ĐIỂM &gt; ]
                              </button>
                            </Link>
                          </div>
                        )}

                        {isMentorThisTrack && (
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/50 text-xs font-bold uppercase hud-clipped">
                              [ BẠN LÀ CỐ VẤN CHUYÊN MÔN ]
                            </span>
                            <Link href={`/mentor/teams?trackId=${track.id}`}>
                              <button className="px-4 py-1.5 bg-teal-500 text-black hover:bg-white text-xs font-bold uppercase hud-clipped cursor-pointer transition-all shadow-sm">
                                [ VÀO KHÔNG GIAN HỖ TRỢ &gt; ]
                              </button>
                            </Link>
                          </div>
                        )}

                        {!isJudgeThisTrack && !isMentorThisTrack && (
                          <span className="px-2.5 py-1 bg-zinc-800 text-zinc-400 text-xs uppercase hud-clipped font-mono">
                            [ THỂ LỆ &amp; ĐỀ TÀI ]
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="font-sans text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      {track.description || `Định hướng nghiên cứu và phát triển giải pháp công nghệ thuộc Hạng mục ${track.trackName}. Đồ án được đánh giá theo khung tiêu chí Rubric chuẩn mực.`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 3: CƠ CẤU GIẢI THƯỞNG
           ───────────────────────────────────────────────────────────── */}
        {activeTab === "prizes" && (
          <div className="bg-[#10171a] border border-zinc-800 p-6 md:p-8 space-y-4 hud-clipped font-mono">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              [ CƠ CẤU GIẢI THƯỞNG TOÀN GIẢI ]
            </h2>

            {prizes.length === 0 ? (
              <p className="text-xs text-zinc-400">
                [ Ban Tổ Chức chưa công bố cơ cấu giải thưởng cho sự kiện này ]
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {prizes.map((p: PrizeItem, idx: number) => (
                  <div
                    key={p.id || idx}
                    className={`bg-[#0b1013] border p-6 space-y-3 text-center hud-clipped ${
                      idx === 0 ? "border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.08)]" : "border-zinc-800"
                    }`}
                  >
                    <h3 className={`font-bold text-xs uppercase ${idx === 0 ? "text-amber-300" : "text-zinc-300"}`}>
                      {p.prizeName}
                    </h3>
                    <div className="text-2xl font-black text-white">{p.value}</div>
                    {p.quantity > 1 && (
                      <p className="text-[11px] text-zinc-400">Số lượng: {p.quantity}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 4: THỂ LỆ & QUY ĐỊNH
           ───────────────────────────────────────────────────────────── */}
        {activeTab === "rules" && (
          <div className="bg-[#10171a] border border-zinc-800 p-6 md:p-8 space-y-4 hud-clipped font-mono">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              [ THỂ LỆ &amp; QUY ĐỊNH THAM GIA ]
            </h2>

            <div className="space-y-3 pt-2 font-sans text-xs text-zinc-300 leading-relaxed">
              <div className="p-4 bg-[#0b1013] border border-zinc-800 space-y-1.5 hud-clipped">
                <h4 className="font-bold text-white text-sm font-mono uppercase">1. Điều Kiện Tham Dự</h4>
                <p>Sinh viên các trường đại học/cao đẳng toàn quốc đã hoàn tất xác thực thẻ sinh viên hợp lệ trên hệ thống SEAL.</p>
              </div>

              <div className="p-4 bg-[#0b1013] border border-zinc-800 space-y-1.5 hud-clipped">
                <h4 className="font-bold text-white text-sm font-mono uppercase">2. Quy Định Lập Đội</h4>
                <p>Mỗi đội thi bao gồm từ 3 đến 5 thành viên. Mỗi thí sinh chỉ được ghi danh tham gia trong 1 đội thi duy nhất tại cùng một giải đấu.</p>
              </div>

              <div className="p-4 bg-[#0b1013] border border-zinc-800 space-y-1.5 hud-clipped">
                <h4 className="font-bold text-white text-sm font-mono uppercase">3. Quy Chế Chấm Điểm Ẩn Danh</h4>
                <p>Toàn bộ bài dự thi trong các Hạng mục đều được ẩn danh danh tính thí sinh và tên trường học để đảm bảo tính khách quan và công bằng tuyệt đối từ Hội đồng Giám khảo.</p>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 5: DANH SÁCH ĐỘI THI & TÌM ĐỒNG ĐỘI / TUYỂN QUÂN
           ───────────────────────────────────────────────────────────── */}
        {activeTab === "teams" && (
          <div className="bg-[#10171a] border border-zinc-800 p-6 md:p-8 space-y-6 hud-clipped">
            {/* Tab Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800 font-mono">
              <div>
                <div className="text-xs text-cyan-400 uppercase tracking-widest font-bold">
                  [ KHÔNG GIAN ĐỘI THI &amp; TÌM ĐỒNG ĐỘI ]
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-white mt-1">
                  Đội Thi Đang Tuyển Thành Viên
                </h2>
                <p className="mt-1 text-xs text-zinc-400 font-sans">
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

            {/* Teams List Component */}
            <AvailableTeamsList
              eventId={eventId}
              eventName={eventName}
            />
          </div>
        )}
    </PageShell>

      {/* Modal Chỉnh Sửa Toàn Diện Sự Kiện & Lộ Trình Cho Admin / Coordinator */}
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
