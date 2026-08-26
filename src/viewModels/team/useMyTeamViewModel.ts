import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
import { useMyInvitations } from "@/repositories/usersRepository";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/providers/ToastProvider";
import {
  type InvitationView,
  type TeamView,
} from "@/components/domain/team";
import { useEventRounds } from "@/repositories/eventsRepository";
import type { MemberItem } from "@/viewModels/team/teamTypes";
import { teamService } from "@/services/team/teamService";

function pick(obj: unknown, ...keys: string[]): string {
  const record = obj as Record<string, unknown> | null | undefined;
  for (const key of keys) {
    const value = record?.[key];
    if (value != null && value !== "") return String(value);
  }
  return "";
}

export function useMyTeamViewModel() {
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

  const team: TeamView | null = useMemo(
    () => teamService.normalizeTeamView(rawTeam, targetEventId),
    [rawTeam, targetEventId]
  );

  const members: MemberItem[] = useMemo(
    () => teamService.normalizeTeamMembers(rawTeam),
    [rawTeam]
  );

  const isLeader = useMemo(
    () => teamService.checkIsTeamLeader(rawTeam, members, currentUserId, roleName),
    [rawTeam, members, currentUserId, roleName]
  );

  const {
    data: rawInvitations = [],
    isLoading: isLoadingInvitations,
    isError: hasInvitationError,
  } = useTeamInvitations(team?.id);

  const invitations: InvitationView[] = useMemo(
    () => teamService.normalizeTeamInvitations(rawInvitations as unknown[]),
    [rawInvitations]
  );

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
      toast.success(`Chúc mừng! Bạn đã chính thức gia nhập đội "${targetName}".`);
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

  const handleInviteSubmit = async (args: string | { teamId?: string; email: string; notes?: string }) => {
    if (!team?.id) return;
    const email = typeof args === "string" ? args : args.email;
    const notes = typeof args === "string" ? undefined : args.notes;
    try {
      await inviteMember({ teamId: team.id, email, notes });
      toast.success(`Đã gửi lời mời tới ${email}`);
      setShowInviteModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Gửi lời mời thất bại");
    }
  };

  const handleKickMember = async () => {
    if (!team?.id || !kickTarget) return;
    try {
      await kickMember({ teamId: team.id, userId: kickTarget.id });
      toast.success(`Đã xóa thành viên ${kickTarget.name} khỏi đội`);
      setKickTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Xóa thành viên thất bại");
    }
  };

  const handleCancelInvitation = async () => {
    if (!team?.id || !cancelTarget) return;
    try {
      await cancelInvitation({ teamId: team.id, invitationId: cancelTarget.id });
      toast.success("Đã hủy lời mời");
      setCancelTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Hủy lời mời thất bại");
    }
  };

  const handleTransferLeadership = async () => {
    if (!team?.id || !transferTarget) return;
    try {
      await transferLeadership({ teamId: team.id, newLeaderUserId: transferTarget.id });
      toast.success(`Đã gửi yêu cầu chuyển quyền Trưởng nhóm cho ${transferTarget.name} — đang chờ họ xác nhận.`);
      setTransferTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Chuyển quyền thất bại");
    }
  };

  const handleLeaveTeam = async () => {
    if (!team?.id) return;
    try {
      await leaveTeam(team.id);
      toast.success("Đã rời khỏi đội");
      setShowLeaveDialog(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Rời đội thất bại");
    }
  };

  const handleConfirmRegistration = async () => {
    if (!team?.id) return;
    setDialogError("");
    try {
      await confirmRegistration(team.id);
      toast.success("Đã gửi hồ sơ đăng ký thi đấu");
      setShowRegisterDialog(false);
    } catch (err: any) {
      setDialogError(err?.response?.data?.message || err?.message || "Xác nhận đăng ký thất bại");
    }
  };

  const handleSaveTeamEdit = async () => {
    if (!team?.id) return;
    try {
      await updateTeam({
        id: team.id,
        payload: {
          name: editName.trim() || team.teamName,
          description: editDescription.trim(),
        },
      });
      toast.success("Cập nhật thông tin đội thành công");
      setShowEditDialog(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Cập nhật thất bại");
    }
  };

  return {
    state: {
      isLoading,
      team,
      members,
      isLeader,
      currentUserId,
      roleName,
      targetEventId,
      invitations,
      isLoadingInvitations,
      hasInvitationError,
      myInvitations,
      pendingMyInvitations,
      isLoadingMyInv,
      isRespondingInv,
      isInviting,
      isKicking,
      kickTarget,
      isCancelling,
      cancelTarget,
      isRegistering,
      isTransferring,
      transferTarget,
      isLeaving,
      isUpdatingTeam,
      showEditDialog,
      showInviteModal,
      showRegisterDialog,
      showLeaveDialog,
      dialogError,
      noTeamTab,
      editName,
      editDescription,
      activeRound,
    },
    actions: {
      setKickTarget,
      setCancelTarget,
      setTransferTarget,
      setShowEditDialog,
      setShowInviteModal,
      setShowRegisterDialog,
      setShowLeaveDialog,
      setNoTeamTab,
      setEditName,
      setEditDescription,
      handleAcceptInv,
      handleDeclineInv,
      handleInviteSubmit,
      handleKickMember,
      handleCancelInvitation,
      handleTransferLeadership,
      handleLeaveTeam,
      handleConfirmRegistration,
      handleSaveTeamEdit,
      refetchMyInv,
    },
  };
}
