import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { PagedResult } from "@/models/types";
import type { SubmitResultListItem } from "@/repositories/scoring/submitResultsRepository";

// Field/route đối chiếu trực tiếp TeamsController.cs + Features/Teams/**/Models.
// 19 endpoint — controller lớn nhất trong dự án.

/** Khớp enum TeamStatus bên BE — số CỐ ĐỊNH, không đổi thứ tự (xem comment gốc trong TeamStatus.cs). */
export const TeamStatus = {
  Forming: 0,
  Registered: 1,
  Disqualified: 2,
  PendingApproval: 3,
  Rejected: 4,
} as const;
export type TeamStatusValue = (typeof TeamStatus)[keyof typeof TeamStatus];

// ─── CRUD ───────────────────────────────────────────────────────────────────

export interface CreateTeamPayload {
  name: string;
  description: string;
  eventId: string;
  trackId: string;
  leaderId?: string;
}

export interface TeamCreated {
  id: string;
  name: string;
  description: string;
  trackId?: string | null;
  isActive: boolean;
  createdTime: string;
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTeamPayload) => {
      const { data } = await apiClient.post<TeamCreated>("/Teams", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["myTeam"] });
    },
  });
}

export interface UpdateTeamPayload {
  name: string;
  description: string;
  /** null = giữ nguyên. Chỉ đổi được khi đội còn Forming và chưa có bài nộp. */
  trackId?: string;
  /** null = giữ nguyên trạng thái Active. Chỉ EC/Admin được đổi. */
  isActive?: boolean;
}

