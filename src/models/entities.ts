// ============================================================
// SEAL Hackathon — Core Entity Interfaces
// Synced with backend Swagger: https://api.sealswp391.xyz
// NOTE: API returns camelCase — these interfaces match the API response shape.
// Optional PascalCase & helper fields are included for backward-compatibility with legacy components.
// ============================================================

export type { BaseResponse, PagedResult, ApiError } from "./types";

export type UserRole = "Admin" | "Coordinator" | "Judge" | "Mentor" | "TeamLeader" | "TeamMember" | "Guest";

export type TeamStatus = "Forming" | "PendingApproval" | "Registered" | "Disqualified";

export type SubmissionStatus = "Submitted" | "Graded" | "Eliminated";

// ─── DTO Compatibility Types ─────────────────────────────────────
export interface UserDTO {
  userId?: string;
  email?: string;
  fullName?: string;
  school?: string;
  studentId?: string;
  avatarUrl?: string;
  isAdmin?: boolean;
  UserID?: string;
  FullName?: string;
  StudentId?: string;
  IsAdmin?: boolean;
  // Swagger fields
  id?: string;
  isStudent?: boolean;
  isApproved?: boolean;
  isFpt?: boolean;
  isRejected?: boolean;
}

export interface EventRole {
  id?: string;
  eventRoleId?: string;
  userId?: string;
  eventId?: string;
  teamId?: string;
  trackId?: string;
  roleName?: string;
  assignedEventIds?: string[];
  EventRoleId?: string;
  UserId?: string;
  RoleName?: string;
  EventId?: string;
  TeamId?: string;
  TrackId?: string;
  AssignedEventIds?: string[];
}

export type EventEntity = Event;
export type RoundEntity = Round;
export type TrackEntity = Track;
export type TemplateEntity = Template;
export type TemplateCriteriaEntity = Criteria;
export type CriteriaEntity = Criteria;
export type TeamEntity = Team;
export type EventRoleInvitationEntity = any;
export type Prize = any;
export type SaveScoreRequest = any;
export type Score = any;
export type ScoreBreakdownModel = any;
export type CalibrationModel = any;
export type FinalResult = any;
export type AppealStatus = AppealStatusType;

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
}

export interface EventDTO {
  eventId: string;
  eventName: string;
  season?: string;
  year?: number;
  tagline?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  maxTeams?: number;
  teamCount?: number;
  totalPrizeVnd?: number;
}

export interface TeamDTO {
  teamId: string;
  eventId: string;
  eventName: string;
  description?: string;
  status: TeamStatus;
  createdAt: string;
}

export interface SubmitResultDTO {
  submitResultId: string;
  teamId: string;
  trackId: string;
  roundId: string;
  submissionUrl: string;
  description?: string;
  submissionCount: number;
  submittedAt: string;
  isActive: boolean;
  isEliminated: boolean;
}

export interface AppealDTO {
  appealId: string;
  submissionId: string;
  teamId: string;
  teamName: string;
  reason: string;
  status: string;
  responseReason?: string;
  createdAt: string;
  respondedAt?: string;
}

// ─── Auth / User ─────────────────────────────────────────────

/** Matches backend UserModel (GET /api/Users, POST /api/Auth/login response) */
export interface User {
  id?: string;
  userId?: string;
  schoolId?: string | null;
  schoolName?: string | null;
  studentCode?: string | null;
  email?: string;
  fullName?: string;
  isStudent?: boolean;
  isAdmin?: boolean;
  isApproved?: boolean;
  isFpt?: boolean;
  isRejected?: boolean;
  isTemporary?: boolean;
  mustChangePassword?: boolean;
  photoStudentCardUrl?: string | null;
  rejectionReason?: string | null;
  rejectionCount?: number;
  rejectedCount?: number;
  createdTime?: string;
  lastUpdatedTime?: string;
  // Track & Event contextual fields
  eventId?: string;
  trackId?: string;
  trackName?: string;
  trackRole?: "Leader" | "Member" | "Judge" | "Mentor" | string;
  teamId?: string;
  teamName?: string;
  // Aliases for compatibility
  UserID?: string;
  FullName?: string;
  StudentId?: string;
  IsAdmin?: boolean;
  Email?: string;
  IsApproved?: boolean;
  IsFpt?: boolean;
}

export interface LoginRequest {
  email: string;
  passwordHash: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: User;
  roles?: EventRole[];
}

export interface RegisterRequest {
  email: string;
  passwordHash?: string;
  password?: string;
  fullName: string;
}

export interface UpdateStudentProfileRequest {
  schoolId?: string;
  studentCode?: string;
  photoStudentCardUrl?: string;
  isFpt?: boolean;
}

