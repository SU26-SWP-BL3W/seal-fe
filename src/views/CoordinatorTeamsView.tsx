"use client";

import { useEffect, useState } from "react";
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
import { Button, Card, Badge } from "@/components/ui";
import {
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Shield,
  AlertTriangle,
  Eye,
  Crown,
  Building2,
  FileText,
  Ban,
  Filter,
} from "lucide-react";
import type { TeamEntity } from "@/models/entities";

function pickId(item: any): string {
  return item?.id || item?.Id || item?.eventId || item?.EventId || item?.TeamId || "";
}

export function CoordinatorTeamsView() {
  const [rejectModal, setRejectModal] = useState<{ teamId: string; teamName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [disqualifyModal, setDisqualifyModal] = useState<{ teamId: string; teamName: string } | null>(null);
  const [disqualifyReason, setDisqualifyReason] = useState("");
  const [detailModal, setDetailModal] = useState<TeamEntity | null>(null);
  const [eventId, setEventId] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState<string>("ALL");

  const { data: myEvents = [] } = useMyEvents();
  useEffect(() => {
    if (!eventId && myEvents.length) setEventId(pickId(myEvents[0]));
  }, [myEvents, eventId]);

  const { data: tracks = [] } = useGetTracksByEvent(eventId);

  const { data: rawPendingTeams, isLoading, refetch } = useGetPendingTeams();
  const pendingTeamsRaw: TeamEntity[] = Array.isArray(rawPendingTeams)
    ? rawPendingTeams
    : (rawPendingTeams as any)?.data ?? [];

  const { data: registeredTeamsRaw = [], refetch: refetchRegistered } = useGetTeamsByEvent(eventId, "Registered");

  // Filter pending and registered teams by selectedTrackId
  const pendingTeams = pendingTeamsRaw.filter((t: any) => {
    if (!selectedTrackId || selectedTrackId === "ALL") return true;
    const tTrackId = t.trackId || t.TrackId || t.trackName || t.TrackName || "";
    return tTrackId === selectedTrackId;
  });

  const registeredTeams = (Array.isArray(registeredTeamsRaw) ? registeredTeamsRaw : []).filter((t: any) => {
    if (!selectedTrackId || selectedTrackId === "ALL") return true;
    const tTrackId = t.trackId || t.TrackId || t.trackName || t.TrackName || "";
    return tTrackId === selectedTrackId;
  });
  const { mutateAsync: approveTeam, isPending: isApproving } = useApproveTeamRegistration();
  const { mutateAsync: rejectTeam, isPending: isRejecting } = useRejectTeamRegistration();
  const { mutateAsync: disqualifyTeam, isPending: isDisqualifying } = useDisqualifyTeam();

  // TeamListItemModel (danh sách) không có field members — phải gọi riêng GET /Teams/{id}
  // để lấy roster thật khi mở modal chi tiết.
  const detailTeamId = detailModal ? pickId(detailModal) : undefined;
  const { data: teamDetail } = useGetTeamById(detailTeamId);
  const detailMembers = teamDetail?.members ?? [];

  const handleApprove = async (teamId: string) => {
    try {
      await approveTeam(teamId);
      setDetailModal(null);
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Duyệt đội thi thất bại. Vui lòng thử lại.");
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) return;

    try {
      await rejectTeam({ teamId: rejectModal.teamId, reason: rejectReason.trim() });
      setRejectModal(null);
      setDetailModal(null);
      setRejectReason("");
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Từ chối đăng ký thất bại. Vui lòng thử lại.");
    }
  };

  const handleDisqualify = async () => {
    if (!disqualifyModal) return;
    if (!disqualifyReason.trim()) return;
    try {
      await disqualifyTeam({ teamId: disqualifyModal.teamId, reason: disqualifyReason.trim() });
      setDisqualifyModal(null);
      setDisqualifyReason("");
      refetchRegistered();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || "Loại đội thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] hud-lattice px-6 py-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#263339] pb-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#a855f7] font-bold uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4 text-[#a855f7]" />
              <span>QUẢN LÝ ĐỘI THI BAN TỔ CHỨC</span>
            </div>
            <h1 className="font-mono font-bold text-2xl md:text-3xl text-[#e1e7ec] uppercase tracking-wider">
              DANH SÁCH ĐỘI THI VÀ PHÊ DUYỆT ĐĂNG KÝ
            </h1>
            <p className="text-xs font-sans text-[#8a9ba8] mt-1.5 leading-relaxed max-w-3xl">
              Xem danh sách các đội thi đăng ký tham gia sự kiện, kiểm tra thông tin thành viên và duyệt phê duyệt hoặc từ chối đăng ký.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3 py-1.5 bg-[rgba(245,158,11,0.1)] border border-[var(--color-warning)]/30 font-mono text-xs text-[var(--color-warning)]">
              CHỜ DUYỆT: {pendingTeams.length} ĐỘI
            </div>
            <Button
              variant="ghost"
              onClick={() => { refetch(); refetchRegistered(); }}
              className="flex items-center gap-2 text-xs font-mono"
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
      </div>

      <div className="max-w-5xl mx-auto mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[#8a9ba8]">Sự kiện:</span>
          <select
            value={eventId}
            onChange={(e) => {
              setEventId(e.target.value);
              setSelectedTrackId("ALL");
            }}
            className="px-4 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped font-bold focus:outline-none"
          >
            {myEvents.map((ev: any) => {
              const id = pickId(ev);
              return (
                <option key={id} value={id}>
                  {ev.eventName || ev.EventName || id}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[#8a9ba8] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#8b5cf6]" /> Hạng mục thi:
          </span>
          <select
            value={selectedTrackId}
            onChange={(e) => setSelectedTrackId(e.target.value)}
            className="px-4 py-2 bg-[var(--bg-input)] border border-[#8b5cf6]/40 text-[#8b5cf6] font-mono text-xs hud-clipped font-bold focus:outline-none cursor-pointer"
          >
            <option value="ALL">-- Tất cả Hạng mục thi --</option>
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

      {/* Content */}
      <div className="max-w-5xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-[var(--accent-coordinator)]" />
          </div>
        ) : pendingTeams.length === 0 ? (
          <Card className="w-full p-16 bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)] text-center">
            <CheckCircle2 className="w-12 h-12 text-[var(--color-success)] mx-auto mb-4 opacity-50" />
            <p className="font-mono text-sm text-[var(--text-muted)] tracking-widest uppercase">
              Không có đội thi nào đang chờ duyệt đăng ký
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingTeams.map((team: any) => {
              const teamId = team.id || team.TeamId || "";
              const teamName = team.teamName || team.TeamName || "Đội thi";

              return (
                <Card
                  key={teamId}
                  className="w-full p-6 bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)] hover:border-[var(--accent-coordinator)]/30 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-[var(--accent-team)]" />
                        <h3 className="font-mono text-base font-bold text-[var(--text-primary)]">
                          {teamName}
                        </h3>
                        <Badge tone="warning">PENDING APPROVAL</Badge>
                      </div>

                      <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
                        Mô tả: {team.description || "Chưa có mô tả chi tiết."}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] font-mono mt-2 italic">
                        Bấm &quot;Soi chi tiết đội thi&quot; để xem danh sách thành viên và trạng thái hồ sơ.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        onClick={() => setDetailModal(team)}
                        className="text-xs font-mono text-[var(--accent-primary)] border-[var(--accent-primary)]/40 hover:bg-[var(--accent-primary)]/10"
                      >
                        <Eye className="w-4 h-4" /> SOI CHI TIẾT ĐỘI THI
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto mt-10 space-y-4">
        <h2 className="font-display text-sm font-bold text-[var(--accent-coordinator)] tracking-widest uppercase">
          Đội đã duyệt — loại khỏi cuộc thi
        </h2>
        {registeredTeams.length === 0 ? (
          <p className="font-mono text-xs text-[var(--text-muted)]">Chưa có đội Registered trong sự kiện này.</p>
        ) : (
          registeredTeams.map((team: any) => {
            const teamId = pickId(team);
            const teamName = team.name || team.Name || team.teamName || team.TeamName || "Đội thi";
            return (
              <Card
                key={teamId}
                className="w-full p-4 bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)] flex items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-mono text-sm font-bold text-[var(--text-primary)]">{teamName}</h3>
                  <p className="font-mono text-[10px] text-[var(--text-muted)]">
                    {team.description || team.Description || ""}
                  </p>
                </div>
                <Button
                  onClick={() => setDisqualifyModal({ teamId, teamName })}
                  className="flex items-center gap-1.5 text-xs bg-[rgba(239,68,68,0.1)] border border-[var(--color-danger)]/40 text-[var(--color-danger)] font-mono"
                >
                  <Ban className="w-3.5 h-3.5" /> LOẠI ĐỘI
                </Button>
              </Card>
            );
          })
        )}
      </div>

      {/* Full Team Registration Inspection Detail Modal */}
      {detailModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => setDetailModal(null)}
        >
          <Card
            className="w-full max-w-2xl p-6 bg-[var(--bg-panel)] hud-clipped border-[var(--accent-coordinator)] space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-4">
              <div>
                <span className="font-mono text-[10px] text-[var(--accent-coordinator)] uppercase font-bold tracking-widest">// TEAM REGISTRATION INSPECTION MODAL</span>
                <h3 className="font-display text-xl font-bold text-[var(--text-primary)] uppercase tracking-widest mt-1">
                  ĐỘI THI: {detailModal.teamName || detailModal.TeamName}
                </h3>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="text-[var(--text-muted)] hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block">Mã Đội Thi:</span>
                  <span className="text-[var(--accent-team)] font-bold">#{detailModal.id || detailModal.TeamId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block">Trạng Thái:</span>
                  <Badge tone="warning">{detailModal.status || detailModal.Status}</Badge>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold block mb-1">Mô tả dự án & định hướng kỹ thuật:</span>
                <div className="p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-muted)]">
                  {detailModal.description || "Chưa có mô tả chi tiết cho đội thi này."}
                </div>
              </div>

              {/* Members Checklist Inspection */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[var(--text-primary)] uppercase font-bold flex items-center gap-2">
                    <Users className="w-4 h-4 text-[var(--accent-team)]" />
                    Danh sách thành viên ({detailMembers.length} / 5 người):
                  </span>
                  <span className={`text-[10px] font-bold ${detailMembers.length >= 3 && detailMembers.length <= 5 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                    {detailMembers.length >= 3 && detailMembers.length <= 5 ? "Sĩ số hợp lệ (3 - 5 người)" : "Sĩ số không hợp lệ"}
                  </span>
                </div>

                <div className="space-y-2">
                  {detailMembers.map((m: any, idx: number) => (
                    <div
                      key={m.userId || idx}
                      className="p-3 bg-[var(--bg-base)] border border-[var(--border-muted)] flex items-center justify-between hud-clipped"
                    >
                      <div>
                        <p className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 text-xs">
                          {m.roleName === "TeamLeader" && <Crown className="w-3.5 h-3.5 text-[var(--accent-team)]" />}
                          {m.fullName}
                          {m.roleName === "TeamLeader" && <span className="text-[9px] text-[var(--accent-team)]">[TRƯỞNG NHÓM]</span>}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Email: {m.email} · MSSV: {m.studentCode || "N/A"}</p>
                      </div>
                      <Badge tone={m.isApproved ? "success" : "danger"}>
                        {m.isApproved ? "HỒ SƠ THẺ SV OK" : "CHƯA DUYỆT THẺ"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--border-muted)]">
              <Button variant="ghost" onClick={() => setDetailModal(null)} className="font-mono text-xs">
                Đóng
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setRejectModal({
                    teamId: detailModal.id || detailModal.TeamId || "",
                    teamName: detailModal.teamName || detailModal.TeamName || "Đội thi"
                  })}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs bg-[rgba(239,68,68,0.1)] border border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white font-mono"
                >
                  <XCircle className="w-4 h-4" /> TỪ CHỐI ĐĂNG KÝ
                </Button>
                <Button
                  disabled={isApproving}
                  onClick={() => handleApprove(detailModal.id || detailModal.TeamId || "")}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs bg-[var(--color-success)] text-white hover:bg-white hover:text-black font-mono font-bold"
                >
                  <CheckCircle2 className="w-4 h-4" /> // PHÊ DUYỆT ĐĂNG KÝ ĐỘI THI &gt;
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Reject Reason Form Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
          <Card className="w-full max-w-md p-6 bg-[var(--bg-panel)] hud-clipped border-[var(--color-danger)]/40 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[var(--color-danger)]" />
              <h3 className="font-display text-base font-bold text-[var(--color-danger)] tracking-widest uppercase">
                TỪ CHỐI ĐĂNG KÝ ĐỘI THI
              </h3>
            </div>

            <p className="text-xs font-mono text-[var(--text-muted)]">
              Bạn đang từ chối đơn đăng ký của đội:{" "}
              <strong className="text-white">{rejectModal.teamName}</strong>. Lý do sẽ được gửi trực tiếp tới Đội trưởng.
            </p>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                Lý do từ chối cụ thể <span className="text-[var(--color-danger)]">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Sĩ số thành viên không đạt quy định 3-5 người, hoặc có thành viên chưa được duyệt thẻ SV cá nhân..."
                rows={3}
                className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs resize-none focus:outline-none focus:border-[var(--color-danger)]"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="flex-1 justify-center font-mono text-xs"
              >
                Hủy
              </Button>
              <Button
                disabled={!rejectReason.trim() || isRejecting}
                onClick={handleReject}
                className="flex-1 justify-center bg-[var(--color-danger)] text-white font-mono text-xs font-bold"
              >
                {isRejecting ? "Đang gửi..." : "// XÁC NHẬN TỪ CHỐI"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {disqualifyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
          <Card className="w-full max-w-md p-6 bg-[var(--bg-panel)] hud-clipped border-[var(--color-danger)]/40 space-y-4">
            <div className="flex items-center gap-3">
              <Ban className="w-5 h-5 text-[var(--color-danger)]" />
              <h3 className="font-display text-base font-bold text-[var(--color-danger)] tracking-widest uppercase">
                LOẠI ĐỘI KHỎI CUỘC THI
              </h3>
            </div>
            <p className="text-xs font-mono text-[var(--text-muted)]">
              Đội <strong className="text-white">{disqualifyModal.teamName}</strong> sẽ bị Disqualified. Lý do gửi tới đội trưởng.
            </p>
            <textarea
              value={disqualifyReason}
              onChange={(e) => setDisqualifyReason(e.target.value)}
              placeholder="Lý do loại đội (bắt buộc)"
              rows={3}
              className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs resize-none focus:outline-none focus:border-[var(--color-danger)]"
            />
            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => { setDisqualifyModal(null); setDisqualifyReason(""); }}
                className="flex-1 justify-center font-mono text-xs"
              >
                Hủy
              </Button>
              <Button
                disabled={!disqualifyReason.trim() || isDisqualifying}
                onClick={handleDisqualify}
                className="flex-1 justify-center bg-[var(--color-danger)] text-white font-mono text-xs font-bold"
              >
                {isDisqualifying ? "Đang gửi..." : "// XÁC NHẬN LOẠI"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
