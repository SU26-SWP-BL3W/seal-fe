/**
 * Admin Domain Service
 * Pure business logic for system admin operations, role assignment validation, and user filtering.
 */

export interface SystemUserFilterOptions {
  role?: string;
  isApproved?: boolean;
  schoolId?: string;
  searchQuery?: string;
}

export const adminService = {
  /**
   * Filters user accounts by search query and role.
   */
  filterUsers<T extends { email?: string; fullName?: string; school?: string; studentId?: string }>(
    users: T[],
    options: SystemUserFilterOptions
  ): T[] {
    let list = users || [];

    if (options.searchQuery?.trim()) {
      const q = options.searchQuery.trim().toLowerCase();
      list = list.filter(
        (u) =>
          (u.email || "").toLowerCase().includes(q) ||
          (u.fullName || "").toLowerCase().includes(q) ||
          (u.studentId || "").toLowerCase().includes(q) ||
          (u.school || "").toLowerCase().includes(q)
      );
    }

    return list;
  },

  /**
   * Validates if a user role can be assigned.
   */
  canAssignRole(targetRole: string, actorIsAdmin: boolean): boolean {
    if (!actorIsAdmin) return false;
    const validRoles = ["Admin", "Coordinator", "Judge", "Mentor", "TeamLeader", "TeamMember"];
    return validRoles.includes(targetRole);
  },
};