export interface FptStudentResponse {
  isFptStudent?: boolean;
  isValid?: boolean;
  studentCode?: string;
  fullName?: string;
  major?: string;
  enrollYear?: number;
}

export interface UserRejection {
  id?: string;
  userId?: string;
  reason?: string;
  rejectedTime?: string;
  isActive?: boolean;
}

// ─── School ──────────────────────────────────────────────────

export interface School {
  id?: string;
  schoolId?: string;
  code?: string;
  name?: string;
  schoolName?: string;
  address?: string;
  isFpt?: boolean;
}

// ─── Event ───────────────────────────────────────────────────

export interface Event {
  id?: string;
  eventId?: string;
  EventId?: string;
  name?: string;
  eventName?: string;
  EventName?: string;
  season?: string;
  Season?: string;
  year?: number;
  Year?: number;
  tagline?: string;
  Tagline?: string;
  description?: string | null;
  startDate?: string;
  endDate?: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  maxTeams?: number;
  teamCount?: number;
  totalPrizeVnd?: number;
  rounds?: Round[];
  tracks?: Track[];
  status?: boolean;
  Status?: boolean;
  success?: boolean;
  data?: any;
  message?: string | null;
}

// ─── Round ───────────────────────────────────────────────────

export interface Round {
  id?: string;
  roundId?: string;
  RoundId?: string;
  eventId?: string;
  EventId?: string;
  name?: string;
  roundName?: string;
  RoundName?: string;
  roundNumber?: number;
  RoundNumber?: number;
  orderNumber?: number;
  startDate?: string;
  endDate?: string;
  submissionDeadline?: string;
  SubmissionDeadline?: string;
  isFinal?: boolean;
}

// ─── Track ───────────────────────────────────────────────────

export interface Track {
  id?: string;
  trackId?: string;
  TrackId?: string;
  eventId?: string;
  EventId?: string;
  roundId?: string;
  RoundId?: string;
  name?: string;
  trackName?: string;
  TrackName?: string;
  description?: string | null;
  Description?: string | null;
  submissionRuleDescription?: string | null;
  SubmissionRuleDescription?: string | null;
  maxTeams?: number;
  templateId?: string | null;
  TemplateId?: string | null;
}

// ─── Template & Criteria ─────────────────────────────────────

export interface Criteria {
  id?: string;
  criteriaId?: string;
  CriteriaId?: string;
  name?: string;
  criterionName?: string;
  CriterionName?: string;
  criteriaName?: string;
  description?: string | null;
  Description?: string | null;
  weight?: number;
  Weight?: number;
  maxScore?: number;
  MaxScore?: number;
  TemplateId?: string;
  IsActive?: boolean;
}

export interface Template {
  id?: string;
  templateId?: string;
  TemplateId?: string;
  name?: string;
  templateName?: string;
  TemplateName?: string;
  description?: string | null;
  criterias?: Criteria[];
  totalWeight?: number;
}

// ─── Team ────────────────────────────────────────────────────

export interface Team {
  id?: string;
  teamId?: string;
  TeamId?: string;
  eventId?: string;
  EventId?: string;
  name?: string;
  teamName?: string;
  TeamName?: string;
  description?: string | null;
  trackId?: string | null;
  leaderUserId?: string;
  isApproved?: boolean;
  status?: string;
  Status?: string;
  members?: TeamMember[];
  createdTime?: string;
}

export interface TeamMember {
  id?: string;
  teamId?: string;
  userId?: string;
  role?: string;
  roleName?: string;
  fullName?: string;
  email?: string;
  studentCode?: string;
  isApproved?: boolean;
  joinedTime?: string;
  user?: User;
}

export interface TeamInvitation {
  id?: string;
  teamId?: string;
  email?: string;
  status?: string;
  sentAt?: string;
  expiresAt?: string;
}

// ─── SubmitResult ────────────────────────────────────────────

export interface SubmitResult {
  id?: string;
  teamId?: string;
  roundId?: string;
  trackId?: string;
  submissionUrl?: string;
  description?: string | null;
  submittedAt?: string;
  submissionCount?: number;
}

// ─── Appeal ──────────────────────────────────────────────────

export type AppealStatusType = 0 | 1 | 2; // Pending=0, Approved=1, Rejected=2

export interface Appeal {
  id?: string;
  teamId?: string;
  teamName?: string;
  submitResultId?: string;
  reason?: string | null;
  status?: AppealStatusType;
  response?: string | null;
  assignedJudgeId?: string | null;
  createdTime?: string;
}

export interface UserRejection {
  id?: string;
  userId?: string;
  reason?: string;
  isActive?: boolean;
  rejectedByUserId?: string;
  createdTime?: string;
}
