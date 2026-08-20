"use client";

import React, { useState, useMemo } from "react";
import { Badge, Button, Card, Input } from "@/components/ui";
import {
  RoleInvitationRecord,
  RoleInvitationStatus,
  invitationHistoryService,
} from "@/services/invitationHistoryService";
import {
  Mail,
  RefreshCw,
  Send,
  Trash2,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Shield,
  History,
  XCircle,
} from "lucide-react";

interface Props {
  eventId: string;
  eventName?: string;
  roleFilter?: "EventCoordinator" | "Judge" | "Mentor" | "ALL";
  records: RoleInvitationRecord[];
  onRefresh?: () => void;
  onResend?: (record: RoleInvitationRecord) => Promise<boolean | void>;
  onRevoke?: (record: RoleInvitationRecord) => Promise<boolean | void>;
  onDeleteHistory?: (recordId: string) => void;
}

export function RoleInvitationHistoryCard({
  eventId,
  eventName,
  roleFilter = "ALL",
  records,
  onRefresh,
  onResend,
  onRevoke,
  onDeleteHistory,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | RoleInvitationStatus>("ALL");
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Role filter
      if (roleFilter !== "ALL") {
        if (roleFilter === "EventCoordinator" && !(r.roleName === "EventCoordinator" || r.roleName === "0")) return false;
        if (roleFilter === "Judge" && r.roleName !== "Judge") return false;
        if (roleFilter === "Mentor" && r.roleName !== "Mentor") return false;
      }

      // Status filter
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchEmail = r.email.toLowerCase().includes(q);
        const matchName = r.fullName.toLowerCase().includes(q);
        const matchRole = r.roleName.toLowerCase().includes(q);
        const matchTrack = (r.trackName || "").toLowerCase().includes(q);
        if (!matchEmail && !matchName && !matchRole && !matchTrack) return false;
      }

      return true;
    });
  }, [records, roleFilter, statusFilter, searchTerm]);

  const counts = useMemo(() => {
    let pending = 0;
    let active = 0;
    let revoked = 0;
    records.forEach((r) => {
      if (r.status === "Pending") pending++;
      else if (r.status === "Active") active++;
      else if (r.status === "Revoked" || r.status === "Declined") revoked++;
    });
    return { total: records.length, pending, active, revoked };
  }, [records]);

  const handleResend = async (record: RoleInvitationRecord) => {
    setResendingId(record.id);
    setToastMessage(null);
    try {
      if (onResend) {
        await onResend(record);
      } else {
        // Fallback update timestamp
        invitationHistoryService.addInvitation({
          ...record,
          status: "Pending",
        });
      }
      setToastMessage({ text: `Đã gửi lại thư mời tới ${record.email}!` });
      if (onRefresh) onRefresh();
      setTimeout(() => setToastMessage(null), 3500);
    } catch (e: any) {
      setToastMessage({ text: e?.message || "Không gửi lại được thư mời.", isError: true });
    } finally {
      setResendingId(null);
    }
  };

  const handleRevoke = async (record: RoleInvitationRecord) => {
    const reason = window.prompt(
      `Nhập lý do thu hồi vai trò của "${record.fullName || record.email}" (hoặc để trống):`,
      "Theo quyết định của Ban tổ chức"
    );
    if (reason === null) return;

    setRevokingId(record.id);
    setToastMessage(null);
    try {
      if (onRevoke) {
        await onRevoke(record);
      }
      invitationHistoryService.updateStatus(eventId, record.id, "Revoked", reason.trim() || undefined);
      setToastMessage({ text: `Đã thu hồi quyền của ${record.email}.` });
      if (onRefresh) onRefresh();
      setTimeout(() => setToastMessage(null), 3500);
    } catch (e: any) {
      setToastMessage({ text: e?.message || "Thu hồi thất bại.", isError: true });
    } finally {
      setRevokingId(null);
    }
  };

  const handleDelete = (recordId: string, email: string) => {
    invitationHistoryService.removeInvitation(eventId, recordId);
    if (onDeleteHistory) onDeleteHistory(recordId);
    setToastMessage({ text: `Đã xóa bản ghi ${email} khỏi lịch sử.` });
    if (onRefresh) onRefresh();
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      return `${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ${d.toLocaleDateString("vi-VN")}`;
    } catch {
      return isoString;
    }
  };

  const renderRoleBadge = (roleName: string) => {
    if (roleName === "EventCoordinator" || roleName === "0") {
      return (
        <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-purple-500/40 bg-purple-500/10 text-purple-300 font-bold uppercase">
          Điều phối viên (EC)
        </span>
      );
    }
    if (roleName === "Judge" || roleName === "1") {
      return (
        <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300 font-bold uppercase">
          Giám khảo (Judge)
        </span>
      );
    }
    if (roleName === "Mentor" || roleName === "2") {
      return (
        <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-teal-500/40 bg-teal-500/10 text-teal-300 font-bold uppercase">
          Cố vấn (Mentor)
        </span>
      );
    }
    return (
      <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300">
        {roleName}
      </span>
    );
  };

  const renderStatusBadge = (status: RoleInvitationStatus) => {
    switch (status) {
      case "Active":
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 px-2.5 py-1 rounded">
            <span className="size-2 rounded-full bg-emerald-400"></span>
            Đã kích hoạt / Nhận vai trò
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-amber-300 bg-amber-950/40 border border-amber-500/40 px-2.5 py-1 rounded">
            <span className="size-2 rounded-full bg-amber-400 animate-ping"></span>
            Đang chờ phản hồi (Đã gửi)
          </span>
        );
      case "Declined":
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-red-400 bg-red-950/40 border border-red-500/40 px-2.5 py-1 rounded">
            <XCircle className="size-3" />
            Đã từ chối
          </span>
        );
      case "Revoked":
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded">
            <span className="size-2 rounded-full bg-zinc-500"></span>
            Đã thu hồi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded">
            {status}
          </span>
        );
    }
  };

  return (
    <Card className="p-5 space-y-4 border border-zinc-800 bg-[#0c1417] hud-clipped shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="size-4 text-cyan-400" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              [ LỊCH SỬ GỬI LỜI MỜI &amp; TRẠNG THÁI ]
            </span>
          </div>
          <h3 className="font-display text-base font-bold uppercase text-white mt-0.5">
            Nhật Ký Phân Công &amp; Theo Dõi Lời Mời ({filteredRecords.length})
          </h3>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Theo dõi thời gian thực trạng thái lời mời đã gửi và tiến độ kích hoạt tài khoản của nhân sự sự kiện.
          </p>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="self-start sm:self-center font-mono text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-zinc-700 bg-black/40 hover:border-zinc-500 transition-colors"
          >
            <RefreshCw className="size-3.5" />
            Làm mới
          </button>
        )}
      </div>

      {/* Toast alert */}
      {toastMessage && (
        <div
          className={`flex items-center gap-2 p-3 text-xs font-mono rounded border ${
            toastMessage.isError
              ? "bg-red-950/40 border-red-500/40 text-red-300"
              : "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
          }`}
        >
          {toastMessage.isError ? <AlertCircle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 font-mono text-xs">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-black/50 p-1 rounded border border-zinc-800">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1 rounded transition-colors ${
              statusFilter === "ALL"
                ? "bg-cyan-500 text-black font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Tất cả ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("Pending")}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              statusFilter === "Pending"
                ? "bg-amber-500 text-black font-bold"
                : "text-amber-300/80 hover:text-amber-200"
            }`}
          >
            <span className="size-1.5 rounded-full bg-amber-400"></span>
            Đang chờ ({counts.pending})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("Active")}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              statusFilter === "Active"
                ? "bg-emerald-500 text-black font-bold"
                : "text-emerald-300/80 hover:text-emerald-200"
            }`}
          >
            <span className="size-1.5 rounded-full bg-emerald-400"></span>
            Đã kích hoạt ({counts.active})
          </button>
          {counts.revoked > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter("Revoked")}
              className={`px-3 py-1 rounded transition-colors ${
                statusFilter === "Revoked"
                  ? "bg-zinc-700 text-white font-bold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Đã thu hồi ({counts.revoked})
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Tìm theo email, tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-black/60 border border-zinc-700 rounded text-xs text-white placeholder:text-zinc-500 focus:border-cyan-400 outline-none"
          />
        </div>
      </div>

      {/* Table of Invitations */}
      {filteredRecords.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-zinc-800 rounded bg-black/20 font-mono text-xs text-zinc-400">
          Chưa có nhật ký gửi lời mời nào cho sự kiện này hoặc không có kết quả phù hợp bộ lọc.
        </div>
      ) : (
        <div className="overflow-x-auto border border-zinc-800 rounded">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-[#10171a] text-zinc-400 uppercase text-[10px]">
                <th className="p-3">Người Nhận / Email</th>
                <th className="p-3">Vai Trò &amp; Hạng Mục</th>
                <th className="p-3">Trạng Thái</th>
                <th className="p-3">Thời Gian Gửi</th>
                <th className="p-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 bg-black/30">
              {filteredRecords.map((rec) => {
                const isResending = resendingId === rec.id;
                const isRevoking = revokingId === rec.id;

                return (
                  <tr key={rec.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-300 text-xs border border-zinc-700 shrink-0">
                          {rec.fullName ? rec.fullName.charAt(0).toUpperCase() : rec.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate max-w-xs">{rec.fullName}</div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-1 truncate max-w-xs">
                            <Mail className="size-3 shrink-0" />
                            {rec.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex flex-col gap-1 items-start">
                        {renderRoleBadge(rec.roleName)}
                        {rec.trackName && (
                          <span className="text-[10px] text-cyan-300/80 bg-cyan-950/30 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                            Track: {rec.trackName}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      {renderStatusBadge(rec.status)}
                      {rec.reason && (
                        <div className="text-[10px] text-red-400 mt-1 max-w-[200px] leading-tight" title={rec.reason}>
                          ⚠️ Lý do: {rec.reason}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-[11px] text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Clock className="size-3 shrink-0 text-zinc-500" />
                        <span>{formatTime(rec.invitedAt)}</span>
                      </div>
                      {rec.respondedAt && (
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          Cập nhật: {formatTime(rec.respondedAt)}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {rec.status === "Pending" && (
                          <button
                            type="button"
                            onClick={() => handleResend(rec)}
                            disabled={isResending}
                            className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-[11px] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Gửi lại thư mời qua email"
                          >
                            <Send className="size-3" />
                            <span>{isResending ? "Đang gửi..." : "Gửi lại"}</span>
                          </button>
                        )}

                        {rec.status === "Active" && (
                          <button
                            type="button"
                            onClick={() => handleRevoke(rec)}
                            disabled={isRevoking}
                            className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-mono text-[11px] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Thu hồi vai trò này"
                          >
                            <Trash2 className="size-3" />
                            <span>{isRevoking ? "Đang gỡ..." : "Thu hồi"}</span>
                          </button>
                        )}

                        {(rec.status === "Revoked" || rec.status === "Declined") && (
                          <button
                            type="button"
                            onClick={() => handleDelete(rec.id, rec.email)}
                            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-mono text-[10px] transition-colors cursor-pointer"
                            title="Xóa khỏi lịch sử"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
