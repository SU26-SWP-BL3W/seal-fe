export type TeamStatus =
  | "Forming"
  | "PendingApproval"
  | "Approved"
  | "Registered"
  | "Rejected"
  | "Disqualified";

export interface TeamStatusConfig {
  label: string;
  /** Mô tả người dùng đọc được — dùng cho banner, tránh nhãn cụt gây hiểu nhầm. */
  hint: string;
  tone: "warning" | "info" | "success" | "danger";
}

// Rejected (BTC trả hồ sơ, đội sửa rồi nộp lại) và Disqualified (bị loại khỏi
// cuộc thi) là hai việc khác nhau nên không dùng chung một nhãn.
export const TEAM_STATUS: Record<TeamStatus, TeamStatusConfig> = {
  Forming: {
    label: "Đang hình thành",
    hint: "Đội đang tuyển thành viên, chưa gửi hồ sơ cho BTC.",
    tone: "warning",
  },
  PendingApproval: {
    label: "Chờ BTC duyệt",
    hint: "Hồ sơ đã gửi. BTC sẽ phản hồi trong 24–48 giờ làm việc.",
    tone: "info",
  },
  Approved: {
    label: "Đã được duyệt",
    hint: "Đội đã ghi danh thành công và có thể nộp bài.",
    tone: "success",
  },
  Registered: {
    label: "Đã được duyệt",
    hint: "Đội đã ghi danh thành công và có thể nộp bài.",
    tone: "success",
  },
  Rejected: {
    label: "BTC trả hồ sơ",
    hint: "BTC yêu cầu chỉnh sửa. Cập nhật theo lý do bên dưới rồi ghi danh lại.",
    tone: "danger",
  },
  Disqualified: {
    label: "Đã bị loại",
    hint: "Đội đã bị BTC loại khỏi cuộc thi. Liên hệ ban tổ chức để biết chi tiết.",
    tone: "danger",
  },
};

export const TONE_TEXT: Record<TeamStatusConfig["tone"], string> = {
  warning: "text-[color:var(--color-warning)]",
  info: "text-[color:var(--accent-secondary)]",
  success: "text-[color:var(--color-success)]",
  danger: "text-[color:var(--color-danger)]",
};

export const MIN_MEMBERS = 3;
export const MAX_MEMBERS = 5;
