export type RoleInvitationStatus = "Active" | "Pending" | "Declined" | "Revoked" | "Expired";

export interface RoleInvitationRecord {
  id: string;
  eventId: string;
  eventName?: string;
  email: string;
  fullName: string;
  roleName: "EventCoordinator" | "Judge" | "Mentor" | "TeamLeader" | "TeamMember" | string;
  trackId?: string;
  trackName?: string;
  invitedAt: string;
  respondedAt?: string;
  status: RoleInvitationStatus;
  statusLabel: string;
  invitedBy?: string;
  notes?: string;
}

const STORAGE_PREFIX = "seal_role_invitation_history_";

export const invitationHistoryService = {
  getHistory(eventId: string): RoleInvitationRecord[] {
    if (typeof window === "undefined" || !eventId) return [];
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${eventId}`);
      if (!raw) return [];
      return JSON.parse(raw) || [];
    } catch {
      return [];
    }
  },

  saveHistory(eventId: string, records: RoleInvitationRecord[]): void {
    if (typeof window === "undefined" || !eventId) return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${eventId}`, JSON.stringify(records));
    } catch (e) {
      console.warn("Could not save invitation history to localStorage", e);
    }
  },

  addInvitation(record: Omit<RoleInvitationRecord, "id" | "invitedAt" | "status" | "statusLabel"> & {
    id?: string;
    status?: RoleInvitationStatus;
  }): RoleInvitationRecord {
    const list = this.getHistory(record.eventId);
    const now = new Date().toISOString();
    const status: RoleInvitationStatus = record.status || "Pending";
    
    // Check if existing invitation for same email & role in this event
    const existingIndex = list.findIndex(
      (item) =>
        item.email.toLowerCase() === record.email.toLowerCase() &&
        item.roleName === record.roleName &&
        (record.trackId ? item.trackId === record.trackId : true)
    );

    const newRecord: RoleInvitationRecord = {
      id: record.id || `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      eventId: record.eventId,
      eventName: record.eventName,
      email: record.email.trim(),
      fullName: record.fullName.trim() || record.email.split("@")[0],
      roleName: record.roleName,
      trackId: record.trackId,
      trackName: record.trackName,
      invitedAt: now,
      status,
      statusLabel: getStatusLabel(status),
      invitedBy: record.invitedBy,
      notes: record.notes,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = {
        ...list[existingIndex],
        ...newRecord,
        invitedAt: now,
        status,
        statusLabel: getStatusLabel(status),
      };
    } else {
      list.unshift(newRecord);
    }

    this.saveHistory(record.eventId, list);
    return newRecord;
  },

  updateStatus(eventId: string, invitationId: string, status: RoleInvitationStatus): void {
    const list = this.getHistory(eventId);
    const index = list.findIndex((item) => item.id === invitationId);
    if (index >= 0) {
      list[index].status = status;
      list[index].statusLabel = getStatusLabel(status);
      list[index].respondedAt = new Date().toISOString();
      this.saveHistory(eventId, list);
    }
  },

  removeInvitation(eventId: string, invitationId: string): void {
    const list = this.getHistory(eventId);
    const updated = list.filter((item) => item.id !== invitationId);
    this.saveHistory(eventId, updated);
  },

  /**
   * Đồng bộ lịch sử với danh sách EventRole chính thức từ Server.
   * Nếu email đã có trong EventRoles thì đánh dấu là Active (Đã tham gia).
   */
  syncWithEventRoles(eventId: string, activeRoles: any[]): RoleInvitationRecord[] {
    const list = this.getHistory(eventId);
    let changed = false;

    // Check existing records against active roles
    for (const record of list) {
      const isAssigned = activeRoles.some((ar: any) => {
        const uEmail = (ar.user?.email || ar.User?.Email || ar.email || "").toLowerCase();
        const role = ar.roleName || ar.RoleName;
        const trackId = ar.trackId || ar.TrackId;
        const matchEmail = uEmail === record.email.toLowerCase();
        const matchRole =
          role === record.roleName ||
          (record.roleName === "EventCoordinator" && (role === "EventCoordinator" || role === 0));
        const matchTrack = record.trackId ? trackId === record.trackId : true;
        return matchEmail && matchRole && matchTrack;
      });

      if (isAssigned && record.status !== "Active") {
        record.status = "Active";
        record.statusLabel = getStatusLabel("Active");
        changed = true;
      }
    }

    // Also auto-add any active roles not in history yet
    for (const ar of activeRoles) {
      const uEmail = (ar.user?.email || ar.User?.Email || ar.email || "").toLowerCase();
      if (!uEmail) continue;
      const uName = ar.user?.fullName || ar.User?.FullName || ar.fullName || ar.userName || uEmail.split("@")[0];
      const role = ar.roleName || ar.RoleName || "EventCoordinator";
      const trackId = ar.trackId || ar.TrackId;
      const trackName = ar.track?.trackName || ar.Track?.TrackName;

      const exists = list.some(
        (item) => item.email.toLowerCase() === uEmail && item.roleName === role && (trackId ? item.trackId === trackId : true)
      );

      if (!exists) {
        list.push({
          id: ar.id || ar.Id || `role-inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          eventId,
          email: uEmail,
          fullName: uName,
          roleName: role,
          trackId,
          trackName,
          invitedAt: ar.assignedAt || ar.createdTime || new Date().toISOString(),
          status: "Active",
          statusLabel: getStatusLabel("Active"),
        });
        changed = true;
      }
    }

    if (changed) {
      this.saveHistory(eventId, list);
    }
    return list;
  },
};

function getStatusLabel(status: RoleInvitationStatus): string {
  switch (status) {
    case "Active":
      return "Đã kích hoạt / Tham gia";
    case "Pending":
      return "Đang chờ phản hồi";
    case "Declined":
      return "Đã từ chối";
    case "Revoked":
      return "Đã thu hồi";
    case "Expired":
      return "Đã hết hạn";
    default:
      return "Đang chờ";
  }
}
