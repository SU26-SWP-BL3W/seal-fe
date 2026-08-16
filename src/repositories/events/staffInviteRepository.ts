import { useMutation } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";

// Field/route đối chiếu trực tiếp EventCoordinatorsController.cs, JudgesController.cs,
// MentorsController.cs. Cả 3 đều CHỈ có 1 endpoint "invite", cùng khuôn: nếu email chưa
// có tài khoản thì BE tự tạo tài khoản TẠM (chỉ dùng trong vòng đời sự kiện) + gửi email
// mời — KHÁC với `eventRolesRepository.useInviteEventRole` (mời người DÙNG ĐÃ CÓ userId).
//
// ⚠️ Lời mời chỉ gửi qua EMAIL — không có thông báo trong app (đã xác nhận qua audit:
// FE không gọi EventRoles/invite nên NotificationBell không nhận được lời mời loại này).

interface InviteResult {
  invitationId: string;
  invitedUserId: string;
  eventId: string;
  status: string;
  expiresAt: string;
  /** true = email mời đã gửi thành công; false = lời mời vẫn được tạo nhưng gửi email lỗi. */
  invitationEmailSent: boolean;
}

export interface InviteCoordinatorPayload {
  eventId: string;
  coordinatorEmail: string;
  coordinatorFullName: string;
  notes?: string;
}

export interface CoordinatorInvited extends InviteResult {
  coordinatorEmail: string;
  coordinatorFullName: string;
}

/** POST /EventCoordinators/invite — chỉ Admin hoặc EC hiện tại của sự kiện. */
export function useInviteEventCoordinator() {
  return useMutation({
    mutationFn: async (payload: InviteCoordinatorPayload) => {
      const { data } = await apiClient.post<CoordinatorInvited>("/EventCoordinators/invite", payload);
      return data;
    },
  });
}

export interface InviteJudgePayload {
  eventId: string;
  trackId: string;
  judgeEmail: string;
  judgeFullName: string;
  notes?: string;
}

export interface JudgeInvited extends InviteResult {
  judgeEmail: string;
  judgeFullName: string;
  trackId: string;
  trackName: string;
}

/** POST /Judges/invite — mời chấm đúng 1 Track cụ thể (không mời "chấm cả sự kiện" ở endpoint này). */
export function useInviteJudge() {
  return useMutation({
    mutationFn: async (payload: InviteJudgePayload) => {
      const { data } = await apiClient.post<JudgeInvited>("/Judges/invite", payload);
      return data;
    },
  });
}

export interface InviteMentorPayload {
  eventId: string;
  trackId: string;
  mentorEmail: string;
  mentorFullName: string;
  notes?: string;
}

export interface MentorInvited extends InviteResult {
  mentorEmail: string;
  mentorFullName: string;
  trackId: string;
  trackName: string;
}

export function useInviteMentor() {
  return useMutation({
    mutationFn: async (payload: InviteMentorPayload) => {
      const { data } = await apiClient.post<MentorInvited>("/Mentors/invite", payload);
      return data;
    },
  });
}
