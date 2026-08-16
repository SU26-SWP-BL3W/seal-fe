import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { PagedResult } from "@/models/types";

// Field/route đối chiếu trực tiếp CriteriasController.cs + Features/Criterias/**/Models.
// Đây là KHO TIÊU CHÍ GỐC dùng chung — Weight/MaxScore thật sự áp dụng khi gắn vào 1
// Template (xem `templatesRepository.useAddCriteriaToTemplate`), không nằm ở Criteria gốc.

export interface CreateCriteriaPayload {
  criteriaName: string;
  description?: string;
  isActive?: boolean;
}

export interface CriteriaCreated {
  id: string;
  criteriaName: string;
  description?: string | null;
  isActive: boolean;
  createdTime: string;
}

export function useCreateCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCriteriaPayload) => {
      const { data } = await apiClient.post<CriteriaCreated>("/Criterias", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criterias"] });
    },
  });
}

export interface UpdateCriteriaPayload {
  criteriaName: string;
  description?: string;
  isActive: boolean;
}

export interface CriteriaUpdated {
  id: string;
  criteriaName: string;
  description?: string | null;
  isActive: boolean;
  lastUpdatedTime: string;
}

export function useUpdateCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateCriteriaPayload }) => {
      const { data } = await apiClient.put<CriteriaUpdated>(`/Criterias/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criterias"] });
    },
  });
}

/** Xoá vĩnh viễn — cân nhắc dùng useToggleCriteriaStatus (ẩn, không xoá) nếu tiêu chí đã dùng trong Template nào đó. */
export function useDeleteCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<boolean>(`/Criterias/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criterias"] });
    },
  });
}

export function useToggleCriteriaStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch<boolean>(`/Criterias/${id}/toggle-status`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criterias"] });
    },
  });
}

export interface Criteria {
  id: string;
  criteriaName: string;
  description?: string | null;
  isActive: boolean;
  createdTime: string;
  lastUpdatedTime: string;
}

export function useGetCriteriaById(id: string | undefined) {
  return useQuery({
    queryKey: ["criteria", id],
    queryFn: async () => {
      const { data } = await apiClient.get<Criteria>(`/Criterias/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export interface GetAllCriteriaParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isAscending?: boolean;
}

export function useGetAllCriteria(params: GetAllCriteriaParams = {}) {
  return useQuery({
    queryKey: ["criterias", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PagedResult<Criteria>>("/Criterias", { params });
      return data;
    },
  });
}
