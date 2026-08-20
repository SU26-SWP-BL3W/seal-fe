import { useQuery } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import { EventRole, EventRoleInvitationEntity } from "@/models/entities";
import { BaseResponse } from "@/models/types";

export interface InviteStaffPayload {
  eventId: string;
  trackId?: string;
  email: string;
  fullName?: string;
  notes?: string;
}

export interface AssignRolePayload {
  userId: string;
  eventId: string;
  trackId?: string;
  teamId?: string;
  roleName: "Judge" | "Mentor" | "EventCoordinator" | "TeamLeader" | "TeamMember";
}

export function useGetEventRoles(eventId?: string) {
  return useQuery({
    queryKey: ["event-roles", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      try {
        const res = await apiClient.get<BaseResponse<EventRole[]>>("/EventRoles/event", {
          params: { EventId: eventId, PageSize: 500 },
        });
        return res.data?.data ?? [];
      } catch (err: any) {
        console.warn("[SEAL BE-DATA MISSING] GET /api/EventRoles/event error:", err?.message);
        return [];
      }
    },
    enabled: !!eventId,
  });
}

export function useGetAllEventsCoordinators(events: any[]) {
  const eventIds = events.map((e: any) => e.id || e.Id || e.eventId || e.EventId).filter(Boolean);
  const cacheKey = eventIds.join(",");

  return useQuery({
    queryKey: ["all-events-coordinators", cacheKey],
    queryFn: async () => {
      if (eventIds.length === 0) return {};

      const map: Record<string, { email: string; name: string }[]> = {};

      await Promise.allSettled(
        eventIds.map(async (evId) => {
          try {
            const res = await apiClient.get<BaseResponse<EventRole[]>>("/EventRoles/event", {
              params: { EventId: evId, PageSize: 500 },
            });
            const roles = res.data?.data ?? [];
            const ecs = roles
              .filter((r: any) => {
                const roleName = r.roleName || r.RoleName;
                return (
                  roleName === "EventCoordinator" ||
                  roleName === 0 ||
                  (typeof roleName === "string" && roleName.toLowerCase().includes("coordinator"))
                );
              })
              .map((r: any) => ({
                email: r.user?.email || r.User?.Email || r.email || r.Email || "",
                name: r.user?.fullName || r.User?.FullName || r.fullName || "",
              }))
              .filter((x: any) => Boolean(x.email || x.name));

            map[evId] = ecs;
          } catch {
            map[evId] = [];
          }
        })
      );

      return map;
    },
    enabled: eventIds.length > 0,
    staleTime: 15000,
  });
}

export interface InviteCoordinatorDirectPayload {
  eventId: string;
  email: string;
  fullName?: string;
  notes?: string;
}

export const staffRepository = {
  /**
   * Mời Điều phối viên (Event Coordinator) qua Email (POST /api/EventCoordinators/invite)
   */
  async inviteCoordinator(payload: InviteCoordinatorDirectPayload): Promise<BaseResponse<EventRoleInvitationEntity>> {
    // 3 endpoint mời (EC/Judge/Mentor) gửi email SMTP đồng bộ trong request ở BE —
    // timeout mặc định 6s (thiết kế fail-fast chung cho app) là quá ngắn cho thao tác
    // này, gây báo lỗi "timeout" giả dù lời mời đã tạo thành công ở BE.
    const res = await apiClient.post<BaseResponse<EventRoleInvitationEntity>>("/EventCoordinators/invite", {
      eventId: payload.eventId,
      coordinatorEmail: payload.email,
      coordinatorFullName: payload.fullName || payload.email.split("@")[0],
      notes: payload.notes,
    }, { timeout: 30_000 });
    return res.data;
  },

  /**
   * Mời Giám khảo (Judge) tham gia Track/Event qua Email (POST /api/Judges/invite)
   */
  async inviteJudge(payload: InviteStaffPayload): Promise<any> {
    const emailStr = payload.email.trim();
    const res = await apiClient.post("/Judges/invite", {
      eventId: payload.eventId,
      trackId: payload.trackId || undefined,
      judgeEmail: emailStr,
      judgeFullName: payload.fullName || emailStr.split("@")[0],
      notes: payload.notes,
    }, { timeout: 30_000 });
    return res.data;
  },

  /**
   * Mời Cố vấn (Mentor) tham gia Track/Event qua Email (POST /api/Mentors/invite)
   */
  async inviteMentor(payload: InviteStaffPayload): Promise<any> {
    const emailStr = payload.email.trim();
    const res = await apiClient.post("/Mentors/invite", {
      eventId: payload.eventId,
      trackId: payload.trackId || undefined,
      mentorEmail: emailStr,
      mentorFullName: payload.fullName || emailStr.split("@")[0],
      notes: payload.notes,
    }, { timeout: 30_000 });
    return res.data;
  },

  /**
   * Gán vai trò trực tiếp không qua email mời (POST /api/EventRoles/assign).
   */
  async assignRoleDirectly(payload: AssignRolePayload): Promise<BaseResponse<EventRole>> {
    const ROLE_NAME_TO_ENUM: Record<AssignRolePayload["roleName"], number> = {
      EventCoordinator: 0,
      Judge: 1,
      Mentor: 2,
      TeamLeader: 3,
      TeamMember: 4,
    };
    const res = await apiClient.post<BaseResponse<EventRole>>("/EventRoles/assign", {
      ...payload,
      roleName: ROLE_NAME_TO_ENUM[payload.roleName],
    });
    return res.data;
  },

  /**
   * Gỡ vai trò nhân sự khỏi sự kiện (DELETE /api/EventRoles/{id})
   */
  async removeEventRole(roleId: string): Promise<boolean> {
    const res = await apiClient.delete(`/EventRoles/${roleId}`);
    return res.status === 200 || res.status === 204;
  },
};
