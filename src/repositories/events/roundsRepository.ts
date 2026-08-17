import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { PagedResult } from "@/models/types";

// Field/route đối chiếu trực tiếp RoundsController.cs + Features/Rounds/**/Models.

export interface CreateRoundPayload {
  eventId: string;
  roundName: string;
  roundNumber: number;
  startDate: string;
  endDate: string;
  advancementRule?: string;
  scoringStartDate?: string;
  scoringEndDate?: string;
  appealStartDate?: string;
  appealEndDate?: string;
}

export interface RoundCreated {
  id: string;
  eventId: string;
  roundName: string;
  roundNumber: number;
  startDate: string;
  endDate: string;
  advancementRule?: string | null;
  scoringStartDate?: string | null;
  scoringEndDate?: string | null;
  createdTime: string;
}

export function useCreateRound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateRoundPayload) => {
      const { data } = await apiClient.post<RoundCreated>("/Rounds", payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["roundsByEvent", data.eventId] });
    },
  });
}

export interface UpdateRoundPayload {
  eventId: string;
  roundName: string;
  roundNumber: number;
  startDate: string;
  endDate: string;
  advancementRule?: string;
  /** Không gửi = mặc định = endDate. */
  scoringStartDate?: string;
  /** Không gửi = không giới hạn. */
  scoringEndDate?: string;
}

export interface RoundUpdated {
  id: string;
  eventId: string;
  roundName: string;
  roundNumber: number;
  startDate: string;
  endDate: string;
  advancementRule?: string | null;
  scoringStartDate?: string | null;
  scoringEndDate?: string | null;
  lastUpdatedTime: string;
}

export function useUpdateRound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateRoundPayload }) => {
      const { data } = await apiClient.put<RoundUpdated>(`/Rounds/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["roundsByEvent", data.eventId] });
      queryClient.invalidateQueries({ queryKey: ["round", data.id] });
    },
  });
}

export function useDeleteRound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<boolean>(`/Rounds/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roundsByEvent"] });
    },
  });
}

export interface Round {
  id: string;
  eventId: string;
  roundName: string;
  roundNumber: number;
  startDate: string;
  endDate: string;
  advancementRule?: string | null;
  scoringStartDate?: string | null;
  scoringEndDate?: string | null;
  createdTime: string;
  lastUpdatedTime: string;
}

export function useGetRoundById(id: string | undefined) {
  return useQuery({
    queryKey: ["round", id],
    queryFn: async () => {
      const { data } = await apiClient.get<Round>(`/Rounds/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export interface GetRoundsByEventParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isAscending?: boolean;
}

/** GET /Rounds/event?eventId=... — LƯU Ý: eventId là query param, KHÔNG phải route param. */
export function useGetRoundsByEvent(eventId: string | undefined, params: GetRoundsByEventParams = {}) {
  return useQuery({
    queryKey: ["roundsByEvent", eventId, params],
    queryFn: async () => {
      const { data } = await apiClient.get<PagedResult<Round>>("/Rounds/event", {
        params: { eventId, ...params },
      });
      return data;
    },
    enabled: !!eventId,
  });
}

export const roundsRepository = {
  async createRound(payload: CreateRoundPayload): Promise<any> {
    const res = await apiClient.post<any>("/Rounds", payload);
    return res.data;
  },
  async updateRound(id: string, payload: Partial<CreateRoundPayload>): Promise<any> {
    const res = await apiClient.put<any>(`/Rounds/${id}`, payload);
    return res.data;
  },
  async deleteRound(id: string): Promise<any> {
    const res = await apiClient.delete<any>(`/Rounds/${id}`);
    return res.data;
  },
  async getRoundsByEventId(eventId: string): Promise<any> {
    const res = await apiClient.get<any>("/Rounds/event", {
      params: { EventId: eventId },
    });
    return res.data;
  },
};
