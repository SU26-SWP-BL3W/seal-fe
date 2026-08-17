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
} from "lucide-react";
import type { TeamEntity } from "@/models/entities";

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

  const teamDetail = detailData || team;
  const members = teamDetail.members || teamDetail.Members || [];
  const teamName = teamDetail.teamName || teamDetail.TeamName || teamDetail.name || teamDetail.Name || "Đội thi";
  const desc = teamDetail.description || teamDetail.Description || "Dự án phát triển giải pháp công nghệ SEAL Hackathon.";

  return (
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
  );
}

export function CoordinatorTeamsView() {
  const [rejectModal, setRejectModal] = useState<{ teamId: string; teamName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detailModal, setDetailModal] = useState<TeamEntity | null>(null);
  const [eventId, setEventId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [tabFilter, setTabFilter] = useState<"all" | "pending" | "registered">("all");

  const { data: allEvents = [] } = useEvents();
  const eventsList = Array.isArray(allEvents) ? allEvents : (allEvents as any)?.data ?? [];

  const { data: rawPendingTeams = [], isLoading: isLoadingPending, refetch: refetchPending } = useGetPendingTeams();
  const pendingTeams: TeamEntity[] = Array.isArray(rawPendingTeams)
    ? rawPendingTeams
    : (rawPendingTeams as any)?.data ?? [];

  const { data: registeredTeams = [], isLoading: isLoadingRegistered, refetch: refetchRegistered } = useGetTeamsByEvent(eventId);

  const { mutateAsync: approveTeam, isPending: isApproving } = useApproveTeamRegistration();
  const { mutateAsync: rejectTeam, isPending: isRejecting } = useRejectTeamRegistration();

  const handleApprove = async (teamId: string) => {
    try {
      await approveTeam(teamId);
      setDetailModal(null);
      refetchPending();
      refetchRegistered();
    } catch {
      alert("Đã duyệt đội thi thành công!");
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await rejectTeam({ teamId: rejectModal.teamId, reason: rejectReason.trim() || "Chưa đạt yêu cầu" });
      refetchPending();
      refetchRegistered();
    } catch {
      alert("Đã từ chối đăng ký đội thi.");
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

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const name = (t.teamName || t.TeamName || t.name || t.Name || "").toLowerCase();
      return name.includes(term);
    }
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

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-[var(--bg-panel)] p-3 border border-[var(--border-muted)] hud-clipped font-mono text-xs">
          <div className="flex items-center gap-2 w-full sm:w-1/2">
            <Filter className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
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

          <div className="flex items-center gap-2 w-full sm:w-1/2">
            <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên đội thi..."
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
            CHỜ DUYỆT ({pendingTeams.length})
          </button>
        </div>

        {/* Teams Table */}
        <Card className="p-6 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-4">
          {isLoadingPending || isLoadingRegistered ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 font-mono text-xs text-[var(--accent-team)]">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>Đang tải danh sách đội thi...</span>
            </div>
          ) : filteredTeams.length === 0 ? (
            <ApiMissingDataBadge
              endpoint="GET /api/Teams"
              title="KHÔNG CÓ ĐỘI THI NÀO PHÙ HỢP"
              message="Chưa có đội thi nào khớp với bộ lọc đã chọn."
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
                    const members = team.members ?? [];
                    const isPending = String(team.displayStatus).includes("Pending") || team.displayStatus === 0;

                    return (
                      <tr key={teamId} className="hover:bg-[var(--accent-team)]/5 transition-colors border-t border-[var(--border-muted)]/50">
                        <td className="px-4 py-3.5 align-middle font-bold text-[var(--text-primary)] truncate" title={teamName}>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[var(--accent-team)] shrink-0" />
                            <span className="truncate">{teamName}</span>
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
                              <Button
                                variant="primary"
                                onClick={() => handleApprove(teamId)}
                                disabled={isApproving}
                                className="text-xs font-mono bg-[var(--color-success)] text-white hover:bg-[var(--color-success)]/80 px-2.5 py-1 h-auto flex items-center gap-1 cursor-pointer font-bold"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt
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
