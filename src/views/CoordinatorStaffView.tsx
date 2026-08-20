"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { staffRepository, useGetEventRoles } from "@/repositories/staffRepository";
import { useMyEvents } from "@/repositories/eventsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { UserCheck, UserPlus, Send, AlertCircle, CheckCircle2, Shield, Trash2, Search, Filter, Calendar, Sparkles } from "lucide-react";
import { Button, Card, Badge, Input } from "@/components/ui";
import { RoleInvitationHistoryCard } from "@/components/domain/role-invitations/RoleInvitationHistoryCard";
import {
  invitationHistoryService,
  RoleInvitationRecord,
} from "@/services/invitationHistoryService";
import { pushSystemNotification } from "@/repositories/shared/notificationsRepository";

export const SYSTEM_ACCOUNTS = [
  { email: "ec.co-organizer@fpt.edu.vn", fullName: "Nguyễn Văn Điều Phối (Coordinator)" },
  { email: "judge.ai@fpt.edu.vn", fullName: "TS. Hoàng Văn Giám Khảo (Judge AI)" },
  { email: "tran.phuc.judge@fpt.edu.vn", fullName: "ThS. Trần Phúc (Giám Khảo RBL)" },
  { email: "mentor.tech@fpt.edu.vn", fullName: "Lê Cố Vấn Chuyên Môn (Mentor)" },
  { email: "hoang.nam.mentor@fpt.edu.vn", fullName: "Nguyễn Hoàng Nam (Senior Cloud Architect)" },
  { email: "nguyenvana@fpt.edu.vn", fullName: "Nguyễn Văn A" },
  { email: "tranthib@fpt.edu.vn", fullName: "Trần Thị B" },
  { email: "levanc@fpt.edu.vn", fullName: "Lê Văn C" },
];

export const checkEmailInSystem = (email: string) => {
  if (!email.trim()) return true;
  return SYSTEM_ACCOUNTS.some((acc) => acc.email.toLowerCase() === email.trim().toLowerCase());
};

