import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { PagedResult } from "@/models/types";

// Field/route đối chiếu trực tiếp AppealsController.cs + Features/Appeals/**.
// Body của Create/Respond KHÔNG bọc trong "RequestModel" — controller bind thẳng
// Command làm body (giống ResendEmailVerification/UpdateStudentProfile ở Auth).

/** Khớp enum AppealStatus bên BE — serialize dạng SỐ (0/1/2), không phải chuỗi. */
export const AppealStatus = {
  Pending: 0,
  Approved: 1,
  Rejected: 2,
} as const;
export type AppealStatusValue = (typeof AppealStatus)[keyof typeof AppealStatus];

export interface Appeal {
  id: string;
  teamId: string;
  submitResultId: string;
  reason: string;
  response?: string | null;
  status: AppealStatusValue;
  assignedJudgeId?: string | null;
  createdTime: string;
  lastUpdatedTime: string;
}

export interface CreateAppealPayload {
  submitResultId: string;
  reason: string;
}

/** POST /Appeals — chỉ Team Leader, và phải nộp TRƯỚC KHI kết quả vòng được công bố (BE tự chặn). */
export function useCreateAppeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAppealPayload) => {
      const { data } = await apiClient.post<boolean>("/Appeals", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appeals"] });
    },
  });
}

export interface RespondAppealPayload {
  status: AppealStatusValue;
  response: string;
  /** Tuỳ chọn — phân công giám khảo khác chấm lại nếu đơn được chấp nhận. */
  assignedJudgeId?: string;
}

/** PUT /Appeals/{id}/respond — chỉ EC/Admin. */
export function useRespondAppeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: RespondAppealPayload }) => {
      const { data } = await apiClient.put<boolean>(`/Appeals/${id}/respond`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appeals"] });
    },
  });
}

export interface AppealListParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isAscending?: boolean;
}

/** GET /Appeals/team/{teamId} — đơn phúc khảo của 1 đội. */
export function useGetAppealsByTeam(teamId: string | undefined, params: AppealListParams = {}) {
  return useQuery({
    queryKey: ["appealsByTeam", teamId, params],
    queryFn: async () => {
      const { data } = await apiClient.get<PagedResult<Appeal>>(`/Appeals/team/${teamId}`, {
        params,
      });
      return data;
    },
    enabled: !!teamId,
  });
}

/** GET /Appeals/round/{roundId} — toàn bộ đơn phúc khảo trong 1 vòng (EC dùng để xử lý). */
export function useGetAppealsByRound(roundId: string | undefined, params: AppealListParams = {}) {
  return useQuery({
    queryKey: ["appealsByRound", roundId, params],
    queryFn: async () => {
      const { data } = await apiClient.get<PagedResult<Appeal>>(`/Appeals/round/${roundId}`, {
        params,
      });
      return data;
    },
    enabled: !!roundId,
  });
}

/** GET /Appeals/assigned/{eventRoleId} — đơn được phân công cho 1 giám khảo cụ thể xử lý. */
export function useGetAssignedAppeals(eventRoleId: string | undefined) {
  return useQuery({
    queryKey: ["assignedAppeals", eventRoleId],
    queryFn: async () => {
      const { data } = await apiClient.get<Appeal[]>(`/Appeals/assigned/${eventRoleId}`);
      return data;
    },
    enabled: !!eventRoleId,
  });
}
