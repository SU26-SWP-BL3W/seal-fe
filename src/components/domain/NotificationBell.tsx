import { useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { useMyInvitations, type MyInvitationItem } from "@/repositories/usersRepository";
import { useAcceptOrDeclineInvitation } from "@/repositories/teamsRepository";
import { useRespondEventRoleInvitation } from "@/repositories/eventRolesRepository";
import {
  useMyNotifications,
  useMarkNotificationRead,
  pushSystemNotification,
  type SystemNotification,
} from "@/repositories/shared/notificationsRepository";
import { useToast } from "@/providers/ToastProvider";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X, ExternalLink, RefreshCw, Bell, UserPlus, UserCheck, UserX, AlertCircle } from "lucide-react";

interface NotificationBellProps {
  align?: "left" | "right" | "sidebar";
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
      title: "Ban Tổ Chức đã phê duyệt đội thi!",
      message: rawMessage || "Chúc mừng! Đội thi của bạn đã được Ban Tổ Chức phê duyệt chính thức tham gia giải đấu. Cổng nộp bài thi đã được mở.",
      badgeText: "ĐÃ DUYỆT ĐỘI",
      badgeClass: "bg-emerald-950/40 text-emerald-300 border-emerald-500/30",
    };
  }

  // 2. Ban Tổ Chức loại đội khỏi cuộc thi (Disqualified)
  if (
    tLower.includes("loại đội") ||
    tLower.includes("bị loại") ||
    tLower.includes("disqualified") ||
    mLower.includes("bị loại khỏi cuộc thi") ||
    mLower.includes("loại khỏi giải đấu")
  ) {
    return {
      title: "Quyết định: Loại đội thi khỏi cuộc thi",
      message: rawMessage || "Đội thi của bạn đã bị Ban Tổ Chức loại khỏi cuộc thi do vi phạm quy chế. Vui lòng liên hệ BTC để biết thêm chi tiết.",
      badgeText: "BỊ LOẠI",
      badgeClass: "bg-red-950/60 text-red-300 border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.3)]",
    };
  }

  // 3. Ban Tổ Chức từ chối / trả hồ sơ đội thi
  if (
    tLower.includes("từ chối đơn") ||
    tLower.includes("trả hồ sơ") ||
    mLower.includes("lý do từ chối") ||
    mLower.includes("không được duyệt") ||
    mLower.includes("bị từ chối")
  ) {
    return {
      title: "Ban Tổ Chức từ chối / trả hồ sơ đội",
      message: rawMessage || "Hồ sơ ghi danh của đội chưa đạt yêu cầu. Vui lòng vào trang Đội thi để xem lý do chi tiết từ BTC.",
      badgeText: "TRẢ HỒ SƠ",
      badgeClass: "bg-rose-950/40 text-rose-300 border-rose-500/30",
    };
  }

  // 3. Đã gửi hồ sơ ghi danh tới BTC
  if (tLower.includes("ghi danh") || mLower.includes("chờ ban tổ chức") || mLower.includes("chờ btc")) {
    return {
      title: "Đã gửi hồ sơ ghi danh tới Ban Tổ Chức",
      message: rawMessage || "Hồ sơ đội đã được gửi thành công. Ban Tổ Chức đang tiến hành thẩm định sĩ số và thẻ sinh viên.",
      badgeText: "ĐANG THẨM ĐỊNH",
      badgeClass: "bg-sky-950/40 text-sky-300 border-sky-500/30",
    };
  }

  // 4. Biên nhận nộp bài thi
  if (tLower.includes("nộp bài") || tLower.includes("submission") || mLower.includes("đã nộp bài") || mLower.includes("biên nhận")) {
    return {
      title: "Biên nhận nộp bài thi thành công",
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
      title: "Kết quả chấm điểm đã được công bố!",
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
      title: "Kết quả phúc khảo: Đã chấp nhận & cập nhật điểm",
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
      title: "Kết quả phúc khảo: Giữ nguyên điểm số",
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
      title: "Đơn phúc khảo điểm thi đã được tiếp nhận",
      message: rawMessage || "Đơn phúc khảo của bạn đã được chuyển tới Ban Tổ Chức để xem xét.",
      badgeText: "PHÚC KHẢO",
      badgeClass: "bg-amber-950/40 text-amber-300 border-amber-500/30",
    };
  }

  // 9. Đạt Giải Thưởng & Vinh Danh
  if (
    tLower.includes("giải thưởng") ||
    tLower.includes("đạt giải") ||
    tLower.includes("quán quân") ||
    tLower.includes("á quân") ||
    tLower.includes("chúc mừng đạt giải") ||
    mLower.includes("đạt giải") ||
    mLower.includes("giải nhất") ||
    mLower.includes("giải nhì") ||
    mLower.includes("giải ba") ||
    mLower.includes("giải thưởng")
  ) {
    return {
      title: "Chúc mừng! Đội của bạn đã đạt giải thưởng chung cuộc!",
      message: rawMessage || "Chúc mừng đội thi của bạn đã xuất sắc giành giải thưởng tại giải đấu! Ban Tổ Chức đã gửi email chúc mừng và hướng dẫn nhận giải.",
      badgeText: "GIẢI THƯỞNG",
      badgeClass: "bg-amber-950/50 text-amber-300 border-amber-400/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]",
    };
  }

  // 10. Công bố kết quả chung cuộc
  if (
    tLower.includes("kết quả chung cuộc") ||
    tLower.includes("bảng vinh danh") ||
    mLower.includes("kết quả chung cuộc") ||
    mLower.includes("bảng vàng")
  ) {
    return {
      title: "Công bố kết quả chung cuộc & Bảng vinh danh",
      message: rawMessage || "Ban Tổ Chức đã chính thức công bố bảng xếp hạng tổng và vinh danh các đội thi xuất sắc nhất giải đấu.",
      badgeText: "CHUNG CUỘC",
      badgeClass: "bg-yellow-950/40 text-yellow-300 border-yellow-500/30",
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
      title: "Thành viên mới gia nhập đội",
      message: rawMessage.replace(/Một thành viên đã đồng ý vào đội (.*)\./i, "Thí sinh đã đồng ý lời mời và chính thức gia nhập đội $1."),
      badgeText: "THÀNH VIÊN MỚI",
      badgeClass: "bg-emerald-950/40 text-emerald-300 border-emerald-500/30",
    };
  }

  // Thu hồi vai trò nhân sự (Có lý do đính kèm)
  if (
    tLower.includes("thu hồi") ||
    mLower.includes("thu hồi vai trò") ||
    mLower.includes("bị thu hồi") ||
    mLower.includes("quyết định thu hồi")
  ) {
    return {
      title: "Quyết định: Thu hồi vai trò sự kiện",
      message: rawMessage,
      badgeText: "THU HỒI VAI TRÒ",
      badgeClass: "bg-red-950/60 text-red-300 border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.3)]",
    };
  }

  // Mời đảm nhiệm vai trò
  if (
    tLower.includes("mời làm") ||
    tLower.includes("phân công vai trò") ||
    mLower.includes("mời bạn làm") ||
    mLower.includes("được mời làm")
  ) {
    return {
      title: "Lời mời đảm nhận vai trò sự kiện",
      message: rawMessage,
      badgeText: "MỜI VAI TRÒ",
      badgeClass: "bg-cyan-950/40 text-cyan-300 border-cyan-500/30",
    };
  }

  // Nhân sự đã đồng ý nhận vai trò
  if (
    tLower.includes("nhận vai trò") ||
    tLower.includes("đồng ý nhận vai trò") ||
    mLower.includes("đã đồng ý nhận vai trò") ||
    mLower.includes("chính thức đảm nhiệm vai trò")
  ) {
    return {
      title: "Nhân sự đã đồng ý nhận vai trò",
      message: rawMessage,
      badgeText: "ĐÃ NHẬN VAI TRÒ",
      badgeClass: "bg-emerald-950/40 text-emerald-300 border-emerald-500/30",
    };
  }

  if (
    tLower.includes("từ chối") ||
    tLower.includes("declined") ||
    tLower.includes("rejected") ||
    mLower.includes("từ chối lời mời") ||
    mLower.includes("không đồng ý")
  ) {
    return {
      title: "Lời mời tham gia bị từ chối",
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
      title: "Gia nhập đội thi thành công",
      message: rawMessage || "Bạn đã chính thức gia nhập đội thi. Chúc bạn và đồng đội đạt thành tích xuất sắc!",
      badgeText: "VÀO ĐỘI",
      badgeClass: "bg-cyan-950/40 text-cyan-300 border-cyan-500/30",
    };
  }

  // 8. Giải thưởng & Thư chúc mừng
  if (tLower.includes("giải thưởng") || tLower.includes("chúc mừng") || mLower.includes("đạt giải") || mLower.includes("thư chúc mừng")) {
    return {
      title: rawTitle || "Thư chúc mừng đạt giải thưởng",
      message: rawMessage,
      badgeText: "GIẢI THƯỞNG",
      badgeClass: "bg-amber-950/60 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]",
    };
  }

  // 9. Nộp bài thi
  if (tLower.includes("nộp bài") || mLower.includes("nộp bài thành công") || mLower.includes("bài nộp mới")) {
    return {
      title: rawTitle || "Bài nộp sự kiện",
      message: rawMessage,
      badgeText: "BÀI NỘP",
      badgeClass: "bg-sky-950/40 text-sky-300 border-sky-500/30",
    };
  }

  // 10. Chấm điểm bài thi
  if (tLower.includes("chấm điểm") || mLower.includes("chấm điểm bài thi") || mLower.includes("bảng điểm")) {
    return {
      title: rawTitle || "Chấm điểm bài thi",
      message: rawMessage,
      badgeText: "CHẤM ĐIỂM",
      badgeClass: "bg-emerald-950/40 text-emerald-300 border-emerald-500/30",
    };
  }

  // 11. Phúc khảo bài thi
  if (tLower.includes("phúc khảo") || mLower.includes("đơn phúc khảo")) {
    return {
      title: rawTitle || "Đơn phúc khảo",
      message: rawMessage,
      badgeText: "PHÚC KHẢO",
      badgeClass: "bg-cyan-950/40 text-cyan-300 border-cyan-500/30",
    };
  }

  // 12. Lời khuyên & Nhận xét Cố vấn
  if (tLower.includes("cố vấn") || mLower.includes("nhận xét bài thi") || mLower.includes("lời khuyên kỹ thuật")) {
    return {
      title: rawTitle || "Nhận xét từ Cố vấn",
      message: rawMessage,
      badgeText: "CỐ VẤN",
      badgeClass: "bg-teal-950/40 text-teal-300 border-teal-500/30",
    };
  }

  // 13. Lời mời mới vào đội
  if (tLower.includes("lời mời") || mLower.includes("mời bạn tham gia")) {
    return {
      title: rawTitle || "Lời mời tham gia đội thi",
      message: rawMessage,
      badgeText: "LỜI MỜI",
      badgeClass: "bg-sky-950/40 text-sky-300 border-sky-500/30",
    };
  }

  // 14. Yêu cầu xin gia nhập đội
  if (tLower.includes("yêu cầu") || mLower.includes("xin gia nhập") || mLower.includes("yêu cầu tham gia")) {
    return {
      title: "Yêu cầu xin gia nhập đội thi",
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

  // Close dropdown on click outside & listen for local notification events
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    const handleNotifUpdate = () => {
      refetchNotifs();
      refetch();
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("seal-notification-updated", handleNotifUpdate);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("seal-notification-updated", handleNotifUpdate);
    };
  }, [refetch, refetchNotifs]);

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
          toast.success(`Chúc mừng! Bạn đã chính thức gia nhập đội "${targetName}". Hãy cùng đồng đội hoàn thiện bài thi thật tốt nhé!`);
          pushSystemNotification({
            title: "Gia nhập đội thi thành công",
            message: `Bạn đã chính thức gia nhập đội "${targetName}". Chúc bạn và đồng đội đạt thành tích xuất sắc!`,
            type: "success",
          });
          pushSystemNotification({
            title: "Thành viên mới gia nhập đội",
            message: `Một thành viên đã đồng ý lời mời và chính thức gia nhập đội "${targetName}".`,
            type: "success",
          });
        } else {
          const roleTitle = formatRoleLabel(inv.role);
          toast.success(`Bạn đã nhận vai trò ${roleTitle} sự kiện "${targetName}".`);
          pushSystemNotification({
            title: "Đã nhận vai trò sự kiện",
            message: `Bạn đã chính thức đảm nhận vai trò ${roleTitle} trong sự kiện "${targetName}".`,
            type: "success",
          });
          pushSystemNotification({
            title: "Nhân sự đã nhận vai trò",
            message: `Nhân sự đã đồng ý nhận vai trò ${roleTitle} sự kiện "${targetName}".`,
            type: "success",
          });
        }
        queryClient.invalidateQueries({ queryKey: ["my-team"] });
        queryClient.invalidateQueries({ queryKey: ["myTeam"] });
        queryClient.invalidateQueries({ queryKey: ["eventRoles"] });
        queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
        queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });

        let targetRedirectUrl = "/events";
        if (invType === "TEAM" || invType === "TEAM_MEMBER") {
          targetRedirectUrl = "/my-team";
        } else if (inv.role === "Judge") {
          targetRedirectUrl = "/judge/events";
        } else if (inv.role === "Mentor") {
          targetRedirectUrl = "/mentor";
        } else if (inv.role === "Coordinator" || inv.role === "EventCoordinator") {
          targetRedirectUrl = inv.eventId || inv.targetId
            ? `/coordinator/dashboard?eventId=${inv.eventId || inv.targetId}`
            : "/coordinator/dashboard";
        } else if (inv.eventId || inv.targetId) {
          targetRedirectUrl = `/events/${inv.eventId || inv.targetId}`;
        }

        setTimeout(() => {
          window.location.href = targetRedirectUrl;
        }, 1200);
      } else {
        toast.info(`Bạn đã từ chối lời mời tham gia "${targetName}".`);
        pushSystemNotification({
          title: "Đã từ chối lời mời",
          message: `Bạn đã từ chối lời mời tham gia "${targetName}".`,
          type: "warning",
        });
        pushSystemNotification({
          title: "Lời mời tham gia bị từ chối",
          message: `Ứng viên đã từ chối lời mời tham gia "${targetName}".`,
          type: "danger",
        });
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
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-primary)] font-mono text-[10px] font-extrabold text-black animate-pulse shadow-[0_0_8px_rgba(0,217,255,0.6)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`${
            align === "sidebar"
              ? "fixed left-4 right-4 top-16 md:left-[16.5rem] md:top-3 md:right-auto md:w-[28rem] z-[99999]"
              : align === "left"
              ? "absolute left-0 mt-2 w-84 sm:w-[26rem] md:w-[28rem] z-[9999]"
              : "absolute right-0 mt-2 w-84 sm:w-[26rem] md:w-[28rem] z-[9999]"
          } rounded border border-[var(--border-muted)] bg-[var(--bg-panel)] shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden font-mono text-xs animate-in fade-in zoom-in-95 duration-100`}
        >
          {/* Header */}
          <div className="p-3.5 border-b border-[var(--border-muted)] flex items-center justify-between bg-[var(--bg-input)]/60">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-xs sm:text-sm">
                [ TRUNG TÂM THÔNG BÁO ]
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-[var(--accent-primary)] text-black">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                refetch();
                refetchNotifs();
              }}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isLoadingNotifs ? "animate-spin" : ""}`} /> Làm mới
            </button>
          </div>

          {/* List Content */}
          <div className="max-h-96 overflow-y-auto divide-y divide-[var(--border-muted)]/60">
            {isLoading || isLoadingNotifs ? (
              <div className="p-8 text-center text-[var(--text-muted)] flex justify-center items-center gap-2 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent-primary)]" />
                Đang tải thông báo...
              </div>
            ) : pendingInvitations.length === 0 && systemNotifs.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-muted)] italic text-xs">
                Không có lời mời hoặc thông báo mới
              </div>
            ) : (
              <>
              {pendingInvitations.map((item) => (
                <div
                  key={item.invitationId}
                  className="p-4 flex flex-col gap-2 bg-[var(--accent-primary)]/5 hover:bg-[var(--bg-input)]/40 transition-colors"
                >
                  {(() => {
                    const isTransfer = item.type === "TEAM" && item.role === "Trưởng nhóm";
                    const isJoin = item.type === "TEAM" && !isTransfer;
                    return (
                  <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] shrink-0" />
                      <span className="font-bold text-[var(--text-primary)] text-sm truncate">
                        {isTransfer
                          ? "Yêu Cầu Chuyển Quyền Trưởng Nhóm"
                          : isJoin
                          ? "Lời Mời Vào Đội (Từ Đội Trưởng)"
                          : `Lời Mời: ${formatRoleLabel(item.role)}`}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--accent-team)] font-bold px-2 py-0.5 bg-cyan-950/40 border border-cyan-500/30 rounded shrink-0">
                      {item.targetName}
                    </span>
                  </div>

                  <p className="font-sans text-xs sm:text-[13px] text-zinc-300 leading-relaxed">
                    {isTransfer
                      ? item.inviterName
                        ? `Đội trưởng ${item.inviterName} muốn chuyển quyền Trưởng nhóm đội "${item.targetName}" cho bạn. Nhấn "Đồng ý" nếu bạn chấp nhận làm Trưởng nhóm mới!`
                        : `Bạn nhận được yêu cầu chuyển quyền Trưởng nhóm đội "${item.targetName}". Nhấn "Đồng ý" nếu bạn chấp nhận làm Trưởng nhóm mới!`
                      : isJoin
                      ? item.inviterName
                        ? `Đội trưởng ${item.inviterName} đã gửi lời mời bạn gia nhập đội thi "${item.targetName}". Nhấn "Đồng ý" để chính thức vào đội ngay!`
                        : `Bạn nhận được lời mời gia nhập đội thi "${item.targetName}" từ Đội trưởng. Nhấn "Đồng ý" để chính thức vào đội ngay!`
                      : item.inviterName
                      ? `Ban Tổ Chức (${item.inviterName}) đã gửi lời mời bạn đảm nhiệm vai trò ${formatRoleLabel(item.role)} cho sự kiện "${item.targetName}"${item.trackName ? ` (Hạng mục: ${item.trackName})` : ""}.`
                      : `Ban Tổ Chức đã gửi lời mời bạn đảm nhiệm vai trò ${formatRoleLabel(item.role)} cho sự kiện "${item.targetName}"${item.trackName ? ` (Hạng mục: ${item.trackName})` : ""}.`}
                  </p>

                  <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                    <button
                      disabled={isResponding}
                      onClick={() => handleRespond(item, true)}
                      className="px-3.5 py-1.5 bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/40 font-bold uppercase hover:bg-[var(--color-success)] hover:text-black transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer rounded"
                    >
                      <Check className="w-3.5 h-3.5" /> {isTransfer ? "ĐỒNG Ý NHẬN QUYỀN" : isJoin ? "ĐỒNG Ý VÀO ĐỘI" : "ĐỒNG Ý NHẬN VAI TRÒ"}
                    </button>
                    <button
                      disabled={isResponding}
                      onClick={() => handleRespond(item, false)}
                      className="px-3 py-1.5 bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/30 font-bold uppercase hover:bg-[var(--color-danger)] hover:text-white transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer rounded"
                    >
                      <X className="w-3.5 h-3.5" /> TỪ CHỐI
                    </button>
                  </div>
                  </>
                    );
                  })()}
                </div>
              ))}
              {systemNotifs.map((n) => {
                const formatted = formatNotificationContent(n.title, n.message, n.type);
                return (
                  <div
                    key={n.id}
                    className={`p-4 flex flex-col gap-2 transition-colors ${
                      n.isRead ? "opacity-65 bg-transparent" : "bg-[var(--accent-primary)]/5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase border ${formatted.badgeClass}`}>
                          {formatted.badgeText}
                        </span>
                        <span className="font-bold text-[var(--text-primary)] text-sm">{formatted.title}</span>
                      </div>
                      {!n.isRead && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] shrink-0 animate-pulse" />
                      )}
                    </div>
                    <p className="font-sans text-xs sm:text-[13px] text-zinc-300 leading-relaxed">{formatted.message}</p>
                    <div className="flex items-center justify-between pt-1 font-mono text-xs">
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
                              {n.linkUrl.startsWith("/my-team") ? "[ Xem đội thi ]" : "[ Xem chi tiết ]"}
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
                          className="text-zinc-500 hover:text-white uppercase transition-colors cursor-pointer text-[11px]"
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
          <div className="p-3 text-center bg-[var(--bg-base)] border-t border-[var(--border-muted)] flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)] font-mono">Tự động đồng bộ</span>
            <Link
              href="/my-invitations"
              onClick={() => setIsOpen(false)}
              className="text-xs text-[var(--accent-primary)] font-bold hover:underline flex items-center gap-1.5"
            >
              Mở trung tâm lời mời <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
