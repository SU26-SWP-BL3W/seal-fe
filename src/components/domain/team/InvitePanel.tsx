"use client";

import { useState } from "react";
import { Badge, Button, Card, Field, Input, SkeletonRows } from "@/components/ui";
import { AlertTriangle, Clock, ShieldAlert } from "lucide-react";
import { MAX_MEMBERS } from "./teamStatus";
import type { InvitationView } from "./types";

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
              <ul className="flex flex-col gap-2">
                {pendingInvitations.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex flex-col gap-1 border border-zinc-800 bg-zinc-900/60 p-2.5 rounded"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="truncate text-xs font-bold text-white block" title={inv.email}>
                          {inv.email}
                        </span>
                        {inv.fullName && (
                          <span className="text-[10px] text-zinc-400">{inv.fullName}</span>
                        )}
                      </div>
                      <Badge tone="warning" className="text-[10px]">
                        <Clock className="size-3 mr-1 inline" /> {inv.statusLabel || "Đang chờ"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                      <span>
                        Gửi: {inv.sentAt ? new Date(inv.sentAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "—"}
                      </span>
                      {canInvite && (
                        <button
                          type="button"
                          disabled={isCancelling}
                          onClick={() => onCancel(inv)}
                          className="font-bold uppercase text-red-400 hover:text-red-300 hover:underline cursor-pointer disabled:opacity-40"
                        >
                          Hủy mời
                        </button>
                      )}
                    </div>
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
              <ul className="flex flex-col gap-2">
                {historyInvitations.map((inv) => {
                  const isAccepted = inv.status === "Accepted";
                  const isDeclined = inv.status === "Declined";
                  const isExpired = inv.status === "Expired";

                  return (
                    <li
                      key={inv.id}
                      className="flex flex-col gap-1 border border-zinc-800/80 bg-zinc-900/30 p-2.5 rounded text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-zinc-300 font-bold" title={inv.email}>
                          {inv.email}
                        </span>
                        <Badge
                          tone={isAccepted ? "success" : isDeclined ? "danger" : "neutral"}
                          className="text-[10px]"
                        >
                          {isAccepted ? "Đã chấp nhận" : isDeclined ? "Đã từ chối" : isExpired ? "Đã hết hạn" : inv.statusLabel}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-zinc-500 flex justify-between">
                        <span>Gửi: {inv.sentAt ? new Date(inv.sentAt).toLocaleDateString("vi-VN") : "—"}</span>
                        {inv.respondedAt && (
                          <span>Phản hồi: {new Date(inv.respondedAt).toLocaleDateString("vi-VN")}</span>
                        )}
                      </div>
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
