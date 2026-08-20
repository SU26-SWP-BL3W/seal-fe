"use client";

import { useState } from "react";
import { Badge, Button, Card, Field, Input, SkeletonRows } from "@/components/ui";
import { AlertTriangle, Clock, ShieldAlert, X } from "lucide-react";
import { MAX_MEMBERS } from "./teamStatus";
import type { InvitationView } from "./types";
import { pushSystemNotification } from "@/repositories/shared/notificationsRepository";

interface Props {
  invitations: InvitationView[];
  memberCount: number;
  /** Chỉ mời được khi đội chưa chốt hồ sơ với BTC. */
  canInvite: boolean;
  isLoading: boolean;
  loadError: boolean;
  isInviting: boolean;
  isCancelling: boolean;
  onInvite: (email: string) => Promise<any>;
  onCancel: (invitation: InvitationView) => void;
}

export function InvitePanel({
  invitations,
  memberCount,
  canInvite,
  isLoading,
  loadError,
  isInviting,
  isCancelling,
  onInvite,
  onCancel,
}: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "PendingAccept" || inv.status === "Pending" || !inv.status
  );
  const historyInvitations = invitations.filter(
    (inv) => inv.status && inv.status !== "PendingAccept" && inv.status !== "Pending"
  );

  const pendingCount = pendingInvitations.length;
  const isFull = memberCount >= MAX_MEMBERS;
  const isPotentialFull = memberCount + pendingCount >= MAX_MEMBERS && !isFull;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || isFull) return;
    setError("");
    setSuccessNotice(null);
    try {
      const res = await onInvite(value);
      const isNewTemporary = Boolean(
        res?.isNewTemporaryUser || res?.IsNewTemporaryUser || (res as any)?.data?.isNewTemporaryUser
      );
      if (isNewTemporary) {
        setSuccessNotice(`Đã gửi lời mời tham gia đội tới ${value}. Hệ thống đã cấp tài khoản tạm và gửi email kích hoạt để thành viên vào đội ngay.`);
      } else {
        setSuccessNotice(`Đã gửi lời mời tham gia đội tới ${value}. Ứng viên có thể mở email hoặc thông báo chuông trên SEAL để nhấn "Đồng ý vào đội" ngay.`);
      }

      pushSystemNotification({
        title: "Gửi lời mời vào đội thi",
        message: `Đã gửi lời mời tham gia đội thi tới ${value}.`,
        type: "info",
      });
      pushSystemNotification({
        title: "Lời mời tham gia đội thi",
        message: `Bạn nhận được lời mời gia nhập đội thi.`,
        type: "info",
        recipientEmail: value,
      });

      setEmail("");
    } catch (err: unknown) {
      const detail = err as { message?: string; response?: { data?: { message?: string } } };
      setError(detail?.response?.data?.message || detail?.message || "Không gửi được lời mời.");
    }
  };

  return (
    <Card className="p-0 border border-zinc-800 bg-[#0e1619] hud-clipped">
      <div className="border-b border-zinc-800 px-4 py-3.5 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 font-mono">
            [ QUẢN LÝ THÀNH VIÊN ]
          </span>
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
            Mời Thành Viên Vào Đội
          </h2>
        </div>
        <div className="text-right font-mono">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded border ${
              isFull
                ? "bg-amber-950/50 text-amber-300 border-amber-500/40"
                : "bg-cyan-950/50 text-cyan-300 border-cyan-500/40"
            }`}
          >
            {memberCount}/{MAX_MEMBERS} Thành viên
          </span>
        </div>
      </div>

      {/* Team Capacity Notice */}
      {isFull ? (
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 text-xs font-mono text-amber-200 flex items-center gap-2">
          <ShieldAlert className="size-4 text-amber-400 shrink-0" />
          <span>Đội đã đạt tối đa {MAX_MEMBERS}/{MAX_MEMBERS} thành viên. Không thể mời thêm.</span>
        </div>
      ) : isPotentialFull ? (
        <div className="p-3 bg-cyan-950/30 border-b border-cyan-500/30 text-[11px] font-mono text-cyan-300/90 flex items-start gap-2">
          <AlertTriangle className="size-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            Đội có {memberCount} thành viên + {pendingCount} lời mời đang chờ (Tổng: {memberCount + pendingCount}/5).
          </span>
        </div>
      ) : null}

      {/* Invite Form */}
      {canInvite && !isFull && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 px-4 py-3.5 border-b border-zinc-800">
          <Field
            label="Email sinh viên được mời"
            error={error || undefined}
            hint="Lời mời do Đội trưởng gửi. Ứng viên có thể bấm Đồng ý để vào đội ngay lập tức."
          >
            {(field) => (
              <Input
                {...field}
                type="email"
                placeholder="sinhvien@fpt.edu.vn / email@truongkhac.edu.vn..."
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSuccessNotice(null);
                }}
                disabled={isFull || isInviting}
                required
                className="bg-black/60 text-white border-zinc-700"
              />
            )}
          </Field>

          {successNotice && (
            <p className="font-mono text-[11px] text-emerald-400 bg-emerald-950/40 p-2.5 rounded border border-emerald-500/30 leading-relaxed">
              ✓ {successNotice}
            </p>
          )}

          <Button
            id="send-invite-btn"
            type="submit"
            accent="team"
            disabled={!email.trim() || isFull || isInviting}
            className="w-full text-xs font-bold py-2"
          >
            {isInviting ? "Đang gửi lời mời..." : "+ Gửi Lời Mời Ngay"}
          </Button>
        </form>
      )}

      {/* Invitations Tabs */}
      <div className="px-4 pt-3 pb-4 space-y-3 font-mono">
        <div className="flex border-b border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`pb-2 px-2 font-bold uppercase transition-colors cursor-pointer border-b-2 ${
              activeTab === "pending"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Đang chờ ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`pb-2 px-2 font-bold uppercase transition-colors cursor-pointer border-b-2 ${
              activeTab === "history"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Lịch sử ({historyInvitations.length})
          </button>
        </div>

        {/* Tab Content: Pending Invitations */}
        {activeTab === "pending" && (
          <div>
            {isLoading ? (
              <SkeletonRows rows={2} />
            ) : loadError ? (
              <p role="alert" className="text-xs text-red-400">
                Không tải được danh sách lời mời.
              </p>
            ) : pendingInvitations.length === 0 ? (
              <p className="text-xs text-zinc-500 py-2">
                {canInvite && !isFull
                  ? "Chưa có lời mời nào đang chờ. Nhập email phía trên để gửi lời mời."
                  : "Không có lời mời nào đang chờ."}
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {pendingInvitations.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex flex-col gap-2 border border-zinc-800 bg-[#12191d] p-3 rounded hud-clipped hover:border-zinc-700 transition-colors shadow-sm"
                  >
                    {/* Top Row: Timestamp & Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-zinc-400 font-mono">
                        Gửi: {inv.sentAt ? new Date(inv.sentAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "—"}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40 flex items-center gap-1 shrink-0">
                        <Clock className="size-3 text-amber-400" />
                        <span>Đang chờ</span>
                      </span>
                    </div>

                    {/* Middle Row: Full Email & Full Name */}
                    <div className="space-y-0.5 pt-0.5">
                      <div className="text-xs font-bold text-white font-mono break-all leading-snug" title={inv.email}>
                        {inv.email}
                      </div>
                      {inv.fullName && (
                        <div className="text-[11px] text-zinc-400 font-sans">{inv.fullName}</div>
                      )}
                    </div>

                    {/* Bottom Row: Actions */}
                    {canInvite && (
                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-[10px] text-zinc-500 font-mono">Hết hạn sau 24h</span>
                        <button
                          type="button"
                          disabled={isCancelling}
                          onClick={() => onCancel(inv)}
                          className="px-2 py-0.5 font-mono font-bold uppercase text-rose-400 hover:text-white bg-rose-950/30 hover:bg-rose-900/60 border border-rose-500/30 rounded transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1"
                        >
                          <X className="size-3" /> Hủy mời
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Tab Content: History Invitations */}
        {activeTab === "history" && (
          <div>
            {historyInvitations.length === 0 ? (
              <p className="text-xs text-zinc-500 py-2">
                Chưa có lịch sử lời mời nào.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {historyInvitations.map((inv) => {
                  const isAccepted = inv.status === "Accepted";
                  const isDeclined = inv.status === "Declined";
                  const isExpired = inv.status === "Expired";

                  return (
                    <li
                      key={inv.id}
                      className="flex flex-col gap-2 border border-zinc-800/80 bg-zinc-900/40 p-3 rounded hud-clipped text-xs hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-zinc-500 font-mono">
                          Gửi: {inv.sentAt ? new Date(inv.sentAt).toLocaleDateString("vi-VN") : "—"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            isAccepted
                              ? "bg-emerald-950/50 text-emerald-300 border-emerald-500/40"
                              : isDeclined
                              ? "bg-rose-950/50 text-rose-300 border-rose-500/40"
                              : isExpired
                              ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                              : "bg-zinc-800 text-zinc-300 border-zinc-700"
                          }`}
                        >
                          {isAccepted ? "Đã chấp nhận" : isDeclined ? "Đã từ chối" : isExpired ? "Đã hết hạn" : inv.statusLabel}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-zinc-200 font-mono break-all" title={inv.email}>
                          {inv.email}
                        </div>
                        {inv.fullName && (
                          <div className="text-[11px] text-zinc-400 font-sans">{inv.fullName}</div>
                        )}
                      </div>
                      {inv.respondedAt && (
                        <div className="text-[10px] text-zinc-500 font-mono pt-1 border-t border-zinc-800/60">
                          Phản hồi lúc: {new Date(inv.respondedAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
