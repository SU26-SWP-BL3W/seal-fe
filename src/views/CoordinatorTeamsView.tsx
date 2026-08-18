"use client";

import { useState } from "react";
import {
  useGetPendingTeams,
  useApproveTeamRegistration,
  useRejectTeamRegistration,
  useGetTeamsByEvent,
  useGetTeamById,
  useDisqualifyTeam,
} from "@/repositories/teamsRepository";
import { useEvents, useMyEvents } from "@/repositories/eventsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { useAuth } from "@/providers/AuthProvider";
import { Button, Card, Badge, Input, ApiMissingDataBadge } from "@/components/ui";
import {
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  Crown,
  Filter,
  Search,
  Mail,
  GraduationCap,
  Layers,
  Ban,
} from "lucide-react";
import type { TeamEntity } from "@/models/entities";
import { StudentProfileModal } from "@/components/domain/StudentProfileModal";

function pickId(item: any): string {
  return item?.id || item?.Id || item?.eventId || item?.EventId || item?.TeamId || item?.teamId || "";
}

// Modal component that automatically fetches full member list from /api/Teams/{id}
function TeamDetailModal({
  team,
  onClose,
  onApprove,
  onReject,
  isApproving,
}: {
  team: any;
  onClose: () => void;
  onApprove: (teamId: string) => void;
  onReject: (team: any) => void;
  isApproving: boolean;
}) {
  const teamId = pickId(team);
  const { data: detailData, isLoading } = useGetTeamById(teamId);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  const teamDetail = detailData || team;
  const members = teamDetail.members || teamDetail.Members || [];
  const teamName = teamDetail.teamName || teamDetail.TeamName || teamDetail.name || teamDetail.Name || "Đội thi";
  const desc = teamDetail.description || teamDetail.Description || "Dự án phát triển giải pháp công nghệ SEAL Hackathon.";

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
        onClick={onClose}
      >
        <Card
          className="w-full max-w-2xl p-6 bg-[var(--bg-panel)] hud-clipped border-[var(--accent-team)] space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-4">
            <div>
              <span className="font-mono text-[10px] text-[var(--accent-team)] uppercase font-bold tracking-widest">
                THÔNG TIN CHI TIẾT ĐỘI THI
              </span>
              <h3 className="font-display text-xl font-bold text-[var(--text-primary)] uppercase tracking-wider mt-0.5">
                {teamName}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 border border-[var(--border-muted)] hover:border-white text-[var(--text-muted)] hover:text-white rounded cursor-pointer font-mono"
            >
              ✕
            </button>
          </div>

          {/* Project Abstract */}
          <div className="p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped space-y-1">
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase block font-bold">
              Mô tả đề tài / Giải pháp dự thi:
            </span>
            <p className="text-xs text-[var(--text-primary)] leading-relaxed font-mono">{desc}</p>
          </div>

          {/* Members List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[var(--accent-team)]" />
                DANH SÁCH THÀNH VIÊN ({members.length})
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                Bấm vào thành viên để kiểm tra Thẻ SV
              </span>
            </div>

            {isLoading ? (
              <div className="p-6 text-center font-mono text-xs text-[var(--text-muted)] animate-pulse">
                Đang nạp dữ liệu thành viên...
              </div>
            ) : members.length === 0 ? (
              <div className="p-4 text-center font-mono text-xs text-[var(--text-muted)] bg-[var(--bg-input)] border border-[var(--border-muted)]">
                Chưa có dữ liệu thành viên
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                {members.map((m: any, idx: number) => {
                  const isLeader = m.roleName === "TeamLeader" || m.RoleName === "TeamLeader" || idx === 0;
                  const uName = m.fullName || m.FullName || m.user?.fullName || "Thí sinh";
                  const uEmail = m.email || m.Email || m.user?.email || "Chưa có email";
                  const uCode = m.studentCode || m.StudentCode || m.user?.studentCode || "—";
                  const uSchool = m.schoolName || m.SchoolName || m.user?.schoolName || "Đại học FPT";

                  return (
                    <div
                      key={m.userId || m.UserId || idx}
                      onClick={() =>
                        setSelectedMember({
                          id: m.userId || m.UserId || "",
                          fullName: uName,
                          email: uEmail,
                          schoolName: uSchool,
                          studentCode: uCode,
                          photoStudentCardUrl: m.photoStudentCardUrl || m.user?.photoStudentCardUrl || "",
                          rejectionCount: m.rejectionCount || 0,
                        })
                      }
                      className="p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] hover:border-[var(--accent-primary)] cursor-pointer transition-all hud-clipped space-y-1 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] truncate">
                          {uName}
                        </span>
                        {isLeader && (
                          <span className="px-1.5 py-0.5 text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded flex items-center gap-1 font-bold">
                            <Crown className="w-2.5 h-2.5" /> TRƯỞNG NHÓM
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 shrink-0 text-[var(--accent-coordinator)]" /> {uEmail}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between pt-1 border-t border-[var(--border-muted)]/50">
                        <span className="truncate flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-purple-400" /> {uSchool}
                        </span>
                        <span className="text-[var(--accent-team)] font-bold">MSSV: {uCode}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions Bottom */}
          <div className="flex items-center justify-end gap-3 border-t border-[var(--border-muted)] pt-4 font-mono text-xs">
            <Button variant="ghost" onClick={onClose} className="border border-[var(--border-muted)] font-mono text-xs cursor-pointer">
              Đóng
            </Button>
            {String(team.displayStatus).includes("Pending") && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => onReject(team)}
                  className="border border-[var(--color-danger)]/50 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 font-mono text-xs cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" /> Từ Chối
                </Button>
                <Button
                  variant="primary"
                  onClick={() => onApprove(teamId)}
                  disabled={isApproving}
                  className="bg-[var(--color-success)] text-white font-bold hover:bg-[var(--color-success)]/80 font-mono text-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt Đội Thi
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Profile Verification Modal from inside Member Click */}
      {selectedMember && (
        <StudentProfileModal
          user={selectedMember}
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          onApprove={() => setSelectedMember(null)}
          onReject={() => setSelectedMember(null)}
        />
      )}
    </>
  );
}

