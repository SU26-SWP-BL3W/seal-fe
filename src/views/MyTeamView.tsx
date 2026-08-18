"use client";

import { useState } from "react";
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
} from "@/repositories/teamsRepository";
import { Card, ConfirmDialog, SkeletonRows } from "@/components/ui";
import {
  buildRequirements,
  ConfirmRegistrationDialog,
  CreateTeamForm,
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
  const { user, activeRole } = useAuth();
  const searchParams = useSearchParams();
  const roleName = pick(activeRole, "RoleName", "roleName");
  const isLeader = roleName === "TeamLeader";
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

  const {
    data: rawInvitations = [],
    isLoading: isLoadingInvitations,
    isError: hasInvitationError,
  } = useTeamInvitations(team?.id);

  const invitations: InvitationView[] = (rawInvitations as unknown[])
    .filter((inv) => {
      const status = pick(inv, "status", "Status");
      return status === "PendingAccept" || status === "Pending";
    })
    .map((inv) => ({
      id: pick(inv, "invitationId", "InvitationId", "id", "Id"),
      email: pick(inv, "invitedUserEmail", "InvitedUserEmail", "email", "Email"),
      fullName: pick(inv, "invitedUserFullName", "InvitedUserFullName"),
      statusLabel: pick(inv, "statusLabel", "StatusLabel") || "Đang chờ",
      sentAt: pick(inv, "createdTime", "CreatedTime", "sentAt"),
    }));

  const { mutateAsync: inviteMember, isPending: isInviting } = useInviteMember();
  const { mutateAsync: kickMember, isPending: isKicking } = useRemoveTeamMember();
  const [kickTarget, setKickTarget] = useState<{ id: string; name: string } | null>(null);
  const { mutateAsync: cancelInvitation, isPending: isCancelling } = useCancelInvitation();
  const { mutateAsync: confirmRegistration, isPending: isRegistering } = useConfirmRegistration();
  const { mutateAsync: transferLeadership, isPending: isTransferring } = useTransferLeadership();
  const { mutateAsync: leaveTeam, isPending: isLeaving } = useLeaveTeam();
  const { mutateAsync: updateTeam, isPending: isUpdatingTeam } = useUpdateTeam();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

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
    return (
      <main className="hud-lattice min-h-[calc(100dvh-4rem)] px-[var(--space-lg)]">
        <CreateTeamForm defaultEventId={targetEventId} />
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

        {team.lastRejectReason && isForming && (
          <Card className="border-[var(--color-danger)]/40 bg-[var(--color-danger)]/5">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--color-danger)]">
              Lý do BTC trả hồ sơ
            </h2>
            <p className="mt-[var(--space-xs)] font-mono text-xs text-pretty text-[color:var(--text-primary)]">
              {team.lastRejectReason}
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
                  await inviteMember({ teamId: team.id, email });
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
            () => confirmRegistration(team.id),
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
    </main>
  );
}
