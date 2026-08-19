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

  // 1. Ban Tổ Chức phê duyệt đội thi
  if (
    tLower.includes("phê duyệt") ||
    tLower.includes("được duyệt") ||
    tLower.includes("approved") ||
    mLower.includes("được phê duyệt") ||
    mLower.includes("chính thức tham gia")
  ) {
    return {
      title: "🏆 Ban Tổ Chức đã phê duyệt đội thi!",
      message: rawMessage || "Chúc mừng! Đội thi của bạn đã được Ban Tổ Chức phê duyệt chính thức tham gia giải đấu. Cổng nộp bài thi đã được mở.",
      badgeText: "ĐÃ DUYỆT ĐỘI",
      badgeClass: "bg-emerald-950/40 text-emerald-300 border-emerald-500/30",
    };
  }

  // 2. Ban Tổ Chức từ chối / trả hồ sơ đội thi
  if (
    tLower.includes("từ chối đơn") ||
    tLower.includes("trả hồ sơ") ||
    mLower.includes("lý do từ chối") ||
    mLower.includes("không được duyệt") ||
    mLower.includes("bị từ chối")
  ) {
    return {
      title: "⚠️ Ban Tổ Chức từ chối / trả hồ sơ đội",
      message: rawMessage || "Hồ sơ ghi danh của đội chưa đạt yêu cầu. Vui lòng vào trang Đội thi để xem lý do chi tiết từ BTC.",
      badgeText: "TRẢ HỒ SƠ",
      badgeClass: "bg-rose-950/40 text-rose-300 border-rose-500/30",
    };
  }

  // 3. Đã gửi hồ sơ ghi danh tới BTC
  if (tLower.includes("ghi danh") || mLower.includes("chờ ban tổ chức") || mLower.includes("chờ btc")) {
    return {
      title: "📋 Đã gửi hồ sơ ghi danh tới Ban Tổ Chức",
      message: rawMessage || "Hồ sơ đội đã được gửi thành công. Ban Tổ Chức đang tiến hành thẩm định sĩ số và thẻ sinh viên.",
      badgeText: "ĐANG THẨM ĐỊNH",
      badgeClass: "bg-sky-950/40 text-sky-300 border-sky-500/30",
    };
  }

  // 4. Biên nhận nộp bài thi
  if (tLower.includes("nộp bài") || tLower.includes("submission") || mLower.includes("đã nộp bài") || mLower.includes("biên nhận")) {
    return {
      title: "📤 Biên nhận nộp bài thi thành công",
      message: rawMessage || "Hệ thống đã ghi nhận bài thi của đội bạn và gửi email biên nhận tới các thành viên.",
      badgeText: "BÀI THI",
      badgeClass: "bg-cyan-950/40 text-cyan-300 border-cyan-500/30",
    };
  }

  // 5. Kết quả chấm điểm bài thi được công bố
  if (
    tLower.includes("kết quả chấm") ||
    tLower.includes("công bố điểm") ||
    tLower.includes("điểm thi") ||
    mLower.includes("kết quả chấm điểm") ||
    mLower.includes("công bố điểm")
  ) {
    return {
      title: "📊 Kết quả chấm điểm đã được công bố!",
      message: rawMessage || "Ban Giám Khảo đã công bố bảng điểm và nhận xét cho bài thi của đội bạn. Hãy vào xem chi tiết.",
      badgeText: "ĐIỂM THI",
      badgeClass: "bg-purple-950/40 text-purple-300 border-purple-500/30",
    };
  }

  // 6. Phúc khảo được duyệt / Chấp nhận
  if (
    tLower.includes("chấp nhận phúc khảo") ||
    tLower.includes("phúc khảo thành công") ||
    mLower.includes("chấp nhận đơn phúc khảo") ||
    mLower.includes("cập nhật điểm phúc khảo")
  ) {
    return {
      title: "✅ Kết quả phúc khảo: Đã chấp nhận & cập nhật điểm",
      message: rawMessage || "Ban Tổ Chức đã chấp nhận đơn phúc khảo của đội bạn và cập nhật lại điểm số chính thức.",
      badgeText: "PHÚC KHẢO",
      badgeClass: "bg-emerald-950/40 text-emerald-300 border-emerald-500/30",
    };
  }

  // 7. Phúc khảo bị từ chối
  if (
    tLower.includes("từ chối phúc khảo") ||
    mLower.includes("từ chối đơn phúc khảo") ||
    mLower.includes("giữ nguyên kết quả")
  ) {
    return {
      title: "❌ Kết quả phúc khảo: Giữ nguyên điểm số",
      message: rawMessage || "Ban Tổ Chức đã xem xét và giữ nguyên kết quả chấm điểm ban đầu kèm giải trình chi tiết.",
      badgeText: "TỪ CHỐI",
      badgeClass: "bg-rose-950/40 text-rose-300 border-rose-500/30",
    };
  }

  // 8. Đã gửi đơn phúc khảo
  if (
    tLower.includes("đơn phúc khảo") ||
    mLower.includes("gửi đơn phúc khảo") ||
    mLower.includes("tiếp nhận phúc khảo")
  ) {
    return {
      title: "⚖️ Đơn phúc khảo điểm thi đã được tiếp nhận",
      message: rawMessage || "Đơn phúc khảo của bạn đã được chuyển tới Ban Tổ Chức để xem xét.",
      badgeText: "PHÚC KHẢO",
      badgeClass: "bg-amber-950/40 text-amber-300 border-amber-500/30",
    };
  }

  // 5. Thành viên mới tham gia / đồng ý vào đội
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

  // 6. Lời mời bị từ chối / không tham gia
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

  // 7. Bạn đã đồng ý gia nhập đội / Vào đội thành công
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

  // 8. Lời mời mới vào đội
  if (tLower.includes("lời mời") || mLower.includes("mời bạn tham gia")) {
    return {
      title: rawTitle || "📩 Lời mời tham gia đội thi",
      message: rawMessage,
      badgeText: "LỜI MỜI",
      badgeClass: "bg-sky-950/40 text-sky-300 border-sky-500/30",
    };
  }

  // 9. Yêu cầu xin gia nhập đội
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
        if (invType === "TEAM" || invType === "TEAM_MEMBER") {
          toast.success(`🎉 Chúc mừng! Bạn đã chính thức gia nhập đội "${targetName}". Hãy cùng đồng đội hoàn thiện bài thi thật tốt nhé!`);
        } else if (inv.role === "Judge") {
          toast.success(`🎉 Bạn đã nhận vai trò Ban Giám Khảo sự kiện "${targetName}". Bàn chấm điểm đã sẵn sàng!`);
        } else if (inv.role === "Mentor") {
          toast.success(`🎉 Bạn đã nhận vai trò Cố Vấn Chuyên Môn sự kiện "${targetName}". Bàn cố vấn đã sẵn sàng!`);
        } else {
          toast.success(`🎉 Bạn đã nhận vai trò Cán Bộ Điều Phối sự kiện "${targetName}".`);
        }
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

  const formatRoleLabel = (role?: string) => {
    switch (role) {
      case "Coordinator":
      case "EventCoordinator":
        return "Cán Bộ Điều Phối (Coordinator)";
      case "Judge":
        return "Ban Giám Khảo (Judge)";
      case "Mentor":
        return "Cố Vấn Chuyên Môn (Mentor)";
      default:
        return role || "Cán Bộ Sự Kiện";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded hover:bg-[var(--bg-input)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
        aria-label="Thông báo"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded border border-[var(--border-muted)] bg-[var(--bg-panel)] shadow-2xl z-50 overflow-hidden font-mono text-xs animate-in fade-in zoom-in-95 duration-100">
          <div className="p-3 border-b border-[var(--border-muted)] flex items-center justify-between bg-[var(--bg-input)]/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-[11px]">
                [ TRUNG TÂM THÔNG BÁO ]
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-primary)] text-black">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                refetch();
                refetchNotifs();
              }}
              className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading || isLoadingNotifs ? "animate-spin" : ""}`} /> Làm mới
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
                        {item.type === "TEAM" ? "📩 Lời Mời Vào Đội (Từ Đội Trưởng)" : `🎖️ Lời Mời: ${formatRoleLabel(item.role)}`}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--accent-team)] font-bold">
                      {item.targetName}
                    </span>
                  </div>

                  <p className="font-sans text-xs text-[var(--text-muted)] leading-relaxed">
                    {item.type === "TEAM"
                      ? item.inviterName
                        ? `Đội trưởng ${item.inviterName} đã gửi lời mời bạn gia nhập đội thi "${item.targetName}". Nhấn "Đồng ý" để chính thức vào đội ngay!`
                        : `Bạn nhận được lời mời gia nhập đội thi "${item.targetName}" từ Đội trưởng. Nhấn "Đồng ý" để chính thức vào đội ngay!`
                      : item.inviterName
                      ? `Ban Tổ Chức (${item.inviterName}) đã gửi lời mời bạn đảm nhiệm vai trò ${formatRoleLabel(item.role)} cho sự kiện "${item.targetName}"${item.trackName ? ` (Hạng mục: ${item.trackName})` : ""}.`
                      : `Ban Tổ Chức đã gửi lời mời bạn đảm nhiệm vai trò ${formatRoleLabel(item.role)} cho sự kiện "${item.targetName}"${item.trackName ? ` (Hạng mục: ${item.trackName})` : ""}.`}
                  </p>

                  <div className="flex items-center gap-2 pt-1 font-mono text-[10px]">
                    <button
                      disabled={isResponding}
                      onClick={() => handleRespond(item, true)}
                      className="px-2.5 py-1 bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/40 font-bold uppercase hover:bg-[var(--color-success)] hover:text-black transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      <Check className="w-3 h-3" /> {item.type === "TEAM" ? "ĐỒNG Ý VÀO ĐỘI" : "ĐỒNG Ý NHẬN VAI TRÒ"}
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
