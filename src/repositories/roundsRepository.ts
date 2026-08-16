import apiClient from "@/models/apiClient";
import { RoundEntity } from "@/models/entities";
import { BaseResponse } from "@/models/types";

export interface CreateRoundPayload {
  eventId: string;
  roundName: string;
  roundNumber: number;
  startDate: string;
  endDate: string;
  advancementRule?: string; // "top N", "percent P", "minScore X"
  scoringStartDate?: string;
  scoringEndDate?: string;
  appealStartDate?: string;
  appealEndDate?: string;
}

export const roundsRepository = {
  /**
   * Cấu hình Vòng thi mới (Event Coordinator - POST /api/Rounds)
   */
  async createRound(payload: CreateRoundPayload): Promise<BaseResponse<RoundEntity>> {
    const res = await apiClient.post<BaseResponse<RoundEntity>>("/Rounds", payload);
    return res.data;
  },

  /**
   * Cập nhật Vòng thi (PUT /api/Rounds/{id})
   */
  async updateRound(id: string, payload: Partial<CreateRoundPayload>): Promise<BaseResponse<RoundEntity>> {
    const res = await apiClient.put<BaseResponse<RoundEntity>>(`/Rounds/${id}`, payload);
    return res.data;
  },

  /**
   * Xóa Vòng thi (DELETE /api/Rounds/{id})
   */
  async deleteRound(id: string): Promise<BaseResponse<boolean>> {
    const res = await apiClient.delete<BaseResponse<boolean>>(`/Rounds/${id}`);
    return res.data;
  },

  /**
   * Lấy danh sách Vòng thi theo EventId (GET /api/Rounds/event?EventId=)
   */
  async getRoundsByEventId(eventId: string): Promise<BaseResponse<RoundEntity[]>> {
    const res = await apiClient.get<BaseResponse<RoundEntity[]>>("/Rounds/event", {
      params: { EventId: eventId },
    });
    return res.data;
  },
};
