import { useQuery } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import { EventRole, EventRoleInvitationEntity } from "@/models/entities";
import { BaseResponse } from "@/models/types";

export interface InviteStaffPayload {
  eventId: string;
  /** Bắt buộc — InviteJudgeToTrackCommandValidator/InviteMentorToTrackCommandValidator đều NotEmpty. */
  trackId: string;
  email: string;
  /** Bắt buộc — JudgeFullName/MentorFullName đều NotEmpty bên BE. */
  fullName: string;
}

export interface AssignRolePayload {
  userId: string;
  eventId: string;
  trackId?: string;
  teamId?: string;
  roleName: "Judge" | "Mentor" | "EventCoordinator" | "TeamLeader" | "TeamMember";
}

function unwrapEventRolesList(resData: any): EventRole[] {
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData?.data?.data)) return resData.data.data;
  if (Array.isArray(resData?.data?.items)) return resData.data.items;
  if (Array.isArray(resData?.data)) return resData.data;
  if (Array.isArray(resData?.items)) return resData.items;
  return [];
}

export function useGetEventRoles(eventId?: string) {
  return useQuery({
    queryKey: ["event-roles", eventId],
    queryFn: async (): Promise<EventRole[]> => {
      if (!eventId) return [];
      try {
        const res = await apiClient.get<any>("/EventRoles/event", {
          params: { EventId: eventId, PageSize: 200 },
        });
        return unwrapEventRolesList(res.data);
      } catch (err: any) {
        console.warn("[SEAL BE-DATA MISSING] GET /api/EventRoles/event error:", err?.message);
        return [];
      }
    },
    enabled: !!eventId,
  });
}

export interface InviteCoordinatorPayload {
  eventId: string;
  email: string;
  fullName?: string;
  notes?: string;
}

export const staffRepository = {
  /**
   * Mời Điều phối viên (Event Coordinator) qua Email (POST /api/EventCoordinators/invite)
   */
  async inviteCoordinator(payload: InviteCoordinatorPayload): Promise<any> {
    const res = await apiClient.post<any>("/EventCoordinators/invite", {
      eventId: payload.eventId,
      coordinatorEmail: payload.email,
      coordinatorFullName: payload.fullName || payload.email.split("@")[0],
      notes: payload.notes,
      EventId: payload.eventId,
      CoordinatorEmail: payload.email,
      CoordinatorFullName: payload.fullName || payload.email.split("@")[0],
      Notes: payload.notes,
    });
    return res.data;
  },

  /**
   * Mời Giám khảo (Judge) tham gia 1 Track qua Email (POST /api/Judges/invite).
   * Tự động tạo tài khoản tạm nếu chưa có + gửi email xác thực kèm token 24h.
   */
  async inviteJudge(payload: InviteStaffPayload): Promise<any> {
    const res = await apiClient.post<any>("/Judges/invite", {
      eventId: payload.eventId,
      trackId: payload.trackId,
      judgeEmail: payload.email,
      judgeFullName: payload.fullName,
      EventId: payload.eventId,
      TrackId: payload.trackId,
      JudgeEmail: payload.email,
      JudgeFullName: payload.fullName,
    });
    return res.data;
  },

  /**
   * Mời Cố vấn (Mentor) tham gia 1 Track qua Email (POST /api/Mentors/invite).
   */
  async inviteMentor(payload: InviteStaffPayload): Promise<any> {
    const res = await apiClient.post<any>("/Mentors/invite", {
      eventId: payload.eventId,
      trackId: payload.trackId,
      mentorEmail: payload.email,
      mentorFullName: payload.fullName,
      EventId: payload.eventId,
      TrackId: payload.trackId,
      MentorEmail: payload.email,
      MentorFullName: payload.fullName,
    });
    return res.data;
  },

  /**
   * Gán vai trò trực tiếp không qua email mời (POST /api/EventRoles/assign).
   * BE nhận roleName dạng SỐ (enum EventRoleType), gửi chuỗi sẽ luôn 400 —
   * đã verify trực tiếp: {"$.roleName":["The JSON value could not be converted..."]}.
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
