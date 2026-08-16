import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { PagedResult } from "@/models/types";

// Field/route đối chiếu trực tiếp ScoresController.cs + Features/Scores/**/Models.
// Luật BE đã enforce sẵn: giám khảo không được chấm bài của đội mình là thành viên
// (conflict-of-interest), chỉ chấm được sau khi đóng cửa nộp bài.

export interface CriterionScoreLine {
  criteriaName: string;
  value: number;
  maxScore: number;
  weight: number;
}

export interface JudgeScoreBreakdown {
  judgeName: string;
  /** Tổng điểm quy hệ 10 có trọng số của giám khảo này. */
  totalScore: number;
  comment?: string | null;
  isSubmitted: boolean;
  criteria: CriterionScoreLine[];
}

export interface SubmissionScoreBreakdown {
  submitResultId: string;
  trackName: string;
  roundId: string;
  roundName: string;
  /** Vòng đã tính/công bố kết quả hay chưa — FE dùng để biết điểm đã chốt. */
  roundPublished: boolean;
  judgeScores: JudgeScoreBreakdown[];
}

export interface TeamScoreBreakdown {
  teamId: string;
  teamName: string;
  submissions: SubmissionScoreBreakdown[];
}

/** GET /Scores/team/{teamId}/breakdown — thành viên đội, EC hoặc Admin mới xem được. */
export function useGetTeamScoreBreakdown(teamId: string | undefined) {
  return useQuery({
    queryKey: ["teamScoreBreakdown", teamId],
    queryFn: async () => {
      const { data } = await apiClient.get<TeamScoreBreakdown>(`/Scores/team/${teamId}/breakdown`);
      return data;
    },
    enabled: !!teamId,
  });
}

export interface CalibrationScoreRow {
  judgeId: string;
  judgeName: string;
  submitResultId: string;
  teamName: string;
  totalScore: number;
  isSubmitted: boolean;
  isAccepted: boolean;
}

export interface CalibrationCriteriaStat {
  criteriaId: string;
  criteriaName: string;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  sampleCount: number;
}

export interface CalibrationJudgeStat {
  judgeId: string;
  judgeName: string;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  sampleCount: number;
}

export interface TrackCalibration {
  trackId: string;
  trackName: string;
  isCompleted: boolean;
  scores: CalibrationScoreRow[];
  criteriaStats: CalibrationCriteriaStat[];
  judgeStats: CalibrationJudgeStat[];
}

/** GET /Scores/track/{trackId}/calibration — chỉ Admin/EC của sự kiện. */
export function useGetTrackCalibration(trackId: string | undefined) {
  return useQuery({
    queryKey: ["trackCalibration", trackId],
    queryFn: async () => {
      const { data } = await apiClient.get<TrackCalibration>(`/Scores/track/${trackId}/calibration`);
      return data;
    },
    enabled: !!trackId,
  });
}

/**
 * GET /Scores/export/{eventId} — trả FILE THÔ (không bọc BaseResponse) khi thành công,
 * nhưng trả BaseResponse JSON như bình thường khi thất bại (403/400...). axios với
 * `responseType: "blob"` nhận CẢ HAI dạng là Blob nên phải tự soi content-type để
 * phân biệt, không dựa được vào interceptor unwrap chung của apiClient.
 */
export async function exportScoresCsv(eventId: string, anonymize = true): Promise<Blob> {
  const response = await apiClient.get(`/Scores/export/${eventId}`, {
    params: { anonymize },
    responseType: "blob",
  });
  const contentType = response.headers["content-type"] as string | undefined;
  if (contentType?.includes("application/json")) {
    const text = await (response.data as Blob).text();
    const parsed = JSON.parse(text) as { message?: string };
    throw new Error(parsed.message || "Xuất CSV thất bại.");
  }
  return response.data as Blob;
}

export function useExportScoresCsv() {
  return useMutation({
    mutationFn: (payload: { eventId: string; anonymize?: boolean }) =>
      exportScoresCsv(payload.eventId, payload.anonymize ?? true),
  });
}

export interface CreateScorePayload {
  eventRoleId: string;
  submitResultId: string;
  comment?: string;
}

export interface ScoreCreated {
  id: string;
  eventRoleId: string;
  submitResultId: string;
  /** Khởi tạo = 0, tự tính lại khi thêm ScoreDetail — không set tay từ FE. */
  totalScore: number;
  comment?: string | null;
  createdTime: string;
}

export function useCreateScore() {
  return useMutation({
    mutationFn: async (payload: CreateScorePayload) => {
      const { data } = await apiClient.post<ScoreCreated>("/Scores", payload);
      return data;
    },
  });
}

