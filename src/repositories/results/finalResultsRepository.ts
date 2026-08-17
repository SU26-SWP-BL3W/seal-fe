import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { PagedResult } from "@/models/types";

// Field/route đối chiếu trực tiếp FinalResultsController.cs + Features/FinalResults/**/Models.
//
// ⚠️ 2 hành động DỄ NHẦM — đọc kỹ trước khi dùng:
// - `useUnpublishRoundResults` (DELETE round/{roundId}): XOÁ SẠCH FinalResult của vòng, phải
//   `useCalculateRoundResults` lại từ đầu. Chỉ dùng khi cần mở lại khoá chấm/sửa điểm.
// - `useSetRoundResultsPublishStatus` (PUT round/{roundId}/publish-status, body {isPublished}):
//   CHỈ đổi cờ công bố, GIỮ NGUYÊN Rank/FinalScore/IsAdvanced đã tính — đảo qua lại thoải mái,
//   idempotent. Đây là hàm nên dùng cho nút "Công bố / Thu hồi" (2 chiều) ở UI, KHÔNG phải
//   `usePublishRoundResults` (chỉ 1 chiều, không thu hồi được bằng chính nó).

export interface CreateFinalResultPayload {
  teamId: string;
  /** Nhập ĐÚNG MỘT trong 3: roundId (kết quả 1 vòng) | eventId (toàn sự kiện) | trackId (1 hạng mục). */
  roundId?: string;
  eventId?: string;
  trackId?: string;
  finalScore: number;
  rank: number;
  isAdvanced: boolean;
}

export interface FinalResultCreated {
  id: string;
  teamId: string;
  roundId?: string | null;
  eventId?: string | null;
  trackId?: string | null;
  finalScore: number;
  rank: number;
  isAdvanced: boolean;
  createdTime: string;
}

/** POST /FinalResults — tạo thủ công 1 dòng kết quả. Phần lớn trường hợp nên dùng calculate thay vì tạo tay. */
export function useCreateFinalResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateFinalResultPayload) => {
      const { data } = await apiClient.post<FinalResultCreated>("/FinalResults", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finalResults"] });
    },
  });
}

export interface CalculateRoundResultItem {
  id: string;
  finalResultId: string;
  teamId: string;
  trackId?: string | null;
  roundId: string;
  eventId: string;
  finalScore: number;
  rank: number;
  isAdvanced: boolean;
  /** Luôn false ngay sau khi tính — kết quả ở trạng thái NHÁP, phải publish riêng mới công khai. */
  isPublished: boolean;
}

/**
 * POST /FinalResults/calculate/{roundId}?topN= — tự tính FinalScore (TB điểm giám khảo), xếp
 * Rank, đánh dấu IsAdvanced cho top N đội. Lưu ở trạng thái NHÁP — chỉ EC/Admin xem được cho
 * đến khi gọi publish.
 */
export function useCalculateRoundResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roundId, topN }: { roundId: string; topN: number }) => {
      const { data } = await apiClient.post<CalculateRoundResultItem[]>(
        `/FinalResults/calculate/${roundId}`,
        undefined,
        { params: { topN } },
      );
      return data;
    },
    onSuccess: (_data, { roundId }) => {
      queryClient.invalidateQueries({ queryKey: ["finalResultsByRound", roundId] });
    },
  });
}

/** POST /FinalResults/publish/{roundId} — công bố 1 chiều. Muốn thu hồi lại, dùng useSetRoundResultsPublishStatus. */
export function usePublishRoundResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roundId: string) => {
      const { data } = await apiClient.post<boolean>(`/FinalResults/publish/${roundId}`);
      return data;
    },
    onSuccess: (_data, roundId) => {
      queryClient.invalidateQueries({ queryKey: ["finalResultsByRound", roundId] });
    },
  });
}

/** PUT /FinalResults/round/{roundId}/publish-status — bật/tắt công bố cả 2 chiều, giữ nguyên điểm đã tính. */
export function useSetRoundResultsPublishStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roundId, isPublished }: { roundId: string; isPublished: boolean }) => {
      const { data } = await apiClient.put<boolean>(`/FinalResults/round/${roundId}/publish-status`, {
        isPublished,
      });
      return data;
    },
    onSuccess: (_data, { roundId }) => {
      queryClient.invalidateQueries({ queryKey: ["finalResultsByRound", roundId] });
    },
  });
}

/** DELETE /FinalResults/round/{roundId} — XOÁ SẠCH kết quả để mở lại khoá chấm. Chỉ hủy được khi vòng sau chưa có bài/kết quả. */
export function useUnpublishRoundResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roundId: string) => {
      const { data } = await apiClient.delete<boolean>(`/FinalResults/round/${roundId}`);
      return data;
    },
    onSuccess: (_data, roundId) => {
      queryClient.invalidateQueries({ queryKey: ["finalResultsByRound", roundId] });
    },
  });
}

