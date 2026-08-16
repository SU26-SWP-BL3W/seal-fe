"use client";

import React, { useState } from "react";
import { Button, Input, Card, Badge } from "@/components/ui";
import { StaffInviteFormState, TrackFormState } from "@/viewModels/useCreateEventWizardViewModel";
import { Users, Mail, UserPlus, Trash2, ArrowLeft, CheckCircle2, ShieldCheck, Clock, AlertCircle } from "lucide-react";
import { checkEmailInSystem } from "@/views/CoordinatorStaffView";
import { useGetUsers } from "@/repositories/usersRepository";

interface Step5StaffAssignmentProps {
  tracks: TrackFormState[];
  staffInvites: StaffInviteFormState[];
  onAddStaffInvite: (email: string, roleName: "Judge" | "Mentor", trackId?: string) => void;
  onRemoveStaffInvite: (id: string) => void;
  onFinish: () => void;
  onPrev: () => void;
  isSubmitting: boolean;
  successMessage: string | null;
  isReadOnly?: boolean;
}

export const Step5StaffAssignment: React.FC<Step5StaffAssignmentProps> = ({
  tracks,
  staffInvites,
  onAddStaffInvite,
  onRemoveStaffInvite,
  onFinish,
  onPrev,
  isSubmitting,
  successMessage,
  isReadOnly = false,
}) => {
  const { data: usersPaged } = useGetUsers();
  const systemAccounts = usersPaged?.data || [];

  const [emailInput, setEmailInput] = useState<string>("");
  const [roleInput, setRoleInput] = useState<"Judge" | "Mentor">("Judge");
  const [trackInput, setTrackInput] = useState<string>(tracks[0]?.id || "");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!emailInput.trim()) return;
    onAddStaffInvite(emailInput.trim(), roleInput, trackInput || undefined);
    setEmailInput("");
  };

  return (
    <Card className="hud-glow-mentor p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-4">
        <div>
          <h3 className="font-display font-bold text-lg text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--accent-mentor)]" />
            Bước 5: Phân Công Giám Khảo &amp; Cố Vấn (Staffing)
          </h3>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
            Gửi email mời Giám khảo &amp; Cố vấn tham gia Hội đồng chuyên môn của Sự kiện.
          </p>
        </div>
        <span className="px-3 py-1 font-mono text-xs bg-[var(--bg-input)] text-[var(--accent-mentor)] border border-[var(--accent-mentor)]/30 hud-clipped">
          Giao diện phân công Hạng mục
        </span>
      </div>

      {isReadOnly && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs hud-clipped flex items-center gap-2">
          <span>⚠️ Sự kiện đang ở trạng thái <strong>Công Khai (Public)</strong>. Để phân công thêm hoặc gỡ nhân sự, vui lòng bấm <strong>[ 🔒 TẠM ẨN ĐỂ SỬ A ]</strong> ở trên cùng.</span>
        </div>
      )}

      {/* Form Mời Nhân Sự */}
      <form onSubmit={handleAdd} className="p-5 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-4">
        <h4 className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
          <UserPlus className="w-4 h-4 text-[var(--accent-mentor)]" />
          Gửi Lời Mời Nhân Sự Mới Qua Email
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Địa Chỉ Email Nhân Sự *</label>
            <Input
              type="email"
              list="wizard-staff-accounts"
              placeholder="e.g. judge.phuchn@fpt.edu.vn"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
            />
            {emailInput.trim() && !checkEmailInSystem(emailInput, systemAccounts) && (
              <p className="text-[11px] font-mono text-amber-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Email này chưa tồn tại trong hệ thống</span>
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Vai Trò Phân Công</label>
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value as "Judge" | "Mentor")}
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped"
            >
              <option value="Judge">Giám Khảo (Judge)</option>
              <option value="Mentor">Cố Vấn (Mentor)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Hạng Mục Phụ Trách</label>
            <select
              value={trackInput}
              onChange={(e) => setTrackInput(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped"
            >
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.trackName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="ghost" type="submit" className="flex items-center gap-1.5 text-xs">
            <Mail className="w-4 h-4 text-[var(--accent-mentor)]" /> + Thêm Vào Danh Sách Mời
          </Button>
        </div>
      </form>

      {/* Staff Invitation List */}
      <div className="space-y-3">
        <h4 className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
          Danh Sách Lời Mời Đã Chuẩn Bị ({staffInvites.length})
        </h4>

        {staffInvites.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[var(--border-muted)] bg-[var(--bg-panel)]/30 hud-clipped">
            <p className="font-mono text-xs text-[var(--text-muted)]">
              Chưa có Giám khảo/Cố vấn nào trong danh sách. Hãy nhập email ở trên để gửi lời mời.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {staffInvites.map((staff) => {
              const trackObj = tracks.find((t) => t.id === staff.trackId);
              return (
                <div
                  key={staff.id}
                  className="p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] flex items-center justify-between hud-clipped"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                        staff.roleName === "Judge"
                          ? "bg-[var(--accent-judge)]/10 text-[var(--accent-judge)] border border-[var(--accent-judge)]/30"
                          : "bg-[var(--accent-mentor)]/10 text-[var(--accent-mentor)] border border-[var(--accent-mentor)]/30"
                      }`}
                    >
                      {staff.roleName === "Judge" ? "J" : "M"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[var(--text-primary)]">{staff.email}</span>
                        <Badge tone={staff.roleName === "Judge" ? "judge" : "mentor"}>
                          [{staff.roleName.toUpperCase()}]
                        </Badge>
                      </div>
                      <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                        Phụ trách Track: <span className="text-[var(--text-primary)]">{trackObj?.trackName || "Toàn bộ sự kiện"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--color-warning)] bg-[rgba(245,158,11,0.1)] px-2 py-0.5 border border-[var(--color-warning)]/20 uppercase">
                      <Clock className="w-3 h-3 text-[var(--color-warning)]" /> Pending (24h)
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveStaffInvite(staff.id)}
                      className="text-xs font-mono text-[var(--color-danger)] hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Gỡ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {successMessage && (
        <div className="p-4 bg-[rgba(16,185,129,0.1)] border border-[var(--color-success)] text-[var(--color-success)] font-mono text-xs hud-clipped flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-muted)]">
        <Button variant="ghost" onClick={onPrev} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> &lt; Quay Lại Bước 4
        </Button>
        <Button
          variant="primary"
          onClick={onFinish}
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          {isSubmitting ? "Đang gửi lời mời & tạo sự kiện..." : "// KÍCH HOẠT SỰ KIỆN & GỬI LỜI MỜI >"}
        </Button>
      </div>

      <datalist id="wizard-staff-accounts">
        {systemAccounts.map((acc: any) => (
          <option key={acc.id || acc.email} value={acc.email}>
            {acc.fullName || acc.email} ({acc.email})
          </option>
        ))}
      </datalist>
    </Card>
  );
};
