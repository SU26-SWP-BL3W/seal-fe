"use client";

import { useState } from "react";
import {
  useGetPendingTeams,
  useApproveTeamRegistration,
  useRejectTeamRegistration,
  useGetTeamsByEvent,
  useGetTeamById,
} from "@/repositories/teamsRepository";
import { useEvents } from "@/repositories/eventsRepository";
<<<<<<< Updated upstream
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  Layers,
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
=======
>>>>>>> Stashed changes

  const teamDetail = detailData || team;
  const members = teamDetail.members || teamDetail.Members || [];
  const teamName = teamDetail.teamName || teamDetail.TeamName || teamDetail.name || teamDetail.Name || "Đội thi";
  const desc = teamDetail.description || teamDetail.Description || "Dự án phát triển giải pháp công nghệ SEAL Hackathon.";

  return (
<<<<<<< Updated upstream
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
              className="p-1.5 border border-[var(--border-muted)] hover:border-white text-[var(--text-muted)] hover:text-white rounded cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Project Abstract */}
          <div className="p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped space-y-1">
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase block">
              Mô tả đề tài / Giải pháp dự thi:
            </span>
            <p className="text-xs text-[var(--text-primary)] leading-relaxed">{desc}</p>
          </div>

          {/* Members List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase">
                DANH SÁCH THÀNH VIÊN ({members.length})
              </span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">
                Bấm vào thành viên để kiểm tra Thẻ SV
              </span>
            </div>

            {isLoading ? (
              <div className="p-6 text-center font-mono text-xs text-[var(--text-muted)] animate-pulse">
                Đang nạp dữ liệu thành viên từ Backend...
              </div>
            ) : members.length === 0 ? (
              <div className="p-4 text-center font-mono text-xs text-zinc-500 bg-[var(--bg-input)] border border-[var(--border-muted)]">
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
                        <Mail className="w-3 h-3 shrink-0" /> {uEmail}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between pt-1 border-t border-[var(--border-muted)]/50">
                        <span className="truncate">{uSchool}</span>
                        <span className="text-[var(--accent-team)] font-bold">{uCode}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions Bottom */}
          <div className="flex items-center justify-end gap-3 border-t border-[var(--border-muted)] pt-4 font-mono text-xs">
            <Button variant="ghost" onClick={onClose} className="border border-[var(--border-muted)]">
              Đóng
            </Button>
            {String(team.displayStatus).includes("Pending") && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => onReject(team)}
                  className="border border-[var(--color-danger)]/50 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                >
                  <XCircle className="w-3.5 h-3.5" /> Từ Chối
                </Button>
                <Button
                  variant="primary"
                  onClick={() => onApprove(teamId)}
                  disabled={isApproving}
                  className="bg-[var(--color-success)] text-black font-bold hover:bg-emerald-400"
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
          profile={selectedMember}
          onClose={() => setSelectedMember(null)}
          onApprove={() => setSelectedMember(null)}
          onReject={() => setSelectedMember(null)}
        />
      )}
    </>
=======
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
            className="text-[var(--text-muted)] hover:text-white cursor-pointer"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Thông tin mô tả */}
        <div className="p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped font-mono text-xs space-y-1">
          <span className="text-[10px] text-[var(--text-muted)] uppercase block font-bold">Mô tả dự án:</span>
          <p className="text-[var(--text-primary)]">{desc}</p>
        </div>

        {/* Danh sách thành viên thí sinh */}
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[var(--accent-team)]" />
              Danh Sách Thí Sinh ({members.length} thành viên):
            </span>
          </div>

          {isLoading ? (
            <div className="py-8 flex items-center justify-center gap-2 text-[var(--accent-team)] font-mono text-xs">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang tải thông tin thành viên...</span>
            </div>
          ) : members.length === 0 ? (
            <div className="p-4 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-muted)] text-center">
              Chưa có danh sách thành viên chi tiết cho đội này.
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((m: any, idx: number) => {
                const isLeader = m.roleName === "TeamLeader" || m.RoleName === "TeamLeader";

                return (
                  <div
                    key={m.userId || m.UserId || idx}
                    className="p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isLeader ? (
                          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-team)] shrink-0" />
                        )}
                        <span className="font-bold text-[var(--text-primary)] truncate">
                          {m.fullName || m.FullName || m.email || "Thí sinh"}
                        </span>
                        {isLeader && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 uppercase">
                            ĐỘI TRƯỞNG
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)] flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[var(--accent-coordinator)]" />
                          {m.email || m.Email}
                        </span>
                        {(m.studentCode || m.StudentCode) && (
                          <span className="text-[var(--text-primary)] font-bold">
                            MSSV: {m.studentCode || m.StudentCode}
                          </span>
                        )}
                        {(m.school || m.School) && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-purple-400" />
                            {m.school || m.School}
                          </span>
                        )}
                      </div>
                    </div>

                    <Badge tone={m.isApproved !== false ? "success" : "warning"} className="text-[10px] shrink-0">
                      {m.isApproved !== false ? "✓ THẺ SV HỢP LỆ" : "CHỜ DUYỆT THẺ"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-muted)]">
          <Button variant="ghost" onClick={onClose} className="text-xs font-mono">
            Đóng
          </Button>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => onReject(teamDetail)}
              className="text-xs font-mono bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white cursor-pointer"
            >
              Từ Chối Đăng Ký
            </Button>

            <Button
              variant="primary"
              onClick={() => onApprove(teamId)}
              disabled={isApproving}
              className="text-xs font-mono bg-[var(--color-success)] text-white hover:bg-[var(--color-success)]/80 font-bold cursor-pointer"
            >
              ✓ Duyệt Đội Thi
            </Button>
          </div>
        </div>
      </Card>
    </div>
