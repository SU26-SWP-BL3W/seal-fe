/**
 * Staff & Role Assignment Domain Service
 * Pure business logic for staff email validation, system accounts mapping, and staff filtering.
 */

export interface SystemAccount {
  email: string;
  fullName: string;
}

export const SYSTEM_ACCOUNTS: SystemAccount[] = [
  { email: "ec.co-organizer@fpt.edu.vn", fullName: "Nguyễn Văn Điều Phối (Coordinator)" },
  { email: "judge.ai@fpt.edu.vn", fullName: "TS. Hoàng Văn Giám Khảo (Judge AI)" },
  { email: "tran.phuc.judge@fpt.edu.vn", fullName: "ThS. Trần Phúc (Giám Khảo RBL)" },
  { email: "mentor.tech@fpt.edu.vn", fullName: "Lê Cố Vấn Chuyên Môn (Mentor)" },
  { email: "hoang.nam.mentor@fpt.edu.vn", fullName: "Nguyễn Hoàng Nam (Senior Cloud Architect)" },
  { email: "nguyenvana@fpt.edu.vn", fullName: "Nguyễn Văn A" },
  { email: "tranthib@fpt.edu.vn", fullName: "Trần Thị B" },
  { email: "levanc@fpt.edu.vn", fullName: "Lê Văn C" },
];

export const staffService = {
  /**
   * Checks if an email is a registered system account or belongs to known system users.
   */
  checkEmailInSystem(email: string, systemUsers: any[] = []): boolean {
    if (!email || !email.trim()) return true;
    const cleanEmail = email.trim().toLowerCase();
    const inDefault = SYSTEM_ACCOUNTS.some((acc) => acc.email.toLowerCase() === cleanEmail);
    if (inDefault) return true;
    return systemUsers.some((u: any) => (u.email || u.Email || "").trim().toLowerCase() === cleanEmail);
  },

  /**
   * Filters and searches staff records by query and role.
   */
  filterStaffRecords<T extends { email?: string; fullName?: string; roleName?: string }>(
    records: T[],
    searchQuery: string,
    roleFilter?: string
  ): T[] {
    let result = records || [];

    if (roleFilter && roleFilter !== "all") {
      result = result.filter((r) => r.roleName?.toLowerCase() === roleFilter.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          (r.email || "").toLowerCase().includes(q) ||
          (r.fullName || "").toLowerCase().includes(q)
      );
    }

    return result;
  },
};

export const checkEmailInSystem = staffService.checkEmailInSystem;
export const filterStaffRecords = staffService.filterStaffRecords;
