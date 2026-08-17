import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";

export interface LeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  trackName: string;
  totalScore: number;
  isPublished: boolean;
  scoresByCriteria?: Record<string, number>;
}

export interface FinalResultDTO {
  ResultId: string;
  RoundId: string;
  TeamId: string;
  TeamName: string;
  TrackName: string;
  TotalScore: number;
  Rank: number;
  IsPublished: boolean;
}

export function useLeaderboard(roundId: string) {
  return useQuery({
    queryKey: ["leaderboard", roundId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<LeaderboardEntry[]>(`/FinalResults/round/${roundId}`);
        return res.data;
      } catch (err: any) {
        console.warn("[SEAL BE-DATA MISSING] GET /api/FinalResults/round/" + roundId + " error:", err?.message);
        return [];
      }
    },
    enabled: !!roundId,
  });
}

export function useCalculateResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roundId: string) => {
      const res = await apiClient.post(`/FinalResults/calculate/${roundId}`);
      return res.data;
    },
    onSuccess: (_, roundId) => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard", roundId] });
    },
  });
}

export function usePublishResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roundId: string) => {
      const res = await apiClient.post(`/FinalResults/publish/${roundId}`);
      return res.data;
    },
    onSuccess: (_, roundId) => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard", roundId] });
    },
  });
}
