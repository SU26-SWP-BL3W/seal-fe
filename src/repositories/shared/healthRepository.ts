import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5180/api";

export interface HealthStatus {
  status: string;
}

let cached: { data: HealthStatus; expiresAt: number } | null = null;
const CACHE_MS = 5_000;

export async function getBackendHealth(): Promise<HealthStatus> {
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }
  const { data } = await axios.get<HealthStatus>(
    `${API_URL.replace(/\/api$/, "")}/health`,
  );
  cached = { data, expiresAt: Date.now() + CACHE_MS };
  return data;
}