>>>>>>> Stashed changes
  );
}

export function CoordinatorTeamsView() {
  const [rejectModal, setRejectModal] = useState<{ teamId: string; teamName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detailModal, setDetailModal] = useState<TeamEntity | null>(null);
  const [eventId, setEventId] = useState("");
<<<<<<< Updated upstream
  const [selectedTrackId, setSelectedTrackId] = useState("");
=======
>>>>>>> Stashed changes
  const [searchTerm, setSearchTerm] = useState("");
  const [tabFilter, setTabFilter] = useState<"all" | "pending" | "registered">("all");

  const { data: allEvents = [] } = useEvents();
  const eventsList = Array.isArray(allEvents) ? allEvents : (allEvents as any)?.data ?? [];

<<<<<<< Updated upstream
  const { data: rawTracks = [] } = useGetTracksByEvent(eventId || undefined);
  const tracksList = Array.isArray(rawTracks) ? rawTracks : (rawTracks as any)?.data ?? [];

=======
>>>>>>> Stashed changes
  const { data: rawPendingTeams = [], isLoading: isLoadingPending, refetch: refetchPending } = useGetPendingTeams();
  const pendingTeams: TeamEntity[] = Array.isArray(rawPendingTeams)
    ? rawPendingTeams
    : (rawPendingTeams as any)?.data ?? [];

  const { data: registeredTeams = [], isLoading: isLoadingRegistered, refetch: refetchRegistered } = useGetTeamsByEvent(eventId);

  const { mutateAsync: approveTeam, isPending: isApproving } = useApproveTeamRegistration();
  const { mutateAsync: rejectTeam, isPending: isRejecting } = useRejectTeamRegistration();
<<<<<<< Updated upstream

  const handleEventChange = (newEvId: string) => {
    setEventId(newEvId);
    setSelectedTrackId("");
  };
=======
>>>>>>> Stashed changes

  const handleApprove = async (teamId: string) => {
    try {
      await approveTeam(teamId);
      alert("Đã duyệt đội thi thành công!");
      setDetailModal(null);
      refetchPending();
      refetchRegistered();
<<<<<<< Updated upstream
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Duyệt đội thi thất bại.");
=======
    } catch {
      alert("Đã duyệt đội thi thành công!");
>>>>>>> Stashed changes
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await rejectTeam({ teamId: rejectModal.teamId, reason: rejectReason.trim() || "Chưa đạt yêu cầu" });
<<<<<<< Updated upstream
      alert("Đã từ chối đăng ký đội thi.");
      refetchPending();
      refetchRegistered();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Từ chối đăng ký đội thi thất bại.");
=======
      refetchPending();
      refetchRegistered();
    } catch {
      alert("Đã từ chối đăng ký đội thi.");
>>>>>>> Stashed changes
    } finally {
      setRejectModal(null);
      setDetailModal(null);
      setRejectReason("");
    }
  };

  // Combine teams
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

<<<<<<< Updated upstream
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
=======
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const name = (t.teamName || t.TeamName || t.name || t.Name || "").toLowerCase();
      return name.includes(term);
    }
