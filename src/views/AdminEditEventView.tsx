"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Input, Card, Badge } from "@/components/ui";
import { useEventDetail, useEventRounds, eventsRepository } from "@/repositories/eventsRepository";
import { useGetTracksByEvent, tracksRepository } from "@/repositories/tracksRepository";
import { useGetTemplates, templatesRepository } from "@/repositories/templatesRepository";
import { roundsRepository } from "@/repositories/roundsRepository";
import { staffRepository, useGetEventRoles } from "@/repositories/staffRepository";
import { usersRepository } from "@/repositories/usersRepository";
import { useGetTeamsByEvent } from "@/repositories/teamsRepository";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import { PagedResult } from "@/models/types";
import { SubmitResultListItem } from "@/repositories/submitResultsRepository";
import { ApiMissingDataBadge } from "@/components/ui";
import { Step2RoundConfig } from "@/components/domain/event-wizard/Step2RoundConfig";
import { Step3TrackConfig } from "@/components/domain/event-wizard/Step3TrackConfig";
import { Step4TemplateCriteriaEditor } from "@/components/domain/event-wizard/Step4TemplateCriteriaEditor";
import { Step5StaffAssignment } from "@/components/domain/event-wizard/Step5StaffAssignment";
import { Step6EventConfirmation } from "@/components/domain/event-wizard/Step6EventConfirmation";
import {
  RoundFormState,
  TrackFormState,
  TemplateCriteriaFormState,
  StaffInviteFormState,
} from "@/viewModels/useCreateEventWizardViewModel";
import {
  RefreshCw,
  Save,
  ArrowLeft,
  CheckCircle2,
  Users,
  FileCode,
  ExternalLink,
  ShieldCheck,
  Globe,
  FileSpreadsheet,
  Layers,
  Target,
  FileText,
  Code2,
} from "lucide-react";
import Link from "next/link";

