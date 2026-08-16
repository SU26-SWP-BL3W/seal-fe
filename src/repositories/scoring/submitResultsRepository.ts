import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { PagedResult } from "@/models/types";

// Field/route đối chiếu trực tiếp SubmitResultsController.cs +
// Features/SubmitResults/**/Models (SU26_SWP_BL3W_BE). Luật nghiệp vụ đã BE enforce
// sẵn (không cần FE validate lại, chỉ hiện lỗi trả về): 1 đội chỉ nộp 1 bài / Track
// (không phải / Round — 1 Round có thể có nhiều Track song song); chỉ nộp được trong
// cửa sổ thời gian của Track (hoặc Round nếu Track không có mốc riêng).

export interface CreateSubmitResultPayload {
  teamId: string;
  trackId: string;
  roundId: string;
  submissionUrl: string;
  repoUrl: string;
  demoUrl: string;
  slideUrl: string;
  description: string;
}

export interface SubmitResultCreated {
  id: string;
  teamId: string;
  trackId: string;
  roundId: string;
  submissionUrl: string;
  repoUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  /** repoHost/repoFullName/repoStars/repoLastPush — BE tự phân tích từ repoUrl (vd GitHub). */
  repoHost?: string | null;
  repoFullName?: string | null;
  repoStars?: number | null;
  repoLastPush?: string | null;
  description: string;
  isActive: boolean;
  createdTime: string;
}

export function useCreateSubmitResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateSubmitResultPayload) => {
      const { data } = await apiClient.post<SubmitResultCreated>("/SubmitResults", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submitResults"] });
    },
  });
}

/**
 * PUT /SubmitResults/{id} — mọi field đều optional, không gửi = giữ nguyên giá trị cũ
 * (BE tự xử lý null-nghĩa-là-giữ). Ngoại lệ: `description` chuỗi rỗng `""` = XOÁ mô tả
 * (khác null = giữ nguyên) — theo đúng comment trong UpdateSubmitResultRequestModel.
 */
export interface UpdateSubmitResultPayload {
  submissionUrl?: string;
  repoUrl?: string;
  demoUrl?: string;
  slideUrl?: string;
  description?: string;
  isActive?: boolean;
}

export interface SubmitResultUpdated {
  id: string;
  teamId: string;
  trackId: string;
  submissionUrl: string;
  repoUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  description: string;
  isActive: boolean;
  lastUpdatedTime: string;
}

export function useUpdateSubmitResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateSubmitResultPayload }) => {
      const { data } = await apiClient.put<SubmitResultUpdated>(`/SubmitResults/${id}`, payload);
      return data;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["submitResults"] });
      queryClient.invalidateQueries({ queryKey: ["submitResult", id] });
    },
  });
}

export function useDeleteSubmitResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<boolean>(`/SubmitResults/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submitResults"] });
    },
  });
}

export interface SubmitResultDetail {
  id: string;
  teamId: string;
  teamName: string;
  trackId: string;
  trackName: string;
  submissionUrl: string;
  repoUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  repoHost?: string | null;
  repoFullName?: string | null;
  repoStars?: number | null;
  repoLastPush?: string | null;
  description: string;
  isActive: boolean;
  createdTime: string;
}

/** GET /SubmitResults/{id} — chỉ EC/Judge/Mentor xem được (route filter). */
export function useGetSubmitResultById(id: string | undefined) {
  return useQuery({
    queryKey: ["submitResult", id],
    queryFn: async () => {
      const { data } = await apiClient.get<SubmitResultDetail>(`/SubmitResults/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export interface SubmitResultListItem {
  id: string;
  teamId: string;
  trackId: string;
  teamName?: string | null;
  displayCode?: string | null;
  submissionUrl: string;
  repoUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  isActive: boolean;
  createdTime: string;
}

export interface SubmitResultListFilters {
  /** Thiếu eventId thì list trộn bài của MỌI sự kiện — luôn truyền khi có thể. */
  eventId?: string;
  teamId?: string;
  roundId?: string;
  trackId?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isAscending?: boolean;
}

/**
 * GET /SubmitResults — EC/Judge/Mentor xem theo bộ lọc; thành viên đội chỉ thấy bài
 * của đội mình (BE tự cưỡng bức phạm vi theo JWT, không cần FE lọc thêm).
 */
export function useGetSubmitResults(filters: SubmitResultListFilters = {}) {
  return useQuery({
    queryKey: ["submitResults", filters],
    queryFn: async () => {
      const { data } = await apiClient.get<PagedResult<SubmitResultListItem>>("/SubmitResults", {
        params: filters,
      });
      return data;
    },
  });
}
