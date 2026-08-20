import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { Event as EntityEvent, Round } from "@/models/entities";
import type { PagedResult } from "@/models/types";

export interface MyEventModel {
  id?: string;
  Id?: string;
  eventId?: string;
  EventId?: string;
  eventName?: string;
  EventName?: string;
  season?: string;
  Season?: string;
  year?: number;
  Year?: number;
  startDate?: string;
  StartDate?: string;
  endDate?: string;
  EndDate?: string;
  registrationStartDate?: string;
  RegistrationStartDate?: string;
  registrationEndDate?: string;
  RegistrationEndDate?: string;
  maxTeams?: number;
  MaxTeams?: number;
  teamCount?: number;
  TeamCount?: number;
  description?: string;
  Description?: string;
  status?: boolean;
  Status?: boolean;
  rounds?: Round[];
}

export interface RoundRequestDto {
  roundName: string;
  roundNumber: number;
  startDate: string;
  endDate: string;
  advancementRule?: string;
  scoringStartDate?: string;
  scoringEndDate?: string;
  tracks: TrackRequestDto[];
}

export interface TrackRequestDto {
  trackName: string;
  description?: string;
  templateId?: string;
  submissionRuleDescription?: string;
  startDate?: string;
  endDate?: string;
  scoringStartDate?: string;
  scoringEndDate?: string;
}

export interface CreateEventPayload {
  eventName: string;
  season?: string;
  year: number;
  startDate: string;
  endDate: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  description?: string;
  status?: boolean;
  photoEventUrl?: string;
  maxTeams: number;
  rounds?: RoundRequestDto[];
}

export interface UpdateEventPayload {
  eventName: string;
  season?: string;
  year: number;
  startDate: string;
  endDate: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  description?: string;
  status: boolean;
  photoEventUrl?: string;
  maxTeams: number;
}

export interface EventCreated {
  id: string;
  eventName: string;
  season?: string | null;
  year: number;
  startDate: string;
  endDate: string;
  registrationStartDate?: string | null;
  registrationEndDate?: string | null;
  description?: string | null;
  status: boolean;
  photoEventUrl?: string | null;
  createdTime: string;
  rounds: any[];
}

export interface EventUpdated {
  id: string;
  eventName: string;
  season?: string | null;
  year: number;
  startDate: string;
  endDate: string;
  registrationStartDate?: string | null;
  registrationEndDate?: string | null;
  description?: string | null;
  status: boolean;
  photoEventUrl?: string | null;
  lastUpdatedTime: string;
}

export interface MyEvent extends EntityEvent {
  role?: string;
  teamId?: string | null;
}

function unwrapEventsList(resData: any): any[] {
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData?.data?.data)) return resData.data.data;
  if (Array.isArray(resData?.data?.items)) return resData.data.items;
  if (Array.isArray(resData?.data)) return resData.data;
  if (Array.isArray(resData?.items)) return resData.items;
  return [];
}

export const eventsRepository = {
  getEvents: async () => {
    const res = await apiClient.get<EntityEvent[]>("/Events");
    return res.data;
  },
  getMyEvents: async () => {
    const res = await apiClient.get<MyEventModel[]>("/Events/my-events");
    return res.data;
  },
  getEventById: async (id: string) => {
    const res = await apiClient.get<EntityEvent>(`/Events/${id}`);
    return res.data;
  },
  createEvent,
  updateEvent,
  deleteEvent,
};

export function usePublicEvents() {
  return useQuery({
    queryKey: ["public-events"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>("/Events", { params: { PageSize: 100 } });
        return unwrapEventsList(res.data);
      } catch (err) {
        console.error("Error fetching public events from API:", err);
        return [];
      }
    },
  });
}

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>("/Events", { params: { PageSize: 100 } });
        return unwrapEventsList(res.data) as EntityEvent[];
      } catch (err) {
        console.error("Error fetching events from API:", err);
        return [] as EntityEvent[];
      }
    },
  });
}

export function useMyEvents() {
  return useQuery({
    queryKey: ["my-events"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>("/Events/my-events");
        const list = unwrapEventsList(res.data);
        return list as MyEventModel[];
      } catch (err: any) {
        console.warn("Error fetching my events from /Events/my-events:", err?.message || err);
        return [] as MyEventModel[];
      }
    },
  });
}

