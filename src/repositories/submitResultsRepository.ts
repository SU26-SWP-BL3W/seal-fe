import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { SubmissionItem } from "@/viewModels/teamTypes";
import type { PagedResult } from "@/models/types";

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

/** Danh sách bài nộp theo hạng mục — giám khảo/mentor. Filter EventId bắt buộc với EventRoleAuthorize. */
export function useGetSubmitResultsByTrack(trackId?: string, eventId?: string) {
  return useQuery({
    queryKey: ["submit-results-by-track", trackId, eventId],
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<SubmitResultListItem>>("/SubmitResults", {
        params: { TrackId: trackId, EventId: eventId, PageSize: 200 },
      });
      return res.data?.data ?? [];
    },
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
