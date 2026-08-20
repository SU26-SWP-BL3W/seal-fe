"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { staffRepository, useGetEventRoles } from "@/repositories/staffRepository";
import { useGetUsers } from "@/repositories/usersRepository";
import { useMyEvents } from "@/repositories/eventsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { Link } from "@/i18n/routing";
import {
  UserCheck,
  UserPlus,
  Send,
  AlertCircle,
  CheckCircle2,
  Shield,
  Trash2,
  Search,
  Filter,
  Calendar,
  Info,
  ChevronLeft,
  ChevronRight,
  Sliders,
} from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesModal } from "@/components/domain/UnsavedChangesModal";
import { Button, Card, Badge, Input } from "@/components/ui";

export const checkEmailInSystem = (email: string, usersList: Array<any> = []) => {
  if (!email.trim()) return true;
  const target = email.trim().toLowerCase();
  return usersList.some((acc: any) => {
    const e = (acc?.email || acc?.Email || acc?.userEmail || acc?.UserEmail || "").trim().toLowerCase();
    return e === target;
  });
};

export const CoordinatorStaffView: React.FC = () => {
  const searchParams = useSearchParams();
  const queryEventId = searchParams.get("eventId");

  const { data: usersPaged } = useGetUsers({ pageSize: 500 });
  const systemAccounts = usersPaged?.data || [];

  const { data: myEvents = [] } = useMyEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>(queryEventId || "");

  React.useEffect(() => {
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

  const { data: eventRoles = [], refetch: refetchRoles } = useGetEventRoles(selectedEventId);
  const { data: tracks = [] } = useGetTracksByEvent(selectedEventId);

  const [judgeEmail, setJudgeEmail] = useState("");
  const [judgeTrackId, setJudgeTrackId] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");
  const [mentorTrackId, setMentorTrackId] = useState("");
  const [coordinatorEmail, setCoordinatorEmail] = useState("");
  const [coordinatorFullName, setCoordinatorFullName] = useState("");
  const [staffSearch, setStaffSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 4;

  const isDirty = Boolean(judgeEmail.trim() || mentorEmail.trim() || coordinatorEmail.trim());
  const { showModal, confirmLeave, cancelStay } = useUnsavedChanges(isDirty);
  
  const [judgeMessage, setJudgeMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [mentorMessage, setMentorMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [coordinatorMessage, setCoordinatorMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmittingJudge, setIsSubmittingJudge] = useState(false);
  const [isSubmittingMentor, setIsSubmittingMentor] = useState(false);
  const [isSubmittingCoordinator, setIsSubmittingCoordinator] = useState(false);

  const handleInviteCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordinatorEmail.trim() || !selectedEventId) return;

    setIsSubmittingCoordinator(true);
    setCoordinatorMessage(null);

    try {
      const res = await staffRepository.inviteCoordinator({
        eventId: selectedEventId,
        email: coordinatorEmail.trim(),
        fullName: coordinatorFullName.trim() || undefined,
      });

      setIsSubmittingCoordinator(false);

      if (res.success) {
        setCoordinatorMessage({
          text: res.message || `Đã gửi email mời Điều phối viên (${coordinatorEmail}) thành công!`,
          isError: false,
        });
        setCoordinatorEmail("");
        setCoordinatorFullName("");
        await refetchRoles();
      } else {
        setCoordinatorMessage({
          text: res.message || "Gửi lời mời Điều phối viên thất bại.",
          isError: true,
        });
      }
    } catch (err: any) {
      setIsSubmittingCoordinator(false);
      const msg = err.response?.data?.message || err.message || "Gửi lời mời thất bại. Bạn phải là Event Coordinator của sự kiện này.";
      setCoordinatorMessage({
        text: msg,
        isError: true,
      });
    }
  };

  const handleInviteJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judgeEmail.trim()) return;

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

    try {
      const res = await staffRepository.inviteJudge({
        eventId: selectedEventId,
        email: judgeEmail.trim(),
        trackId: judgeTrackId || undefined,
      });

      setIsSubmittingJudge(false);

      if (res?.invitationId || res?.id || res?.success || res?.status === "Pending") {
        setJudgeMessage({
          text: res?.message || `Đã tạo lời mời và gửi email tới (${judgeEmail}) thành công!`,
          isError: false,
        });
        setJudgeEmail("");
        await refetchRoles();
      } else {
        setJudgeMessage({
          text: res?.message || "Gửi lời mời thất bại, vui lòng thử lại.",
          isError: true,
        });
      }
    } catch (err: any) {
      setIsSubmittingJudge(false);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (typeof err.response?.data === "string" ? err.response?.data : null) ||
        err.message ||
        "Gửi lời mời Giám khảo thất bại.";
      setJudgeMessage({
        text: msg,
        isError: true,
      });
    }
  };

  const handleInviteMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorEmail.trim()) return;

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

    try {
      const res = await staffRepository.inviteMentor({
        eventId: selectedEventId,
        email: mentorEmail.trim(),
        trackId: mentorTrackId || undefined,
      });

      setIsSubmittingMentor(false);

      if (res?.invitationId || res?.id || res?.success || res?.status === "Pending") {
        setMentorMessage({
          text: res?.message || `Đã tạo lời mời và gửi email tới (${mentorEmail}) thành công!`,
          isError: false,
        });
        setMentorEmail("");
        await refetchRoles();
      } else {
        setMentorMessage({
          text: res?.message || "Gửi lời mời thất bại, vui lòng thử lại.",
          isError: true,
        });
      }
    } catch (err: any) {
      setIsSubmittingMentor(false);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (typeof err.response?.data === "string" ? err.response?.data : null) ||
        err.message ||
        "Gửi lời mời Cố vấn thất bại.";
      setMentorMessage({
        text: msg,
        isError: true,
      });
    }
  };

  const handleRemoveRole = async (roleId: string, email?: string) => {
    if (!confirm(`Bạn có chắc chắn muốn gỡ vai trò nhân sự này khỏi sự kiện?`)) return;
    try {
      await staffRepository.removeEventRole(roleId);
      await refetchRoles();
    } catch {
      alert("Gỡ vai trò thất bại.");
    }
  };

  const filteredRoles = eventRoles.filter((er: any) => {
    const rawRole = er.roleName ?? er.RoleName ?? er.role ?? er.Role ?? "";
    const isEC = rawRole === "EventCoordinator" || rawRole === "Coordinator" || rawRole === "EC" || rawRole === 0 || rawRole === "0";
    const isJudge = rawRole === "Judge" || rawRole === 1 || rawRole === "1";
    const isMentor = rawRole === "Mentor" || rawRole === 2 || rawRole === "2";
    if (!isEC && !isJudge && !isMentor) return false;
    if (!staffSearch.trim()) return true;
    const query = staffSearch.toLowerCase();
    const email = (er.user?.email || er.User?.Email || er.email || er.Email || "").toLowerCase();
    const name = (er.user?.fullName || er.User?.FullName || er.fullName || er.FullName || "").toLowerCase();
    return email.includes(query) || name.includes(query);
  });

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedRoles = filteredRoles.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-4 py-4 space-y-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--border-muted)] pb-3">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#a855f7] font-bold uppercase tracking-wider mb-0.5">
              <Shield className="w-3.5 h-3.5 text-[#a855f7]" />
              <span>QUẢN LÝ NHÂN SỰ BAN TỔ CHỨC</span>
            </div>
            <h1 className="font-mono font-bold text-xl md:text-2xl text-[#e1e7ec] uppercase tracking-wider">
              MỜI VÀ PHÂN CÔNG GIÁM KHẢO &amp; CỐ VẤN
            </h1>
            <p className="text-xs font-sans text-[#8a9ba8] mt-0.5 leading-relaxed max-w-3xl">
              Mời nhân sự chuyên môn tham gia sự kiện và quản lý danh sách phân công Giám khảo, Cố vấn cho từng hạng mục thi đấu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs text-[var(--text-muted)]">Sự kiện:</span>
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-[var(--bg-input)] border border-[var(--border-muted)] px-3 py-1.5 font-mono text-xs text-[var(--accent-coordinator)] hud-clipped font-bold focus:outline-none"
              >
                {myEvents.length === 0 && <option value="">-- Chưa có sự kiện --</option>}
                {myEvents.map((ev: any) => {
                  const id = ev.id || ev.Id || ev.eventId || ev.EventId || "";
                  const name = ev.eventName || ev.EventName || "Sự kiện không tên";
                  const season = ev.season || ev.Season || "";
                  const year = ev.year || ev.Year || "";
                  const suffix = season || year ? ` (${season} ${year})`.trim() : "";
                  return (
                    <option key={id} value={id}>
                      {name}{suffix}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedEventId && (
              <Link
                href={`/coordinator/events/new?eventId=${selectedEventId}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#a855f7]/15 border border-[#a855f7]/50 text-[#c084fc] hover:bg-[#a855f7] hover:text-black font-mono text-xs font-bold hud-clipped transition-all cursor-pointer shadow-sm hover:shadow-[#a855f7]/20"
                title="Đến trang cấu hình Vòng thi, Hạng mục và Tiêu chí của sự kiện này"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>CẤU HÌNH SỰ KIỆN (WIZARD) ➔</span>
              </Link>
            )}
          </div>
        </div>

        {/* 3 Invitation Form Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card Form 1: Invite Coordinator */}
          <div className="bg-[var(--bg-panel)] border border-[var(--border-muted)] p-4 hud-clipped flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2.5 border-b border-[var(--border-muted)] pb-3 mb-3">
                <div className="w-8 h-8 bg-[var(--accent-coordinator)]/10 border border-[var(--accent-coordinator)]/30 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-[var(--accent-coordinator)]" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-sm text-[var(--text-primary)] uppercase tracking-wide">
                    Mời Điều Phối Viên (EC)
                  </h2>
                  <p className="text-[11px] font-mono text-[var(--text-muted)]">
                    Mời thêm Điều phối viên cùng đồng quản lý sự kiện.
                  </p>
                </div>
              </div>

              <form onSubmit={handleInviteCoordinator} className="space-y-3">
                <div>
                  <label className="block font-mono text-[11px] text-[var(--text-muted)] uppercase mb-1">
                    Email Điều Phối Viên *
                  </label>
                  <input
                    type="email"
                    required
                    list="system-staff-accounts"
                    value={coordinatorEmail}
                    onChange={(e) => setCoordinatorEmail(e.target.value)}
                    placeholder="ec.co-organizer@fpt.edu.vn"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-muted)] px-3 py-1.5 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-coordinator)]"
                  />
                  {coordinatorEmail.trim() && (
                    checkEmailInSystem(coordinatorEmail, systemAccounts) ? (
                      <p className="text-[10px] font-mono text-emerald-400 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Đã có tài khoản trong hệ thống</span>
                      </p>
                    ) : (
                      <p className="text-[10px] font-mono text-cyan-400 mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>Email mới — Hệ thống sẽ gửi thư mời đăng ký.</span>
                      </p>
                    )
                  )}
                </div>

                {coordinatorMessage && (
                  <div
                    className={`p-2 font-mono text-[11px] border hud-clipped flex items-center gap-2 ${
                      coordinatorMessage.isError
                        ? "bg-[var(--color-danger)]/10 border-[var(--color-danger)]/30 text-[var(--color-danger)]"
                        : "bg-[var(--accent-coordinator)]/10 border-[var(--accent-coordinator)]/30 text-[var(--accent-coordinator)]"
                    }`}
                  >
                    {coordinatorMessage.isError ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    <span>{coordinatorMessage.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingCoordinator}
                  className="w-full py-2 bg-[var(--accent-coordinator)] text-black font-mono text-xs font-bold uppercase tracking-wider hud-clipped flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingCoordinator ? "Đang Gửi..." : "Gửi Lời Mời Điều Phối Viên"}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Card Form 2: Invite Judge */}
          <div className="bg-[var(--bg-panel)] border border-[var(--border-muted)] p-4 hud-clipped flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2.5 border-b border-[var(--border-muted)] pb-3 mb-3">
                <div className="w-8 h-8 bg-[var(--accent-judge)]/10 border border-[var(--accent-judge)]/30 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4 text-[var(--accent-judge)]" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-sm text-[var(--text-primary)] uppercase tracking-wide">
                    Hội Đồng Giám Khảo (Judges)
                  </h2>
                  <p className="text-[11px] font-mono text-[var(--text-muted)]">
                    Gửi email mời Giám khảo chấm điểm bài nộp.
                  </p>
                </div>
              </div>

              <form onSubmit={handleInviteJudge} className="space-y-3">
                <div>
                  <label className="block font-mono text-[11px] text-[var(--text-muted)] uppercase mb-1">
                    Email Giám Khảo *
                  </label>
                  <input
                    type="email"
                    required
                    list="system-staff-accounts"
                    value={judgeEmail}
                    onChange={(e) => setJudgeEmail(e.target.value)}
                    placeholder="judge.ai@fpt.edu.vn"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-muted)] px-3 py-1.5 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-judge)]"
                  />
                  {judgeEmail.trim() && (
                    checkEmailInSystem(judgeEmail, systemAccounts) ? (
                      <p className="text-[10px] font-mono text-emerald-400 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Đã có tài khoản trong hệ thống</span>
                      </p>
                    ) : (
                      <p className="text-[10px] font-mono text-cyan-400 mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>Email mới — Hệ thống sẽ gửi thư mời đăng ký.</span>
                      </p>
                    )
                  )}
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-[var(--text-muted)] uppercase mb-1">
                    Hạng Mục Phụ Trách
                  </label>
                  <select
                    value={judgeTrackId}
                    onChange={(e) => setJudgeTrackId(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-muted)] px-3 py-1.5 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-judge)]"
                  >
                    <option value="">Toàn sự kiện (Chấm tất cả Hạng mục)</option>
                    {tracks.map((t: any) => (
                      <option key={t.id || t.Id} value={t.id || t.Id}>
                        {t.trackName || t.TrackName}
                      </option>
                    ))}
                  </select>
                </div>

                {judgeMessage && (
                  <div
                    className={`p-2 font-mono text-[11px] border hud-clipped flex items-center gap-2 ${
                      judgeMessage.isError
                        ? "bg-[var(--color-danger)]/10 border-[var(--color-danger)]/30 text-[var(--color-danger)]"
                        : "bg-[var(--accent-judge)]/10 border-[var(--accent-judge)]/30 text-[var(--accent-judge)]"
                    }`}
                  >
                    {judgeMessage.isError ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    <span>{judgeMessage.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingJudge}
                  className="w-full py-2 bg-[var(--accent-judge)] text-black font-mono text-xs font-bold uppercase tracking-wider hud-clipped flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingJudge ? "Đang Gửi..." : "Gửi Lời Mời Giám Khảo"}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Card Form 3: Invite Mentor */}
          <div className="bg-[var(--bg-panel)] border border-[var(--border-muted)] p-4 hud-clipped flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2.5 border-b border-[var(--border-muted)] pb-3 mb-3">
                <div className="w-8 h-8 bg-[#2dd4bf]/10 border border-[#2dd4bf]/30 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4 text-[#2dd4bf]" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-sm text-[var(--text-primary)] uppercase tracking-wide">
                    Đội Ngũ Cố Vấn (Mentors)
                  </h2>
                  <p className="text-[11px] font-mono text-[var(--text-muted)]">
                    Gửi email mời Cố vấn tư vấn cho Đội thi.
                  </p>
                </div>
              </div>

              <form onSubmit={handleInviteMentor} className="space-y-3">
                <div>
                  <label className="block font-mono text-[11px] text-[var(--text-muted)] uppercase mb-1">
                    Email Cố Vấn *
                  </label>
                  <input
                    type="email"
                    required
                    list="system-staff-accounts"
                    value={mentorEmail}
                    onChange={(e) => setMentorEmail(e.target.value)}
                    placeholder="mentor.tech@fpt.edu.vn"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-muted)] px-3 py-1.5 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#2dd4bf]"
                  />
                  {mentorEmail.trim() && (
                    checkEmailInSystem(mentorEmail, systemAccounts) ? (
                      <p className="text-[10px] font-mono text-emerald-400 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Đã có tài khoản trong hệ thống</span>
                      </p>
                    ) : (
                      <p className="text-[10px] font-mono text-cyan-400 mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>Email mới — Hệ thống sẽ gửi thư mời đăng ký.</span>
                      </p>
                    )
                  )}
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-[var(--text-muted)] uppercase mb-1">
                    Hạng Mục Phụ Trách
                  </label>
                  <select
                    value={mentorTrackId}
                    onChange={(e) => setMentorTrackId(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-muted)] px-3 py-1.5 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#2dd4bf]"
                  >
                    <option value="">Toàn sự kiện (Cố vấn chung các Hạng mục)</option>
                    {tracks.map((t: any) => (
                      <option key={t.id || t.Id} value={t.id || t.Id}>
                        {t.trackName || t.TrackName}
                      </option>
                    ))}
                  </select>
                </div>

                {mentorMessage && (
                  <div
                    className={`p-2 font-mono text-[11px] border hud-clipped flex items-center gap-2 ${
                      mentorMessage.isError
                        ? "bg-[var(--color-danger)]/10 border-[var(--color-danger)]/30 text-[var(--color-danger)]"
                        : "bg-[#2dd4bf]/10 border-[#2dd4bf]/30 text-[#2dd4bf]"
                    }`}
                  >
                    {mentorMessage.isError ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    <span>{mentorMessage.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingMentor}
                  className="w-full py-2 bg-[#2dd4bf] text-black font-mono text-xs font-bold uppercase tracking-wider hud-clipped flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingMentor ? "Đang Gửi..." : "Gửi Lời Mời Cố Vấn"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Section 2: Assigned Staff Table */}
        <Card className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-muted)] pb-3">
            <div>
              <h3 className="font-display font-bold text-sm text-[var(--text-primary)] uppercase flex items-center gap-2">
                <Shield className="w-4 h-4 text-[var(--accent-coordinator)]" />
                Danh Sách Nhân Sự Đã Phân Công ({filteredRoles.length})
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-sans">
                Danh sách Giám khảo và Cố vấn được phân công quản lý và hỗ trợ các Hạng mục trong sự kiện.
              </p>
            </div>

            <div className="w-full sm:w-60">
              <Input
                type="text"
                value={staffSearch}
                onChange={(e) => {
                  setStaffSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm nhân sự theo email..."
                className="text-xs font-mono py-1"
              />
            </div>
          </div>

          {filteredRoles.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-[var(--text-muted)]">
              Chưa có nhân sự Giám khảo/Cố vấn nào được phân công hoặc không tìm thấy kết quả.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-muted)] bg-[var(--bg-input)] text-[var(--text-muted)] uppercase text-[10px]">
                      <th className="p-2.5">Họ &amp; Tên / Email</th>
                      <th className="p-2.5">Vai Trò</th>
                      <th className="p-2.5">Hạng Mục</th>
                      <th className="p-2.5 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-muted)]">
                    {paginatedRoles.map((er: any, idx: number) => {
                      const roleId = er.id || er.Id || er.eventRoleId || er.EventRoleId || `er-${idx}`;
                      const email = er.user?.email || er.User?.Email || er.email || er.Email || "staff@fpt.edu.vn";
                      const fullName = er.user?.fullName || er.User?.FullName || er.fullName || er.FullName || email.split("@")[0];
                      const rawRole = er.roleName ?? er.RoleName ?? er.role ?? er.Role ?? "Staff";
                      const isEC = rawRole === "EventCoordinator" || rawRole === "Coordinator" || rawRole === "EC" || rawRole === 0 || rawRole === "0";
                      const isJudge = rawRole === "Judge" || rawRole === 1 || rawRole === "1";
                      const trackName = er.track?.trackName || er.Track?.TrackName || er.trackName || er.TrackName || "Toàn bộ sự kiện";

                      return (
                        <tr key={roleId} className="hover:bg-[var(--bg-panel)] transition-colors">
                          <td className="p-2.5">
                            <div className="font-bold text-[var(--text-primary)]">{fullName}</div>
                            <div className="text-[10px] text-[var(--text-muted)]">{email}</div>
                          </td>
                          <td className="p-2.5">
                            <Badge tone={isEC ? "coordinator" : isJudge ? "judge" : "mentor"}>
                              {isEC ? "Điều phối viên (EC)" : isJudge ? "Giám khảo (Judge)" : "Cố vấn (Mentor)"}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-[var(--text-muted)]">{trackName}</td>
                          <td className="p-2.5 text-right">
                            <Button
                              variant="ghost"
                              onClick={() => handleRemoveRole(roleId, email)}
                              className="text-[11px] font-mono text-[var(--color-danger)] hover:bg-red-500/10 py-1 px-2"
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

              {/* Pagination Controls */}
              {filteredRoles.length > 0 && (
                <div className="pt-3 border-t border-[var(--border-muted)]">
                  <Pagination
                    currentPage={safePage}
                    totalPages={totalPages}
                    totalItems={filteredRoles.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setCurrentPage}
                    itemLabel="nhân sự"
                  />
                </div>
              )}
            </>
          )}
        </Card>

        <datalist id="system-staff-accounts">
          {systemAccounts.map((acc: any, idx: number) => {
            const emailVal = acc.email || acc.Email || acc.userEmail || "";
            const nameVal = acc.fullName || acc.FullName || emailVal;
            return (
              <option key={acc.id || acc.Id || idx} value={emailVal}>
                {nameVal} ({emailVal})
              </option>
            );
          })}
        </datalist>

        <UnsavedChangesModal
          isOpen={showModal}
          onConfirmLeave={confirmLeave}
          onCancelStay={cancelStay}
        />
      </main>
    </div>
  );
};