export function useEventDetail(eventId: string) {
  const isValidId = Boolean(
    eventId &&
    eventId !== "new" &&
    eventId !== "undefined" &&
    !eventId.startsWith("ev-draft-") &&
    !eventId.startsWith("tmp-")
  );

  return useQuery({
    queryKey: ["event-detail", eventId],
    queryFn: async () => {
      if (!isValidId) return null;
      try {
        const res = await apiClient.get<any>(`/Events/${eventId}`);
        return (res.data?.data ?? res.data ?? null) as EntityEvent | null;
      } catch (err: any) {
        if (err?.name !== "CanceledError" && !err?.message?.includes("canceled")) {
          console.warn("Could not fetch event detail for ID:", eventId, err?.message || err);
        }
        return null;
      }
    },
    enabled: isValidId,
  });
}

export function useEventRounds(eventId?: string) {
  const isValidId = Boolean(
    eventId &&
    eventId !== "new" &&
    eventId !== "undefined" &&
    !eventId.startsWith("ev-draft-") &&
    !eventId.startsWith("tmp-")
  );

  return useQuery({
    queryKey: ["event-rounds", eventId],
    queryFn: async () => {
      if (!isValidId) return [];
      try {
        const res = await apiClient.get<any>(`/Rounds/event`, {
          params: { EventId: eventId, PageSize: 100 },
        });
        const data = res.data?.data ?? res.data;
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    enabled: isValidId,
  });
}

export function useGetEventById(id: string | undefined) {
  const isValidId = Boolean(
    id &&
    id !== "new" &&
    id !== "undefined" &&
    !id.startsWith("ev-draft-") &&
    !id.startsWith("tmp-")
  );

  return useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      if (!isValidId) return null;
      try {
        const { data } = await apiClient.get<EntityEvent>(`/Events/${id}`);
        return data;
      } catch {
        return null;
      }
    },
    enabled: isValidId,
  });
}

export function useGetAllEvents(params: any = {}) {
  return useQuery({
    queryKey: ["events", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PagedResult<EntityEvent>>("/Events", { params });
      return data;
    },
  });
}

export function useGetMyEvents() {
  return useQuery({
    queryKey: ["myEvents"],
    queryFn: async () => {
      const { data } = await apiClient.get<MyEvent[]>("/Events/my-events");
      return data;
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateEventPayload) => {
      const { data } = await apiClient.post<EventCreated>("/Events", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myEvents"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, payload }: { eventId: string; payload: UpdateEventPayload }) => {
      const { data } = await apiClient.put<EventUpdated>(`/Events/${eventId}`, payload);
      return data;
    },
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["myEvents"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data } = await apiClient.delete<boolean>(`/Events/${eventId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myEvents"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export async function createEvent(data: Partial<EntityEvent>): Promise<any> {
  const response = await apiClient.post<any>("/Events", data);
  return response.data;
}

export async function deleteEvent(id: string): Promise<any> {
  try {
    const response = await apiClient.delete<any>(`/Events/${id}`);
    return response.data ?? { success: true };
  } catch (err: any) {
    try {
      const response = await apiClient.put<any>(`/Events/${id}`, { status: false });
      return response.data ?? { success: true };
    } catch {
      throw err;
    }
  }
}

export async function updateEvent(id: string, data: Partial<EntityEvent>): Promise<any> {
  try {
    const response = await apiClient.put<any>(`/Events/${id}`, data);
    return response.data;
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 401) {
      return {
        success: false,
        message: "Phiên làm việc hết hạn. Vui lòng đăng nhập lại!",
      };
    }
    return {
      success: false,
      message: err?.response?.data?.message || err?.message || "Cập nhật sự kiện thất bại.",
    };
  }
}

export interface PublicPrizeItem {
  id?: string;
  eventId?: string;
  name?: string;
  description?: string;
  rewardValueVnd?: number;
  quantity?: number;
  trackId?: string;
}

export function usePublicPrizes(eventId?: string) {
  return useQuery({
    queryKey: ["public-prizes", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      try {
        const res = await apiClient.get<any>(`/Prizes/public/event/${eventId}`);
        return res.data?.data || res.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!eventId,
  });
}
