"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import {
  useCancelInvitation,
  useConfirmRegistration,
  useInviteMember,
  useLeaveTeam,
  useMyTeam,
  useTeamInvitations,
  useTransferLeadership,
  useRemoveTeamMember,
  useUpdateTeam,
  useAcceptOrDeclineInvitation,
} from "@/repositories/teamsRepository";
import { useMyInvitations, type MyInvitationItem } from "@/repositories/usersRepository";
import { useQueryClient } from "@tanstack/react-query";
import { Card, ConfirmDialog, SkeletonRows } from "@/components/ui";
import { useToast } from "@/providers/ToastProvider";
import { AlertTriangle, Check, X, Mail, Sparkles, User, RefreshCw } from "lucide-react";
import {
  AvailableTeamsList,
  buildRequirements,
  ConfirmRegistrationDialog,
  CreateTeamForm,
  InviteMemberModal,
  InvitePanel,
  MemberRoster,
  RegistrationChecklist,
  TeamHeader,
  TeamInfoCard,
  TransferLeaderDialog,
  type InvitationView,
  type TeamStatus,
  type TeamView,
} from "@/components/domain/team";
import { TeamCountdownTimer } from "@/components/domain/TeamCountdownTimer";
import { useEventRounds } from "@/repositories/eventsRepository";
import type { MemberItem } from "@/viewModels/teamTypes";

// BE trả camelCase, một vài endpoint cũ trả PascalCase — đọc cả hai để không
// phụ thuộc vào thứ tự dọn dẹp bên backend.
function pick(obj: unknown, ...keys: string[]): string {
  const record = obj as Record<string, unknown> | null | undefined;
  for (const key of keys) {
    const value = record?.[key];
    if (value != null && value !== "") return String(value);
  }
  return "";
}

