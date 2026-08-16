import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { PagedResult } from "@/models/types";

export interface MyEventRoleRecord {
  id: string;
  userId: string;
  eventId: string;
  trackId?: string | null;
  teamId?: string | null;
  roleName: string;
}

/**
 * GET /api/EventRoles/user — toàn bộ EventRole thật của 1 user, mỗi track được
 * phân công là 1 record ID riêng (KHÔNG dùng chung 1 eventRoleId cho mọi track —
 * gửi nhầm eventRoleId khi lưu điểm sẽ gắn phiếu chấm vào track/role sai).
 */
export function useGetMyEventRoles(userId?: string) {
  return useQuery({
    queryKey: ["event-roles-by-user", userId],
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<MyEventRoleRecord>>("/EventRoles/user", {
        params: { UserId: userId, PageSize: 200 },
      });
      return res.data?.data ?? [];
    },
    enabled: !!userId,
  });
}

// ─── Event Role Invitations ───────────────────────────────────

/** POST /api/EventRoles/invitations/{invitationId}/respond — Đồng ý/từ chối lời mời vai trò sự kiện (Judge/Mentor/EventCoordinator) */
export function useRespondEventRoleInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invitationId, isAccepted }: { invitationId: string; isAccepted: boolean }) => {
      const res = await apiClient.post(`/EventRoles/invitations/${invitationId}/respond`, { isAccepted });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
    },
  });
}