export interface SaveScoreDetailItem {
  templateId: string;
  criteriaId: string;
  value: number;
}

/**
 * POST /Scores/save — API GỘP: tạo mới hoặc cập nhật 1 phiếu chấm kèm TOÀN BỘ điểm
 * chi tiết trong 1 lần gọi. Khoá định danh phiếu = (eventRoleId, submitResultId).
 * `details` là nguồn chuẩn: tiêu chí có trong list → tạo/cập nhật, tiêu chí cũ không
 * còn trong list → BE tự xoá. Dùng hook này thay vì tự gọi createScore + nhiều
 * createScoreDetail rời — tránh race và đúng 1 lần round-trip.
 */
export interface SaveScorePayload {
  eventRoleId: string;
  submitResultId: string;
  comment?: string;
  /** true = giám khảo chốt phiếu (không sửa được nữa qua flow thường). */
  isSubmitted?: boolean;
  details: SaveScoreDetailItem[];
}

export interface SaveScoreDetailResultItem {
  id: string;
  templateId: string;
  criteriaId: string;
  value: number;
}

export interface ScoreSaved {
  id: string;
  eventRoleId: string;
  submitResultId: string;
  totalScore: number;
  comment?: string | null;
  isSubmitted: boolean;
  isNew: boolean;
  details: SaveScoreDetailResultItem[];
  createdTime: string;
  lastUpdatedTime: string;
}

export function useSaveScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SaveScorePayload) => {
      const { data } = await apiClient.post<ScoreSaved>("/Scores/save", payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["scoreDetail", data.id] });
      queryClient.invalidateQueries({ queryKey: ["trackCalibration"] });
    },
  });
}

export interface UpdateScorePayload {
  eventRoleId: string;
  submitResultId: string;
  comment?: string;
}

export interface ScoreUpdated {
  id: string;
  eventRoleId: string;
  submitResultId: string;
  /** Không sửa được trực tiếp — luôn tự tính lại từ ScoreDetail. */
  totalScore: number;
  comment?: string | null;
  lastUpdatedTime: string;
}

export function useUpdateScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateScorePayload }) => {
      const { data } = await apiClient.put<ScoreUpdated>(`/Scores/${id}`, payload);
      return data;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["score", id] });
      queryClient.invalidateQueries({ queryKey: ["scoreDetail", id] });
    },
  });
}

/** DELETE /Scores/{id} — cascade xoá toàn bộ ScoreDetail liên quan. */
export function useDeleteScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<boolean>(`/Scores/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scores"] });
    },
  });
}

export interface Score {
  id: string;
  eventRoleId: string;
  submitResultId: string;
  totalScore: number;
  comment?: string | null;
  isSubmitted: boolean;
  createdTime: string;
  lastUpdatedTime: string;
}

export function useGetScoreById(id: string | undefined) {
  return useQuery({
    queryKey: ["score", id],
    queryFn: async () => {
      const { data } = await apiClient.get<Score>(`/Scores/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export interface ScoreDetailLine {
  id: string;
  templateId: string;
  criteriaId: string;
  value: number;
  createdTime: string;
  lastUpdatedTime: string;
}

export interface ScoreWithDetails {
  id: string;
  eventRoleId: string;
  submitResultId: string;
  totalScore: number;
  comment?: string | null;
  isSubmitted: boolean;
  details: ScoreDetailLine[];
  createdTime: string;
  lastUpdatedTime: string;
}

/** GET /Scores/{id}/detail — API GỘP: phiếu chấm + toàn bộ điểm chi tiết trong 1 lần gọi. */
export function useGetScoreDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["scoreDetail", id],
    queryFn: async () => {
      const { data } = await apiClient.get<ScoreWithDetails>(`/Scores/${id}/detail`);
      return data;
    },
    enabled: !!id,
  });
}

export interface GetScoresByEventRoleParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isAscending?: boolean;
}

/** GET /Scores/event-role/{eventRoleId} — danh sách phiếu chấm của 1 giám khảo. */
export function useGetScoresByEventRole(
  eventRoleId: string | undefined,
  params: GetScoresByEventRoleParams = {},
) {
  return useQuery({
    queryKey: ["scoresByEventRole", eventRoleId, params],
    queryFn: async () => {
      const { data } = await apiClient.get<PagedResult<Score>>(
        `/Scores/event-role/${eventRoleId}`,
        { params },
      );
      return data;
    },
    enabled: !!eventRoleId,
  });
}
