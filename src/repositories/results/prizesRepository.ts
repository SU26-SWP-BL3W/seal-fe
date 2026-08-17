import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";

// Field/route đối chiếu trực tiếp PrizesController.cs + Features/Prizes/**.
// ⚠️ Route ngược: GET/POST gắn vào Events, không phải /Prizes — controller dùng
// `[HttpGet("~/api/Events/{eventId}/Prizes")]` (dấu ~ = override route gốc của
// controller). Chỉ PUT/DELETE mới thật sự nằm dưới /Prizes/{id}.

export interface Prize {
  id: string;
  eventId: string;
  prizeName: string;
  /** Giá trị giải — kiểu string (vd "10,000,000 VNĐ" hoặc mô tả hiện vật), không phải số tiền thuần. */
  value: string;
  quantity: number;
}

const PRIZES_STORAGE_PREFIX = "seal_prizes_";

export function getStoredPrizesForEvent(eventId: string): Prize[] {
  if (typeof window === "undefined" || !eventId) return [];
  try {
    const raw = localStorage.getItem(`${PRIZES_STORAGE_PREFIX}${eventId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredPrizesForEvent(eventId: string, list: any[]) {
  if (typeof window === "undefined" || !eventId) return;
  try {
    localStorage.setItem(`${PRIZES_STORAGE_PREFIX}${eventId}`, JSON.stringify(list));
  } catch {
    // ignore
  }
}

/** GET /Events/{eventId}/Prizes */
export function useGetPrizesByEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ["prizesByEvent", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const localList = getStoredPrizesForEvent(eventId);
      if (localList.length > 0) {
        return localList;
      }

      try {
        const { data } = await apiClient.get<Prize[]>(`/Events/${eventId}/Prizes`);
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      } catch (e) {
        // ignore
      }
      return [];
    },
    enabled: !!eventId,
  });
}

export interface CreatePrizePayload {
  prizeName: string;
  value: string;
  quantity: number;
}

/** POST /Events/{eventId}/Prizes */
export function useCreatePrize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, payload }: { eventId: string; payload: CreatePrizePayload }) => {
      const { data } = await apiClient.post<Prize>(`/Events/${eventId}/Prizes`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["prizesByEvent", data.eventId] });
    },
  });
}

export function useUpdatePrize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: CreatePrizePayload }) => {
      const { data } = await apiClient.put<Prize>(`/Prizes/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["prizesByEvent", data.eventId] });
    },
  });
}

/** DELETE /Prizes/{id} — không tự gỡ FinalResult đang gán giải này, gỡ tay qua useAssignPrize(prizeId: null) trước nếu cần. */
export function useDeletePrize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<boolean>(`/Prizes/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prizesByEvent"] });
    },
  });
}
