import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { PagedResult } from "@/models/types";
import type { User } from "@/models/entities";

// Field/route đối chiếu trực tiếp TracksController.cs + Features/Tracks/**/Models.

export interface CreateTrackPayload {
  eventId: string;
  trackName: string;
  templateId?: string;
  description?: string;
  submissionRuleDescription?: string;
  startDate?: string;
  endDate?: string;
  scoringStartDate?: string;
  scoringEndDate?: string;
}

export interface TrackCreated {
  id: string;
  eventId: string;
  trackName: string;
  templateId?: string | null;
  description?: string | null;
  submissionRuleDescription?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  scoringStartDate?: string | null;
  scoringEndDate?: string | null;
  createdTime: string;
}

export function useCreateTrack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTrackPayload) => {
      const { data } = await apiClient.post<TrackCreated>("/Tracks", payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tracksByEvent", data.eventId] });
    },
  });
}

export interface UpdateTrackPayload {
  eventId: string;
  trackName: string;
  templateId?: string;
  description?: string;
  submissionRuleDescription?: string;
  startDate?: string;
  endDate?: string;
  scoringStartDate?: string;
  scoringEndDate?: string;
}

export interface TrackUpdated {
  id: string;
  eventId: string;
  trackName: string;
  templateId?: string | null;
  description?: string | null;
  submissionRuleDescription?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  scoringStartDate?: string | null;
  scoringEndDate?: string | null;
  lastUpdatedTime: string;
}

export function useUpdateTrack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateTrackPayload }) => {
      const { data } = await apiClient.put<TrackUpdated>(`/Tracks/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tracksByEvent", data.eventId] });
      queryClient.invalidateQueries({ queryKey: ["track", data.id] });
    },
  });
}

export function useDeleteTrack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<boolean>(`/Tracks/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracksByEvent"] });
    },
  });
}

/**
 * PATCH /Tracks/{id}/assign-template — gán template DÙNG CHUNG cho track. BE hiện CHƯA
 * clone tiêu chí riêng cho sự kiện (đã bàn trong buổi audit) — sửa template gốc sau này
 * sẽ ảnh hưởng ngược tới track đã gán. FE hiển thị cảnh báo này cho EC trước khi gán.
 */
export function useAssignTemplateToTrack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, templateId }: { id: string; templateId: string }) => {
      const { data } = await apiClient.patch<boolean>(`/Tracks/${id}/assign-template`, {
        templateId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracksByEvent"] });
      queryClient.invalidateQueries({ queryKey: ["track"] });
    },
  });
}

export interface Track {
  id: string;
  Id?: string;
  eventId: string;
  EventId?: string;
  trackName: string;
  TrackName?: string;
  templateId?: string | null;
  TemplateId?: string | null;
  description?: string | null;
  Description?: string | null;
  submissionRuleDescription?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  scoringStartDate?: string | null;
  scoringEndDate?: string | null;
  judges?: User[] | null;
  Judges?: User[] | null;
  mentors?: User[] | null;
  Mentors?: User[] | null;
  createdTime: string;
  lastUpdatedTime: string;
}

export function useGetTrackById(id: string | undefined) {
  return useQuery({
    queryKey: ["track", id],
    queryFn: async () => {
      const { data } = await apiClient.get<Track>(`/Tracks/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export interface GetTracksByEventParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isAscending?: boolean;
}

/** GET /Tracks/event?eventId=... — LƯU Ý: eventId là query param, KHÔNG phải route param (giống Rounds). */
export function useGetTracksByEvent(eventId: string | undefined, params: GetTracksByEventParams = {}) {
  return useQuery({
    queryKey: ["tracksByEvent", eventId, params],
    queryFn: async (): Promise<TrackWithStaffModel[]> => {
      const res = await apiClient.get<any>("/Tracks/event", {
        params: { eventId, EventId: eventId, ...params, PageSize: 100 },
      });
      const items = res.data?.data?.items ?? res.data?.items ?? res.data?.data ?? res.data ?? [];
      return Array.isArray(items) ? items : [];
    },
    enabled: !!eventId,
  });
}

export interface TrackWithStaffModel extends Track {
  Mentors?: any[];
  Judges?: any[];
  TrackName?: string;
  Description?: string;
  Id?: string;
}

export const tracksRepository = {
  async createTrack(payload: CreateTrackPayload): Promise<TrackCreated> {
    const res = await apiClient.post<TrackCreated>("/Tracks", payload);
    return res.data;
  },
  async updateTrack(id: string, payload: UpdateTrackPayload): Promise<TrackUpdated> {
    const res = await apiClient.put<TrackUpdated>(`/Tracks/${id}`, payload);
    return res.data;
  },
  async deleteTrack(id: string): Promise<boolean> {
    const res = await apiClient.delete<boolean>(`/Tracks/${id}`);
    return res.data;
  },
  async assignTemplate(trackId: string, templateId: string): Promise<boolean> {
    const res = await apiClient.patch<boolean>(`/Tracks/${trackId}/assign-template`, { templateId });
    return res.data;
  },
  async assignTemplateToTrack(trackId: string, templateId: string): Promise<boolean> {
    const res = await apiClient.patch<boolean>(`/Tracks/${trackId}/assign-template`, { templateId });
    return res.data;
  },
  async getTracksByEvent(eventId: string): Promise<Track[]> {
    const res = await apiClient.get<PagedResult<Track>>("/Tracks/event", {
      params: { EventId: eventId, PageSize: 100 },
    });
    return res.data?.data ?? [];
  },
};


