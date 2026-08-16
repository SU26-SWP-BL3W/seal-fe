export interface EventRoundItem {
  id: string;
  roundNumber: number;
  roundName: string;
  registrationDate?: string;
  startDate: string;
  endDate: string;
  submissionDeadline?: string;
  resultAnnouncementDate?: string;
  appealDeadline?: string;
  description: string;
}

export interface EventItem {
  id: string;
  eventName: string;
  season: string;
  year: number;
  tagline: string;
  description: string;
  startDate: string;
  endDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  maxTeams: number;
  teamCount: number;
  tracks: string[];
  rounds: EventRoundItem[];
  totalPrizeVnd: number;
}

export type TrackIconKey = "ai" | "web" | "security" | "iot" | "idea";

export interface TrackMeta {
  icon: TrackIconKey;
  accent: string;
  description: string;
}

export const TRACK_META: Record<string, TrackMeta> = {
  "AI & Machine Learning": {
    icon: "ai",
    accent: "var(--accent-judge)",
    description: "Phát triển mô hình Trí tuệ Nhân tạo & Học máy ứng dụng giải quyết bài toán thực tế.",
  },
  "Phát triển Web & Mobile": {
    icon: "web",
    accent: "var(--accent-primary)",
    description: "Xây dựng ứng dụng Web/Mobile hoàn chỉnh, trải nghiệm mượt mà, hạ tầng tối ưu.",
  },
  "Bảo mật & An ninh mạng": {
    icon: "security",
    accent: "var(--color-danger)",
    description: "Giải pháp bảo mật, quét lỗ hổng mã nguồn, mã hóa dữ liệu & phòng thủ hệ thống.",
  },
  "IoT & Phần cứng thông minh": {
    icon: "iot",
    accent: "var(--accent-team)",
    description: "Tích hợp thiết bị phần cứng, cảm biến, vi điều khiển & hệ thống nhúng thông minh.",
  },
};

export const DEFAULT_TRACK_META: TrackMeta = {
  icon: "idea",
  accent: "var(--accent-primary)",
  description: "Hạng mục thi đấu công nghệ trong khuôn khổ sự kiện.",
};

export type EventDisplayStatus = "registration_open" | "ongoing" | "upcoming" | "ended";

export interface EventCardData extends EventItem {
  status: EventDisplayStatus;
}

export const STATUS_PRIORITY: Record<EventDisplayStatus, number> = {
  ongoing: 0,
  registration_open: 1,
  upcoming: 2,
  ended: 3,
};

export function computeEventStatus(ev: EventItem, now: number): EventDisplayStatus {
  const start = new Date(ev.startDate).getTime();
  const end = new Date(ev.endDate).getTime();
  const regEnd = new Date(ev.registrationEndDate).getTime();

  if (now > end) return "ended";
  if (now >= start) return "ongoing";
  if (now <= regEnd) return "registration_open";
  return "upcoming";
}

export const STATUS_LABEL: Record<EventDisplayStatus, string> = {
  registration_open: "Đang mở đăng ký",
  ongoing: "Đang diễn ra",
  upcoming: "Sắp diễn ra",
  ended: "Đã kết thúc",
};

export const STATUS_DOT_VAR: Record<EventDisplayStatus, string> = {
  registration_open: "var(--color-success)",
  ongoing: "var(--accent-judge)",
  upcoming: "var(--accent-team)",
  ended: "var(--text-muted)",
};

export const STATUS_TONE: Record<EventDisplayStatus, "success" | "judge" | "neutral" | "team"> = {
  registration_open: "success",
  ongoing: "judge",
  upcoming: "team",
  ended: "neutral",
};

export interface PodiumTeam {
  rank: 1 | 2 | 3;
  teamName: string;
  projectName: string;
  track: string;
  score: number;
  membersCount: number;
  school: string;
  season: string;
  eventName: string;
  prizeTitle: string;
  prizeVnd: number;
}

export interface LandingMetric {
  id: string;
  label: string;
  value: string;
  subtext: string;
  toneVar: string;
}
