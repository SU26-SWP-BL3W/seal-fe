"use client";

import React, { useState } from "react";
import { Button, Card, Badge } from "@/components/ui";
import { eventsRepository } from "@/repositories/eventsRepository";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  Target,
  Sliders,
  Users,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  Rocket,
  Save,
} from "lucide-react";

interface Step6EventConfirmationProps {
  eventId?: string;
  eventData: any;
  rounds: any[];
  tracks: any[];
  criterias: any[];
  staffInvites: any[];
  canPublishEvent?: boolean;
  validationMissingItems?: string[];
  onPrev: () => void;
}

export const Step6EventConfirmation: React.FC<Step6EventConfirmationProps> = ({
  eventId,
  eventData,
  rounds,
  tracks,
  criterias,
  staffInvites,
  canPublishEvent = false,
  validationMissingItems = [],
  onPrev,
}) => {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const handlePublish = async (isPublic: boolean) => {
    if (isPublic && !canPublishEvent) return;
    setIsPublishing(true);
    try {
      if (eventId) {
        await eventsRepository.updateEvent(eventId, {
          status: isPublic,
        });
      }
      setIsPublishing(false);
      setPublishSuccess(true);
      setTimeout(() => {
        router.push("/coordinator/dashboard");
      }, 1500);
    } catch (err: any) {
      setIsPublishing(false);
      // Fallback redirection to dashboard even if status update has permission warn
      router.push("/coordinator/dashboard");
    }
  };

  return (
    <Card className="hud-glow-cyan p-8 space-y-8">
      {/* Success Stepper Header */}
      <div className="text-center space-y-3 border-b border-[var(--border-muted)] pb-6">
        <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto ${
          canPublishEvent
            ? "bg-[rgba(16,185,129,0.15)] border-[var(--color-success)] shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            : "bg-amber-500/15 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
        }`}>
          {canPublishEvent ? (
            <Sparkles className="w-8 h-8 text-[var(--color-success)] animate-pulse" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-amber-400 animate-pulse" />
          )}
        </div>
        <h2 className="font-display font-bold text-2xl text-[var(--text-primary)] uppercase tracking-wider">
          Xác Nhận &amp; Chốt Công Bố Sự Kiện
        </h2>
        <p className="text-xs font-mono text-[var(--text-muted)] max-w-xl mx-auto">
          {canPublishEvent
            ? "Tất cả các bước cấu hình đã đạt chuẩn! Bạn có thể công bố sự kiện công khai ngay hoặc lưu lại bản nháp."
            : "Sự kiện hiện chưa hoàn tất đầy đủ các bước bắt buộc. Vui lòng kiểm tra danh sách bên dưới trước khi công bố."}
        </p>

        {/* Current Draft Status Badge */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold rounded-full hud-clipped">
            <EyeOff className="w-4 h-4 text-amber-400" />
            <span>BẢN NHÁP (ĐANG ẨN — CHƯA CÔNG BỐ)</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold rounded-full hud-clipped">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>QUY MÔ: {eventData.maxTeams || 50} ĐỘI ({eventData.minTeamSize ?? 3} - {eventData.maxTeamSize ?? 5} THÀNH VIÊN/ĐỘI)</span>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Stat 1: Rounds */}
        <div className="p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-2">
          <div className="flex items-center justify-between text-amber-400 font-mono text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Vòng thi
            </span>
            <span className="text-lg font-black">{rounds.length}</span>
          </div>
          <p className="text-[11px] font-mono text-[var(--text-muted)] truncate">
            {rounds.map((r) => r.roundName).join(", ") || "Chưa có vòng"}
          </p>
        </div>

        {/* Stat 2: Tracks */}
        <div className="p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-2">
          <div className="flex items-center justify-between text-cyan-400 font-mono text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Target className="w-4 h-4" /> Hạng mục
            </span>
            <span className="text-lg font-black">{tracks.length}</span>
          </div>
          <p className="text-[11px] font-mono text-[var(--text-muted)] truncate">
            {tracks.map((t) => t.trackName).join(", ") || "Chưa có hạng mục"}
          </p>
        </div>

        {/* Stat 3: Criteria */}
        <div className="p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-2">
          <div className="flex items-center justify-between text-purple-400 font-mono text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4" /> Tiêu chí chấm
            </span>
            <span className="text-lg font-black">{criterias.length}</span>
          </div>
          <p className="text-[11px] font-mono text-[var(--text-muted)] truncate">
            {tracks.length} Hạng mục tham chiếu
          </p>
        </div>

        {/* Stat 4: Staff */}
        <div className="p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-2">
          <div className="flex items-center justify-between text-emerald-400 font-mono text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Lời mời nhân sự
            </span>
            <span className="text-lg font-black">{staffInvites.length}</span>
          </div>
          <p className="text-[11px] font-mono text-[var(--text-muted)] truncate">
            {staffInvites.length} lời mời đã gửi
          </p>
        </div>
      </div>

      {/* Validation Missing Items List (Red Error Box) */}
      {!canPublishEvent && validationMissingItems.length > 0 && (
        <div className="p-5 bg-red-500/10 border-2 border-red-500/60 text-red-300 font-mono text-xs rounded hud-clipped space-y-3">
          <div className="font-bold flex items-center gap-2 text-red-400 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
            <span>SỰ KIỆN CHƯA THỂ CÔNG BỐ — VUI LÒNG BỔ SUNG CÁC BƯỚC BẮT BUỘC:</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-xs pl-2 text-red-200 font-medium">
            {validationMissingItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-gray-400 italic pt-1 border-t border-red-500/30">
            Bạn có thể bấm <strong>"Lưu Bản Nháp"</strong> để lưu lại tiến trình đã làm và quay lại hoàn thiện sau.
          </p>
        </div>
      )}

      {/* Published Feedback Alert */}
      {publishSuccess && (
        <div className="p-4 bg-[rgba(16,185,129,0.15)] border border-[var(--color-success)] text-[var(--color-success)] font-mono text-xs text-center font-bold rounded animate-fadeIn">
          ĐÃ LƯU TRẠNG THÁI SỰ KIỆN THÀNH CÔNG! Đang chuyển về Trang quản lý Điều phối viên...
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[var(--border-muted)]">
        <Button variant="ghost" onClick={onPrev} className="flex items-center gap-2 text-xs font-mono">
          <ArrowLeft className="w-4 h-4" /> Quay Lại Chỉnh Sửa
        </Button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="secondary"
            onClick={() => handlePublish(false)}
            disabled={isPublishing}
            className="flex-1 sm:flex-initial text-xs font-mono flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Bản Nháp (Chưa Hiện Thí Sinh)</span>
          </Button>

          <Button
            variant="primary"
            onClick={() => handlePublish(true)}
            disabled={!canPublishEvent || isPublishing}
            className={`flex-1 sm:flex-initial text-xs font-mono flex items-center justify-center gap-2 font-bold border-0 ${
              canPublishEvent
                ? "bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
                : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span>
              {isPublishing
                ? "Đang Công Bố..."
                : canPublishEvent
                ? "CÔNG BỐ SỰ KIỆN NGAY"
                : "Chưa Đủ Điều Kiện Công Bố"}
            </span>
          </Button>
        </div>
      </div>
    </Card>
  );
};
