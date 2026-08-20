import type { EventRole } from "@/models/entities";

export interface NormalizedEventRole {
  id: string;
  eventId: string;
  trackId: string;
  teamId: string;
  roleName: string;
  trackName?: string;
  eventName?: string;
}

const STAFF_ROLE_NAMES = new Set(["EventCoordinator", "Coordinator", "Judge", "Mentor"]);

export function normalizeRoleId(id?: string | null): string {
  return (id || "").replace(/-/g, "").toLowerCase();
}

export function idsMatch(a?: string | null, b?: string | null): boolean {
  const na = normalizeRoleId(a);
  const nb = normalizeRoleId(b);
  return !!na && !!nb && na === nb;
}

function readStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

export function normalizeEventRoleRows(rows: unknown[]): NormalizedEventRole[] {
  const now = Date.now();
  const result: NormalizedEventRole[] = [];

  for (const raw of Array.isArray(rows) ? rows : []) {
    const r = raw as Record<string, unknown>;
    const expiredAtStr = readStr(r, "expiredAt", "ExpiredAt");
    if (expiredAtStr) {
      const expTime = new Date(expiredAtStr).getTime();
      if (!isNaN(expTime) && expTime < now) continue;
    }

    const roleName = readStr(r, "roleName", "RoleName");
    const eventId = readStr(r, "eventId", "EventId");
    if (!roleName || !eventId) continue;

    result.push({
      id: readStr(r, "id", "Id"),
      eventId,
      trackId: readStr(r, "trackId", "TrackId"),
      teamId: readStr(r, "teamId", "TeamId"),
      roleName,
      trackName: readStr(r, "trackName", "TrackName") || undefined,
      eventName: readStr(r, "eventName", "EventName") || undefined,
    });
  }

  return result;
}

export function getUniqueRoleNames(roles: NormalizedEventRole[]): string[] {
  return [...new Set(roles.map((r) => r.roleName))];
}

export function getAssignedEventIdsFromRoles(
  roles: NormalizedEventRole[],
  roleNames?: string[],
): string[] {
  const allowed = roleNames ? new Set(roleNames) : STAFF_ROLE_NAMES;
  return [
    ...new Set(
      roles
        .filter((r) => allowed.has(r.roleName))
        .map((r) => r.eventId)
        .filter(Boolean),
    ),
  ];
}

export function getRolesForEvent(
  roles: NormalizedEventRole[],
  eventId: string,
): NormalizedEventRole[] {
  if (!eventId) return [];
  return roles.filter((r) => idsMatch(r.eventId, eventId));
}

export function getRolesForTrack(
  roles: NormalizedEventRole[],
  trackId: string,
  roleName?: string,
): NormalizedEventRole[] {
  if (!trackId) return [];
  return roles.filter((r) => {
    if (!idsMatch(r.trackId, trackId)) return false;
    if (roleName) return r.roleName === roleName;
    return true;
  });
}

export function hasEventRole(
  roles: NormalizedEventRole[],
  eventId: string,
  roleName?: string,
): boolean {
  if (!eventId) return false;
  return roles.some((r) => {
    if (!idsMatch(r.eventId, eventId)) return false;
    if (roleName) return r.roleName === roleName;
    return true;
  });
}

export function hasTrackRole(
  roles: NormalizedEventRole[],
  trackId: string,
  roleName?: string,
): boolean {
  if (!trackId) return false;
  return getRolesForTrack(roles, trackId, roleName).length > 0;
}

export function resolveMentorContext(
  roles: NormalizedEventRole[],
  options?: { eventId?: string; trackId?: string },
): NormalizedEventRole | null {
  const mentors = roles.filter((r) => r.roleName === "Mentor");
  if (mentors.length === 0) return null;

  const trackId = options?.trackId || "";
  const eventId = options?.eventId || "";

  if (trackId) {
    const byTrack = mentors.find((r) => idsMatch(r.trackId, trackId));
    if (byTrack) return byTrack;
  }
  if (eventId) {
    const byEvent = mentors.find((r) => idsMatch(r.eventId, eventId));
    if (byEvent) return byEvent;
  }
  return mentors[0] || null;
}