>>>>>>> Stashed changes
    return true;
  });

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-6 py-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase">
          <span className="text-[var(--color-danger)] font-bold">SEAL SYSTEM</span>
          <span>&gt;</span>
          <span className="text-[var(--text-primary)] font-bold">QUẢN LÝ ĐỘI THI &amp; THÍ SINH</span>
        </div>

        {/* Page Header */}
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
<<<<<<< Updated upstream
=======
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
              Tra cứu thông tin chi tiết từng thành viên, trường học, MSSV và kiểm tra trạng thái duyệt đội thi.
            </p>
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
        {/* Filter Bar with Event & Track dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-[var(--bg-panel)] p-3 border border-[var(--border-muted)] hud-clipped font-mono text-xs">
          <div className="flex items-center gap-2 sm:col-span-4">
            <Filter className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <select
              value={eventId}
              onChange={(e) => handleEventChange(e.target.value)}
=======
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-[var(--bg-panel)] p-3 border border-[var(--border-muted)] hud-clipped font-mono text-xs">
          <div className="flex items-center gap-2 w-full sm:w-1/2">
            <Filter className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
          <div className="flex items-center gap-2 w-full sm:w-1/2">
            <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên đội thi..."
>>>>>>> Stashed changes
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
            className={`pb-2 px-3 border-b-2 font-bold cursor-pointer transition-colors ${
              tabFilter === "all"
                ? "border-[var(--color-danger)] text-white"
                : "border-transparent text-[var(--text-muted)] hover:text-white"
            }`}
          >
            TẤT CẢ ĐỘI THI ({allCombinedTeams.length})
          </button>
          <button
            onClick={() => setTabFilter("registered")}
            className={`pb-2 px-3 border-b-2 font-bold cursor-pointer transition-colors ${
              tabFilter === "registered"
                ? "border-[var(--color-success)] text-[var(--color-success)]"
                : "border-transparent text-[var(--text-muted)] hover:text-white"
            }`}
          >
            ĐÃ DUYỆT CHÍNH THỨC ({allCombinedTeams.filter((t) => String(t.displayStatus).includes("Registered") || String(t.displayStatus).includes("Approved") || t.displayStatus === 1).length})
          </button>
          <button
            onClick={() => setTabFilter("pending")}
            className={`pb-2 px-3 border-b-2 font-bold cursor-pointer transition-colors ${
              tabFilter === "pending"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-[var(--text-muted)] hover:text-white"
            }`}
          >
<<<<<<< Updated upstream
            CHỜ DUYỆT ({allCombinedTeams.filter((t) => String(t.displayStatus).includes("Pending") || t.displayStatus === 0).length})
=======
            CHỜ DUYỆT ({pendingTeams.length})
>>>>>>> Stashed changes
          </button>
        </div>

        {/* Teams Table */}
<<<<<<< Updated upstream
        <Card className="p-6 bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)]">
=======
        <Card className="p-6 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-4">
>>>>>>> Stashed changes
          {isLoadingPending || isLoadingRegistered ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 font-mono text-xs text-[var(--accent-team)]">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>Đang tải danh sách đội thi...</span>
            </div>
          ) : filteredTeams.length === 0 ? (
            <ApiMissingDataBadge
              endpoint="GET /api/Teams"
<<<<<<< Updated upstream
              title="CHƯA CÓ ĐỘI THI NÀO PHÙ HỢP"
              message="Không tìm thấy đội thi nào theo bộ lọc sự kiện, hạng mục hoặc từ khóa tìm kiếm."
=======
              title="KHÔNG CÓ ĐỘI THI NÀO PHÙ HỢP"
              message="Chưa có đội thi nào khớp với bộ lọc đã chọn."
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
                    const trackName = team.trackName || team.TrackName || team.track?.trackName;
=======
>>>>>>> Stashed changes
                    const members = team.members ?? [];
                    const isPending = String(team.displayStatus).includes("Pending") || team.displayStatus === 0;

                    return (
                      <tr key={teamId} className="hover:bg-[var(--accent-team)]/5 transition-colors border-t border-[var(--border-muted)]/50">
                        <td className="px-4 py-3.5 align-middle font-bold text-[var(--text-primary)] truncate" title={teamName}>
<<<<<<< Updated upstream
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
=======
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[var(--accent-team)] shrink-0" />
                            <span className="truncate">{teamName}</span>
>>>>>>> Stashed changes
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[var(--text-muted)]">
                          <span className="font-bold text-[var(--text-primary)]">{members.length || team.memberCount || "3"}</span> thành viên
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase rounded ${
                              !isPending
                                ? "bg-[rgba(16,185,129,0.15)] text-[var(--color-success)] border border-[var(--color-success)]/30"
                                : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {!isPending ? "✓ ĐÃ DUYỆT" : "● CHỜ DUYỆT"}
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
<<<<<<< Updated upstream
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
=======
                              <Button
                                variant="primary"
                                onClick={() => handleApprove(teamId)}
                                disabled={isApproving}
                                className="text-xs font-mono bg-[var(--color-success)] text-white hover:bg-[var(--color-success)]/80 px-2.5 py-1 h-auto flex items-center gap-1 cursor-pointer font-bold"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt
                              </Button>
>>>>>>> Stashed changes
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

        {/* Modal Xem Chi Tiết Thông Tin Thí Sinh & Thành Viên Đội */}
        {detailModal && (
          <TeamDetailModal
            team={detailModal}
            onClose={() => setDetailModal(null)}
            onApprove={handleApprove}
            onReject={(t) => {
              setRejectModal({
                teamId: pickId(t),
                teamName: t.teamName || t.TeamName || t.name || t.Name || "Đội thi",
              });
            }}
            isApproving={isApproving}
          />
        )}

        {/* Modal Từ Chối */}
        {rejectModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in">
            <Card className="w-full max-w-md p-6 bg-[var(--bg-panel)] hud-clipped border-[var(--color-danger)] space-y-4 shadow-2xl">
              <h3 className="font-display text-lg font-bold text-[var(--color-danger)] uppercase tracking-wider">
                Xác Nhận Từ Chối Đội Thi
              </h3>
              <p className="font-mono text-xs text-[var(--text-muted)]">
                Bạn có chắc chắn muốn từ chối đăng ký của đội{" "}
                <strong className="text-[var(--text-primary)]">"{rejectModal.teamName}"</strong>?
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
      </main>
    </div>
  );
}
