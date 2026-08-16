import { useQuery } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { Event, Round } from "@/models/entities";
import type { EventRoundItem } from "@/viewModels/eventsMetadata";

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

export const eventsRepository = {
  getEvents: async () => {
    const res = await apiClient.get<Event[]>("/Events");
    return res.data;
  },
  getMyEvents: async () => {
    const res = await apiClient.get<MyEventModel[]>("/Events/my-events");
    return res.data;
  },
  getEventById: async (id: string) => {
    const res = await apiClient.get<Event>(`/Events/${id}`);
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
        const res = await apiClient.get<any>("/Events/upcoming", { params: { PageSize: 50 } });
        return res.data?.data?.data || res.data?.data || res.data || [];
      } catch {
        const res = await apiClient.get<any>("/Events");
        return res.data?.data || res.data || [];
      }
    },
  });
}

export interface EventDTO {
  EventId?: string;
  EventName?: string;
  Season?: string;
  Year?: number;
  Tagline?: string;
  Description?: string;
  StartDate?: string;
  EndDate?: string;
  RegistrationStartDate?: string;
  RegistrationEndDate?: string;
  MaxTeams?: number;
  TeamCount?: number;
  TotalPrizeVnd?: number;
  Tracks?: string[];
  id?: string;
  name?: string;
}

// Bản trước ở đây có 1 lớp cache localStorage ("seal_created_events") tự trộn
// event vừa tạo/updateEvent/deleteEvent vào kết quả GET, kể cả khi request that
// that bai — nghia la UI co the hien mot event da bi xoa that tren BE (deleteEvent
// nuot loi roi van xoa khoi cache), hoac hien mot event "ma" chua bao gio ton tai
// tren server. Bo toan bo lop cache gia nay, chi doc/ghi that qua API.

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/Events");
      return (res.data?.data ?? res.data ?? []) as Event[];
    },
  });
}

export function useMyEvents() {
  return useQuery({
    queryKey: ["my-events"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/Events/my-events");
      return (res.data?.data ?? res.data ?? []) as MyEventModel[];
    },
  });
}

export function useEventDetail(eventId: string) {
  return useQuery({
    queryKey: ["event-detail", eventId],
    queryFn: async () => {
      const res = await apiClient.get<Event>(`/Events/${eventId}`);
      return res.data;
    },
    enabled: !!eventId,
  });
}

export function useEventRounds(eventId: string) {
  return useQuery({
    queryKey: ["event-rounds", eventId],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/Rounds/event`, {
        params: { EventId: eventId, PageSize: 100 },
      });
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    },
    enabled: !!eventId,
  });
}

export async function createEvent(data: Partial<Event>): Promise<any> {
  const response = await apiClient.post<any>("/Events", data);
  return response.data;
}

/** DELETE /Events/{id} — xoá vĩnh viễn. Lỗi (vd còn team/track phụ thuộc) phải nổi lên thật, không được nuốt. */
export async function deleteEvent(id: string): Promise<any> {
  await apiClient.delete(`/Events/${id}`);
  return { success: true };
}

export async function updateEvent(id: string, data: Partial<Event>): Promise<any> {
  const response = await apiClient.put<any>(`/Events/${id}`, data);
  return response.data;
}

// ─── Public Prizes Extension ───────────────────────────────────────────────

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

