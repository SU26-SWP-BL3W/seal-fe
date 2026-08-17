"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { staffRepository, useGetEventRoles } from "@/repositories/staffRepository";
import { useGetUsers } from "@/repositories/usersRepository";
import { useMyEvents } from "@/repositories/eventsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { UserCheck, UserPlus, Send, AlertCircle, CheckCircle2, Shield, Trash2, Search, Filter, Calendar } from "lucide-react";
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

  const { data: usersPaged } = useGetUsers();
  const systemAccounts = usersPaged?.data || [];

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

    const res = await staffRepository.inviteJudge({
      eventId: selectedEventId,
      email: judgeEmail.trim(),
      trackId: judgeTrackId || undefined,
    });

    setIsSubmittingJudge(false);

    if (res.success) {
      setJudgeMessage({
        text: res.message || `Đã gửi email mời Giám khảo (${judgeEmail}) thành công!`,
        isError: false,
      });
      setJudgeEmail("");
      await refetchRoles();
    } else {
      setJudgeMessage({
        text: res.message || "Gửi lời mời thất bại, vui lòng thử lại.",
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

    const res = await staffRepository.inviteMentor({
      eventId: selectedEventId,
      email: mentorEmail.trim(),
      trackId: mentorTrackId || undefined,
    });

    setIsSubmittingMentor(false);

    if (res.success) {
      setMentorMessage({
        text: res.message || `Đã gửi email mời Cố vấn (${mentorEmail}) thành công!`,
        isError: false,
      });
      setMentorEmail("");
      await refetchRoles();
    } else {
      setMentorMessage({
        text: res.message || "Gửi lời mời thất bại, vui lòng thử lại.",
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
            <div className="flex items-center gap-2 font-mono text-xs text-[#a855f7] font-bold uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4 text-[#a855f7]" />
              <span>QUẢN LÝ NHÂN SỰ BAN TỔ CHỨC</span>
            </div>
            <h1 className="font-mono font-bold text-2xl md:text-3xl text-[#e1e7ec] uppercase tracking-wider">
              MỜI VÀ PHÂN CÔNG GIÁM KHẢO &amp; CỐ VẤN
            </h1>
            <p className="text-xs font-sans text-[#8a9ba8] mt-1.5 leading-relaxed max-w-3xl">
              Mời nhân sự chuyên môn tham gia sự kiện và quản lý danh sách phân công Giám khảo, Cố vấn cho từng hạng mục thi đấu.
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
                    <p className="text-[11px] font-mono text-amber-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Email này chưa tồn tại trong hệ thống</span>
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
                  <span>{isSubmittingCoordinator ? "Đang Gửi Lời Mời..." : "Gửi Lời Mời Điều Phối Viên"}</span>
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
                    <p className="text-[11px] font-mono text-amber-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Email này chưa tồn tại trong hệ thống</span>
                    </p>
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
                  className="w-full py-2.5 bg-[var(--accent-judge)] text-black font-mono text-xs font-bold uppercase tracking-wider hud-clipped flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingJudge ? "Đang Gửi Lời Mời..." : "Gửi Lời Mời Giám Khảo"}</span>
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
                    <p className="text-[11px] font-mono text-amber-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Email này chưa tồn tại trong hệ thống</span>
                    </p>
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
                  className="w-full py-2.5 bg-[#2dd4bf] text-black font-mono text-xs font-bold uppercase tracking-wider hud-clipped flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingMentor ? "Đang Gửi Lời Mời..." : "Gửi Lời Mời Cố Vấn"}</span>
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

      </main>
    </div>
  );
};
