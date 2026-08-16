import { useState } from "react";
import { eventsRepository } from "@/repositories/eventsRepository";
import { roundsRepository } from "@/repositories/roundsRepository";
import { tracksRepository } from "@/repositories/tracksRepository";
import { templatesRepository } from "@/repositories/templatesRepository";
import { staffRepository } from "@/repositories/staffRepository";
import { EventEntity, RoundEntity, TrackEntity, TemplateEntity, TemplateCriteriaEntity, EventRoleInvitationEntity } from "@/models/entities";

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

  // Step 1 State: Event Basic Info
  const [eventData, setEventData] = useState<EventFormState>({
    eventName: "",
    season: "",
    year: 2026,
    startDate: "",
    endDate: "",
    registrationStartDate: "",
    registrationEndDate: "",
    maxTeams: 50,
    minTeamSize: 3,
    maxTeamSize: 5,
    tagline: "",
    description: "",
  });

  // Created Event Entity after Step 1 submit
  const [createdEvent, setCreatedEvent] = useState<EventEntity | null>(null);

  // Step 2 State: Rounds
  const [rounds, setRounds] = useState<RoundFormState[]>([]);

  // Step 3 State: Tracks
  const [tracks, setTracks] = useState<TrackFormState[]>([]);

  // Step 4 State: Criteria & Template Config
  const [templateName, setTemplateName] = useState<string>("");
  const [criterias, setCriterias] = useState<TemplateCriteriaFormState[]>([]);

  const [criteriasByTrack, setCriteriasByTrack] = useState<Record<string, TemplateCriteriaFormState[]>>({});

  const setCriteriasForTrack = (trackId: string, list: TemplateCriteriaFormState[]) => {
    setCriteriasByTrack((prev) => ({ ...prev, [trackId]: list }));
  };

  const applyCriteriasToAllTracks = (list: TemplateCriteriaFormState[]) => {
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

  // Total weight computed live
  const totalWeight = criterias.reduce((acc, item) => acc + (Number(item.weight) || 0), 0);
  const isValidWeight100 = Math.abs(totalWeight - 100) < 0.01;

  // Real data-based Step completion checks
  const isStep1Done = Boolean(
    eventData.eventName?.trim() &&
    eventData.startDate &&
    eventData.endDate &&
    new Date(eventData.startDate) <= new Date(eventData.endDate) &&
    (eventData.maxTeams ?? 0) > 0
  );

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
    validationMissingItems.push("Bước 1: Thông tin sự kiện chưa đầy đủ (Tên, Ngày bắt đầu/kết thúc hoặc Số lượng đội).");
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
    setEventData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddRound = () => {
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
    setRounds((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRound = (id: string, field: keyof RoundFormState, value: any) => {
    setRounds((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleAddTrack = () => {
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
    setTracks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateTrack = (id: string, field: keyof TrackFormState, value: any) => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleAddCriteria = (criteriaObj?: Partial<TemplateCriteriaFormState>) => {
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
    setCriterias((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCriteria = (index: number, field: keyof TemplateCriteriaFormState, value: any) => {
    setCriterias((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: field === "weight" || field === "maxScore" ? Number(value) : value } : item))
    );
  };

  const handleAddStaffInvite = (email: string, roleName: "Judge" | "Mentor", trackId?: string) => {
    if (!email || !email.includes("@")) {
      setErrorMessage("Vui lòng nhập địa chỉ email hợp lệ!");
      return;
    }
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
    setStaffInvites((prev) => prev.filter((s) => s.id !== id));
  };

  // Step Transition Handlers
  const handleNextStep = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation per step
    if (currentStep === 1) {
      if (!eventData.eventName.trim()) {
        setErrorMessage("Vui lòng nhập Tên sự kiện!");
        return;
      }
      if (!eventData.registrationStartDate || !eventData.registrationEndDate) {
        setErrorMessage("Vui lòng thiết lập đầy đủ Thời gian Mở và Đóng cổng đăng ký!");
        return;
      }
      if (new Date(eventData.registrationStartDate) >= new Date(eventData.registrationEndDate)) {
        setErrorMessage("Thời gian Mở cổng đăng ký phải diễn ra trước Thời gian Đóng cổng đăng ký!");
        return;
      }
      if (!eventData.startDate || !eventData.endDate) {
        setErrorMessage("Vui lòng thiết lập đầy đủ Thời gian Bắt đầu và Kết thúc sự kiện!");
        return;
      }
      if (new Date(eventData.startDate) > new Date(eventData.endDate)) {
        setErrorMessage("Ngày bắt đầu sự kiện phải diễn ra trước ngày kết thúc!");
        return;
      }
      if (!eventData.maxTeams || eventData.maxTeams <= 0) {
        setErrorMessage("Số lượng đội thi tối đa phải lớn hơn 0!");
        return;
      }
      // Step 1: Check if Event is already created from previous attempt
      const rawObj = createdEvent as any;
      const existingEventId = rawObj?.id || rawObj?.Id || rawObj?.eventId || rawObj?.EventId || rawObj?.data?.id || rawObj?.data?.Id;
      if (existingEventId) {
        setCurrentStep(2);
        return;
      }

      // Call API create event in Draft mode (status: false)
      setIsSubmitting(true);
      try {
        const res = await eventsRepository.createEvent({
          ...eventData,
          status: false,
        });
        setIsSubmitting(false);
        const createdObj = res?.data || res;
        const realEventId = createdObj?.id || createdObj?.Id || createdObj?.eventId || createdObj?.EventId;

        if (res && res.success !== false && realEventId) {
          setCreatedEvent(createdObj);
          setCurrentStep(2);
        } else {
          setErrorMessage(res?.message || "Tạo sự kiện thất bại. Vui lòng kiểm tra lại thông tin!");
        }
      } catch (err: any) {
        setIsSubmitting(false);
        setErrorMessage(err?.response?.data?.message || err?.message || "Tạo sự kiện thất bại. Không thể kết nối máy chủ.");
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
      const rawObj = createdEvent as any;
      const realEventId = rawObj?.id || rawObj?.Id || rawObj?.eventId || rawObj?.EventId || rawObj?.data?.id || rawObj?.data?.Id || rawObj?.data?.eventId || rawObj?.data?.EventId;
      if (!realEventId) {
        setErrorMessage("Vui lòng hoàn thành Bước 1 để khởi tạo Sự kiện trước!");
        return;
      }

      // Check if rounds are already created
      const existingRounds: any[] = (window as any).__createdRoundsList__ || [];
      if (existingRounds.length > 0 && existingRounds.length === rounds.length) {
        setCurrentStep(3);
        return;
      }

      setIsSubmitting(true);
      try {
        const createdRounds: any[] = [];
        for (const rnd of rounds) {
          // If this specific round was already created, skip creating again
          const alreadyCreated = existingRounds.find((r: any) => r.clientRoundId === rnd.id || r.roundNumber === rnd.roundNumber);
          if (alreadyCreated) {
            createdRounds.push(alreadyCreated);
            continue;
          }

          const res = await roundsRepository.createRound({
            eventId: realEventId,
            roundName: rnd.roundName,
            roundNumber: rnd.roundNumber,
            startDate: rnd.startDate,
            endDate: rnd.endDate,
            advancementRule: rnd.advancementRule,
            scoringStartDate: rnd.scoringStartDate,
            scoringEndDate: rnd.scoringEndDate,
            appealStartDate: rnd.appealStartDate,
            appealEndDate: rnd.appealEndDate,
          });
          if (res?.data) {
            createdRounds.push({ ...res.data, clientRoundId: rnd.id, roundNumber: rnd.roundNumber });
          }
        }
        (window as any).__createdRoundsList__ = createdRounds;
        setCurrentStep(3);
      } catch (err: any) {
        setErrorMessage(err?.response?.data?.message || "Lỗi khi khởi tạo danh sách Vòng thi!");
      } finally {
        setIsSubmitting(false);
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
      const realEventId = (createdEvent as any)?.id || (createdEvent as any)?.Id || createdEvent?.EventId || (createdEvent as any)?.data?.id;
      if (!realEventId) {
        setErrorMessage("Thiếu mã sự kiện (EventId). Vui lòng quay lại Bước 1!");
        return;
      }

      // Check if tracks are already created
      const existingTracks: any[] = (window as any).__createdTrackList__ || [];
      if (existingTracks.length > 0 && existingTracks.length === tracks.length) {
        setCurrentStep(4);
        return;
      }

      setIsSubmitting(true);
      try {
        const createdTrackList: any[] = [];
        for (const trk of tracks) {
          const alreadyCreated = existingTracks.find((t: any) => t.clientTrackId === trk.id);
          if (alreadyCreated) {
            createdTrackList.push(alreadyCreated);
            continue;
          }

          const payload: any = {
            eventId: realEventId,
            trackName: trk.trackName,
            description: trk.description,
            templateId: trk.templateId !== "__custom__" ? trk.templateId : undefined,
          };
          if (trk.startDate) payload.startDate = trk.startDate;
          if (trk.endDate) payload.endDate = trk.endDate;
          if (trk.scoringStartDate) payload.scoringStartDate = trk.scoringStartDate;
          if (trk.scoringEndDate) payload.scoringEndDate = trk.scoringEndDate;

          const resTrack = await tracksRepository.createTrack(payload);
          const trackObj: any = resTrack?.data || resTrack;
          if (trackObj) {
            createdTrackList.push({
              clientTrackId: trk.id,
              realTrackId: trackObj.id || trackObj.Id || trackObj.trackId || trackObj.TrackId,
              templateId: trk.templateId,
            });
          }
        }
        (window as any).__createdTrackList__ = createdTrackList;
        setCurrentStep(4);
      } catch (err: any) {
        setErrorMessage(err?.response?.data?.message || "Lỗi khi khởi tạo Hạng mục thi (Track)!");
      } finally {
        setIsSubmitting(false);
      }
    } else if (currentStep === 4) {
      const createdTrackList: any[] = (window as any).__createdTrackList__ || [];
      
      // Validate 100% weight for each configured track
      for (const item of createdTrackList) {
        const trackCriterias = criteriasByTrack[item.clientTrackId] || criterias;
        const trackWeight = trackCriterias.reduce((acc, c) => acc + (Number(c.weight) || 0), 0);
        if (Math.abs(trackWeight - 100) > 0.01) {
          const trackObj = tracks.find((t) => t.id === item.clientTrackId);
          setErrorMessage(`Tổng trọng số tiêu chí cho Hạng mục "${trackObj?.trackName || 'này'}" phải đạt ĐÚNG 100%! (Hiện tại: ${trackWeight}%).`);
          return;
        }
      }

      setIsSubmitting(true);
      try {
        const allTemplatesRes = await templatesRepository.getAllTemplates();
        const availableTemplates = allTemplatesRes?.data || [];

        for (const item of createdTrackList) {
          const trackObj = tracks.find((t) => t.id === item.clientTrackId);
          const trackCriterias = criteriasByTrack[item.clientTrackId] || criterias;
          const inheritedTemplate = availableTemplates.find(
            (t: any) => (t.id || t.Id || t.templateId || t.TemplateId) === item.templateId
          );

          // Check if user edited criteria from inherited template
          const hasEdited = !inheritedTemplate || (criteriasByTrack[item.clientTrackId] && criteriasByTrack[item.clientTrackId].length > 0);

          if (inheritedTemplate && !hasEdited) {
            // Branch 1: Unmodified existing template -> Assign directly, no new template created
            if (item.realTrackId) {
              await tracksRepository.assignTemplateToTrack(item.realTrackId, item.templateId);
            }
          } else {
            // Branch 2 & 3: Modified inherited template or custom -> Clone/Create new template
            const newTplName = inheritedTemplate
              ? `${inheritedTemplate.templateName || inheritedTemplate.TemplateName} - ${eventData.eventName}`
              : `Tiêu chí - ${trackObj?.trackName || 'Hạng mục'}`;

            const resTpl = await templatesRepository.createTemplate({
              templateName: newTplName,
              description: inheritedTemplate
                ? `Mẫu tiêu chí kế thừa từ "${inheritedTemplate.templateName || inheritedTemplate.TemplateName}"`
                : `Mẫu tiêu chí riêng cho hạng mục ${trackObj?.trackName}`,
            });

            const newTemplateId = (resTpl.data as any)?.id || (resTpl.data as any)?.Id || resTpl.data?.TemplateId;

            if (newTemplateId) {
              for (const crit of trackCriterias) {
                let targetCriteriaId = crit.criteriaId;

                if (!targetCriteriaId || targetCriteriaId.startsWith("crit-") || targetCriteriaId.length < 20) {
                  const resCrit = await templatesRepository.createCriteria({
                    criterionName: crit.criterionName,
                    description: crit.description || "",
                    maxScore: crit.maxScore || 10,
                  });
                  const createdCritObj: any = resCrit?.data || resCrit;
                  targetCriteriaId = createdCritObj?.id || createdCritObj?.Id || createdCritObj?.criteriaId || createdCritObj?.CriteriaId;
                }

                if (targetCriteriaId) {
                  await templatesRepository.addCriteriaToTemplate({
                    templateId: newTemplateId,
                    criteriaId: targetCriteriaId,
                    weight: crit.weight,
                    maxScore: crit.maxScore,
                  });
                }
              }

              if (item.realTrackId) {
                await tracksRepository.assignTemplateToTrack(item.realTrackId, newTemplateId);
              }
            }
          }
        }

        setCurrentStep(5);
      } catch (err: any) {
        setErrorMessage(err?.response?.data?.message || "Lỗi khi lưu Mẫu tiêu chí đánh giá RBL!");
      } finally {
        setIsSubmitting(false);
      }
    } else if (currentStep === 5) {
      const realEventId = (createdEvent as any)?.id || (createdEvent as any)?.Id || createdEvent?.EventId || (createdEvent as any)?.data?.id;
      if (!realEventId) {
        setErrorMessage("Thiếu mã sự kiện (EventId). Không thể gán nhân sự!");
        return;
      }
      setIsSubmitting(true);
      try {
        const createdTrackList: any[] = (window as any).__createdTrackList__ || [];
        for (const staff of staffInvites) {
          const targetTrackObj = createdTrackList.find((t) => t.clientTrackId === staff.trackId);
          const realTrackId = targetTrackObj?.realTrackId || staff.trackId;

          if (staff.roleName === "Judge") {
            await staffRepository.inviteJudge({
              eventId: realEventId,
              trackId: realTrackId,
              email: staff.email,
            });
          } else {
            await staffRepository.inviteMentor({
              eventId: realEventId,
              trackId: realTrackId,
              email: staff.email,
            });
          }
        }
        setSuccessMessage("Đã hoàn tất cấu hình nhân sự! Đang chuyển đến Bước 6 xác nhận...");
        setCurrentStep(6);
      } catch (err: any) {
        setErrorMessage(err?.response?.data?.message || "Có lỗi xảy ra khi phân công nhân sự.");
      } finally {
        setIsSubmitting(false);
      }
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
    handleNextStep,
    handlePrevStep,
  };
}
