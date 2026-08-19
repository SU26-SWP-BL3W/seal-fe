import { useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { useMyInvitations, type MyInvitationItem } from "@/repositories/usersRepository";
import { useAcceptOrDeclineInvitation } from "@/repositories/teamsRepository";
import { useRespondEventRoleInvitation } from "@/repositories/eventRolesRepository";
import { useMyNotifications, useMarkNotificationRead } from "@/repositories/notificationsRepository";
import { useToast } from "@/providers/ToastProvider";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X, ExternalLink, RefreshCw, Bell, UserPlus, UserCheck, UserX, AlertCircle } from "lucide-react";

interface NotificationBellProps {
  align?: "left" | "right";
}

function formatNotificationContent(rawTitle: string, rawMessage: string, type?: string) {
  const tLower = (rawTitle || "").toLowerCase();
  const mLower = (rawMessage || "").toLowerCase();

  // 1. Thành viên mới tham gia / đồng ý vào đội
  if (
    tLower.includes("thành viên đã tham gia") ||
    tLower.includes("đã tham gia") ||
    tLower.includes("joined") ||
    mLower.includes("đã đồng ý vào đội") ||
    mLower.includes("đã tham gia đội")
  ) {
    return {
      title: "🎉 Thành viên mới gia nhập đội",
      message: rawMessage.replace(/Một thành viên đã đồng ý vào đội (.*)\./i, "Thí sinh đã đồng ý lời mời và chính thức gia nhập đội $1."),
      badgeText: "THÀNH VIÊN MỚI",
      badgeClass: "bg-emerald-950/40 text-emerald-300 border-emerald-500/30",
    };
  }

  // 2. Lời mời bị từ chối / không tham gia
  if (
    tLower.includes("từ chối") ||
    tLower.includes("declined") ||
    tLower.includes("rejected") ||
    mLower.includes("từ chối lời mời") ||
    mLower.includes("không đồng ý")
  ) {
    return {
      title: "❌ Lời mời tham gia bị từ chối",
      message: rawMessage || "Một thí sinh đã từ chối lời mời tham gia đội thi.",
      badgeText: "TỪ CHỐI",
      badgeClass: "bg-rose-950/40 text-rose-300 border-rose-500/30",
    };
  }

  // 3. Bạn đã đồng ý gia nhập đội / Vào đội thành công
  if (
    tLower.includes("gia nhập thành công") ||
    tLower.includes("bạn đã vào đội") ||
    mLower.includes("bạn đã trở thành thành viên")
  ) {
    return {
      title: "🏆 Gia nhập đội thi thành công",
      message: rawMessage || "Bạn đã chính thức gia nhập đội thi. Chúc bạn và đồng đội đạt thành tích xuất sắc!",
      badgeText: "VÀO ĐỘI",
      badgeClass: "bg-cyan-950/40 text-cyan-300 border-cyan-500/30",
    };
  }

  // 4. Lời mời mới vào đội
  if (tLower.includes("lời mời") || mLower.includes("mời bạn tham gia")) {
    return {
      title: rawTitle || "📩 Lời mời tham gia đội thi",
      message: rawMessage,
      badgeText: "LỜI MỜI",
      badgeClass: "bg-sky-950/40 text-sky-300 border-sky-500/30",
    };
  }

  // 5. Yêu cầu xin gia nhập đội
  if (tLower.includes("yêu cầu") || mLower.includes("xin gia nhập") || mLower.includes("yêu cầu tham gia")) {
    return {
      title: "🙋 Yêu cầu xin gia nhập đội thi",
      message: rawMessage,
      badgeText: "YÊU CẦU",
      badgeClass: "bg-amber-950/40 text-amber-300 border-amber-500/30",
    };
  }

  // Default fallback:
  return {
    title: rawTitle || "Thông báo hệ thống",
    message: rawMessage,
    badgeText: "HỆ THỐNG",
    badgeClass: "bg-zinc-900 text-zinc-300 border-zinc-700",
  };
}

