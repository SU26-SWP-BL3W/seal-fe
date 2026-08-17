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

function unwrapEventsList(resData: any): any[] {
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData?.data?.data)) return resData.data.data;
  if (Array.isArray(resData?.data?.items)) return resData.data.items;
  if (Array.isArray(resData?.data)) return resData.data;
  if (Array.isArray(resData?.items)) return resData.items;
  return [];
}

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
        return unwrapEventsList(res.data) as Event[];
      } catch (err) {
        console.error("Error fetching events from API:", err);
        return [] as Event[];
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
        if (list.length > 0) return list as MyEventModel[];
      } catch {
        // Fallback to all events if user does not have private events endpoint
      }

      try {
        const allRes = await apiClient.get<any>("/Events", { params: { PageSize: 100 } });
        return unwrapEventsList(allRes.data) as MyEventModel[];
      } catch (err) {
        console.error("Error fetching my events from API:", err);
        return [] as MyEventModel[];
      }
    },
  });
}

export function useEventDetail(eventId: string) {
  return useQuery({
    queryKey: ["event-detail", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      try {
        const res = await apiClient.get<any>(`/Events/${eventId}`);
        return (res.data?.data ?? res.data ?? null) as Event | null;
      } catch (err) {
        console.error("Error fetching event detail for ID:", eventId, err);
        return null;
      }
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
  const response = await apiClient.delete<any>(`/Events/${id}`);
  return response.data ?? { success: true };
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

