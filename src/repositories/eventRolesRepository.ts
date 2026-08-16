import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";

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
