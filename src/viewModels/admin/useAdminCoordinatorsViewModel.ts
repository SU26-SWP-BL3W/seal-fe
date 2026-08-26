import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { usePagination } from "@/hooks/usePagination";
import { useEvents } from "@/repositories/eventsRepository";
import { useGetUsers } from "@/repositories/usersRepository";
import { useGetEventRoles, staffRepository } from "@/repositories/staffRepository";
import type { User, EventRole } from "@/models/entities";
import { useAuth } from "@/providers/AuthProvider";
import {
  invitationHistoryService,
  RoleInvitationRecord,
} from "@/services/coordinator/invitationHistoryService";
import { pushSystemNotification } from "@/repositories/shared/notificationsRepository";

function pickEventId(ev: any): string {
  return ev?.id || ev?.Id || ev?.eventId || ev?.EventId || "";
}

export function useAdminCoordinatorsViewModel() {
  const { user: currentUser, refreshRoles } = useAuth();
  const currentUserId =
    currentUser?.id ||
    (currentUser as any)?.userId ||
    (currentUser as any)?.UserId ||
    "";
  const currentUserEmail = (currentUser?.email || (currentUser as any)?.Email || "").toLowerCase();
  const searchParams = useSearchParams();
  const initialEventId = searchParams.get("eventId") || "";

  const { data: rawEvents = [], isLoading: isLoadingEvents } = useEvents();
  const eventsList: any[] = Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data ?? [];

  const { data: rawUsers = [], isLoading: isLoadingUsers } = useGetUsers();
  const allUsers: User[] = Array.isArray(rawUsers) ? rawUsers : (rawUsers as any)?.data ?? [];

  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId);

  useEffect(() => {
    if (!selectedEventId && eventsList.length > 0) {
      const firstId = pickEventId(eventsList[0]);
      if (firstId) setSelectedEventId(firstId);
    }
  }, [eventsList, selectedEventId]);

  useEffect(() => {
    if (initialEventId && initialEventId !== selectedEventId) {
      setSelectedEventId(initialEventId);
    }
  }, [initialEventId]);

  const selectedEvent = useMemo(() => {
    return eventsList.find((e) => pickEventId(e) === selectedEventId) || null;
  }, [eventsList, selectedEventId]);

  const {
    data: rawRolesData,
    isLoading: isLoadingRoles,
    refetch: refetchRoles,
  } = useGetEventRoles(selectedEventId);

  const rawRoles = useMemo(() => rawRolesData || [], [rawRolesData]);

  const currentCoordinators: EventRole[] = useMemo(() => {
    const list = Array.isArray(rawRoles)
      ? rawRoles
      : (rawRoles as any)?.data?.data || (rawRoles as any)?.data?.items || (rawRoles as any)?.data || (rawRoles as any)?.items || [];
    return list.filter((r: any) => {
      const roleName = String(r.roleName ?? r.RoleName ?? "");
      return (
        roleName.toLowerCase().includes("coordinator") ||
        roleName === "0" ||
        roleName === "EventCoordinator"
      );
    });
  }, [rawRoles]);

  const pagination = usePagination(currentCoordinators, 5);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [customFullName, setCustomFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingRoleId, setRemovingRoleId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [historyRecords, setHistoryRecords] = useState<RoleInvitationRecord[]>([]);

  const loadHistory = useCallback(() => {
    if (!selectedEventId) {
      setHistoryRecords([]);
      return;
    }
    if (!rawRolesData) {
      setHistoryRecords(invitationHistoryService.getHistory(selectedEventId));
      return;
    }
    const synced = invitationHistoryService.syncWithEventRoles(selectedEventId, currentCoordinators);
    setHistoryRecords([...synced]);
  }, [selectedEventId, rawRolesData, currentCoordinators]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const searchMatches = useMemo(() => {
    if (selectedUser) return [];
    const q = searchQuery.trim().toLowerCase();

    // Chưa gõ gì: hiện luôn danh sách đầy đủ tài khoản có sẵn để duyệt (bấm vào ô là thấy ngay,
    // không bắt phải gõ trước mới có gợi ý).
    if (!q) return allUsers.slice(0, 30);

    return allUsers
      .filter((u: any) => {
        const name = (u.fullName || u.FullName || "").toLowerCase();
        const email = (u.email || u.Email || "").toLowerCase();
        const studentCode = (u.studentCode || u.StudentCode || "").toLowerCase();
        return name.includes(q) || email.includes(q) || studentCode.includes(q);
      })
      .slice(0, 30);
  }, [allUsers, searchQuery, selectedUser]);

  const matchedUser: User | null = useMemo(() => {
    if (selectedUser) return selectedUser;
    const clean = searchQuery.trim().toLowerCase();
    if (!clean) return null;
    return (
      allUsers.find(
        (u: any) => (u.email || u.Email || "").toLowerCase() === clean
      ) || null
    );
  }, [selectedUser, searchQuery, allUsers]);

  const isStudent = useMemo(() => {
    if (!matchedUser) return false;
    const u: any = matchedUser;
    const roleName = (u.roleName || u.RoleName || "").toLowerCase();
    return Boolean(
      u.isStudent ||
      u.IsStudent ||
      u.studentCode ||
      u.StudentCode ||
      roleName === "student"
    );
  }, [matchedUser]);

  const isAlreadyEc = useMemo(() => {
    if (!matchedUser) return false;
    const uId = matchedUser.id || (matchedUser as any).Id || matchedUser.userId || (matchedUser as any).UserId;
    return currentCoordinators.some((c: any) => (c.userId || c.UserId) === uId);
  }, [matchedUser, currentCoordinators]);

  const handleSelectUser = (u: User) => {
    setSelectedUser(u);
    setSearchQuery(u.email || "");
    setActionError(null);
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    setSearchQuery("");
    setCustomFullName("");
    setActionError(null);
  };

  const handleRemoveCoordinator = async (roleId: string, name: string, targetUserId?: string, email?: string) => {
    const reason = window.prompt(
      `Nhập lý do thu hồi quyền Điều phối viên của "${name}" (hoặc để trống):`,
      "Thay đổi kế hoạch phân công nhân sự Ban tổ chức"
    );
    if (reason === null) return;

    setRemovingRoleId(roleId);
    setActionError(null);
    try {
      await staffRepository.removeEventRole(roleId);
      invitationHistoryService.updateStatus(selectedEventId, email || roleId, "Revoked", reason.trim() || undefined);
      
      pushSystemNotification({
        title: "Thu hồi quyền Điều Phối Viên",
        message: `Quyền Điều Phối Viên của ${name} trong sự kiện "${selectedEvent?.eventName || selectedEvent?.EventName || 'Sự kiện'}" đã bị thu hồi. Lý do: ${reason.trim() || 'Theo quyết định của Ban tổ chức'}.`,
        type: "warning",
      });

      setActionSuccess(`Đã thu hồi quyền Điều phối viên của ${name} thành công!`);
      await refetchRoles();
      loadHistory();
      if (targetUserId && targetUserId === currentUserId) {
        await refreshRoles();
      }
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || "Gỡ vai trò thất bại.");
    } finally {
      setRemovingRoleId(null);
    }
  };

  const handleResendCoordinatorInvitation = async (record: RoleInvitationRecord) => {
    if (!selectedEventId) return;
    await staffRepository.inviteCoordinator({
      eventId: selectedEventId,
      email: record.email,
      fullName: record.fullName,
    });
    invitationHistoryService.addInvitation({
      ...record,
      status: "Pending",
    });
    pushSystemNotification({
      title: "Gửi lại lời mời Điều Phối Viên",
      message: `Đã gửi lại email mời ${record.fullName || record.email} làm Điều Phối Viên sự kiện "${selectedEvent?.eventName || selectedEvent?.EventName}".`,
      type: "info",
    });
    loadHistory();
  };

  const handleRevokeCoordinatorInvitation = async (record: RoleInvitationRecord) => {
    const reason = window.prompt(
      `Nhập lý do thu hồi lời mời Điều phối viên của "${record.fullName || record.email}" (hoặc để trống):`,
      "Hủy thư mời theo quyết định của Ban tổ chức"
    );
    if (reason === null) return;

    if (record.id && !record.id.startsWith("inv-") && !record.id.startsWith("role-inv-")) {
      await staffRepository.removeEventRole(record.id);
      await refetchRoles();
    }
    invitationHistoryService.updateStatus(selectedEventId, record.id, "Revoked", reason.trim() || undefined);
    
    pushSystemNotification({
      title: "Thu hồi lời mời Điều Phối Viên",
      message: `Lời mời Điều Phối Viên của ${record.fullName || record.email} trong sự kiện "${selectedEvent?.eventName || selectedEvent?.EventName || 'Sự kiện'}" đã bị thu hồi. Lý do: ${reason.trim() || 'Theo quyết định của Ban tổ chức'}.`,
      type: "warning",
    });
    
    loadHistory();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!selectedEventId) {
      setActionError("Vui lòng chọn một sự kiện để phân công.");
      return;
    }

    const emailToUse = searchQuery.trim().toLowerCase();
    if (!emailToUse) {
      setActionError("Vui lòng nhập hoặc chọn email của Điều Phối Viên.");
      return;
    }

    if (isStudent) {
      setActionError("Thí sinh (Sinh viên) không được phép làm Điều phối viên theo quy chế cuộc thi!");
      return;
    }

    if (isAlreadyEc) {
      setActionError("Người này đã là Điều phối viên phụ trách sự kiện này rồi!");
      return;
    }

    if (emailToUse === currentUserEmail) {
      setActionError("Bạn không thể tự mời hoặc tự gán chính mình làm Điều phối viên.");
      return;
    }

    if (matchedUser) {
      const realUserId = matchedUser.id || (matchedUser as any).Id || matchedUser.userId || (matchedUser as any).UserId;
      if (realUserId === currentUserId) {
        setActionError("Bạn không thể tự mời hoặc tự gán chính mình làm Điều phối viên.");
        return;
      }
    }

    setIsSubmitting(true);

    if (matchedUser) {
      const realUserId = matchedUser.id || (matchedUser as any).Id || matchedUser.userId || (matchedUser as any).UserId;
      try {
        const res = await staffRepository.assignRoleDirectly({
          userId: realUserId,
          eventId: selectedEventId,
          roleName: "EventCoordinator",
        });
        setIsSubmitting(false);

        if (res && res.success !== false) {
          invitationHistoryService.addInvitation({
            eventId: selectedEventId,
            eventName: selectedEvent?.eventName || selectedEvent?.EventName,
            email: matchedUser.email || emailToUse,
            fullName: matchedUser.fullName || (matchedUser as any).FullName || emailToUse.split("@")[0],
            roleName: "EventCoordinator",
            status: "Active",
          });
          setActionSuccess(
            `Đã phân công ${matchedUser.fullName || matchedUser.email} làm Điều Phối Viên cho sự kiện thành công!`
          );
          handleClearSelection();
          await refetchRoles();
          loadHistory();
          setTimeout(() => setActionSuccess(null), 3000);
        } else {
          setActionError("Phân công vai trò thất bại. Vui lòng kiểm tra lại quyền.");
        }
      } catch (err: any) {
        setIsSubmitting(false);
        setActionError(err?.response?.data?.message || err?.message || "Lỗi phân công vai trò.");
      }
      return;
    }

    try {
      const res = await staffRepository.inviteCoordinator({
        eventId: selectedEventId,
        email: emailToUse,
        fullName: customFullName.trim() || undefined,
      });
      setIsSubmitting(false);

      if (res) {
        invitationHistoryService.addInvitation({
          eventId: selectedEventId,
          eventName: selectedEvent?.eventName || selectedEvent?.EventName,
          email: emailToUse,
          fullName: customFullName.trim() || emailToUse.split("@")[0],
          roleName: "EventCoordinator",
          status: "Pending",
          notes: "Cấp tài khoản tạm / Chờ kích hoạt qua email",
        });
        
        pushSystemNotification({
          title: "Gửi thư mời & Cấp tài khoản tạm",
          message: `Đã gửi thư mời kèm liên kết kích hoạt cấp tài khoản tạm cho ${emailToUse} làm Điều Phối Viên sự kiện "${selectedEvent?.eventName || selectedEvent?.EventName || 'Sự kiện'}".`,
          type: "info",
        });

        setActionSuccess(`Đã gửi thư mời và liên kết kích hoạt cấp tài khoản tạm cho ${emailToUse} thành công!`);
        handleClearSelection();
        await refetchRoles();
        loadHistory();
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        setActionError("Không thể gửi thư mời điều phối viên.");
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setActionError(err?.response?.data?.message || err?.message || "Lỗi gửi thư mời nhân sự.");
    }
  };

  return {
    state: {
      selectedEventId,
      selectedEvent,
      selectedUser,
      searchQuery,
      customFullName,
      isSubmitting,
      removingRoleId,
      actionSuccess,
      actionError,
      historyRecords,
      isLoadingEvents,
      isLoadingUsers,
      isLoadingRoles,
      matchedUser,
      isStudent,
      isAlreadyEc,
      currentUserEmail,
      currentUserId,
    },
    data: {
      eventsList,
      allUsers,
      currentCoordinators,
      searchMatches,
    },
    pagination,
    actions: {
      setSelectedEventId,
      setSearchQuery,
      setCustomFullName,
      handleSelectUser,
      handleClearSelection,
      handleRemoveCoordinator,
      handleResendCoordinatorInvitation,
      handleRevokeCoordinatorInvitation,
      handleSubmit,
      refetchRoles,
    },
  };
}
