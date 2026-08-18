"use client";

import React, { useState, useEffect, useMemo } from "react";
import { eventsRepository } from "@/repositories/eventsRepository";
import { roundsRepository } from "@/repositories/roundsRepository";
import { tracksRepository, type Track } from "@/repositories/events/tracksRepository";
import { templatesRepository, type Template } from "@/repositories/events/templatesRepository";
import { useToast } from "@/providers/ToastProvider";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui";

export interface RoundEditState {
  id?: string;
  roundName: string;
  roundNumber: number;
  startDate: string;
  endDate: string;
  scoringStartDate: string;
  scoringEndDate: string;
  appealStartDate: string;
  appealEndDate: string;
  advancementRuleType: "none" | "top" | "percent" | "minScore";
  advancementRuleValue: string;
  submissionRuleDescription?: string;
  requiredDeliverables?: string[];
  isNew?: boolean;
}

export interface TrackEditState {
  id?: string;
  trackName: string;
  description?: string;
  submissionRuleDescription?: string;
  templateId?: string | null;
  isNew?: boolean;
}

const AVAILABLE_DELIVERABLES = [
  { key: "github", label: "MÃ NGUỒN GITHUB / GITLAB" },
  { key: "deployed_url", label: "LIVE DEMO URL" },
  { key: "slides", label: "SLIDE THUYẾT TRÌNH (PDF/SLIDES)" },
  { key: "demo_video", label: "VIDEO DEMO (YOUTUBE / DRIVE)" },
  { key: "report", label: "BÁO CÁO KIẾN TRÚC (PDF/DOC)" },
  { key: "figma", label: "LINK FIGMA PROTOTYPE" },
];

function toDateTimeLocal(val?: string, defaultTime = "08:00") {
  if (!val) return "";
  if (val.includes("T")) {
    const parts = val.split("T");
    const datePart = parts[0];
    const timePart = parts[1]?.substring(0, 5) || defaultTime;
    return `${datePart}T${timePart}`;
  }
  return `${val}T${defaultTime}`;
}

function parseRuleString(ruleStr?: string): { type: "none" | "top" | "percent" | "minScore"; val: string } {
  if (!ruleStr) return { type: "none", val: "" };
  const trimmed = ruleStr.trim().toLowerCase();
  if (trimmed.startsWith("top:")) return { type: "top", val: trimmed.replace("top:", "").trim() };
  if (trimmed.startsWith("percent:")) return { type: "percent", val: trimmed.replace("percent:", "").trim() };
  if (trimmed.startsWith("minscore:")) return { type: "minScore", val: trimmed.replace("minscore:", "").trim() };
  return { type: "none", val: "" };
}

interface CoordinatorEventConfigPanelProps {
  event: any;
  onUpdated?: () => void;
}

