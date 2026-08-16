import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { PagedResult } from "@/models/types";

// Field/route đối chiếu trực tiếp AppealsController.cs + Features/Appeals/**
// (SU26_SWP_BL3W_BE, backend/main). Bản trước ở file này gọi route "GET /Appeals"
// không tồn tại (chỉ có /Appeals/team/{teamId}, /Appeals/round/{roundId},
// /Appeals/assigned/{eventRoleId}) và dùng sai tên field (SubmissionId thay vì
// SubmitResultId, responseReason thay vì Response, status dạng chuỗi thay vì số) —
// khiến toàn bộ luồng phúc khảo không hoạt động. Viết lại đúng theo controller thật.

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

export interface AppealListParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isAscending?: boolean;
}

/** GET /api/Appeals/team/{teamId} — đơn phúc khảo của 1 đội (Team Leader/thành viên xem của đội mình). */
export function useGetAppealsByTeam(teamId?: string, params: AppealListParams = {}) {
  return useQuery({
    queryKey: ["appeals-by-team", teamId, params],
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<Appeal>>(`/Appeals/team/${teamId}`, { params });
      return res.data?.data ?? [];
    },
    enabled: !!teamId,
  });
}

/** GET /api/Appeals/round/{roundId} — toàn bộ đơn phúc khảo trong 1 vòng (EC dùng để xử lý). */
export function useGetAppealsByRound(roundId?: string, params: AppealListParams = {}) {
  return useQuery({
    queryKey: ["appeals-by-round", roundId, params],
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<Appeal>>(`/Appeals/round/${roundId}`, { params });
      return res.data?.data ?? [];
    },
    enabled: !!roundId,
  });
}

/** GET /api/Appeals/assigned/{eventRoleId} — đơn được phân công cho 1 giám khảo cụ thể xử lý. */
export function useGetAssignedAppeals(eventRoleId?: string) {
  return useQuery({
    queryKey: ["assigned-appeals", eventRoleId],
    queryFn: async () => {
      const res = await apiClient.get<Appeal[]>(`/Appeals/assigned/${eventRoleId}`);
      return res.data ?? [];
    },
    enabled: !!eventRoleId,
  });
}

/** POST /api/Appeals — chỉ Team Leader, phải nộp TRƯỚC KHI kết quả vòng được công bố (BE tự chặn). */
export function useCreateAppeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { submitResultId: string; reason: string }) => {
      const res = await apiClient.post<boolean>("/Appeals", {
        SubmitResultId: data.submitResultId,
        Reason: data.reason,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appeals-by-team"] });
      queryClient.invalidateQueries({ queryKey: ["appeals-by-round"] });
    },
  });
}

/** PUT /api/Appeals/{id}/respond — chỉ EC/Admin. */
export function useRespondAppeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      appealId: string;
      status: AppealStatusValue;
      response: string;
      assignedJudgeId?: string;
    }) => {
      const res = await apiClient.put<boolean>(`/Appeals/${data.appealId}/respond`, {
        Status: data.status,
        Response: data.response,
        AssignedJudgeId: data.assignedJudgeId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appeals-by-team"] });
      queryClient.invalidateQueries({ queryKey: ["appeals-by-round"] });
      queryClient.invalidateQueries({ queryKey: ["assigned-appeals"] });
    },
  });
}

export function readApiError(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e.response?.data?.message || e.message || "Thao tác thất bại.";
}

export const useAppealsByRound = useGetAppealsByRound;

export const appealsRepository = {
  async respondAppeal(appealId: string, isApproved: boolean, responseReason: string, assignedJudgeId?: string): Promise<any> {
    const res = await apiClient.put(`/Appeals/${appealId}/respond`, {
      Status: isApproved ? AppealStatus.Approved : AppealStatus.Rejected,
      Response: responseReason,
      AssignedJudgeId: assignedJudgeId,
    });
    return res.data;
  },
};
