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

export function EventDetailView({ eventId: propEventId }: { eventId?: string }) {
  const params = useParams();
  const eventId = propEventId || (params?.id as string) || "evt-01";

  const { user, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState<"timeline" | "tracks" | "prizes" | "rules">("timeline");

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
      <div className="min-h-screen bg-[#080d10] flex items-center justify-center p-6 text-zinc-400 font-mono text-xs animate-pulse">
        [ ĐANG TẢI DỮ LIỆU SỰ KIỆN... ]
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen bg-[#080d10] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#10171a] border border-red-500/40 p-6 font-mono text-xs text-center space-y-4 hud-clipped">
          <div className="text-red-400 font-bold uppercase text-sm">
            [ LỖI KẾT NỐI SỰ KIỆN ]
          </div>
          <p className="text-zinc-300">
            Không tìm thấy thông tin sự kiện hoặc bạn không có quyền truy cập sự kiện này.
          </p>
          <Link href="/events">
            <button className="px-4 py-2 bg-zinc-800 text-white hover:bg-white hover:text-black font-bold uppercase transition-colors hud-clipped cursor-pointer">
              [ QUAY LẠI DANH SÁCH SỰ KIỆN ]
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#090e11] text-[#dde4e6] font-sans py-6 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 font-mono text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Link href="/events" className="hover:text-cyan-400 transition-colors uppercase">
              [ &lt; KHÁM PHÁ SỰ KIỆN ]
            </Link>
            <span>/</span>
            <span className="text-white font-bold uppercase">{eventName || "Chi Tiết Sự Kiện"}</span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span className="px-2.5 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold uppercase">
              {season} • {year}
            </span>
          </div>
        </div>

        {/* Unverified Student Alert Banner */}
        {roleName === "Student" && !user?.isApproved && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 font-mono text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm hud-clipped">
            <div className="text-amber-300 space-y-1">
              <span className="font-bold uppercase tracking-wider text-amber-200 block">
                [ THÔNG BÁO: HỒ SƠ SINH VIÊN CHƯA ĐƯỢC DUYỆT ]
              </span>
              <span className="text-zinc-300">
                Bạn có thể xem chi tiết thể lệ, lịch trình và giải thưởng. Để đăng ký tạo đội hoặc nộp bài, bạn cần hoàn thiện hồ sơ sinh viên.
              </span>
            </div>
            <Link
              href="/onboarding/profile"
              className="shrink-0 px-4 py-2 bg-amber-500 text-black hover:bg-white font-bold uppercase tracking-wider text-[11px] transition-colors hud-clipped"
            >
              [ CẬP NHẬT HỒ SƠ &gt; ]
            </Link>
          </div>
        )}

        {/* Hero Event Banner */}
        <div className="bg-[#10171a] border border-zinc-800 p-6 md:p-8 space-y-6 shadow-sm hud-clipped">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-2 font-mono text-xs">
                {isEventEnded ? (
                  <span className="px-2.5 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 font-bold uppercase">
                    [■ ĐÃ KẾT THÚC]
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                    [● ĐANG MỞ]
                  </span>
                )}
                <span className="text-zinc-400">
                  {teamCount}/{maxTeams} Đội thi đã đăng ký
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-white uppercase tracking-tight">
                {eventName}
              </h1>

              {tagline && tagline.trim() !== description?.trim() && (
                <p className="font-mono text-sm text-cyan-400">{tagline}</p>
              )}
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                {description || "Đấu trường công nghệ quy mô lớn dành cho sinh viên toàn quốc do Ban Quản Trị SEAL phê duyệt."}
              </p>
            </div>

            {/* Right-side Countdown Widget */}
            {deadline && (
              <div className="bg-[#0b1013] border border-zinc-800 p-4 space-y-2 shrink-0 lg:w-72 font-mono hud-clipped">
                <div className="text-xs text-cyan-300 font-bold uppercase">
                  [ {deadlineRoundName || "HẠN CHÓT GIAI ĐOẠN"} ]
                </div>
                <div className="text-xl font-bold text-white tracking-wider">
                  {countdown.isPast || isEventEnded
                    ? "ĐÃ KẾT THÚC"
                    : `${countdown.days} ngày ${countdown.hours} giờ ${countdown.minutes} phút`}
                </div>
                <div className="text-[11px] text-zinc-500">
                  Hạn chót: {formatShortDate(deadline)}
                </div>
              </div>
            )}
          </div>

          {/* 4 Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-zinc-800/80 font-mono text-xs">
            <div className="p-3 bg-[#0b1013] border border-zinc-800 space-y-0.5 hud-clipped">
              <span className="text-zinc-500 text-[10px] uppercase block">Tổng Giải Thưởng</span>
              <span className="text-emerald-400 font-bold text-base truncate block">
                {totalPrizeVnd > 0 ? formatVnd(totalPrizeVnd) : prizes.length > 0 ? `${prizes.length} Hạng Mục Giải` : "Đang cập nhật"}
              </span>
            </div>
            <div className="p-3 bg-[#0b1013] border border-zinc-800 space-y-0.5 hud-clipped">
              <span className="text-zinc-500 text-[10px] uppercase block">Hạng Mục Dự Thi</span>
              <span className="text-cyan-300 font-bold text-base">
                {tracks.length === 1 ? "1 Bảng Đấu Trọng Tâm" : `${tracks.length} Chuyên Môn`}
              </span>
            </div>
            <div className="p-3 bg-[#0b1013] border border-zinc-800 space-y-0.5 hud-clipped">
              <span className="text-zinc-500 text-[10px] uppercase block">Đội Thi Ghi Danh</span>
              <span className="text-emerald-300 font-bold text-base">{teamCount} / {maxTeams}</span>
            </div>
            <div className="p-3 bg-[#0b1013] border border-zinc-800 space-y-0.5 hud-clipped">
              <span className="text-zinc-500 text-[10px] uppercase block">Tổng Số Vòng Thi</span>
              <span className="text-purple-300 font-bold text-base">{rounds.length} Giai Đoạn</span>
            </div>
          </div>

          {/* Hero Bottom Actions */}
          <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-zinc-500">
              <span className={`w-2 h-2 rounded-full ${isEventEnded ? "bg-zinc-500" : "bg-emerald-400"}`} />
              <span className="text-zinc-400 font-bold uppercase tracking-wider">
                {isEventEnded ? "[ SỰ KIỆN ĐÃ ĐÓNG VÀ NIÊM PHONG ]" : "[ SỰ KIỆN CHÍNH THỨC TRÊN HỆ THỐNG SEAL ]"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {user?.isAdmin && (
                <>
                  <Link href="/admin/dashboard">
                    <button className="px-4 py-2 bg-red-600 hover:bg-white hover:text-black text-white font-bold uppercase transition-all cursor-pointer hud-clipped">
                      [ BẢNG ĐIỀU HÀNH ADMIN ]
                    </button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsComprehensiveEditOpen(true)}
                    className="px-4 py-2 bg-amber-950/60 text-amber-300 border border-amber-500/40 hover:bg-amber-900/80 font-bold uppercase transition-all cursor-pointer hud-clipped"
                  >
                    [ CHỈNH SỬA SỰ KIỆN ]
                  </button>
                </>
              )}

              {roleName === "Coordinator" && (
                <>
                  <Link href="/coordinator/dashboard">
                    <button className="px-3.5 py-2 bg-[#162228] border border-zinc-700 text-zinc-200 hover:border-purple-400 hover:text-white font-bold uppercase transition-all cursor-pointer hud-clipped">
                      [ QUẢN TRỊ BTC ]
                    </button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsComprehensiveEditOpen(true)}
                    className="px-3.5 py-2 bg-purple-950/60 text-purple-300 border border-purple-500/40 hover:bg-purple-900/80 font-bold uppercase transition-all cursor-pointer hud-clipped"
                  >
                    [ CHỈNH SỬA SỰ KIỆN ]
                  </button>
                </>
              )}

              {(roleName === "TeamLeader" || roleName === "TeamMember") && (
                <Link href={`/my-team?eventId=${eventId}`}>
                  <button className="px-4 py-2 bg-[#00d9ff] text-black hover:bg-white font-bold uppercase transition-all cursor-pointer hud-clipped">
                    [ QUẢN LÝ ĐỘI THI / NỘP BÀI ]
                  </button>
                </Link>
              )}

              {!hasJudgeRole && !hasMentorRole && roleName === "Guest" && user && !isEventEnded && (
                <Link href={`/my-team?eventId=${eventId}`}>
                  <button className="px-4 py-2 bg-[#00d9ff] text-black hover:bg-white font-extrabold uppercase transition-all cursor-pointer hud-clipped">
                    [ ĐĂNG KÝ ĐỘI THI ]
                  </button>
                </Link>
              )}

              {!user && !isEventEnded && (
                <>
                  <Link href="/register">
                    <button className="px-4 py-2 bg-[#00d9ff] text-black hover:bg-white font-extrabold uppercase transition-all cursor-pointer hud-clipped">
                      [ ĐĂNG KÝ TÀI KHOẢN ]
                    </button>
                  </Link>
                  <Link href="/login">
                    <button className="px-4 py-2 bg-[#162228] border border-zinc-700 text-zinc-200 hover:border-cyan-400 hover:text-white font-bold uppercase transition-all cursor-pointer hud-clipped">
                      [ ĐĂNG NHẬP ]
                    </button>
                  </Link>
                </>
              )}

              <Link href={`/events/${eventId}/leaderboard`}>
                <button className="px-4 py-2 bg-[#162228] border border-zinc-700 text-zinc-200 hover:border-cyan-400 hover:text-white font-bold uppercase transition-all cursor-pointer hud-clipped">
                  [ BẢNG XẾP HẠNG ]
                </button>
              </Link>
            </div>
          </div>
        </div>

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

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-1 bg-[#10171a] p-1.5 border border-zinc-800 font-mono text-xs shadow-sm hud-clipped">
          <button
            type="button"
            onClick={() => setActiveTab("timeline")}
            className={`flex-1 py-2.5 font-bold uppercase transition-all cursor-pointer text-center hud-clipped ${
              activeTab === "timeline"
                ? "bg-zinc-800 text-white font-extrabold border border-zinc-700"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Lịch Trình Vòng Thi ({rounds.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tracks")}
            className={`flex-1 py-2.5 font-bold uppercase transition-all cursor-pointer text-center hud-clipped ${
              activeTab === "tracks"
                ? "bg-zinc-800 text-white font-extrabold border border-zinc-700"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Hạng Mục ({tracks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("prizes")}
            className={`flex-1 py-2.5 font-bold uppercase transition-all cursor-pointer text-center hud-clipped ${
              activeTab === "prizes"
                ? "bg-zinc-800 text-white font-extrabold border border-zinc-700"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Giải Thưởng
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rules")}
            className={`flex-1 py-2.5 font-bold uppercase transition-all cursor-pointer text-center hud-clipped ${
              activeTab === "rules"
                ? "bg-zinc-800 text-white font-extrabold border border-zinc-700"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Thể Lệ &amp; Quy Định
          </button>
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
      </div>

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
    </div>
  );
}
