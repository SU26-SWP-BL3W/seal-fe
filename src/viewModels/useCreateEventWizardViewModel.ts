import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { eventsRepository, useMyEvents } from "@/repositories/eventsRepository";
import { useGetRoundsByEvent } from "@/repositories/events/roundsRepository";
import type { EventEntity } from "@/models/entities";

export interface EventFormState {
  eventName: string;
  season: string;
  year: number;
  startDate: string;
  endDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  maxTeams: number;
  minTeamSize?: number;
  maxTeamSize?: number;
  tagline?: string;
  description: string;
}

export interface RoundFormState {
  id: string; // temporary client ID
  roundName: string;
  roundNumber: number;
  startDate: string;
  endDate: string;
  advancementRule: string; // e.g. "top 10", "percent 50", "minScore 7.0"
  scoringStartDate?: string;
  scoringEndDate?: string;
  appealStartDate?: string;
  appealEndDate?: string;
}

export interface TrackFormState {
  id: string; // temporary client ID
  eventId?: string;
  trackName: string;
  templateId: string;
  description: string;
  startDate?: string;
  endDate?: string;
  scoringStartDate?: string;
  scoringEndDate?: string;
}

export interface TemplateCriteriaFormState {
  criteriaId: string;
  criterionName: string;
  description: string;
  weight: number;
  maxScore: number;
}

export interface StaffInviteFormState {
  id: string;
  email: string;
  trackId?: string;
  roleName: "Judge" | "Mentor";
  status: "Pending" | "Accepted" | "Rejected";
}

