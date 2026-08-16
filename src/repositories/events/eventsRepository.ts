import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { PagedResult } from "@/models/types";

// Field/route đối chiếu trực tiếp EventsController.cs + Features/Events/**/Models.

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
  /** Tạo kèm Round/Track lồng nhau trong CÙNG 1 lần gọi — không bắt buộc, có thể tạo Round/Track rời sau. */
  rounds?: RoundRequestDto[];
}

interface RoundResponseDto extends Omit<RoundRequestDto, "tracks"> {
  id: string;
  tracks: TrackResponseDto[];
}
interface TrackResponseDto extends TrackRequestDto {
  id: string;
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
  rounds: RoundResponseDto[];
}

/** POST /Events — người tạo tự động thành EventCoordinator của sự kiện này. */
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

/** DELETE /Events/{eventId} — xoá VĨNH VIỄN, không phải soft-delete. */
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

type EventTrackModel = TrackResponseDto;
interface EventRoundModel extends Omit<RoundResponseDto, "tracks"> {
  tracks: EventTrackModel[];
}

export interface Event {
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
  maxTeams: number;
  createdTime: string;
  lastUpdatedTime: string;
  rounds: EventRoundModel[];
  /** Giải thưởng cấp sự kiện (không gắn riêng Track nào). */
  prizes: import("../results/prizesRepository").Prize[];
}

export function useGetEventById(id: string | undefined) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data } = await apiClient.get<Event>(`/Events/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export interface GetAllEventsParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isAscending?: boolean;
  searchName?: string;
  status?: boolean;
}

export function useGetAllEvents(params: GetAllEventsParams = {}) {
  return useQuery({
    queryKey: ["events", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PagedResult<Event>>("/Events", { params });
      return data;
    },
  });
}

export interface GetUpcomingEventsParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isAscending?: boolean;
}

export function useGetUpcomingEvents(params: GetUpcomingEventsParams = {}) {
  return useQuery({
    queryKey: ["upcomingEvents", params],
    queryFn: async () => {
      const { data } = await apiClient.get<PagedResult<Event>>("/Events/upcoming", { params });
      return data;
    },
  });
}

/** GET /Events/my-events — sự kiện người dùng hiện tại đang tham gia (mọi vai trò), kèm vai trò cụ thể. */
export interface MyEvent extends Event {
  role: string;
  teamId?: string | null;
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
