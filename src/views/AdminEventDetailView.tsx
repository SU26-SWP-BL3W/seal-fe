"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { ApiMissingDataBadge } from "@/components/ui";
import { useEventDetail } from "@/repositories/eventsRepository";
import { useGetRoundsByEvent } from "@/repositories/events/roundsRepository";
import { useGetTracksByEvent } from "@/repositories/events/tracksRepository";
import { useGetTeamsByEvent } from "@/repositories/teamsRepository";
import { useGetEventRoles, staffRepository } from "@/repositories/staffRepository";
import { Link } from "@/i18n/routing";
import { ComprehensiveEventEditModal } from "@/components/domain/ComprehensiveEventEditModal";
import { RevokeDraftConfirmModal } from "@/components/domain/RevokeDraftConfirmModal";
import { ActivatePublicConfirmModal } from "@/components/domain/ActivatePublicConfirmModal";
import {
  Layers,
  Users,
  ArrowLeft,
  UserCheck,
  RefreshCw,
  FileText,
  Target,
  Scale,
  Lightbulb,
  Search,
  Filter,
} from "lucide-react";

export function AdminEventDetailView() {
  const params = useParams();
  const eventId = (params?.eventId as string) || (params?.id as string) || "";

  const [activeTab, setActiveTab] = useState<"overview" | "rounds" | "tracks" | "staff" | "teams">("overview");
  const [staffRoleFilter, setStaffRoleFilter] = useState<"all" | "judge" | "mentor" | "coordinator">("all");
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [isRevokingDraft, setIsRevokingDraft] = useState(false);
  const [isActivatingPublic, setIsActivatingPublic] = useState(false);
  const [isEmergencyOverrideOpen, setIsEmergencyOverrideOpen] = useState(false);
  const [emergencyEcEmail, setEmergencyEcEmail] = useState("");
  const [isSubmittingEmergency, setIsSubmittingEmergency] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Load Event Detail
  const { data: event, isLoading: _isLoadingEvent, refetch: refetchEvent } = useEventDetail(eventId);

  // Load Rounds
  const { data: rounds = [], isLoading: isLoadingRounds, refetch: refetchRounds } = useGetRoundsByEvent(eventId);
  const roundsList: any[] = Array.isArray(rounds) ? rounds : (rounds as any)?.data ?? [];

  // Load Tracks
  const { data: tracks = [], isLoading: isLoadingTracks, refetch: refetchTracks } = useGetTracksByEvent(eventId);
  const tracksList: any[] = Array.isArray(tracks) ? tracks : (tracks as any)?.data ?? [];

  // Load Teams
  const { data: teams = [], isLoading: isLoadingTeams, refetch: refetchTeams } = useGetTeamsByEvent(eventId);
  const teamsList: any[] = Array.isArray(teams) ? teams : (teams as any)?.data ?? [];

  // Load Staff & Event Roles (Judges, Mentors, Coordinators)
  const { data: rawEventRoles = [], isLoading: isLoadingStaff, refetch: refetchStaff } = useGetEventRoles(eventId);
  const eventRoles: any[] = useMemo(
    () => (Array.isArray(rawEventRoles) ? rawEventRoles : (rawEventRoles as any)?.data ?? []),
    [rawEventRoles]
  );

  const judgesList = useMemo(() => {
    return eventRoles.filter((r) => {
      const name = String(r.roleName ?? r.RoleName ?? "").toLowerCase();
      return name.includes("judge") || name === "1";
    });
  }, [eventRoles]);

  const mentorsList = useMemo(() => {
    return eventRoles.filter((r) => {
      const name = String(r.roleName ?? r.RoleName ?? "").toLowerCase();
      return name.includes("mentor") || name === "2";
    });
  }, [eventRoles]);

  const coordinatorsList = useMemo(() => {
    return eventRoles.filter((r) => {
      const name = String(r.roleName ?? r.RoleName ?? "").toLowerCase();
      return name.includes("coordinator") || name === "0";
    });
  }, [eventRoles]);

  // Filtered Staff
  const filteredStaffList = useMemo(() => {
    return eventRoles.filter((r) => {
      const roleLower = String(r.roleName ?? r.RoleName ?? "").toLowerCase();
      const user = r.user || r.User || {};
      const fullName = (user.fullName || user.FullName || r.fullName || r.FullName || "").toLowerCase();
      const email = (user.email || user.Email || r.email || r.Email || "").toLowerCase();

      // Role Filter
      if (staffRoleFilter === "judge" && !roleLower.includes("judge") && roleLower !== "1") return false;
      if (staffRoleFilter === "mentor" && !roleLower.includes("mentor") && roleLower !== "2") return false;
      if (staffRoleFilter === "coordinator" && !roleLower.includes("coordinator") && roleLower !== "0") return false;

      // Search Filter
      if (staffSearchTerm.trim()) {
        const query = staffSearchTerm.toLowerCase().trim();
        const matchesName = fullName.includes(query);
        const matchesEmail = email.includes(query);
        const trackName = (r.track?.trackName || r.Track?.TrackName || "").toLowerCase();
        const matchesTrack = trackName.includes(query);
        return matchesName || matchesEmail || matchesTrack;
      }

      return true;
    });
  }, [eventRoles, staffRoleFilter, staffSearchTerm]);

  const evName = event?.eventName || (event as any)?.EventName || "Chi Tiết Sự Kiện";
  const season = event?.season || (event as any)?.Season || "Summer";
  const year = event?.year || (event as any)?.Year || 2026;
  const description = event?.description || (event as any)?.Description || "Chưa có mô tả chi tiết cho sự kiện này.";
  const maxTeams = event?.maxTeams || (event as any)?.MaxTeams || 50;
  const isActive = event?.status !== false && (event as any)?.Status !== false;

  const handleRefreshAll = () => {
    refetchEvent();
    refetchRounds();
    refetchTracks();
    refetchTeams();
    refetchStaff();
  };

  const handleAssignEmergencyEc = async () => {
    if (!emergencyEcEmail.trim()) {
      setEmergencyMessage({ text: "Vui lòng nhập Email của Event Coordinator mới.", isError: true });
      return;
    }

    setIsSubmittingEmergency(true);
    setEmergencyMessage(null);

    try {
      await staffRepository.inviteCoordinator({
        eventId,
        email: emergencyEcEmail.trim(),
        fullName: emergencyEcEmail.trim().split("@")[0],
        notes: "Gán khẩn cấp bởi System Admin (Emergency Override)",
      });

      setEmergencyMessage({ text: "Đã chỉ định Event Coordinator mới thành công!", isError: false });
      setIsSubmittingEmergency(false);
      handleRefreshAll();
      setTimeout(() => {
        setIsEmergencyOverrideOpen(false);
      }, 1500);
    } catch (err: any) {
      setIsSubmittingEmergency(false);
      const msg = err?.response?.data?.message || err?.message || "Lỗi khi chỉ định Event Coordinator khẩn cấp.";
      setEmergencyMessage({ text: msg, isError: true });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#090e11] text-[#dde4e6] font-sans py-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500 tracking-widest uppercase">
          <span className="text-red-400 font-bold">SEAL ADMIN</span>
          <span>&gt;</span>
          <Link href="/admin/events" className="hover:text-white transition-colors">
            DANH SÁCH SỰ KIỆN
          </Link>
          <span>&gt;</span>
          <span className="text-white font-bold truncate max-w-xs">{evName}</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-start gap-4">
            <Link href="/admin/events">
              <button
                type="button"
                className="font-mono text-xs border border-zinc-700 hover:border-zinc-500 bg-[#141f23] text-zinc-300 hover:text-white px-3.5 py-2 h-10 flex items-center gap-1.5 cursor-pointer rounded transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Quay Lại
              </button>
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[9px] font-bold bg-red-950/40 text-red-300 border border-red-500/30 rounded uppercase font-mono">
                  {season} {year}
                </span>
                <span
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded font-mono ${
                    isActive
                      ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/40"
                      : "bg-zinc-800/50 text-zinc-400 border border-zinc-700"
                  }`}
                >
                  {isActive ? "● ĐANG MỞ" : "○ TẠM DỪNG"}
                </span>
              </div>
              <h1 className="font-display font-bold text-2xl md:text-3xl text-white uppercase tracking-wider mt-1">
                {evName}
              </h1>
              <p className="font-mono text-[11px] text-zinc-400 mt-0.5">
                Mã định danh hệ thống (ID): {eventId}
              </p>
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex items-center gap-2.5 flex-wrap font-mono">
            {/* Nút Chuyển Đổi Trạng Thái Trực Tiếp */}
            {isActive ? (
              <button
                type="button"
                onClick={() => setIsRevokingDraft(true)}
                className="text-xs border border-amber-500/40 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40 font-bold cursor-pointer h-10 px-4 rounded transition-colors"
                title="Thu hồi sự kiện về bản nháp để tạm khóa và bảo trì"
              >
                THU HỒI VỀ NHÁP
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsActivatingPublic(true)}
                className="text-xs border border-emerald-500/40 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-950/40 font-bold cursor-pointer h-10 px-4 rounded transition-colors"
                title="Kích hoạt mở công khai sự kiện cho toàn hệ thống"
              >
                KÍCH HOẠT CÔNG KHAI
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (isActive) {
                  setIsRevokingDraft(true);
                } else {
                  setIsEditingEvent(true);
                }
              }}
              className="text-xs border border-red-500/40 bg-red-950/20 text-red-300 hover:bg-red-950/40 font-bold cursor-pointer h-10 px-4 rounded transition-colors"
              title={isActive ? "Thu hồi về bản nháp để chỉnh sửa sự kiện" : "Chỉnh sửa thông tin sự kiện, thời gian, vòng thi & hạng mục"}
            >
              SỬA SỰ KIỆN
            </button>

            <Link href={`/admin/events/coordinators?eventId=${eventId}`}>
              <button
                type="button"
                className="text-xs border border-red-500/40 bg-red-950/20 text-red-300 hover:bg-red-950/40 font-bold cursor-pointer h-10 px-4 rounded transition-colors"
                title="Phân công Event Coordinator cho sự kiện này"
              >
                PHÂN CÔNG EC
              </button>
            </Link>

            <button
              type="button"
              onClick={() => {
                setEmergencyMessage(null);
                setEmergencyEcEmail("");
                setIsEmergencyOverrideOpen(true);
              }}
              className="text-xs border border-amber-500/40 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40 font-bold cursor-pointer h-10 px-4 rounded transition-colors"
              title="Can thiệp khẩn cấp: Đổi hoặc gán EC mới cho sự kiện khi EC cũ gặp sự cố"
            >
              CAN THIỆP EC
            </button>

            <Link href={`/coordinator/dashboard?eventId=${eventId}`}>
              <button
                type="button"
                className="text-xs border border-purple-500/40 bg-purple-950/20 text-purple-300 hover:bg-purple-950/40 cursor-pointer h-10 px-4 font-bold rounded transition-colors"
                title="Truy cập giao diện điều phối của sự kiện này"
              >
                GIÁM SÁT EC
              </button>
            </Link>

            <button
              type="button"
              onClick={handleRefreshAll}
              className="text-xs border border-zinc-700 hover:border-zinc-500 bg-[#141f23] cursor-pointer h-10 px-4 text-zinc-300 hover:text-white rounded transition-colors"
              title="Làm mới toàn bộ dữ liệu sự kiện"
            >
              LÀM MỚI
            </button>
          </div>
        </div>

        {/* 5 Tabs Bar */}
        <div className="flex items-center gap-1 border-b border-zinc-800 font-mono text-xs overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 font-bold uppercase transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "overview"
                ? "border-red-500 text-white bg-red-950/30"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            TỔNG QUAN
          </button>

          <button
            onClick={() => setActiveTab("rounds")}
            className={`px-4 py-2.5 font-bold uppercase transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "rounds"
                ? "border-red-500 text-white bg-red-950/30"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            VÒNG THI ({roundsList.length})
          </button>

          <button
            onClick={() => setActiveTab("tracks")}
            className={`px-4 py-2.5 font-bold uppercase transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "tracks"
                ? "border-red-500 text-white bg-red-950/30"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            HẠNG MỤC ({tracksList.length})
          </button>

          <button
            onClick={() => setActiveTab("staff")}
            className={`px-4 py-2.5 font-bold uppercase transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "staff"
                ? "border-red-500 text-white bg-red-950/30"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            HỘI ĐỒNG &amp; CỐ VẤN ({eventRoles.length})
          </button>

          <button
            onClick={() => setActiveTab("teams")}
            className={`px-4 py-2.5 font-bold uppercase transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "teams"
                ? "border-red-500 text-white bg-red-950/30"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            ĐỘI THI ({teamsList.length})
          </button>
        </div>

        {/* Tab 1: Tổng Quan (Overview) */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 bg-[#0f171c] border border-zinc-800 rounded space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase block font-bold tracking-wider">Quy Mô Đội Thi Tối Đa</span>
                <div className="text-xl font-bold text-red-400 flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-500/80" />
                  <span>{maxTeams} Đội</span>
                </div>
              </div>

              <div className="p-4 bg-[#0f171c] border border-zinc-800 rounded space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase block font-bold tracking-wider">Thời Gian Đăng Ký</span>
                <div className="text-sm font-bold text-white">
                  {event?.registrationStartDate
                    ? new Date(event.registrationStartDate).toLocaleDateString("vi-VN")
                    : "TBD"}{" "}
                  —{" "}
                  {event?.registrationEndDate
                    ? new Date(event.registrationEndDate).toLocaleDateString("vi-VN")
                    : "TBD"}
                </div>
              </div>

              <div className="p-4 bg-[#0f171c] border border-zinc-800 rounded space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase block font-bold tracking-wider">Thời Gian Tổ Chức</span>
                <div className="text-sm font-bold text-emerald-400">
                  {event?.startDate ? new Date(event.startDate).toLocaleDateString("vi-VN") : "TBD"} —{" "}
                  {event?.endDate ? new Date(event.endDate).toLocaleDateString("vi-VN") : "TBD"}
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#0f171c] border border-zinc-800 rounded space-y-3">
              <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-400" />
                Mô Tả Thể Lệ Cuộc Thi
              </h3>
              <p className="font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-line bg-[#090e11] p-4 border border-zinc-800 rounded">
                {description}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Vòng Thi (Rounds) */}
        {activeTab === "rounds" && (
          <div className="p-6 bg-[#0f171c] border border-zinc-800 rounded space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-400" />
                Cấu Trúc Các Vòng Thi Đấu ({roundsList.length})
              </h3>
            </div>

            {isLoadingRounds ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 font-mono text-xs text-red-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Đang tải các vòng thi...</span>
              </div>
            ) : roundsList.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-zinc-400">
                Chưa có vòng thi nào được cấu hình cho sự kiện này.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                {roundsList.map((r: any, idx) => (
                  <div
                    key={r.id || idx}
                    className="p-4 bg-[#141f23] border border-zinc-700/80 rounded space-y-2 hover:border-zinc-500 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        Vòng {r.roundNumber || idx + 1}: {r.roundName || r.name || "Vòng thi"}
                      </span>
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-red-950/40 text-red-300 border border-red-500/30 rounded">
                        Vòng {idx + 1}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 space-y-0.5">
                      <div>Thời gian: {r.startDate ? new Date(r.startDate).toLocaleDateString("vi-VN") : "TBD"} - {r.endDate ? new Date(r.endDate).toLocaleDateString("vi-VN") : "TBD"}</div>
                      {r.advancementRule && <div>Quy tắc đi tiếp: {r.advancementRule}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Hạng Mục (Tracks) */}
        {activeTab === "tracks" && (
          <div className="p-6 bg-[#0f171c] border border-zinc-800 rounded space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-red-400" />
                Danh Sách Hạng Mục Thi Đấu &amp; Nhân Sự Phụ Trách ({tracksList.length})
              </h3>
            </div>

            {isLoadingTracks ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 font-mono text-xs text-red-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Đang tải các hạng mục...</span>
              </div>
            ) : tracksList.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-zinc-400">
                Chưa có hạng mục (Track) nào được tạo cho sự kiện này.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                {tracksList.map((t: any, idx) => {
                  const trackId = t.id || t.trackId;
                  const trackJudges = judgesList.filter((j) => (j.trackId || j.TrackId) === trackId);
                  const trackMentors = mentorsList.filter((m) => (m.trackId || m.TrackId) === trackId);

                  return (
                    <div
                      key={trackId || idx}
                      className="p-5 bg-[#141f23] border border-zinc-700/80 rounded space-y-3 hover:border-zinc-500 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">
                          ⬡ {t.trackName || t.name || "Track thi đấu"}
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-red-950/40 text-red-300 border border-red-500/30 rounded uppercase">
                          TRACK {idx + 1}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {t.description || "Chưa có mô tả cho hạng mục này."}
                      </p>

                      {/* Phân công nhân sự của Track */}
                      <div className="pt-2 border-t border-zinc-700/60 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <Scale className="w-3 h-3 text-red-400" /> Giám Khảo ({trackJudges.length}):
                          </span>
                          <span className="font-bold text-white">
                            {trackJudges.length > 0
                              ? trackJudges.map((j) => j.user?.fullName || j.user?.email || j.fullName || "Giám khảo").join(", ")
                              : <span className="text-zinc-500 italic">Chưa phân công</span>}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <Lightbulb className="w-3 h-3 text-amber-400" /> Cố Vấn ({trackMentors.length}):
                          </span>
                          <span className="font-bold text-white">
                            {trackMentors.length > 0
                              ? trackMentors.map((m) => m.user?.fullName || m.user?.email || m.fullName || "Cố vấn").join(", ")
                              : <span className="text-zinc-500 italic">Chưa phân công</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Hội Đồng & Ban Cố Vấn (Staff) */}
        {activeTab === "staff" && (
          <div className="space-y-4 font-mono text-xs">
            {/* 3 Metric Cards for Staff */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[#0f171c] border border-zinc-800 rounded space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase block font-bold tracking-wider">HỘI ĐỒNG GIÁM KHẢO (JUDGES)</span>
                <div className="text-2xl font-bold text-red-400 flex items-center justify-between">
                  <span>{judgesList.length} Người</span>
                  <Scale className="w-5 h-5 text-red-500/70" />
                </div>
              </div>

              <div className="p-4 bg-[#0f171c] border border-zinc-800 rounded space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase block font-bold tracking-wider">BAN CỐ VẤN (MENTORS)</span>
                <div className="text-2xl font-bold text-amber-400 flex items-center justify-between">
                  <span>{mentorsList.length} Người</span>
                  <Lightbulb className="w-5 h-5 text-amber-400/70" />
                </div>
              </div>

              <div className="p-4 bg-[#0f171c] border border-zinc-800 rounded space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase block font-bold tracking-wider">ĐIỀU PHỐI VIÊN (EC)</span>
                <div className="text-2xl font-bold text-purple-400 flex items-center justify-between">
                  <span>{coordinatorsList.length} Người</span>
                  <UserCheck className="w-5 h-5 text-purple-400/70" />
                </div>
              </div>
            </div>

            {/* Filter Toolbelt for Staff */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-[#0f171c] p-3 border border-zinc-800 rounded">
              <div className="flex items-center gap-2 sm:col-span-4">
                <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
                <select
                  value={staffRoleFilter}
                  onChange={(e) => setStaffRoleFilter(e.target.value as any)}
                  className="w-full h-10 px-3 py-2 bg-[#141f23] border border-zinc-700 text-white rounded focus:border-red-500 outline-none"
                >
                  <option value="all">— TẤT CẢ VAI TRÒ ({eventRoles.length}) —</option>
                  <option value="judge">Hội Đồng Giám Khảo ({judgesList.length})</option>
                  <option value="mentor">Ban Cố Vấn ({mentorsList.length})</option>
                  <option value="coordinator">Điều Phối Viên EC ({coordinatorsList.length})</option>
                </select>
              </div>

              <div className="flex items-center gap-2 sm:col-span-8">
                <Search className="w-4 h-4 text-zinc-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhân sự theo tên, email, hạng mục phụ trách..."
                  value={staffSearchTerm}
                  onChange={(e) => setStaffSearchTerm(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-xs bg-[#141f23] border border-zinc-700 focus:border-red-500 text-white rounded outline-none font-mono"
                />
              </div>
            </div>

            {/* Staff Table */}
            <div className="p-6 bg-[#0f171c] border border-zinc-800 rounded space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-400" />
                  Danh Sách Phân Công Nhân Sự Chi Tiết ({filteredStaffList.length})
                </h3>
                <Link href={`/admin/events/coordinators?eventId=${eventId}`}>
                  <button
                    type="button"
                    className="text-xs font-mono text-red-400 hover:text-white bg-red-950/20 hover:bg-red-950/40 border border-red-500/40 px-3 h-8 flex items-center gap-1 cursor-pointer rounded transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Quản Lý Phân Công
                  </button>
                </Link>
              </div>

              {isLoadingStaff ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 font-mono text-xs text-red-400">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Đang tải danh sách nhân sự sự kiện...</span>
                </div>
              ) : filteredStaffList.length === 0 ? (
                <ApiMissingDataBadge
                  endpoint="GET /api/EventRoles/event"
                  title="CHƯA CÓ NHÂN SỰ ĐƯỢC PHÂN CÔNG"
                  message="Chưa có Giám Khảo, Cố Vấn hoặc Điều Phối Viên nào được gán vào sự kiện này."
                />
              ) : (
                <div className="w-full overflow-x-auto border border-zinc-800 bg-[#090e11] rounded">
                  <table className="w-full table-fixed min-w-[850px] text-left border-collapse text-xs">
                    <thead className="bg-[#0c1216] border-b border-zinc-800 text-zinc-400">
                      <tr>
                        <th className="w-[35%] px-4 py-3 text-left uppercase">HỌ TÊN &amp; EMAIL</th>
                        <th className="w-[20%] px-4 py-3 text-left uppercase">VAI TRÒ</th>
                        <th className="w-[25%] px-4 py-3 text-left uppercase">HẠNG MỤC PHỤ TRÁCH</th>
                        <th className="w-[20%] px-4 py-3 text-left uppercase">TRẠNG THÁI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaffList.map((r: any, idx: number) => {
                        const user = r.user || r.User || {};
                        const fullName = user.fullName || user.FullName || r.fullName || "Nhân sự SEAL";
                        const email = user.email || user.Email || r.email || "Chưa có email";
                        const roleName = String(r.roleName ?? r.RoleName ?? "");
                        const trackName = r.track?.trackName || r.Track?.TrackName || "Toàn sự kiện";

                        const isJudge = roleName.toLowerCase().includes("judge") || roleName === "1";
                        const isMentor = roleName.toLowerCase().includes("mentor") || roleName === "2";
                        const isCoordinator = roleName.toLowerCase().includes("coordinator") || roleName === "0";

                        return (
                          <tr key={r.id || idx} className="border-t border-zinc-800/60 hover:bg-white/[0.03] transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-white truncate" title={fullName}>
                                  {fullName}
                                </span>
                                <span className="text-[11px] text-zinc-400 truncate" title={email}>
                                  {email}
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              {isJudge ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-red-950/40 text-red-300 border border-red-500/30 rounded uppercase">
                                  <Scale className="w-3 h-3" /> Giám Khảo (Judge)
                                </span>
                              ) : isMentor ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-950/40 text-amber-300 border border-amber-500/30 rounded uppercase">
                                  <Lightbulb className="w-3 h-3" /> Cố Vấn (Mentor)
                                </span>
                              ) : isCoordinator ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-purple-950/40 text-purple-300 border border-purple-500/30 rounded uppercase">
                                  <UserCheck className="w-3 h-3" /> Điều Phối (EC)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-zinc-800/50 text-zinc-400 border border-zinc-700 rounded uppercase">
                                  {roleName}
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <span className="font-bold text-white flex items-center gap-1">
                                ⬡ {trackName}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 rounded uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                ĐÃ GÁN
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Đội Thi Đăng Ký (Teams) */}
        {activeTab === "teams" && (
          <div className="p-6 bg-[#0f171c] border border-zinc-800 rounded space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-red-400" />
                Danh Sách Đội Thi Tham Gia ({teamsList.length})
              </h3>
            </div>

            {isLoadingTeams ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 font-mono text-xs text-red-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Đang tải danh sách đội thi...</span>
              </div>
            ) : teamsList.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-zinc-400">
                Chưa có đội thi nào đăng ký tham gia sự kiện này.
              </div>
            ) : (
              <div className="w-full overflow-x-auto border border-zinc-800 bg-[#090e11] rounded">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead className="bg-[#0c1216] border-b border-zinc-800 text-zinc-400">
                    <tr>
                      <th className="px-4 py-3 text-left uppercase">TÊN ĐỘI THI</th>
                      <th className="px-4 py-3 text-left uppercase">HẠNG MỤC (TRACK)</th>
                      <th className="px-4 py-3 text-left uppercase">THÀNH VIÊN</th>
                      <th className="px-4 py-3 text-left uppercase">TRẠNG THÁI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamsList.map((tm: any, idx) => (
                      <tr key={tm.id || idx} className="border-t border-zinc-800/60 hover:bg-white/[0.03]">
                        <td className="px-4 py-3 font-bold text-white">
                          {tm.name || tm.teamName || "Đội thi"}
                        </td>
                        <td className="px-4 py-3 text-red-400 font-bold">
                          {tm.trackName ? `⬡ ${tm.trackName}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {tm.memberCount || tm.members?.length || 1} thành viên
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 rounded uppercase">
                            {tm.status || "Registered"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {/* Modal Xác Nhận Kích Hoạt Công Khai Sự Kiện */}
        {isActivatingPublic && event && (
          <ActivatePublicConfirmModal
            event={event}
            onClose={() => setIsActivatingPublic(false)}
            onConfirmSuccess={handleRefreshAll}
          />
        )}

        {/* Modal Xác Nhận Thu Hồi Về Bản Nháp Cho Admin */}
        {isRevokingDraft && event && (
          <RevokeDraftConfirmModal
            event={event}
            onClose={() => setIsRevokingDraft(false)}
            onConfirmSuccess={(_updatedEvent) => {
              handleRefreshAll();
              setIsRevokingDraft(false);
            }}
          />
        )}

        {/* Modal Chỉnh Sửa Toàn Diện Sự Kiện Cho Admin */}
        {isEditingEvent && event && (
          <ComprehensiveEventEditModal
            event={event}
            onClose={() => setIsEditingEvent(false)}
            onSuccess={() => {
              handleRefreshAll();
              setIsEditingEvent(false);
            }}
          />
        )}

        {/* Modal Can Thiệp EC Khẩn Cấp (Admin Emergency Override) */}
        {isEmergencyOverrideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono text-xs">
            <div className="bg-[#0f171c] border border-amber-500/40 p-6 max-w-lg w-full space-y-4 hud-clipped shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-400" />
                  <span className="font-bold text-sm text-white uppercase tracking-wider">
                    CAN THIỆP KHẨN CẤP: CHỈ ĐỊNH EC
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEmergencyOverrideOpen(false)}
                  className="text-zinc-500 hover:text-white cursor-pointer font-bold"
                >
                  [X]
                </button>
              </div>

              <div className="space-y-3 font-sans text-xs text-zinc-300">
                <p className="text-zinc-400">
                  Sử dụng tính năng này khi tài khoản Event Coordinator (EC) phụ trách sự kiện bị khóa hoặc gặp sự cố bất khả kháng.
                </p>

                <div className="space-y-1 font-mono">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase block">
                    EMAIL EVENT COORDINATOR MỚI:
                  </label>
                  <input
                    type="email"
                    value={emergencyEcEmail}
                    onChange={(e) => setEmergencyEcEmail(e.target.value)}
                    placeholder="coordinator@fpt.edu.vn"
                    className="w-full px-3 py-2 bg-[#141f23] border border-zinc-700 focus:border-amber-500 text-white rounded outline-none"
                  />
                </div>

                {emergencyMessage && (
                  <div
                    className={`p-2.5 rounded font-mono text-[11px] border ${
                      emergencyMessage.isError
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    }`}
                  >
                    {emergencyMessage.text}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800 font-mono">
                <button
                  type="button"
                  disabled={isSubmittingEmergency}
                  onClick={() => setIsEmergencyOverrideOpen(false)}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-bold uppercase text-xs rounded transition-all cursor-pointer"
                >
                  [HỦY BỎ]
                </button>

                <button
                  type="button"
                  disabled={isSubmittingEmergency}
                  onClick={handleAssignEmergencyEc}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold uppercase text-xs rounded transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-amber-600/30"
                >
                  {isSubmittingEmergency ? "ĐANG XỬ LÝ..." : "[XÁC NHẬN CHỈ ĐỊNH EC]"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminEventDetailView;
