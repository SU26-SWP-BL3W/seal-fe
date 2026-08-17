export function readApiError(err: unknown, defaultMsg = "Đã xảy ra lỗi."): string {
  const detail = err as { message?: string; response?: { data?: { message?: string } } };
  return detail?.response?.data?.message || detail?.message || defaultMsg;
}
