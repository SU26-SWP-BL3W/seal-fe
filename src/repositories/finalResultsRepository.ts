import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { FinalResult, Prize, BaseResponse } from "@/models/entities";

// ─── GET /api/FinalResults/round/{roundId} ───────────────────

export function useGetFinalResultsByRound(roundId?: string, trackId?: string) {
  return useQuery({
    queryKey: ["final-results", roundId, trackId],
    queryFn: async () => {
      const res = await apiClient.get<BaseResponse<any>>(
        `/FinalResults/round/${roundId}`,
        { params: { trackId: trackId || undefined, pageSize: 200 } }
      );
      const payload = res.data?.data;
      if (Array.isArray(payload)) return payload as FinalResult[];
      return (payload?.data ?? []) as FinalResult[];
    },
    enabled: !!roundId,
  });
}

// ─── PUT /api/FinalResults/round/{roundId}/publish-status ────

export function usePublishRoundResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roundId, isPublished }: { roundId: string; isPublished: boolean }) => {
      const res = await apiClient.put(`/FinalResults/round/${roundId}/publish-status`, {
        isPublished,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["final-results"] });
    },
  });
}

export function usePublishRoundDirectly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roundId: string) => {
      const res = await apiClient.post(`/FinalResults/publish/${roundId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["final-results"] });
    },
  });
}

export function useUnpublishRoundDirectly() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roundId: string) => {
      const res = await apiClient.put(`/FinalResults/round/${roundId}/publish-status`, {
        isPublished: false,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["final-results"] });
    },
  });
}

// ─── PATCH /api/FinalResults/{id}/assign-prize ────────────────

export function useAssignPrize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ resultId, prizeId }: { resultId: string; prizeId: string | null }) => {
      const res = await apiClient.patch(`/FinalResults/${resultId}/assign-prize`, { prizeId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["final-results"] });
    },
  });
}

// ─── GET /api/Events/{eventId}/Prizes ─────────────────────────────────────────

export function useGetPrizes(params?: { eventId?: string; trackId?: string }) {
  return useQuery({
    queryKey: ["prizes", params],
    queryFn: async () => {
      if (!params?.eventId) return [];
      try {
        const res = await apiClient.get<BaseResponse<Prize[]>>(`/Events/${params.eventId}/Prizes`);
        const list = res.data?.data ?? [];
        if (params.trackId) {
          return list.filter((p: any) => p.trackId === params.trackId || p.TrackId === params.trackId);
        }
        return list;
      } catch (err: any) {
        console.warn("[SEAL BE-DATA MISSING] GET /api/Events/" + params.eventId + "/Prizes error:", err?.message);
        return [];
      }
    },
    enabled: !!params?.eventId,
  });
}

// ─── POST /api/Events/{eventId}/Prizes — Tạo Giải thưởng ────────

export function useCreatePrize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      eventId: string;
      trackId?: string;
      prizeName: string;
      rewardAmount: number;
      quantity: number;
      description?: string;
    }) => {
      const { eventId, ...body } = payload;
      const res = await apiClient.post<BaseResponse<Prize>>(`/Events/${eventId}/Prizes`, body);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prizes"] });
    },
  });
}