export interface UpdateFinalResultPayload {
  teamId: string;
  roundId: string;
  finalScore: number;
  rank: number;
  isAdvanced: boolean;
}

export interface FinalResultUpdated {
  id: string;
  teamId: string;
  roundId: string;
  finalScore: number;
  rank: number;
  isAdvanced: boolean;
  lastUpdatedTime: string;
}

export function useUpdateFinalResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateFinalResultPayload }) => {
      const { data } = await apiClient.put<FinalResultUpdated>(`/FinalResults/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finalResults"] });
    },
  });
}

export function useDeleteFinalResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<boolean>(`/FinalResults/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finalResults"] });
    },
  });
}

/** PATCH /FinalResults/{id}/assign-prize — prizeId=null nghĩa là GỠ giải thưởng đang gán. */
export function useAssignPrize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: any) => {
      const id = args.id || args.resultId;
      const prizeId = args.prizeId ?? null;
      const { data } = await apiClient.patch<boolean>(`/FinalResults/${id}/assign-prize`, {
        prizeId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finalResults"] });
      queryClient.invalidateQueries({ queryKey: ["finalResultsByRound"] });
    },
  });
}

export interface FinalResult {
  id: string;
  teamId: string;
  roundId?: string | null;
  eventId?: string | null;
  trackId?: string | null;
  prizeId?: string | null;
  finalScore: number;
  rank: number;
  isAdvanced: boolean;
  isPublished: boolean;
  createdTime: string;
  lastUpdatedTime: string;
}

export function useGetFinalResultById(id: string | undefined) {
  return useQuery({
    queryKey: ["finalResult", id],
    queryFn: async () => {
      const { data } = await apiClient.get<FinalResult>(`/FinalResults/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export interface GetFinalResultsByRoundParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isAscending?: boolean;
  trackId?: string;
}

/** GET /FinalResults/round/{roundId} — EC/Admin thấy cả bản nháp; người khác chỉ thấy đã công bố. */
export function useGetFinalResultsByRound(
  roundId: string | undefined,
  params: GetFinalResultsByRoundParams = {},
) {
  return useQuery({
    queryKey: ["finalResultsByRound", roundId, params],
    queryFn: async (): Promise<FinalResult[]> => {
      const res = await apiClient.get<PagedResult<FinalResult>>(
        `/FinalResults/round/${roundId}`,
        { params },
      );
      if (Array.isArray(res.data?.data)) return res.data.data;
      if (Array.isArray(res.data)) return res.data as unknown as FinalResult[];
      return [];
    },
    enabled: !!roundId,
  });
}

export interface GetFinalResultsByTeamParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isAscending?: boolean;
}

/** GET /FinalResults/team/{teamId} — lịch sử kết quả của 1 đội qua các vòng. */
export function useGetFinalResultsByTeam(
  teamId: string | undefined,
  params: GetFinalResultsByTeamParams = {},
) {
  return useQuery({
    queryKey: ["finalResultsByTeam", teamId, params],
    queryFn: async (): Promise<FinalResult[]> => {
      const res = await apiClient.get<PagedResult<FinalResult>>(
        `/FinalResults/team/${teamId}`,
        { params },
      );
      if (Array.isArray(res.data?.data)) return res.data.data;
      if (Array.isArray(res.data)) return res.data as unknown as FinalResult[];
      return [];
    },
    enabled: !!teamId,
  });
}

export const finalResultsRepository = {
  async calculateResults(roundId: string): Promise<any> {
    const res = await apiClient.post<any>(`/FinalResults/calculate/${roundId}`);
    return res.data;
  },
  async calculateRoundResults(roundId: string, topN?: number): Promise<any> {
    const res = await apiClient.post<any>(`/FinalResults/calculate/${roundId}`, undefined, {
      params: topN ? { topN } : undefined,
    });
    return res.data;
  },
  async publishResults(roundId: string, isPublished: boolean = true): Promise<any> {
    const res = await apiClient.put<any>(`/FinalResults/round/${roundId}/publish-status`, { isPublished });
    return res.data;
  },
  async setPublishStatus(roundId: string, isPublished: boolean): Promise<any> {
    const res = await apiClient.put<any>(`/FinalResults/round/${roundId}/publish-status`, { isPublished });
    return res.data;
  },
  async assignPrize(resultId: string, prizeId: string): Promise<any> {
    const res = await apiClient.post<any>(`/FinalResults/${resultId}/assign-prize`, { prizeId });
    return res.data;
  },
};


