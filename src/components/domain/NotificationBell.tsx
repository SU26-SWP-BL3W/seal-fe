import { useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useMyInvitations, type MyInvitationItem } from "@/repositories/usersRepository";
import { useAcceptOrDeclineInvitation } from "@/repositories/teamsRepository";
import { useRespondEventRoleInvitation } from "@/repositories/eventRolesRepository";
import { useMyNotifications, useMarkNotificationRead } from "@/repositories/notificationsRepository";
import { Check, X, ExternalLink, RefreshCw } from "lucide-react";

interface NotificationBellProps {
  align?: "left" | "right";
}

export function NotificationBell({ align = "left" }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: invData, isLoading, refetch } = useMyInvitations();
  const { data: systemNotifs = [], isLoading: isLoadingNotifs, refetch: refetchNotifs } = useMyNotifications();
  const { mutateAsync: markRead } = useMarkNotificationRead();
  const invitations = invData?.invitations ?? [];
  const pendingInvitations = invitations.filter((i) => i.status === "PendingAccept");
  const unreadNotifs = systemNotifs.filter((n) => !n.isRead);
  const unreadCount = (invData?.totalPending ?? pendingInvitations.length) + unreadNotifs.length;

  const { mutateAsync: respondTeam, isPending: isRespondingTeam } = useAcceptOrDeclineInvitation();
  const { mutateAsync: respondEventRole, isPending: isRespondingEventRole } = useRespondEventRoleInvitation();
  const isResponding = isRespondingTeam || isRespondingEventRole;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRespond = async (inv: MyInvitationItem, isAccepted: boolean) => {
    try {
      if (inv.type === "TEAM") {
        await respondTeam({ invitationId: inv.invitationId, isAccepted });
      } else {
        await respondEventRole({ invitationId: inv.invitationId, isAccepted });
      }
    } catch {
      alert("Không thể xử lý lời mời — vui lòng thử lại.");
    } finally {
      refetch();
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* ── Bell Icon Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 hud-clipped transition-all border ${
          isOpen
            ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shadow-[0_0_12px_rgba(0,217,255,0.2)]"
            : "border-[var(--border-muted)] bg-[var(--bg-input)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60"
        }`}
        title="Thông Báo In-App"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Red Neon Badge Counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-danger)] font-mono text-[9px] font-extrabold text-white animate-pulse shadow-[0_0_8px_#EF4444]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* ── Notifications HUD Popover Panel ── */}
      {isOpen && (
        <div
          className={`bg-[var(--bg-panel)] border border-[var(--accent-primary)]/50 shadow-2xl hud-clipped z-[100] overflow-hidden flex flex-col font-mono text-xs animate-in fade-in zoom-in-95 duration-150 ${
            align === "right"
              ? "absolute right-0 top-full mt-2 w-80 md:w-96"
              : "fixed left-4 top-16 md:left-6 md:top-14 w-80 md:w-96"
          }`}
        >
          
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-[var(--bg-base)] border-b border-[var(--border-muted)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
              <span className="font-bold text-[var(--accent-primary)] tracking-wider uppercase text-[11px]">
                LỜI MỜI & THÔNG BÁO ({unreadCount})
              </span>
            </div>
            <button
              onClick={() => { refetch(); refetchNotifs(); }}
              className="text-[10px] text-[var(--text-muted)] hover:text-white flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Làm mới
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border-muted)]/60">
            {isLoading || isLoadingNotifs ? (
              <div className="p-6 text-center text-[var(--text-muted)] flex justify-center items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent-primary)]" />
                Đang tải thông báo...
              </div>
            ) : pendingInvitations.length === 0 && systemNotifs.length === 0 ? (
              <div className="p-6 text-center text-[var(--text-muted)] italic">
                Không có lời mời hoặc thông báo mới
              </div>
            ) : (
              <>
              {pendingInvitations.map((item) => (
                <div
                  key={item.invitationId}
                  className="p-3 flex flex-col gap-1.5 bg-[var(--accent-primary)]/5 hover:bg-[var(--bg-input)]/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                      <span className="font-bold text-[var(--text-primary)] text-xs">
                        {item.type === "TEAM" ? "Lời Mời Vào Đội Thi" : `Lời Mời Vai Trò: ${item.role || "Staff"}`}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--accent-team)] font-bold">
                      {item.targetName}
                    </span>
                  </div>

                  <p className="font-sans text-xs text-[var(--text-muted)] leading-relaxed">
                    {item.inviterName ? `${item.inviterName} đã gửi lời mời bạn tham gia.` : "Bạn nhận được lời mời mới."}
                  </p>

                  <div className="flex items-center gap-2 pt-1 font-mono text-[10px]">
                    <button
                      disabled={isResponding}
                      onClick={() => handleRespond(item, true)}
                      className="px-2.5 py-1 bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/40 font-bold uppercase hover:bg-[var(--color-success)] hover:text-black transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      <Check className="w-3 h-3" /> ĐỒNG Ý
                    </button>
                    <button
                      disabled={isResponding}
                      onClick={() => handleRespond(item, false)}
                      className="px-2.5 py-1 bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/30 font-bold uppercase hover:bg-[var(--color-danger)] hover:text-white transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      <X className="w-3 h-3" /> TỪ CHỐI
                    </button>
                  </div>
                </div>
              ))}
              {systemNotifs.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 flex flex-col gap-1 ${n.isRead ? "opacity-60" : "bg-[var(--accent-primary)]/5"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[var(--text-primary)] text-xs">{n.title}</span>
                    {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shrink-0" />}
                  </div>
                  <p className="font-sans text-xs text-[var(--text-muted)] leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-2 pt-1">
                    {n.linkUrl && (
                      n.linkUrl.startsWith("http") ? (
                        <a href={n.linkUrl} className="text-[10px] text-[var(--accent-primary)] font-bold hover:underline">Mở</a>
                      ) : (
                        <Link href={n.linkUrl} onClick={() => { if (!n.isRead) markRead(n.id); setIsOpen(false); }} className="text-[10px] text-[var(--accent-primary)] font-bold hover:underline">
                          Xem chi tiết
                        </Link>
                      )
                    )}
                    {!n.isRead && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="text-[10px] text-[var(--text-muted)] hover:text-white uppercase"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                </div>
              ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 text-center bg-[var(--bg-base)] border-t border-[var(--border-muted)] flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)] font-mono">Tự động đồng bộ</span>
            <Link
              href="/my-invitations"
              onClick={() => setIsOpen(false)}
              className="text-[10px] text-[var(--accent-primary)] font-bold hover:underline flex items-center gap-1"
            >
              Mở trung tâm lời mời <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