export interface TeamUpdated {
  id: string;
  name: string;
  description: string;
  trackId?: string | null;
  isActive: boolean;
  lastUpdatedTime: string;
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateTeamPayload }) => {
      const { data } = await apiClient.put<TeamUpdated>(`/Teams/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["team", data.id] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<boolean>(`/Teams/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export interface TeamMemberDetail {
  userId: string;
  fullName: string;
  email: string;
  studentCode?: string | null;
  roleName: string;
  isApproved: boolean;
}

export interface TeamDetail {
  id: string;
  name: string;
  description: string;
  status: string;
  isActive: boolean;
  eventId: string;
  trackId?: string | null;
  createdTime: string;
  /** Lý do từ chối ở lần chốt gần nhất. FE: (status === "Forming" && lastRejectReason) → hiện banner nhắc sửa. */
  lastRejectReason?: string | null;
  members: TeamMemberDetail[];
}

export function useGetTeamById(id: string | undefined) {
  return useQuery({
    queryKey: ["team", id],
    queryFn: async () => {
      const { data } = await apiClient.get<TeamDetail>(`/Teams/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export interface TeamListItem {
  id?: string;
  Id?: string;
  eventId?: string;
  EventId?: string;
  trackId?: string | null;
  TrackId?: string | null;
  name?: string;
  Name?: string;
  description?: string;
  Description?: string;
  status?: TeamStatusValue | string | number;
  Status?: TeamStatusValue | string | number;
  isActive?: boolean;
  IsActive?: boolean;
  createdTime?: string;
  CreatedTime?: string;
}

export interface GetTeamsParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isAscending?: boolean;
  searchName?: string;
  myTeamsOnly?: boolean;
  eventId?: string;
  status?: TeamStatusValue;
}

export function useGetTeams(params: GetTeamsParams = {}) {
  return useQuery({
    queryKey: ["teams", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PagedResult<TeamListItem>>("/Teams", { params });
      return data;
    },
  });
}

// ─── Thành viên ─────────────────────────────────────────────────────────────

export interface AddTeamMemberPayload {
  userId: string;
  notes?: string;
}

export interface TeamMemberAdded {
  eventRoleId: string;
  teamId: string;
  userId: string;
  roleName: string;
  assignedAt?: string | null;
}

/** POST /Teams/{teamId}/members — thêm thẳng (không qua lời mời) — chỉ TeamLeader/EC. */
export function useAddTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, payload }: { teamId: string; payload: AddTeamMemberPayload }) => {
      const { data } = await apiClient.post<TeamMemberAdded>(`/Teams/${teamId}/members`, payload);
      return data;
    },
    onSuccess: (_data, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
    },
  });
}

/** DELETE /Teams/{teamId}/members/{userId} — không xoá được TeamLeader (chuyển leader trước, hoặc xoá cả đội). */
export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const { data } = await apiClient.delete<boolean>(`/Teams/${teamId}/members/${userId}`);
      return data;
    },
    onSuccess: (_data, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
    },
  });
}

/** POST /Teams/{teamId}/leave — TeamLeader KHÔNG tự rời được; đội đã Registered cũng không tự rời được. */
export function useLeaveTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (teamId: string) => {
      const { data } = await apiClient.post<boolean>(`/Teams/${teamId}/leave`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTeam"] });
    },
  });
}

// ─── Lời mời vào đội ────────────────────────────────────────────────────────

export interface TeamInvitationListItem {
  invitationId: string;
  teamId: string;
  invitedUserId: string;
  invitedUserFullName: string;
  invitedUserEmail: string;
  invitedUserStudentCode?: string | null;
  invitedByUserId: string;
  /** PendingAccept | Accepted | Declined | Expired. */
  status: string;
  /** Nhãn tiếng Việt BE trả sẵn — bind thẳng, không tự dịch lại status. */
  statusLabel: string;
  expiresAt: string;
  respondedAt?: string | null;
  notes?: string | null;
  createdTime: string;
}

/** GET /Teams/{teamId}/invitations — trả THẲNG mảng, KHÔNG bọc PagedResult (khác đa số list khác trong dự án). */
export function useGetTeamInvitations(teamId: string | undefined) {
  return useQuery({
    queryKey: ["teamInvitations", teamId],
    queryFn: async () => {
      const { data } = await apiClient.get<TeamInvitationListItem[]>(`/Teams/${teamId}/invitations`);
      return data;
    },
    enabled: !!teamId,
  });
}

export interface InviteTeamMemberPayload {
  email: string;
  notes?: string;
}

export interface TeamMemberInvited {
  invitationId: string;
  teamId: string;
  invitedUserId: string;
  status: string;
  expiresAt: string;
  /** true = người được mời CHƯA có tài khoản, BE vừa tạo tài khoản tạm — họ cần kích hoạt trước khi chấp nhận. */
  isNewTemporaryUser: boolean;
}

/** POST /Teams/{teamId}/invitations — hết hạn sau 24h (khác lời mời vai trò sự kiện, 7 ngày). */
export function useInviteTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: any) => {
      const teamId = args.teamId || args.TeamId;
      const payload = args.payload || { email: args.email, notes: args.notes };
      const { data } = await apiClient.post<TeamMemberInvited>(`/Teams/${teamId}/invitations`, payload);
      return data;
    },
    onSuccess: (_data, args: any) => {
      const teamId = args.teamId || args.TeamId;
      queryClient.invalidateQueries({ queryKey: ["teamInvitations", teamId] });
      queryClient.invalidateQueries({ queryKey: ["myTeam"] });
      queryClient.invalidateQueries({ queryKey: ["my-team"] });
    },
  });
}

export function useCancelTeamInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, invitationId }: { teamId: string; invitationId: string }) => {
      const { data } = await apiClient.delete<boolean>(`/Teams/${teamId}/invitations/${invitationId}`);
      return data;
    },
    onSuccess: (_data, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ["teamInvitations", teamId] });
    },
  });
}

export interface TeamInvitationResponded {
  invitationId: string;
  teamId: string;
  status: string;
  /** ID EventRole vừa tạo nếu member chấp nhận. */
  eventRoleId?: string | null;
}

/**
 * POST /Teams/invitations/{id}/respond?isAccepted=... — ⚠️ isAccepted là QUERY PARAM,
 * KHÔNG phải body (dù trông giống body ở các API khác trong dự án). Gửi nhầm vào body
 * sẽ khiến BE luôn nhận `isAccepted=false` mặc định — đã từng là bug thật, giữ đúng ở
 * đây để không lặp lại.
 */
export function useRespondTeamInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invitationId, isAccepted }: { invitationId: string; isAccepted: boolean }) => {
      const { data } = await apiClient.post<TeamInvitationResponded>(
        `/Teams/invitations/${invitationId}/respond`,
        undefined,
        { params: { isAccepted } },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTeamInvitation"] });
      queryClient.invalidateQueries({ queryKey: ["myTeam"] });
    },
  });
}

// ─── Vòng đời đăng ký & xử lý vi phạm ──────────────────────────────────────

export function useTransferTeamLeader() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: any) => {
      const teamId = args.teamId || args.TeamId;
      const newLeaderUserId = args.newLeaderUserId || args.targetUserId;
      const { data } = await apiClient.post<boolean>(`/Teams/${teamId}/transfer-leader`, {
        newLeaderUserId,
      });
      return data;
    },
    onSuccess: (_data, args: any) => {
      const teamId = args.teamId || args.TeamId;
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      queryClient.invalidateQueries({ queryKey: ["myTeam"] });
      queryClient.invalidateQueries({ queryKey: ["my-team"] });
    },
  });
}

export interface TeamRegistrationConfirmed {
  teamId: string;
  status: string;
  memberCount: number;
}

/** POST /Teams/{teamId}/confirm-registration — TeamLeader chốt danh sách: Forming → PendingApproval. Yêu cầu đủ 3-5 thành viên đã HasStudentProfile. */
export function useConfirmTeamRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (teamId: string) => {
      const { data } = await apiClient.post<TeamRegistrationConfirmed>(`/Teams/${teamId}/confirm-registration`);
      return data;
    },
    onSuccess: (_data, teamId) => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      queryClient.invalidateQueries({ queryKey: ["myTeam"] });
    },
  });
}

/** POST /Teams/{teamId}/approve-registration — EC/Admin: PendingApproval → Registered. */
export function useApproveTeamRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (teamId: string) => {
      const { data } = await apiClient.post<boolean>(`/Teams/${teamId}/approve-registration`);
      return data;
    },
    onSuccess: (_data, teamId) => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

/** POST /Teams/{teamId}/reject-registration — EC/Admin: PendingApproval → Forming (mở khoá sửa lại). Reason bắt buộc, gửi mail cho leader. */
export function useRejectTeamRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, reason }: { teamId: string; reason: string }) => {
      const { data } = await apiClient.post<boolean>(`/Teams/${teamId}/reject-registration`, { reason });
      return data;
    },
    onSuccess: (_data, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

/** POST /Teams/{teamId}/disqualify — EC/Admin loại đội đang thi vì vi phạm. Reason bắt buộc; xoá kết quả nháp của đội. */
export function useDisqualifyTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, reason }: { teamId: string; reason: string }) => {
      const { data } = await apiClient.post<boolean>(`/Teams/${teamId}/disqualify`, { reason });
      return data;
    },
    onSuccess: (_data, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

// ─── "Của tôi" ──────────────────────────────────────────────────────────────

export interface MyTeamMember {
  userId: string;
  fullName: string;
  email: string;
  studentCode?: string | null;
  roleName: string;
  isApproved: boolean;
  /** Đã nộp hồ sơ thí sinh chưa — dùng cho checklist chốt đăng ký, KHÁC isApproved (duyệt tài khoản). */
  hasStudentProfile: boolean;
}

export interface MyTeam {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  isActive: boolean;
  eventId: string;
  trackId?: string | null;
  eventName: string;
  createdTime: string;
  lastRejectReason?: string | null;
  members: MyTeamMember[];
}

/** GET /Teams/my-team?eventId=... — trả null (không phải 404 rỗng) nếu chưa có đội trong sự kiện đó. */
export function useGetMyTeam(eventId: string | undefined) {
  return useQuery({
    queryKey: ["myTeam", eventId],
    queryFn: async () => {
      const { data } = await apiClient.get<MyTeam | null>("/Teams/my-team", { params: { eventId } });
      return data;
    },
    enabled: !!eventId,
  });
}

export interface MyTeamInvitation {
  invitationId: string;
  teamId: string;
  teamName: string;
  invitedByUserId: string;
  status: string;
  expiresAt: string;
  notes?: string | null;
}

/** GET /Teams/{teamId}/my-invitation — lời mời CHỜ PHẢN HỒI của chính người gọi cho đội này (404 nếu không có). */
export function useGetMyTeamInvitation(teamId: string | undefined) {
  return useQuery({
    queryKey: ["myTeamInvitation", teamId],
    queryFn: async () => {
      const { data } = await apiClient.get<MyTeamInvitation>(`/Teams/${teamId}/my-invitation`);
      return data;
    },
    enabled: !!teamId,
    retry: false,
  });
}

export interface GetMySubmissionsParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isAscending?: boolean;
}

/** GET /Teams/my-submissions — bài nộp của (các) đội mà người dùng hiện tại đang tham gia. */
export function useGetMySubmissions(params: GetMySubmissionsParams = {}) {
  return useQuery({
    queryKey: ["mySubmissions", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PagedResult<SubmitResultListItem>>("/Teams/my-submissions", {
        params,
      });
      return data;
    },
  });
}

// ─── Legacy / Compatibility Helpers & Aliases ────────────────────────────────

export function useGetTeamsByEvent(eventId?: string, status?: string) {
  return useQuery({
    queryKey: ["teams-by-event", eventId, status],
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<TeamListItem>>("/Teams", {
        params: { EventId: eventId, Status: status, PageSize: 200 },
      });
      return res.data?.data ?? [];
    },
    enabled: !!eventId,
  });
}

export function useGetTeamProgress(teamId?: string) {
  return useQuery({
    queryKey: ["team-progress", teamId],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/Teams/${teamId}/progress`);
      return res.data;
    },
    enabled: !!teamId,
  });
}

export function useGetTeamsByTrack(trackId?: string) {
  return useQuery({
    queryKey: ["teams-by-track", trackId],
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<TeamListItem>>("/Teams", {
        params: { TrackId: trackId, PageSize: 200 },
      });
      return res.data?.data ?? [];
    },
    enabled: !!trackId,
  });
}

export function useGetPendingTeams() {
  return useQuery({
    queryKey: ["pending-teams"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<PagedResult<any>>("/Teams", {
          params: { Status: "PendingApproval", PageSize: 100 },
        });
        return res.data?.data ?? [];
      } catch (err: any) {
        console.warn("[SEAL BE-DATA MISSING] GET /api/Teams (pending) error:", err?.message);
        return [];
      }
    },
  });
}

export function useMyTeam(eventId?: string) {
  return useQuery({
    queryKey: ["my-team", eventId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>("/Teams/my-team", {
          params: eventId ? { eventId } : undefined,
        });
        return res.data;
      } catch (err: any) {
        console.warn("[SEAL BE-DATA MISSING] GET /api/Teams/my-team error:", err?.message);
        return null;
      }
    },
  });
}

export function useTeamInvitations(teamId?: string) {
  return useGetTeamInvitations(teamId);
}

export const useConfirmRegistration = useConfirmTeamRegistration;
export const useTransferLeadership = useTransferTeamLeader;
export const useCancelInvitation = useCancelTeamInvitation;
export const useInviteMember = useInviteTeamMember;
export const useKickMember = useRemoveTeamMember;
export const useAcceptOrDeclineInvitation = useRespondTeamInvitation;
export const useRejectTeam = useRejectTeamRegistration;
export const useApproveTeam = useApproveTeamRegistration;
