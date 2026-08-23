"use client";

import { useQuery } from "@tanstack/react-query";
import { getBackendHealth } from "@/repositories/healthRepository";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5180/api";

// ViewModel — chứa state/logic màn hình, View chỉ đọc data ra render.
// Luôn gọi qua Repository, không gọi thẳng Service (axios/apiClient).
export function useBackendHealthViewModel() {
  const query = useQuery({
    queryKey: ["scaffold-health"],
    queryFn: getBackendHealth,
    retry: 1,
  });

  return {
    apiUrl: API_URL,
    status: query.data?.status ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
