import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { PagedResult } from "@/models/types";
import type { User } from "@/models/entities";

// Field/route đối chiếu trực tiếp EventRolesController.cs + Features/EventRoles/**/Models.

/** Khớp enum EventRoleType bên BE — serialize dạng SỐ, không phải chuỗi. */
export const EventRoleType = {
  EventCoordinator: 0,
  Judge: 1,
  Mentor: 2,
  TeamLeader: 3,
  TeamMember: 4,
} as const;
export type EventRoleTypeValue = (typeof EventRoleType)[keyof typeof EventRoleType];

export interface EventRole {
  id: string;
  userId: string;
  eventId: string;
  trackId?: string | null;
  teamId?: string | null;
  roleName: string;
  eventName?: string | null;
  trackName?: string | null;
  teamName?: string | null;
  user?: User | null;
  assignedAt?: string | null;
  expiredAt?: string | null;
  notes?: string | null;
  createdTime: string;
  lastUpdatedTime: string;
}

export interface AssignEventRolePayload {
  userId: string;
  eventId: string;
  trackId?: string;
  teamId?: string;
  roleName: EventRoleTypeValue;
  expiredAt?: string;
  notes?: string;
}

export interface EventRoleAssigned {
  id: string;
  userId: string;
  eventId: string;
  trackId?: string | null;
  roleName: string;
  assignedAt?: string | null;
}

/** POST /EventRoles/assign — gán trực tiếp, KHÔNG qua lời mời (khác luồng Invite/Respond bên dưới). */
export function useAssignEventRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AssignEventRolePayload) => {
      const { data } = await apiClient.post<EventRoleAssigned>("/EventRoles/assign", payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["eventRolesByEvent", data.eventId] });
    },
  });
}

export interface UpdateEventRolePayload {
  trackId?: string;
  teamId?: string;
  roleName: EventRoleTypeValue;
  expiredAt?: string;
  notes?: string;
}

export interface EventRoleUpdated {
  id: string;
  userId: string;
  eventId: string;
  trackId?: string | null;
  roleName: string;
  expiredAt?: string | null;
}

export function useUpdateEventRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateEventRolePayload }) => {
      const { data } = await apiClient.put<EventRoleUpdated>(`/EventRoles/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["eventRolesByEvent", data.eventId] });
    },
  });
}

/** DELETE /EventRoles/{id} — thu hồi vai trò. */
export function useRemoveEventRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<boolean>(`/EventRoles/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventRolesByEvent"] });
    },
  });
}

export interface InviteEventRolePayload {
  eventId: string;
  invitedUserId: string;
  roleName: EventRoleTypeValue;
  trackId?: string;
  notes?: string;
}

export interface EventRoleInvited {
  invitationId: string;
  eventId: string;
  invitedUserId: string;
  roleName: string;
  status: string;
  expiresAt: string;
}

/**
 * POST /EventRoles/invitations — mời qua email, mặc định hết hạn sau 7 ngày. Chỉ tạo
 * `EventRole` chính thức SAU KHI người được mời chấp nhận qua `useRespondEventRoleInvitation`.
 */
export function useInviteEventRole() {
  return useMutation({
    mutationFn: async (payload: InviteEventRolePayload) => {
      const { data } = await apiClient.post<EventRoleInvited>("/EventRoles/invitations", payload);
      return data;
    },
  });
}

export interface EventRoleInvitationResponded {
  invitationId: string;
  eventId: string;
  status: string;
  /** ID của EventRole vừa tạo — chỉ có khi accept. */
  eventRoleId?: string | null;
}

/** POST /EventRoles/invitations/{id}/respond — [Authorize], người được mời tự phản hồi (accept/reject). */
export function useRespondEventRoleInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invitationId, isAccepted }: { invitationId: string; isAccepted: boolean }) => {
      const { data } = await apiClient.post<EventRoleInvitationResponded>(
        `/EventRoles/invitations/${invitationId}/respond`,
        { isAccepted },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventRolesByUser"] });
    },
  });
}