function toDateInputValue(isoString?: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export const AdminEditEventView: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const eventId = (params?.id as string) || "";

  // Main Tab Switcher (4 Tabs)
  const [activeMainTab, setActiveMainTab] = useState<"info" | "config" | "teams" | "submissions">("info");

  // Config Sub-step Switcher
  const [configStep, setConfigStep] = useState<number>(2);

  // Queries
  const { data: rawEvent, isLoading: isLoadingEvent, refetch: refetchEvent } = useEventDetail(eventId);
  const { data: serverRounds = [], refetch: refetchRounds } = useEventRounds(eventId);
  const { data: serverTracks = [], refetch: refetchTracks } = useGetTracksByEvent(eventId);
  const { data: templates = [] } = useGetTemplates();
  const { data: serverStaff = [], refetch: refetchRoles } = useGetEventRoles(eventId);
  const { data: serverTeams = [], isLoading: isLoadingTeams, refetch: refetchTeams } = useGetTeamsByEvent(eventId);
  const { data: serverSubmissions = [], isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ["admin-event-submissions", eventId],
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<SubmitResultListItem>>("/SubmitResults", {
        params: { EventId: eventId, PageSize: 200 },
      });
      return res.data?.data ?? [];
    },
    enabled: !!eventId,
  });

  const ev = (rawEvent as any) ?? {};

  // Form State Tab 1
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    eventName: "",
    season: "",
    year: 2026,
    startDate: "",
    endDate: "",
    registrationStartDate: "",
    registrationEndDate: "",
    description: "",
    coordinatorEmail: "",
    maxTeams: 50,
  });

  // State Tab 2 (Config)
  const [rounds, setRounds] = useState<RoundFormState[]>([]);
  const [tracks, setTracks] = useState<TrackFormState[]>([]);
  const [criterias, setCriterias] = useState<TemplateCriteriaFormState[]>([]);
  const [criteriasByTrack, setCriteriasByTrack] = useState<Record<string, TemplateCriteriaFormState[]>>({});
  const [templateName, setTemplateName] = useState<string>("Mẫu Tiêu Chí Chuẩn SEAL");
  const [staffInvites, setStaffInvites] = useState<StaffInviteFormState[]>([]);
  const [status, setStatus] = useState<boolean>(true);

  // Sync Data
  useEffect(() => {
    if (rawEvent) {
      setForm({
        eventName: ev.eventName || ev.EventName || ev.name || "",
        season: ev.season || ev.Season || "Mùa Hè",
        year: Number(ev.year || ev.Year || 2026),
        startDate: toDateInputValue(ev.startDate || ev.StartDate),
        endDate: toDateInputValue(ev.endDate || ev.EndDate),
        registrationStartDate: toDateInputValue(ev.registrationStartDate || ev.RegistrationStartDate || ev.startDate || ev.StartDate),
        registrationEndDate: toDateInputValue(ev.registrationEndDate || ev.RegistrationEndDate || ev.endDate || ev.EndDate),
        description: ev.description || ev.Description || "",
        coordinatorEmail: ev.coordinatorEmail || ev.CoordinatorEmail || "",
        maxTeams: Number(ev.maxTeams || ev.MaxTeams || 50),
      });
      setStatus(ev.status ?? true);
    }
  }, [rawEvent]);

  useEffect(() => {
    if (serverRounds.length > 0) {
      setRounds(
        serverRounds.map((r: any, idx: number) => ({
          id: r.id || r.Id || r.roundId || `round-${idx}`,
          roundName: r.roundName || r.RoundName || `Vòng ${idx + 1}`,
          roundNumber: r.roundNumber || r.RoundNumber || idx + 1,
          startDate: r.startDate || r.StartDate || "",
          endDate: r.endDate || r.EndDate || "",
          scoringStartDate: r.scoringStartDate || r.ScoringStartDate || "",
          scoringEndDate: r.scoringEndDate || r.ScoringEndDate || "",
          appealStartDate: r.appealStartDate || r.AppealStartDate || "",
          appealEndDate: r.appealEndDate || r.AppealEndDate || "",
          advancementRule: r.advancementRule || r.AdvancementRule || "top 10",
        }))
      );
    }
  }, [serverRounds]);

  useEffect(() => {
    if (serverTracks.length > 0) {
      setTracks(
        serverTracks.map((t: any, idx: number) => ({
          id: t.id || t.Id || t.trackId || `track-${idx}`,
          trackName: t.trackName || t.TrackName || `Hạng Mục ${idx + 1}`,
          templateId: t.templateId || t.TemplateId || "",
          description: t.description || t.Description || "",
        }))
      );
    }
  }, [serverTracks]);

  useEffect(() => {
    if (serverStaff.length > 0) {
      setStaffInvites(
        serverStaff.map((s: any, idx: number) => ({
          id: s.id || s.Id || `staff-${idx}`,
          email: s.userEmail || s.UserEmail || s.email || "",
          roleName: (s.roleName || s.RoleName || "Judge") as any,
          trackId: s.trackId || s.TrackId || undefined,
        }))
      );
    }
  }, [serverStaff]);

  // Tab 1 Save Handler
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!form.eventName.trim()) {
      setErrorMessage("Vui lòng nhập tên sự kiện.");
      return;
    }

    setIsSubmitting(true);
    try {
      const startIso = form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString();
      const endIso = form.endDate ? new Date(form.endDate).toISOString() : new Date().toISOString();
      const regStartIso = form.registrationStartDate ? new Date(form.registrationStartDate).toISOString() : startIso;
      const regEndIso = form.registrationEndDate ? new Date(form.registrationEndDate).toISOString() : endIso;

      await eventsRepository.updateEvent(eventId, {
        eventName: form.eventName,
        season: form.season,
        year: Number(form.year),
        startDate: startIso,
        endDate: endIso,
        registrationStartDate: regStartIso,
        registrationEndDate: regEndIso,
        description: form.description,
        maxTeams: Number(form.maxTeams),
      } as any);

      if (form.coordinatorEmail.trim()) {
        const foundUser = await usersRepository.findUserByEmail(form.coordinatorEmail.trim());
        if (foundUser) {
          const realUserId = foundUser.id || (foundUser as any).Id || (foundUser as any).userId || (foundUser as any).UserId;
          await staffRepository.assignRoleDirectly({
            userId: realUserId,
            eventId: eventId,
            roleName: "EventCoordinator",
          });
        }
      }

      setSuccessMessage("Đã lưu thông tin sự kiện thành công.");
      refetchEvent();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || "Lỗi lưu thông tin sự kiện.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tab 2 Config Handlers
  const handleAddRound = () => {
    const nextNum = rounds.length + 1;
    setRounds([
      ...rounds,
      {
        id: `new-rnd-${Date.now()}`,
        roundName: `Vòng ${nextNum}`,
        roundNumber: nextNum,
        startDate: "",
        endDate: "",
        scoringStartDate: "",
        scoringEndDate: "",
        appealStartDate: "",
        appealEndDate: "",
        advancementRule: "top 10",
      },
    ]);
  };

  const handleRemoveRound = (id: string) => {
    setRounds(rounds.filter((r) => r.id !== id));
  };

  const handleUpdateRound = (id: string, field: keyof RoundFormState, value: any) => {
    setRounds(rounds.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleAddTrack = () => {
    setTracks([
      ...tracks,
      {
        id: `new-trk-${Date.now()}`,
        trackName: `Hạng Mục ${tracks.length + 1}`,
        templateId: "",
        description: "",
      },
    ]);
  };

  const handleRemoveTrack = (id: string) => {
    setTracks(tracks.filter((t) => t.id !== id));
  };

  const handleUpdateTrack = (id: string, field: keyof TrackFormState, value: any) => {
    setTracks(tracks.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleAddStaff = (invite: StaffInviteFormState) => {
    setStaffInvites([...staffInvites, { ...invite, id: `staff-${Date.now()}` }]);
  };

  const handleRemoveStaff = (id: string) => {
    setStaffInvites(staffInvites.filter((s) => s.id !== id));
  };

  const handleSaveConfig = async (nextStatus?: boolean) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Update rounds
      for (const r of rounds) {
        const isNew = r.id.startsWith("new-rnd-");
        const payload: any = {
          eventId,
          roundName: r.roundName,
          roundNumber: r.roundNumber,
          advancementRule: r.advancementRule || "top 10",
          startDate: r.startDate ? new Date(r.startDate).toISOString() : new Date().toISOString(),
          endDate: r.endDate ? new Date(r.endDate).toISOString() : new Date().toISOString(),
          scoringStartDate: r.scoringStartDate ? new Date(r.scoringStartDate).toISOString() : undefined,
          scoringEndDate: r.scoringEndDate ? new Date(r.scoringEndDate).toISOString() : undefined,
        };
        if (isNew) await roundsRepository.createRound(payload);
        else await roundsRepository.updateRound(r.id, payload);
      }

      // 2. Update tracks
      for (const t of tracks) {
        const isNew = t.id.startsWith("new-trk-");
        const payload: any = {
          eventId,
          trackName: t.trackName,
          description: t.description || undefined,
        };
        if (isNew) await tracksRepository.createTrack(payload);
      }

      if (typeof nextStatus === "boolean") {
        await eventsRepository.updateEvent(eventId, { status: nextStatus } as any);
        setStatus(nextStatus);
      }

      setSuccessMessage("Đã lưu cấu hình sự kiện thành công.");
      refetchEvent();
      refetchRounds();
      refetchTracks();
      refetchRoles();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || "Lỗi lưu cấu hình sự kiện.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="min-h-screen bg-[#090e11] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 font-mono text-xs text-amber-400">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span>Đang tải thông tin sự kiện...</span>
        </div>
      </div>
    );
  }

  const isStep2Done = Boolean(
    rounds.length > 0 &&
    rounds.every((r) => {
      const scoringEnd = r.scoringEndDate || (r as any).ScoringEndDate;
      return (
        r.roundName?.trim() &&
        r.startDate &&
        r.endDate &&
        scoringEnd &&
        new Date(r.startDate) <= new Date(r.endDate)
      );
    })
  );

  const isStep3Done = Boolean(tracks.length > 0 && tracks.every((t) => t.trackName?.trim()));

  const isStep4Done = Boolean(
    tracks.length > 0 &&
    tracks.every((trk) => {
      if (trk.templateId && trk.templateId !== "__custom__") return true;
      const list = criteriasByTrack[trk.id] ?? criterias;
      if (!list || list.length === 0) return true;
      const weight = list.reduce((acc, c) => acc + (Number(c.weight) || 0), 0);
      return Math.abs(weight - 100) < 0.01;
    })
  );

  const judgeCount = staffInvites.filter((s) => s.roleName === "Judge").length;
  const canPublish = isStep2Done && isStep3Done && isStep4Done && judgeCount > 0;

  const handleQuickToggleStatus = async () => {
    const nextStatus = !status;
    if (nextStatus === true && !canPublish) {
      setErrorMessage("Chưa đủ điều kiện công bố sự kiện! Vui lòng hoàn tất các bước còn thiếu (Vòng thi, Hạng mục, Tiêu chí 100%, Giám khảo).");
      return;
    }

    setIsTogglingStatus(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await eventsRepository.updateEvent(eventId, {
        eventName: form.eventName,
        season: form.season,
        year: Number(form.year),
        startDate: form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : new Date().toISOString(),
        registrationStartDate: form.registrationStartDate ? new Date(form.registrationStartDate).toISOString() : new Date().toISOString(),
        registrationEndDate: form.registrationEndDate ? new Date(form.registrationEndDate).toISOString() : new Date().toISOString(),
        description: form.description,
        maxTeams: Number(form.maxTeams),
        status: nextStatus,
      } as any);

      setStatus(nextStatus);
      setSuccessMessage(
        nextStatus
          ? "Đã CÔNG BỐ sự kiện thành công! Thí sinh đã có thể đăng ký trên trang chủ."
          : "Đã CHUYỂN SỰ KIỆN VỀ BẢN NHÁP an toàn!"
      );
      refetchEvent();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || "Không thể cập nhật trạng thái sự kiện.");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#090e11] text-[#dde4e6] font-sans py-6 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-zinc-400 mb-1">
              <Link href="/admin/dashboard" className="text-amber-400 font-bold hover:underline">
                Bảng Điều Hành Admin
              </Link>
              <span>/</span>
              <span>Sự Kiện: {form.eventName || "..."}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="font-display font-bold text-2xl text-white uppercase tracking-wider">
                {form.eventName || "Quản Lý Sự Kiện"}
              </h1>
              <span
                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                  status
                    ? "bg-emerald-950/50 text-emerald-300 border border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                }`}
              >
                {status ? "ĐANG CÔNG KHAI" : "BẢN NHÁP"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              disabled={isTogglingStatus || (!status && !canPublish)}
              onClick={handleQuickToggleStatus}
              title={!status && !canPublish ? "Chưa hoàn tất các bước bắt buộc để công bố sự kiện" : undefined}
              className={`font-mono text-xs font-bold py-2 px-4 shrink-0 flex items-center gap-2 border cursor-pointer ${
                status
                  ? "border-amber-500/60 text-amber-300 hover:bg-amber-500/20 bg-amber-500/10"
                  : canPublish
                  ? "border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/20 bg-emerald-500/10"
                  : "border-zinc-700 text-zinc-500 bg-zinc-800/40 opacity-50 cursor-not-allowed"
              }`}
            >
              {isTogglingStatus ? (
                "Đang xử lý..."
              ) : status ? (
                "CHUYỂN VỀ BẢN NHÁP"
              ) : (
                "CÔNG BỐ SỰ KIỆN"
              )}
            </Button>

            <Link href={`/events/${eventId}`}>
              <Button variant="ghost" className="font-mono text-xs border border-zinc-700 text-zinc-300 hover:text-white">
                Xem Trang Public &gt;
              </Button>
            </Link>
            <Link href="/admin/dashboard">
              <Button variant="ghost" className="font-mono text-xs border border-zinc-700 text-zinc-300 hover:text-white">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Về Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 MAIN TABS SWITCHER */}
        <div className="grid grid-cols-2 md:grid-cols-4 border border-zinc-800 bg-[#10171a] p-1 gap-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveMainTab("info")}
            className={`py-3 px-3 font-mono text-xs font-bold tracking-wider uppercase transition-all cursor-pointer text-center rounded ${
              activeMainTab === "info"
                ? "bg-amber-500 text-black font-extrabold shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-[#131d21]"
            }`}
          >
            THÔNG TIN SỰ KIỆN
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab("config")}
            className={`py-3 px-3 font-mono text-xs font-bold tracking-wider uppercase transition-all cursor-pointer text-center rounded ${
              activeMainTab === "config"
                ? "bg-amber-500 text-black font-extrabold shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-[#131d21]"
            }`}
          >
            CẤU HÌNH CHI TIẾT
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab("teams")}
            className={`py-3 px-3 font-mono text-xs font-bold tracking-wider uppercase transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 rounded ${
              activeMainTab === "teams"
                ? "bg-amber-500 text-black font-extrabold shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-[#131d21]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>ĐỘI THI ({serverTeams.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab("submissions")}
            className={`py-3 px-3 font-mono text-xs font-bold tracking-wider uppercase transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 rounded ${
              activeMainTab === "submissions"
                ? "bg-amber-500 text-black font-extrabold shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-[#131d21]"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>BÀI LÀM ({serverSubmissions.length})</span>
          </button>
        </div>

        {/* Global Notifications */}
        {errorMessage && (
          <div className="p-4 bg-red-950/40 border border-red-500/50 text-red-300 font-mono text-xs rounded-lg">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 font-mono text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: THÔNG TIN SỰ KIỆN */}
        {activeMainTab === "info" && (
          <Card className="p-6 space-y-6 bg-[#10171a] border border-zinc-800">
            <form onSubmit={handleSaveInfo} className="space-y-6">

              {/* Tên & Mùa giải */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
                    Tên Sự Kiện *
                  </label>
                  <Input
                    type="text"
                    value={form.eventName}
                    onChange={(e) => setForm({ ...form, eventName: e.target.value })}
                    className="w-full text-xs font-mono"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
                      Mùa Giải
                    </label>
                    <Input
                      type="text"
                      value={form.season}
                      onChange={(e) => setForm({ ...form, season: e.target.value })}
                      className="w-full text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
                      Năm
                    </label>
                    <Input
                      type="number"
                      value={form.year}
                      onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                      className="w-full text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Mô tả */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
                  Mô Tả & Thể Lệ Sự Kiện
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0b1013] border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500 resize-none rounded"
                />
              </div>

              {/* Mốc thời gian */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 p-4 bg-[#0b1013] border border-zinc-800 rounded">
                  <span className="text-xs font-mono text-amber-400 uppercase font-bold block">
                    Cổng Đăng Ký Đội Thi
                  </span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 block">Ngày Mở:</span>
                      <Input
                        type="date"
                        value={form.registrationStartDate}
                        onChange={(e) => setForm({ ...form, registrationStartDate: e.target.value })}
                        className="w-full text-xs font-mono mt-1"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 block">Ngày Đóng:</span>
                      <Input
                        type="date"
                        value={form.registrationEndDate}
                        onChange={(e) => setForm({ ...form, registrationEndDate: e.target.value })}
                        className="w-full text-xs font-mono mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 p-4 bg-[#0b1013] border border-zinc-800 rounded">
                  <span className="text-xs font-mono text-cyan-400 uppercase font-bold block">
                    Khung Thời Gian Thi Đấu
                  </span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 block">Ngày Bắt Đầu:</span>
                      <Input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                        className="w-full text-xs font-mono mt-1"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 block">Ngày Bế Mạc:</span>
                      <Input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                        className="w-full text-xs font-mono mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quy mô & Phân công EC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
                    Số Lượng Đội Tối Đa
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={form.maxTeams}
                    onChange={(e) => setForm({ ...form, maxTeams: Number(e.target.value) })}
                    className="w-full text-xs font-mono"
                  />
                </div>

                <div className="space-y-3 p-4 bg-[#0b1013] border border-purple-500/40 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-purple-300 uppercase font-bold">
                      Event Coordinators ({serverStaff.filter((s: any) => (s.roleName || s.RoleName) === "EventCoordinator").length} EC)
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {serverStaff.filter((s: any) => (s.roleName || s.RoleName) === "EventCoordinator").length > 0 ? "Đã có EC" : "Chưa gán"}
                    </span>
                  </div>

                  {serverStaff.filter((s: any) => (s.roleName || s.RoleName) === "EventCoordinator").length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {serverStaff
                        .filter((s: any) => (s.roleName || s.RoleName) === "EventCoordinator")
                        .map((c: any, idx: number) => {
                          const email = c.userEmail || c.UserEmail || c.email || "ec@seal.edu.vn";
                          const name = c.fullName || c.FullName || email;
                          return (
                            <span
                              key={c.id || idx}
                              className="px-2.5 py-1 bg-purple-950/40 text-purple-300 border border-purple-500/40 font-mono text-xs rounded flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                              <span>{name}</span>
                              <span className="text-[10px] opacity-75">({email})</span>
                            </span>
                          );
                        })}
                    </div>
                  )}

                  <div className="space-y-1 pt-2 border-t border-zinc-800">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase">
                      Gán Thêm EC Mới
                    </label>
                    <Input
                      type="email"
                      placeholder="e.g. ec.coordinator@seal.edu.vn"
                      value={form.coordinatorEmail}
                      onChange={(e) => setForm({ ...form, coordinatorEmail: e.target.value })}
                      className="w-full text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t border-zinc-800">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-500 text-black font-mono text-xs font-bold px-8 cursor-pointer hover:bg-amber-400"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  {isSubmitting ? "Đang lưu..." : "LƯU THÔNG TIN SỰ KIỆN"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* TAB 2: CẤU HÌNH CHI TIẾT (VÒNG THI & TIÊU CHÍ) */}
        {activeMainTab === "config" && (
          <div className="space-y-6">

            {/* Sub-steps Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { step: 2, label: "Vòng Thi", isDone: isStep2Done },
                { step: 3, label: "Hạng Mục", isDone: isStep3Done },
                { step: 4, label: "Tiêu Chí", isDone: isStep4Done },
                { step: 5, label: "Giám Khảo", isDone: judgeCount > 0 },
                { step: 6, label: "Công Bố", isDone: status === true },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setConfigStep(s.step)}
                  className={`p-3 text-left border transition-all cursor-pointer rounded ${
                    configStep === s.step
                      ? "bg-amber-500/15 border-amber-500/60 text-amber-300 font-bold shadow-sm"
                      : "bg-[#10171a] border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase opacity-75">Bước {s.step}</span>
                    <span
                      className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        s.isDone
                          ? "bg-emerald-950/50 text-emerald-300 border border-emerald-500/30"
                          : "bg-red-950/30 text-red-300 border border-red-500/30"
                      }`}
                    >
                      {s.step === 6
                        ? s.isDone ? "CÔNG KHAI" : "BẢN NHÁP"
                        : s.isDone ? "ĐÃ XONG" : "CHƯA XONG"}
                    </span>
                  </div>
                  <div className="font-mono text-xs font-bold mt-1">{s.label}</div>
                </button>
              ))}
            </div>

            {/* Step 2: Vòng Thi */}
            {configStep === 2 && (
              <Step2RoundConfig
                rounds={rounds}
                onAddRound={handleAddRound}
                onRemoveRound={handleRemoveRound}
                onUpdateRound={handleUpdateRound}
                onNext={() => {
                  handleSaveConfig();
                  setConfigStep(3);
                }}
                onPrev={() => setActiveMainTab("info")}
                isReadOnly={false}
              />
            )}

            {/* Step 3: Hạng Mục */}
            {configStep === 3 && (
              <Step3TrackConfig
                tracks={tracks}
                templates={templates}
                onAddTrack={handleAddTrack}
                onRemoveTrack={handleRemoveTrack}
                onUpdateTrack={handleUpdateTrack}
                onNext={() => {
                  handleSaveConfig();
                  setConfigStep(4);
                }}
                onPrev={() => setConfigStep(2)}
                isReadOnly={false}
              />
            )}

            {/* Step 4: Tiêu Chí */}
            {configStep === 4 && (
              <Step4TemplateCriteriaEditor
                criterias={criterias}
                onUpdateCriteria={(id, f, val) => {
                  setCriterias(criterias.map((c) => (c.id === id ? { ...c, [f]: val } : c)));
                }}
                onAddCriteria={() => {
                  setCriterias([
                    ...criterias,
                    {
                      id: `crit-${Date.now()}`,
                      criteriaName: "Tiêu chí mới",
                      weight: 10,
                      maxScore: 10,
                      description: "",
                    },
                  ]);
                }}
                onRemoveCriteria={(id) => setCriterias(criterias.filter((c) => c.id !== id))}
                templateName={templateName}
                onChangeTemplateName={setTemplateName}
                onNext={() => {
                  handleSaveConfig();
                  setConfigStep(5);
                }}
                onPrev={() => setConfigStep(3)}
                tracks={tracks}
                criteriasByTrack={criteriasByTrack}
                onUpdateCriteriaForTrack={(trackId, id, f, val) => {
                  const curr = criteriasByTrack[trackId] || criterias;
                  setCriteriasByTrack({
                    ...criteriasByTrack,
                    [trackId]: curr.map((c) => (c.id === id ? { ...c, [f]: val } : c)),
                  });
                }}
                onAddCriteriaForTrack={(trackId) => {
                  const curr = criteriasByTrack[trackId] || criterias;
                  setCriteriasByTrack({
                    ...criteriasByTrack,
                    [trackId]: [
                      ...curr,
                      { id: `crit-${Date.now()}`, criteriaName: "Tiêu chí mới", weight: 10, maxScore: 10, description: "" },
                    ],
                  });
                }}
                onRemoveCriteriaForTrack={(trackId, id) => {
                  const curr = criteriasByTrack[trackId] || criterias;
                  setCriteriasByTrack({
                    ...criteriasByTrack,
                    [trackId]: curr.filter((c) => c.id !== id),
                  });
                }}
                isReadOnly={false}
              />
            )}

            {/* Step 5: Nhân Sự & Giám Khảo */}
            {configStep === 5 && (
              <Step5StaffAssignment
                staffInvites={staffInvites}
                tracks={tracks}
                onAddStaff={handleAddStaff}
                onRemoveStaff={handleRemoveStaff}
                onNext={() => {
                  handleSaveConfig();
                  setConfigStep(6);
                }}
                onPrev={() => setConfigStep(4)}
                isReadOnly={false}
              />
            )}

            {/* Step 6: Xác Nhận & Công Bố */}
            {configStep === 6 && (
              <Step6EventConfirmation
                eventData={{
                  eventName: form.eventName,
                  season: form.season,
                  year: form.year,
                  startDate: form.startDate,
                  endDate: form.endDate,
                  registrationStartDate: form.registrationStartDate,
                  registrationEndDate: form.registrationEndDate,
                  maxTeams: form.maxTeams,
                  tagline: "",
                  description: form.description,
                }}
                rounds={rounds}
                tracks={tracks}
                criterias={criterias}
                staffInvites={staffInvites}
                onPublish={() => handleSaveConfig(true)}
                onSaveDraft={() => handleSaveConfig(false)}
                isSubmitting={isSubmitting}
                onPrev={() => setConfigStep(5)}
                eventId={eventId}
                currentStatus={status}
              />
            )}
          </div>
        )}

        {/* TAB 3: ĐỘI THI & THÍ SINH */}
        {activeMainTab === "teams" && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
              <div className="p-4 bg-[#10171a] border border-zinc-800 space-y-1 rounded">
                <span className="text-[10px] text-zinc-400 uppercase">Tổng Số Đội Thi</span>
                <div className="text-2xl font-bold text-white">{serverTeams.length} Đội</div>
              </div>
              <div className="p-4 bg-[#10171a] border border-emerald-500/30 space-y-1 rounded">
                <span className="text-[10px] text-emerald-400 uppercase font-bold">Đã Duyệt Chính Thức</span>
                <div className="text-2xl font-bold text-emerald-400">
                  {serverTeams.filter((t: any) => t.status === "Registered" || t.status === "Approved" || t.Status === 1).length} Đội
                </div>
              </div>
              <div className="p-4 bg-[#10171a] border border-amber-500/30 space-y-1 rounded">
                <span className="text-[10px] text-amber-400 uppercase font-bold">Chờ Duyệt / Ghép</span>
                <div className="text-2xl font-bold text-amber-400">
                  {serverTeams.filter((t: any) => t.status !== "Registered" && t.status !== "Approved" && t.Status !== 1).length} Đội
                </div>
              </div>
            </div>

            {/* Teams Table */}
            <Card className="p-6 bg-[#10171a] border border-zinc-800 space-y-4 rounded">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Danh Sách Đội Thi ({serverTeams.length})
                </h3>
                <span className="font-mono text-[10px] text-zinc-500">
                  Quản lý thí sinh và đội thi trực thuộc sự kiện
                </span>
              </div>

              {isLoadingTeams ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 font-mono text-xs text-amber-400">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>Đang tải danh sách đội thi...</span>
                </div>
              ) : serverTeams.length === 0 ? (
                <ApiMissingDataBadge
                  endpoint="GET /api/Teams"
                  title="CHƯA CÓ ĐỘI THI NÀO ĐĂNG KÝ"
                  message="Chưa có đội thi nào đăng ký tham gia sự kiện này."
                />
              ) : (
                <div className="w-full overflow-x-auto border border-zinc-800 bg-[#0b1013] rounded">
                  <table className="w-full table-fixed text-left border-collapse font-mono text-xs">
                    <thead className="bg-[#0e1619] border-b border-zinc-800">
                      <tr>
                        <th className="w-[30%] px-4 py-3 text-left text-zinc-400 uppercase">TÊN ĐỘI THI</th>
                        <th className="w-[25%] px-4 py-3 text-left text-zinc-400 uppercase">HẠNG MỤC</th>
                        <th className="w-[20%] px-4 py-3 text-left text-zinc-400 uppercase">TRẠNG THÁI</th>
                        <th className="w-[25%] px-4 py-3 text-right text-zinc-400 uppercase">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serverTeams.map((team: any, idx: number) => {
                        const teamId = team.id || team.Id || team.teamId || `team-${idx}`;
                        const teamName = team.name || team.Name || team.teamName || "Đội Thi";
                        const trackName = tracks.find((t) => t.id === (team.trackId || team.TrackId))?.trackName || "Chung";
                        const isApproved = team.status === "Registered" || team.status === "Approved" || team.Status === 1;

                        return (
                          <tr key={teamId} className="hover:bg-[#141e22] transition-colors border-t border-zinc-800/60">
                            <td className="px-4 py-3.5 align-middle font-bold text-white truncate" title={teamName}>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                                <span>{teamName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 align-middle text-cyan-300 truncate">
                              {trackName}
                            </td>
                            <td className="px-4 py-3.5 align-middle">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                                  isApproved
                                    ? "bg-emerald-950/50 text-emerald-300 border border-emerald-500/30"
                                    : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                }`}
                              >
                                {isApproved ? "CHÍNH THỨC" : "CHỜ DUYỆT"}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 align-middle text-right">
                              <Link href="/coordinator/teams">
                                <Button variant="ghost" className="text-xs font-mono border border-zinc-700 text-zinc-300 hover:text-white px-2.5 py-1 h-auto">
                                  Xem Chi Tiết &gt;
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* TAB 4: BÀI LÀM & SUBMISSIONS */}
        {activeMainTab === "submissions" && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
              <div className="p-4 bg-[#10171a] border border-zinc-800 space-y-1 rounded">
                <span className="text-[10px] text-zinc-400 uppercase">Tổng Số Lượt Nộp Bài</span>
                <div className="text-2xl font-bold text-white">{serverSubmissions.length} Bài Nộp</div>
              </div>
              <div className="p-4 bg-[#10171a] border border-cyan-500/30 space-y-1 rounded">
                <span className="text-[10px] text-cyan-400 uppercase font-bold">Số Đội Đã Nộp</span>
                <div className="text-2xl font-bold text-cyan-400">
                  {new Set(serverSubmissions.map((s: any) => s.teamId || s.TeamId)).size} Đội
                </div>
              </div>
            </div>

            {/* Submissions Table */}
            <Card className="p-6 bg-[#10171a] border border-zinc-800 space-y-4 rounded">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  Tổng Hợp Bài Làm ({serverSubmissions.length})
                </h3>
                <span className="font-mono text-[10px] text-zinc-500">
                  GitHub, Demo, Slide của các đội thi
                </span>
              </div>

              {isLoadingSubmissions ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 font-mono text-xs text-amber-400">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>Đang tải danh sách bài làm...</span>
                </div>
              ) : serverSubmissions.length === 0 ? (
                <ApiMissingDataBadge
                  endpoint="GET /api/SubmitResults"
                  title="CHƯA CÓ BÀI NỘP NÀO"
                  message="Chưa có đội thi nào nộp bài cho sự kiện này."
                />
              ) : (
                <div className="w-full overflow-x-auto border border-zinc-800 bg-[#0b1013] rounded">
                  <table className="w-full table-fixed text-left border-collapse font-mono text-xs">
                    <thead className="bg-[#0e1619] border-b border-zinc-800">
                      <tr>
                        <th className="w-[25%] px-4 py-3 text-left text-zinc-400 uppercase">ĐỘI THI</th>
                        <th className="w-[20%] px-4 py-3 text-left text-zinc-400 uppercase">HẠNG MỤC</th>
                        <th className="w-[35%] px-4 py-3 text-left text-zinc-400 uppercase">LIÊN KẾT</th>
                        <th className="w-[20%] px-4 py-3 text-right text-zinc-400 uppercase">THỜI GIAN NỘP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serverSubmissions.map((sub: any, idx: number) => {
                        const subId = sub.id || sub.Id || `sub-${idx}`;
                        const teamName = sub.teamName || sub.TeamName || `Đội #${idx + 1}`;
                        const trackName = tracks.find((t) => t.id === (sub.trackId || sub.TrackId))?.trackName || "Chung";
                        const repoUrl = sub.repoUrl || sub.RepoUrl || sub.submissionUrl || sub.SubmissionUrl;
                        const demoUrl = sub.demoUrl || sub.DemoUrl;
                        const slideUrl = sub.slideUrl || sub.SlideUrl;
                        const createdTime = sub.createdTime || sub.CreatedTime;

                        return (
                          <tr key={subId} className="hover:bg-[#141e22] transition-colors border-t border-zinc-800/60">
                            <td className="px-4 py-3.5 align-middle font-bold text-white truncate" title={teamName}>
                              {teamName}
                            </td>
                            <td className="px-4 py-3.5 align-middle text-cyan-300 truncate">
                              {trackName}
                            </td>
                            <td className="px-4 py-3.5 align-middle">
                              <div className="flex items-center gap-2 flex-wrap">
                                {repoUrl && (
                                  <a
                                    href={repoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-0.5 bg-[#0b1013] border border-zinc-700 text-white hover:border-white rounded flex items-center gap-1 text-[10px]"
                                    title={repoUrl}
                                  >
                                    <Code2 className="w-3 h-3 text-blue-400" />
                                    <span>GitHub</span>
                                  </a>
                                )}
                                {demoUrl && (
                                  <a
                                    href={demoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-0.5 bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 rounded flex items-center gap-1 text-[10px]"
                                    title={demoUrl}
                                  >
                                    <Globe className="w-3 h-3" />
                                    <span>Demo</span>
                                  </a>
                                )}
                                {slideUrl && (
                                  <a
                                    href={slideUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-0.5 bg-purple-950/30 border border-purple-500/40 text-purple-300 hover:bg-purple-500/20 rounded flex items-center gap-1 text-[10px]"
                                    title={slideUrl}
                                  >
                                    <FileSpreadsheet className="w-3 h-3" />
                                    <span>Slides</span>
                                  </a>
                                )}
                                {!repoUrl && !demoUrl && !slideUrl && (
                                  <span className="text-[10px] text-zinc-500 italic">Đang cập nhật</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 align-middle text-right text-[11px] text-zinc-500">
                              {createdTime ? new Date(createdTime).toLocaleString("vi-VN") : "Gần đây"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
