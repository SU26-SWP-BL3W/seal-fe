// ─── Backend envelope ─────────────────────────────────────────────────────────
// Mọi response từ backend (BaseResponse<T> bên SEAL_Backend) đều bọc theo dạng này.
// Type riêng của từng feature (LoginRequest, TeamDto...) khai báo trong
// `features/<feature>/types/`, không khai báo ở đây.

/** Every backend response is wrapped in this envelope. */
export interface BaseResponse<T> {
  data: T | null;
  message: string;
  statusCode: number;
  success: boolean;
}

export interface PagedResult<T> {
  data: T[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
  /** Field-level validation payload returned by the backend BaseResponse. */
  details?: unknown;
}
