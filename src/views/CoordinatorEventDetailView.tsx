"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, Badge } from "@/components/ui";
import { useEventDetail, useEventRounds, eventsRepository } from "@/repositories/eventsRepository";
import { useGetTracksByEvent, tracksRepository } from "@/repositories/tracksRepository";
import { useGetTemplates, templatesRepository } from "@/repositories/templatesRepository";
import { roundsRepository } from "@/repositories/roundsRepository";
import { staffRepository, useGetEventRoles } from "@/repositories/staffRepository";
import { Step1EventBasicInfo } from "@/components/domain/event-wizard/Step1EventBasicInfo";
import { Step2RoundConfig } from "@/components/domain/event-wizard/Step2RoundConfig";
import { Step3TrackConfig } from "@/components/domain/event-wizard/Step3TrackConfig";
import { Step4TemplateCriteriaEditor } from "@/components/domain/event-wizard/Step4TemplateCriteriaEditor";
import { Step5StaffAssignment } from "@/components/domain/event-wizard/Step5StaffAssignment";
import { Step6EventConfirmation } from "@/components/domain/event-wizard/Step6EventConfirmation";
import {
  EventFormState,
  RoundFormState,
  TrackFormState,
  TemplateCriteriaFormState,
  StaffInviteFormState,
} from "@/viewModels/useCreateEventWizardViewModel";
import {
  Shield,
  Layers,
  Target,
  Sliders,
  Users,
  Rocket,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Lock,
  EyeOff,
  Save,
} from "lucide-react";
import Link from "next/link";