export function useCreateEventWizardViewModel() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Step 1 State: Event Basic Info
  const [eventData, setEventData] = useState<EventFormState>({
    eventName: "",
    season: "",
    year: new Date().getFullYear(),
    startDate: "",
    endDate: "",
    registrationStartDate: "",
    registrationEndDate: "",
    maxTeams: 0,
    minTeamSize: 1,
    maxTeamSize: 5,
    tagline: "",
    description: "",
  });

  // Created Event Entity after Step 1 submit
  const [createdEvent, setCreatedEvent] = useState<EventEntity | null>(null);

  // Step 2 State: Initial Rounds for Coordinator to configure
  const [rounds, setRounds] = useState<RoundFormState[]>([]);

  // Step 3 State: Initial Tracks
  const [tracks, setTracks] = useState<TrackFormState[]>([]);

  // Step 4 State: Criteria & Template Config
  const [templateName, setTemplateName] = useState<string>("");
  const [criterias, setCriterias] = useState<TemplateCriteriaFormState[]>([]);

  const [criteriasByTrack, setCriteriasByTrack] = useState<Record<string, TemplateCriteriaFormState[]>>({});

  // Sync real Event data from Backend API / myEvents
  const searchParams = useSearchParams();
  const targetEventId = searchParams?.get("eventId");
  const { data: myEvents = [] } = useMyEvents();

  useEffect(() => {
    if (Array.isArray(myEvents) && myEvents.length > 0) {
      const activeEv = (targetEventId ? myEvents.find((e: any) => (e.id || e.Id || e.eventId || e.EventId) === targetEventId) : null) || myEvents[0];
      if (activeEv) {
        setCreatedEvent(activeEv as any);
        const targetId = activeEv.id || activeEv.Id || activeEv.eventId || activeEv.EventId;

        // Check if there is a dedicated local draft saved
        let localDraft: any = null;
        if (typeof window !== "undefined" && targetId) {
          try {
            const rawDraft = localStorage.getItem(`seal_wizard_draft_${targetId}`);
            if (rawDraft) localDraft = JSON.parse(rawDraft);
          } catch {
            // ignore
          }
        }

        const effectiveEv = localDraft ? { ...activeEv, ...localDraft } : activeEv;

        // Reset or sync current step for the selected event
        if (effectiveEv.currentStep && typeof effectiveEv.currentStep === "number") {
          setCurrentStep(Math.min(Math.max(1, effectiveEv.currentStep), 5));
        } else {
          setCurrentStep(1);
        }

        setEventData({
          eventName: effectiveEv.eventName || effectiveEv.EventName || "",
          season: effectiveEv.season || effectiveEv.Season || "",
          year: effectiveEv.year || effectiveEv.Year || new Date().getFullYear(),
          startDate: effectiveEv.startDate || effectiveEv.StartDate || "",
          endDate: effectiveEv.endDate || effectiveEv.EndDate || "",
          registrationStartDate: effectiveEv.registrationStartDate || effectiveEv.RegistrationStartDate || "",
          registrationEndDate: effectiveEv.registrationEndDate || effectiveEv.RegistrationEndDate || "",
          maxTeams: effectiveEv.maxTeams || effectiveEv.MaxTeams || 50,
          minTeamSize: 1,
          maxTeamSize: 5,
          tagline: effectiveEv.description || effectiveEv.Description || "",
          description: effectiveEv.description || effectiveEv.Description || "",
        });

        // Also sync rounds if available
        if (Array.isArray(effectiveEv.rounds) && effectiveEv.rounds.length > 0) {
          const mappedRounds: RoundFormState[] = effectiveEv.rounds.map((r: any, idx: number) => ({
            id: r.id || r.Id || r.roundId || `rnd-${idx}`,
            roundName: r.roundName || r.RoundName || `Vòng ${idx + 1}`,
            roundNumber: r.roundNumber || r.RoundNumber || idx + 1,
            startDate: r.startDate || r.StartDate || "",
            endDate: r.endDate || r.EndDate || "",
            advancementRule: r.advancementRule || r.AdvancementRule || "top:10",
            scoringStartDate: r.scoringStartDate || r.ScoringStartDate || "",
            scoringEndDate: r.scoringEndDate || r.ScoringEndDate || "",
          }));
          setRounds(mappedRounds);
        }

        // Also sync tracks if available
        if (Array.isArray(effectiveEv.tracks) && effectiveEv.tracks.length > 0) {
          const mappedTracks: TrackFormState[] = effectiveEv.tracks.map((t: any, idx: number) => ({
            id: t.id || t.Id || t.trackId || `trk-${idx}`,
            trackName: t.trackName || t.TrackName || `Hạng mục ${idx + 1}`,
            description: t.description || t.Description || "",
            templateId: t.templateId || t.TemplateId || "",
          }));
          setTracks(mappedTracks);
        }

        // Also sync criterias & criteriasByTrack if available in draft
        if (effectiveEv.criteriasByTrack && typeof effectiveEv.criteriasByTrack === "object") {
          setCriteriasByTrack(effectiveEv.criteriasByTrack);
        }
        if (Array.isArray(effectiveEv.criterias) && effectiveEv.criterias.length > 0) {
          setCriterias(effectiveEv.criterias);
        }
        if (effectiveEv.templateName) {
          setTemplateName(effectiveEv.templateName);
        }
      }
    }
  }, [myEvents, targetEventId]);

  // Fetch rounds from backend API if rounds state is empty
  const activeEventIdForRounds = (createdEvent as any)?.id || (createdEvent as any)?.Id || targetEventId || "";
  const { data: dbRoundsPaged } = useGetRoundsByEvent(activeEventIdForRounds || undefined);

  useEffect(() => {
    if (activeEventIdForRounds) {
      const rawRounds = (dbRoundsPaged as any)?.data || (dbRoundsPaged as any)?.items || (Array.isArray(dbRoundsPaged) ? dbRoundsPaged : []);
      if (Array.isArray(rawRounds) && rawRounds.length > 0) {
        setRounds((prev) => {
          if (prev.length > 0) return prev; // Don't overwrite if user or draft already has rounds
          return rawRounds.map((r: any, idx: number) => ({
            id: r.id || r.Id || r.roundId || `rnd-${idx}`,
            roundName: r.roundName || r.RoundName || `Vòng ${idx + 1}`,
            roundNumber: r.roundNumber || r.RoundNumber || idx + 1,
            startDate: r.startDate || r.StartDate || "",
            endDate: r.endDate || r.EndDate || "",
            advancementRule: r.advancementRule || r.AdvancementRule || "top:10",
            scoringStartDate: r.scoringStartDate || r.ScoringStartDate || "",
            scoringEndDate: r.scoringEndDate || r.ScoringEndDate || "",
          }));
        });
      }
    }
  }, [dbRoundsPaged, activeEventIdForRounds]);

  const setCriteriasForTrack = (trackId: string, list: TemplateCriteriaFormState[]) => {
    setIsDirty(true);
    setCriteriasByTrack((prev) => ({ ...prev, [trackId]: list }));
  };

  const applyCriteriasToAllTracks = (list: TemplateCriteriaFormState[]) => {
    setIsDirty(true);
    const nextMap: Record<string, TemplateCriteriaFormState[]> = {};
    tracks.forEach((t) => {
      nextMap[t.id] = list;
    });
    setCriteriasByTrack(nextMap);
  };

  // Step 5 State: Staff Assignments (Judges / Mentors)
  const [staffInvites, setStaffInvites] = useState<StaffInviteFormState[]>([
    {
      id: "stf-1",
      email: "judge.ai@fpt.edu.vn",
      trackId: "tmp-t1",
      roleName: "Judge",
      status: "Pending",
    },
    {
      id: "stf-2",
      email: "mentor.web@fpt.edu.vn",
      trackId: "tmp-t2",
      roleName: "Mentor",
      status: "Pending",
    },
  ]);

  // Real data-based Step completion checks
  const isStep1Done = true; // Admin creates Step 1, so Step 1 is always completed by default

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

  const isStep3Done = Boolean(
    tracks.length > 0 &&
    tracks.every((t) => t.trackName?.trim())
  );

  const isStep4Done = Boolean(
    tracks.length > 0 &&
    tracks.every((trk) => {
      if (trk.templateId && trk.templateId !== "__custom__") {
        return true;
      }
      const list = criteriasByTrack[trk.id] ?? (trk.templateId === "__custom__" ? [] : criterias);
      if (!list || list.length === 0) return false;
      const weight = list.reduce((acc, c) => acc + (Number(c.weight) || 0), 0);
      return Math.abs(weight - 100) < 0.01;
    })
  );

  // Total weight computed live
  const totalWeight = criterias.reduce((acc, item) => acc + (Number(item.weight) || 0), 0);
  const isValidWeight100 = isStep4Done;

  const isStep5Done = Boolean(
    staffInvites.length > 0 &&
    staffInvites.every((s) => s.email?.trim() && s.email.includes("@"))
  );

  const stepDoneMap: Record<number, boolean> = {
    1: isStep1Done,
    2: isStep2Done,
    3: isStep3Done,
    4: isStep4Done,
    5: isStep5Done,
  };

  const validationMissingItems: string[] = [];
  if (!isStep1Done) {
    validationMissingItems.push("Bước 1: Thông tin sự kiện chưa đầy đủ.");
  }
  if (!isStep2Done) {
    const unconfigRounds = rounds.filter((r) => !(r.scoringEndDate || (r as any).ScoringEndDate));
    if (rounds.length === 0) {
      validationMissingItems.push("Bước 2: Sự kiện chưa có Vòng thi nào.");
    } else if (unconfigRounds.length > 0) {
      validationMissingItems.push(`Bước 2: Có ${unconfigRounds.length} Vòng thi chưa điền hạn chót chấm điểm (${unconfigRounds.map((r) => r.roundName).join(", ")}).`);
    } else {
      validationMissingItems.push("Bước 2: Mốc thời gian các Vòng thi chưa hợp lệ.");
    }
  }
  if (!isStep3Done) {
    validationMissingItems.push("Bước 3: Sự kiện cần ít nhất 1 Hạng mục thi đấu.");
  }
  if (!isStep4Done) {
    const invalidTracks = tracks.filter((trk) => {
      if (trk.templateId && trk.templateId !== "__custom__") return false;
      const list = criteriasByTrack[trk.id] ?? (trk.templateId === "__custom__" ? [] : criterias);
      if (!list || list.length === 0) return true;
      const weight = list.reduce((acc, c) => acc + (Number(c.weight) || 0), 0);
      return Math.abs(weight - 100) >= 0.01;
    });
    if (invalidTracks.length > 0) {
      validationMissingItems.push(`Bước 4: Hạng mục [${invalidTracks.map((t) => t.trackName).join(", ")}] chưa cân bằng đủ 100% trọng số tiêu chí.`);
    }
  }

  const canPublishEvent = isStep1Done && isStep2Done && isStep3Done && isStep4Done;

  // Actions
  const handleUpdateEventField = (field: keyof EventFormState, value: any) => {
    setIsDirty(true);
    setEventData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddRound = () => {
    setIsDirty(true);
    const nextNumber = rounds.length + 1;
    setRounds((prev) => [
      ...prev,
      {
        id: `tmp-r${Date.now()}`,
        roundName: `Vòng ${nextNumber}`,
        roundNumber: nextNumber,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        advancementRule: "top:10",
      },
    ]);
  };

  const handleRemoveRound = (id: string) => {
    if (rounds.length <= 1) return;
    setIsDirty(true);
    setRounds((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRound = (id: string, field: keyof RoundFormState, value: any) => {
    setIsDirty(true);
    setRounds((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleAddTrack = () => {
    setIsDirty(true);
    const defaultRoundId = rounds[0]?.id || "tmp-r1";
    setTracks((prev) => [
      ...prev,
      {
        id: `tmp-t${Date.now()}`,
        roundId: defaultRoundId,
        trackName: "Hạng mục công nghệ mới",
        templateId: "__custom__",
        description: "",
      },
    ]);
  };

  const handleRemoveTrack = (id: string) => {
    setIsDirty(true);
    setTracks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateTrack = (id: string, field: keyof TrackFormState, value: any) => {
    setIsDirty(true);
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleAddCriteria = (criteriaObj?: Partial<TemplateCriteriaFormState>) => {
    setIsDirty(true);
    setCriterias((prev) => [
      ...prev,
      {
        criteriaId: criteriaObj?.criteriaId || `crit-${Date.now()}`,
        criterionName: criteriaObj?.criterionName || "Tiêu chí chấm điểm mới",
        description: criteriaObj?.description || "",
        weight: criteriaObj?.weight || 10,
        maxScore: criteriaObj?.maxScore || 10,
      },
    ]);
  };

  const handleRemoveCriteria = (index: number) => {
    setIsDirty(true);
    setCriterias((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCriteria = (index: number, field: keyof TemplateCriteriaFormState, value: any) => {
    setIsDirty(true);
    setCriterias((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: field === "weight" || field === "maxScore" ? Number(value) : value } : item))
    );
  };

  const handleAddStaffInvite = (email: string, roleName: "Judge" | "Mentor", trackId?: string) => {
    if (!email || !email.includes("@")) {
      setErrorMessage("Vui lòng nhập địa chỉ email hợp lệ!");
      return;
    }
    setIsDirty(true);
    setStaffInvites((prev) => [
      ...prev,
      {
        id: `stf-${Date.now()}`,
        email,
        trackId,
        roleName,
        status: "Pending",
      },
    ]);
    setErrorMessage(null);
  };

  const handleRemoveStaffInvite = (id: string) => {
    setIsDirty(true);
    setStaffInvites((prev) => prev.filter((s) => s.id !== id));
  };

  // Step Transition Handlers
  const handleNextStep = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Step 1 -> Step 2 transition
    if (currentStep === 1) {
      if (!createdEvent) {
        setCreatedEvent({ id: `ev-draft-${Date.now()}`, eventName: eventData.eventName || "Sự kiện mới" } as any);
      }
      setCurrentStep(2);
      return;
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
      }
      setCurrentStep(3);
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
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (!isStep4Done) {
        const invalidTracks = tracks.filter((trk) => {
          if (trk.templateId && trk.templateId !== "__custom__") return false;
          const list = criteriasByTrack[trk.id] ?? criterias;
          if (!list || list.length === 0) return true;
          const weight = list.reduce((acc, c) => acc + (Number(c.weight) || 0), 0);
          return Math.abs(weight - 100) >= 0.01;
        });

        if (invalidTracks.length > 0) {
          const detailMsgs = invalidTracks.map((t) => {
            const list = criteriasByTrack[t.id] ?? criterias;
            const w = list ? list.reduce((acc, c) => acc + (Number(c.weight) || 0), 0) : 0;
            return `[${t.trackName}]: ${w}%`;
          }).join(", ");
          setErrorMessage(`Tất cả hạng mục thi đều phải đạt ĐÚNG 100% trọng số tiêu chí. Hạng mục chưa đạt: ${detailMsgs}`);
        } else {
          setErrorMessage("Vui lòng thiết lập ít nhất 1 tiêu chí cho từng hạng mục!");
        }
        return;
      }
      setCurrentStep(5);
    } else if (currentStep === 5) {
      setSuccessMessage("Đã hoàn tất cấu hình nhân sự! Đang chuyển đến Bước 6 xác nhận...");
      setCurrentStep(6);
    }
  };

  const [maxStepReached, setMaxStepReached] = useState<number>(1);

  useEffect(() => {
    setMaxStepReached((prev) => Math.max(prev, currentStep));
  }, [currentStep]);

  const handleSaveDraft = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const targetId = (createdEvent as any)?.id || (createdEvent as any)?.Id || (eventData as any)?.id || targetEventId || `ev-draft-${Date.now()}`;
      
      const fullDraftPayload = {
        ...eventData,
        id: targetId,
        eventId: targetId,
        status: false,
        rounds,
        tracks,
        criterias,
        criteriasByTrack,
        templateName,
        currentStep,
      };

      // 1. Update eventsRepository
      await eventsRepository.updateEvent(targetId, fullDraftPayload);

      // 2. Explicitly persist into dedicated draft localStorage key
      if (typeof window !== "undefined") {
        localStorage.setItem(`seal_wizard_draft_${targetId}`, JSON.stringify(fullDraftPayload));
      }

      setIsSubmitting(false);
      setIsDirty(false);
      setSuccessMessage("Đã lưu bản nháp tiến trình thành công! Bạn có thể thoát và quay lại làm tiếp bất cứ lúc nào.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage("Bản nháp tiến trình đã được sao lưu vào bộ nhớ tạm trình duyệt.");
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setErrorMessage(null);
      setCurrentStep((prev) => prev - 1);
    }
  };

  return {
    currentStep,
    setCurrentStep,
    isSubmitting,
    errorMessage,
    successMessage,
    eventData,
    createdEvent,
    rounds,
    tracks,
    templateName,
    setTemplateName,
    criterias,
    criteriasByTrack,
    setCriteriasForTrack,
    applyCriteriasToAllTracks,
    totalWeight,
    isValidWeight100,
    isStep1Done,
    isStep2Done,
    isStep3Done,
    isStep4Done,
    isStep5Done,
    stepDoneMap,
    canPublishEvent,
    validationMissingItems,
    staffInvites,
    handleUpdateEventField,
    handleAddRound,
    handleRemoveRound,
    handleUpdateRound,
    handleAddTrack,
    handleRemoveTrack,
    handleUpdateTrack,
    handleAddCriteria,
    handleRemoveCriteria,
    handleUpdateCriteria,
    handleAddStaffInvite,
    handleRemoveStaffInvite,
    myEvents,
    targetEventId,
    handleNextStep,
    handlePrevStep,
    handleSaveDraft,
    maxStepReached,
    isDirty,
    setIsDirty,
  };
}
