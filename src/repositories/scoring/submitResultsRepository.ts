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
    mutationFn: async (payload: any) => {
      const body = {
        teamId: payload.teamId || payload.TeamId,
        trackId: payload.trackId || payload.TrackId,
        roundId: payload.roundId || payload.RoundId,
        submissionUrl: payload.submissionUrl || payload.SubmissionUrl || "",
        repoUrl: payload.repoUrl || payload.RepoUrl || "",
        demoUrl: payload.demoUrl || payload.DemoUrl || "",
        slideUrl: payload.slideUrl || payload.SlideUrl || "",
        description: payload.description || payload.Description || "",
      };
      const { data } = await apiClient.post<SubmitResultCreated>("/SubmitResults", body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submitResults"] });
    },
  });
}

/**
 * PUT /SubmitResults/{id} — mọi field đều optional, không gửi = giữ nguyên giá trị cũ
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
    mutationFn: async (args: any) => {
      const id = args.id || args.submitResultId || args.Id;
      const payload = args.payload || args.data || args;
      const body = {
        submissionUrl: payload.submissionUrl || payload.SubmissionUrl,
        repoUrl: payload.repoUrl || payload.RepoUrl,
        demoUrl: payload.demoUrl || payload.DemoUrl,
        slideUrl: payload.slideUrl || payload.SlideUrl,
        description: payload.description !== undefined ? payload.description : payload.Description,
        isActive: payload.isActive !== undefined ? payload.isActive : payload.IsActive,
      };
      const { data } = await apiClient.put<SubmitResultUpdated>(`/SubmitResults/${id}`, body);
      return data;
    },
    onSuccess: (_data, args: any) => {
      const id = args.id || args.submitResultId || args.Id;
      queryClient.invalidateQueries({ queryKey: ["submitResults"] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ["submitResult", id] });
      }
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
  id?: string;
  Id?: string;
  teamId?: string;
  TeamId?: string;
  trackId?: string;
  TrackId?: string;
  roundId?: string;
  RoundId?: string;
  teamName?: string | null;
  TeamName?: string | null;
  isTeamDisqualified?: boolean;
  IsTeamDisqualified?: boolean;
  displayCode?: string | null;
  submissionUrl?: string;
  SubmissionUrl?: string;
  repoUrl?: string | null;
  RepoUrl?: string | null;
  demoUrl?: string | null;
  DemoUrl?: string | null;
  slideUrl?: string | null;
  SlideUrl?: string | null;
  description?: string | null;
  Description?: string | null;
  isActive?: boolean;
  IsActive?: boolean;
  createdTime?: string;
  CreatedTime?: string;
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
    queryFn: async (): Promise<SubmitResultListItem[]> => {
      const res = await apiClient.get<PagedResult<SubmitResultListItem>>("/SubmitResults", {
        params: filters,
      });
      if (Array.isArray(res.data?.data)) return res.data.data;
      if (Array.isArray(res.data)) return res.data as unknown as SubmitResultListItem[];
      return [];
    },
  });
}

// ─── Aliases & Helpers ────────────────────────────────────────────────────────
export type SubmitResultRequest = CreateSubmitResultPayload;
export const useCreateSubmission = useCreateSubmitResult;
export const useUpdateSubmission = useUpdateSubmitResult;
export { readApiError } from "../shared/errorHelper";

export function useMySubmissions(teamId?: string) {
  return useGetSubmitResults({ teamId });
}

export function useGetSubmitResultsByTrack(trackId?: string, eventId?: string) {
  return useGetSubmitResults({ trackId, eventId });
}

export const useDeleteSubmission = useDeleteSubmitResult;

export interface MentorFeedbackItem {
  id: string;
  submitResultId: string;
  mentorId: string;
  mentorName?: string;
  comment: string;
  createdTime: string;
}

export function useMentorFeedbacks(submitResultId?: string) {
  return useQuery({
    queryKey: ["mentor-feedbacks", submitResultId],
    queryFn: async () => {
      if (!submitResultId) return [];
      try {
        const res = await apiClient.get<any>(`/SubmitResults/${submitResultId}/mentor-feedback`);
        const list = res.data?.data ?? res.data ?? [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    },
    enabled: !!submitResultId,
  });
}

export function useCreateMentorFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: any) => {
      const submitResultId = args.submitResultId;
      const comment = args.comment || args.data?.feedbackContent || args.feedbackContent || JSON.stringify(args.data || {});
      const res = await apiClient.post<any>(`/SubmitResults/${submitResultId}/mentor-feedback`, {
        comment,
        ...(args.data || {}),
      });
      return res.data;
    },
    onSuccess: (_, args: any) => {
      const submitResultId = args.submitResultId;
      queryClient.invalidateQueries({ queryKey: ["mentor-feedbacks", submitResultId] });
    },
  });
}

export function useDeleteMentorFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ feedbackId, submitResultId }: { feedbackId: string; submitResultId?: string }) => {
      const res = await apiClient.delete<any>(`/SubmitResults/mentor-feedback/${feedbackId}`);
      return res.data;
    },
    onSuccess: (_, { submitResultId }) => {
      if (submitResultId) {
        queryClient.invalidateQueries({ queryKey: ["mentor-feedbacks", submitResultId] });
      }
    },
  });
}

export async function fetchSubmitResultsByTrack(trackId: string, eventId?: string): Promise<SubmitResultListItem[]> {
  try {
    const res = await apiClient.get<PagedResult<SubmitResultListItem>>("/SubmitResults", {
      params: { TrackId: trackId, EventId: eventId, PageSize: 100 },
    });
    return res.data?.data ?? [];
  } catch {
    return [];
  }
}

