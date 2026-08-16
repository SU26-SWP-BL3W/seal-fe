import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { PagedResult } from "@/models/types";

// Field/route đối chiếu trực tiếp ScoreDetailsController.cs + Features/ScoreDetails/**/Models.
//
// Đây là API NGUYÊN TỬ (1 tiêu chí / lần gọi). Khi giám khảo lưu cả phiếu chấm với
// nhiều tiêu chí cùng lúc, dùng `useSaveScore` (Scores/save — API gộp, tự tạo/sửa/xoá
// theo danh sách) ở `scoresRepository.ts` thay vì gọi rời từng hook ở đây — tránh N
// request riêng lẻ dễ đua nhau khi tính lại TotalScore của Score cha.

export interface CreateScoreDetailPayload {
  scoreId: string;
  templateId: string;
  criteriaId: string;
  value: number;
}

export interface ScoreDetailCreated {
  id: string;
  scoreId: string;
  templateId: string;
  criteriaId: string;
  value: number;
  /** TotalScore mới của Score cha SAU khi thêm điểm chi tiết này. */
  scoreTotal: number;
  createdTime: string;
}

export function useCreateScoreDetail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateScoreDetailPayload) => {
      const { data } = await apiClient.post<ScoreDetailCreated>("/ScoreDetails", payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["scoreDetailsByScore", data.scoreId] });
      queryClient.invalidateQueries({ queryKey: ["scoreDetail", data.scoreId] });
    },
  });
}

export interface ScoreDetailUpdated {
  id: string;
  scoreId: string;
  templateId: string;
  criteriaId: string;
  value: number;
  scoreTotal: number;
  lastUpdatedTime: string;
}

export function useUpdateScoreDetail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, value }: { id: string; value: number }) => {
      const { data } = await apiClient.put<ScoreDetailUpdated>(`/ScoreDetails/${id}`, { value });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["scoreDetailsByScore", data.scoreId] });
      queryClient.invalidateQueries({ queryKey: ["scoreDetail", data.scoreId] });
    },
  });
}

export function useDeleteScoreDetail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<boolean>(`/ScoreDetails/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scoreDetailsByScore"] });
    },
  });
}

export interface ScoreDetail {
  id: string;
  scoreId: string;
  templateId: string;
  criteriaId: string;
  value: number;
  createdTime: string;
  lastUpdatedTime: string;
}

export function useGetScoreDetailById(id: string | undefined) {
  return useQuery({
    queryKey: ["scoreDetailById", id],
    queryFn: async () => {
      const { data } = await apiClient.get<ScoreDetail>(`/ScoreDetails/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export interface GetScoreDetailsByScoreParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isAscending?: boolean;
}

export function useGetScoreDetailsByScoreId(
  scoreId: string | undefined,
  params: GetScoreDetailsByScoreParams = {},
) {
  return useQuery({
    queryKey: ["scoreDetailsByScore", scoreId, params],
    queryFn: async () => {
      const { data } = await apiClient.get<PagedResult<ScoreDetail>>(
        `/ScoreDetails/score/${scoreId}`,
        { params },
      );
      return data;
    },
    enabled: !!scoreId,
  });
}