/**
 * POST /EventRoles/invitations/{id}/decline — [AllowAnonymous], dành cho link "Từ chối"
 * trong EMAIL, không cần đăng nhập. Chỉ đánh dấu Rejected, không tạo vai trò — KHÁC hẳn
 * useRespondEventRoleInvitation (accept vẫn phải qua đường có đăng nhập).
 */
export function useDeclineEventRoleInvitationPublic() {
  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { data } = await apiClient.post<EventRoleInvitationResponded>(
        `/EventRoles/invitations/${invitationId}/decline`,
      );
      return data;
    },
  });
}

export interface GetEventRolesByEventParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isAscending?: boolean;
  roleName?: EventRoleTypeValue;
  trackId?: string;
  activeOnly?: boolean;
}

export function useGetEventRolesByEvent(eventId: string | undefined, params: GetEventRolesByEventParams = {}) {
  return useQuery({
    queryKey: ["eventRolesByEvent", eventId, params],
    queryFn: async () => {
      const { data } = await apiClient.get<PagedResult<EventRole>>("/EventRoles/event", {
        params: { eventId, ...params },
      });
      return data;
    },
    enabled: !!eventId,
  });
}

export interface GetEventRolesByUserParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isAscending?: boolean;
}

export function useGetEventRolesByUser(userId: string | undefined, params: GetEventRolesByUserParams = {}) {
  return useQuery({
    queryKey: ["eventRolesByUser", userId, params],
    queryFn: async () => {
      const { data } = await apiClient.get<PagedResult<EventRole>>("/EventRoles/user", {
        params: { userId, ...params },
      });
      return data;
    },
    enabled: !!userId,
  });
}

export interface GetUsersByRoleParams {
  trackId?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isAscending?: boolean;
}

export function useGetUsersByRoleInEvent(
  eventId: string | undefined,
  roleName: EventRoleTypeValue | undefined,
  params: GetUsersByRoleParams = {},
) {
  return useQuery({
    queryKey: ["usersByRoleInEvent", eventId, roleName, params],
    queryFn: async () => {
      const { data } = await apiClient.get<PagedResult<User>>("/EventRoles/event/role", {
        params: { eventId, roleName, ...params },
      });
      return data;
    },
    enabled: !!eventId && roleName !== undefined,
  });
}

export function useCheckUserHasRoleInEvent(
  userId: string | undefined,
  eventId: string | undefined,
  roleName: EventRoleTypeValue | undefined,
) {
  return useQuery({
    queryKey: ["checkUserHasRole", userId, eventId, roleName],
    queryFn: async () => {
      const { data } = await apiClient.get<boolean>("/EventRoles/check", {
        params: { userId, eventId, roleName },
      });
      return data;
    },
    enabled: !!userId && !!eventId && roleName !== undefined,
  });
}

export function useGetUserRoleInEvent(userId: string | undefined, eventId: string | undefined) {
  return useQuery({
    queryKey: ["userRoleInEvent", userId, eventId],
    queryFn: async () => {
      const { data } = await apiClient.get<EventRole | null>("/EventRoles/user-role", {
        params: { userId, eventId },
      });
      return data;
    },
    enabled: !!userId && !!eventId,
  });
}

/** GET /EventRoles/types — {key: number, value: string}[], không bọc PagedResult. */
export function useGetEventRoleTypes() {
  return useQuery({
    queryKey: ["eventRoleTypes"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ key: number; value: string }[]>("/EventRoles/types");
      return data;
    },
    staleTime: Infinity,
  });
}

export function useGetMyEventRoles(userId?: string) {
  return useQuery({
    queryKey: ["my-event-roles", userId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<PagedResult<EventRole>>("/EventRoles/user", {
          params: { UserId: userId, PageSize: 100 },
        });
        return res.data?.data ?? [];
      } catch (err: any) {
        console.warn("[SEAL BE-DATA MISSING] GET /api/EventRoles error:", err?.message);
        return [];
      }
    },
    enabled: !!userId,
  });
}


