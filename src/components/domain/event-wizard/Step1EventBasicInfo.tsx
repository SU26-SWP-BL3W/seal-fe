"use client";

import React, { useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { EventFormState } from "@/viewModels/useCreateEventWizardViewModel";
import { Calendar, Shield, Edit3, CheckCircle2, ArrowRight, Users, Clock, ClipboardList } from "lucide-react";

interface Step1EventBasicInfoProps {
  eventData: EventFormState;
  onUpdateField: (field: keyof EventFormState, value: any) => void;
  onNext: () => void;
  isSubmitting: boolean;
  isReadOnly?: boolean;
}

const toDateTimeLocal = (val?: string) => {
  if (!val) return "";
  if (val.length === 16 && val.includes("T")) return val;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return val;
  }
};

const formatDisplayDateTime = (val?: string) => {
  if (!val) return "Chưa thiết lập";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  } catch {
    return val;
  }
};

export const Step1EventBasicInfo: React.FC<Step1EventBasicInfoProps> = ({
  eventData,
  onUpdateField,
  onNext,
  isSubmitting,
  isReadOnly = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card className="hud-glow-cyan p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-4">
        <div>
          <h3 className="font-display font-bold text-lg text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--accent-primary)]" />
            Bước 1: Thông Tin Sự Kiện &amp; Cổng Đăng Ký
          </h3>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
            Kiểm tra và thiết lập thông tin sự kiện, thời gian mở/đóng cổng đăng ký trước khi cấu hình Vòng thi &amp; Bảng đấu.
          </p>
        </div>

        {isReadOnly ? (
          <div className="px-3 py-1.5 font-mono text-xs border border-amber-500/40 text-amber-300 bg-amber-500/10 hud-clipped font-bold flex items-center gap-1.5">
            <span>🔒 Chỉ Đọc (Đang Public)</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 font-mono text-xs border border-[var(--accent-primary)]/40 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 hud-clipped font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditing ? "✕ Hủy Chỉnh Sửa" : "✎ Chỉnh Sửa Thông Tin"}
          </button>
        )}
      </div>

      {isReadOnly && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs hud-clipped flex items-center gap-2">
          <span>⚠️ Sự kiện đang ở trạng thái <strong>Công Khai (Public)</strong>. Để bảo vệ dữ liệu thí sinh, vui lòng bấm <strong>[ 🔒 TẠM ẨN ĐỂ SỬA ]</strong> ở trên cùng trước khi chỉnh sửa thông tin.</span>
        </div>
      )}

      {isEditing && !isReadOnly ? (
        /* EDITABLE FORM FOR COORDINATOR */
        <div className="p-6 bg-[var(--bg-panel)] border border-[var(--accent-primary)]/30 hud-clipped space-y-6 animate-fadeIn font-mono text-xs">
          {/* Nhóm 1: Thông Tin Chung */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider flex items-center gap-1.5 border-b border-[var(--border-muted)]/50 pb-2">
              <Shield className="w-4 h-4" /> 1. Thông Tin Chung Sự Kiện
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Tên Sự Kiện *</label>
                <Input
                  type="text"
                  value={eventData.eventName}
                  onChange={(e) => onUpdateField("eventName", e.target.value)}
                  placeholder="Ví dụ: SEAL Hackathon 2026"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase">Mùa Giải (Season)</label>
                <Input
                  type="text"
                  value={eventData.season}
                  onChange={(e) => onUpdateField("season", e.target.value)}
                  placeholder="Ví dụ: Mùa Hè"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase">Năm Tổ Chức (Year)</label>
                <Input
                  type="number"
                  value={eventData.year}
                  onChange={(e) => onUpdateField("year", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase flex items-center gap-1 font-bold">
                  <Users className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  Quy Mô Đội Thi Tối Đa (Max Teams) *
                </label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={eventData.maxTeams}
                  onChange={(e) => onUpdateField("maxTeams", Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase">Mô Tả Ngắn</label>
                <Input
                  type="text"
                  value={eventData.tagline || ""}
                  onChange={(e) => onUpdateField("tagline", e.target.value)}
                  placeholder="Khẩu hiệu hoặc tóm tắt sự kiện"
                />
              </div>

              {/* Linh hoạt quy mô thành viên mỗi đội */}
              <div className="p-3 bg-[var(--bg-base)] border border-cyan-500/30 rounded space-y-1">
                <label className="text-[10px] text-cyan-300 uppercase flex items-center gap-1 font-bold">
                  <Users className="w-3 h-3 text-cyan-400" />
                  Số TV Tối Thiểu Mỗi Đội (Min Members) *
                </label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={eventData.minTeamSize ?? 3}
                  onChange={(e) => onUpdateField("minTeamSize", Number(e.target.value))}
                  required
                />
                <span className="text-[9px] text-[var(--text-muted)] block">Ví dụ: 3 người</span>
              </div>

              <div className="p-3 bg-[var(--bg-base)] border border-cyan-500/30 rounded space-y-1">
                <label className="text-[10px] text-cyan-300 uppercase flex items-center gap-1 font-bold">
                  <Users className="w-3 h-3 text-cyan-400" />
                  Số TV Tối Đa Mỗi Đội (Max Members) *
                </label>
                <Input
                  type="number"
                  min={1}
                  max={15}
                  value={eventData.maxTeamSize ?? 5}
                  onChange={(e) => onUpdateField("maxTeamSize", Number(e.target.value))}
                  required
                />
                <span className="text-[9px] text-[var(--text-muted)] block">Ví dụ: 5 người</span>
              </div>
            </div>
          </div>

          {/* Nhóm 2: Mốc Thời Gian Đăng Ký & Sự Kiện */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-[var(--color-warning)] uppercase tracking-wider flex items-center gap-1.5 border-b border-[var(--border-muted)]/50 pb-2">
              <ClipboardList className="w-4 h-4 text-amber-400" /> 2. Thiết Lập Mở / Đóng Cổng Đăng Ký &amp; Sự Kiện
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-[var(--bg-base)] border border-[var(--border-muted)] rounded space-y-1.5">
                <label className="text-[10px] text-[var(--text-muted)] uppercase flex items-center gap-1 font-bold text-amber-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Thời Gian Mở Cổng Đăng Ký (Giờ &amp; Ngày) *
                </label>
                <Input
                  type="datetime-local"
                  value={toDateTimeLocal(eventData.registrationStartDate)}
                  onChange={(e) => onUpdateField("registrationStartDate", e.target.value)}
                  required
                />
                <span className="text-[10px] text-[var(--text-muted)] block">
                  Thời điểm thí sinh bắt đầu được phép nộp hồ sơ đăng ký.
                </span>
              </div>

              <div className="p-3 bg-[var(--bg-base)] border border-[var(--border-muted)] rounded space-y-1.5">
                <label className="text-[10px] text-[var(--text-muted)] uppercase flex items-center gap-1 font-bold text-amber-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Thời Gian Đóng Cổng Đăng Ký (Giờ &amp; Ngày) *
                </label>
                <Input
                  type="datetime-local"
                  value={toDateTimeLocal(eventData.registrationEndDate)}
                  onChange={(e) => onUpdateField("registrationEndDate", e.target.value)}
                  required
                />
                <span className="text-[10px] text-[var(--text-muted)] block">
                  Hạn chót khóa form đăng ký của thí sinh.
                </span>
              </div>

              <div className="p-3 bg-[var(--bg-base)] border border-[var(--border-muted)] rounded space-y-1.5">
                <label className="text-[10px] text-[var(--text-muted)] uppercase flex items-center gap-1 font-bold text-cyan-300">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  Ngày Bắt Đầu Sự Kiện *
                </label>
                <Input
                  type="datetime-local"
                  value={toDateTimeLocal(eventData.startDate)}
                  onChange={(e) => onUpdateField("startDate", e.target.value)}
                  required
                />
              </div>

              <div className="p-3 bg-[var(--bg-base)] border border-[var(--border-muted)] rounded space-y-1.5">
                <label className="text-[10px] text-[var(--text-muted)] uppercase flex items-center gap-1 font-bold text-cyan-300">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  Ngày Kết Thúc Sự Kiện *
                </label>
                <Input
                  type="datetime-local"
                  value={toDateTimeLocal(eventData.endDate)}
                  onChange={(e) => onUpdateField("endDate", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Nhóm 3: Quy Định & Mô Tả */}
          <div className="space-y-1 pt-2">
            <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Mô Tả &amp; Quy Định Tham Gia Sự Kiện</label>
            <textarea
              rows={3}
              value={eventData.description}
              onChange={(e) => onUpdateField("description", e.target.value)}
              placeholder="Quy định tuyển sinh, điều kiện lập đội thi và thể lệ..."
              className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 text-white font-bold hud-clipped flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Lưu Cập Nhật
            </button>
          </div>
        </div>
      ) : (
        /* READABLE SUMMARY CARD */
        <div className="p-6 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-muted)] pb-4">
            <div>
              <span className="text-[10px] font-mono text-[var(--accent-primary)] uppercase tracking-widest block font-bold">
                TÊN SỰ KIỆN HACKATHON
              </span>
              <h2 className="font-display font-bold text-2xl text-[var(--text-primary)] uppercase">
                {eventData.eventName}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[var(--bg-input)] border border-[var(--border-muted)] font-mono text-xs font-bold text-[var(--text-primary)] hud-clipped">
                {eventData.season} {eventData.year}
              </span>
              <span className="px-2 py-1 bg-[rgba(16,185,129,0.1)] text-[var(--color-success)] border border-[var(--color-success)]/30 font-mono text-xs font-bold hud-clipped">
                BẢN NHÁP (DRAFT)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            {/* Box 1: Cổng Đăng Ký */}
            <div className="p-3 bg-[var(--bg-input)] border border-amber-500/30 hud-clipped space-y-1.5">
              <span className="text-[10px] text-amber-400 uppercase flex items-center gap-1 font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Thời Gian Mở / Đóng Đăng Ký
              </span>
              <p className="font-bold text-[var(--text-primary)] text-[11px] leading-relaxed">
                Mở: {formatDisplayDateTime(eventData.registrationStartDate)}<br />
                Đóng: {formatDisplayDateTime(eventData.registrationEndDate)}
              </p>
            </div>

            {/* Box 2: Thời Gian Sự Kiện */}
            <div className="p-3 bg-[var(--bg-input)] border border-cyan-500/30 hud-clipped space-y-1.5">
              <span className="text-[10px] text-cyan-400 uppercase flex items-center gap-1 font-bold">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Thời Gian Diễn Ra Sự Kiện
              </span>
              <p className="font-bold text-[var(--text-primary)] text-[11px] leading-relaxed">
                Bắt đầu: {formatDisplayDateTime(eventData.startDate)}<br />
                Bế mạc: {formatDisplayDateTime(eventData.endDate)}
              </p>
            </div>

            {/* Box 3: Quy Mô */}
            <div className="p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped space-y-1.5">
              <span className="text-[10px] text-[var(--text-muted)] uppercase flex items-center gap-1 font-bold">
                <Users className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                Quy Mô Đội &amp; Số Lượng Thành Viên
              </span>
              <p className="font-bold text-[var(--accent-primary)] text-sm pt-0.5">
                {eventData.maxTeams || 50} Đội thi
              </p>
              <p className="text-[11px] font-bold text-cyan-300">
                Mỗi đội: {eventData.minTeamSize ?? 3} - {eventData.maxTeamSize ?? 5} thành viên
              </p>
            </div>

            <div className="md:col-span-3 p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Mô Tả &amp; Thể Lệ Sự Kiện</span>
              <p className="text-[var(--text-muted)] leading-relaxed">
                {eventData.description || "Chưa có mô tả chi tiết."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-muted)] font-mono text-xs">
        <span className="text-[var(--text-muted)]">
          Bấm nút bên phải để chuyển sang Bước 2: Thiết lập Vòng thi (Rounds) &amp; Mốc thời gian nộp/chấm bài.
        </span>
        <Button
          variant="primary"
          accent="coordinator"
          onClick={onNext}
          disabled={isSubmitting}
          className="flex items-center gap-2 cursor-pointer"
        >
          {isSubmitting ? "Đang Khởi Tạo Sự Kiện..." : "Bắt Đầu Cấu Hình Vòng Thi (Rounds)"} <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};
