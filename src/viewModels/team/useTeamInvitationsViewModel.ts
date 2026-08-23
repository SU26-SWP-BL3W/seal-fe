import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useSearchParams } from "next/navigation";
import { useMyInvitations, type MyInvitationItem } from "@/repositories/usersRepository";
import { useAcceptOrDeclineInvitation } from "@/repositories/teamsRepository";
import { useRespondEventRoleInvitation, useDeclineEventRoleInvitationPublic } from "@/repositories/eventRolesRepository";
import { useEvents } from "@/repositories/eventsRepository";
import { pushSystemNotification } from "@/repositories/shared/notificationsRepository";
import { usePagination } from "@/hooks/usePagination";
import { useToast } from "@/providers/ToastProvider";
import { useQueryClient } from "@tanstack/react-query";

export function useTeamInvitationsViewModel() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, refreshRoles } = useAuth();

  const queryInvitationId = searchParams.get("invitationId") || searchParams.get("id") || "";
  const queryAction = searchParams.get("action") || "";
  const queryRole = searchParams.get("role") || "";
  const queryEventName = searchParams.get("eventName") || searchParams.get("event") || "";
  const queryEmail = searchParams.get("email") || "";

  const { data, isLoading, isError, refetch, isFetching } = useMyInvitations(Boolean(user));
  const { data: rawEvents = [] } = useEvents();
  const invitations = data?.invitations ?? [];

  const pending = invitations.filter((i) => i.status === "PendingAccept");
  const history = invitations.filter((i) => i.status !== "PendingAccept");

  const pendingPagination = usePagination(pending, 5);
  const historyPagination = usePagination(history, 5);

  const { mutateAsync: respondTeam, isPending: isRespondingTeam } = useAcceptOrDeclineInvitation();
  const { mutateAsync: respondEventRole, isPending: isRespondingEventRole } = useRespondEventRoleInvitation();
  const { mutateAsync: declinePublic, isPending: isDecliningPublic } = useDeclineEventRoleInvitationPublic();
  const isResponding = isRespondingTeam || isRespondingEventRole || isDecliningPublic;

  const [error, setError] = useState("");
  const [publicDeclineSuccess, setPublicDeclineSuccess] = useState(false);

  const isProfileIncomplete = user?.isStudent && (!user?.schoolId || (!user?.isFpt && !user?.studentCode));

  const formatRoleLabel = (role?: string) => {
    switch (role) {
      case "Coordinator":
      case "EventCoordinator":
        return "Cán Bộ Điều Phối (Event Coordinator)";
      case "Judge":
        return "Ban Giám Khảo (Judge)";
      case "Mentor":
        return "Cố Vấn Chuyên Môn (Mentor)";
      case "TeamLeader":
        return "Trưởng Nhóm (Team Leader)";
      case "TeamMember":
        return "Thành Viên Đội Thi";
      default:
        return role || "Cán Bộ Sự Kiện";
    }
  };

  const titleOf = (inv: MyInvitationItem) =>
    inv.type === "TEAM"
      ? inv.role === "Trưởng nhóm"
        ? `Yêu cầu chuyển quyền Đội trưởng đội ${inv.targetName}`
        : `Lời mời gia nhập đội thi ${inv.targetName} (Từ Đội trưởng)`
      : `Lời mời đảm nhiệm vai trò: ${formatRoleLabel(inv.role)} — Sự kiện ${inv.targetName}${inv.trackName ? ` · Hạng mục ${inv.trackName}` : ""}`;

  const handleRespond = async (inv: MyInvitationItem | any, isAccepted: boolean) => {
    setError("");
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
        } else if (inv.role === "Judge") {
          toast.success(`Bạn đã nhận vai trò Ban Giám Khảo sự kiện "${targetName}". Bàn chấm điểm đã sẵn sàng!`);
          pushSystemNotification({
            title: "Đã nhận vai trò Giám khảo",
            message: `Bạn đã nhận vai trò Ban Giám Khảo sự kiện "${targetName}". Bàn chấm điểm đã sẵn sàng!`,
            type: "success",
          });
          pushSystemNotification({
            title: "Nhân sự đã nhận vai trò",
            message: `Nhân sự đã đồng ý nhận vai trò Giám khảo sự kiện "${targetName}".`,
            type: "success",
          });
        } else if (inv.role === "Mentor") {
          toast.success(`Bạn đã nhận vai trò Cố Vấn Chuyên Môn sự kiện "${targetName}". Bàn cố vấn đã sẵn sàng!`);
          pushSystemNotification({
            title: "Đã nhận vai trò Cố vấn",
            message: `Bạn đã nhận vai trò Cố Vấn Chuyên Môn sự kiện "${targetName}". Bàn cố vấn đã sẵn sàng!`,
            type: "success",
          });
          pushSystemNotification({
            title: "Nhân sự đã nhận vai trò",
            message: `Nhân sự đã đồng ý nhận vai trò Cố vấn sự kiện "${targetName}".`,
            type: "success",
          });
        } else {
          toast.success(`Bạn đã nhận vai trò Cán Bộ Điều Phối sự kiện "${targetName}".`);
          pushSystemNotification({
            title: "Đã nhận vai trò Điều Phối Viên",
            message: `Bạn đã nhận vai trò Cán Bộ Điều Phối sự kiện "${targetName}".`,
            type: "success",
          });
          pushSystemNotification({
            title: "Nhân sự đã nhận vai trò",
            message: `Nhân sự đã đồng ý nhận vai trò Điều Phối Viên sự kiện "${targetName}".`,
            type: "success",
          });
        }
        await refreshRoles();
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
    } catch (err: unknown) {
      const detail = err as { message?: string; response?: { data?: { message?: string; detail?: string } } };
      const rawMsg =
        detail?.response?.data?.message ||
        detail?.response?.data?.detail ||
        detail?.message ||
        "Không thể xử lý lời mời. Vui lòng thử lại sau.";

      const isProfileErr =
        rawMsg.toLowerCase().includes("profile") ||
        rawMsg.toLowerCase().includes("hồ sơ") ||
        rawMsg.toLowerCase().includes("school") ||
        rawMsg.toLowerCase().includes("student");

      const msg = isProfileErr && isAccepted
        ? "Bạn cần hoàn tất cập nhật hồ sơ cá nhân/sinh viên trước khi đồng ý tham gia đội thi."
        : rawMsg;

      setError(msg);
      toast.error(msg);
    } finally {
      refetch();
    }
  };

  const handlePublicDecline = async () => {
    if (!queryInvitationId) return;
    if (!confirm("Bạn có chắc chắn muốn từ chối lời mời tham gia sự kiện này?")) return;
    try {
      await declinePublic(queryInvitationId);
      setPublicDeclineSuccess(true);
      toast.success("Bạn đã từ chối lời mời tham gia sự kiện.");
      pushSystemNotification({
        title: "Đã từ chối lời mời sự kiện",
        message: `Bạn đã từ chối lời mời tham gia sự kiện "${queryEventName || 'Sự kiện'}".`,
        type: "warning",
      });
      pushSystemNotification({
        title: "Lời mời tham gia bị từ chối",
        message: `Ứng viên đã từ chối lời mời qua liên kết email tham gia sự kiện "${queryEventName || 'Sự kiện'}".`,
        type: "danger",
      });
    } catch (err: unknown) {
      const detail = err as { message?: string; response?: { data?: { message?: string } } };
      const msg = detail?.response?.data?.message || detail?.message || "Không thể từ chối lời mời lúc này.";
      toast.error(msg);
    }
  };

  return {
    state: {
      user,
      error,
      publicDeclineSuccess,
      isProfileIncomplete,
      isLoading,
      isError,
      isFetching,
      isResponding,
      queryInvitationId,
      queryAction,
      queryRole,
      queryEventName,
      queryEmail,
      searchParamsString: searchParams.toString(),
    },
    data: {
      invitations,
      pending,
      history,
      rawEvents,
    },
    pagination: {
      pendingPagination,
      historyPagination,
    },
    actions: {
      setError,
      formatRoleLabel,
      titleOf,
      handleRespond,
      handlePublicDecline,
      refetch,
    },
  };
}
