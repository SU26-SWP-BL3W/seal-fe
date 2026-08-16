export interface RoundItem {
  id: string;
  roundName: string;
  roundNumber: number;
  startDate: string;
  endDate: string;
  eventId: string;
}

export interface TrackItem {
  id: string;
  trackName: string;
  description: string;
  roundId: string;
  templateId: string | null;
}

export type DeliverableType =
  | "github"
  | "slides"
  | "demo_video"
  | "deployed_url"
  | "report"
  | "figma"
  | "other";

export interface DeliverableItem {
  id: string;
  type: DeliverableType;
  label: string;
  placeholder: string;
  required: boolean;
  trackId: string;
}

export interface SubmissionItem {
  id: string;
  teamId: string;
  teamName: string;
  trackId: string;
  trackName: string;
  roundId: string;
  roundName: string;
  submissionUrl: string;
  description: string;
  isActive: boolean;
  isEliminated: boolean;
  eliminatedReason?: string;
  createdTime: string;
}

export type TeamStatus = "Forming" | "PendingApproval" | "Registered" | "Disqualified";

export interface MemberItem {
  userId: string;
  fullName: string;
  email: string;
  roleName: "TeamLeader" | "TeamMember";
  /** Tài khoản đã được điều phối viên duyệt thẻ sinh viên. */
  isApproved: boolean;
  /** Đã nộp hồ sơ thí sinh — đây mới là điều kiện BE dùng để cho chốt đăng ký đội. */
  hasStudentProfile: boolean;
  school: string;
}

export interface TeamItem {
  id: string;
  name: string;
  description: string;
  eventId: string;
  eventName: string;
  status: TeamStatus;
  isActive: boolean;
  createdTime: string;
}

export interface TeamInvitationItem {
  id: string;
  email: string;
  status: "Pending" | "Accepted" | "Declined" | "Expired";
  sentAt: string;
  expiresAt: string;
}
