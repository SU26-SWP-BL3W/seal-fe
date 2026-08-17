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
import {
  Calendar,
  Trophy,
  Users,
  User,
  Layers,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Shield,
  Award,
  Sparkles,
  Info,
  Scale,
  Briefcase,
  Upload,
  FileCode,
  FileCheck2,
  AlertCircle,
  Megaphone,
  HelpCircle,
  Flame,
  Settings,
  X,
} from "lucide-react";
import { roundsRepository } from "@/repositories/roundsRepository";
import { eventsRepository } from "@/repositories/eventsRepository";
import { ComprehensiveEventEditModal } from "@/components/domain/ComprehensiveEventEditModal";

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

function formatFullDateTime(iso?: string): string {
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

function toDateTimeLocal(val?: string, defaultTime = "08:00") {
  if (!val) return "";
  if (val.includes("T")) {
    const parts = val.split("T");
    const datePart = parts[0];
    const timePart = parts[1]?.substring(0, 5) || defaultTime;
    return `${datePart}T${timePart}`;
  }
  return `${val}T${defaultTime}`;
}

export function EventDetailView({ eventId: propEventId }: { eventId?: string }) {
  const params = useParams();
  const eventId = propEventId || (params?.id as string) || "evt-01";

  const { user, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState<"timeline" | "tracks" | "prizes" | "rules">("timeline");
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number>(0);

  const { data: userRolesResult } = useGetEventRolesByUser(user?.id, { pageSize: 100 });
  const userRoles = useMemo(() => {
    const raw = (userRolesResult as any)?.data?.items ?? (userRolesResult as any)?.items ?? (Array.isArray(userRolesResult) ? userRolesResult : []);
    return Array.isArray(raw) ? raw : [];
  }, [userRolesResult]);

  const { data: myTeamResult } = useMyTeam();
  const myTeam = (myTeamResult as any)?.team ?? myTeamResult;

  // XÁC ĐỊNH CHÍNH XÁC VAI TRÒ CỦA NGƯỜI DÙNG ĐỐI VỚI SỰ KIỆN NÀY (EVENT-SCOPED ROLE)
  const roleName = useMemo(() => {
    if (!user) return "Guest";
    if (user.isAdmin || user.IsAdmin) return "Admin";

    // 1. Kiểm tra xem người dùng có bản ghi EventRole nào cho chính eventId này không
    const matchedRole = userRoles.find(
      (r: any) => (r.eventId || r.EventId) === eventId
    );
    if (matchedRole) {
      const rn = matchedRole.roleName || matchedRole.RoleName;
      if (rn === "EventCoordinator") return "Coordinator";
      if (rn === "Judge") return "Judge";
      if (rn === "Mentor") return "Mentor";
      if (rn === "TeamLeader") return "TeamLeader";
      if (rn === "TeamMember") return "TeamMember";
      return rn || "Guest";
    }

    // 2. Kiểm tra nếu activeRole hiện tại được gán cho eventId này
    const assignedIds = activeRole?.assignedEventIds || activeRole?.AssignedEventIds || [];
    if (activeRole && (activeRole.eventId === eventId || activeRole.EventId === eventId || assignedIds.includes(eventId))) {
      const rn = activeRole.roleName || activeRole.RoleName;
      if (rn === "EventCoordinator") return "Coordinator";
      if (rn === "Judge") return "Judge";
      if (rn === "Mentor") return "Mentor";
      if (rn === "TeamLeader") return "TeamLeader";
      if (rn === "TeamMember") return "TeamMember";
      return rn || "Guest";
    }

    // 3. Kiểm tra xem người dùng có đội thi trong eventId này không
    if (myTeam && (myTeam.eventId === eventId || myTeam.EventId === eventId)) {
      return myTeam.isLeader ? "TeamLeader" : "TeamMember";
    }

    // 4. Nếu không thuộc bất kỳ vai trò nào trong eventId này -> Là Guest / Thí sinh chưa tham gia
    return "Guest";
  }, [user, userRoles, activeRole, eventId, myTeam]);

  const {
    eventName,
    season,
    year,
    tagline,
    description,
    tracks,
    rounds,
    teamCount,
    maxTeams,
    prizes,
    deadline,
    deadlineRoundName,
    refetch,
  } = useEventDetailViewModel(eventId);

  const countdown = useCountdown(deadline);

  // Modal State cho Admin / Coordinator chỉnh sửa toàn diện sự kiện & lộ trình
  const [isComprehensiveEditOpen, setIsComprehensiveEditOpen] = useState(false);

  const activeRound = rounds[selectedRoundIndex] || rounds[0] || {
    id: "rnd-0",
    roundNumber: 0,
    roundName: "Mở Cổng Đăng Ký Đội Thi",
    startDate: "2026-06-01T00:00:00Z",
    endDate: "2026-07-10T23:59:59Z",
    submissionDeadline: "2026-07-10T23:59:59Z",
    evaluationEndDate: "2026-07-12T18:00:00Z",
    resultAnnouncementDate: "2026-07-13T09:00:00Z",
    appealDeadline: "2026-07-14T23:59:59Z",
    description: "Mở cổng nhận hồ sơ thành lập Đội thi.",
    status: "past" as const,
  };

  // 5 Milestones for the active selected round
  const activeMilestones = [
    {
      id: "m1",
      number: "01",
      title: "Mở Cổng & Bắt Đầu Vòng",
      date: formatDateTime(activeRound.startDate),
      desc: "Khởi động giai đoạn, mở đề bài và nhận bài thi.",
      icon: Flame,
      color: "#38bdf8", // Sky
    },
    {
      id: "m2",
      number: "02",
      title: "Khóa Cổng Nộp Bài",
      date: formatDateTime(activeRound.submissionDeadline || activeRound.endDate),
      desc: "Hạn chót khóa form tải lên tài liệu và mã nguồn.",
      icon: Clock,
      color: "#f59e0b", // Amber
    },
    {
      id: "m3",
      number: "03",
      title: "Hội Đồng Chấm Điểm",
      date: formatDateTime(activeRound.evaluationEndDate || activeRound.endDate),
      desc: "Giám khảo đánh giá ẩn danh dựa trên rubric tiêu chí.",
      icon: Scale,
      color: "#a855f7", // Purple
    },
    {
      id: "m4",
      number: "04",
      title: "Công Bố Điểm & Xếp Hạng",
      date: formatDateTime(activeRound.resultAnnouncementDate || activeRound.endDate),
      desc: "Mở Bảng xếp hạng và danh sách đội đi tiếp.",
      icon: Megaphone,
      color: "#10b981", // Emerald
    },
    {
      id: "m5",
      number: "05",
      title: "Khung Giờ Phúc Khảo",
      date: formatDateTime(activeRound.appealDeadline || activeRound.endDate),
      desc: "48h nhận khiếu nại và phản hồi từ Ban Tổ Chức.",
      icon: Shield,
      color: "#ec4899", // Pink
    },
  ];

  const backHref =
    roleName === "Admin"
      ? "/admin/dashboard"
      : roleName === "Coordinator"
      ? "/coordinator/dashboard"
      : roleName === "Judge"
      ? "/judge/events"
      : roleName === "Mentor"
      ? "/mentor/tracks"
      : "/events";

  const backLabel =
    roleName === "Admin"
      ? "Bảng Điều Hành Admin"
      : roleName === "Coordinator"
      ? "Control Center BTC"
      : roleName === "Judge"
      ? "Sự Kiện Giám Khảo"
      : roleName === "Mentor"
      ? "Khu Vực Cố Vấn"
      : "Khám Phá Sự Kiện";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#090e11] text-[#dde4e6] font-sans py-6 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 font-mono text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Link href={backHref} className="hover:text-cyan-400 flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{backLabel}</span>
            </Link>
            <span>/</span>
            <span className="text-zinc-500">Sự Kiện</span>
            <span>/</span>
            <span className="text-white font-bold">{eventName || "Chi Tiết Sự Kiện"}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded text-[11px] font-bold">
              {season} • {year}
            </span>
          </div>
        </div>

        {/* Unverified Student Alert Banner */}
        {roleName === "Student" && !user?.isApproved && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 font-mono text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5 text-amber-300">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
              <div>
                <span className="font-bold uppercase tracking-wider text-amber-200">HỒ SƠ SINH VIÊN CHƯA ĐƯỢC DUYỆT:</span>{" "}
                <span className="text-zinc-300">
                  Bạn có thể xem chi tiết thể lệ, lịch trình và giải thưởng. Để đăng ký tạo đội hoặc nộp bài, bạn cần hoàn thiện hồ sơ sinh viên.
                </span>
              </div>
            </div>
            <Link
              href="/onboarding/profile"
              className="shrink-0 px-4 py-2 bg-amber-500 text-black hover:bg-amber-400 font-bold uppercase tracking-wider rounded transition-colors text-[11px] flex items-center gap-1.5 shadow-sm"
            >
              <span>Cập Nhật Hồ Sơ</span>
              <span>→</span>
            </Link>
          </div>
        )}

        {/* Hero Event Banner */}
        <div className="bg-[#10171a] border border-zinc-800 rounded-lg p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 rounded text-xs font-mono font-bold uppercase inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Đang Mở
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  {teamCount}/{maxTeams} Đội thi đã đăng ký
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-white uppercase tracking-tight">
                {eventName}
              </h1>

              <p className="font-mono text-sm text-cyan-400">{tagline}</p>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">{description}</p>
            </div>

            {/* Right-side Countdown Widget */}
            {deadline && (
              <div className="bg-[#0b1013] border border-zinc-800 p-4 rounded-lg space-y-2 shrink-0 lg:w-72 font-mono">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1 text-cyan-300 font-bold uppercase">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    {deadlineRoundName || "Hạn chót vòng"}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white tracking-wider">
                  {countdown.isPast
                    ? "Đã kết thúc"
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
            <div className="p-3 bg-[#0b1013] rounded border border-zinc-800 space-y-0.5">
              <span className="text-zinc-500 text-[10px] uppercase block">Giải Thưởng</span>
              <span className="text-cyan-300 font-bold text-base">
                {prizes.length > 0 ? `${prizes.length} Giải` : "Chưa công bố"}
              </span>
            </div>
            <div className="p-3 bg-[#0b1013] rounded border border-zinc-800 space-y-0.5">
              <span className="text-zinc-500 text-[10px] uppercase block">Hạng Mục Dự Thi</span>
              <span className="text-cyan-300 font-bold text-base">
                {tracks.length === 1 ? "1 Bảng Đấu Trọng Tâm" : `${tracks.length} Chuyên Môn`}
              </span>
            </div>
            <div className="p-3 bg-[#0b1013] rounded border border-zinc-800 space-y-0.5">
              <span className="text-zinc-500 text-[10px] uppercase block">Đội Thi Ghi Danh</span>
              <span className="text-emerald-300 font-bold text-base">{teamCount} / {maxTeams}</span>
            </div>
            <div className="p-3 bg-[#0b1013] rounded border border-zinc-800 space-y-0.5">
              <span className="text-zinc-500 text-[10px] uppercase block">Tổng Số Vòng Thi</span>
              <span className="text-purple-300 font-bold text-base">{rounds.length} Giai Đoạn</span>
            </div>
          </div>

          {/* Role Action Strip */}
          <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-zinc-400 font-bold">VAI TRÒ CỦA BẠN:</span>
              <span className={`px-2.5 py-0.5 rounded font-bold uppercase ${
                roleName === "Coordinator"
                  ? "bg-purple-950/60 text-purple-300 border border-purple-500/40"
                  : roleName === "Admin"
                  ? "bg-amber-950/60 text-amber-300 border border-amber-500/40"
                  : roleName === "Judge"
                  ? "bg-yellow-950/60 text-yellow-300 border border-yellow-500/40"
                  : roleName === "Mentor"
                  ? "bg-teal-950/60 text-teal-300 border border-teal-500/40"
                  : roleName === "TeamLeader" || roleName === "TeamMember"
                  ? "bg-cyan-950/60 text-cyan-300 border border-cyan-500/40"
                  : user
                  ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  : "bg-zinc-800 text-cyan-300 border border-cyan-500/30"
              }`}>
                {roleName === "Coordinator"
                  ? "BAN TỔ CHỨC (COORDINATOR)"
                  : roleName === "Admin"
                  ? "SYSTEM ADMIN"
                  : roleName === "Judge"
                  ? "GIÁM KHẢO (JUDGE)"
                  : roleName === "Mentor"
                  ? "CỐ VẤN (MENTOR)"
                  : roleName === "TeamLeader"
                  ? "TRƯỞNG ĐỘI THI"
                  : roleName === "TeamMember"
                  ? "THÀNH VIÊN ĐỘI THI"
                  : user
                  ? "CHƯA THAM GIA SỰ KIỆN NÀY"
                  : "KHÁCH (GUEST)"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              {roleName === "Guest" && (
                <>
                  {user ? (
                    <>
                      <Link href={`/my-team?eventId=${eventId}`}>
                        <button className="px-5 py-2.5 bg-[#00d9ff] text-black hover:bg-white hover:shadow-[0_0_20px_rgba(0,217,255,0.4)] rounded font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                          <Users className="w-4 h-4" />
                          <span>Đăng Ký Đội Thi Tham Gia</span>
                        </button>
                      </Link>
                      <Link href={`/events/${eventId}/leaderboard`}>
                        <button className="px-4 py-2.5 bg-[#162228] border border-zinc-700 text-zinc-200 hover:border-cyan-400 hover:text-white rounded font-bold transition-all cursor-pointer flex items-center gap-1.5">
                          <Trophy className="w-4 h-4 text-amber-400" />
                          <span>Bảng Xếp Hạng</span>
                        </button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/register">
                        <button className="px-5 py-2.5 bg-[#00d9ff] text-black hover:bg-white hover:shadow-[0_0_20px_rgba(0,217,255,0.4)] rounded font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                          <User className="w-4 h-4" />
                          <span>Đăng Ký Tài Khoản Tham Gia</span>
                        </button>
                      </Link>
                      <Link href="/login">
                        <button className="px-4 py-2.5 bg-[#162228] border border-zinc-700 text-zinc-200 hover:border-cyan-400 hover:text-white rounded font-bold transition-all cursor-pointer">
                          <span>Đăng Nhập</span>
                        </button>
                      </Link>
                    </>
                  )}
                </>
              )}

              {roleName === "Admin" && (
                <div className="flex items-center gap-2">
                  <Link href="/admin/dashboard">
                    <button className="px-4 py-2 bg-amber-500 text-black hover:bg-amber-400 rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                      <Shield className="w-4 h-4" />
                      <span>Bảng Điều Hành Admin</span>
                    </button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsComprehensiveEditOpen(true)}
                    className="px-4 py-2 bg-amber-950/60 text-amber-300 border border-amber-500/40 hover:bg-amber-900/80 rounded font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Chỉnh Sửa Sự Kiện</span>
                  </button>
                  <Link href={`/events/${eventId}/leaderboard`}>
                    <button className="px-4 py-2 bg-[#162228] border border-zinc-700 text-zinc-200 hover:border-amber-400 hover:text-white rounded font-bold transition-all cursor-pointer flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Bảng Xếp Hạng</span>
                    </button>
                  </Link>
                </div>
              )}

              {roleName === "Coordinator" && (
                <div className="flex items-center gap-2">
                  <Link href="/coordinator/dashboard">
                    <button className="px-3.5 py-2 bg-[#162228] border border-zinc-700 text-zinc-200 hover:border-purple-400 hover:text-white rounded font-bold transition-all cursor-pointer">
                      <span>Quản Trị BTC</span>
                    </button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsComprehensiveEditOpen(true)}
                    className="px-3.5 py-2 bg-purple-950/60 text-purple-300 border border-purple-500/40 hover:bg-purple-900/80 rounded font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Chỉnh Sửa Sự Kiện</span>
                  </button>
                  <Link href={`/events/${eventId}/leaderboard`}>
                    <button className="px-4 py-2 bg-[#162228] border border-zinc-700 text-zinc-200 hover:border-purple-400 hover:text-white rounded font-bold transition-all cursor-pointer flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Bảng Xếp Hạng</span>
                    </button>
                  </Link>
                </div>
              )}

              {roleName === "Judge" && (
                <div className="flex items-center gap-2">
                  <Link href="/judge/scoring">
                    <button className="px-4 py-2 bg-amber-500 text-black hover:bg-amber-400 rounded font-bold transition-all cursor-pointer flex items-center gap-1.5">
                      <Scale className="w-4 h-4" />
                      <span>Vào Bàn Chấm Điểm</span>
                    </button>
                  </Link>
                  <Link href={`/events/${eventId}/leaderboard`}>
                    <button className="px-4 py-2 bg-[#162228] border border-zinc-700 text-zinc-200 hover:border-amber-400 hover:text-white rounded font-bold transition-all cursor-pointer flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Bảng Xếp Hạng</span>
                    </button>
                  </Link>
                </div>
              )}

              {roleName === "Mentor" && (
                <Link href="/mentor/tracks">
                  <button className="px-4 py-2 bg-teal-500 text-black hover:bg-teal-400 rounded font-bold transition-all cursor-pointer flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>Xem Đội Thi Được Phân Công</span>
                  </button>
                </Link>
              )}

              {(roleName === "TeamLeader" || roleName === "TeamMember") && (
                <div className="flex items-center gap-2">
                  <Link href={`/my-team?eventId=${eventId}`}>
                    <button className="px-5 py-2.5 bg-[#00d9ff] text-black hover:bg-white hover:shadow-[0_0_20px_rgba(0,217,255,0.4)] rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                      <Upload className="w-4 h-4" />
                      <span>Quản Lý Đội Thi / Nộp Bài</span>
                    </button>
                  </Link>
                  <Link href={`/events/${eventId}/leaderboard`}>
                    <button className="px-4 py-2.5 bg-[#162228] border border-zinc-700 text-zinc-200 hover:border-cyan-400 hover:text-white rounded font-bold transition-all cursor-pointer flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Bảng Xếp Hạng</span>
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-1 bg-[#10171a] p-1.5 border border-zinc-800 rounded-lg font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("timeline")}
            className={`flex-1 py-2.5 rounded font-bold transition-all cursor-pointer text-center ${
              activeTab === "timeline"
                ? "bg-[#00d9ff] text-black font-extrabold shadow-[0_0_15px_rgba(0,217,255,0.3)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Lịch Trình Vòng Thi ({rounds.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tracks")}
            className={`flex-1 py-2.5 rounded font-bold transition-all cursor-pointer text-center ${
              activeTab === "tracks"
                ? "bg-[#00d9ff] text-black font-extrabold shadow-[0_0_15px_rgba(0,217,255,0.3)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Hạng Mục ({tracks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("prizes")}
            className={`flex-1 py-2.5 rounded font-bold transition-all cursor-pointer text-center ${
              activeTab === "prizes"
                ? "bg-[#00d9ff] text-black font-extrabold shadow-[0_0_15px_rgba(0,217,255,0.3)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Giải Thưởng
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rules")}
            className={`flex-1 py-2.5 rounded font-bold transition-all cursor-pointer text-center ${
              activeTab === "rules"
                ? "bg-[#00d9ff] text-black font-extrabold shadow-[0_0_15px_rgba(0,217,255,0.3)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Thể Lệ &amp; Quy Định
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: LỊCH TRÌNH TIẾN TRÌNH VÒNG THI (FORMAT DỌC LIỀN MẠCH)
           ───────────────────────────────────────────────────────────── */}
        {activeTab === "timeline" && (
          <div className="bg-[#10171a] border border-zinc-800 rounded-lg p-6 md:p-8 space-y-8">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 uppercase tracking-widest font-bold">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  TIMELINE TIẾN TRÌNH VÒNG THI
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-white mt-1">
                  Lộ Trình Toàn Bộ Cuộc Thi
                </h2>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
                <span className="px-3 py-1 bg-[#0b1013] border border-zinc-800 rounded">
                  Tổng số: <strong className="text-cyan-300 font-bold">{rounds.length} Giai đoạn</strong>
                </span>
              </div>
            </div>

            {/* Vertical Connected Timeline Spine Container */}
            <div className="relative pl-4 sm:pl-8 space-y-8 before:absolute before:left-8 sm:before:left-12 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-[#00d9ff] before:via-cyan-500/40 before:to-zinc-800">
              {rounds.map((round: RoundSummary, index: number) => {
                const isCurrent = round.status === "current";
                const isPast = round.status === "past";
                const isRegistration = index === 0;

                return (
                  <div key={round.id || index} className="relative flex items-start gap-4 sm:gap-6 group">
                    
                    {/* Stepper Node Icon / Number */}
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-mono font-black text-xs shrink-0 z-10 border transition-all ${
                        isCurrent
                          ? "bg-[#00d9ff] text-black border-cyan-200 shadow-[0_0_20px_rgba(0,217,255,0.6)] scale-110"
                          : isPast
                          ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                          : "bg-[#0b1013] text-cyan-300 border-cyan-500/40"
                      }`}
                    >
                      {index === 0 ? "0" : index}
                    </div>

                    {/* Detailed Round Card */}
                    <div
                      className={`flex-1 p-5 sm:p-6 rounded-lg border transition-all space-y-4 ${
                        isCurrent
                          ? "bg-[#131e24] border-cyan-500/60 shadow-[0_0_25px_rgba(0,217,255,0.1)]"
                          : isPast
                          ? "bg-[#0b1013]/90 border-zinc-800/80 opacity-85"
                          : "bg-[#0b1013] border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {/* Round Header & Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded">
                              {isRegistration ? "Giai Đoạn Tuyển Sinh" : `VÒNG THI SỐ ${index}`}
                            </span>
                            <span className="font-mono text-xs text-zinc-400">
                              Thời gian: <strong>{formatShortDate(round.startDate)} — {formatShortDate(round.endDate)}</strong>
                            </span>
                          </div>
                          <h3 className="font-display font-bold text-white text-base sm:text-lg">
                            {round.roundName}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                          <span
                            className={`px-3 py-1 rounded font-mono text-xs font-bold uppercase ${
                              isCurrent
                                ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 animate-pulse shadow-[0_0_12px_rgba(0,217,255,0.2)]"
                                : isPast
                                ? "bg-zinc-800 text-zinc-400"
                                : "bg-cyan-950/40 text-cyan-300 border border-cyan-500/30"
                            }`}
                          >
                            {isCurrent ? "Đang diễn ra" : isPast ? "Đã kết thúc" : "Sắp mở"}
                          </span>
                        </div>
                      </div>

                      {/* Round Description */}
                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                        {round.description}
                      </p>

                      {/* 4 Key Milestone Dates Grid (Tailored for Registration vs Competition) */}
                      {isRegistration ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 font-mono text-xs">
                          <div className="p-2.5 bg-[#0e161a] border border-zinc-800/80 rounded space-y-0.5">
                            <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
                              <Flame className="w-3 h-3 text-cyan-400" /> Mở Cổng Nhận Hồ Sơ:
                            </span>
                            <span className="text-white font-bold block">{formatDateTime(round.startDate)}</span>
                          </div>

                          <div className="p-2.5 bg-[#0e161a] border border-zinc-800/80 rounded space-y-0.5">
                            <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
                              <Clock className="w-3 h-3 text-cyan-400" /> Đóng Cổng &amp; Khóa Form:
                            </span>
                            <span className="text-cyan-300 font-bold block">
                              {formatDateTime(round.submissionDeadline || round.endDate)}
                            </span>
                          </div>

                          <div className="p-2.5 bg-[#0e161a] border border-zinc-800/80 rounded space-y-0.5">
                            <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
                              <FileCheck2 className="w-3 h-3 text-purple-400" /> Duyệt Thẻ SV &amp; Hồ Sơ:
                            </span>
                            <span className="text-purple-300 font-bold block">
                              {formatDateTime(round.evaluationEndDate || round.endDate)}
                            </span>
                          </div>

                          <div className="p-2.5 bg-[#0e161a] border border-zinc-800/80 rounded space-y-0.5">
                            <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
                              <Megaphone className="w-3 h-3 text-emerald-400" /> Chốt Danh Sách Đội:
                            </span>
                            <span className="text-emerald-300 font-bold block">
                              {formatDateTime(round.resultAnnouncementDate || round.endDate)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 font-mono text-xs">
                          <div className="p-2.5 bg-[#0e161a] border border-zinc-800/80 rounded space-y-0.5">
                            <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
                              <Flame className="w-3 h-3 text-cyan-400" /> Khởi Động &amp; Mở Đề:
                            </span>
                            <span className="text-white font-bold block">{formatDateTime(round.startDate)}</span>
                          </div>

                          <div className="p-2.5 bg-[#0e161a] border border-zinc-800/80 rounded space-y-0.5">
                            <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
                              <Clock className="w-3 h-3 text-cyan-400" /> Hạn Khóa Nộp Bài:
                            </span>
                            <span className="text-cyan-300 font-bold block">
                              {formatDateTime(round.submissionDeadline || round.endDate)}
                            </span>
                          </div>

                          <div className="p-2.5 bg-[#0e161a] border border-zinc-800/80 rounded space-y-0.5">
                            <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
                              <Scale className="w-3 h-3 text-purple-400" /> Hội Đồng Chấm Điểm:
                            </span>
                            <span className="text-purple-300 font-bold block">
                              {formatDateTime(round.evaluationEndDate || round.endDate)}
                            </span>
                          </div>

                          <div className="p-2.5 bg-[#0e161a] border border-zinc-800/80 rounded space-y-0.5">
                            <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
                              <Megaphone className="w-3 h-3 text-emerald-400" /> Công Bố Kết Quả:
                            </span>
                            <span className="text-emerald-300 font-bold block">
                              {formatDateTime(round.resultAnnouncementDate || round.endDate)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Deliverables & Role-Based Direct Action Strip */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800/80 font-mono text-xs">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span>
                            {isRegistration ? "Yêu cầu hồ sơ: " : "Yêu cầu nộp: "}
                            <strong className="text-zinc-200">
                              {isRegistration ? "Hồ sơ đăng ký đội thi (3-5 thành viên) & thẻ sinh viên hợp lệ." : (round.deliverables || "Mã nguồn, Slide thuyết trình & Video demo.")}
                            </strong>
                          </span>
                        </div>

                        {/* Role-Specific Action Button */}
                        {isCurrent && (
                          <div className="self-start sm:self-auto shrink-0">
                            {/* Guest Action */}
                            {roleName === "Guest" && (
                              <Link href={isRegistration ? "/register" : "/login"}>
                                <button className="px-5 py-2.5 bg-[#00d9ff] text-black hover:bg-white hover:shadow-[0_0_20px_rgba(0,217,255,0.4)] rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>{isRegistration ? "Đăng Ký Tham Gia Ngay >" : "Đăng Nhập Để Nộp Bài >"}</span>
                                </button>
                              </Link>
                            )}

                            {/* Student Action */}
                            {roleName === "Student" && (
                              isRegistration ? (
                                user?.isApproved ? (
                                  <Link href={`/my-team?eventId=${eventId}`}>
                                    <button className="px-5 py-2.5 bg-[#00d9ff] text-black hover:bg-white hover:shadow-[0_0_20px_rgba(0,217,255,0.4)] rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                                      <Upload className="w-3.5 h-3.5" />
                                      <span>Đăng Ký Đội Thi Ngay &gt;</span>
                                    </button>
                                  </Link>
                                ) : (
                                  <Link href="/onboarding/profile">
                                    <button className="px-5 py-2.5 bg-amber-500 text-black hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      <span>Cần Cập Nhật Hồ Sơ Để Đăng Ký &gt;</span>
                                    </button>
                                  </Link>
                                )
                              ) : (
                                <Link href="/submissions/new">
                                  <button className="px-5 py-2.5 bg-[#00d9ff] text-black hover:bg-white hover:shadow-[0_0_20px_rgba(0,217,255,0.4)] rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Nộp Bài Vòng Này &gt;</span>
                                  </button>
                                </Link>
                              )
                            )}

                            {/* Judge Action */}
                            {roleName === "Judge" && !isRegistration && (
                              <Link href="/judge/scoring">
                                <button className="px-4 py-2 bg-amber-500 text-black hover:bg-amber-400 rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                                  <Scale className="w-3.5 h-3.5" />
                                  <span>Vào Chấm Điểm Vòng Này &gt;</span>
                                </button>
                              </Link>
                            )}

                            {/* Mentor Action */}
                            {roleName === "Mentor" && (
                              <Link href="/mentor/tracks">
                                <button className="px-4 py-2 bg-teal-500 text-black hover:bg-teal-400 rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                                  <Users className="w-3.5 h-3.5" />
                                  <span>Xem Đội Thi Phụ Trách &gt;</span>
                                </button>
                              </Link>
                            )}

                            {/* Coordinator Action */}
                            {roleName === "Coordinator" && (
                              <Link href={`/coordinator/events/${eventId}`}>
                                <button className="px-4 py-2 bg-purple-950/70 text-purple-300 border border-purple-500/40 hover:bg-purple-900/80 rounded font-bold transition-all cursor-pointer flex items-center gap-1.5">
                                  <Briefcase className="w-3.5 h-3.5" />
                                  <span>Quản Lý Tiến Trình Vòng &gt;</span>
                                </button>
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: CHỦ ĐỀ & HẠNG MỤC THI ĐẤU (HERO SINGLE TRACK SHOWCASE)
           ───────────────────────────────────────────────────────────── */}
        {activeTab === "tracks" && (
          <div className="bg-[#10171a] border border-zinc-800 rounded-lg p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 uppercase tracking-widest font-bold">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  CHỦ ĐỀ &amp; HẠNG MỤC THI ĐẤU CHÍNH
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-white mt-1">
                  Định Hướng Đề Tài &amp; Bài Toán Nghiên Cứu
                </h2>
              </div>

              <span className="px-3 py-1 bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 rounded font-mono text-xs font-bold uppercase self-start sm:self-auto">
                1 Bảng Đấu Trọng Tâm
              </span>
            </div>

            {/* Main Single Track Focus Card */}
            <div className="bg-[#0b1013] border border-cyan-500/30 rounded-lg p-6 space-y-6 shadow-[0_0_20px_rgba(6,182,212,0.05)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
                <div className="space-y-1.5">
                  <span className="px-2.5 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded text-[11px] font-mono font-bold uppercase">
                    BẢNG ĐẤU TOÀN NĂNG (GENERAL TRACK)
                  </span>
                  <h3 className="text-xl sm:text-2xl font-display font-extrabold text-white">
                    {tracks[0] || "Nghiên Cứu & Phát Triển Ứng Dụng RBL Project (Research-Based Learning)"}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-zinc-400 shrink-0">
                  <span className="px-3 py-1.5 bg-[#162228] border border-zinc-700 rounded text-emerald-300 font-bold">
                    Chấm Thi Ẩn Danh 100%
                  </span>
                  <span className="px-3 py-1.5 bg-[#162228] border border-zinc-700 rounded text-amber-300 font-bold">
                    Có Mentor Kèm Cặp
                  </span>
                </div>
              </div>

              <div className="space-y-3 font-sans text-xs sm:text-sm text-zinc-300 leading-relaxed">
                <p>
                  Toàn bộ các đội thi trong giải đấu sẽ cùng tranh tài trong <strong>Hạng mục Dự án Nghiên cứu Ứng dụng RBL</strong>. Thí sinh được tự do lựa chọn đề tài thực tiễn trong đời sống, doanh nghiệp hoặc xã hội để thiết kế, phát triển và thử nghiệm một giải pháp công nghệ hoàn chỉnh.
                </p>
              </div>

              {/* 3 Core Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-[#10171a] border border-zinc-800 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase">
                    <Sparkles className="w-4 h-4" />
                    <span>1. Đổi Mới &amp; Sáng Tạo</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Ý tưởng giải quyết bài toán mới mẻ, cách tiếp cận đột phá và có tính khác biệt so với các sản phẩm sẵn có trên thị trường.
                  </p>
                </div>

                <div className="p-4 bg-[#10171a] border border-zinc-800 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
                    <FileCode className="w-4 h-4" />
                    <span>2. Kiến Trúc &amp; Hoàn Thiện</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Chất lượng mã nguồn, độ ổn định của hệ thống và khả năng vận hành thực tế trong buổi Pitching.
                  </p>
                </div>

                <div className="p-4 bg-[#10171a] border border-zinc-800 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase">
                    <Trophy className="w-4 h-4" />
                    <span>3. Giá Trị Thực Tiễn</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Tính khả thi khi đưa vào vận hành thực tế, giải quyết được nhu cầu của người dùng mục tiêu và tiềm năng ứng dụng lâu dài.
                  </p>
                </div>
              </div>

              {/* Recommended Tech Stacks Tags */}
              <div className="pt-4 border-t border-zinc-800 space-y-2.5">
                <span className="font-mono text-xs text-zinc-400 uppercase tracking-wider block font-bold">
                  Công Nghệ &amp; Chuyên Ngành Khuyến Khích Sử Dụng:
                </span>
                <div className="flex flex-wrap gap-2 font-mono text-xs">
                  <span className="px-3 py-1 bg-purple-950/40 text-purple-300 border border-purple-500/30 rounded">
                    Trí Tuệ Nhân Tạo (AI / Machine Learning / LLM)
                  </span>
                  <span className="px-3 py-1 bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 rounded">
                    Web App &amp; Mobile Development
                  </span>
                  <span className="px-3 py-1 bg-rose-950/40 text-rose-300 border border-rose-500/30 rounded">
                    An Toàn Thông Tin &amp; Phòng Thủ Mạng
                  </span>
                  <span className="px-3 py-1 bg-amber-950/40 text-amber-300 border border-amber-500/30 rounded">
                    IoT &amp; Hệ Thống Nhúng Thông Minh
                  </span>
                  <span className="px-3 py-1 bg-teal-950/40 text-teal-300 border border-teal-500/30 rounded">
                    Cloud Native &amp; Microservices
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 3: CƠ CẤU GIẢI THƯỞNG
           ───────────────────────────────────────────────────────────── */}
        {activeTab === "prizes" && (
          <div className="bg-[#10171a] border border-zinc-800 rounded-lg p-6 md:p-8 space-y-4">
            <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>CƠ CẤU GIẢI THƯỞNG TOÀN GIẢI</span>
            </h2>

            {prizes.length === 0 ? (
              <p className="text-sm text-zinc-400 font-mono">
                Ban Tổ Chức chưa công bố cơ cấu giải thưởng cho sự kiện này.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {prizes.map((p: PrizeItem, idx: number) => (
                  <div
                    key={p.id || idx}
                    className={`bg-[#0b1013] border p-6 rounded-lg space-y-3 text-center ${
                      idx === 0 ? "border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.08)]" : "border-zinc-700"
                    }`}
                  >
                    <h3 className={`font-bold text-sm uppercase ${idx === 0 ? "text-amber-300" : "text-zinc-300"}`}>
                      {p.prizeName}
                    </h3>
                    <div className="text-2xl font-mono font-black text-white">{p.value}</div>
                    {p.quantity > 1 && (
                      <p className="text-xs text-zinc-400">Số lượng: {p.quantity}</p>
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
          <div className="bg-[#10171a] border border-zinc-800 rounded-lg p-6 md:p-8 space-y-4">
            <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-400" />
              <span>THỂ LỆ &amp; QUY ĐỊNH THAM GIA</span>
            </h2>

            <div className="space-y-3 pt-2 font-sans text-xs text-zinc-300 leading-relaxed">
              <div className="p-4 bg-[#0b1013] rounded border border-zinc-800 space-y-1.5">
                <h4 className="font-bold text-white text-sm">1. Điều Kiện Tham Dự</h4>
                <p>Sinh viên các trường đại học/cao đẳng toàn quốc đã hoàn tất xác thực thẻ sinh viên hợp lệ trên hệ thống SEAL.</p>
              </div>

              <div className="p-4 bg-[#0b1013] rounded border border-zinc-800 space-y-1.5">
                <h4 className="font-bold text-white text-sm">2. Quy Định Lập Đội</h4>
                <p>Mỗi đội thi bao gồm từ 3 đến 5 thành viên. Mỗi thí sinh chỉ được ghi danh tham gia trong 1 đội thi duy nhất tại cùng một giải đấu.</p>
              </div>

              <div className="p-4 bg-[#0b1013] rounded border border-zinc-800 space-y-1.5">
                <h4 className="font-bold text-white text-sm">3. Quy Chế Chấm Điểm Ẩn Danh</h4>
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
