export * from "./scoring/scoresRepository";

// ─── Back-compat cho code cũ (feat/mentor-screen) import trực tiếp path phẳng ───
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import { exportScoresCsv } from "./scoring/scoresRepository";

/** Alias back-compat: export CSV ẩn danh trực tiếp bằng eventId (mặc định anonymize=true). */
export function useExportCsvAnonymized() {
  return useMutation({
    mutationFn: (eventId: string) => exportScoresCsv(eventId, true),
  });
}

/**
 * Alias back-compat: gọi calculate round results trực tiếp bằng roundId (string),
 * thay vì {roundId, topN} như bản hiện hành ở results/finalResultsRepository.
 */
export function useCalculateRoundResults(defaultTopN = 10) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (arg: string | { roundId: string; topN?: number }) => {
      const roundId = typeof arg === "string" ? arg : arg.roundId;
      const topN = (typeof arg === "string" ? undefined : arg.topN) ?? defaultTopN;
      const { data } = await apiClient.post(`/FinalResults/calculate/${roundId}`, undefined, {
        params: { topN },
      });
      return data;
    },
    onSuccess: (_data, arg) => {
      const roundId = typeof arg === "string" ? arg : arg.roundId;
      queryClient.invalidateQueries({ queryKey: ["finalResultsByRound", roundId] });
    },
  });
}