export function MyTeamView() {
  const toast = useToast();
  const { user, activeRole } = useAuth();
  const searchParams = useSearchParams();
  const roleName = pick(activeRole, "RoleName", "roleName");
  const currentUserId = pick(user, "id", "userId", "UserID");
  const eventIdFromUrl = searchParams.get("eventId") || "";
  const eventIdFromRole =
    pick(activeRole, "eventId", "EventId") ||
    ((activeRole?.assignedEventIds?.[0] as string | undefined) ?? "");
  const targetEventId = eventIdFromUrl || eventIdFromRole;

  const { data: rawTeam, isLoading } = useMyTeam(targetEventId || undefined);

  const team: TeamView | null = rawTeam
    ? {
        id: pick(rawTeam, "id", "Id", "TeamId"),
        teamName: pick(rawTeam, "name", "Name", "TeamName") || "Đội chưa đặt tên",
        description: pick(rawTeam, "description", "Description"),
        eventId: pick(rawTeam, "eventId", "EventId") || targetEventId,
        eventName: pick(rawTeam, "eventName", "EventName") || "Sự kiện",
        status: (pick(rawTeam, "status", "Status") || "Forming") as TeamStatus,
        createdTime: pick(rawTeam, "createdTime", "CreatedTime"),
        lastRejectReason: pick(rawTeam, "lastRejectReason", "LastRejectReason"),
      }
    : null;

  const members: MemberItem[] = ((rawTeam?.members ?? rawTeam?.Members ?? []) as unknown[]).map((m) => ({
    userId: pick(m, "userId", "UserId"),
    fullName: pick(m, "fullName", "FullName") || "Thành viên",
    email: pick(m, "email", "Email"),
    roleName: (pick(m, "roleName", "RoleName") || "TeamMember") as MemberItem["roleName"],
    isApproved: Boolean((m as Record<string, unknown>).isApproved ?? (m as Record<string, unknown>).IsApproved),
    hasStudentProfile: Boolean(
      (m as Record<string, unknown>).hasStudentProfile ?? (m as Record<string, unknown>).HasStudentProfile
    ),
    school: pick(m, "studentCode", "StudentCode"),
  }));

  const currentMember = members.find((m) => m.userId === currentUserId);
  const isLeader =
    roleName === "TeamLeader" ||
    currentMember?.roleName === "TeamLeader" ||
    Boolean(rawTeam?.leaderUserId && rawTeam.leaderUserId === currentUserId) ||
    Boolean(rawTeam?.LeaderUserId && rawTeam.LeaderUserId === currentUserId) ||
    Boolean(rawTeam?.leaderId && rawTeam.leaderId === currentUserId) ||
    Boolean(rawTeam?.LeaderId && rawTeam.LeaderId === currentUserId) ||
    Boolean(rawTeam?.isLeader && rawTeam.isLeader === true);

  const {
    data: rawInvitations = [],
    isLoading: isLoadingInvitations,
    isError: hasInvitationError,
  } = useTeamInvitations(team?.id);

  const invitations: InvitationView[] = (rawInvitations as unknown[]).map((inv) => ({
    id: pick(inv, "invitationId", "InvitationId", "id", "Id"),
    email: pick(inv, "invitedUserEmail", "InvitedUserEmail", "email", "Email"),
    fullName: pick(inv, "invitedUserFullName", "InvitedUserFullName"),
    status: pick(inv, "status", "Status") || "PendingAccept",
    statusLabel: pick(inv, "statusLabel", "StatusLabel") || "Đang chờ",
    sentAt: pick(inv, "createdTime", "CreatedTime", "sentAt"),
    respondedAt: pick(inv, "respondedAt", "RespondedAt"),
  }));

  const queryClient = useQueryClient();
  const { data: invData, isLoading: isLoadingMyInv, refetch: refetchMyInv } = useMyInvitations(!!user);
  const { mutateAsync: respondInvitation, isPending: isRespondingInv } = useAcceptOrDeclineInvitation();
  const myInvitations = invData?.invitations ?? [];
  const pendingMyInvitations = myInvitations.filter(
    (i) => i.status === "PendingAccept" || (i as any).Status === "PendingAccept"
  );

  const { mutateAsync: inviteMember, isPending: isInviting } = useInviteMember();
  const { mutateAsync: kickMember, isPending: isKicking } = useRemoveTeamMember();
  const [kickTarget, setKickTarget] = useState<{ id: string; name: string } | null>(null);
  const { mutateAsync: cancelInvitation, isPending: isCancelling } = useCancelInvitation();
  const { mutateAsync: confirmRegistration, isPending: isRegistering } = useConfirmRegistration();
  const { mutateAsync: transferLeadership, isPending: isTransferring } = useTransferLeadership();
  const { mutateAsync: leaveTeam, isPending: isLeaving } = useLeaveTeam();
  const { mutateAsync: updateTeam, isPending: isUpdatingTeam } = useUpdateTeam();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [noTeamTab, setNoTeamTab] = useState<"invitations" | "create" | "find">("create");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Tự động chuyển sang tab Lời mời nếu thí sinh đang có lời mời vào đội chờ duyệt
  useEffect(() => {
    if (pendingMyInvitations.length > 0 && !rawTeam) {
      setNoTeamTab("invitations");
    }
  }, [pendingMyInvitations.length, rawTeam]);

  const handleAcceptInv = async (inv: any) => {
    const invId = inv.invitationId || (inv as any).InvitationId || inv.id || (inv as any).Id;
    const targetName = inv.targetName || (inv as any).TargetName || "đội thi";
    if (!invId) return;

    try {
      await respondInvitation({ invitationId: invId, isAccepted: true });
      toast.success(`🎉 Chúc mừng! Bạn đã chính thức gia nhập đội "${targetName}".`);
      queryClient.invalidateQueries({ queryKey: ["my-team"] });
      queryClient.invalidateQueries({ queryKey: ["myTeam"] });
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      refetchMyInv();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Không thể tham gia đội. Vui lòng kiểm tra lại hồ sơ sinh viên.";
      toast.error(msg);
    }
  };

  const handleDeclineInv = async (inv: any) => {
    const invId = inv.invitationId || (inv as any).InvitationId || inv.id || (inv as any).Id;
    const targetName = inv.targetName || (inv as any).TargetName || "đội thi";
    if (!invId) return;

    try {
      await respondInvitation({ invitationId: invId, isAccepted: false });
      toast.info(`Bạn đã từ chối lời mời tham gia đội "${targetName}".`);
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
      refetchMyInv();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Lỗi xử lý lời mời.");
    }
  };

  const { data: rawDbRounds = [] } = useEventRounds(team?.eventId || targetEventId);
  const eventRounds: any[] = Array.isArray(rawDbRounds) ? rawDbRounds : [];
  const activeRound = eventRounds.length > 0 ? eventRounds[0] : null;

  const [transferTarget, setTransferTarget] = useState<{ id: string; name: string } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<InvitationView | null>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [dialogError, setDialogError] = useState("");

  if (isLoading) {
    return (
      <main className="hud-lattice min-h-[calc(100dvh-4rem)] px-[var(--space-lg)] py-[var(--space-xl)]">
        <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-[var(--space-lg)]">
          <SkeletonRows rows={1} />
          <div className="grid grid-cols-1 gap-[var(--space-lg)] lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <SkeletonRows rows={4} />
            </Card>
            <Card>
              <SkeletonRows rows={3} />
            </Card>
          </div>
        </div>
      </main>
    );
  }

  if (!team) {
    const isJudge = roleName === "Judge";
    const isMentor = roleName === "Mentor";
    const isEC = roleName === "EventCoordinator" || roleName === "Coordinator";
    const isAdmin = Boolean(user?.isAdmin || user?.IsAdmin);

    if (isJudge || isMentor || isEC || isAdmin) {
      const redirectUrl = isJudge
        ? `/judge/scoring${targetEventId ? `?eventId=${targetEventId}` : ""}`
        : isMentor
        ? `/mentor/tracks${targetEventId ? `?eventId=${targetEventId}` : ""}`
        : isEC
        ? `/coordinator/dashboard${targetEventId ? `?eventId=${targetEventId}` : ""}`
        : "/admin/dashboard";

      const workspaceTitle = isJudge
        ? "BÀN CHẤM ĐIỂM GIÁM KHẢO"
        : isMentor
        ? "BÀN CỐ VẤN CHUYÊN MÔN"
        : isEC
        ? "BÀN ĐIỀU PHỐI BAN TỔ CHỨC"
        : "BẢNG ĐIỀU HÀNH ADMIN";

      return (
        <main className="hud-lattice min-h-[calc(100dvh-4rem)] px-[var(--space-lg)] py-12 flex items-center justify-center font-mono">
          <Card className="max-w-xl w-full p-8 bg-[#10171a] border border-amber-500/40 hud-clipped space-y-6 text-center shadow-lg">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase hud-clipped inline-block">
                [ CHÍNH SÁCH BẢO VỆ TÍNH LIÊM CHÍNH CUỘC THI ]
              </span>
              <h2 className="font-display text-xl font-bold text-white uppercase tracking-wide">
                Không Thể Tham Gia Hoặc Tạo Đội Thi
              </h2>
            </div>

            <p className="text-xs text-zinc-300 font-sans leading-relaxed">
              Tài khoản của bạn đang giữ vai trò <strong>{isJudge ? "Giám Khảo (Judge)" : isMentor ? "Cố Vấn (Mentor)" : isEC ? "Ban Tổ Chức (Coordinator)" : "Quản Trị Viên"}</strong> trong hệ thống.
              Theo quy chế chống xung đột lợi ích (Conflict of Interest), Chuyên gia chuyên môn và Ban tổ chức không được phép đăng ký hoặc tham gia đội thi của thí sinh.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href={redirectUrl}>
                <button className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-white text-black font-bold uppercase text-xs hud-clipped transition-all cursor-pointer shadow-sm">
                  [ VÀO {workspaceTitle} &gt; ]
                </button>
              </Link>
              <Link href="/events">
                <button className="w-full sm:w-auto px-4 py-2.5 bg-[#141f23] border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-bold uppercase text-xs hud-clipped transition-all cursor-pointer">
                  [ KHÁM PHÁ SỰ KIỆN ]
                </button>
              </Link>
            </div>
          </Card>
        </main>
      );
    }

    return (
      <main className="hud-lattice min-h-[calc(100dvh-4rem)] px-[var(--space-lg)] py-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-400">
                [ KHÔNG GIAN ĐỘI THI ]
              </div>
              <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold uppercase text-white">
                Gia Nhập Hoặc Tạo Đội Thi Mới
              </h1>
            </div>

            <div className="flex items-center gap-2 bg-zinc-900/90 p-1 border border-zinc-800 rounded hud-clipped">
              {pendingMyInvitations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setNoTeamTab("invitations")}
                  className={`px-4 py-2 text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                    noTeamTab === "invitations"
                      ? "bg-cyan-400 text-black shadow-sm font-extrabold"
                      : "text-cyan-300 hover:text-white"
                  }`}
                >
                  <Mail className="size-3.5" /> Lời Mời Nhận Được ({pendingMyInvitations.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setNoTeamTab("create")}
                className={`px-4 py-2 text-xs font-bold uppercase transition-all cursor-pointer ${
                  noTeamTab === "create"
                    ? "bg-[var(--accent-team)] text-black shadow-sm font-extrabold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                ⚡ Tạo Đội Mới
              </button>
              <button
                type="button"
                onClick={() => setNoTeamTab("find")}
                className={`px-4 py-2 text-xs font-bold uppercase transition-all cursor-pointer ${
                  noTeamTab === "find"
                    ? "bg-cyan-400 text-black shadow-sm font-extrabold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                🔍 Tìm & Gia Nhập Đội
              </button>
            </div>
          </div>

          {noTeamTab === "invitations" && pendingMyInvitations.length > 0 ? (
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-r from-cyan-950/60 to-[#101e24] border-2 border-cyan-400 hud-clipped shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/30 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-3 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-wider">
                      [ BẠN CÓ {pendingMyInvitations.length} LỜI MỜI GIA NHẬP ĐỘI THI ĐANG CHỜ ]
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-400">
                    Do Đội trưởng gửi lời mời chính thức
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {pendingMyInvitations.map((inv: any) => {
                    const invId = inv.invitationId || inv.InvitationId || inv.id || inv.Id;
                    const targetName = inv.targetName || inv.TargetName || "Đội thi";
                    const inviter = inv.inviterName || inv.InviterName || "Đội trưởng";

                    return (
                      <div
                        key={invId}
                        className="p-5 bg-black/60 border border-cyan-500/40 hud-clipped flex flex-col md:flex-row md:items-center justify-between gap-5"
                      >
                        <div className="space-y-2 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold uppercase rounded">
                              LỜI MỜI VÀO ĐỘI
                            </span>
                            <h3 className="font-display text-xl font-bold text-white uppercase truncate">
                              {targetName}
                            </h3>
                          </div>
                          <p className="font-sans text-xs text-zinc-300 leading-relaxed">
                            Đội trưởng <strong>{inviter}</strong> đã gửi lời mời bạn tham gia đội thi này. Nhấn <strong>[ Đồng ý vào đội ]</strong> để chính thức gia nhập đội và mở không gian làm việc của đội ngay lập tức!
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                          <button
                            disabled={isRespondingInv}
                            onClick={() => handleAcceptInv(inv)}
                            className="px-5 py-2.5 bg-emerald-500 hover:bg-white text-black font-bold uppercase hud-clipped transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5 text-xs"
                          >
                            <Check className="size-4" /> [ ✓ ĐỒNG Ý VÀO ĐỘI ]
                          </button>
                          <button
                            disabled={isRespondingInv}
                            onClick={() => handleDeclineInv(inv)}
                            className="px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-500/40 font-bold uppercase hud-clipped transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 text-xs"
                          >
                            <X className="size-4" /> [ ✕ TỪ CHỐI ]
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 font-mono text-xs text-zinc-400">
                <span>Hoặc bạn muốn tự tạo đội riêng của mình?</span>
                <button
                  onClick={() => setNoTeamTab("create")}
                  className="text-cyan-400 hover:underline cursor-pointer font-bold"
                >
                  Chuyển sang Khởi tạo đội mới &gt;
                </button>
              </div>
            </div>
          ) : noTeamTab === "create" ? (
            <CreateTeamForm defaultEventId={targetEventId} />
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded text-xs text-zinc-300 font-sans leading-relaxed">
                💡 <strong>Dành cho thí sinh chưa có nhóm:</strong> Danh sách bên dưới hiển thị các đội thi trong sự kiện đang tuyển thêm thành viên. Bạn có thể nhấn <strong>Gửi Email Đề Nghị Gia Nhập</strong> để gửi thông tin ứng tuyển trực tiếp tới Đội trưởng.
              </div>
              <AvailableTeamsList
                eventId={targetEventId}
                eventName="Sự kiện SEAL"
                onSwitchToCreate={() => setNoTeamTab("create")}
              />
            </div>
          )}
        </div>
      </main>
    );
  }

  const requirements = buildRequirements(members);
  const isForming = team.status === "Forming" || team.status === "Rejected";
  const canConfirm =
    isForming && requirements.hasEnoughMembers && requirements.membersWithoutProfile.length === 0;
  const showRequirementBanner =
    isForming && (!requirements.hasEnoughMembers || requirements.membersWithoutProfile.length > 0);

  const closeDialogs = () => {
    setShowRegisterDialog(false);
    setShowLeaveDialog(false);
    setShowEditDialog(false);
    setShowInviteModal(false);
    setTransferTarget(null);
    setCancelTarget(null);
    setDialogError("");
  };

  const runAction = async (action: () => Promise<unknown>, fallback: string) => {
    setDialogError("");
    try {
      await action();
      closeDialogs();
    } catch (err: unknown) {
      const detail = err as { message?: string; response?: { data?: { message?: string } } };
      setDialogError(detail?.response?.data?.message || detail?.message || fallback);
    }
  };

  return (
    <main className="hud-lattice min-h-[calc(100dvh-4rem)] px-[var(--space-lg)] py-[var(--space-xl)]">
      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-[var(--space-lg)]">
        <TeamHeader
          team={team}
          isLeader={isLeader}
          canConfirm={canConfirm}
          isLeaving={isLeaving}
          onOpenInvite={() => setShowInviteModal(true)}
          onConfirmRegistration={() => {
            setDialogError("");
            setShowRegisterDialog(true);
          }}
          onLeave={() => {
            setDialogError("");
            setShowLeaveDialog(true);
          }}
          onEdit={() => {
            setDialogError("");
            setEditName(team.teamName);
            setEditDescription(team.description || "");
            setShowEditDialog(true);
          }}
        />

        {team.status === "PendingApproval" && (
          <Card className="border-sky-500/40 bg-sky-950/20 p-4 hud-clipped space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-mono font-bold text-xs uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span>Hồ sơ đã gửi tới Ban Tổ Chức — Đang chờ thẩm định</span>
            </div>
            <p className="font-sans text-xs text-sky-200/90 leading-relaxed">
              Hệ thống đã gửi email xác nhận ghi danh. Ban Tổ Chức sẽ kiểm tra tính hợp lệ của đội (sĩ số 3–5 người, thẻ sinh viên các thành viên) và gửi kết quả duyệt qua thông báo & email trong thời gian sớm nhất.
            </p>
          </Card>
        )}

        {(team.lastRejectReason || team.status === "Rejected") && (
          <Card className="border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-5 hud-clipped space-y-3">
            <div className="flex items-center gap-2 text-[var(--color-danger)] font-mono font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-[var(--color-danger)]" />
              <span>Lý do Ban Tổ Chức từ chối / trả hồ sơ</span>
            </div>
            <div className="p-3.5 bg-black/50 border border-red-500/30 font-mono text-xs text-red-200 leading-relaxed rounded">
              {team.lastRejectReason || "Hồ sơ đội chưa đáp ứng đầy đủ thể lệ của giải đấu. Vui lòng kiểm tra lại thông tin các thành viên."}
            </div>
            <p className="font-sans text-[11px] text-zinc-400">
              💡 Vui lòng hoàn thiện lại đội hình hoặc cập nhật hồ sơ thành viên theo lý do trên, sau đó nhấn nút <strong>[ Ghi danh với BTC ]</strong> để gửi lại hồ sơ xét duyệt.
            </p>
          </Card>
        )}

        {showRequirementBanner && (
          <Card className="border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5">
            <h2 className="mb-[var(--space-sm)] font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--color-warning)]">
              Chưa đủ điều kiện ghi danh
            </h2>
            <RegistrationChecklist requirements={requirements} />
          </Card>
        )}

        {/* TEAM COUNTDOWN TIMER WIDGET */}
        {activeRound && (
          <TeamCountdownTimer
            roundName={activeRound.roundName || activeRound.RoundName || "VÒNG 1: Ý TƯỞNG & ĐỀ XUẤT"}
            startDate={activeRound.startDate || activeRound.StartDate}
            deadline={activeRound.endDate || activeRound.EndDate}
            deliverables={[
              { key: "github", label: "MÃ NGUỒN REPO", isSubmitted: true },
              { key: "slides", label: "SLIDE THUYẾT TRÌNH", isSubmitted: false },
              { key: "demo_video", label: "VIDEO DEMO", isSubmitted: false },
            ]}
          />
        )}

        <div className="grid grid-cols-1 gap-[var(--space-lg)] lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MemberRoster
              members={members}
              currentUserId={currentUserId}
              isLeader={isLeader}
              onOpenInvite={() => setShowInviteModal(true)}
              onTransfer={(id, name) => {
                setDialogError("");
                setTransferTarget({ id, name });
              }}
              onKick={(id, name) => {
                setDialogError("");
                setKickTarget({ id, name });
              }}
            />
          </div>

          <div className="flex flex-col gap-[var(--space-lg)]">
            {isLeader && (
              <InvitePanel
                invitations={invitations}
                memberCount={requirements.memberCount}
                canInvite={isForming}
                isLoading={isLoadingInvitations}
                loadError={hasInvitationError}
                isInviting={isInviting}
                isCancelling={isCancelling}
                onInvite={async (email) => {
                  return await inviteMember({ teamId: team.id, email });
                }}
                onCancel={(invitation) => {
                  setDialogError("");
                  setCancelTarget(invitation);
                }}
              />
            )}
            <TeamInfoCard team={team} memberCount={requirements.memberCount} isLeader={isLeader} />
          </div>
        </div>
      </div>

      <ConfirmRegistrationDialog
        open={showRegisterDialog}
        teamName={team.teamName}
        eventName={team.eventName}
        requirements={requirements}
        canConfirm={canConfirm}
        isPending={isRegistering}
        error={dialogError}
        onConfirm={() =>
          runAction(
            async () => {
              await confirmRegistration(team.id);
              toast.success("Gửi hồ sơ ghi danh với Ban Tổ Chức thành công! Hệ thống đã gửi email xác nhận và thông báo cho Ban Tổ Chức thẩm định.");
            },
            "Không ghi danh được. Kiểm tra lại số thành viên và hồ sơ.",
          )
        }
        onCancel={closeDialogs}
      />

      <TransferLeaderDialog
        open={Boolean(transferTarget)}
        targetName={transferTarget?.name ?? ""}
        isPending={isTransferring}
        error={dialogError}
        onConfirm={() =>
          runAction(
            () => transferLeadership({ teamId: team.id, targetUserId: transferTarget!.id }),
            "Không gửi được yêu cầu chuyển quyền.",
          )
        }
        onCancel={closeDialogs}
      />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        eyebrow="Hủy lời mời"
        title="Thu hồi lời mời"
        description={`Lời mời gửi tới ${cancelTarget?.email ?? ""} sẽ bị hủy.`}
        confirmLabel="Hủy lời mời"
        cancelLabel="Giữ lại"
        destructive
        pending={isCancelling}
        error={dialogError || undefined}
        onConfirm={() =>
          runAction(
            () => cancelInvitation({ teamId: team.id, invitationId: cancelTarget!.id }),
            "Không hủy được lời mời.",
          )
        }
        onCancel={closeDialogs}
      />

      <ConfirmDialog
        open={showLeaveDialog}
        eyebrow="Rời đội"
        title="Rời khỏi đội thi"
        description={`Bạn sẽ rời đội ${team.teamName} và mất quyền truy cập bài nộp của đội.`}
        confirmLabel="Rời đội"
        cancelLabel="Ở lại"
        destructive
        pending={isLeaving}
        error={dialogError || undefined}
        onConfirm={() => runAction(() => leaveTeam(team.id), "Không rời đội được.")}
        onCancel={closeDialogs}
      />

      <ConfirmDialog
        open={Boolean(kickTarget)}
        eyebrow="Xóa thành viên"
        title={`Xóa ${kickTarget?.name ?? ""} khỏi đội?`}
        description="Thành viên sẽ mất quyền truy cập đội và phải được mời lại nếu muốn tham gia lại."
        confirmLabel="Xóa khỏi đội"
        cancelLabel="Hủy"
        destructive
        pending={isKicking}
        error={dialogError || undefined}
        onConfirm={() =>
          runAction(
            () => kickMember({ teamId: team.id, userId: kickTarget!.id }),
            "Không xóa được thành viên.",
          )
        }
        onCancel={() => { setKickTarget(null); setDialogError(""); }}
      />

      {showEditDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-md space-y-4 p-6">
            <h3 className="font-display text-base font-bold uppercase text-[color:var(--accent-team)]">
              Sửa Thông Tin Đội
            </h3>
            <div className="space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-[color:var(--text-muted)]">Tên đội</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-[var(--border-muted)] bg-[var(--bg-input)] px-3 py-2 text-[color:var(--text-primary)]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-[color:var(--text-muted)]">Mô tả</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full border border-[var(--border-muted)] bg-[var(--bg-input)] px-3 py-2 text-[color:var(--text-primary)]"
                />
              </div>
              {dialogError && <p className="text-[color:var(--color-danger)]">{dialogError}</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-[var(--border-muted)] pt-3">
              <button
                onClick={closeDialogs}
                className="px-3 py-1.5 font-mono text-xs text-[color:var(--text-muted)] hover:text-white"
              >
                Hủy
              </button>
              <button
                onClick={() =>
                  runAction(
                    () => updateTeam({ id: team.id, payload: { name: editName.trim(), description: editDescription.trim() } }),
                    "Không cập nhật được thông tin đội.",
                  )
                }
                disabled={isUpdatingTeam || !editName.trim()}
                className="bg-[color:var(--accent-team)] px-4 py-1.5 font-mono text-xs font-bold text-black hover:brightness-110 disabled:opacity-50"
              >
                {isUpdatingTeam ? "Đang lưu..." : "Lưu Thay Đổi"}
              </button>
            </div>
          </Card>
        </div>
      )}

      {team && (
        <InviteMemberModal
          open={showInviteModal}
          teamId={team.id}
          teamName={team.teamName}
          memberCount={requirements.memberCount}
          pendingCount={
            invitations.filter(
              (i) => i.status === "PendingAccept" || i.status === "Pending" || !i.status
            ).length
          }
          onClose={() => setShowInviteModal(false)}
          onInvite={async (args) => {
            return await inviteMember(args);
          }}
        />
      )}
    </main>
  );
}