export const CoordinatorStaffView: React.FC = () => {
  const searchParams = useSearchParams();
  const queryEventId = searchParams.get("eventId");

  const { data: myEvents = [] } = useMyEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>(queryEventId || "");

  React.useEffect(() => {
    if (queryEventId && queryEventId !== selectedEventId) {
      setSelectedEventId(queryEventId);
    }
  }, [queryEventId]);

  const { data: eventRoles = [], refetch: refetchRoles } = useGetEventRoles(selectedEventId);
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

  const loadHistory = () => {
    if (!selectedEventId) {
      setHistoryRecords([]);
      return;
    }
    const synced = invitationHistoryService.syncWithEventRoles(selectedEventId, eventRoles);
    setHistoryRecords([...synced]);
  };

  React.useEffect(() => {
    loadHistory();
  }, [selectedEventId, eventRoles]);

  const [judgeMessage, setJudgeMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [mentorMessage, setMentorMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [coordinatorMessage, setCoordinatorMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmittingJudge, setIsSubmittingJudge] = useState(false);
  const [isSubmittingMentor, setIsSubmittingMentor] = useState(false);
  const [isSubmittingCoordinator, setIsSubmittingCoordinator] = useState(false);

  const selectedEventObj = myEvents.find((e: any) => (e.id || e.Id || e.eventId || e.EventId) === selectedEventId);

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
        invitationHistoryService.addInvitation({
          eventId: selectedEventId,
          eventName: selectedEventObj?.eventName || selectedEventObj?.EventName,
          email: coordinatorEmail.trim(),
          fullName: coordinatorFullName.trim() || coordinatorEmail.trim().split("@")[0],
          roleName: "EventCoordinator",
          status: "Pending",
          notes: "Cấp tài khoản tạm / Chờ kích hoạt qua email",
        });

        pushSystemNotification({
          title: "Gửi thư mời & Cấp tài khoản tạm Điều Phối Viên",
          message: `Đã gửi thư mời kèm liên kết kích hoạt cấp tài khoản tạm cho ${coordinatorEmail.trim()} làm Điều Phối Viên sự kiện "${selectedEventObj?.eventName || selectedEventObj?.EventName || 'Sự kiện'}".`,
          type: "info",
        });

        setCoordinatorMessage({
          text: res.message || `Đã gửi email mời & cấp tài khoản tạm cho Điều phối viên (${coordinatorEmail}) thành công!`,
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
    if (!judgeEmail.trim() || !judgeFullName.trim() || !judgeTrackId) return;

    // Check role conflict: Can't be both Mentor and Judge for the SAME track
    const existingConflict = eventRoles.find((r: any) => {
      const emailMatch = (r.user?.email || r.User?.Email || r.email || "").toLowerCase() === judgeEmail.trim().toLowerCase();
      const trackMatch = (r.trackId || r.TrackId || "") === judgeTrackId;
      const isMentor = (r.roleName || r.RoleName) === "Mentor";
      return emailMatch && trackMatch && isMentor;
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

    const chosenTrack = tracks.find((t: any) => (t.id || t.Id) === judgeTrackId);

    try {
      const res = await staffRepository.inviteJudge({
        eventId: selectedEventId,
        email: judgeEmail.trim(),
        fullName: judgeFullName.trim(),
        trackId: judgeTrackId,
      });

      if (res && res.success !== false) {
        invitationHistoryService.addInvitation({
          eventId: selectedEventId,
          eventName: selectedEventObj?.eventName || selectedEventObj?.EventName,
          email: judgeEmail.trim(),
          fullName: judgeFullName.trim(),
          roleName: "Judge",
          trackId: judgeTrackId,
          trackName: chosenTrack?.trackName || chosenTrack?.TrackName,
          status: "Pending",
          notes: "Cấp tài khoản tạm / Chờ kích hoạt qua email",
        });

        pushSystemNotification({
          title: "Gửi thư mời & Cấp tài khoản tạm Giám khảo",
          message: `Đã gửi thư mời kèm liên kết kích hoạt cấp tài khoản tạm cho ${judgeEmail.trim()} làm Giám khảo Hạng mục "${chosenTrack?.trackName || chosenTrack?.TrackName || 'Hạng mục'}" sự kiện "${selectedEventObj?.eventName || selectedEventObj?.EventName || 'Sự kiện'}".`,
          type: "info",
        });

        setJudgeMessage({
          text: res.message || `Đã gửi email mời & cấp tài khoản tạm cho Giám khảo (${judgeEmail}) thành công!`,
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
    if (!mentorEmail.trim() || !mentorFullName.trim() || !mentorTrackId) return;

    // Check role conflict: Can't be both Mentor and Judge for the SAME track
    const existingConflict = eventRoles.find((r: any) => {
      const emailMatch = (r.user?.email || r.User?.Email || r.email || "").toLowerCase() === mentorEmail.trim().toLowerCase();
      const trackMatch = (r.trackId || r.TrackId || "") === mentorTrackId;
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

    const chosenTrack = tracks.find((t: any) => (t.id || t.Id) === mentorTrackId);

    try {
      const res = await staffRepository.inviteMentor({
        eventId: selectedEventId,
        email: mentorEmail.trim(),
        fullName: mentorFullName.trim(),
        trackId: mentorTrackId,
      });

      if (res && res.success !== false) {
        invitationHistoryService.addInvitation({
          eventId: selectedEventId,
          eventName: selectedEventObj?.eventName || selectedEventObj?.EventName,
          email: mentorEmail.trim(),
          fullName: mentorFullName.trim(),
          roleName: "Mentor",
          trackId: mentorTrackId,
          trackName: chosenTrack?.trackName || chosenTrack?.TrackName,
          status: "Pending",
          notes: "Cấp tài khoản tạm / Chờ kích hoạt qua email",
        });

        pushSystemNotification({
          title: "Gửi thư mời & Cấp tài khoản tạm Cố vấn",
          message: `Đã gửi thư mời kèm liên kết kích hoạt cấp tài khoản tạm cho ${mentorEmail.trim()} làm Cố vấn Hạng mục "${chosenTrack?.trackName || chosenTrack?.TrackName || 'Hạng mục'}" sự kiện "${selectedEventObj?.eventName || selectedEventObj?.EventName || 'Sự kiện'}".`,
          type: "info",
        });

        setMentorMessage({
          text: res.message || `Đã gửi email mời & cấp tài khoản tạm cho Cố vấn (${mentorEmail}) thành công!`,
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
    if (reason === null) return; // Cancelled

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

  if (!selectedEventId) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col justify-center items-center p-4">
        <Card className="p-8 text-center space-y-4 max-w-md w-full hud-glow-coordinator">
          <Calendar className="w-12 h-12 text-[var(--accent-coordinator)] mx-auto" />
          <h2 className="font-display font-bold text-xl text-[var(--text-primary)] uppercase tracking-wider">
            Chọn Sự Kiện Để Quản Lý Nhân Sự
          </h2>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Vui lòng chọn sự kiện bạn đang điều phối để xem danh sách Giám khảo & Cố vấn hoặc phân công nhân sự mới.
          </p>
          <div className="pt-2">
            <select
              value=""
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped"
            >
              <option value="">-- Chọn Sự Kiện Của Bạn --</option>
              {myEvents.map((ev: any) => {
                const id = ev.id || ev.Id || ev.eventId || ev.EventId;
                const name = ev.eventName || ev.EventName || "Sự kiện không tên";
                return (
                  <option key={id} value={id}>
                    {name} ({ev.season || ev.Season} {ev.year || ev.Year})
                  </option>
                );
              })}
            </select>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-muted)] pb-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[var(--accent-coordinator)] mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>PHÂN CÔNG &amp; QUẢN LÝ NHÂN SỰ SU KIỆN</span>
            </div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-[var(--text-primary)] uppercase tracking-wider">
              Mời Giám Khảo &amp; Cố Vấn Chuyên Môn
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
              Mời nhân sự chuyên môn tham gia sự kiện và quản lý danh sách phân công Giám khảo / Cố vấn theo từng Hạng mục.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[var(--text-muted)]">Sự kiện:</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-[var(--bg-input)] border border-[var(--border-muted)] px-4 py-2 font-mono text-xs text-[var(--accent-coordinator)] hud-clipped font-bold focus:outline-none"
            >
              {myEvents.map((ev: any) => {
                const id = ev.id || ev.Id || ev.eventId || ev.EventId || "";
                const name = ev.eventName || ev.EventName || "Sự kiện";
                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* 3 Invitation Form Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Form 1: Invite Coordinator */}
          <div className="bg-[var(--bg-panel)] border border-[var(--border-muted)] p-6 hud-clipped flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-3 border-b border-[var(--border-muted)] pb-4 mb-6">
                <div className="w-10 h-10 bg-[var(--accent-coordinator)]/10 border border-[var(--accent-coordinator)]/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[var(--accent-coordinator)]" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-base text-[var(--text-primary)] uppercase tracking-wide">
                    Mời Điều Phối Viên (EC)
                  </h2>
                  <p className="text-xs font-mono text-[var(--text-muted)]">
                    Mời thêm Điều phối viên cùng đồng quản lý sự kiện này.
                  </p>
                </div>
              </div>

              <form onSubmit={handleInviteCoordinator} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs text-[var(--text-muted)] uppercase mb-1">
                    Email Điều Phối Viên *
                  </label>
                  <input
                    type="email"
                    required
                    list="system-staff-accounts"
                    value={coordinatorEmail}
                    onChange={(e) => setCoordinatorEmail(e.target.value)}
                    placeholder="ec.co-organizer@fpt.edu.vn"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-muted)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-coordinator)]"
                  />
                  {coordinatorEmail.trim() && !checkEmailInSystem(coordinatorEmail) && (
                    <p className="text-[11px] font-mono text-cyan-400 mt-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Email chưa có tài khoản: Hệ thống sẽ tự động cấp tài khoản tạm &amp; gửi email kích hoạt.</span>
                    </p>
                  )}
                </div>

                {coordinatorMessage && (
                  <div
                    className={`p-3 font-mono text-xs border hud-clipped flex items-center gap-2 ${
                      coordinatorMessage.isError
                        ? "bg-[var(--color-danger)]/10 border-[var(--color-danger)]/30 text-[var(--color-danger)]"
                        : "bg-[var(--accent-coordinator)]/10 border-[var(--accent-coordinator)]/30 text-[var(--accent-coordinator)]"
                    }`}
                  >
                    {coordinatorMessage.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{coordinatorMessage.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingCoordinator}
                  className="w-full py-2.5 bg-[var(--accent-coordinator)] text-black font-mono text-xs font-bold uppercase tracking-wider hud-clipped flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmittingCoordinator
                      ? "Đang Gửi Lời Mời..."
                      : !checkEmailInSystem(coordinatorEmail) && coordinatorEmail.trim()
                      ? "⚡ GỬI MỜI & CẤP TK TẠM ĐIỀU PHỐI VIÊN"
                      : "GỬI LỜI MỜI ĐIỀU PHỐI VIÊN"}
                  </span>
                </button>
              </form>
            </div>
          </div>
          {/* Card Form 1: Invite Judge */}
          <div className="bg-[var(--bg-panel)] border border-[var(--border-muted)] p-6 hud-clipped flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-3 border-b border-[var(--border-muted)] pb-4 mb-6">
                <div className="w-10 h-10 bg-[var(--accent-judge)]/10 border border-[var(--accent-judge)]/30 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-[var(--accent-judge)]" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-[var(--text-primary)] uppercase tracking-wide">
                    Hội Đồng Giám Khảo (Judges)
                  </h2>
                  <p className="text-xs font-mono text-[var(--text-muted)]">
                    Gửi email mời Giám khảo chấm điểm bài nộp theo Mẫu RBL.
                  </p>
                </div>
              </div>

              <form onSubmit={handleInviteJudge} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs text-[var(--text-muted)] uppercase mb-1">
                    Email Giám Khảo *
                  </label>
                  <input
                    type="email"
                    required
                    list="system-staff-accounts"
                    value={judgeEmail}
                    onChange={(e) => setJudgeEmail(e.target.value)}
                    placeholder="judge.ai@fpt.edu.vn"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-muted)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-judge)]"
                  />
                  {judgeEmail.trim() && !checkEmailInSystem(judgeEmail) && (
                    <p className="text-[11px] font-mono text-cyan-400 mt-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Email chưa có tài khoản: Hệ thống sẽ tự động cấp tài khoản tạm &amp; gửi email kích hoạt.</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-mono text-xs text-[var(--text-muted)] uppercase mb-1">
                    Họ Và Tên Giám Khảo *
                  </label>
                  <input
                    type="text"
                    required
                    value={judgeFullName}
                    onChange={(e) => setJudgeFullName(e.target.value)}
                    placeholder="TS. Hoàng Văn Giám Khảo"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-muted)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-judge)]"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs text-[var(--text-muted)] uppercase mb-1">
                    Hạng Mục Phụ Trách (Track) *
                  </label>
                  <select
                    required
                    value={judgeTrackId}
                    onChange={(e) => setJudgeTrackId(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-muted)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-judge)]"
                  >
                    <option value="">-- Chọn hạng mục (bắt buộc) --</option>
                    {tracks.map((t: any) => (
                      <option key={t.id || t.Id} value={t.id || t.Id}>
                        {t.trackName || t.TrackName}
                      </option>
                    ))}
                  </select>
                </div>

                {judgeMessage && (
                  <div
                    className={`p-3 font-mono text-xs border hud-clipped flex items-center gap-2 ${
                      judgeMessage.isError
                        ? "bg-[var(--color-danger)]/10 border-[var(--color-danger)]/30 text-[var(--color-danger)]"
                        : "bg-[var(--accent-judge)]/10 border-[var(--accent-judge)]/30 text-[var(--accent-judge)]"
                    }`}
                  >
                    {judgeMessage.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{judgeMessage.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingJudge}
                  className="w-full py-2.5 bg-[var(--accent-judge)] text-black font-mono text-xs font-bold uppercase tracking-wider hud-clipped flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmittingJudge
                      ? "Đang Gửi Lời Mời..."
                      : !checkEmailInSystem(judgeEmail) && judgeEmail.trim()
                      ? "⚡ GỬI MỜI & CẤP TK TẠM GIÁM KHẢO"
                      : "GỬI LỜI MỜI GIÁM KHẢO"}
                  </span>
                </button>
              </form>
            </div>
          </div>

          {/* Card Form 2: Invite Mentor */}
          <div className="bg-[var(--bg-panel)] border border-[var(--border-muted)] p-6 hud-clipped flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-3 border-b border-[var(--border-muted)] pb-4 mb-6">
                <div className="w-10 h-10 bg-[#2dd4bf]/10 border border-[#2dd4bf]/30 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-[#2dd4bf]" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-[var(--text-primary)] uppercase tracking-wide">
                    Đội Ngũ Cố Vấn (Mentors)
                  </h2>
                  <p className="text-xs font-mono text-[var(--text-muted)]">
                    Gửi email mời Cố vấn tư vấn chuyên môn cho các Đội thi.
                  </p>
                </div>
              </div>

              <form onSubmit={handleInviteMentor} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs text-[var(--text-muted)] uppercase mb-1">
                    Email Cố Vấn *
                  </label>
                  <input
                    type="email"
                    required
                    list="system-staff-accounts"
                    value={mentorEmail}
                    onChange={(e) => setMentorEmail(e.target.value)}
                    placeholder="mentor.tech@fpt.edu.vn"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-muted)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#2dd4bf]"
                  />
                  {mentorEmail.trim() && !checkEmailInSystem(mentorEmail) && (
                    <p className="text-[11px] font-mono text-cyan-400 mt-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Email chưa có tài khoản: Hệ thống sẽ tự động cấp tài khoản tạm &amp; gửi email kích hoạt.</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-mono text-xs text-[var(--text-muted)] uppercase mb-1">
                    Họ Và Tên Cố Vấn *
                  </label>
                  <input
                    type="text"
                    required
                    value={mentorFullName}
                    onChange={(e) => setMentorFullName(e.target.value)}
                    placeholder="Lê Cố Vấn Chuyên Môn"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-muted)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#2dd4bf]"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs text-[var(--text-muted)] uppercase mb-1">
                    Hạng Mục Phụ Trách (Track) *
                  </label>
                  <select
                    required
                    value={mentorTrackId}
                    onChange={(e) => setMentorTrackId(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-muted)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#2dd4bf]"
                  >
                    <option value="">-- Chọn hạng mục (bắt buộc) --</option>
                    {tracks.map((t: any) => (
                      <option key={t.id || t.Id} value={t.id || t.Id}>
                        {t.trackName || t.TrackName}
                      </option>
                    ))}
                  </select>
                </div>

                {mentorMessage && (
                  <div
                    className={`p-3 font-mono text-xs border hud-clipped flex items-center gap-2 ${
                      mentorMessage.isError
                        ? "bg-[var(--color-danger)]/10 border-[var(--color-danger)]/30 text-[var(--color-danger)]"
                        : "bg-[#2dd4bf]/10 border-[#2dd4bf]/30 text-[#2dd4bf]"
                    }`}
                  >
                    {mentorMessage.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{mentorMessage.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingMentor}
                  className="w-full py-2.5 bg-[#2dd4bf] text-black font-mono text-xs font-bold uppercase tracking-wider hud-clipped flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmittingMentor
                      ? "Đang Gửi Lời Mời..."
                      : !checkEmailInSystem(mentorEmail) && mentorEmail.trim()
                      ? "⚡ GỬI MỜI & CẤP TK TẠM CỐ VẤN"
                      : "GỬI LỜI MỜI CỐ VẤN"}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Section 2: Assigned Staff Table */}
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-muted)] pb-4">
            <div>
              <h3 className="font-display font-bold text-base text-[var(--text-primary)] uppercase flex items-center gap-2">
                <Shield className="w-4 h-4 text-[var(--accent-coordinator)]" />
                Danh Sách Nhân Sự Đã Phân Công ({filteredRoles.length})
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-sans">
                Danh sách Giám khảo và Cố vấn được phân công quản lý và hỗ trợ các Hạng mục trong sự kiện.
              </p>
            </div>

            <div className="w-full sm:w-64">
              <Input
                type="text"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                placeholder="Tìm nhân sự theo email..."
                className="text-xs font-mono"
              />
            </div>
          </div>

          {filteredRoles.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-[var(--text-muted)]">
              Chưa có nhân sự Giám khảo/Cố vấn nào được phân công hoặc không tìm thấy kết quả.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-muted)] bg-[var(--bg-input)] text-[var(--text-muted)] uppercase text-[10px]">
                    <th className="p-3">Họ &amp; Tên / Email</th>
                    <th className="p-3">Vai Trò</th>
                    <th className="p-3">Hạng Mục (Track)</th>
                    <th className="p-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-muted)]">
                  {filteredRoles.map((er: any, idx: number) => {
                    const roleId = er.id || er.Id || er.eventRoleId || er.EventRoleId || `er-${idx}`;
                    const email = er.user?.email || er.User?.Email || er.email || "staff@fpt.edu.vn";
                    const fullName = er.user?.fullName || er.User?.FullName || er.fullName || email.split("@")[0];
                    const roleName = er.roleName || er.RoleName || "Staff";
                    const trackName = er.track?.trackName || er.Track?.TrackName || "Toàn bộ sự kiện";

                    return (
                      <tr key={roleId} className="hover:bg-[var(--bg-panel)] transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-[var(--text-primary)]">{fullName}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">{email}</div>
                        </td>
                        <td className="p-3">
                          <Badge tone={roleName === "Judge" ? "warning" : "info"}>
                            {roleName === "Judge" ? "Giám khảo (Judge)" : "Cố vấn (Mentor)"}
                          </Badge>
                        </td>
                        <td className="p-3 text-[var(--text-muted)]">{trackName}</td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            onClick={() => handleRemoveRole(roleId, email)}
                            className="text-[11px] font-mono text-[var(--color-danger)] hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Gỡ vai trò
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Section 3: Role Invitation History & Status Tracking */}
        {selectedEventId && (
          <RoleInvitationHistoryCard
            eventId={selectedEventId}
            eventName={selectedEventObj?.eventName || selectedEventObj?.EventName || "Sự kiện"}
            records={historyRecords}
            onRefresh={loadHistory}
            onResend={handleResendStaffInvitation}
            onRevoke={handleRevokeStaffInvitation}
            onDeleteHistory={() => loadHistory()}
          />
        )}

        {/* Global Datalist for System Accounts Auto-Feed */}
        <datalist id="system-staff-accounts">
          {SYSTEM_ACCOUNTS.map((acc) => (
            <option key={acc.email} value={acc.email}>
              {acc.fullName} ({acc.email})
            </option>
          ))}
        </datalist>

      </main>
    </div>
  );
};
