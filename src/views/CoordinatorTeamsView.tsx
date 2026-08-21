"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  useGetPendingTeams,
  useApproveTeamRegistration,
  useRejectTeamRegistration,
  useGetTeamsByEvent,
  useDisqualifyTeam,
  useGetTeamById,
} from "@/repositories/teamsRepository";
import { useMyEvents } from "@/repositories/eventsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { Button, Card, Badge, Input, Pagination } from "@/components/ui";
import {
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Shield,
  AlertTriangle,
  Eye,
  Crown,
  Ban,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Info,
} from "lucide-react";
import type { TeamEntity } from "@/models/entities";

function pickId(item: any): string {
  return item?.id || item?.Id || item?.eventId || item?.EventId || item?.TeamId || "";
}

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "DISQUALIFIED";

export function CoordinatorTeamsView() {
  const [rejectModal, setRejectModal] = useState<{ teamId: string; teamName: string; isDisqualify?: boolean } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detailModal, setDetailModal] = useState<any | null>(null);
  const [eventId, setEventId] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  const { data: myEvents = [] } = useMyEvents();

  useEffect(() => {
    if (!eventId && myEvents.length > 0) {
      const firstId = pickId(myEvents[0]);
      if (firstId) setEventId(firstId);
    }
  }, [myEvents, eventId]);

  const { data: tracks = [] } = useGetTracksByEvent(eventId);

  const {
    data: allTeamsByEventRaw = [],
    isLoading: isLoadingAll,
    refetch: refetchAllTeams,
  } = useGetTeamsByEvent(eventId);

  const {
    data: rawPendingTeams = [],
    isLoading: isLoadingPending,
    refetch: refetchPending,
  } = useGetPendingTeams();

  const { mutateAsync: approveTeam, isPending: isApproving } = useApproveTeamRegistration();
  const { mutateAsync: rejectTeam, isPending: isRejecting } = useRejectTeamRegistration();
  const { mutateAsync: disqualifyTeam, isPending: isDisqualifying } = useDisqualifyTeam();

  const isLoading = isLoadingAll || isLoadingPending;

  const handleRefresh = () => {
    refetchAllTeams();
    refetchPending();
  };

  // Helper chuẩn hóa status
  const getNormalizedStatus = (rawStatus: any): "Pending" | "Approved" | "Disqualified" | "Rejected" | "Forming" => {
    if (rawStatus === 3 || rawStatus === "3" || rawStatus === "PendingApproval" || rawStatus === "Pending") return "Pending";
    if (rawStatus === 1 || rawStatus === "1" || rawStatus === "Registered" || rawStatus === "Approved") return "Approved";
    if (rawStatus === 2 || rawStatus === "2" || rawStatus === "Disqualified") return "Disqualified";
    if (rawStatus === 4 || rawStatus === "4" || rawStatus === "Rejected") return "Rejected";
    if (rawStatus === 0 || rawStatus === "0" || rawStatus === "Forming") return "Forming";
    return "Pending";
  };

  // Gộp danh sách đội của sự kiện
  const combinedTeams = useMemo(() => {
    const map = new Map<string, any>();

    (Array.isArray(allTeamsByEventRaw) ? allTeamsByEventRaw : []).forEach((t: any) => {
      const id = pickId(t);
      if (id) {
        map.set(id, {
          ...t,
          id,
          normalizedStatus: getNormalizedStatus(t.status ?? t.Status),
        });
      }
    });

    (Array.isArray(rawPendingTeams) ? rawPendingTeams : []).forEach((t: any) => {
      const tEvId = t.eventId || t.EventId || "";
      if (!eventId || tEvId === eventId) {
        const id = pickId(t);
        if (id) {
          const existing = map.get(id);
          map.set(id, {
            ...existing,
            ...t,
            id,
            normalizedStatus: "Pending",
          });
        }
      }
    });

    return Array.from(map.values());
  }, [allTeamsByEventRaw, rawPendingTeams, eventId]);

  // Bộ lọc đội theo Track, Status, Search
  const filteredTeams = useMemo(() => {
    return combinedTeams.filter((t: any) => {
      // Lọc theo Track
      if (selectedTrackId !== "ALL") {
        const tTrackId = t.trackId || t.TrackId || "";
        if (tTrackId !== selectedTrackId) return false;
      }

      // Lọc theo Status Tab
      if (statusFilter === "PENDING" && t.normalizedStatus !== "Pending") return false;
      if (statusFilter === "APPROVED" && t.normalizedStatus !== "Approved") return false;
      if (statusFilter === "DISQUALIFIED" && t.normalizedStatus !== "Disqualified" && t.normalizedStatus !== "Rejected") return false;

      // Lọc theo Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const name = (t.name || t.Name || t.teamName || t.TeamName || "").toLowerCase();
        const desc = (t.description || t.Description || "").toLowerCase();
        if (!name.includes(q) && !desc.includes(q)) return false;
      }

      return true;
    });
  }, [combinedTeams, selectedTrackId, statusFilter, searchQuery]);

  // Đếm số lượng theo status để hiện badge trên tab
  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let disqualified = 0;
    combinedTeams.forEach((t: any) => {
      if (t.normalizedStatus === "Pending") pending++;
      else if (t.normalizedStatus === "Approved") approved++;
      else if (t.normalizedStatus === "Disqualified" || t.normalizedStatus === "Rejected") disqualified++;
    });
    return { all: combinedTeams.length, pending, approved, disqualified };
  }, [combinedTeams]);

  // Paging
  const totalPages = Math.max(1, Math.ceil(filteredTeams.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedTeams = filteredTeams.slice(startIndex, startIndex + PAGE_SIZE);

  // Chi tiết đội thi khi mở Modal
  const detailTeamId = detailModal ? pickId(detailModal) : undefined;
  const { data: teamDetail, isLoading: isLoadingDetail } = useGetTeamById(detailTeamId);
  const detailMembers = teamDetail?.members ?? [];

  // Thao tác Duyệt Đội
  const handleApprove = async (teamId: string) => {
    try {
      await approveTeam(teamId);
      setDetailModal(null);
      handleRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Duyệt đội thi thất bại. Vui lòng thử lại.");
    }
  };

  // Thao tác Từ Chối / Loại Đội kèm Lý do
  const handleConfirmRejectOrDisqualify = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lý do cụ thể.");
      return;
    }

    try {
      if (rejectModal.isDisqualify) {
        await disqualifyTeam({ teamId: rejectModal.teamId, reason: rejectReason.trim() });
      } else {
        await rejectTeam({ teamId: rejectModal.teamId, reason: rejectReason.trim() });
      }
      setRejectModal(null);
      setDetailModal(null);
      setRejectReason("");
      handleRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Thao tác thất bại. Vui lòng thử lại.");
    }
  };

  const sampleReasons = [
    "Sĩ số thành viên không đạt quy định tối thiểu (3 - 5 thành viên).",
    "Thành viên chưa hoàn tất duyệt thẻ sinh viên / hồ sơ cá nhân.",
    "Phát hiện dấu hiệu gian lận bài nộp hoặc vi phạm quy chế.",
    "Ý tưởng đề tài không phù hợp với chủ đề và hạng mục cuộc thi.",
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-4 py-4 space-y-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--border-muted)] pb-3">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#a855f7] font-bold uppercase tracking-wider mb-0.5">
              <Shield className="w-3.5 h-3.5 text-[#a855f7]" />
              <span>QUẢN LÝ ĐỘI THI BAN TỔ CHỨC</span>
            </div>
            <h1 className="font-mono font-bold text-xl md:text-2xl text-[#e1e7ec] uppercase tracking-wider">
              DANH SÁCH ĐỘI THI &amp; PHÊ DUYỆT ĐĂNG KÝ
            </h1>
            <p className="text-xs font-sans text-[#8a9ba8] mt-0.5 leading-relaxed max-w-3xl">
              Quản lý danh sách các đội thi, xem chi tiết thành viên (Leader / Member), duyệt hoặc loại đội tham gia.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              onClick={handleRefresh}
              className="flex items-center gap-1.5 text-xs font-mono py-1 px-3"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>LÀM MỚI</span>
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-[var(--bg-panel)] border border-[var(--border-muted)] p-3 hud-clipped flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Event Selector */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs text-[var(--text-muted)]">Sự kiện:</span>
              <select
                value={eventId}
                onChange={(e) => {
                  setEventId(e.target.value);
                  setSelectedTrackId("ALL");
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--accent-coordinator)] font-mono text-xs hud-clipped font-bold focus:outline-none"
              >
                {myEvents.length === 0 && <option value="">-- Chưa có sự kiện --</option>}
                {myEvents.map((ev: any) => {
                  const id = pickId(ev);
                  const name = ev.eventName || ev.EventName || id;
                  const season = ev.season || ev.Season || "";
                  const year = ev.year || ev.Year || "";
                  const suffix = season || year ? ` (${season} ${year})`.trim() : "";
                  return (
                    <option key={id} value={id}>
                      {name}{suffix}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Track Selector */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs text-[var(--text-muted)] flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#8b5cf6]" /> Hạng mục:
              </span>
              <select
                value={selectedTrackId}
                onChange={(e) => {
                  setSelectedTrackId(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 bg-[var(--bg-input)] border border-[#8b5cf6]/40 text-[#8b5cf6] font-mono text-xs hud-clipped font-bold focus:outline-none"
              >
                <option value="ALL">-- Tất cả Hạng mục --</option>
                {tracks.map((tr: any) => {
                  const trId = tr.id || tr.Id || tr.trackId || tr.TrackId || "";
                  const trName = tr.trackName || tr.TrackName || "Hạng mục";
                  return (
                    <option key={trId} value={trId}>
                      {trName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-64">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm kiếm tên đội thi..."
              className="text-xs font-mono py-1"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-muted)] pb-2 text-xs font-mono">
          <button
            onClick={() => { setStatusFilter("ALL"); setCurrentPage(1); }}
            className={`px-3 py-1.5 hud-clipped transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
              statusFilter === "ALL"
                ? "bg-[var(--accent-coordinator)] text-black"
                : "bg-[var(--bg-panel)] text-[var(--text-muted)] hover:text-white border border-[var(--border-muted)]"
            }`}
          >
            <span>Tất cả đội thi</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => { setStatusFilter("PENDING"); setCurrentPage(1); }}
            className={`px-3 py-1.5 hud-clipped transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
              statusFilter === "PENDING"
                ? "bg-[var(--color-warning)] text-black"
                : "bg-[var(--bg-panel)] text-[var(--color-warning)] hover:text-white border border-[var(--color-warning)]/30"
            }`}
          >
            <span>Chờ duyệt (Pending)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {counts.pending}
            </span>
          </button>

          <button
            onClick={() => { setStatusFilter("APPROVED"); setCurrentPage(1); }}
            className={`px-3 py-1.5 hud-clipped transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
              statusFilter === "APPROVED"
                ? "bg-[var(--color-success)] text-black"
                : "bg-[var(--bg-panel)] text-[var(--color-success)] hover:text-white border border-[var(--color-success)]/30"
            }`}
          >
            <span>Đã duyệt (Approved)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {counts.approved}
            </span>
          </button>

          <button
            onClick={() => { setStatusFilter("DISQUALIFIED"); setCurrentPage(1); }}
            className={`px-3 py-1.5 hud-clipped transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
              statusFilter === "DISQUALIFIED"
                ? "bg-[var(--color-danger)] text-white"
                : "bg-[var(--bg-panel)] text-[var(--color-danger)] hover:text-white border border-[var(--color-danger)]/30"
            }`}
          >
            <span>Đã loại / Từ chối</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">
              {counts.disqualified}
            </span>
          </button>
        </div>

        {/* Main Team Table Card */}
        <Card className="p-4 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[var(--accent-coordinator)]" />
              <p className="font-mono text-xs text-[var(--text-muted)]">Đang tải danh sách đội thi...</p>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-[var(--text-muted)] space-y-2">
              <Users className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-40" />
              <p className="uppercase tracking-wider">Không tìm thấy đội thi nào phù hợp với điều kiện lọc.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-muted)] bg-[var(--bg-input)] text-[var(--text-muted)] uppercase text-[10px]">
                      <th className="p-2.5">Tên Đội Thi &amp; Mô Tả</th>
                      <th className="p-2.5">Hạng Mục</th>
                      <th className="p-2.5">Trạng Thái</th>
                      <th className="p-2.5 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-muted)]">
                    {paginatedTeams.map((team: any) => {
                      const teamId = team.id || pickId(team);
                      const teamName = team.name || team.Name || team.teamName || team.TeamName || "Đội thi";
                      const description = team.description || team.Description || "Chưa có mô tả.";
                      const trackObj = tracks.find((tr: any) => (tr.id || tr.Id) === (team.trackId || team.TrackId));
                      const trackName = trackObj?.trackName || trackObj?.TrackName || team.trackName || team.TrackName || "Chưa phân hạng mục";
                      const status = team.normalizedStatus;

                      return (
                        <tr key={teamId} className="hover:bg-[var(--bg-panel)] transition-colors">
                          {/* Name & Desc */}
                          <td className="p-2.5 max-w-xs">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-[var(--accent-team)] shrink-0" />
                              <span className="font-bold text-sm text-[var(--text-primary)] truncate">
                                {teamName}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                              {description}
                            </p>
                          </td>

                          {/* Track */}
                          <td className="p-2.5 text-[var(--text-muted)] text-[11px]">
                            {trackName}
                          </td>

                          {/* Status Badge */}
                          <td className="p-2.5">
                            {status === "Pending" && (
                              <Badge tone="warning">CHỜ DUYỆT (PENDING)</Badge>
                            )}
                            {status === "Approved" && (
                              <Badge tone="success">ĐÃ DUYỆT (APPROVED)</Badge>
                            )}
                            {status === "Disqualified" && (
                              <Badge tone="danger">ĐÃ BỊ LOẠI (DISQUALIFIED)</Badge>
                            )}
                            {status === "Rejected" && (
                              <Badge tone="danger">TỪ CHỐI (REJECTED)</Badge>
                            )}
                            {status === "Forming" && (
                              <Badge tone="neutral">ĐANG LẬP ĐỘI</Badge>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Xem Đội Modal */}
                              <Button
                                variant="ghost"
                                onClick={() => setDetailModal(team)}
                                className="text-[11px] font-mono text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 py-1 px-2.5"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> Xem đội
                              </Button>

                              {/* Nút Duyệt nếu Pending */}
                              {status === "Pending" && (
                                <Button
                                  disabled={isApproving}
                                  onClick={() => handleApprove(teamId)}
                                  className="text-[11px] font-mono bg-[var(--color-success)] text-black hover:bg-emerald-400 py-1 px-2.5 font-bold"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Duyệt đội
                                </Button>
                              )}

                              {/* Nút Từ chối nếu Pending */}
                              {status === "Pending" && (
                                <Button
                                  onClick={() => setRejectModal({ teamId, teamName, isDisqualify: false })}
                                  className="text-[11px] font-mono text-[var(--color-danger)] border border-[var(--color-danger)]/40 hover:bg-red-500/10 py-1 px-2"
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1" /> Từ chối
                                </Button>
                              )}

                              {/* Nút Loại đội nếu Approved */}
                              {status === "Approved" && (
                                <Button
                                  onClick={() => setRejectModal({ teamId, teamName, isDisqualify: true })}
                                  className="text-[11px] font-mono text-[var(--color-danger)] bg-red-500/10 border border-[var(--color-danger)]/40 hover:bg-[var(--color-danger)] hover:text-white py-1 px-2.5"
                                >
                                  <Ban className="w-3.5 h-3.5 mr-1" /> Loại đội
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

              {/* Pagination Controls */}
              {filteredTeams.length > 0 && (
                <div className="pt-3 border-t border-[var(--border-muted)]">
                  <Pagination
                    currentPage={safePage}
                    totalPages={totalPages}
                    totalItems={filteredTeams.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setCurrentPage}
                    itemLabel="đội thi"
                  />
                </div>
              )}
            </>
          )}
        </Card>

        {/* Modal: Xem Chi Tiết Đội Thi (Team Detail Inspection) */}
        {detailModal && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={() => setDetailModal(null)}
          >
            <Card
              className="w-full max-w-2xl p-5 bg-[var(--bg-panel)] hud-clipped border-[var(--accent-coordinator)] space-y-4 max-h-[90vh] overflow-y-auto"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
                <div>
                  <span className="font-mono text-[10px] text-[var(--accent-coordinator)] uppercase font-bold tracking-widest">
                    THÔNG TIN CHI TIẾT ĐỘI THI
                  </span>
                  <h3 className="font-display text-lg font-bold text-[var(--text-primary)] uppercase tracking-wide mt-0.5">
                    {detailModal.name || detailModal.Name || detailModal.teamName || detailModal.TeamName}
                  </h3>
                </div>
                <button
                  onClick={() => setDetailModal(null)}
                  className="text-[var(--text-muted)] hover:text-white p-1 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Mã Đội Thi:</span>
                    <span className="text-[var(--accent-team)] font-bold">#{pickId(detailModal)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Trạng Thái:</span>
                    <Badge tone={detailModal.normalizedStatus === "Approved" ? "success" : detailModal.normalizedStatus === "Pending" ? "warning" : "danger"}>
                      {detailModal.normalizedStatus || detailModal.status || detailModal.Status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block mb-1">
                    Mô tả dự án &amp; định hướng kỹ thuật:
                  </span>
                  <div className="p-2.5 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-muted)] text-[11px] leading-relaxed">
                    {detailModal.description || detailModal.Description || "Chưa có mô tả chi tiết cho đội thi này."}
                  </div>
                </div>

                {/* Danh Sách Thành Viên (Phân biệt Leader và Member) */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[var(--text-primary)] uppercase font-bold flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[var(--accent-team)]" />
                      Danh sách thành viên ({detailMembers.length} / 5 người):
                    </span>
                    <span className={`text-[10px] font-bold ${detailMembers.length >= 3 && detailMembers.length <= 5 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                      {detailMembers.length >= 3 && detailMembers.length <= 5 ? "✓ Sĩ số hợp lệ (3 - 5 người)" : "⚠ Sĩ số chưa đạt chuẩn (3 - 5 người)"}
                    </span>
                  </div>

                  {isLoadingDetail ? (
                    <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                      <RefreshCw className="w-4 h-4 animate-spin inline mr-2 text-[var(--accent-coordinator)]" />
                      Đang tải danh sách thành viên...
                    </div>
                  ) : detailMembers.length === 0 ? (
                    <div className="p-3 bg-[var(--bg-base)] border border-[var(--border-muted)] text-center text-[11px] text-[var(--text-muted)]">
                      Chưa có thành viên nào trong đội thi này.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {detailMembers.map((m: any, idx: number) => {
                        const isLeader = m.roleName === "TeamLeader" || m.roleName === "Leader" || m.RoleName === "TeamLeader";
                        return (
                          <div
                            key={m.userId || idx}
                            className={`p-2.5 bg-[var(--bg-base)] border flex items-center justify-between hud-clipped ${
                              isLeader ? "border-[var(--accent-team)]/50 bg-[var(--accent-team)]/5" : "border-[var(--border-muted)]"
                            }`}
                          >
                            <div>
                              <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 text-xs">
                                {isLeader ? (
                                  <>
                                    <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span>{m.fullName}</span>
                                    <span className="text-[9px] px-1.5 py-0.2 bg-amber-400/20 text-amber-300 font-mono font-bold rounded">
                                      TRƯỞNG NHÓM (LEADER)
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Users className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                                    <span>{m.fullName}</span>
                                    <span className="text-[9px] text-[var(--text-muted)] font-mono">
                                      [THÀNH VIÊN]
                                    </span>
                                  </>
                                )}
                              </div>
                              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                Email: {m.email} {m.studentCode ? `· MSSV: ${m.studentCode}` : ""}
                              </p>
                            </div>

                            <Badge tone={m.isApproved ? "success" : "danger"}>
                              {m.isApproved ? "ĐÃ DUYỆT THẺ" : "CHƯA DUYỆT THẺ"}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--border-muted)]">
                <Button variant="ghost" onClick={() => setDetailModal(null)} className="font-mono text-xs py-1.5 px-3">
                  Đóng
                </Button>

                <div className="flex items-center gap-2">
                  {detailModal.normalizedStatus === "Pending" && (
                    <>
                      <Button
                        onClick={() => setRejectModal({
                          teamId: pickId(detailModal),
                          teamName: detailModal.name || detailModal.Name || detailModal.teamName || "Đội thi",
                          isDisqualify: false,
                        })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[rgba(239,68,68,0.1)] border border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white font-mono"
                      >
                        <XCircle className="w-3.5 h-3.5" /> TỪ CHỐI ĐĂNG KÝ
                      </Button>
                      <Button
                        disabled={isApproving}
                        onClick={() => handleApprove(pickId(detailModal))}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-[var(--color-success)] text-black hover:bg-emerald-400 font-mono font-bold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> PHÊ DUYỆT ĐỘI THI
                      </Button>
                    </>
                  )}

                  {detailModal.normalizedStatus === "Approved" && (
                    <Button
                      onClick={() => setRejectModal({
                        teamId: pickId(detailModal),
                        teamName: detailModal.name || detailModal.Name || detailModal.teamName || "Đội thi",
                        isDisqualify: true,
                      })}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[rgba(239,68,68,0.1)] border border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white font-mono font-bold"
                    >
                      <Ban className="w-3.5 h-3.5" /> LOẠI ĐỘI KHỎI CUỘC THI
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Modal: Nhập Lý Do Từ Chối / Loại Đội (Reject or Disqualify) */}
        {rejectModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
            <Card className="w-full max-w-md p-5 bg-[var(--bg-panel)] hud-clipped border-[var(--color-danger)]/50 space-y-4">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-[var(--color-danger)] shrink-0" />
                <h3 className="font-display text-sm font-bold text-[var(--color-danger)] tracking-wide uppercase">
                  {rejectModal.isDisqualify ? "LOẠI ĐỘI KHỎI CUỘC THI" : "TỪ CHỐI ĐĂNG KÝ ĐỘI THI"}
                </h3>
              </div>

              <p className="text-xs font-mono text-[var(--text-muted)]">
                Bạn đang thực hiện {rejectModal.isDisqualify ? "loại" : "từ chối"} đội:{" "}
                <strong className="text-white">{rejectModal.teamName}</strong>. Tin nhắn lý do sẽ được gửi trực tiếp tới Đội trưởng.
              </p>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-mono tracking-wider text-[var(--text-muted)] uppercase">
                  Lý do cụ thể <span className="text-[var(--color-danger)]">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do cụ thể (VD: không đủ 3-5 người, gian lận bài thi, v.v.)..."
                  rows={3}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs resize-none focus:outline-none focus:border-[var(--color-danger)]"
                  required
                />

                {/* Quick Sample Reasons */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-mono text-[var(--text-muted)] block">Gợi ý lý do nhanh:</span>
                  <div className="flex flex-col gap-1">
                    {sampleReasons.map((reason, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRejectReason(reason)}
                        className="text-left text-[10px] font-mono text-zinc-400 hover:text-white bg-[var(--bg-base)] p-1.5 border border-zinc-800 hover:border-zinc-600 rounded transition-colors"
                      >
                        • {reason}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => { setRejectModal(null); setRejectReason(""); }}
                  className="flex-1 justify-center font-mono text-xs py-1.5"
                >
                  Hủy bỏ
                </Button>
                <Button
                  disabled={!rejectReason.trim() || isRejecting || isDisqualifying}
                  onClick={handleConfirmRejectOrDisqualify}
                  className="flex-1 justify-center bg-[var(--color-danger)] text-white hover:bg-red-600 font-mono text-xs font-bold py-1.5"
                >
                  {isRejecting || isDisqualifying ? "Đang xử lý..." : "// XÁC NHẬN"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

