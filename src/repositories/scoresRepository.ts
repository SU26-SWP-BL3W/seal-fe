import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type {
  SaveScoreRequest,
  Score,
  ScoreBreakdownModel,
  CalibrationModel,
  FinalResult,
} from "@/models/entities";

// ─── POST /api/Scores/save — Giám khảo lưu/chốt điểm ─────────

export function useSaveScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SaveScoreRequest) => {
      const res = await apiClient.post<Score>("/Scores/save", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["judge-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["track-calibration"] });
      queryClient.invalidateQueries({ queryKey: ["team-score-breakdown"] });
    },
  });
}

// ─── GET /api/Scores/team/{teamId}/score-breakdown ────────────

export function useGetTeamScoreBreakdown(teamId?: string) {
  return useQuery({
    queryKey: ["team-score-breakdown", teamId],
    queryFn: async () => {
      const res = await apiClient.get<ScoreBreakdownModel>(`/Scores/team/${teamId}/breakdown`);
      return res.data;
    },
    enabled: !!teamId,
  });
}

// ─── GET /api/Scores/track/{trackId}/calibration ──────────────

export function useGetTrackCalibration(trackId?: string) {
  return useQuery({
    queryKey: ["track-calibration", trackId],
    queryFn: async () => {
      const res = await apiClient.get<CalibrationModel>(`/Scores/track/${trackId}/calibration`);
      return res.data;
    },
    enabled: !!trackId,
  });
}

// ─── POST /api/FinalResults/calculate/{roundId} ───────────────

export function useCalculateRoundResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roundId: string) => {
      const res = await apiClient.post<FinalResult[]>(`/FinalResults/calculate/${roundId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["final-results"] });
      queryClient.invalidateQueries({ queryKey: ["track-calibration"] });
    },
  });
}

// ─── GET /api/Scores/export/{eventId}?anonymize=true ─────────

export function useExportCsvAnonymized() {
  return useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiClient.get(`/Scores/export/${eventId}`, {
        params: { anonymize: true },
        responseType: "blob",
      });
      return res.data;
    },
  });
}