export const CoordinatorEventDetailView: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const eventId = (params?.id as string) || "";

  // Queries
  const { data: event, isLoading: isLoadingEvent, refetch: refetchEvent } = useEventDetail(eventId);
  const { data: serverRounds = [], refetch: refetchRounds } = useEventRounds(eventId);
  const { data: serverTracks = [], refetch: refetchTracks } = useGetTracksByEvent(eventId);
  const { data: templates = [] } = useGetTemplates();
  const { data: serverStaff = [], refetch: refetchRoles } = useGetEventRoles(eventId);

  // Wizard Step Navigation
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isTogglingPublish, setIsTogglingPublish] = useState<boolean>(false);

  // Form States (matching 6-step Wizard)
  const [eventData, setEventData] = useState<EventFormState>({
    eventName: "",
    season: "",
    year: 2026,
    startDate: "",
    endDate: "",
    registrationStartDate: "",
    registrationEndDate: "",
    maxTeams: 50,
    tagline: "",
    description: "",
  });

  const [status, setStatus] = useState<boolean>(true);
  const [photoEventUrl, setPhotoEventUrl] = useState<string>("");

  const INITIAL_CRITERIAS: TemplateCriteriaFormState[] = [];

  const [rounds, setRounds] = useState<RoundFormState[]>([]);
  const [tracks, setTracks] = useState<TrackFormState[]>([]);
  const [criterias, setCriterias] = useState<TemplateCriteriaFormState[]>(INITIAL_CRITERIAS);
  const [criteriasByTrack, setCriteriasByTrack] = useState<Record<string, TemplateCriteriaFormState[]>>({});
  const [templateName, setTemplateName] = useState<string>("Mẫu Tiêu Chí Chuẩn SEAL");
  const [staffInvites, setStaffInvites] = useState<StaffInviteFormState[]>([]);

  // Sync API Data to Local Wizard State
  useEffect(() => {
    if (event) {
      const ev = event as any;
      setEventData({
        eventName: ev.eventName || ev.EventName || ev.name || "",
        season: ev.season || ev.Season || "",
        year: ev.year || ev.Year || 2026,
        startDate: ev.startDate || ev.StartDate || "",
        endDate: ev.endDate || ev.EndDate || "",
        registrationStartDate: ev.registrationStartDate || ev.RegistrationStartDate || "",
        registrationEndDate: ev.registrationEndDate || ev.RegistrationEndDate || "",
        maxTeams: ev.maxTeams || ev.MaxTeams || 50,
        tagline: ev.tagline || ev.Tagline || "",
        description: ev.description || ev.Description || "",
      });
      setStatus(ev.status !== undefined ? Boolean(ev.status) : ev.Status !== undefined ? Boolean(ev.Status) : true);
      setPhotoEventUrl(ev.photoEventUrl || ev.PhotoEventUrl || "");
    }
  }, [event]);

  useEffect(() => {
    if (Array.isArray(serverRounds)) {
      setRounds(
        serverRounds.map((r: any, idx: number) => ({
          id: r.id || r.Id || r.roundId || r.RoundId || `rnd-${idx}`,
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
    if (Array.isArray(serverTracks)) {
      setTracks(
        serverTracks.map((t: any, idx: number) => ({
          id: t.id || t.Id || t.trackId || t.TrackId || `trk-${idx}`,
          eventId: eventId,
          trackName: t.trackName || t.TrackName || `Hạng mục ${idx + 1}`,
          templateId: t.templateId || t.TemplateId || "",
          description: t.description || t.Description || "",
          startDate: t.startDate || t.StartDate || "",
          endDate: t.endDate || t.EndDate || "",
        }))
      );
    }
  }, [serverTracks, eventId]);

  useEffect(() => {
    if (Array.isArray(serverStaff)) {
      setStaffInvites(
        serverStaff.map((s: any, idx: number) => ({
          id: s.id || s.Id || s.eventRoleId || s.EventRoleId || `stf-${idx}`,
          email: s.user?.email || s.User?.Email || s.email || "",
          trackId: s.trackId || s.TrackId || undefined,
          roleName: (s.roleName || s.RoleName || "Judge") as "Judge" | "Mentor",
          status: "Accepted",
        }))
      );
    }
  }, [serverStaff]);

  // Step 1 Handlers
  const handleUpdateEventField = (field: keyof EventFormState, value: any) => {
    setEventData((prev) => ({ ...prev, [field]: value }));
  };

  // Step 2 Round Handlers
  const handleAddRound = () => {
    const nextNum = rounds.length + 1;
    const newRnd: RoundFormState = {
      id: `new-rnd-${Date.now()}`,
      roundName: `Vòng ${nextNum}`,
      roundNumber: nextNum,
      startDate: eventData.startDate || "",
      endDate: eventData.endDate || "",
      scoringStartDate: eventData.endDate || "",
      scoringEndDate: eventData.endDate || "",
      advancementRule: "top 10",
    };
    setRounds((prev) => [...prev, newRnd]);
  };

  const handleRemoveRound = (id: string) => {
    setRounds((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRound = (id: string, field: keyof RoundFormState, value: any) => {
    setRounds((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // Step 3 Track Handlers
  const handleAddTrack = () => {
    const nextNum = tracks.length + 1;
    const newTrk: TrackFormState = {
      id: `new-trk-${Date.now()}`,
      eventId: eventId,
      trackName: `Hạng Mục ${nextNum}`,
      templateId: templates[0]?.id || (templates[0] as any)?.Id || "",
      description: "Phạm vi và quy định nộp bài riêng của hạng mục...",
    };
    setTracks((prev) => [...prev, newTrk]);
  };

  const handleRemoveTrack = (id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateTrack = (id: string, field: keyof TrackFormState, value: any) => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  // Step 4 Rubric Criteria Handlers
  const totalWeight = criterias.reduce((acc, c) => acc + (Number(c.weight) || 0), 0);
  const isValidWeight100 = totalWeight === 100;

  const handleAddCriteria = (obj?: Partial<TemplateCriteriaFormState>) => {
    const nextNum = criterias.length + 1;
    const newCrit: TemplateCriteriaFormState = {
      criteriaId: `crit-${Date.now()}`,
      criterionName: obj?.criterionName || `Tiêu chí ${nextNum}`,
      description: obj?.description || "Mô tả yêu cầu tiêu chí...",
      weight: obj?.weight ?? 20,
      maxScore: obj?.maxScore ?? 10,
    };
    setCriterias((prev) => [...prev, newCrit]);
  };

  const handleRemoveCriteria = (index: number) => {
    setCriterias((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCriteria = (index: number, field: keyof TemplateCriteriaFormState, value: any) => {
    setCriterias((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const handleSetCriteriasForTrack = (trackId: string, list: TemplateCriteriaFormState[]) => {
    setCriteriasByTrack((prev) => ({ ...prev, [trackId]: list }));
  };

  const handleApplyCriteriasToAllTracks = (list: TemplateCriteriaFormState[]) => {
    const updated: Record<string, TemplateCriteriaFormState[]> = {};
    tracks.forEach((t) => {
      updated[t.id] = [...list];
    });
    setCriteriasByTrack(updated);
  };

  // Step 5 Staff Handlers
  const handleAddStaffInvite = (email: string, roleName: "Judge" | "Mentor", trackId?: string) => {
    const newInvite: StaffInviteFormState = {
      id: `invite-${Date.now()}`,
      email,
      roleName,
      trackId,
      status: "Pending",
    };
    setStaffInvites((prev) => [...prev, newInvite]);
  };

  const handleRemoveStaffInvite = (id: string) => {
    setStaffInvites((prev) => prev.filter((s) => s.id !== id));
  };

  // Step Navigation Handlers
  const handleNextStep = () => {
    setErrorMessage(null);
    if (currentStep === 1) {
      if (!eventData.eventName.trim()) {
        setErrorMessage("Vui lòng nhập Tên sự kiện!");
        return;
      }
      if (!eventData.startDate || !eventData.endDate) {
        setErrorMessage("Vui lòng nhập Thời gian Bắt đầu và Kết thúc sự kiện!");
        return;
      }
      if (new Date(eventData.startDate) > new Date(eventData.endDate)) {
        setErrorMessage("Ngày bắt đầu sự kiện phải diễn ra trước ngày kết thúc!");
        return;
      }
    } else if (currentStep === 2) {
      if (rounds.length === 0) {
        setErrorMessage("Sự kiện cần ít nhất 1 Vòng thi (Round)!");
        return;
      }
      for (const rnd of rounds) {
        if (!rnd.roundName?.trim()) {
          setErrorMessage(`Vui lòng nhập tên cho Vòng thi số ${rnd.roundNumber}!`);
          return;
        }
        if (!rnd.startDate || !rnd.endDate) {
          setErrorMessage(`Vòng "${rnd.roundName}" chưa thiết lập đầy đủ Thời gian Bắt đầu và Kết thúc!`);
          return;
        }
        if (new Date(rnd.startDate) > new Date(rnd.endDate)) {
          setErrorMessage(`Thời gian bắt đầu Vòng "${rnd.roundName}" phải trước thời gian kết thúc!`);
          return;
        }
        if (!rnd.scoringEndDate) {
          setErrorMessage(`Vui lòng thiết lập Hạn chót chấm điểm (Scoring End Date) cho Vòng "${rnd.roundName}"!`);
          return;
        }
      }
    } else if (currentStep === 3) {
      if (tracks.length === 0) {
        setErrorMessage("Vui lòng cấu hình ít nhất 1 Hạng mục thi (Track)!");
        return;
      }
      for (const trk of tracks) {
        if (!trk.trackName?.trim()) {
          setErrorMessage("Tên Hạng mục thi không được để trống!");
          return;
        }
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 6));
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Step 6 Validation & Publish
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
      if (!list || list.length === 0) return false;
      const weight = list.reduce((acc, c) => acc + (Number(c.weight) || 0), 0);
      return Math.abs(weight - 100) < 0.01;
    })
  );

  const judgeCount = staffInvites.filter((s) => s.roleName === "Judge").length;
  const validationMissingItems: string[] = [];

  if (!eventData.eventName.trim()) validationMissingItems.push("Tên sự kiện (Bước 1)");
  if (!eventData.startDate || !eventData.endDate) validationMissingItems.push("Thời gian sự kiện bắt đầu & kết thúc (Bước 1)");
  if (!eventData.registrationStartDate || !eventData.registrationEndDate) validationMissingItems.push("Mốc mở & đóng cổng đăng ký (Bước 1)");
  if (rounds.length === 0) {
    validationMissingItems.push("Ít nhất 1 Vòng thi (Bước 2)");
  } else if (!isStep2Done) {
    validationMissingItems.push("Tất cả các Vòng thi phải có đầy đủ mốc thời gian và hạn chót chấm điểm (Bước 2)");
  }
  if (tracks.length === 0) {
    validationMissingItems.push("Ít nhất 1 Hạng mục thi (Bước 3)");
  } else if (!isStep3Done) {
    validationMissingItems.push("Tất cả các Hạng mục phải có tên (Bước 3)");
  }
  if (!isStep4Done) {
    validationMissingItems.push("Trọng số tiêu chí chấm điểm phải đạt đúng 100% cho mỗi Hạng mục (Bước 4)");
  }
  if (judgeCount === 0) validationMissingItems.push("Ít nhất 1 Giám khảo (Bước 5)");

  const canPublishEvent = validationMissingItems.length === 0;

  // Persist Changes Handler (Save Draft / Save Changes)
  const handleSaveChanges = async (targetPublicStatus?: boolean) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const isNextPublic = targetPublicStatus !== undefined ? targetPublicStatus : status;

    if (isNextPublic && !canPublishEvent) {
      setIsSubmitting(false);
      setErrorMessage(`Chưa đủ điều kiện công bố sự kiện công khai! Vui lòng hoàn tất: ${validationMissingItems.join(", ")}`);
      setCurrentStep(6);
      return;
    }

    try {
      // 1. Update Event Base Info
      const payload: Record<string, any> = {
        eventName: eventData.eventName,
        season: eventData.season,
        year: eventData.year,
        maxTeams: eventData.maxTeams,
        tagline: eventData.tagline,
        description: eventData.description,
        photoEventUrl,
        status: isNextPublic,
      };

      if (eventData.startDate) payload.startDate = new Date(eventData.startDate).toISOString();
      if (eventData.endDate) payload.endDate = new Date(eventData.endDate).toISOString();
      if (eventData.registrationStartDate) payload.registrationStartDate = new Date(eventData.registrationStartDate).toISOString();
      if (eventData.registrationEndDate) payload.registrationEndDate = new Date(eventData.registrationEndDate).toISOString();

      await eventsRepository.updateEvent(eventId, payload as any);

      // 2. Persist Rounds (Create, Update, Delete)
      for (const r of rounds) {
        const isNewRound = r.id.startsWith("new-rnd-");
        const roundPayload: any = {
          eventId,
          roundName: r.roundName,
          roundNumber: r.roundNumber,
          advancementRule: r.advancementRule || "top 10",
        };

        if (r.startDate) roundPayload.startDate = new Date(r.startDate).toISOString();
        if (r.endDate) roundPayload.endDate = new Date(r.endDate).toISOString();
        if (r.scoringStartDate) roundPayload.scoringStartDate = new Date(r.scoringStartDate).toISOString();
        if (r.scoringEndDate) roundPayload.scoringEndDate = new Date(r.scoringEndDate).toISOString();
        if (r.appealStartDate) roundPayload.appealStartDate = new Date(r.appealStartDate).toISOString();
        if (r.appealEndDate) roundPayload.appealEndDate = new Date(r.appealEndDate).toISOString();

        if (isNewRound) {
          if (!roundPayload.startDate) roundPayload.startDate = new Date().toISOString();
          if (!roundPayload.endDate) roundPayload.endDate = new Date().toISOString();
          await roundsRepository.createRound(roundPayload);
        } else {
          await roundsRepository.updateRound(r.id, roundPayload);
        }
      }

      // Delete removed rounds
      const currentRoundIds = new Set(rounds.map((r) => r.id));
      const deletedRounds = (serverRounds || []).filter((sr: any) => {
        const id = sr.id || sr.Id || sr.roundId || sr.RoundId;
        return id && !currentRoundIds.has(id);
      });
      for (const dr of deletedRounds) {
        const id = dr.id || dr.Id || dr.roundId || dr.RoundId;
        if (id) await roundsRepository.deleteRound(id).catch((e) => console.warn("[SEAL] Delete round error:", e));
      }

      // 3. Persist Tracks (Create, Update, Delete)
      for (const t of tracks) {
        const isNewTrack = t.id.startsWith("new-trk-");
        const trackPayload: any = {
          eventId,
          trackName: t.trackName,
          templateId: t.templateId || undefined,
          description: t.description || undefined,
        };

        if (isNewTrack) {
          await tracksRepository.createTrack(trackPayload);
        } else {
          await tracksRepository.updateTrack(t.id, trackPayload);
        }
      }

      // Delete removed tracks
      const currentTrackIds = new Set(tracks.map((t) => t.id));
      const deletedTracks = (serverTracks || []).filter((st: any) => {
        const id = st.id || st.Id;
        return id && !currentTrackIds.has(id);
      });
      for (const dt of deletedTracks) {
        const id = dt.id || dt.Id;
        if (id) await tracksRepository.deleteTrack(id).catch((e) => console.warn("[SEAL] Delete track error:", e));
      }

      // 4. Persist Staff Invites (Invite new judges/mentors)
      const newStaffInvites = staffInvites.filter((s) => s.status === "Pending" && s.id.startsWith("invite-"));
      for (const invite of newStaffInvites) {
        const invitePayload = {
          eventId,
          email: invite.email,
          trackId: invite.trackId,
        };
        if (invite.roleName === "Judge") {
          await staffRepository.inviteJudge(invitePayload).catch((e: any) => console.warn("[SEAL] Invite judge error:", e));
        } else {
          await staffRepository.inviteMentor(invitePayload).catch((e: any) => console.warn("[SEAL] Invite mentor error:", e));
        }
      }

      // 5. Update UI status and Refetch all queries
      setStatus(isNextPublic);
      await refetchEvent();
      await refetchRounds();
      await refetchTracks();
      await refetchRoles();

      setSuccessMessage(
        isNextPublic
          ? "🎉 CÔNG BỐ SỰ KIỆN THÀNH CÔNG! Thí sinh đã có thể nhìn thấy và đăng ký trên trang chủ."
          : "💾 ĐÃ LƯU THAY ĐỔI SỰ KIỆN, VÒNG THI & HẠNG MỤC THÀNH CÔNG! Sự kiện đang ở trạng thái Bản Nháp an toàn."
      );
    } catch (err: any) {
      setErrorMessage(`Lưu thay đổi thất bại: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Toggle Status Banner
  const handleQuickToggleStatus = async () => {
    if (!status) {
      if (!canPublishEvent) {
        setErrorMessage(`Chưa đủ điều kiện công bố. Vui lòng hoàn tất: ${validationMissingItems.join(", ")}`);
        setCurrentStep(6);
        return;
      }
      if (!confirm(`Bạn có chắc chắn muốn CÔNG BỐ sự kiện "${eventData.eventName}" lên trang chủ công khai cho thí sinh đăng ký không?`)) {
        return;
      }
    } else {
      if (!confirm(`Bạn có chắc chắn muốn TẠM ẨN sự kiện "${eventData.eventName}" về Bản Nháp (Draft) để chỉnh sửa không?`)) {
        return;
      }
    }

    setIsTogglingPublish(true);
    await handleSaveChanges(!status);
    setIsTogglingPublish(false);
  };

  const steps = [
    { number: 1, label: "Tạo Event", icon: Shield },
    { number: 2, label: "Vòng Thi", icon: Layers },
    { number: 3, label: "Hạng Mục", icon: Target },
    { number: 4, label: "Tiêu Chí", icon: Sliders },
    { number: 5, label: "Nhân Sự", icon: Users },
    { number: 6, label: "Công Bố", icon: Rocket },
  ];

  const stepDoneMap: Record<number, boolean> = {
    1: Boolean(eventData.eventName && eventData.startDate && eventData.endDate),
    2: rounds.length > 0,
    3: tracks.length > 0,
    4: isValidWeight100,
    5: judgeCount > 0,
    6: canPublishEvent,
  };

  if (isLoadingEvent) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <svg className="w-12 h-12 animate-spin mx-auto text-[var(--accent-coordinator)]" viewBox="0 0 100 100">
            <polygon points="50,5 91,27.5 91,72.5 50,95 9,72.5 9,27.5" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="240" strokeDashoffset="60" />
          </svg>
          <p className="font-mono text-xs text-[var(--text-muted)]">Đang tải cấu hình chi tiết sự kiện...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-4 py-8 space-y-8">
        
        {/* Top Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-muted)] pb-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-muted)] mb-2">
              <Link href="/coordinator/dashboard" className="hover:text-[var(--accent-coordinator)] flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Coordinator Dashboard
              </Link>
              <span>/</span>
              <span className="text-[var(--accent-coordinator)] font-bold">Chỉnh Sửa Cấu Hình Sự Kiện</span>
            </div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-3">
              <Shield className="w-8 h-8 text-[var(--accent-coordinator)]" />
              {eventData.eventName || "Thiết Lập Sự Kiện"}
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
              ID: {eventId} | {eventData.season} {eventData.year} | Quy mô: {eventData.maxTeams} Đội thi
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/events/${eventId}`}>
              <Button variant="secondary" className="hud-clipped font-mono text-xs">
                XEM TRANG PUBLIC &gt;
              </Button>
            </Link>
          </div>
        </div>

        {/* Safety & Status Banner with One-Touch Toggle */}
        <div className={`p-4 border hud-clipped flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          status
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-amber-500/10 border-amber-500/30 text-amber-300"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${status ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <span>{status ? "🟢 SỰ KIỆN ĐANG CÔNG KHAI (PUBLIC)" : "🟡 SỰ KIỆN ĐANG Ở TRẠNG THÁI BẢN NHÁP (DRAFT / ĐANG ẨN)"}</span>
                {status && (
                  <span className="px-2 py-0.5 bg-black/40 border border-emerald-500/40 text-[10px] text-emerald-400">
                    🔒 CHẾ ĐỘ CHỈ ĐỌC (READ-ONLY)
                  </span>
                )}
              </div>
              <p className="font-mono text-[11px] text-[var(--text-muted)] mt-0.5">
                {status
                  ? "Sự kiện đang hiển thị công khai trên trang chủ. Bấm [ 🔒 TẠM ẨN ĐỂ SỬA ] để mở khóa chỉnh sửa an toàn các bước bên dưới."
                  : "Sự kiện được ẩn an toàn. Bạn có thể tự do chỉnh sửa 6 bước bên dưới rồi bấm [ 🚀 CÔNG BỐ ] để phát hành."}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            disabled={isTogglingPublish}
            onClick={handleQuickToggleStatus}
            className={`font-mono text-xs font-bold py-2.5 px-5 shrink-0 flex items-center gap-2 border cursor-pointer ${
              status
                ? "border-amber-500/60 text-amber-300 hover:bg-amber-500/20 bg-amber-500/10"
                : "border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/20 bg-emerald-500/10"
            }`}
          >
            {status ? (
              <>
                <EyeOff className="w-4 h-4 text-amber-400" />
                <span>{isTogglingPublish ? "Đang xử lý..." : "🔒 TẠM ẨN ĐỂ SỬA"}</span>
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 text-emerald-400" />
                <span>{isTogglingPublish ? "Đang xử lý..." : "🚀 CÔNG BỐ SỰ KIỆN"}</span>
              </>
            )}
          </Button>
        </div>

        {/* HUD Step Indicator Bar (Identical to Create Event Wizard) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {steps.map((step) => {
            const isActive = currentStep === step.number;
            const isCompleted = step.number === 6 ? canPublishEvent : Boolean(stepDoneMap[step.number]);

            return (
              <button
                key={step.number}
                type="button"
                onClick={() => setCurrentStep(step.number)}
                className={`p-3 border text-left transition-all duration-200 hud-clipped flex items-center gap-2.5 relative group cursor-pointer ${
                  isActive
                    ? "bg-[rgba(6,182,212,0.15)] border-2 border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.35)] text-cyan-300 scale-[1.02] z-10"
                    : isCompleted
                    ? "bg-[rgba(16,185,129,0.1)] border-[var(--color-success)] text-[var(--color-success)] hover:bg-[rgba(16,185,129,0.2)]"
                    : "bg-[var(--bg-panel)]/40 border-[var(--border-muted)] text-[var(--text-muted)] hover:border-slate-500 hover:text-[var(--text-primary)]"
                }`}
              >
                {/* Status Icon / Number Badge */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-all ${
                    isActive
                      ? "bg-cyan-400 text-black shadow-[0_0_8px_#22d3ee] font-black"
                      : isCompleted
                      ? "bg-[var(--color-success)] text-black"
                      : "bg-[var(--bg-input)] text-[var(--text-muted)] border border-[var(--border-muted)]"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-black stroke-[3]" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>

                <div className="overflow-hidden flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[9px] uppercase tracking-widest block text-[var(--text-muted)]">
                      Bước {step.number}
                    </span>

                    {/* Step Status Badge */}
                    <span
                      className={`font-mono text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        isActive
                          ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 animate-pulse"
                          : isCompleted
                          ? "bg-[var(--color-success)]/20 text-[var(--color-success)]"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {isActive ? "⚡ Đang làm" : isCompleted ? "✓ Xong" : "Chờ"}
                    </span>
                  </div>

                  <span
                    className={`font-mono font-bold text-xs truncate block mt-0.5 ${
                      isActive ? "text-cyan-200" : isCompleted ? "text-[var(--color-success)]" : "text-[var(--text-muted)]"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Global Messages Banner */}
        {errorMessage && (
          <div className="p-4 bg-[rgba(239,68,68,0.1)] border border-[var(--color-danger)] text-[var(--color-danger)] font-mono text-xs hud-clipped flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-[var(--color-danger)]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 font-mono text-xs hud-clipped flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 6 Step Components Rendering */}
        <div className="transition-all duration-300">
          {currentStep === 1 && (
            <Step1EventBasicInfo
              eventData={eventData}
              onUpdateField={handleUpdateEventField}
              onNext={handleNextStep}
              isSubmitting={isSubmitting}
              isReadOnly={status}
            />
          )}

          {currentStep === 2 && (
            <Step2RoundConfig
              rounds={rounds}
              onAddRound={handleAddRound}
              onRemoveRound={handleRemoveRound}
              onUpdateRound={handleUpdateRound}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
              isReadOnly={status}
            />
          )}

          {currentStep === 3 && (
            <Step3TrackConfig
              rounds={rounds}
              tracks={tracks}
              onAddTrack={handleAddTrack}
              onRemoveTrack={handleRemoveTrack}
              onUpdateTrack={handleUpdateTrack}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
              isReadOnly={status}
            />
          )}

          {currentStep === 4 && (
            <Step4TemplateCriteriaEditor
              tracks={tracks}
              templates={templates}
              criteriasByTrack={criteriasByTrack}
              onUpdateTrackCriterias={handleSetCriteriasForTrack}
              onApplyToAllTracks={handleApplyCriteriasToAllTracks}
              templateName={templateName}
              onUpdateTemplateName={setTemplateName}
              criterias={criterias}
              totalWeight={totalWeight}
              isValidWeight100={isValidWeight100}
              onAddCriteria={handleAddCriteria}
              onRemoveCriteria={handleRemoveCriteria}
              onUpdateCriteria={handleUpdateCriteria}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
              isReadOnly={status}
            />
          )}

          {currentStep === 5 && (
            <Step5StaffAssignment
              tracks={tracks}
              staffInvites={staffInvites}
              onAddStaffInvite={handleAddStaffInvite}
              onRemoveStaffInvite={handleRemoveStaffInvite}
              onFinish={handleNextStep}
              onPrev={handlePrevStep}
              isSubmitting={isSubmitting}
              successMessage={successMessage}
              isReadOnly={status}
            />
          )}

          {currentStep === 6 && (
            <Step6EventConfirmation
              eventId={eventId}
              eventData={eventData}
              rounds={rounds}
              tracks={tracks}
              criterias={criterias}
              staffInvites={staffInvites}
              canPublishEvent={canPublishEvent}
              validationMissingItems={validationMissingItems}
              onPrev={handlePrevStep}
            />
          )}
        </div>

      </main>
    </div>
  );
};
