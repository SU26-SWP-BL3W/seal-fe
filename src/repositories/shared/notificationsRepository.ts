import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { BaseResponse } from "@/models/entities";

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "danger";
  createdAt: string;
  isRead: boolean;
  linkUrl?: string;
}

export const notificationsRepository = {
  /** Fetch notifications for current authenticated user */
  async getNotifications(): Promise<BaseResponse<SystemNotification[]>> {
    try {
      const res = await apiClient.get<BaseResponse<SystemNotification[]>>("/Notifications/my-notifications");
      return res.data;
    } catch (error: any) {
      console.warn("[SEAL BE-DATA MISSING] GET /api/Notifications/my-notifications error:", error?.message);
      return {
        success: false,
        data: [],
        message: "Chưa có thông báo từ Backend API",
      };
    }
  },

  /** Mark notification as read */
  async markAsRead(notificationId: string): Promise<BaseResponse<boolean>> {
    try {
      const res = await apiClient.put<BaseResponse<boolean>>(`/Notifications/${notificationId}/read`);
      return res.data;
    } catch (error: any) {
      console.warn("[SEAL BE-DATA MISSING] PUT /api/Notifications/" + notificationId + "/read error:", error?.message);
      return { success: false, data: false, message: "Lỗi cập nhật trạng thái thông báo" };
    }
  },
};

function unwrapList(raw: unknown): SystemNotification[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as SystemNotification[];
  const r = raw as any;
  const items = r.data?.items ?? r.items ?? r.data ?? [];
  if (!Array.isArray(items)) return [];

  return items.map((n: any) => ({
    id: n.id || n.Id || String(Math.random()),
    title: n.title || n.Title || "Thông báo hệ thống",
    message: n.message || n.Message || n.content || n.Content || "",
    type: (n.type || n.Type || "info").toLowerCase(),
    createdAt: n.createdAt || n.CreatedAt || n.createdTime || n.CreatedTime || new Date().toISOString(),
    isRead: Boolean(n.isRead ?? n.IsRead ?? false),
    linkUrl: n.linkUrl || n.LinkUrl || n.url || n.Url,
  }));
}

export function useMyNotifications(enabled: boolean = true) {
  return useQuery({
    queryKey: ["my-notifications"],
    queryFn: async () => {
      const res = await notificationsRepository.getNotifications();
      return unwrapList(res);
    },
    refetchInterval: 30_000,
    enabled,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await notificationsRepository.markAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
    },
  });
}
