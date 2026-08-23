/**
 * ==============================================================================
 * SEAL — Unified Core Library
 * ==============================================================================
 * Central export of all:
 * 1. Models & DTOs (@/models)
 * 2. API Repositories & React Query Hooks (@/repositories)
 * 3. Domain Services (@/services)
 * 4. Core Utilities (@/lib)
 * ==============================================================================
 */

// ─── 1. API Client & Base Types ──────────────────────────────────────────────
export { default as apiClient } from "@/models/apiClient";
export type { BaseResponse, PagedResult, ApiError } from "@/models/types";

// ─── 2. Core Entities & DTOs ──────────────────────────────────────────────────
export type {
  UserRole,
  SubmissionStatus,
  UserDTO,
  EventEntity,
  RoundEntity,
  TrackEntity,
  TemplateEntity,
  TemplateCriteriaEntity,
  CriteriaEntity,
  TeamEntity,
  EventRoleInvitationEntity,
  AuthSession,
  EventDTO,
  TeamDTO,
  SubmitResultDTO,
  AppealDTO,
  User,
  School,
  Event,
  Team,
  TeamMember,
  TeamInvitation,
  SubmitResult,
  AppealStatusType,
  UserRejection,
} from "@/models/entities";

// ─── 3. Repositories & React Query Hooks ─────────────────────────────────────
// Auth, Users & Schools
export * from "@/repositories/auth/authRepository";
export * from "@/repositories/auth/usersRepository";
export * from "@/repositories/auth/schoolsRepository";

// Events, Rounds, Tracks, Templates, Criterias, EventRoles & Staff
export * from "@/repositories/events/eventsRepository";
export * from "@/repositories/events/roundsRepository";
export * from "@/repositories/events/tracksRepository";
export * from "@/repositories/events/templatesRepository";
export * from "@/repositories/events/criteriasRepository";
export * from "@/repositories/events/eventRolesRepository";
export * from "@/repositories/events/staffRepository";
export * from "@/repositories/events/staffInviteRepository";

// Teams & Members
export * from "@/repositories/teams/teamsRepository";

// Scoring, Submissions & Storage
export * from "@/repositories/scoring/submitResultsRepository";
export * from "@/repositories/scoring/scoresRepository";
export * from "@/repositories/scoring/scoreDetailsRepository";
export * from "@/repositories/scoring/storageRepository";
export * from "@/repositories/scoring/uploadRepository";

// Results, Appeals, Prizes & Leaderboard
export * from "@/repositories/results/finalResultsRepository";
export * from "@/repositories/results/prizesRepository";
export * from "@/repositories/results/appealsRepository";
export * from "@/repositories/results/leaderboardRepository";

// Shared, Health, AuditLogs & Notifications
export * from "@/repositories/shared/notificationsRepository";
export * from "@/repositories/shared/healthRepository";
export * from "@/repositories/shared/errorHelper";
export * from "@/repositories/shared/auditLogsRepository";
export * from "@/repositories/shared/demoRepository";

// ─── 4. Domain Services ──────────────────────────────────────────────────────
export * from "@/services";

// ─── 5. Core Utilities ───────────────────────────────────────────────────────
export * from "@/lib/eventRoles";
export * from "@/lib/permissions";
export * from "@/lib/formatId";
export * from "@/lib/exportUtils";
export * from "@/lib/useCountdown";