export function NotificationBell({ align = "left" }: NotificationBellProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const isAuthed = !!user;

  const { data: invData, isLoading, refetch } = useMyInvitations(isAuthed);
  const { data: systemNotifs = [], isLoading: isLoadingNotifs, refetch: refetchNotifs } = useMyNotifications(isAuthed);
  const { mutateAsync: markRead } = useMarkNotificationRead();
  const invitations = invData?.invitations ?? [];
  const pendingInvitations = invitations.filter((i) => i.status === "PendingAccept" || (i as any).Status === "PendingAccept");
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

  const handleRespond = async (inv: MyInvitationItem | any, isAccepted: boolean) => {
    const invId = inv.invitationId || inv.InvitationId || inv.id || inv.Id;
    const invType = String(inv.type || inv.Type || "TEAM").toUpperCase();
    const targetName = inv.targetName || inv.TargetName || "đội thi";

    if (!invId) {
      toast.error("Không tìm thấy mã định danh lời mời.");
      return;
    }

    try {
      if (invType === "TEAM" || invType === "TEAM_MEMBER") {
        await respondTeam({ invitationId: invId, isAccepted });
      } else {
        await respondEventRole({ invitationId: invId, isAccepted });
      }

      if (isAccepted) {
        toast.success(`🎉 Chúc mừng! Bạn đã chính thức gia nhập "${targetName}". Hãy cùng đồng đội hoàn thiện bài thi thật tốt nhé!`);
        queryClient.invalidateQueries({ queryKey: ["my-team"] });
        queryClient.invalidateQueries({ queryKey: ["myTeam"] });
        queryClient.invalidateQueries({ queryKey: ["eventRoles"] });
        queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
        queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      } else {
        toast.info(`Bạn đã từ chối lời mời tham gia "${targetName}".`);
        queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
        queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
      }
    } catch (err: any) {
      const rawMsg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Không thể xử lý lời mời — vui lòng thử lại.";

      const isProfileErr =
        rawMsg.toLowerCase().includes("profile") ||
        rawMsg.toLowerCase().includes("hồ sơ") ||
        rawMsg.toLowerCase().includes("school") ||
        rawMsg.toLowerCase().includes("student");

      const msg = isProfileErr && isAccepted
        ? "Bạn cần hoàn tất cập nhật hồ sơ cá nhân trước khi đồng ý tham gia đội thi."
        : rawMsg;

      toast.error(msg);
    } finally {
      refetch();
      refetchNotifs();
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
                  className="p-3.5 flex flex-col gap-1.5 bg-[var(--accent-primary)]/5 hover:bg-[var(--bg-input)]/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                      <span className="font-bold text-[var(--text-primary)] text-xs">
                        {item.type === "TEAM" ? "📩 Lời Mời Gia Nhập Đội Thi" : `📩 Lời Mời Vai Trò: ${item.role || "Staff"}`}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--accent-team)] font-bold">
                      {item.targetName}
                    </span>
                  </div>

                  <p className="font-sans text-xs text-[var(--text-muted)] leading-relaxed">
                    {item.inviterName
                      ? `${item.inviterName} đã gửi lời mời bạn gia nhập đội thi.`
                      : "Bạn nhận được một lời mời tham gia mới."}
                  </p>

                  <div className="flex items-center gap-2 pt-1 font-mono text-[10px]">
                    <button
                      disabled={isResponding}
                      onClick={() => handleRespond(item, true)}
                      className="px-2.5 py-1 bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/40 font-bold uppercase hover:bg-[var(--color-success)] hover:text-black transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      <Check className="w-3 h-3" /> ĐỒNG Ý
                    </button>
                    <button
                      disabled={isResponding}
                      onClick={() => handleRespond(item, false)}
                      className="px-2.5 py-1 bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/30 font-bold uppercase hover:bg-[var(--color-danger)] hover:text-white transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      <X className="w-3 h-3" /> TỪ CHỐI
                    </button>
                  </div>
                </div>
              ))}
              {systemNotifs.map((n) => {
                const formatted = formatNotificationContent(n.title, n.message, n.type);
                return (
                  <div
                    key={n.id}
                    className={`p-3.5 flex flex-col gap-1.5 transition-colors ${
                      n.isRead ? "opacity-60 bg-transparent" : "bg-[var(--accent-primary)]/5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${formatted.badgeClass}`}>
                          {formatted.badgeText}
                        </span>
                        <span className="font-bold text-[var(--text-primary)] text-xs">{formatted.title}</span>
                      </div>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] shrink-0 animate-pulse" />
                      )}
                    </div>
                    <p className="font-sans text-xs text-[var(--text-muted)] leading-relaxed">{formatted.message}</p>
                    <div className="flex items-center justify-between pt-1 font-mono text-[10px]">
                      <div className="flex items-center gap-2">
                        {n.linkUrl ? (
                          n.linkUrl.startsWith("http") ? (
                            <a
                              href={n.linkUrl}
                              className="text-[var(--accent-primary)] font-bold hover:underline"
                            >
                              [ ↗ Mở liên kết ]
                            </a>
                          ) : (
                            <Link
                              href={n.linkUrl}
                              onClick={() => {
                                if (!n.isRead) markRead(n.id);
                                setIsOpen(false);
                              }}
                              className="text-[var(--accent-primary)] font-bold hover:underline"
                            >
                              [ Xem chi tiết ]
                            </Link>
                          )
                        ) : (
                          <Link
                            href="/my-team"
                            onClick={() => {
                              if (!n.isRead) markRead(n.id);
                              setIsOpen(false);
                            }}
                            className="text-[var(--accent-primary)] font-bold hover:underline"
                          >
                            [ Xem đội thi ]
                          </Link>
                        )}
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={() => markRead(n.id)}
                          className="text-zinc-500 hover:text-white uppercase transition-colors cursor-pointer"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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
