import { useQuery } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { PagedResult } from "@/models/types";

// Field/route đối chiếu trực tiếp AuditLogsController.cs + Features/AuditLogs/**/Models.
// Nhật ký thao tác nhạy cảm trong sự kiện (loại đội, tính/công bố/hủy kết quả, chốt điểm).
// Quyền: EventCoordinator của chính sự kiện đó.

export interface AuditLogItem {
  id: string;
  eventId?: string | null;
  actorUserId: string;
  actorName?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  summary?: string | null;
  payloadJson?: string | null;
  createdTime: string;
}

export interface GetAuditLogsParams {
  action?: string;
  entityType?: string;
  entityId?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  isAscending?: boolean;
}

/** GET /api/AuditLogs?eventId=... — nhật ký thao tác nhạy cảm trong 1 sự kiện. */
export function useGetAuditLogs(eventId: string | undefined, params: GetAuditLogsParams = {}) {
  return useQuery({
    queryKey: ["auditLogs", eventId, params],
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<AuditLogItem>>("/AuditLogs", {
        params: { eventId, PageSize: 50, ...params },
      });
      const data: any = res.data;
      return (data?.data ?? data?.items ?? []) as AuditLogItem[];
    },
    enabled: !!eventId,
  });
}
