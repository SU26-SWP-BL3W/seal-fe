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
  recipientEmail?: string;
  senderEmail?: string;
}

const LOCAL_NOTIF_KEY = "seal_local_system_notifications";

export function pushSystemNotification(notif: Omit<SystemNotification, "id" | "createdAt" | "isRead">) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LOCAL_NOTIF_KEY);
    const list: SystemNotification[] = raw ? JSON.parse(raw) : [];
    const item: SystemNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...notif,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    list.unshift(item);
    localStorage.setItem(LOCAL_NOTIF_KEY, JSON.stringify(list.slice(0, 50)));
    window.dispatchEvent(new Event("seal-notification-updated"));
  } catch (e) {
    console.warn("Could not save local notification", e);
  }
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
        statusCode: 400,
        success: false,
        data: [],
        message: "Chưa có thông báo từ Backend API",
      };
    }
  },

  /** Mark notification as read */
  async markAsRead(notificationId: string): Promise<BaseResponse<boolean>> {
    if (typeof window !== "undefined" && notificationId.startsWith("notif-")) {
      try {
        const raw = localStorage.getItem(LOCAL_NOTIF_KEY);
        if (raw) {
          const list: SystemNotification[] = JSON.parse(raw);
          const updated = list.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n));
          localStorage.setItem(LOCAL_NOTIF_KEY, JSON.stringify(updated));
          window.dispatchEvent(new Event("seal-notification-updated"));
        }
      } catch {}
      return { statusCode: 200, success: true, data: true, message: "OK" };
    }

    try {
      const res = await apiClient.put<BaseResponse<boolean>>(`/Notifications/${notificationId}/read`);
      return res.data;
    } catch (error: any) {
      console.warn("[SEAL BE-DATA MISSING] PUT /api/Notifications/" + notificationId + "/read error:", error?.message);
      return { statusCode: 400, success: false, data: false, message: "Lỗi cập nhật trạng thái thông báo" };
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
      const beList = unwrapList(res);
      let localList: SystemNotification[] = [];
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(LOCAL_NOTIF_KEY);
          if (raw) localList = JSON.parse(raw);
        } catch {}
      }
      // Combine local notifications with backend notifications
      return [...localList, ...beList];
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
