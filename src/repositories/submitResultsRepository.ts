import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { SubmissionItem } from "@/viewModels/teamTypes";
import type { PagedResult } from "@/models/types";

/**
 * SubmitResultListItemModel.cs thật ở BE chỉ có: id/teamId/trackId/
 * submissionUrl/isActive/createdTime — KHÔNG có repoUrl/demoUrl/slideUrl/
 * teamName/displayCode/isGraded riêng biệt (đã kiểm tra trực tiếp DTO backend).
 * Các field dưới đây được giữ optional để không phá interface của các flow khác
 * (Team/Mentor) đang đọc chúng — nhưng thực tế BE không bao giờ trả về, luôn
 * undefined. Code MỚI (Judge scoring) không nên dựa vào các field này.
 */
export interface SubmitResultListItem {
  id?: string;
  Id?: string;
  teamId?: string;
  TeamId?: string;
  trackId?: string;
  TrackId?: string;
  submissionUrl?: string;
  SubmissionUrl?: string;
  repoUrl?: string;
  RepoUrl?: string;
  demoUrl?: string;
  DemoUrl?: string;
  slideUrl?: string;
  SlideUrl?: string;
  teamName?: string;
  TeamName?: string;
  displayCode?: string;
  DisplayCode?: string;
  description?: string;
  Description?: string;
  isActive?: boolean;
  IsActive?: boolean;
  createdTime?: string;
  CreatedTime?: string;
}

export function readApiError(err: unknown): string {
  const e = err as { response?: { data?: { message?: string; data?: unknown } }; message?: string };
  const payload = e.response?.data;
  if (typeof payload?.data === "string" && payload.data.trim()) return payload.data;
  if (payload?.message) return payload.message;
  return e.message || "Thao tác thất bại.";
}

/** Fetcher thuần (không phải hook) — dùng lại được trong useQueries khi cần gọi song song nhiều track. */
export async function fetchSubmitResultsByTrack(trackId: string, eventId: string): Promise<SubmitResultListItem[]> {
  const res = await apiClient.get<PagedResult<SubmitResultListItem>>("/SubmitResults", {
    params: { TrackId: trackId, EventId: eventId, PageSize: 200 },
  });
  return res.data?.data ?? [];
}

/** Danh sách bài nộp theo hạng mục — giám khảo/mentor. Filter EventId bắt buộc với EventRoleAuthorize. */
export function useGetSubmitResultsByTrack(trackId?: string, eventId?: string) {
  return useQuery({
    queryKey: ["submit-results-by-track", trackId, eventId],
    queryFn: () => fetchSubmitResultsByTrack(trackId!, eventId!),
    enabled: !!trackId && !!eventId,
  });
}

export interface SubmitResultRequest {
  TeamId: string;
  TrackId: string;
  RoundId: string;
  SubmissionUrl?: string;
  RepoUrl: string;
  DemoUrl: string;
  SlideUrl: string;
  Description?: string;
}

export function useMySubmissions() {
  return useQuery({
    queryKey: ["my-submissions"],
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<SubmitResultListItem>>("/Teams/my-submissions", {
        params: { PageSize: 100 },
      });
      return res.data?.data ?? [];
    },
  });
}

export const useGetJudgeSubmissions = useGetSubmitResultsByTrack;

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SubmitResultRequest) => {
      const res = await apiClient.post<SubmissionItem>("/SubmitResults", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
    },
  });
}

export function useUpdateSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SubmitResultRequest> }) => {
      const res = await apiClient.put<SubmissionItem>(`/SubmitResults/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
    },
  });
}

export function useDeleteSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/SubmitResults/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
    },
  });
}

// ─── Mentor Feedback Extensions ───────────────────────────────────────────

export interface MentorFeedbackItem {
  id: string;
  submitResultId: string;
  mentorId: string;
  mentorName?: string;
  feedbackContent: string;
  technicalAdvice?: string;
  suggestedScore?: number;
  createdTime: string;
}

export interface CreateMentorFeedbackRequest {
  feedbackContent: string;
  technicalAdvice?: string;
  suggestedScore?: number;
}

export function useMentorFeedbacks(submitResultId?: string) {
  return useQuery({
    queryKey: ["mentor-feedbacks", submitResultId],
    queryFn: async () => {
      if (!submitResultId) return [];
      const res = await apiClient.get<{ data: MentorFeedbackItem[] }>(`/SubmitResults/${submitResultId}/feedbacks`);
      return res.data?.data ?? [];
    },
    enabled: !!submitResultId,
  });
}

export function useCreateMentorFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ submitResultId, data }: { submitResultId: string; data: CreateMentorFeedbackRequest }) => {
      const res = await apiClient.post(`/SubmitResults/${submitResultId}/feedback`, data);
      return res.data;
    },
    onSuccess: (_, { submitResultId }) => {
      queryClient.invalidateQueries({ queryKey: ["mentor-feedbacks", submitResultId] });
      queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
    },
  });
}

export function useDeleteMentorFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ submitResultId, feedbackId }: { submitResultId: string; feedbackId: string }) => {
      const res = await apiClient.delete(`/SubmitResults/feedback/${feedbackId}`);
      return res.data;
    },
    onSuccess: (_, { submitResultId }) => {
      queryClient.invalidateQueries({ queryKey: ["mentor-feedbacks", submitResultId] });
    },
  });
}

