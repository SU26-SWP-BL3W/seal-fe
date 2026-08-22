/**
 * Team & Membership Domain Service
 * Pure business logic for team normalization, leadership verification, and registration eligibility rules.
 */

import type { TeamStatus, TeamView, InvitationView } from "@/components/domain/team";
import type { MemberItem } from "@/viewModels/team/teamTypes";

function pick(obj: unknown, ...keys: string[]): string {
  const record = obj as Record<string, unknown> | null | undefined;
  for (const key of keys) {
    const value = record?.[key];
    if (value != null && value !== "") return String(value);
  }
  return "";
}

export const teamService = {
  /**
   * Normalizes raw backend team response into frontend TeamView.
   */
  normalizeTeamView(rawTeam: unknown, defaultEventId = ""): TeamView | null {
    if (!rawTeam) return null;
    return {
      id: pick(rawTeam, "id", "Id", "TeamId"),
      teamName: pick(rawTeam, "name", "Name", "TeamName") || "Đội chưa đặt tên",
      description: pick(rawTeam, "description", "Description"),
      eventId: pick(rawTeam, "eventId", "EventId") || defaultEventId,
      eventName: pick(rawTeam, "eventName", "EventName") || "Sự kiện",
      status: (pick(rawTeam, "status", "Status") || "Forming") as TeamStatus,
      createdTime: pick(rawTeam, "createdTime", "CreatedTime"),
      lastRejectReason: pick(rawTeam, "lastRejectReason", "LastRejectReason"),
    };
  },

  /**
   * Normalizes raw team members into MemberItem list.
   */
  normalizeTeamMembers(rawTeam: any): MemberItem[] {
    if (!rawTeam) return [];
    const membersRaw = (rawTeam.members ?? rawTeam.Members ?? []) as unknown[];
    return membersRaw.map((m) => ({
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
  },

  /**
   * Normalizes team invitations.
   */
  normalizeTeamInvitations(rawInvitations: unknown[] = []): InvitationView[] {
    return rawInvitations.map((inv) => ({
      id: pick(inv, "invitationId", "InvitationId", "id", "Id"),
      email: pick(inv, "invitedUserEmail", "InvitedUserEmail", "email", "Email"),
      fullName: pick(inv, "invitedUserFullName", "InvitedUserFullName"),
      status: pick(inv, "status", "Status") || "PendingAccept",
      statusLabel: pick(inv, "statusLabel", "StatusLabel") || "Đang chờ",
      sentAt: pick(inv, "createdTime", "CreatedTime", "sentAt"),
      respondedAt: pick(inv, "respondedAt", "RespondedAt"),
    }));
  },

  /**
   * Determines if the current user has Team Leader authority.
   */
  checkIsTeamLeader(rawTeam: any, members: MemberItem[], currentUserId: string, roleName?: string): boolean {
    if (!currentUserId) return false;
    const currentMember = members.find((m) => m.userId === currentUserId);
    return (
      roleName === "TeamLeader" ||
      currentMember?.roleName === "TeamLeader" ||
      Boolean(rawTeam?.leaderUserId && rawTeam.leaderUserId === currentUserId) ||
      Boolean(rawTeam?.LeaderUserId && rawTeam.LeaderUserId === currentUserId) ||
      Boolean(rawTeam?.leaderId && rawTeam.leaderId === currentUserId) ||
      Boolean(rawTeam?.LeaderId && rawTeam.LeaderId === currentUserId) ||
      Boolean(rawTeam?.isLeader && rawTeam.isLeader === true)
    );
  },
};
