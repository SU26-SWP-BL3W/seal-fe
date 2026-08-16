import type { TeamStatus } from "./teamStatus";

export interface TeamView {
  id: string;
  teamName: string;
  description: string;
  eventId: string;
  eventName: string;
  status: TeamStatus;
  createdTime: string;
  lastRejectReason: string;
}

export interface InvitationView {
  id: string;
  email: string;
  fullName: string;
  statusLabel: string;
  sentAt: string;
}
