import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";

export interface AppealDTO {
  AppealId: string;
  SubmissionId: string;
  TeamId: string;
  TeamName: string;
  Reason: string;
  Status: "Filed" | "Approved" | "Rejected";
  ResponseReason?: string;
  CreatedAt: string;
  RespondedAt?: string;
}

export function useAppeals(teamId?: string) {
  return useQuery({
    queryKey: ["appeals", teamId],
    queryFn: async () => {
      try {
        const url = teamId ? `/Appeals?teamId=${teamId}` : "/Appeals";
        const res = await apiClient.get<AppealDTO[]>(url);
        return res.data;
      } catch {
        return [];
      }
    },
  });
}

export const useGetAppeals = useAppeals;

export function useCreateAppeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { SubmissionId: string; Reason: string }) => {
      const res = await apiClient.post<AppealDTO>("/Appeals", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appeals"] });
    },
  });
}

export function useRespondAppeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ appealId, status, responseReason }: { appealId: string; status: "Approved" | "Rejected"; responseReason: string }) => {
      const res = await apiClient.put(`/Appeals/${appealId}/respond`, { status, responseReason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appeals"] });
    },
  });
}
