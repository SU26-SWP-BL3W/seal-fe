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
import { Card, ConfirmDialog, SkeletonRows, Button, Badge } from "@/components/ui";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/providers/ToastProvider";
import { AlertTriangle, Check, X, Mail } from "lucide-react";
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
      toast.success(`Bạn đã gia nhập đội "${targetName}".`);
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
      <PageShell>
        <SkeletonRows rows={1} />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <SkeletonRows rows={4} />
          </Card>
          <Card>
            <SkeletonRows rows={3} />
          </Card>
        </div>
      </PageShell>
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
        ? "Bàn chấm điểm giám khảo"
        : isMentor
        ? "Bàn cố vấn chuyên môn"
        : isEC
        ? "Bàn điều phối ban tổ chức"
        : "Bảng điều hành admin";

      return (
        <PageShell className="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
          <Card className="max-w-xl w-full space-y-6 p-8 text-center">
            <div className="space-y-2">
              <Badge tone="warning">Chính sách bảo vệ tính liêm chính</Badge>
              <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                Không thể tham gia hoặc tạo đội thi
              </h2>
            </div>

            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              Tài khoản của bạn đang giữ vai trò{" "}
              <strong>
                {isJudge ? "Giám khảo" : isMentor ? "Cố vấn" : isEC ? "Ban tổ chức" : "Quản trị viên"}
              </strong>{" "}
              trong hệ thống. Theo quy chế chống xung đột lợi ích, chuyên gia và ban tổ chức không được phép tham gia đội thi của thí sinh.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <Link href={redirectUrl}>
                <Button accent="coordinator">Vào {workspaceTitle}</Button>
              </Link>
              <Link href="/events">
                <Button variant="ghost">Khám phá sự kiện</Button>
              </Link>
            </div>
          </Card>
        </PageShell>
      );
    }

    return (
      <PageShell className="max-w-4xl">
        <PageHeader
          title="Gia nhập hoặc tạo đội thi"
          description="Tạo đội mới, tìm đội đang tuyển thành viên, hoặc phản hồi lời mời."
          actions={
            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-1">
              {pendingMyInvitations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setNoTeamTab("invitations")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    noTeamTab === "invitations"
                      ? "bg-[var(--accent-team)] text-[var(--bg-base)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Mail className="mr-1 inline size-3.5" />
                  Lời mời ({pendingMyInvitations.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setNoTeamTab("create")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  noTeamTab === "create"
                    ? "bg-[var(--accent-team)] text-[var(--bg-base)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                Tạo đội mới
              </button>
              <button
                type="button"
                onClick={() => setNoTeamTab("find")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  noTeamTab === "find"
                    ? "bg-[var(--accent-team)] text-[var(--bg-base)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                Tìm đội
              </button>
            </div>
          }
        />

        {noTeamTab === "invitations" && pendingMyInvitations.length > 0 ? (
          <div className="space-y-4">
            <Card className="space-y-4 p-5">
              <div className="flex flex-col justify-between gap-2 border-b border-[var(--border-muted)] pb-3 sm:flex-row sm:items-center">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Bạn có {pendingMyInvitations.length} lời mời gia nhập đội đang chờ
                </p>
                <span className="text-xs text-[var(--text-muted)]">Do đội trưởng gửi</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {pendingMyInvitations.map((inv: any) => {
                  const invId = inv.invitationId || inv.InvitationId || inv.id || inv.Id;
                  const targetName = inv.targetName || inv.TargetName || "Đội thi";
                  const inviter = inv.inviterName || inv.InviterName || "Đội trưởng";

                  return (
                    <div
                      key={invId}
                      className="flex flex-col justify-between gap-4 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)]/50 p-5 md:flex-row md:items-center"
                    >
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="info">Lời mời vào đội</Badge>
                          <h3 className="truncate font-display text-lg font-semibold text-[var(--text-primary)]">
                            {targetName}
                          </h3>
                        </div>
                        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                          Đội trưởng <strong>{inviter}</strong> đã mời bạn tham gia đội thi này.
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          accent="team"
                          disabled={isRespondingInv}
                          onClick={() => handleAcceptInv(inv)}
                          className="text-xs"
                        >
                          <Check className="size-4" /> Đồng ý
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={isRespondingInv}
                          onClick={() => handleDeclineInv(inv)}
                          className="text-xs text-[var(--color-danger)]"
                        >
                          <X className="size-4" /> Từ chối
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Hoặc bạn muốn tự tạo đội riêng?</span>
              <button
                type="button"
                onClick={() => setNoTeamTab("create")}
                className="font-medium text-[var(--accent-team)] hover:underline"
              >
                Chuyển sang tạo đội mới
              </button>
            </div>
          </div>
        ) : noTeamTab === "create" ? (
          <CreateTeamForm defaultEventId={targetEventId} />
        ) : (
          <div className="space-y-4">
            <Card className="border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/5 p-4 text-sm leading-relaxed text-[var(--text-muted)]">
              Danh sách bên dưới hiển thị các đội đang tuyển thêm thành viên. Bạn có thể gửi email đề nghị gia nhập trực tiếp tới đội trưởng.
            </Card>
            <AvailableTeamsList
              eventId={targetEventId}
              eventName="Sự kiện SEAL"
              onSwitchToCreate={() => setNoTeamTab("create")}
            />
          </div>
        )}
      </PageShell>
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
    <PageShell>
      <div className="flex flex-col gap-6">
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
          <Card className="space-y-2 border-sky-500/40 bg-sky-950/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-sky-400">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              <span>Hồ sơ đã gửi tới Ban tổ chức — đang chờ thẩm định</span>
            </div>
            <p className="text-sm leading-relaxed text-sky-200/90">
              Hệ thống đã gửi email xác nhận ghi danh. Ban tổ chức sẽ kiểm tra tính hợp lệ của đội và gửi kết quả duyệt qua thông báo và email.
            </p>
          </Card>
        )}

        {(team.lastRejectReason || team.status === "Rejected") && (
          <Card className="space-y-3 border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-danger)]">
              <AlertTriangle className="h-4 w-4" />
              <span>Lý do Ban tổ chức từ chối / trả hồ sơ</span>
            </div>
            <div className="rounded-lg border border-red-500/30 bg-black/50 p-3.5 text-sm leading-relaxed text-red-200">
              {team.lastRejectReason || "Hồ sơ đội chưa đáp ứng đầy đủ thể lệ của giải đấu. Vui lòng kiểm tra lại thông tin các thành viên."}
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Hoàn thiện lại đội hình hoặc cập nhật hồ sơ thành viên, sau đó nhấn <strong>Ghi danh với BTC</strong> để gửi lại hồ sơ.
            </p>
          </Card>
        )}

        {showRequirementBanner && (
          <Card className="border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5">
            <h2 className="mb-3 text-sm font-semibold text-[var(--color-warning)]">
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
            <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
              Sửa thông tin đội
            </h3>
            <div className="space-y-3 text-sm">
              <div className="space-y-1">
                <label className="text-[var(--text-muted)]">Tên đội</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[var(--text-muted)]">Mô tả</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              {dialogError && <p className="text-[var(--color-danger)]">{dialogError}</p>}
            </div>
            <div className="flex justify-end gap-2 border-t border-[var(--border-muted)] pt-3">
              <Button variant="ghost" onClick={closeDialogs}>
                Hủy
              </Button>
              <Button
                accent="team"
                onClick={() =>
                  runAction(
                    () => updateTeam({ id: team.id, payload: { name: editName.trim(), description: editDescription.trim() } }),
                    "Không cập nhật được thông tin đội.",
                  )
                }
                disabled={isUpdatingTeam || !editName.trim()}
              >
                {isUpdatingTeam ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
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
    </PageShell>
  );
}