export const CoordinatorEventConfigPanel: React.FC<CoordinatorEventConfigPanelProps> = ({
  event,
  onUpdated,
}) => {
  const toast = useToast();
  const eventId = event?.id || event?.Id || event?.eventId || event?.EventId || "";

  const [activeSubSection, setActiveSubSection] = useState<"general" | "rounds" | "tracks">("general");

  const [eventName, setEventName] = useState(event?.eventName || event?.EventName || "");
  const [season, setSeason] = useState(event?.season || event?.Season || "Summer");
  const [year, setYear] = useState<number>(Number(event?.year || event?.Year) || new Date().getFullYear());
  const [maxTeams, setMaxTeams] = useState<number>(Number(event?.maxTeams || event?.MaxTeams) || 50);
  const [description, setDescription] = useState(event?.description || event?.Description || "");
  const [startDate, setStartDate] = useState(toDateTimeLocal(event?.startDate || event?.StartDate, "08:00"));
  const [endDate, setEndDate] = useState(toDateTimeLocal(event?.endDate || event?.EndDate, "23:59"));
  const [registrationStartDate, setRegistrationStartDate] = useState(
    toDateTimeLocal(event?.registrationStartDate || event?.RegistrationStartDate, "08:00")
  );
  const [registrationEndDate, setRegistrationEndDate] = useState(
    toDateTimeLocal(event?.registrationEndDate || event?.RegistrationEndDate, "23:59")
  );
  const [isPublished, setIsPublished] = useState<boolean>(
    event?.status !== undefined ? Boolean(event.status) : (event?.Status !== undefined ? Boolean(event.Status) : false)
  );

  const [rounds, setRounds] = useState<RoundEditState[]>([]);
  const [deletedRoundIds, setDeletedRoundIds] = useState<string[]>([]);
  const [isLoadingRounds, setIsLoadingRounds] = useState<boolean>(true);

  const [tracks, setTracks] = useState<TrackEditState[]>([]);
  const [deletedTrackIds, setDeletedTrackIds] = useState<string[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(true);

  const [templatesList, setTemplatesList] = useState<Template[]>([]);
  const [expandedTrackRubrics, setExpandedTrackRubrics] = useState<Record<number, boolean>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const isGeneralComplete = useMemo(() => {
    return Boolean(
      eventName.trim() &&
      season.trim() &&
      year > 2000 &&
      maxTeams > 0 &&
      startDate &&
      endDate &&
      registrationStartDate &&
      registrationEndDate
    );
  }, [eventName, season, year, maxTeams, startDate, endDate, registrationStartDate, registrationEndDate]);

  const isRoundsComplete = useMemo(() => {
    return Boolean(
      rounds.length > 0 &&
      rounds.every((r) => r.roundName.trim() && r.startDate && r.endDate)
    );
  }, [rounds]);

  const assignedTracksRubricsCount = useMemo(() => {
    return tracks.filter((t) => Boolean(t.templateId)).length;
  }, [tracks]);

  const isTracksComplete = useMemo(() => {
    return Boolean(
      tracks.length > 0 &&
      assignedTracksRubricsCount === tracks.length &&
      tracks.every((t) => t.trackName.trim())
    );
  }, [tracks, assignedTracksRubricsCount]);

  const unassignedTracks = useMemo(() => tracks.filter((t) => !t.templateId), [tracks]);
  const [showGuardClauseModal, setShowGuardClauseModal] = useState(false);

  const completedStepsCount = useMemo(() => {
    let count = 0;
    if (isGeneralComplete) count++;
    if (isRoundsComplete) count++;
    if (isTracksComplete) count++;
    return count;
  }, [isGeneralComplete, isRoundsComplete, isTracksComplete]);

  const progressPercent = useMemo(() => {
    return Math.round((completedStepsCount / 3) * 100);
  }, [completedStepsCount]);

  useEffect(() => {
    let isMounted = true;
    templatesRepository
      .getTemplates()
      .then((items) => {
        if (isMounted) setTemplatesList(items || []);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const toggleExpandRubric = (trackIndex: number) => {
    setExpandedTrackRubrics((prev) => ({
      ...prev,
      [trackIndex]: !prev[trackIndex],
    }));
  };

  useEffect(() => {
    if (event) {
      setEventName(event.eventName || event.EventName || "");
      setSeason(event.season || event.Season || "Summer");
      setYear(Number(event.year || event.Year) || new Date().getFullYear());
      setMaxTeams(Number(event.maxTeams || event.MaxTeams) || 50);
      setDescription(event.description || event.Description || "");
      setStartDate(toDateTimeLocal(event.startDate || event.StartDate, "08:00"));
      setEndDate(toDateTimeLocal(event.endDate || event.EndDate, "23:59"));
      setRegistrationStartDate(toDateTimeLocal(event.registrationStartDate || event.RegistrationStartDate, "08:00"));
      setRegistrationEndDate(toDateTimeLocal(event.registrationEndDate || event.RegistrationEndDate, "23:59"));
      setIsPublished(event.status !== undefined ? Boolean(event.status) : (event.Status !== undefined ? Boolean(event.Status) : false));
    }
  }, [event]);

  useEffect(() => {
    if (!eventId) return;
    let isMounted = true;
    setIsLoadingRounds(true);
    setIsLoadingTracks(true);

    roundsRepository
      .getRoundsByEventId(eventId)
      .then((res) => {
        if (!isMounted) return;
        const items = res?.data?.items ?? res?.items ?? (Array.isArray(res) ? res : []);
        if (items.length > 0) {
          setRounds(
            items.map((r: any, idx: number) => {
              const ruleObj = parseRuleString(r.advancementRule || r.AdvancementRule);
              const defaultStartDate = toDateTimeLocal(r.startDate || r.StartDate, "08:00");
              const defaultEndDate = toDateTimeLocal(r.endDate || r.EndDate, "23:59");
              return {
                id: r.id || r.Id,
                roundName: r.roundName || r.RoundName || `VÒNG THI SỐ ${idx + 1}`,
                roundNumber: r.roundNumber || r.RoundNumber || idx + 1,
                startDate: defaultStartDate,
                endDate: defaultEndDate,
                scoringStartDate: toDateTimeLocal(r.scoringStartDate || r.ScoringStartDate || defaultEndDate, "08:00"),
                scoringEndDate: toDateTimeLocal(r.scoringEndDate || r.ScoringEndDate || defaultEndDate, "18:00"),
                appealStartDate: toDateTimeLocal(r.appealStartDate || r.AppealStartDate || defaultEndDate, "09:00"),
                appealEndDate: toDateTimeLocal(r.appealEndDate || r.AppealEndDate || defaultEndDate, "23:59"),
                advancementRuleType: ruleObj.type,
                advancementRuleValue: ruleObj.val,
                requiredDeliverables: ["github", "deployed_url", "slides"],
              };
            })
          );
        } else {
          setRounds([
            {
              id: undefined,
              isNew: true,
              roundName: "VÒNG TUYỂN CHỌN & Ý TƯỞNG",
              roundNumber: 1,
              startDate: toDateTimeLocal(event?.startDate || event?.StartDate, "08:00"),
              endDate: toDateTimeLocal(event?.endDate || event?.EndDate, "23:59"),
              scoringStartDate: toDateTimeLocal(event?.endDate || event?.EndDate, "08:00"),
              scoringEndDate: toDateTimeLocal(event?.endDate || event?.EndDate, "18:00"),
              appealStartDate: toDateTimeLocal(event?.endDate || event?.EndDate, "09:00"),
              appealEndDate: toDateTimeLocal(event?.endDate || event?.EndDate, "23:59"),
              advancementRuleType: "top",
              advancementRuleValue: "10",
              requiredDeliverables: ["github", "deployed_url", "slides"],
            },
          ]);
        }
      })
      .catch(() => { if (isMounted) setRounds([]); })
      .finally(() => { if (isMounted) setIsLoadingRounds(false); });

    tracksRepository
      .getTracksByEvent(eventId)
      .then((items) => {
        if (!isMounted) return;
        if (items && items.length > 0) {
          setTracks(
            items.map((t: Track) => ({
              id: t.id || t.Id,
              trackName: t.trackName || t.TrackName || "HẠNG MỤC MỚI",
              description: t.description || t.Description || "",
              submissionRuleDescription: t.submissionRuleDescription || "",
              templateId: t.templateId || t.TemplateId,
            }))
          );
        } else {
          setTracks([
            {
              id: undefined,
              isNew: true,
              trackName: "MAIN TRACK: ĐỔI MỚI SÁNG TẠO",
              description: "Hạng mục phát triển sản phẩm công nghệ và giải pháp thực tiễn.",
              submissionRuleDescription: "Nộp mã nguồn GitHub public, video demo và slide thuyết trình.",
            },
          ]);
        }
      })
      .catch(() => { if (isMounted) setTracks([]); })
      .finally(() => { if (isMounted) setIsLoadingTracks(false); });

    return () => { isMounted = false; };
  }, [eventId]);

  const handleAddRound = () => {
    const nextNumber = rounds.length + 1;
    setRounds([
      ...rounds,
      {
        id: `temp-round-${Date.now()}`,
        isNew: true,
        roundName: `VÒNG THI SỐ ${nextNumber}`,
        roundNumber: nextNumber,
        startDate: toDateTimeLocal(endDate, "08:00"),
        endDate: toDateTimeLocal(endDate, "23:59"),
        scoringStartDate: toDateTimeLocal(endDate, "08:00"),
        scoringEndDate: toDateTimeLocal(endDate, "18:00"),
        appealStartDate: toDateTimeLocal(endDate, "09:00"),
        appealEndDate: toDateTimeLocal(endDate, "23:59"),
        advancementRuleType: "top",
        advancementRuleValue: "10",
        requiredDeliverables: ["github", "deployed_url", "slides"],
      },
    ]);
  };

  const handleRemoveRound = (index: number) => {
    const target = rounds[index];
    if (target?.id && !target.id.startsWith("temp-") && !target.isNew) {
      setDeletedRoundIds((prev) => [...prev, target.id!]);
    }
    setRounds(rounds.filter((_, i) => i !== index));
  };

  const handleRoundChange = (index: number, field: keyof RoundEditState, value: any) => {
    const updated = [...rounds];
    updated[index] = { ...updated[index], [field]: value };
    setRounds(updated);
  };

  const handleToggleDeliverable = (roundIndex: number, deliverableKey: string) => {
    const target = rounds[roundIndex];
    const currentList = target.requiredDeliverables || ["github", "deployed_url", "slides"];
    const exists = currentList.includes(deliverableKey);
    const updatedList = exists
      ? currentList.filter((k) => k !== deliverableKey)
      : [...currentList, deliverableKey];

    handleRoundChange(roundIndex, "requiredDeliverables", updatedList);
  };

  const handleAddTrack = () => {
    const nextNumber = tracks.length + 1;
    setTracks([
      ...tracks,
      {
        id: `temp-track-${Date.now()}`,
        isNew: true,
        trackName: `HẠNG MỤC THI ĐẤU ${nextNumber}`,
        description: "",
        submissionRuleDescription: "",
      },
    ]);
  };

  const handleRemoveTrack = (index: number) => {
    const target = tracks[index];
    if (target?.id && !target.id.startsWith("temp-") && !target.isNew) {
      setDeletedTrackIds((prev) => [...prev, target.id!]);
    }
    setTracks(tracks.filter((_, i) => i !== index));
  };

  const handleTrackChange = (index: number, field: keyof TrackEditState, value: any) => {
    const updated = [...tracks];
    updated[index] = { ...updated[index], [field]: value };
    setTracks(updated);
  };

  const handleSaveAll = async (targetPublishStatus: boolean) => {
    if (!eventId) {
      toast.error("Không tìm thấy mã sự kiện.");
      return;
    }

    if (!eventName.trim()) {
      toast.error("Tên sự kiện không được để trống.");
      setActiveSubSection("general");
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const evStart = startDate ? new Date(startDate) : new Date();
      const evEnd = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 86400000);
      const regStart = registrationStartDate ? new Date(registrationStartDate) : new Date();
      const regEnd = registrationEndDate ? new Date(registrationEndDate) : new Date(Date.now() + 14 * 86400000);

      await eventsRepository.updateEvent(eventId, {
        eventName: eventName.trim(),
        season,
        year: Number(year) || new Date().getFullYear(),
        maxTeams: Number(maxTeams) || 50,
        description: description?.trim() || "",
        startDate: evStart.toISOString(),
        endDate: evEnd.toISOString(),
        registrationStartDate: regStart.toISOString(),
        status: targetPublishStatus,
      });

      for (const delId of deletedRoundIds) {
        try { await roundsRepository.deleteRound(delId); } catch {}
      }

      for (let i = 0; i < rounds.length; i++) {
        const r = rounds[i];
        let rulePayload: string | undefined = undefined;
        if (r.advancementRuleType === "top" && r.advancementRuleValue) {
          rulePayload = `top:${r.advancementRuleValue}`;
        } else if (r.advancementRuleType === "percent" && r.advancementRuleValue) {
          rulePayload = `percent:${r.advancementRuleValue}`;
        } else if (r.advancementRuleType === "minScore" && r.advancementRuleValue) {
          rulePayload = `minscore:${r.advancementRuleValue}`;
        }

        const payload = {
          eventId,
          roundName: r.roundName.trim() || `VÒNG THI SỐ ${i + 1}`,
          roundNumber: i + 1,
          startDate: r.startDate ? new Date(r.startDate).toISOString() : evStart.toISOString(),
          endDate: r.endDate ? new Date(r.endDate).toISOString() : evEnd.toISOString(),
          scoringStartDate: r.scoringStartDate ? new Date(r.scoringStartDate).toISOString() : undefined,
          scoringEndDate: r.scoringEndDate ? new Date(r.scoringEndDate).toISOString() : undefined,
          appealStartDate: r.appealStartDate ? new Date(r.appealStartDate).toISOString() : undefined,
          appealEndDate: r.appealEndDate ? new Date(r.appealEndDate).toISOString() : undefined,
          advancementRule: rulePayload,
        };

        if (r.id && !r.id.startsWith("temp-") && !r.isNew) {
          await roundsRepository.updateRound(r.id, payload);
        } else {
          await roundsRepository.createRound(payload);
        }
      }

      for (const delTrackId of deletedTrackIds) {
        try { await tracksRepository.deleteTrack(delTrackId); } catch {}
      }

      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        const trackPayload = {
          eventId,
          trackName: t.trackName.trim() || `HẠNG MỤC ${i + 1}`,
          description: t.description?.trim() || "",
          submissionRuleDescription: t.submissionRuleDescription?.trim() || "",
          templateId: t.templateId || undefined,
        };

        let targetTrackId = t.id;
        if (t.id && !t.id.startsWith("temp-") && !t.isNew) {
          await tracksRepository.updateTrack(t.id, trackPayload);
        } else {
          const created = await tracksRepository.createTrack(trackPayload);
          targetTrackId = created?.id || (created as any)?.Id;
        }

        if (targetTrackId && t.templateId) {
          try {
            await tracksRepository.assignTemplateToTrack(targetTrackId, t.templateId);
          } catch (err) {
            console.error("Assign template error:", err);
          }
        }
      }

      setIsSaving(false);
      setIsPublished(targetPublishStatus);
      const okMsg = targetPublishStatus
        ? "ĐÃ LƯU & MỞ ĐĂNG KÝ CUỘC THI THÀNH CÔNG!"
        : "ĐÃ LƯU DỮ LIỆU SỰ KIỆN DƯỚI DẠNG BẢN NHÁP THÀNH CÔNG!";
      setSaveMessage({ text: okMsg, isError: false });
      toast.success(okMsg);
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setIsSaving(false);
      const rawMsg = err?.response?.data?.message || err?.message || "Lỗi khi lưu cấu hình sự kiện.";
      setSaveMessage({ text: rawMsg, isError: true });
      toast.error(rawMsg);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs text-[var(--text-primary)]">
      {/* 1. TOP HEADER & PROGRESS SUMMARY */}
      <div className="bg-[var(--bg-panel)] border border-[var(--border-muted)] p-5 hud-clipped flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 ${isPublished ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span className="text-[10px] text-[#c084fc] font-bold tracking-widest uppercase">
              CẤU HÌNH CUỘC THI • [{isPublished ? "ĐANG MỞ ĐĂNG KÝ (OPEN)" : "BẢN NHÁP (DRAFT)"}]
            </span>
          </div>
          <div className="text-base font-bold text-white uppercase tracking-wider">
            {eventName || "SỰ KIỆN CHƯA ĐẶT TÊN"} ({season} {year})
          </div>
        </div>

        <div className="text-left md:text-right space-y-1.5">
          <div className="text-[11px] font-mono text-zinc-400">
            TIẾN ĐỘ THIẾT LẬP: <span className="text-white font-bold">{progressPercent}%</span> ({completedStepsCount}/3 BƯỚC HOÀN TẤT)
          </div>
          <div>
            <span className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase hud-clipped inline-block ${
              progressPercent === 100
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
            }`}>
              {progressPercent === 100 ? "[SẴN SÀNG MỞ ĐĂNG KÝ]" : "[CẦN BỔ SUNG DỮ LIỆU]"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. FULL-WIDTH 3-COLUMN STEPPER TAB BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
        {/* Tab 1: Thông Tin Chung */}
        <button
          type="button"
          onClick={() => setActiveSubSection("general")}
          className={`p-4 border transition-all cursor-pointer hud-clipped flex flex-col justify-between gap-2.5 text-left ${
            activeSubSection === "general"
              ? "bg-[#a855f7] border-[#c084fc] text-white shadow-lg shadow-[#a855f7]/25"
              : "bg-[var(--bg-panel)] border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold tracking-wider uppercase ${
              activeSubSection === "general" ? "text-purple-200" : "text-zinc-500"
            }`}>
              PHÂN KHU 01
            </span>
            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase hud-clipped ${
              activeSubSection === "general"
                ? isGeneralComplete
                  ? "bg-black/40 text-emerald-300 border border-emerald-400/50"
                  : "bg-black/40 text-amber-300 border border-amber-400/50"
                : isGeneralComplete
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
            }`}>
              {isGeneralComplete ? "● HOÀN TẤT" : "○ THIẾU DỮ LIỆU"}
            </span>
          </div>
          <div className="font-bold text-xs uppercase tracking-wide">
            01. THÔNG TIN CHUNG
          </div>
        </button>

        {/* Tab 2: Vòng Thi */}
        <button
          type="button"
          onClick={() => setActiveSubSection("rounds")}
          className={`p-4 border transition-all cursor-pointer hud-clipped flex flex-col justify-between gap-2.5 text-left ${
            activeSubSection === "rounds"
              ? "bg-[#a855f7] border-[#c084fc] text-white shadow-lg shadow-[#a855f7]/25"
              : "bg-[var(--bg-panel)] border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold tracking-wider uppercase ${
              activeSubSection === "rounds" ? "text-purple-200" : "text-zinc-500"
            }`}>
              PHÂN KHU 02
            </span>
            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase hud-clipped ${
              activeSubSection === "rounds"
                ? isRoundsComplete
                  ? "bg-black/40 text-emerald-300 border border-emerald-400/50"
                  : "bg-black/40 text-amber-300 border border-amber-400/50"
                : isRoundsComplete
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
            }`}>
              {isRoundsComplete ? "● HOÀN TẤT" : "○ CHƯA CẤU HÌNH"}
            </span>
          </div>
          <div className="font-bold text-xs uppercase tracking-wide">
            02. VÒNG THI ({rounds.length})
          </div>
        </button>

        {/* Tab 3: Hạng Mục & Rubric */}
        <button
          type="button"
          onClick={() => setActiveSubSection("tracks")}
          className={`p-4 border transition-all cursor-pointer hud-clipped flex flex-col justify-between gap-2.5 text-left ${
            activeSubSection === "tracks"
              ? "bg-[#a855f7] border-[#c084fc] text-white shadow-lg shadow-[#a855f7]/25"
              : "bg-[var(--bg-panel)] border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold tracking-wider uppercase ${
              activeSubSection === "tracks" ? "text-purple-200" : "text-zinc-500"
            }`}>
              PHÂN KHU 03
            </span>
            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase hud-clipped ${
              activeSubSection === "tracks"
                ? isTracksComplete
                  ? "bg-black/40 text-emerald-300 border border-emerald-400/50"
                  : "bg-black/40 text-amber-300 border border-amber-400/50"
                : isTracksComplete
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
            }`}>
              {isTracksComplete
                ? `● ${assignedTracksRubricsCount}/${tracks.length} ĐÃ GÁN`
                : `○ ${assignedTracksRubricsCount}/${tracks.length} ĐÃ GÁN`}
            </span>
          </div>
          <div className="font-bold text-xs uppercase tracking-wide">
            03. HẠNG MỤC ({tracks.length})
          </div>
        </button>
      </div>

      {activeSubSection === "general" && (
        <Card className="p-6 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
            <div>
              <h3 className="font-display font-bold text-base text-white uppercase tracking-wider">
                THÔNG TIN TỔNG QUAN CUỘC THI
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
                Thiết lập thông tin nhận diện, quy mô đội thi và các khung thời gian chính thức của sự kiện.
              </p>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase hud-clipped ${
              isGeneralComplete
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40"
                : "bg-amber-500/15 text-amber-400 border border-amber-500/40"
            }`}>
              {isGeneralComplete ? "TRẠNG THÁI: [ĐÃ ĐIỀN ĐỦ THÔNG TIN]" : "TRẠNG THÁI: [CẦN BỔ SUNG DỮ LIỆU]"}
            </span>
          </div>

          {/* Section 1: NHẬN DIỆN & QUY MÔ SỰ KIỆN */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-[#c084fc] uppercase tracking-wider border-b border-zinc-800 pb-1.5 flex items-center justify-between">
              <span>[01] THÔNG TIN NHẬN DIỆN & QUY MÔ SỰ KIỆN</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Cột trái: Tên sự kiện (6 cols) */}
              <div className="md:col-span-6 space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase block">
                  Tên Sự Kiện / Cuộc Thi *
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="VD: FPT TECH HACKATHON 2026"
                  className="w-full h-10 px-3 py-2 bg-[var(--bg-input)] border border-zinc-700 text-white font-bold text-xs focus:border-[#a855f7] focus:outline-none"
                />
              </div>

              {/* Cột phải: Mùa giải & Năm tổ chức (6 cols chia đôi) */}
              <div className="md:col-span-6 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block">
                    Mùa Giải (Season) *
                  </label>
                  <select
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    className="w-full h-10 px-3 py-2 bg-[var(--bg-input)] border border-zinc-700 text-white text-xs focus:border-[#a855f7] focus:outline-none cursor-pointer"
                  >
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Fall">Fall</option>
                    <option value="Winter">Winter</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block">
                    Năm Tổ Chức *
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full h-10 px-3 py-2 bg-[var(--bg-input)] border border-zinc-700 text-white text-xs font-mono focus:border-[#a855f7] focus:outline-none"
                  />
                </div>
              </div>

              {/* Hàng 2: Giới hạn đội (6 cols) & Trạng thái công bố (6 cols) */}
              <div className="md:col-span-6 space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase block">
                  Giới Hạn Số Lượng Đội (Max Teams) *
                </label>
                <input
                  type="number"
                  value={maxTeams}
                  onChange={(e) => setMaxTeams(Number(e.target.value))}
                  className="w-full h-10 px-3 py-2 bg-[var(--bg-input)] border border-zinc-700 text-white text-xs font-mono focus:border-[#a855f7] focus:outline-none"
                />
              </div>

              <div className="md:col-span-6 space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase block">
                  Trạng Thái Công Bố Sự Kiện
                </label>
                <div className="w-full h-10 px-3 py-2 bg-[var(--bg-input)] border border-zinc-700 flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-mono text-xs truncate">
                    {isPublished ? "SỰ KIỆN ĐANG MỞ CÔNG KHAI (OPEN)" : "SỰ KIỆN ĐANG Ở BẢN NHÁP NỘI BỘ (DRAFT)"}
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase hud-clipped shrink-0 ${
                    isPublished ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  }`}>
                    {isPublished ? "OPEN" : "DRAFT"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: KHUNG THỜI GIAN CHÍNH THỨC */}
          <div className="space-y-3 pt-2">
            <div className="text-[11px] font-bold text-[#c084fc] uppercase tracking-wider border-b border-zinc-800 pb-1.5">
              <span>[02] CÁC MỐC THỜI GIAN QUAN TRỌNG</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Khối Cổng đăng ký (6 cols) */}
              <div className="md:col-span-6 p-4 bg-[var(--bg-input)]/50 border border-zinc-800 space-y-3 hud-clipped">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                  <span>CỔNG ĐĂNG KÝ THÍ SINH</span>
                  <span className="text-[9px] text-zinc-500 font-mono">GIAI ĐOẠN 01</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase block">
                      Mở Cổng Đăng Ký *
                    </label>
                    <input
                      type="datetime-local"
                      value={registrationStartDate}
                      onChange={(e) => setRegistrationStartDate(e.target.value)}
                      className="w-full h-10 px-3 py-2 bg-[var(--bg-input)] border border-zinc-700 text-white text-xs focus:border-[#a855f7] focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase block">
                      Đóng Cổng Đăng Ký *
                    </label>
                    <input
                      type="datetime-local"
                      value={registrationEndDate}
                      onChange={(e) => setRegistrationEndDate(e.target.value)}
                      className="w-full h-10 px-3 py-2 bg-[var(--bg-input)] border border-zinc-700 text-white text-xs focus:border-[#a855f7] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Khối Thời gian sự kiện (6 cols) */}
              <div className="md:col-span-6 p-4 bg-[var(--bg-input)]/50 border border-zinc-800 space-y-3 hud-clipped">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                  <span>THỜI GIAN DIỄN RA CUỘC THI</span>
                  <span className="text-[9px] text-zinc-500 font-mono">GIAI ĐOẠN 02</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase block">
                      Bắt Đầu Sự Kiện *
                    </label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-10 px-3 py-2 bg-[var(--bg-input)] border border-zinc-700 text-white text-xs focus:border-[#a855f7] focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase block">
                      Kết Thúc Sự Kiện *
                    </label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-10 px-3 py-2 bg-[var(--bg-input)] border border-zinc-700 text-white text-xs focus:border-[#a855f7] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: THỂ LỆ & GIỚI THIỆU */}
          <div className="space-y-1 pt-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase block">
              Mô Tả Thể Lệ &amp; Giới Thiệu Cuộc Thi
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập thể lệ cuộc thi, đối tượng tham gia, quyền lợi của thí sinh..."
              className="w-full p-3 bg-[var(--bg-input)] border border-zinc-700 text-white text-xs focus:border-[#a855f7] focus:outline-none font-sans leading-relaxed"
            />
          </div>
        </Card>
      )}

      {activeSubSection === "rounds" && (
        <Card className="p-6 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-muted)] pb-3">
            <div>
              <h3 className="font-display font-bold text-base text-white uppercase tracking-wider">
                THIẾT LẬP VÒNG THI &amp; THỜI HẠN NỘP BÀI ({rounds.length} VÒNG)
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
                Cấu hình từng vòng thi, thiết lập 3 mốc thời gian (Nộp bài, Chấm thi, Phúc khảo) và sản phẩm nộp bắt buộc.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddRound}
              className="px-3 py-2 bg-[#a855f7]/15 border border-[#a855f7] text-[#c084fc] hover:bg-[#a855f7] hover:text-white font-bold uppercase hud-clipped transition-all cursor-pointer"
            >
              <span>+ THÊM VÒNG THI MỚI</span>
            </button>
          </div>

          {isLoadingRounds ? (
            <div className="py-12 text-center text-xs text-zinc-500">Đang tải cấu hình vòng thi...</div>
          ) : rounds.length === 0 ? (
            <div className="p-8 text-center border border-zinc-800 bg-[var(--bg-input)] text-zinc-400">
              Chưa có vòng thi nào. Bấm "+ THÊM VÒNG THI MỚI" để thiết lập vòng thi đầu tiên.
            </div>
          ) : (
            <div className="space-y-6">
              {rounds.map((r, idx) => (
                <div
                  key={r.id || `round-${idx}`}
                  className="p-5 bg-[var(--bg-input)] border border-zinc-800 hud-clipped space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-[#090e11] border border-zinc-700 text-[#c084fc] flex items-center justify-center font-bold text-xs hud-clipped">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={r.roundName}
                        onChange={(e) => handleRoundChange(idx, "roundName", e.target.value)}
                        placeholder={`Tên Vòng Thi Số ${idx + 1}`}
                        className="px-3 py-1 bg-[#090e11] border border-zinc-700 text-white font-bold text-sm uppercase focus:border-[#a855f7] focus:outline-none min-w-[280px]"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      {rounds.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRound(idx)}
                          className="text-red-400 hover:text-red-300 font-mono text-xs cursor-pointer uppercase"
                        >
                          [XÓA VÒNG THI]
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#090e11] p-4 border border-zinc-800 hud-clipped">
                    <div className="space-y-2 border-r border-zinc-800/60 pr-2">
                      <div className="text-[11px] font-bold text-sky-400 uppercase">
                        1. MỐC THỜI HẠN NỘP BÀI
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 uppercase block">Mở nộp bài:</label>
                        <input
                          type="datetime-local"
                          value={r.startDate}
                          onChange={(e) => handleRoundChange(idx, "startDate", e.target.value)}
                          className="w-full p-2 bg-[#141f23] border border-zinc-700 text-white text-xs font-mono"
                        />
                        <label className="text-[10px] text-zinc-400 uppercase block mt-1">Hạn chót nộp:</label>
                        <input
                          type="datetime-local"
                          value={r.endDate}
                          onChange={(e) => handleRoundChange(idx, "endDate", e.target.value)}
                          className="w-full p-2 bg-[#141f23] border border-zinc-700 text-white text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 border-r border-zinc-800/60 pr-2">
                      <div className="text-[11px] font-bold text-amber-400 uppercase">
                        2. MỐC CHẤM ĐIỂM GIÁM KHẢO
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 uppercase block">Bắt đầu chấm:</label>
                        <input
                          type="datetime-local"
                          value={r.scoringStartDate}
                          onChange={(e) => handleRoundChange(idx, "scoringStartDate", e.target.value)}
                          className="w-full p-2 bg-[#141f23] border border-zinc-700 text-white text-xs font-mono"
                        />
                        <label className="text-[10px] text-zinc-400 uppercase block mt-1">Kết thúc chấm:</label>
                        <input
                          type="datetime-local"
                          value={r.scoringEndDate}
                          onChange={(e) => handleRoundChange(idx, "scoringEndDate", e.target.value)}
                          className="w-full p-2 bg-[#141f23] border border-zinc-700 text-white text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-purple-400 uppercase">
                        3. MỐC TIẾP NHẬN PHÚC KHẢO
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 uppercase block">Mở phúc khảo:</label>
                        <input
                          type="datetime-local"
                          value={r.appealStartDate}
                          onChange={(e) => handleRoundChange(idx, "appealStartDate", e.target.value)}
                          className="w-full p-2 bg-[#141f23] border border-zinc-700 text-white text-xs font-mono"
                        />
                        <label className="text-[10px] text-zinc-400 uppercase block mt-1">Đóng phúc khảo:</label>
                        <input
                          type="datetime-local"
                          value={r.appealEndDate}
                          onChange={(e) => handleRoundChange(idx, "appealEndDate", e.target.value)}
                          className="w-full p-2 bg-[#141f23] border border-zinc-700 text-white text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-[#090e11] p-3.5 border border-zinc-800 hud-clipped">
                    <div className="md:col-span-4">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                        QUY TẮC ĐI TIẾP VÒNG TRONG (ADVANCEMENT)
                      </label>
                      <select
                        value={r.advancementRuleType}
                        onChange={(e) => handleRoundChange(idx, "advancementRuleType", e.target.value)}
                        className="w-full p-2 bg-[#141f23] border border-zinc-700 text-white text-xs"
                      >
                        <option value="none">Không giới hạn (Toàn bộ đội thi)</option>
                        <option value="top">Top N đội có điểm cao nhất (Ví dụ: Top 10)</option>
                        <option value="percent">Top % đội điểm cao nhất (Ví dụ: 30%)</option>
                        <option value="minScore">Điểm sàn tối thiểu (Ví dụ: &gt;= 7.0)</option>
                      </select>
                    </div>

                    {r.advancementRuleType !== "none" && (
                      <div className="md:col-span-3">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                          GIÁ TRỊ CẤU HÌNH
                        </label>
                        <input
                          type="text"
                          value={r.advancementRuleValue}
                          onChange={(e) => handleRoundChange(idx, "advancementRuleValue", e.target.value)}
                          placeholder={r.advancementRuleType === "top" ? "10" : r.advancementRuleType === "percent" ? "30" : "7.0"}
                          className="w-full p-2 bg-[#141f23] border border-zinc-700 text-white text-xs font-mono"
                        />
                      </div>
                    )}

                    <div className="md:col-span-5 text-[11px] text-zinc-400 font-sans">
                      {r.advancementRuleType === "top" && `Hệ thống sẽ tự động lọc ${r.advancementRuleValue || "N"} đội đứng đầu bảng điểm đi tiếp.`}
                      {r.advancementRuleType === "percent" && `Hệ thống sẽ lấy ${r.advancementRuleValue || "N"}% số đội có điểm cao nhất đi tiếp.`}
                      {r.advancementRuleType === "minScore" && `Chỉ những đội đạt từ ${r.advancementRuleValue || "N"} điểm trở lên mới được đi tiếp.`}
                      {r.advancementRuleType === "none" && "Tất cả các đội nộp bài đều được vào danh sách xét duyệt vòng sau."}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase block">
                      YÊU CẦU NỘP BÀI (DELIVERABLES BẮT BUỘC)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {AVAILABLE_DELIVERABLES.map((deliv) => {
                        const isSelected = (r.requiredDeliverables || []).includes(deliv.key);
                        return (
                          <button
                            key={deliv.key}
                            type="button"
                            onClick={() => handleToggleDeliverable(idx, deliv.key)}
                            className={`p-2.5 text-left border font-mono text-[11px] uppercase transition-all hud-clipped cursor-pointer ${
                              isSelected
                                ? "bg-[#a855f7]/20 border-[#a855f7] text-[#c084fc] font-bold"
                                : "bg-[#090e11] border-zinc-800 text-zinc-400 hover:text-white"
                            }`}
                          >
                            <span className="font-bold mr-1.5">{isSelected ? "[X]" : "[ ]"}</span>
                            <span>{deliv.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeSubSection === "tracks" && (
        <Card className="p-6 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-muted)] pb-3">
            <div>
              <h3 className="font-display font-bold text-base text-white uppercase tracking-wider">
                QUẢN LÝ BẢNG ĐẤU &amp; GÁN TIÊU CHÍ RUBRIC ({tracks.length} HẠNG MỤC)
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
                Thiết lập các Hạng mục chuyên môn và liên kết Bộ tiêu chí (Rubric Template) tương ứng cho từng bảng thi.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddTrack}
              className="px-3 py-2 bg-[#a855f7]/15 border border-[#a855f7] text-[#c084fc] hover:bg-[#a855f7] hover:text-white font-bold uppercase hud-clipped transition-all cursor-pointer"
            >
              <span>+ THÊM HẠNG MỤC MỚI</span>
            </button>
          </div>

          {isLoadingTracks ? (
            <div className="py-12 text-center text-xs text-zinc-500">Đang tải danh sách hạng mục...</div>
          ) : tracks.length === 0 ? (
            <div className="p-8 text-center border border-zinc-800 bg-[var(--bg-input)] text-zinc-400">
              Chưa có hạng mục thi đấu nào. Bấm "+ THÊM HẠNG MỤC MỚI" để tạo mới.
            </div>
          ) : (
            <div className="space-y-4">
              {tracks.map((t, idx) => {
                const matchedTemplate = templatesList.find(
                  (tpl) => (tpl.id || (tpl as any).Id || (tpl as any).templateId || (tpl as any).TemplateId) === t.templateId
                );
                const criterias = matchedTemplate?.criterias || (matchedTemplate as any)?.TemplateCriterias || [];
                const totalWeight = criterias.reduce((sum: number, c: any) => sum + (c.weight ?? c.Weight ?? 0), 0);
                const isExpanded = Boolean(expandedTrackRubrics[idx]);

                return (
                  <div
                    key={t.id || `track-${idx}`}
                    className="p-5 bg-[var(--bg-input)] border border-zinc-800 hud-clipped space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-[#090e11] border border-zinc-700 text-[#c084fc] flex items-center justify-center font-bold text-xs hud-clipped">
                          T{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={t.trackName}
                          onChange={(e) => handleTrackChange(idx, "trackName", e.target.value)}
                          placeholder={`Tên Hạng mục ${idx + 1}`}
                          className="px-3 py-1 bg-[#090e11] border border-zinc-700 text-white font-bold text-sm uppercase focus:border-[#a855f7] focus:outline-none min-w-[280px]"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        {tracks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTrack(idx)}
                            className="text-red-400 hover:text-red-300 font-mono text-xs cursor-pointer uppercase"
                          >
                            [XÓA HẠNG MỤC]
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase block">
                        Mô Tả Yêu Cầu Chuyên Môn &amp; Thể Lệ Track
                      </label>
                      <input
                        type="text"
                        value={t.description || ""}
                        onChange={(e) => handleTrackChange(idx, "description", e.target.value)}
                        placeholder="Mô tả công nghệ hoặc phạm vi dự thi của track này..."
                        className="w-full p-2 bg-[#090e11] border border-zinc-700 text-white text-xs focus:border-[#a855f7] focus:outline-none"
                      />
                    </div>

                    <div className="pt-3 border-t border-zinc-800 space-y-3 bg-[#090e11]/60 p-4 border border-zinc-800/80 hud-clipped">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase text-[#c084fc] tracking-wider">
                            BỘ TIÊU CHÍ CHẤM ĐIỂM (RUBRIC TEMPLATE)
                          </span>
                          {matchedTemplate ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold hud-clipped">
                              [ĐÃ GÁN TIÊU CHÍ]
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/40 text-amber-400 font-mono text-[10px] font-bold hud-clipped">
                              [CHƯA GÁN TIÊU CHÍ]
                            </span>
                          )}
                        </div>

                        {matchedTemplate && (
                          <button
                            type="button"
                            onClick={() => toggleExpandRubric(idx)}
                            className="px-3 py-1 bg-[#141f23] border border-zinc-700 hover:border-[#a855f7] text-[#c084fc] font-mono text-[11px] font-bold uppercase hud-clipped transition-all cursor-pointer"
                          >
                            {isExpanded ? (
                              <span>[ẨN BẢNG TIÊU CHÍ ▲]</span>
                            ) : (
                              <span>[XEM CHI TIẾT: {criterias.length} TIÊU CHÍ • {totalWeight}% ▼]</span>
                            )}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-8">
                          <select
                            value={t.templateId || ""}
                            onChange={(e) => handleTrackChange(idx, "templateId", e.target.value || null)}
                            className="w-full p-2.5 bg-[#141f23] border border-zinc-700 text-[#e1e7ec] font-mono font-bold text-xs focus:border-[#a855f7] focus:outline-none cursor-pointer hud-clipped"
                          >
                            <option value="" className="text-zinc-500">
                              -- Chọn Bộ Tiêu Chí Chấm Thi Áp Dụng Cho Hạng Mục Này ({templatesList.length} mẫu có sẵn) --
                            </option>
                            {templatesList.map((tpl: any) => {
                              const tplId = tpl.id || tpl.Id || tpl.templateId || tpl.TemplateId;
                              const tplName = tpl.name || tpl.Name || tpl.templateName || tpl.TemplateName || "Mẫu Rubric";
                              const crits = tpl.criterias || tpl.TemplateCriterias || [];
                              const tplWeight = crits.reduce((sum: number, c: any) => sum + (c.weight ?? c.Weight ?? 0), 0);
                              return (
                                <option key={tplId} value={tplId} className="bg-[#0f171c] text-white">
                                  {tplName} ({crits.length} tiêu chí • Trọng số {tplWeight || 100}%)
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="md:col-span-4 text-right">
                          <Link
                            href="/coordinator/templates"
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-[#c084fc] transition-colors"
                          >
                            <span>[KHO TIÊU CHÍ MẪU (MODULE 04) -&gt;]</span>
                          </Link>
                        </div>
                      </div>

                      {isExpanded && matchedTemplate && (
                        <div className="mt-3 p-4 bg-[#0f171c] border border-zinc-700 hud-clipped space-y-3">
                          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                            <div>
                              <span className="font-bold text-xs text-white">
                                BẢNG TIÊU CHÍ: {matchedTemplate.templateName || (matchedTemplate as any).Name}
                              </span>
                              {matchedTemplate.description && (
                                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                                  {matchedTemplate.description}
                                </p>
                              )}
                            </div>
                            <span className="font-mono text-xs text-[#c084fc] font-bold">
                              TỔNG TRỌNG SỐ: {totalWeight}%
                            </span>
                          </div>

                          {criterias.length === 0 ? (
                            <div className="py-4 text-center text-xs text-zinc-500 font-mono">
                              Bộ tiêu chí này hiện chưa có tiêu chí con nào.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left font-mono text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-zinc-800 bg-[#141f23] text-zinc-400 uppercase text-[10px]">
                                    <th className="p-2.5 w-12 text-center">STT</th>
                                    <th className="p-2.5">Tiêu Chí Đánh Giá</th>
                                    <th className="p-2.5">Mô Tả / Hướng Dẫn Giám Khảo</th>
                                    <th className="p-2.5 text-center w-28">Trọng Số (%)</th>
                                    <th className="p-2.5 text-center w-28">Điểm Tối Đa</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/60">
                                  {criterias.map((crit: any, cIdx: number) => {
                                    const cName = crit.criteriaName || crit.CriteriaName || crit.name || crit.Name || `Tiêu chí ${cIdx + 1}`;
                                    const cDesc = crit.description || crit.Description || "Đánh giá chất lượng chuyên môn";
                                    const cWeight = crit.weight ?? crit.Weight ?? 0;
                                    const cMaxScore = crit.maxScore ?? crit.MaxScore ?? 10;

                                    return (
                                      <tr key={crit.criteriaId || crit.id || `crit-${cIdx}`} className="hover:bg-zinc-900/40">
                                        <td className="p-2.5 text-center text-zinc-500 font-bold">
                                          {cIdx + 1}
                                        </td>
                                        <td className="p-2.5 font-bold text-white">
                                          {cName}
                                        </td>
                                        <td className="p-2.5 text-[11px] font-sans text-zinc-300">
                                          {cDesc}
                                        </td>
                                        <td className="p-2.5 text-center font-bold text-[#c084fc]">
                                          {cWeight}%
                                        </td>
                                        <td className="p-2.5 text-center text-zinc-400">
                                          {cMaxScore} pts
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {saveMessage && (
        <div
          className={`p-4 font-mono text-xs border hud-clipped flex items-center gap-2.5 ${
            saveMessage.isError
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          }`}
        >
          <span>{saveMessage.isError ? "[LỖI]" : "[THÀNH CÔNG]"}</span>
          <span>{saveMessage.text}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped">
        <div className="text-[11px] text-[var(--text-muted)] font-mono">
          [LƯU Ý: MỌI THAY ĐỔI VỀ VÒNG THI VÀ HẠNG MỤC SẼ CÓ HIỆU LỰC TRỰC TIẾP CHO TOÀN BỘ THÍ SINH VÀ GIÁM KHẢO]
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveAll(false)}
            className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-bold uppercase tracking-wider hud-clipped transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{isSaving ? "ĐANG LƯU..." : "[LƯU BẢN NHÁP]"}</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              if (unassignedTracks.length > 0) {
                setShowGuardClauseModal(true);
              } else {
                handleSaveAll(true);
              }
            }}
            className="px-6 py-2.5 bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold uppercase tracking-wider hud-clipped transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-[#a855f7]/30"
          >
            <span>{isSaving ? "ĐANG LƯU DỮ LIỆU..." : "[LƯU & MỞ ĐĂNG KÝ CUỘC THI]"}</span>
          </button>
        </div>
      </div>

      {/* EC GUARD CLAUSE MODAL */}
      {showGuardClauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f171c] border border-amber-500/40 p-6 max-w-lg w-full space-y-4 hud-clipped shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400" />
                <span className="font-bold text-sm text-white uppercase tracking-wider">
                  CẢNH BÁO: CHƯA GÁN BỘ TIÊU CHÍ (RUBRIC)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowGuardClauseModal(false)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer font-bold"
              >
                [X]
              </button>
            </div>

            <div className="text-xs text-zinc-300 font-sans space-y-2">
              <p>
                Hiện tại có <span className="text-amber-400 font-bold font-mono">{unassignedTracks.length}/{tracks.length}</span> Hạng mục (Track) chưa được liên kết Bộ tiêu chí chấm điểm:
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto p-2.5 bg-[#141f23] border border-zinc-800 hud-clipped font-mono text-[11px]">
                {unassignedTracks.map((t, idx) => (
                  <div key={t.id || idx} className="text-amber-300/90 flex items-center justify-between">
                    <span>• {t.trackName || `Hạng mục ${idx + 1}`}</span>
                    <span className="text-zinc-500 text-[10px]">[CHƯA GÁN RUBRIC]</span>
                  </div>
                ))}
              </div>
              <p className="text-zinc-400 text-[11px] mt-2">
                Nếu mở đăng ký khi chưa gán Rubric, Giám khảo sẽ không thể thực hiện chấm điểm bài thi của các hạng mục này.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setShowGuardClauseModal(false);
                  handleSaveAll(false);
                }}
                className="px-4 py-2 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-bold uppercase text-xs hud-clipped transition-all cursor-pointer"
              >
                [LƯU BẢN NHÁP TẠM THỜI]
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowGuardClauseModal(false);
                  setActiveSubSection("tracks");
                }}
                className="px-4 py-2 bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold uppercase text-xs hud-clipped transition-all cursor-pointer shadow-md shadow-[#a855f7]/30"
              >
                [ĐẾN HẠNG MỤC ĐỂ GÁN RUBRIC]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
