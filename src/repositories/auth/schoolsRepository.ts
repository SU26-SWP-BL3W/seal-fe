import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { School, PagedResult } from "@/models/entities";

/**
 * GET /api/Schools — Lấy danh sách trường học từ Database.
 */
export function useGetSchools() {
  return useQuery({
    queryKey: ["schools"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<PagedResult<School>>("/Schools", {
          params: { PageNumber: 1, PageSize: 500 },
        });
        if (Array.isArray(res.data?.data)) {
          return res.data.data;
        }
        if (Array.isArray(res.data)) {
          return res.data as unknown as School[];
        }
      } catch (err: any) {
        console.warn("[SEAL BE-DATA MISSING] GET /api/Schools error:", err?.message);
      }
      return [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

export interface SchoolWithUserCount {
  id: string;
  schoolName: string;
  code?: string;
  schoolCode?: string;
  address?: string | null;
  userCount: number;
}

/** GET /api/Schools/with-user-count — Danh sách trường kèm số lượng người dùng (Admin). */
export function useGetSchoolsWithUserCount() {
  return useQuery({
    queryKey: ["schools-with-user-count"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>("/Schools/with-user-count");
        const list = res.data?.data ?? res.data ?? [];
        return (Array.isArray(list) ? list : []) as SchoolWithUserCount[];
      } catch (err: any) {
        console.warn("[SEAL BE-DATA MISSING] GET /api/Schools/with-user-count error:", err?.message);
        return [] as SchoolWithUserCount[];
      }
    },
    staleTime: 1000 * 60 * 5,
  });
}

/** POST /api/Schools — Tạo trường mới (Admin) */
export function useCreateSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { schoolName: string; code?: string; address?: string }) => {
      const res = await apiClient.post("/Schools", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
    },
  });
}

/** PUT /api/Schools/{id} — Cập nhật trường học (Admin) */
export function useUpdateSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { schoolName: string; address?: string } }) => {
      const res = await apiClient.put(`/Schools/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
    },
  });
}

/** DELETE /api/Schools/{id} — Xóa trường học (Admin) */
export function useDeleteSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/Schools/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
    },
  });
}