export function CoordinatorTeamsView() {
  const { user: currentUser } = useAuth();
  const [rejectModal, setRejectModal] = useState<{ teamId: string; teamName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [disqualifyModal, setDisqualifyModal] = useState<{ teamId: string; teamName: string } | null>(null);
  const [disqualifyReason, setDisqualifyReason] = useState("");
  const [detailModal, setDetailModal] = useState<TeamEntity | null>(null);
  const [eventId, setEventId] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [tabFilter, setTabFilter] = useState<"all" | "pending" | "registered">("all");

  const { data: myEvents = [] } = useMyEvents();
  const { data: rawAllEvents = [] } = useEvents();
  const allEvents = Array.isArray(rawAllEvents) ? rawAllEvents : (rawAllEvents as any)?.data ?? [];
  const eventsList = (currentUser?.isAdmin || currentUser?.IsAdmin)
    ? allEvents
    : myEvents;

  const { data: rawTracks = [] } = useGetTracksByEvent(eventId || undefined);
  const tracksList = Array.isArray(rawTracks) ? rawTracks : (rawTracks as any)?.data ?? [];

  const { data: rawPendingTeams = [], isLoading: isLoadingPending, refetch: refetchPending } = useGetPendingTeams();
  const pendingTeams: TeamEntity[] = Array.isArray(rawPendingTeams)
    ? rawPendingTeams
    : (rawPendingTeams as any)?.data ?? [];

  const { data: registeredTeams = [], isLoading: isLoadingRegistered, refetch: refetchRegistered } = useGetTeamsByEvent(eventId);

  const { mutateAsync: approveTeam, isPending: isApproving } = useApproveTeamRegistration();
  const { mutateAsync: rejectTeam, isPending: isRejecting } = useRejectTeamRegistration();
  const { mutateAsync: disqualifyTeam, isPending: isDisqualifying } = useDisqualifyTeam();

  const handleEventChange = (newEvId: string) => {
    setEventId(newEvId);
    setSelectedTrackId("");
  };

  const handleApprove = async (teamId: string) => {
    try {
      await approveTeam(teamId);
      alert("Đã duyệt đội thi thành công!");
      setDetailModal(null);
      refetchPending();
      refetchRegistered();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Duyệt đội thi thất bại.");
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await rejectTeam({ teamId: rejectModal.teamId, reason: rejectReason.trim() || "Chưa đạt yêu cầu" });
      alert("Đã từ chối đăng ký đội thi.");
      refetchPending();
      refetchRegistered();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Từ chối đăng ký đội thi thất bại.");
    } finally {
      setRejectModal(null);
      setDetailModal(null);
      setRejectReason("");
    }
  };

  const handleDisqualify = async () => {
    if (!disqualifyModal || !disqualifyReason.trim()) return;
    try {
      await disqualifyTeam({ teamId: disqualifyModal.teamId, reason: disqualifyReason.trim() });
      alert("Đã loại đội thi khỏi giải.");
      refetchPending();
      refetchRegistered();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Loại đội thi thất bại.");
    } finally {
      setDisqualifyModal(null);
      setDetailModal(null);
      setDisqualifyReason("");
    }
  };

  const allCombinedTeams = [
    ...pendingTeams.map((t) => ({ ...t, displayStatus: "PendingApproval" })),
    ...registeredTeams
      .filter((r) => !pendingTeams.some((p) => pickId(p) === pickId(r)))
      .map((t) => ({ ...t, displayStatus: t.status || t.Status || "Registered" })),
  ];

  const filteredTeams = allCombinedTeams.filter((t: any) => {
    const status = String(t.displayStatus || "").toLowerCase();
    if (tabFilter === "pending" && !status.includes("pending") && status !== "0") return false;
    if (tabFilter === "registered" && !status.includes("registered") && !status.includes("approved") && status !== "1") return false;

    if (selectedTrackId) {
      const tTrackId = t.trackId || t.TrackId || "";
      if (tTrackId !== selectedTrackId) return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const name = (t.teamName || t.TeamName || t.name || t.Name || "").toLowerCase();
      const trackName = (t.trackName || t.TrackName || t.track?.trackName || "").toLowerCase();
      return name.includes(term) || trackName.includes(term);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase">
          <span className="text-[var(--color-danger)] font-bold">SEAL SYSTEM</span>
          <span>&gt;</span>
          <span className="text-[var(--text-primary)] font-bold">QUẢN LÝ ĐỘI THI &amp; THÍ SINH</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-muted)] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-team)] animate-pulse" />
              <span className="font-mono text-[10px] text-[var(--accent-team)] font-bold tracking-widest uppercase">
                TEAMS &amp; CONTESTANTS DIRECTORY
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] uppercase tracking-wider mt-1 flex items-center gap-2.5">
              <Users className="w-6 h-6 text-[var(--accent-team)]" />
              Danh Sách Đội Thi &amp; Thông Tin Thí Sinh
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
              Tra cứu thông tin chi tiết từng thành viên, trường học, MSSV và kiểm tra trạng thái duyệt đội thi.
            </p>
          </div>

          <Button
            variant="ghost"
            onClick={() => {
              refetchPending();
              refetchRegistered();
            }}
            className="font-mono text-xs border border-[var(--border-muted)] flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Làm Mới
          </Button>
        </div>

        {/* Filter Bar with Event & Track dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-[var(--bg-panel)] p-3 border border-[var(--border-muted)] hud-clipped font-mono text-xs">
          <div className="flex items-center gap-2 sm:col-span-4">
            <Filter className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <select
              value={eventId}
              onChange={(e) => handleEventChange(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] hud-clipped"
            >
              <option value="">— Tất Cả Sự Kiện ({eventsList.length}) —</option>
              {eventsList.map((ev: any) => {
                const id = pickId(ev);
                return (
                  <option key={id} value={id}>
                    {ev.eventName || ev.EventName || id}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center gap-2 sm:col-span-4">
            <Layers className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <select
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
              disabled={!eventId || tracksList.length === 0}
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] hud-clipped disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {!eventId
                  ? "— Chọn Sự Kiện Để Lọc Hạng Mục —"
                  : tracksList.length === 0
                    ? "— Sự Kiện Chưa Có Hạng Mục —"
                    : `— Tất Cả Hạng Mục (${tracksList.length}) —`}
              </option>
              {tracksList.map((tr: any) => {
                const trId = tr.id || tr.Id || tr.trackId || tr.TrackId;
                const trName = tr.trackName || tr.TrackName || "Hạng mục";
                return (
                  <option key={trId} value={trId}>
                    {trName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center gap-2 sm:col-span-4">
            <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên đội, hạng mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs"
            />
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-[var(--border-muted)] gap-2 font-mono text-xs">
          <button
            onClick={() => setTabFilter("all")}
            className={`pb-2 px-3 border-b-2 font-bold cursor-pointer transition-colors ${tabFilter === "all"
                ? "border-[var(--color-danger)] text-white"
                : "border-transparent text-[var(--text-muted)] hover:text-white"
              }`}
          >
            TẤT CẢ ĐỘI THI ({allCombinedTeams.length})
          </button>
          <button
            onClick={() => setTabFilter("registered")}
            className={`pb-2 px-3 border-b-2 font-bold cursor-pointer transition-colors ${tabFilter === "registered"
                ? "border-[var(--color-success)] text-[var(--color-success)]"
                : "border-transparent text-[var(--text-muted)] hover:text-white"
              }`}
          >
            ĐÃ DUYỆT CHÍNH THỨC ({allCombinedTeams.filter((t) => String(t.displayStatus).includes("Registered") || String(t.displayStatus).includes("Approved") || t.displayStatus === 1).length})
          </button>
          <button
            onClick={() => setTabFilter("pending")}
            className={`pb-2 px-3 border-b-2 font-bold cursor-pointer transition-colors ${tabFilter === "pending"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-[var(--text-muted)] hover:text-white"
              }`}
          >
            CHỜ DUYỆT ({allCombinedTeams.filter((t) => String(t.displayStatus).includes("Pending") || t.displayStatus === 0).length})
          </button>
        </div>

        {/* Teams Table */}
        <Card className="p-6 bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)]">
          {isLoadingPending || isLoadingRegistered ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 font-mono text-xs text-[var(--accent-team)]">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>Đang tải danh sách đội thi...</span>
            </div>
          ) : filteredTeams.length === 0 ? (
            <ApiMissingDataBadge
              endpoint="GET /api/Teams"
              title="CHƯA CÓ ĐỘI THI NÀO PHÙ HỢP"
              message="Không tìm thấy đội thi nào theo bộ lọc sự kiện, hạng mục hoặc từ khóa tìm kiếm."
            />
          ) : (
            <div className="w-full overflow-x-auto border border-[var(--border-muted)] bg-[var(--bg-input)] hud-clipped">
              <table className="w-full table-fixed min-w-[850px] text-left border-collapse font-mono text-xs">
                <thead className="bg-[var(--bg-panel)] border-b border-[var(--border-muted)]">
                  <tr>
                    <th className="w-[35%] px-4 py-3.5 text-left text-[var(--text-muted)] uppercase tracking-wider">
                      TÊN ĐỘI THI
                    </th>
                    <th className="w-[20%] px-4 py-3.5 text-left text-[var(--text-muted)] uppercase tracking-wider">
                      SĨ SỐ THÀNH VIÊN
                    </th>
                    <th className="w-[20%] px-4 py-3.5 text-left text-[var(--text-muted)] uppercase tracking-wider">
                      TRẠNG THÁI DUYỆT
                    </th>
                    <th className="w-[25%] px-4 py-3.5 text-right text-[var(--text-muted)] uppercase tracking-wider">
                      THAO TÁC
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((team: any, idx: number) => {
                    const teamId = pickId(team) || `team-${idx}`;
                    const teamName = team.teamName || team.TeamName || team.name || team.Name || "Đội thi";
                    const trackName = team.trackName || team.TrackName || team.track?.trackName;
                    const members = team.members ?? [];
                    const isPending = String(team.displayStatus).includes("Pending") || team.displayStatus === 0;
                    const isDisqualified = String(team.displayStatus).includes("Disqualified") || team.displayStatus === 2;

                    return (
                      <tr key={teamId} className="hover:bg-[var(--accent-team)]/5 transition-colors border-t border-[var(--border-muted)]/50">
                        <td className="px-4 py-3.5 align-middle font-bold text-[var(--text-primary)] truncate" title={teamName}>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[var(--accent-team)] shrink-0" />
                              <span className="truncate">{teamName}</span>
                            </div>
                            {trackName && (
                              <span className="text-[10px] font-mono text-cyan-400/90 pl-4 truncate">
                                ⬡ {trackName}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[var(--text-muted)]">
                          <span className="font-bold text-[var(--text-primary)]">{members.length || team.memberCount || "3"}</span> thành viên
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase rounded ${isDisqualified
                                ? "bg-[var(--color-danger)]/15 text-[var(--color-danger)] border border-[var(--color-danger)]/30"
                                : !isPending
                                  ? "bg-[rgba(16,185,129,0.15)] text-[var(--color-success)] border border-[var(--color-success)]/30"
                                  : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              }`}
                          >
                            {isDisqualified ? "✗ BỊ LOẠI" : !isPending ? "✓ ĐÃ DUYỆT" : "● CHỜ DUYỆT"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-right">
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <Button
                              variant="ghost"
                              onClick={() => setDetailModal(team)}
                              className="text-xs font-mono border border-[var(--accent-primary)]/50 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 px-2.5 py-1 h-auto flex items-center gap-1 cursor-pointer"
                              title="Xem chi tiết danh sách thành viên thí sinh"
                            >
                              <Eye className="w-3.5 h-3.5" /> Xem Thành Viên
                            </Button>

                            {isPending && (
                              <>
                                <Button
                                  variant="ghost"
                                  onClick={() => setRejectModal({ teamId, teamName })}
                                  className="text-xs font-mono border border-[var(--color-danger)]/50 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 px-2.5 py-1 h-auto flex items-center gap-1 cursor-pointer"
                                  title="Từ chối đăng ký đội thi"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Từ Chối
                                </Button>
                                <Button
                                  variant="primary"
                                  onClick={() => handleApprove(teamId)}
                                  disabled={isApproving}
                                  className="text-xs font-mono bg-[var(--color-success)] text-black font-bold hover:bg-emerald-400 px-2.5 py-1 h-auto flex items-center gap-1 cursor-pointer"
                                  title="Duyệt đội thi chính thức vào giải"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt
                                </Button>
                              </>
                            )}

                            {!isPending && !isDisqualified && (
                              <Button
                                variant="ghost"
                                onClick={() => setDisqualifyModal({ teamId, teamName })}
                                className="text-xs font-mono border border-[var(--color-danger)]/50 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 px-2.5 py-1 h-auto flex items-center gap-1 cursor-pointer"
                                title="Loại đội thi khỏi giải vì vi phạm quy chế"
                              >
                                <Ban className="w-3.5 h-3.5" /> Loại Đội
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

        {/* Modal Chi Tiết Đội Thi */}
        {detailModal && (
          <TeamDetailModal
            team={detailModal}
            onClose={() => setDetailModal(null)}
            onApprove={handleApprove}
            onReject={(team) => {
              const tId = pickId(team);
              const tName = team.teamName || team.TeamName || team.name || team.Name || "Đội thi";
              setRejectModal({ teamId: tId, teamName: tName });
            }}
            isApproving={isApproving}
          />
        )}

        {/* Modal Từ Chối */}
        {rejectModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in">
            <Card className="w-full max-w-md p-6 bg-[var(--bg-panel)] hud-clipped border-[var(--color-danger)] space-y-4 shadow-2xl">
              <div className="flex items-center gap-2 text-[var(--color-danger)]">
                <XCircle className="w-5 h-5" />
                <h3 className="font-display text-base font-bold uppercase">
                  Từ Chối Đăng Ký — {rejectModal.teamName}
                </h3>
              </div>

              <p className="font-mono text-xs text-[var(--text-muted)]">
                Vui lòng nhập lý do từ chối để hệ thống gửi thông báo cho đội trưởng.
              </p>

              <div className="space-y-1.5 font-mono text-xs">
                <label className="text-[10px] text-[var(--text-muted)] uppercase">Lý do từ chối:</label>
                <Input
                  type="text"
                  placeholder="e.g. Sĩ số chưa đủ, thông tin thẻ SV không hợp lệ..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-muted)]">
                <Button variant="ghost" onClick={() => setRejectModal(null)} className="text-xs font-mono">
                  Hủy Bỏ
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="text-xs font-mono bg-[var(--color-danger)] text-white font-bold cursor-pointer"
                >
                  Xác Nhận Từ Chối
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Modal Loại Đội */}
        {disqualifyModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in">
            <Card className="w-full max-w-md p-6 bg-[var(--bg-panel)] hud-clipped border-[var(--color-danger)] space-y-4 shadow-2xl">
              <div className="flex items-center gap-2 text-[var(--color-danger)]">
                <Ban className="w-5 h-5" />
                <h3 className="font-display text-base font-bold uppercase">
                  Loại Đội Thi — {disqualifyModal.teamName}
                </h3>
              </div>

              <p className="font-mono text-xs text-[var(--text-muted)]">
                Đội sẽ bị loại khỏi giải, mọi bài nộp hiện có bị vô hiệu hoá và không thể nộp bài mới. Hành động này chỉ áp dụng cho đội đang ở trạng thái Đã Duyệt và không thể tự hoàn tác.
              </p>

              <div className="space-y-1.5 font-mono text-xs">
                <label className="text-[10px] text-[var(--text-muted)] uppercase">Lý do loại đội (bắt buộc):</label>
                <Input
                  type="text"
                  placeholder="e.g. Vi phạm quy chế thi, gian lận bài nộp..."
                  value={disqualifyReason}
                  onChange={(e) => setDisqualifyReason(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-muted)]">
                <Button variant="ghost" onClick={() => setDisqualifyModal(null)} className="text-xs font-mono">
                  Hủy Bỏ
                </Button>
                <Button
                  onClick={handleDisqualify}
                  disabled={isDisqualifying || !disqualifyReason.trim()}
                  className="text-xs font-mono bg-[var(--color-danger)] text-white font-bold cursor-pointer"
                >
                  Xác Nhận Loại Đội
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