export function resolveJudgeContext(
  roles: NormalizedEventRole[],
  options?: { eventId?: string; trackId?: string },
): NormalizedEventRole | null {
  const judges = roles.filter((r) => r.roleName === "Judge");
  if (judges.length === 0) return null;

  const trackId = options?.trackId || "";
  const eventId = options?.eventId || "";

  if (trackId) {
    const byTrack = judges.find((r) => idsMatch(r.trackId, trackId));
    if (byTrack) return byTrack;
  }
  if (eventId) {
    const byEvent = judges.find((r) => idsMatch(r.eventId, eventId));
    if (byEvent) return byEvent;
  }
  return judges[0] || null;
}

export function findMixedJudgeMentorEventId(roles: NormalizedEventRole[]): string | null {
  const eventIds = [...new Set(roles.map((r) => r.eventId))];
  for (const eventId of eventIds) {
    const eventRoles = getRolesForEvent(roles, eventId);
    const names = getUniqueRoleNames(eventRoles);
    if (names.includes("Judge") && names.includes("Mentor")) return eventId;
  }
  return null;
}

export function getStaffRoleDisplayLabel(roles: NormalizedEventRole[], eventId?: string): string {
  const scoped = eventId ? getRolesForEvent(roles, eventId) : roles;
  const names = getUniqueRoleNames(scoped);
  const hasJudge = names.includes("Judge");
  const hasMentor = names.includes("Mentor");
  const hasCoord = names.some((n) => n === "Coordinator" || n === "EventCoordinator");

  if (hasCoord) return "Coordinator";
  if (hasJudge && hasMentor) return "Judge & Mentor";
  if (hasJudge) return "Judge";
  if (hasMentor) return "Mentor";
  if (names.includes("TeamLeader")) return "TeamLeader";
  if (names.includes("TeamMember")) return "TeamMember";
  return names[0] || "Guest";
}

export function resolveStaffLandingPath(roles: NormalizedEventRole[]): string | null {
  const mixedEventId = findMixedJudgeMentorEventId(roles);
  if (mixedEventId) return `/events/${mixedEventId}`;

  const coord = roles.find((r) => r.roleName === "EventCoordinator" || r.roleName === "Coordinator");
  if (coord) {
    return coord.eventId
      ? `/coordinator/dashboard?eventId=${coord.eventId}`
      : "/coordinator/dashboard";
  }

  const judge = roles.find((r) => r.roleName === "Judge");
  if (judge) {
    return judge.eventId ? `/judge/events?eventId=${judge.eventId}` : "/judge/events";
  }

  const mentor = roles.find((r) => r.roleName === "Mentor");
  if (mentor) {
    return mentor.eventId ? `/events/${mentor.eventId}` : "/events";
  }

  const team = roles.find((r) => r.roleName === "TeamLeader" || r.roleName === "TeamMember");
  if (team) {
    return team.eventId ? `/my-team?eventId=${team.eventId}` : "/my-team";
  }

  return null;
}

const ROLE_RANK = ["EventCoordinator", "Coordinator", "Judge", "Mentor", "TeamLeader", "TeamMember"];

export function pickPrimaryRoleFromRows(rows: unknown[], userId: string): EventRole | null {
  const norm = normalizeEventRoleRows(rows);
  const chosen = ROLE_RANK.map((rn) => norm.find((r) => r.roleName === rn)).find(Boolean);
  if (!chosen) return null;

  const assigned = getAssignedEventIdsFromRoles(norm);

  return {
    id: chosen.id,
    eventRoleId: chosen.id,
    EventRoleId: chosen.id,
    userId,
    UserId: userId,
    eventId: chosen.eventId,
    EventId: chosen.eventId,
    roleName: chosen.roleName,
    RoleName: chosen.roleName,
    trackId: chosen.trackId,
    TrackId: chosen.trackId,
    teamId: chosen.teamId,
    TeamId: chosen.teamId,
    assignedEventIds: assigned,
    AssignedEventIds: assigned,
  };
}
