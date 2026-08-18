import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { User, UserRejection, BaseResponse, PagedResult } from "@/models/entities";

// ─── Current User ────────────────────────────────────────────

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await apiClient.get<User>("/Users/profile");
      return res.data;
    },
    retry: false,
  });
}

/** GET /api/Users/{id} — Lấy chi tiết người dùng theo ID */
export function useGetUserById(userId?: string | null) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (!userId) return null;
      try {
        const res = await apiClient.get<BaseResponse<User>>(`/Users/${userId}`);
        return (res.data as any)?.data ?? res.data;
      } catch (err: any) {
        console.warn("[SEAL BE-DATA MISSING] GET /api/Users/" + userId + " error:", err?.message);
        return null;
      }
    },
    enabled: !!userId,
  });
}

// ─── User Profile ─────────────────────────────────────────────

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      const res = await apiClient.put<User>("/Auth/student-profiles", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["currentUser"], data);
    },
  });
}

// ─── My Invitations (chuông thông báo) ───────────────────────
// GET /api/Users/my-invitations — gộp SẴN lời mời vào đội (TEAM) và lời mời
// vai trò sự kiện (EVENT_ROLE: Judge/Mentor/EventCoordinator) trong 1 lần gọi.

export type MyInvitationType = "TEAM" | "EVENT_ROLE";
export type MyInvitationStatus = "PendingAccept" | "Accepted" | "Declined";

export interface MyInvitationItem {
  invitationId: string;
  type: MyInvitationType;
  /** Tên đội (TEAM) hoặc tên sự kiện (EVENT_ROLE). */
  targetName: string;
  inviterName: string;
  role: string;
  /** Chỉ có với Judge/Mentor theo hạng mục; null với EC/lời mời đội. */
  trackName?: string | null;
  status: MyInvitationStatus;
  respondedAt?: string | null;
  expiresAt: string;
}

export interface MyInvitationsResponse {
  totalPending: number;
  invitations: MyInvitationItem[];
}

/** GET /api/Users/my-invitations — Lấy toàn bộ lời mời (đội + vai trò sự kiện) của user hiện tại */
export function useMyInvitations(enabled: boolean = true) {
  return useQuery({
    queryKey: ["my-invitations"],
    queryFn: async () => {
      const res = await apiClient.get<MyInvitationsResponse>("/Users/my-invitations");
      return res.data ?? { totalPending: 0, invitations: [] };
    },
    enabled,
  });
}

// ─── User Rejections ─────────────────────────────────────────

/** GET /api/UserRejections/user/{userId} — Lấy lịch sử từ chối hồ sơ */
export function useGetUserRejections(userId: string | undefined) {
  return useQuery({
    queryKey: ["userRejections", userId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<UserRejection[]>(`/UserRejections/user/${userId}`);
        if (res.data) return res.data;
      } catch {
        // Fallback
      }
      return [];
    },
    enabled: !!userId,
  });
}

// ─── Admin / Coordinator Actions ─────────────────────────────

/** GET /api/Users — Lấy danh sách users (có thể lọc) */
export function useGetUsers(params?: {
  isApproved?: boolean;
  isRejected?: boolean;
  pageNumber?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async (): Promise<PagedResult<User>> => {
      const res = await apiClient.get<BaseResponse<PagedResult<User>>>("/Users", { params });
      const payload = res.data as unknown;
      const emptyPage: PagedResult<User> = {
        data: [],
        currentPage: 1,
        pageSize: 50,
        totalItems: 0,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      };
      if (payload && typeof payload === "object" && Array.isArray((payload as PagedResult<User>).data)) {
        return payload as PagedResult<User>;
      }
      if (Array.isArray(payload)) {
        const arr = payload as User[];
        return { ...emptyPage, data: arr, pageSize: arr.length, totalItems: arr.length };
      }
      return emptyPage;
    },
  });
}

/** POST /api/Users/{id}/approve — EC/Admin duyệt hồ sơ */
export function useApproveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient.post(`/Users/${userId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

/** POST /api/Users/{id}/reject — EC/Admin từ chối hồ sơ (với lý do) */
export function useRejectUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { userId: string; reason: string }) => {
      const res = await apiClient.post(`/Users/${params.userId}/reject`, {
        reason: params.reason,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

/** DELETE /api/Users/{id} — Admin xoá vĩnh viễn. */
export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient.delete(`/Users/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export const usersRepository = {
  async findUserByEmail(email: string): Promise<User | null> {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    try {
      // 1. Tìm kiếm trực tiếp qua tham số Search của Backend
      const res = await apiClient.get<PagedResult<User>>("/Users", {
        params: { Search: cleanEmail, PageSize: 50 },
      });
      const rawData = res.data as any;
      const list: User[] = Array.isArray(rawData?.data)
        ? rawData.data
        : Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.data?.data)
        ? rawData.data.data
        : [];
      const found = list.find(
        (u) => (u.email || (u as any).Email || "").toLowerCase() === cleanEmail
      );
      if (found) return found;

      // 2. Dự phòng quét toàn bộ danh sách 500 bản ghi nếu Search backend không khớp exact
      const resAll = await apiClient.get<PagedResult<User>>("/Users", {
        params: { PageSize: 500, PageNumber: 1 },
      });
      const rawAll = resAll.data as any;
      const listAll: User[] = Array.isArray(rawAll?.data)
        ? rawAll.data
        : Array.isArray(rawAll)
        ? rawAll
        : Array.isArray(rawAll?.data?.data)
        ? rawAll.data.data
        : [];
      const foundInAll = listAll.find(
        (u) => (u.email || (u as any).Email || "").toLowerCase() === cleanEmail
      );
      if (foundInAll) return foundInAll;
    } catch (err: any) {
      console.warn("[SEAL BE-DATA MISSING] GET /api/Users error:", err?.message);
    }
    return null;
  },
  async approveUser(userId: string): Promise<any> {
    const res = await apiClient.post(`/Users/${userId}/approve`);
    return res.data;
  },
  async rejectUser(userId: string, reason: string): Promise<any> {
    const res = await apiClient.post(`/Users/${userId}/reject`, { reason });
    return res.data;
  },
};
