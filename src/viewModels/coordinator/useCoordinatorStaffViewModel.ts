import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { staffRepository, useGetEventRoles } from "@/repositories/staffRepository";
import { useMyEvents } from "@/repositories/eventsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { useGetUsers } from "@/repositories/usersRepository";
import {
  invitationHistoryService,
  RoleInvitationRecord,
} from "@/services/coordinator/invitationHistoryService";
import { pushSystemNotification } from "@/repositories/shared/notificationsRepository";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { staffService, SYSTEM_ACCOUNTS, checkEmailInSystem as checkEmailService } from "@/services/coordinator/staffService";

export { SYSTEM_ACCOUNTS };
export const checkEmailInSystem = checkEmailService;

export function useCoordinatorStaffViewModel() {
  const searchParams = useSearchParams();
  const queryEventId = searchParams.get("eventId");

  const { data: usersPaged } = useGetUsers({ pageSize: 500 });
  const allSystemAccounts = useMemo(() => {
    const map = new Map<string, string>();
    SYSTEM_ACCOUNTS.forEach((a) => map.set(a.email.toLowerCase(), a.fullName));

    const apiList = Array.isArray(usersPaged?.data)
      ? usersPaged.data
      : Array.isArray((usersPaged as any)?.items)
      ? (usersPaged as any).items
      : [];

    apiList.forEach((u: any) => {
      const email = (u.email || u.Email || "").trim();
      const name = u.fullName || u.FullName || email.split("@")[0] || "Người dùng";
      if (email) {
        map.set(email.toLowerCase(), name);
      }
    });

    return Array.from(map.entries()).map(([email, fullName]) => ({ email, fullName }));
  }, [usersPaged]);

  const checkEmail = useCallback(
    (email: string) => {
      if (!email.trim()) return true;
      return allSystemAccounts.some((acc) => acc.email.toLowerCase() === email.trim().toLowerCase());
    },
    [allSystemAccounts]
  );

  const { data: myEvents = [] } = useMyEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>(queryEventId || "");

  useEffect(() => {
    if (queryEventId) {
      setSelectedEventId(queryEventId);
    } else if (!selectedEventId && myEvents.length > 0) {
      const firstEvent = myEvents[0];
      const id = firstEvent.id || firstEvent.Id || firstEvent.eventId || firstEvent.EventId || "";
      if (id) {
        setSelectedEventId(id);
      }
    }
  }, [queryEventId, myEvents, selectedEventId]);

  const { data: rawEventRoles, refetch: refetchRoles } = useGetEventRoles(selectedEventId);
  const eventRoles = useMemo(() => rawEventRoles || [], [rawEventRoles]);
  const { data: tracks = [] } = useGetTracksByEvent(selectedEventId);

  const [judgeEmail, setJudgeEmail] = useState("");
  const [judgeFullName, setJudgeFullName] = useState("");
  const [judgeTrackId, setJudgeTrackId] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");
  const [mentorFullName, setMentorFullName] = useState("");
  const [mentorTrackId, setMentorTrackId] = useState("");
  const [coordinatorEmail, setCoordinatorEmail] = useState("");
  const [coordinatorFullName, setCoordinatorFullName] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [historyRecords, setHistoryRecords] = useState<RoleInvitationRecord[]>([]);

  const loadHistory = useCallback(() => {
    if (!selectedEventId) {
      setHistoryRecords([]);
      return;
    }
    if (!rawEventRoles) {
      setHistoryRecords(invitationHistoryService.getHistory(selectedEventId));
      return;
    }
    const synced = invitationHistoryService.syncWithEventRoles(selectedEventId, eventRoles);
    setHistoryRecords([...synced]);
  }, [selectedEventId, rawEventRoles, eventRoles]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 4;

  const isDirty = Boolean(judgeEmail.trim() || mentorEmail.trim() || coordinatorEmail.trim());
  const unsavedChanges = useUnsavedChanges(isDirty);

  const [judgeMessage, setJudgeMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [mentorMessage, setMentorMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [coordinatorMessage, setCoordinatorMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmittingJudge, setIsSubmittingJudge] = useState(false);
  const [isSubmittingMentor, setIsSubmittingMentor] = useState(false);
  const [isSubmittingCoordinator, setIsSubmittingCoordinator] = useState(false);

  const selectedEventObj = myEvents.find((e: any) => (e.id || e.Id || e.eventId || e.EventId) === selectedEventId);

  const realTracks = useMemo(() => {
    return tracks.filter((t: any) => {
      const tid = String(t.id || t.Id || "");
      return tid && !tid.startsWith("tmp-") && !tid.startsWith("temp-");
    });
  }, [tracks]);

  const handleInviteCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordinatorEmail.trim() || !selectedEventId) return;

    setIsSubmittingCoordinator(true);
    setCoordinatorMessage(null);

    try {
      const res = await staffRepository.inviteCoordinator({
        eventId: selectedEventId,
        email: coordinatorEmail.trim(),
        fullName: coordinatorFullName.trim(),
      });
      setIsSubmittingCoordinator(false);

      if (res && res.success !== false) {
        const isTempAccount = Boolean(res?.isTemporary || res?.data?.isTemporary);
        const isExistingAccount = !isTempAccount && (checkEmailInSystem(coordinatorEmail) || true);
        const noteText = isExistingAccount
          ? "Đã có tài khoản / Đã gửi thư mời phân công"
          : "Cấp tài khoản tạm / Chờ kích hoạt qua email";

        invitationHistoryService.addInvitation({
          eventId: selectedEventId,
          eventName: selectedEventObj?.eventName || selectedEventObj?.EventName,
          email: coordinatorEmail.trim(),
          fullName: coordinatorFullName.trim() || coordinatorEmail.trim().split("@")[0],
          roleName: "EventCoordinator",
          status: "Pending",
          notes: noteText,
        });

        pushSystemNotification({
          title: isExistingAccount ? "Gửi thư mời phân công Điều Phối Viên" : "Gửi thư mời & Cấp tài khoản tạm Điều Phối Viên",
          message: isExistingAccount
            ? `Đã gửi thư mời phân công cho Điều Phối Viên ${coordinatorEmail.trim()} tham gia sự kiện "${selectedEventObj?.eventName || selectedEventObj?.EventName || 'Sự kiện'}".`
            : `Đã gửi thư mời kèm liên kết kích hoạt cấp tài khoản tạm cho ${coordinatorEmail.trim()} làm Điều Phối Viên sự kiện "${selectedEventObj?.eventName || selectedEventObj?.EventName || 'Sự kiện'}".`,
          type: "info",
        });

        setCoordinatorMessage({
          text: res.message || (isExistingAccount
            ? `Đã gửi thư mời phân công Điều phối viên cho ${coordinatorEmail.trim()} thành công!`
            : `Đã gửi email mời & cấp tài khoản tạm cho Điều phối viên (${coordinatorEmail.trim()}) thành công!`),
          isError: false,
        });
        setCoordinatorEmail("");
        setCoordinatorFullName("");
        await refetchRoles();
        loadHistory();
      } else {
        setCoordinatorMessage({
          text: res?.message || "Gửi lời mời Điều phối viên thất bại.",
          isError: true,
        });
      }
    } catch (err: any) {
      setIsSubmittingCoordinator(false);
      const msg = err.response?.data?.message || err.response?.data?.detail || err.message || "Gửi lời mời thất bại. Bạn phải là Event Coordinator của sự kiện này.";
      setCoordinatorMessage({
        text: msg,
        isError: true,
      });
    }
  };

  const handleInviteJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judgeEmail.trim() || !selectedEventId) {
      setJudgeMessage({ text: "Vui lòng nhập Email Giám khảo và chọn Sự kiện.", isError: true });
      return;
    }

    if (judgeTrackId && (judgeTrackId.startsWith("tmp-") || judgeTrackId.startsWith("temp-"))) {
      setJudgeMessage({
        text: "Hạng mục này chưa được lưu chính thức lên Server DB. Vui lòng bấm nút 'CẤU HÌNH SỰ KIỆN (WIZARD)' để lưu Hạng mục trước.",
        isError: true,
      });
      return;
    }

    const effectiveName = judgeFullName.trim() || SYSTEM_ACCOUNTS.find((acc) => acc.email.toLowerCase() === judgeEmail.trim().toLowerCase())?.fullName || judgeEmail.trim().split("@")[0];

    const existingConflict = eventRoles.find((r: any) => {
      const emailMatch = (r.user?.email || r.User?.Email || r.email || "").toLowerCase() === judgeEmail.trim().toLowerCase();
      const trackMatch = (r.trackId || r.TrackId || "") === judgeTrackId;
      const isMentor = (r.roleName || r.RoleName) === "Mentor";
      return emailMatch && (judgeTrackId ? trackMatch : true) && isMentor;
    });

    if (existingConflict) {
      setJudgeMessage({
        text: "Giảng viên này đã được phân công làm Cố vấn cho Hạng mục này. Một nhân sự không thể vừa làm Cố vấn vừa làm Giám khảo cùng một Hạng mục.",
        isError: true,
      });
      return;
    }

    setIsSubmittingJudge(true);
    setJudgeMessage(null);

    const chosenTrack = realTracks.find((t: any) => (t.id || t.Id) === judgeTrackId);

    try {
      const res = await staffRepository.inviteJudge({
        eventId: selectedEventId,
        email: judgeEmail.trim(),
        fullName: effectiveName,
        trackId: judgeTrackId || realTracks[0]?.id || realTracks[0]?.Id || "",
      });

      if (res && res.success !== false) {
        const isTempAccount = Boolean(res?.isTemporary || res?.data?.isTemporary);
        const isExistingAccount = !isTempAccount && (checkEmailInSystem(judgeEmail) || true);
        const noteText = isExistingAccount
          ? "Đã có tài khoản / Đã gửi thư mời phân công"
          : "Cấp tài khoản tạm / Chờ kích hoạt qua email";

        invitationHistoryService.addInvitation({
          eventId: selectedEventId,
          eventName: selectedEventObj?.eventName || selectedEventObj?.EventName,
          email: judgeEmail.trim(),
          fullName: effectiveName,
          roleName: "Judge",
          trackId: judgeTrackId,
          trackName: chosenTrack?.trackName || chosenTrack?.TrackName || "Toàn sự kiện",
          status: "Pending",
          notes: noteText,
        });

        pushSystemNotification({
          title: isExistingAccount ? "Gửi thư mời phân công Giám khảo" : "Gửi thư mời & Cấp tài khoản tạm Giám khảo",
          message: isExistingAccount
            ? `Đã gửi thư mời phân công cho Giám khảo ${judgeEmail.trim()} tham gia sự kiện "${selectedEventObj?.eventName || selectedEventObj?.EventName || 'Sự kiện'}".`
            : `Đã gửi thư mời kèm liên kết kích hoạt cấp tài khoản tạm cho ${judgeEmail.trim()} làm Giám khảo sự kiện "${selectedEventObj?.eventName || selectedEventObj?.EventName || 'Sự kiện'}".`,
          type: "info",
        });

        setJudgeMessage({
          text: res.message || (isExistingAccount
            ? `Đã gửi thư mời phân công Giám khảo cho ${judgeEmail.trim()} thành công!`
            : `Đã gửi email mời & cấp tài khoản tạm cho Giám khảo (${judgeEmail.trim()}) thành công!`),
          isError: false,
        });
        setJudgeEmail("");
        setJudgeFullName("");
        await refetchRoles();
        loadHistory();
      } else {
        setJudgeMessage({ text: res?.message || "Gửi lời mời thất bại, vui lòng thử lại.", isError: true });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || err?.message || "Gửi lời mời thất bại, vui lòng thử lại.";
      setJudgeMessage({
        text: msg,
        isError: true,
      });
    } finally {
      setIsSubmittingJudge(false);
    }
  };

  const handleInviteMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorEmail.trim() || !selectedEventId) {
      setMentorMessage({ text: "Vui lòng nhập Email Cố vấn và chọn Sự kiện.", isError: true });
      return;
    }

    const targetTrackId = mentorTrackId || realTracks[0]?.id || realTracks[0]?.Id || "";

    if (targetTrackId && (targetTrackId.startsWith("tmp-") || targetTrackId.startsWith("temp-"))) {
      setMentorMessage({
        text: "Hạng mục này chưa được lưu chính thức lên Server DB. Vui lòng bấm nút 'CẤU HÌNH SỰ KIỆN (WIZARD)' để lưu Hạng mục trước.",
        isError: true,
      });
      return;
    }

    const effectiveName = mentorFullName.trim() || SYSTEM_ACCOUNTS.find((acc) => acc.email.toLowerCase() === mentorEmail.trim().toLowerCase())?.fullName || mentorEmail.trim().split("@")[0];

    if (!targetTrackId && realTracks.length > 0) {
      setMentorMessage({ text: "Vui lòng chọn Hạng mục phụ trách cho Cố vấn.", isError: true });
      return;
    }

    const existingConflict = eventRoles.find((r: any) => {
      const emailMatch = (r.user?.email || r.User?.Email || r.email || "").toLowerCase() === mentorEmail.trim().toLowerCase();
      const trackMatch = (r.trackId || r.TrackId || "") === targetTrackId;
      const isJudge = (r.roleName || r.RoleName) === "Judge";
      return emailMatch && trackMatch && isJudge;
    });

    if (existingConflict) {
      setMentorMessage({
        text: "Giảng viên này đã được phân công làm Giám khảo cho Hạng mục này. Một nhân sự không thể vừa làm Cố vấn vừa làm Giám khảo cùng một Hạng mục.",
        isError: true,
      });
      return;
    }

    setIsSubmittingMentor(true);
    setMentorMessage(null);

    const chosenTrack = realTracks.find((t: any) => (t.id || t.Id) === targetTrackId);

    try {
      const res = await staffRepository.inviteMentor({
        eventId: selectedEventId,
        email: mentorEmail.trim(),
        fullName: effectiveName,
        trackId: targetTrackId,
      });

      if (res && res.success !== false) {
        const isTempAccount = Boolean(res?.isTemporary || res?.data?.isTemporary);
        const isExistingAccount = !isTempAccount && (checkEmailInSystem(mentorEmail) || true);
        const noteText = isExistingAccount
          ? "Đã có tài khoản / Đã gửi thư mời phân công"
          : "Cấp tài khoản tạm / Chờ kích hoạt qua email";

        invitationHistoryService.addInvitation({
          eventId: selectedEventId,
          eventName: selectedEventObj?.eventName || selectedEventObj?.EventName,
          email: mentorEmail.trim(),
          fullName: effectiveName,
          roleName: "Mentor",
          trackId: targetTrackId,
          trackName: chosenTrack?.trackName || chosenTrack?.TrackName,
          status: "Pending",
          notes: noteText,
        });

        pushSystemNotification({
          title: isExistingAccount ? "Gửi thư mời phân công Cố vấn" : "Gửi thư mời & Cấp tài khoản tạm Cố vấn",
          message: isExistingAccount
            ? `Đã gửi thư mời phân công cho Cố vấn ${mentorEmail.trim()} tham gia Hạng mục "${chosenTrack?.trackName || chosenTrack?.TrackName || 'Hạng mục'}" sự kiện "${selectedEventObj?.eventName || selectedEventObj?.EventName || 'Sự kiện'}".`
            : `Đã gửi thư mời kèm liên kết kích hoạt cấp tài khoản tạm cho ${mentorEmail.trim()} làm Cố vấn Hạng mục "${chosenTrack?.trackName || chosenTrack?.TrackName || 'Hạng mục'}" sự kiện "${selectedEventObj?.eventName || selectedEventObj?.EventName || 'Sự kiện'}".`,
          type: "info",
        });

        setMentorMessage({
          text: res.message || (isExistingAccount
            ? `Đã gửi thư mời phân công Cố vấn cho ${mentorEmail.trim()} thành công!`
            : `Đã gửi email mời & cấp tài khoản tạm cho Cố vấn (${mentorEmail.trim()}) thành công!`),
          isError: false,
        });
        setMentorEmail("");
        setMentorFullName("");
        await refetchRoles();
        loadHistory();
      } else {
        setMentorMessage({ text: res?.message || "Gửi lời mời thất bại, vui lòng thử lại.", isError: true });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || err?.message || "Gửi lời mời thất bại, vui lòng thử lại.";
      setMentorMessage({
        text: msg,
        isError: true,
      });
    } finally {
      setIsSubmittingMentor(false);
    }
  };

  const handleRemoveRole = async (roleId: string, email?: string) => {
    const roleItem: any = eventRoles.find((r: any) => (r.id || r.Id || r.roleId || r.RoleId) === roleId);
    const rName = roleItem?.user?.fullName || roleItem?.User?.FullName || roleItem?.fullName || email || "nhân sự";
    const rRole = roleItem?.roleName || roleItem?.RoleName || "Nhân sự";

    const reason = window.prompt(
      `Nhập lý do thu hồi vai trò ${rRole} của "${rName}" (hoặc để trống):`,
      "Thay đổi kế hoạch phân công hội đồng chuyên môn"
    );
    if (reason === null) return;

    try {
      await staffRepository.removeEventRole(roleId);
      invitationHistoryService.updateStatus(selectedEventId, roleId, "Revoked", reason.trim() || undefined);

      pushSystemNotification({
        title: `Thu hồi vai trò ${rRole}`,
        message: `Vai trò ${rRole} của ${rName} trong sự kiện "${selectedEventObj?.eventName || selectedEventObj?.EventName || 'Sự kiện'}" đã bị thu hồi. Lý do: ${reason.trim() || 'Theo quyết định của Ban tổ chức'}.`,
        type: "warning",
      });

      await refetchRoles();
      loadHistory();
    } catch {
      alert("Gỡ vai trò thất bại.");
    }
  };

  const handleResendStaffInvitation = async (record: RoleInvitationRecord) => {
    if (!selectedEventId) return;
    if (record.roleName === "Judge" && record.trackId) {
      await staffRepository.inviteJudge({
        eventId: selectedEventId,
        email: record.email,
        fullName: record.fullName,
        trackId: record.trackId,
      });
    } else if (record.roleName === "Mentor" && record.trackId) {
      await staffRepository.inviteMentor({
        eventId: selectedEventId,
        email: record.email,
        fullName: record.fullName,
        trackId: record.trackId,
      });
    } else {
      await staffRepository.inviteCoordinator({
        eventId: selectedEventId,
        email: record.email,
        fullName: record.fullName,
      });
    }
    invitationHistoryService.addInvitation({
      ...record,
      status: "Pending",
    });
    pushSystemNotification({
      title: `Gửi lại lời mời ${record.roleName}`,
      message: `Đã gửi lại email mời ${record.fullName || record.email} đảm nhiệm vai trò ${record.roleName} cho sự kiện "${selectedEventObj?.eventName || selectedEventObj?.EventName}".`,
      type: "info",
    });
    loadHistory();
  };

  const handleRevokeStaffInvitation = async (record: RoleInvitationRecord) => {
    const reason = window.prompt(
      `Nhập lý do thu hồi lời mời ${record.roleName} của "${record.fullName || record.email}" (hoặc để trống):`,
      "Hủy thư mời theo quyết định của Ban tổ chức"
    );
    if (reason === null) return;

    if (record.id && !record.id.startsWith("inv-") && !record.id.startsWith("role-inv-")) {
      await staffRepository.removeEventRole(record.id);
      await refetchRoles();
    }
    invitationHistoryService.updateStatus(selectedEventId, record.id, "Revoked", reason.trim() || undefined);

    pushSystemNotification({
      title: `Thu hồi lời mời ${record.roleName}`,
      message: `Lời mời vai trò ${record.roleName} của ${record.fullName || record.email} trong sự kiện "${selectedEventObj?.eventName || selectedEventObj?.EventName || 'Sự kiện'}" đã bị thu hồi. Lý do: ${reason.trim() || 'Theo quyết định của Ban tổ chức'}.`,
      type: "warning",
    });

    loadHistory();
  };

  const filteredRoles = eventRoles.filter((er: any) => {
    const roleName = er.roleName || er.RoleName || "";
    const isStaff = roleName === "Judge" || roleName === "Mentor" || roleName === "EventCoordinator";
    if (!isStaff) return false;
    if (!staffSearch.trim()) return true;
    const query = staffSearch.toLowerCase();
    const email = (er.user?.email || er.User?.Email || er.email || "").toLowerCase();
    const name = (er.user?.fullName || er.User?.FullName || er.fullName || "").toLowerCase();
    return email.includes(query) || name.includes(query);
  });

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedRoles = filteredRoles.slice(startIndex, startIndex + PAGE_SIZE);

  return {
    state: {
      selectedEventId,
      judgeEmail,
      judgeFullName,
      judgeTrackId,
      mentorEmail,
      mentorFullName,
      mentorTrackId,
      coordinatorEmail,
      coordinatorFullName,
      staffSearch,
      historyRecords,
      currentPage: safePage,
      totalPages,
      totalItems: filteredRoles.length,
      pageSize: PAGE_SIZE,
      judgeMessage,
      mentorMessage,
      coordinatorMessage,
      isSubmittingJudge,
      isSubmittingMentor,
      isSubmittingCoordinator,
      unsavedChanges,
    },
    data: {
      myEvents,
      selectedEventObj,
      realTracks,
      tracks,
      paginatedRoles,
      eventRoles,
    },
    actions: {
      setSelectedEventId,
      setJudgeEmail,
      setJudgeFullName,
      setJudgeTrackId,
      setMentorEmail,
      setMentorFullName,
      setMentorTrackId,
      setCoordinatorEmail,
      setCoordinatorFullName,
      setStaffSearch,
      setCurrentPage,
      handleInviteCoordinator,
      handleInviteJudge,
      handleInviteMentor,
      handleRemoveRole,
      handleResendStaffInvitation,
      handleRevokeStaffInvitation,
      checkEmailInSystem: checkEmail,
    },
  };
}
