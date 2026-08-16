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

export function useGetEventRoles(eventId?: string) {
  return useQuery({
    queryKey: ["event-roles", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      try {
        const res = await apiClient.get<BaseResponse<EventRole[]>>("/EventRoles/event", {
          params: { EventId: eventId },
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
  async inviteCoordinator(payload: InviteCoordinatorPayload): Promise<BaseResponse<EventRoleInvitationEntity>> {
    const res = await apiClient.post<BaseResponse<EventRoleInvitationEntity>>("/EventCoordinators/invite", {
      eventId: payload.eventId,
      coordinatorEmail: payload.email,
      coordinatorFullName: payload.fullName || payload.email.split("@")[0],
      notes: payload.notes,
    });
    return res.data;
  },

  /**
   * Mời Giám khảo (Judge) tham gia 1 Track qua Email (POST /api/Judges/invite).
   * Tự động tạo tài khoản tạm nếu chưa có + gửi email xác thực kèm token 24h.
   * InviteJudgeToTrackRequestModel yêu cầu JudgeEmail/JudgeFullName (không phải email/fullName trần) —
   * gửi sai tên field khiến validator luôn báo "không được để trống" dù người dùng đã điền.
   */
  async inviteJudge(payload: InviteStaffPayload): Promise<BaseResponse<EventRoleInvitationEntity>> {
    const res = await apiClient.post<BaseResponse<EventRoleInvitationEntity>>("/Judges/invite", {
      EventId: payload.eventId,
      TrackId: payload.trackId,
      JudgeEmail: payload.email,
      JudgeFullName: payload.fullName,
    });
    return res.data;
  },

  /**
   * Mời Cố vấn (Mentor) tham gia 1 Track qua Email (POST /api/Mentors/invite).
   * InviteMentorToTrackRequestModel yêu cầu MentorEmail/MentorFullName — xem ghi chú ở inviteJudge.
   */
  async inviteMentor(payload: InviteStaffPayload): Promise<BaseResponse<EventRoleInvitationEntity>> {
    const res = await apiClient.post<BaseResponse<EventRoleInvitationEntity>>("/Mentors/invite", {
      EventId: payload.eventId,
      TrackId: payload.trackId,
      MentorEmail: payload.email,
      MentorFullName: payload.fullName,
    });
    return res.data;
  },

  /**
   * Gán vai trò trực tiếp không qua email mời (POST /api/EventRoles/assign)
   */
  async assignRoleDirectly(payload: AssignRolePayload): Promise<BaseResponse<EventRole>> {
    const res = await apiClient.post<BaseResponse<EventRole>>("/EventRoles/assign", payload);
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
