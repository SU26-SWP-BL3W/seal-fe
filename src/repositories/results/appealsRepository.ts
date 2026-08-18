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
    mutationFn: async (args: any) => {
      const id = args.id || args.appealId;
      const payload = args.payload || {
        status: args.status,
        response: args.response,
        assignedJudgeId: args.assignedJudgeId,
      };
      const { data } = await apiClient.put<boolean>(`/Appeals/${id}/respond`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appeals"] });
      queryClient.invalidateQueries({ queryKey: ["appealsByRound"] });
      queryClient.invalidateQueries({ queryKey: ["appealsByTeam"] });
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
    queryFn: async (): Promise<Appeal[]> => {
      const res = await apiClient.get<PagedResult<Appeal>>(`/Appeals/team/${teamId}`, {
        params,
      });
      if (Array.isArray(res.data?.data)) return res.data.data;
      if (Array.isArray(res.data)) return res.data as unknown as Appeal[];
      return [];
    },
    enabled: !!teamId,
  });
}

/** GET /Appeals/round/{roundId} — toàn bộ đơn phúc khảo trong 1 vòng (EC dùng để xử lý). */
export function useGetAppealsByRound(roundId: string | undefined, params: any = {}) {
  return useQuery({
    queryKey: ["appealsByRound", roundId, params],
    queryFn: async (): Promise<Appeal[]> => {
      const queryParams = typeof params === "object" ? params : {};
      const res = await apiClient.get<PagedResult<Appeal>>(`/Appeals/round/${roundId}`, {
        params: queryParams,
      });
      if (Array.isArray(res.data?.data)) return res.data.data;
      if (Array.isArray(res.data)) return res.data as unknown as Appeal[];
      return [];
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

export const useAppealsByRound = useGetAppealsByRound;
export { readApiError } from "../shared/errorHelper";

/**
 * Không có endpoint "GET đơn phúc khảo theo sự kiện" trên BE — gom từ tất cả vòng thi
 * của sự kiện đang chọn (GET /Rounds/event rồi GET /Appeals/round/{roundId} cho từng vòng).
 * Dùng cho màn EC quản lý phúc khảo (không dùng useGetAssignedAppeals — endpoint đó chỉ trả
 * về đơn ĐÃ Approved và đã gán cho đúng eventRoleId, không phải hàng đợi đơn Pending cần xử lý).
 */
export function useGetAppealsByEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ["appealsByEvent", eventId],
    queryFn: async (): Promise<Appeal[]> => {
      const roundsRes = await apiClient.get<any>("/Rounds/event", {
        params: { EventId: eventId, PageSize: 100 },
      });
      const rounds: any[] = Array.isArray(roundsRes.data?.data)
        ? roundsRes.data.data
        : Array.isArray(roundsRes.data)
          ? roundsRes.data
          : [];

      const perRound = await Promise.all(
        rounds.map(async (r) => {
          const roundId = r.id || r.Id;
          if (!roundId) return [];
          const res = await apiClient.get<PagedResult<Appeal>>(`/Appeals/round/${roundId}`, {
            params: { PageSize: 200 },
          });
          return Array.isArray(res.data?.data) ? res.data.data : [];
        }),
      );
      return perRound.flat();
    },
    enabled: !!eventId,
  });
}

export const appealsRepository = {
  async respondAppeal(
    id: string,
    payloadOrApproved: RespondAppealPayload | boolean,
    reason?: string,
    assignedJudgeId?: string,
  ): Promise<boolean> {
    const payload: RespondAppealPayload =
      typeof payloadOrApproved === "boolean"
        ? {
            status: payloadOrApproved ? AppealStatus.Approved : AppealStatus.Rejected,
            response: reason || "",
            assignedJudgeId,
          }
        : payloadOrApproved;
    const res = await apiClient.put<boolean>(`/Appeals/${id}/respond`, payload);
    return res.data;
  },
};

