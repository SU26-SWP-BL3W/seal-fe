import { User, EventRole } from "@/models/entities";
import {
  hasEventRole,
  hasTrackRole,
  idsMatch,
  normalizeEventRoleRows,
  type NormalizedEventRole,
} from "@/lib/eventRoles";

// EventRole/User khai cả 2 kiểu case (roleName/RoleName...) để "tương thích" —
// dùng 1 hàm đọc duy nhất ở đây thay vì mỗi nơi tự viết lại `a.X || a.x` +
// `as any` (từng có ở permissions.ts lẫn RoleGuard.tsx, dễ lệch nhau).
export function getRoleName(role: EventRole | null): string | undefined {
  return role?.roleName ?? role?.RoleName;
}

function getAssignedEventIds(role: EventRole | null): string[] {
  return role?.assignedEventIds ?? role?.AssignedEventIds ?? [];
}

export function hasEventRolePermission(
  user: User | null,
  eventRoles: NormalizedEventRole[] | unknown[],
  eventId: string,
  requiredRoleName?: string,
): boolean {
  if (!user) return false;
  if (user.isAdmin || user.IsAdmin) return true;
  if (!eventId) return false;

  const normalized = normalizeEventRoleRows(
    Array.isArray(eventRoles) ? eventRoles : [],
  );

  return hasEventRole(normalized, eventId, requiredRoleName);
}

export function hasTrackRolePermission(
  user: User | null,
  eventRoles: NormalizedEventRole[] | unknown[],
  trackId: string,
  requiredRoleName?: string,
): boolean {
  if (!user) return false;
  if (user.isAdmin || user.IsAdmin) return true;
  if (!trackId) return false;

  const normalized = normalizeEventRoleRows(Array.isArray(eventRoles) ? eventRoles : []);
  return hasTrackRole(normalized, trackId, requiredRoleName);
}

/**
 * Kiểm tra xem người dùng hiện tại có quyền Thao tác (Mutation / Control) trên Sự kiện chỉ định hay không.
 * - Admin: Toàn quyền trên MỌI Sự kiện (Return true).
 * - Event Coordinator / Mentor / Judge: CHỈ ĐƯỢC THAO TÁC trên các Sự kiện mà họ được phân công / mời vào.
 * - Nếu không được phân công ➔ Trả về false (Chỉ cho phép XEM - Read-Only).
 *
 * KHÔNG có fallback "coi như được phân công event-seal-2026" — trước đây có,
 * khiến hàm này LUÔN trả true cho mọi role, tức là không thật sự chặn gì cả.
 * Nếu cần phân công event cụ thể, set thẳng assignedEventIds trên AuthProvider.
 */
export function hasEventPermission(
  user: User | null,
  activeRole: EventRole | null,
  eventId: string,
): boolean {
  if (!user) return false;

  // 1. Admin hệ thống có quyền thao tác trên tất cả các sự kiện
  if (user.isAdmin || user.IsAdmin) {
    return true;
  }

  const roleName = getRoleName(activeRole);

  // 2. Nếu là Guest hoặc không có vai trò ➔ Không có quyền quản trị
  if (!roleName || roleName === "Guest") {
    return false;
  }

  // 3. Chỉ cho thao tác trên đúng các Event đã thật sự được gán (staff + đội thi).
  return getAssignedEventIds(activeRole).some((id) => idsMatch(id, eventId));
}
