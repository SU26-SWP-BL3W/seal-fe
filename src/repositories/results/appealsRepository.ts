/**
 * =========================================================================================
 * REPOSITORY: appealsRepository & useAppeals* Hooks
 * TẦNG KIẾN TRÚC: Data Access / Repository Layer
 * MÔ TẢ:
 *   Quản lý toàn bộ các lời gọi API (HTTP Request qua apiClient Axios) tương tác với Controller:
 *   `SEAL_Backend.Controllers.AppealsController` (C# .NET) cho cả vai trò Thí sinh (Team) và Cán bộ Điều phối (EC).
 * =========================================================================================
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { PagedResult } from "@/models/types";

/**
 * Khớp với enum AppealStatus bên Backend (C# SEAL_Domain.Entity.Enums.AppealStatus):
 * - Pending (0): Đơn đang chờ EC xử lý
 * - Approved (1): EC đã chấp nhận & phân công Giám khảo chấm lại
 * - Rejected (2): EC từ chối khiếu nại kèm giải trình
 */
export const AppealStatus = {
  Pending: 0,
  Approved: 1,
  Rejected: 2,
} as const;
export type AppealStatusValue = (typeof AppealStatus)[keyof typeof AppealStatus];

/**
 * Interface cấu trúc Entity Đơn phúc khảo (Appeal)
 */
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

/**
 * Interface Payload tạo đơn phúc khảo mới từ Thí sinh (Team Leader)
 */
export interface CreateAppealPayload {
  submitResultId: string;
  reason: string;
}

/**
 * =====================================================================================
 * HOOK: useCreateAppeal (POST /api/Appeals)
 * VAI TRÒ: Chỉ Trưởng nhóm (Team Leader) mới được gọi.
 * RÀNG BUỘC NGHIỆP VỤ:
 *   Đơn phúc khảo bắt buộc phải nộp TRƯỚC KHI kết quả vòng thi được công bố (Backend tự kiểm tra cờ IsPublished).
 * =====================================================================================
 */
export function useCreateAppeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAppealPayload) => {
      const { data } = await apiClient.post<boolean>("/Appeals", payload);
      return data;
    },
    onSuccess: () => {
      // Invalidate cache để cập nhật danh sách đơn phúc khảo
      queryClient.invalidateQueries({ queryKey: ["appeals"] });
    },
  });
}

/**
 * Interface Payload phản hồi đơn phúc khảo từ Điều phối viên (EC)
 */
export interface RespondAppealPayload {
  status: AppealStatusValue;     // 1 = Approved, 2 = Rejected
  response: string;              // Nội dung giải trình hoặc phản hồi
  assignedJudgeId?: string;      // ID Giám khảo phụ trách chấm lại (bắt buộc nếu Approved)
}

/**
 * =====================================================================================
 * HOOK: useRespondAppeal (PUT /api/Appeals/{id}/respond)
 * VAI TRÒ: Chỉ Điều phối viên (EC) hoặc Admin.
 * CHỨC NĂNG: Duyệt / Từ chối đơn khiếu nại điểm số của đội thi.
 * =====================================================================================
 */
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
      // Xóa cache để tự động nạp lại danh sách đơn mới nhất
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

/**
 * =====================================================================================
 * HOOK: useGetAppealsByTeam (GET /api/Appeals/team/{teamId})
 * CHỨC NĂNG: Lấy toàn bộ lịch sử đơn phúc khảo của 1 đội thi cụ thể.
 * =====================================================================================
 */
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

/**
 * =====================================================================================
 * HOOK: useGetAppealsByRound (GET /api/Appeals/round/{roundId})
 * VAI TRÒ: EC sử dụng để xem toàn bộ danh sách đơn khiếu nại trong Vòng thi đã chọn.
 * =====================================================================================
 */
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

/**
 * =====================================================================================
 * HOOK: useGetAssignedAppeals (GET /api/Appeals/assigned/{eventRoleId})
 * VAI TRÒ: Giám khảo sử dụng để xem danh sách bài thi được EC phân công chấm lại.
 * =====================================================================================
 */
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
 * =====================================================================================
 * HOOK: useGetAppealsByEvent
 * CHỨC NĂNG:
 *   Gom tất cả đơn phúc khảo từ các Vòng thi thuộc một Sự kiện (Event).
 * =====================================================================================
 */
export function useGetAppealsByEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ["appealsByEvent", eventId],
    queryFn: async (): Promise<Appeal[]> => {
      if (!eventId) return [];
      try {
        const roundsRes = await apiClient.get<any>("/Rounds/event", {
          params: { EventId: eventId, eventId, PageSize: 100 },
        });
        const rawRounds =
          roundsRes.data?.data?.items ??
          roundsRes.data?.items ??
          roundsRes.data?.data ??
          roundsRes.data ??
          [];
        const rounds: any[] = Array.isArray(rawRounds) ? rawRounds : [];

        if (rounds.length === 0) return [];

        const perRound = await Promise.all(
          rounds.map(async (r) => {
            const roundId = r.id || r.Id;
            if (!roundId) return [];
            try {
              const res = await apiClient.get<any>(`/Appeals/round/${roundId}`, {
                params: { PageSize: 200 },
              });
              const rawAppeals =
                res.data?.data?.items ??
                res.data?.items ??
                res.data?.data ??
                (Array.isArray(res.data) ? res.data : []);
              return Array.isArray(rawAppeals) ? rawAppeals : [];
            } catch {
              return [];
            }
          }),
        );
        return perRound.flat();
      } catch (err) {
        console.warn("[Appeals] Failed to fetch appeals for event:", eventId, err);
        return [];
      }
    },
    enabled: !!eventId,
  });
}

/**
 * =====================================================================================
 * OBJECT SERVICE: appealsRepository
 * CHỨC NĂNG:
 *   Cung cấp phương thức trực tiếp `respondAppeal` để gọi API phản hồi đơn phúc khảo.
 * =====================================================================================
 */
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
