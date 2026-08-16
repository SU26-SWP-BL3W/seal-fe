import { useQuery } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import { TrackEntity } from "@/models/entities";
import { BaseResponse, PagedResult } from "@/models/types";

export interface TrackStaffModel {
  id?: string;
  Id?: string;
  fullName?: string;
  FullName?: string;
  email?: string;
  Email?: string;
}

export interface TrackWithStaffModel {
  id?: string;
  Id?: string;
  eventId?: string;
  EventId?: string;
  roundId?: string;
  RoundId?: string;
  templateId?: string;
  TemplateId?: string;
  trackName?: string;
  TrackName?: string;
  description?: string;
  Description?: string;
  judges?: TrackStaffModel[];
  Judges?: TrackStaffModel[];
  mentors?: TrackStaffModel[];
  Mentors?: TrackStaffModel[];
}

/**
 * Danh sách Hạng mục theo sự kiện (GET /api/Tracks/event) — mỗi Track kèm
 * sẵn danh sách Judges/Mentors được phân công, dùng để suy ra "hạng mục của tôi".
 */
export function useGetTracksByEvent(eventId?: string) {
  return useQuery({
    queryKey: ["tracks-by-event", eventId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<PagedResult<TrackWithStaffModel>>(
          "/Tracks/event",
          { params: { EventId: eventId, PageSize: 100 } }
        );
        return res.data?.data ?? [];
      } catch (err: any) {
        console.warn("[SEAL BE-DATA MISSING] GET /api/Tracks/event error:", err?.message);
        return [];
      }
    },
    enabled: !!eventId,
  });
}

export interface CreateTrackPayload {
  eventId: string;
  roundId?: string;
  trackName: string;
  templateId?: string;
  description?: string;
  submissionRuleDescription?: string;
  startDate?: string;
  endDate?: string;
  scoringStartDate?: string;
  scoringEndDate?: string;
}

export const tracksRepository = {
  /**
   * Tạo Hạng mục (Track) mới trong sự kiện (Event Coordinator - POST /api/Tracks)
   */
  async createTrack(payload: CreateTrackPayload): Promise<BaseResponse<TrackEntity>> {
    const res = await apiClient.post<BaseResponse<TrackEntity>>("/Tracks", payload);
    return res.data;
  },

  /**
   * Cập nhật Hạng mục (PUT /api/Tracks/{id})
   */
  async updateTrack(id: string, payload: Partial<CreateTrackPayload>): Promise<BaseResponse<TrackEntity>> {
    const res = await apiClient.put<BaseResponse<TrackEntity>>(`/Tracks/${id}`, payload);
    return res.data;
  },

  /**
   * Xóa Hạng mục (DELETE /api/Tracks/{id})
   */
  async deleteTrack(id: string): Promise<BaseResponse<boolean>> {
    const res = await apiClient.delete<BaseResponse<boolean>>(`/Tracks/${id}`);
    return res.data;
  },

  /**
   * Gắn Template tiêu chí vào Track (PATCH /api/Tracks/{id}/assign-template)
   */
  async assignTemplateToTrack(trackId: string, templateId: string): Promise<BaseResponse<boolean>> {
    const res = await apiClient.patch<BaseResponse<boolean>>(`/Tracks/${trackId}/assign-template`, {
      templateId,
    });
    return res.data;
  },
};
