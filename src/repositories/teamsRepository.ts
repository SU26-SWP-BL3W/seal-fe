import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { PagedResult } from "@/models/types";

export interface TeamListItem {
  id?: string;
  Id?: string;
  name?: string;
  Name?: string;
  eventId?: string;
  EventId?: string;
  trackId?: string;
  TrackId?: string;
  status?: string | number;
  Status?: string | number;
}

/** Danh sách đội thi theo sự kiện (GET /api/Teams?EventId=...) — dùng để tra tên đội theo TeamId. */
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

export function useGetTeamById(id?: string) {
  return useQuery({
    queryKey: ["team-by-id", id],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/Teams/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export interface Team {
  TeamId: string;
  EventId: string;
  TeamName: string;
  Description?: string;
  Status: "Forming" | "PendingApproval" | "Registered" | "Disqualified";
}

export interface TeamMember {
  EventRoleId: string;
  UserId: string;
  FullName: string;
  Email: string;
  RoleName: "TeamLeader" | "TeamMember";
  IsApproved: boolean;
  School?: string;
}

export interface TeamInvitation {
  InvitationId: string;
  TeamId: string;
  Email: string;
  Status: "Pending" | "Accepted" | "Declined" | "Expired";
  SentAt: string;
  ExpiresAt: string;
}

export interface MyTeamApiModel {
  id?: string;
  Id?: string;
  name?: string;
  Name?: string;
  description?: string | null;
  Description?: string | null;
  status?: string;
  Status?: string;
  eventId?: string;
  EventId?: string;
  eventName?: string;
  EventName?: string;
  trackId?: string | null;
  TrackId?: string | null;
  createdTime?: string;
  CreatedTime?: string;
  lastRejectReason?: string | null;
  LastRejectReason?: string | null;
  members?: Array<{
    userId?: string;
    UserId?: string;
    fullName?: string;
    FullName?: string;
    email?: string;
    Email?: string;
    roleName?: string;
    RoleName?: string;
    isApproved?: boolean;
    IsApproved?: boolean;
    studentCode?: string;
    StudentCode?: string;
  }>;
  Members?: MyTeamApiModel["members"];
}

export function useMyTeam(eventId?: string) {
  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("accessToken");
  return useQuery({
    queryKey: ["my-team", eventId || "any"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<MyTeamApiModel>("/Teams/my-team", {
          params: eventId ? { EventId: eventId } : undefined,
        });
        return res.data ?? null;
      } catch {
        return null;
      }
    },
    enabled: hasToken,
  });
}

export function useTeamInvitations(teamId?: string) {
  return useQuery({
    queryKey: ["team-invitations", teamId],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/Teams/${teamId}/invitations`);
      const raw = res.data;
      return Array.isArray(raw) ? raw : raw?.data ?? [];
    },
    enabled: !!teamId,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; eventId: string; trackId: string }) => {
      const res = await apiClient.post("/Teams", {
        name: data.name,
        description: data.description,
        eventId: data.eventId,
        trackId: data.trackId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-team"] });
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, email }: { teamId: string; email: string }) => {
      const res = await apiClient.post(`/Teams/${teamId}/invitations`, { email });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-team"] });
      queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
    },
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, invitationId }: { teamId: string; invitationId: string }) => {
      await apiClient.delete(`/Teams/${teamId}/invitations/${invitationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-team"] });
      queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
    },
  });
}

export const useRespondInvitation = useCancelInvitation;

export function useAcceptOrDeclineInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invitationId, isAccepted }: { invitationId: string; isAccepted: boolean }) => {
      // BE nhan isAccepted qua query string; gui trong body thi luon doc ra false
      // -> moi lan bam "Chap nhan" deu thanh tu choi.
      const res = await apiClient.post(`/Teams/invitations/${invitationId}/respond`, null, {
        params: { isAccepted },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["my-team"] });
    },
  });
}

export function useConfirmRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (teamId: string) => {
      const res = await apiClient.post(`/Teams/${teamId}/confirm-registration`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-team"] });
    },
  });
}

export function useGetPendingTeams() {
  return useQuery({
    queryKey: ["pending-teams"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<PagedResult<Team>>("/Teams", {
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

export function useApproveTeamRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (teamId: string) => {
      const res = await apiClient.post(`/Teams/${teamId}/approve-registration`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-teams"] });
    },
  });
}

export function useRejectTeamRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, reason }: { teamId: string; reason?: string }) => {
      const res = await apiClient.post(`/Teams/${teamId}/reject-registration`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-teams"] });
    },
  });
}

export function useDisqualifyTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, reason }: { teamId: string; reason: string }) => {
      const res = await apiClient.post(`/Teams/${teamId}/disqualify`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-teams"] });
      queryClient.invalidateQueries({ queryKey: ["teams-by-event"] });
    },
  });
}

export function useTransferLeadership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ teamId, targetUserId }: { teamId: string; targetUserId: string }) => {
      const res = await apiClient.post(`/Teams/${teamId}/transfer-leader`, { newLeaderUserId: targetUserId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-team"] });
    },
  });
}

export function useLeaveTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (teamId: string) => {
      const res = await apiClient.post(`/Teams/${teamId}/leave`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-team"] });
    },
  });
}
