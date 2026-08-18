"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { staffRepository, useGetEventRoles } from "@/repositories/staffRepository";
import { useGetUsers } from "@/repositories/usersRepository";
import { useMyEvents, useEvents } from "@/repositories/eventsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { UserCheck, UserPlus, Send, AlertCircle, CheckCircle2, Shield, Trash2, Search, Filter, Calendar, Info, Edit3, PlusCircle, Layers, Users } from "lucide-react";
import { Button, Card, Badge, Input } from "@/components/ui";
import { ComprehensiveEventEditModal } from "@/components/domain/ComprehensiveEventEditModal";
import { CoordinatorEventConfigPanel } from "@/components/domain/CoordinatorEventConfigPanel";

export const checkEmailInSystem = (email: string, usersList: Array<any> = []) => {
  if (!email.trim()) return true;
  const target = email.trim().toLowerCase();
  return usersList.some((acc: any) => {
    const e = (acc?.email || acc?.Email || acc?.userEmail || acc?.UserEmail || "").trim().toLowerCase();
    return e === target;
  });
};

export const CoordinatorStaffView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const searchParams = useSearchParams();
  const queryEventId = searchParams.get("eventId");

  const { data: usersPaged } = useGetUsers({ pageSize: 500 });
  const systemAccounts = usersPaged?.data || [];

  const { data: myEvents = [] } = useMyEvents();
  const { data: rawAllEvents = [] } = useEvents();
  const allEvents = Array.isArray(rawAllEvents) ? rawAllEvents : (rawAllEvents as any)?.data ?? [];
  const eventsList = (currentUser?.isAdmin || currentUser?.IsAdmin)
    ? allEvents
    : myEvents;

  const [selectedEventId, setSelectedEventId] = useState<string>(queryEventId || "");
  const [activeTab, setActiveTab] = useState<"config" | "staff">("config");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  React.useEffect(() => {
    if (queryEventId && queryEventId !== selectedEventId) {
      setSelectedEventId(queryEventId);
    } else if (!selectedEventId && eventsList.length > 0) {
      setSelectedEventId(eventsList[0].id || eventsList[0].eventId || "");
    }
  }, [queryEventId, eventsList, selectedEventId]);

  const currentEvent = eventsList.find((e: any) => (e.id || e.Id || e.eventId || e.EventId) === selectedEventId) || (eventsList.length > 0 ? eventsList[0] : { id: selectedEventId });

  const { data: eventRoles = [], refetch: refetchRoles } = useGetEventRoles(selectedEventId);
  const { data: tracks = [] } = useGetTracksByEvent(selectedEventId);

  const [judgeEmail, setJudgeEmail] = useState("");
  const [judgeTrackId, setJudgeTrackId] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");
  const [mentorTrackId, setMentorTrackId] = useState("");
  const [coordinatorEmail, setCoordinatorEmail] = useState("");
  const [coordinatorFullName, setCoordinatorFullName] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  
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

  const handleRemoveRole = async (roleId: string, roleName?: any, email?: string) => {
    const isEC = roleName === "EventCoordinator" || roleName === "Coordinator" || roleName === "EC" || roleName === 0 || roleName === "0";
    if (isEC && !(currentUser?.isAdmin || currentUser?.IsAdmin)) {
      alert("Điều phối viên (EC) không có quyền gỡ vai trò của Điều phối viên khác. Chỉ Quản trị viên (Admin) mới có quyền này.");
      return;
    }
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
              <option value="">-- Chọn Sự Kiện Để Quản Lý ({eventsList.length}) --</option>
              {eventsList.map((ev: any) => {
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
            <div className="flex items-center gap-2 font-mono text-xs text-[#c084fc] font-bold uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4 text-[#c084fc]" />
              <span>MODULE 01 • QUẢN LÝ &amp; ĐIỀU HÀNH SỰ KIỆN</span>
            </div>
            <h1 className="font-mono font-bold text-2xl md:text-3xl text-[#e1e7ec] uppercase tracking-wider">
              TRUNG TÂM CẤU HÌNH SỰ KIỆN &amp; NHÂN SỰ
            </h1>
            <p className="text-xs font-sans text-[#8a9ba8] mt-1.5 leading-relaxed max-w-3xl">
              Quản lý toàn diện thông tin cuộc thi, thời hạn nộp bài các vòng thi, hạng mục chuyên môn và phân bổ hội đồng Giám khảo, Cố vấn.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[var(--text-muted)]">Sự kiện:</span>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="bg-[var(--bg-input)] border border-[var(--border-muted)] px-4 py-2 font-mono text-xs text-[var(--accent-coordinator)] hud-clipped font-bold focus:outline-none cursor-pointer"
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
        </div>

        {/* 2 Main Operation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-muted)] pb-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("config")}
            className={`px-5 py-2.5 font-bold uppercase flex items-center gap-2 hud-clipped transition-all cursor-pointer ${
              activeTab === "config"
                ? "bg-[#a855f7] text-white shadow-md shadow-[#a855f7]/30"
                : "bg-[var(--bg-panel)] text-[var(--text-muted)] hover:text-white border border-zinc-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>⚙️ 1. CẤU HÌNH SỰ KIỆN, VÒNG THI &amp; HẠNG MỤC</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("staff")}
            className={`px-5 py-2.5 font-bold uppercase flex items-center gap-2 hud-clipped transition-all cursor-pointer ${
              activeTab === "staff"
                ? "bg-[#a855f7] text-white shadow-md shadow-[#a855f7]/30"
                : "bg-[var(--bg-panel)] text-[var(--text-muted)] hover:text-white border border-zinc-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👥 2. MỜI &amp; PHÂN CÔNG GIÁM KHẢO / CỐ VẤN ({filteredRoles.length})</span>
          </button>
        </div>

        {/* TAB 1: EVENT, ROUNDS & TRACKS CONFIGURATION */}
        {activeTab === "config" && (
          <CoordinatorEventConfigPanel
            event={currentEvent}
            onUpdated={() => {
              refetchRoles();
            }}
          />
        )}

        {/* TAB 2: STAFF INVITATION & ROSTER ASSIGNMENT */}
        {activeTab === "staff" && (
          <div className="space-y-8">
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
                  {coordinatorEmail.trim() && (
                    checkEmailInSystem(coordinatorEmail, systemAccounts) ? (
                      <p className="text-[11px] font-mono text-emerald-400 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Đã tìm thấy tài khoản trong hệ thống</span>
                      </p>
                    ) : (
                      <p className="text-[11px] font-mono text-cyan-400 mt-1 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Email chưa đăng ký — Hệ thống sẽ gửi thư mời tạo tài khoản/chấp nhận role.</span>
                      </p>
                    )
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
                  className="w-full py-2.5 bg-[#a855f7]/15 border border-[#a855f7] text-[#c084fc] hover:bg-[#a855f7] hover:text-white font-mono text-xs font-bold uppercase tracking-wider hud-clipped flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_12px_rgba(168,85,247,0.15)] hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingCoordinator ? "ĐANG GỬI LỜI MỜI..." : "GỬI LỜI MỜI ĐIỀU PHỐI VIÊN"}</span>
                </button>
              </form>
            </div>
          </div>
          {/* Card Form 2: Invite Judge */}
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
                  {judgeEmail.trim() && (
                    checkEmailInSystem(judgeEmail, systemAccounts) ? (
                      <p className="text-[11px] font-mono text-emerald-400 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Đã tìm thấy tài khoản trong hệ thống</span>
                      </p>
                    ) : (
                      <p className="text-[11px] font-mono text-cyan-400 mt-1 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Email chưa đăng ký — Hệ thống sẽ gửi thư mời tạo tài khoản/chấp nhận role.</span>
                      </p>
                    )
                  )}
                </div>

                <div>
                  <label className="block font-mono text-xs text-[var(--text-muted)] uppercase mb-1">
                    Hạng Mục Phụ Trách (Track)
                  </label>
                  <select
                    value={judgeTrackId}
                    onChange={(e) => setJudgeTrackId(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-muted)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-judge)]"
                  >
                    <option value="">Toàn sự kiện (Chấm điểm chung tất cả Hạng mục)</option>
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
                  className="w-full py-2.5 bg-amber-500/15 border border-amber-500 text-amber-300 hover:bg-amber-500 hover:text-black font-mono text-xs font-bold uppercase tracking-wider hud-clipped flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_12px_rgba(245,158,11,0.15)] hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingJudge ? "ĐANG GỬI LỜI MỜI..." : "GỬI LỜI MỜI GIÁM KHẢO"}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Card Form 3: Invite Mentor */}
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
                  {mentorEmail.trim() && (
                    checkEmailInSystem(mentorEmail, systemAccounts) ? (
                      <p className="text-[11px] font-mono text-emerald-400 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Đã tìm thấy tài khoản trong hệ thống</span>
                      </p>
                    ) : (
                      <p className="text-[11px] font-mono text-cyan-400 mt-1 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Email chưa đăng ký — Hệ thống sẽ gửi thư mời tạo tài khoản/chấp nhận role.</span>
                      </p>
                    )
                  )}
                </div>

                <div>
                  <label className="block font-mono text-xs text-[var(--text-muted)] uppercase mb-1">
                    Hạng Mục Phụ Trách (Track)
                  </label>
                  <select
                    value={mentorTrackId}
                    onChange={(e) => setMentorTrackId(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-muted)] px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#2dd4bf]"
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
                  className="w-full py-2.5 bg-emerald-500/15 border border-emerald-500 text-emerald-300 hover:bg-emerald-500 hover:text-black font-mono text-xs font-bold uppercase tracking-wider hud-clipped flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_12px_rgba(16,185,129,0.15)] hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingMentor ? "ĐANG GỬI LỜI MỜI..." : "GỬI LỜI MỜI CỐ VẤN"}</span>
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
                    const email = er.user?.email || er.User?.Email || er.email || er.Email || "staff@fpt.edu.vn";
                    const fullName = er.user?.fullName || er.User?.FullName || er.fullName || er.FullName || email.split("@")[0];
                    const rawRole = er.roleName ?? er.RoleName ?? er.role ?? er.Role ?? "Staff";
                    const isEC = rawRole === "EventCoordinator" || rawRole === "Coordinator" || rawRole === "EC" || rawRole === 0 || rawRole === "0";
                    const isJudge = rawRole === "Judge" || rawRole === 1 || rawRole === "1";
                    const trackName = er.track?.trackName || er.Track?.TrackName || er.trackName || er.TrackName || "Toàn bộ sự kiện";

                    return (
                      <tr key={roleId} className="hover:bg-[var(--bg-panel)] transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-[var(--text-primary)]">{fullName}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">{email}</div>
                        </td>
                        <td className="p-3">
                          <Badge tone={isEC ? "coordinator" : isJudge ? "judge" : "mentor"}>
                            {isEC ? "Điều phối viên (EC)" : isJudge ? "Giám khảo (Judge)" : "Cố vấn (Mentor)"}
                          </Badge>
                        </td>
                        <td className="p-3 text-[var(--text-muted)]">{trackName}</td>
                        <td className="p-3 text-right">
                          {isEC && !(currentUser?.isAdmin || currentUser?.IsAdmin) ? (
                            <span className="text-[10px] font-mono text-zinc-500 italic px-2 py-1 bg-zinc-900/60 rounded border border-zinc-800">
                              🔒 Quản lý bởi Admin
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              onClick={() => handleRemoveRole(roleId, rawRole, email)}
                              className="text-[11px] font-mono text-[var(--color-danger)] hover:bg-red-500/10 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Gỡ vai trò
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
          </div>
        )}

        {/* Modal Chỉnh Sửa Sự Kiện & Cấu Hình Vòng Thi (1.1.1 & 1.1.2 & 1.1.2.1) */}
        {isEditModalOpen && currentEvent && (
          <ComprehensiveEventEditModal
            event={currentEvent}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={() => {
              setIsEditModalOpen(false);
            }}
          />
        )}

      </main>
    </div>
  );
};
