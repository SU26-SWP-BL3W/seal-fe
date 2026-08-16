import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5180/api";

export interface HealthStatus {
  status: string;
}

// Repository — nằm giữa ViewModel và Service (models/apiClient hoặc axios trần).
// Trách nhiệm: cache ngắn hạn, retry, chuẩn hoá dữ liệu thô thành domain model.
// ViewModel KHÔNG BAO GIỜ gọi thẳng Service — luôn đi qua Repository của resource đó.
let cached: { data: HealthStatus; expiresAt: number } | null = null;
const CACHE_MS = 5_000;

export async function getBackendHealth(): Promise<HealthStatus> {
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }
  // /health không nằm trong envelope BaseResponse (models/apiClient tự bóc envelope),
  // nên Service ở đây là axios trần thay vì models/apiClient.
  const { data } = await axios.get<HealthStatus>(
    `${API_URL.replace(/\/api$/, "")}/health`,
  );
  cached = { data, expiresAt: Date.now() + CACHE_MS };
  return data;
}
