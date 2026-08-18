"use client";

import React, { useState, useEffect } from "react";
import { eventsRepository } from "@/repositories/eventsRepository";
import { roundsRepository } from "@/repositories/roundsRepository";
import { tracksRepository, type Track } from "@/repositories/events/tracksRepository";
import { templatesRepository, type Template } from "@/repositories/events/templatesRepository";
import { useToast } from "@/providers/ToastProvider";
import { Link } from "@/i18n/routing";
import { 
  Calendar, 
  Layers, 
  Target, 
  Save, 
  PlusCircle, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Clock, 
  FileCode, 
  Globe, 
  FileSpreadsheet, 
  Video, 
  BookOpen, 
  Palette, 
  Sparkles,
  Eye,
  EyeOff
} from "lucide-react";
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
  { key: "github", label: "MÃ NGUỒN GITHUB / GITLAB", icon: FileCode },
  { key: "deployed_url", label: "LIVE DEMO URL", icon: Globe },
  { key: "slides", label: "SLIDE THUYẾT TRÌNH (PDF/SLIDES)", icon: FileSpreadsheet },
  { key: "demo_video", label: "VIDEO DEMO (YOUTUBE / DRIVE)", icon: Video },
  { key: "report", label: "BÁO CÁO KIẾN TRÚC (PDF/DOC)", icon: BookOpen },
  { key: "figma", label: "LINK FIGMA PROTOTYPE", icon: Palette },
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

  // 1. Event General State
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

  // 2. Rounds State
  const [rounds, setRounds] = useState<RoundEditState[]>([]);
  const [deletedRoundIds, setDeletedRoundIds] = useState<string[]>([]);
  const [isLoadingRounds, setIsLoadingRounds] = useState<boolean>(true);

  // 3. Tracks State
  const [tracks, setTracks] = useState<TrackEditState[]>([]);
  const [deletedTrackIds, setDeletedTrackIds] = useState<string[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(true);

  // 4. Rubric Templates State (for inline assignment)
  const [templatesList, setTemplatesList] = useState<Template[]>([]);
  const [expandedTrackRubrics, setExpandedTrackRubrics] = useState<Record<number, boolean>>({});

  // Status
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Load Rubric Templates list once on mount
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

  // Sync event props when changed
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

  // Load Rounds & Tracks from DB
  useEffect(() => {
    if (!eventId) return;
    let isMounted = true;
    setIsLoadingRounds(true);
    setIsLoadingTracks(true);

    // 1. Rounds
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

    // 2. Tracks
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

  // Round Handlers
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
    if (target?.id && !target.id.startsWith("temp-")) {
      setDeletedRoundIds([...deletedRoundIds, target.id]);
    }
    setRounds(rounds.filter((_, i) => i !== index));
  };

  const handleRoundChange = (index: number, field: keyof RoundEditState, value: any) => {
    const updated = [...rounds];
    updated[index] = { ...updated[index], [field]: value };
    setRounds(updated);
  };

  const toggleDeliverable = (roundIndex: number, deliverableKey: string) => {
    const r = rounds[roundIndex];
    const current = r.requiredDeliverables || [];
    const updatedDeliverables = current.includes(deliverableKey)
      ? current.filter((k) => k !== deliverableKey)
      : [...current, deliverableKey];
    handleRoundChange(roundIndex, "requiredDeliverables", updatedDeliverables);
  };

  // Track Handlers
  const handleAddTrack = () => {
    setTracks([
      ...tracks,
      {
        id: `temp-track-${Date.now()}`,
        isNew: true,
        trackName: `HẠNG MỤC MỚI ${tracks.length + 1}`,
        description: "",
        submissionRuleDescription: "",
      },
    ]);
  };

  const handleRemoveTrack = (index: number) => {
    const target = tracks[index];
    if (target?.id && !target.id.startsWith("temp-")) {
      setDeletedTrackIds([...deletedTrackIds, target.id]);
    }
    setTracks(tracks.filter((_, i) => i !== index));
  };

  const handleTrackChange = (index: number, field: keyof TrackEditState, value: any) => {
    const updated = [...tracks];
    updated[index] = { ...updated[index], [field]: value };
    setTracks(updated);
  };

  // Save All
  const handleSaveAll = async (targetPublishStatus: boolean) => {
    if (!eventName.trim()) {
      const msg = "Vui lòng nhập Tên sự kiện!";
      setSaveMessage({ text: msg, isError: true });
      toast.error(msg);
      return;
    }

    const evStart = startDate ? new Date(startDate) : new Date();
    const evEnd = endDate ? new Date(endDate) : new Date();
    if (evStart >= evEnd) {
      const msg = "Ngày bắt đầu sự kiện phải trước ngày kết thúc sự kiện!";
      setSaveMessage({ text: msg, isError: true });
      toast.error(msg);
      return;
    }

    for (let i = 0; i < rounds.length; i++) {
      const r = rounds[i];
      const rName = r.roundName.trim() || `Vòng ${i + 1}`;
      const rStart = r.startDate ? new Date(r.startDate) : evStart;
      const rEnd = r.endDate ? new Date(r.endDate) : evEnd;

      if (rStart >= rEnd) {
        const msg = `[${rName}]: Ngày bắt đầu nộp bài phải trước hạn chót nộp bài!`;
        setSaveMessage({ text: msg, isError: true });
        toast.error(msg);
        return;
      }

      if (rStart < evStart || rEnd > evEnd) {
        const msg = `[${rName}]: Thời gian nộp bài phải nằm trong khoảng sự kiện (${toDateTimeLocal(startDate)} - ${toDateTimeLocal(endDate)})!`;
        setSaveMessage({ text: msg, isError: true });
        toast.error(msg);
        return;
      }
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // 1. Update Event
      await eventsRepository.updateEvent(eventId, {
        eventName: eventName.trim(),
        season: season.trim(),
        year: Number(year),
        maxTeams: Number(maxTeams) || 50,
        description: description.trim(),
        startDate: evStart.toISOString(),
        endDate: evEnd.toISOString(),
        registrationStartDate: registrationStartDate ? new Date(registrationStartDate).toISOString() : undefined,
        registrationEndDate: registrationEndDate ? new Date(registrationEndDate).toISOString() : undefined,
        status: targetPublishStatus,
      });

      // 2. Delete removed rounds
      for (const delId of deletedRoundIds) {
        try { await roundsRepository.deleteRound(delId); } catch {}
      }

      // 3. Update or Create rounds
      for (let i = 0; i < rounds.length; i++) {
        const r = rounds[i];
        let rulePayload: string | undefined = undefined;
        if (r.advancementRuleType !== "none" && r.advancementRuleValue.trim()) {
          rulePayload = `${r.advancementRuleType}:${r.advancementRuleValue.trim()}`;
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

      // 4. Delete removed tracks
      for (const delTrackId of deletedTrackIds) {
        try { await tracksRepository.deleteTrack(delTrackId); } catch {}
      }

      // 5. Update or Create tracks & assign Rubric templates
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
        ? "ĐÃ LƯU & CÔNG KHAI THAY ĐỔI CẤU HÌNH SỰ KIỆN THÀNH CÔNG!"
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
      {/* Top Banner with Sub-Navigation */}
      <div className="bg-[var(--bg-panel)] border border-[var(--border-muted)] p-5 hud-clipped flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isPublished ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
            <span className="text-[10px] text-[#c084fc] font-bold tracking-widest uppercase">
              CẤU HÌNH CUỘC THI • [{isPublished ? "ĐANG CÔNG BỐ (OPEN)" : "BẢN NHÁP (DRAFT)"}]
            </span>
          </div>
          <h2 className="font-display font-bold text-lg text-white uppercase tracking-wider mt-1">
            {eventName || "SỰ KIỆN ĐANG QUẢN LÝ"}
          </h2>
        </div>

        {/* 3 Sub-Section Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-input)] border border-zinc-800 hud-clipped">
          <button
            type="button"
            onClick={() => setActiveSubSection("general")}
            className={`px-3 py-1.5 font-bold uppercase transition-all hud-clipped cursor-pointer flex items-center gap-1.5 ${
              activeSubSection === "general"
                ? "bg-[#a855f7] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>1. THÔNG TIN CHUNG</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubSection("rounds")}
            className={`px-3 py-1.5 font-bold uppercase transition-all hud-clipped cursor-pointer flex items-center gap-1.5 ${
              activeSubSection === "rounds"
                ? "bg-[#a855f7] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. VÒNG THI ({rounds.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubSection("tracks")}
            className={`px-3 py-1.5 font-bold uppercase transition-all hud-clipped cursor-pointer flex items-center gap-1.5 ${
              activeSubSection === "tracks"
                ? "bg-[#a855f7] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-white"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>3. HẠNG MỤC ({tracks.length})</span>
          </button>
        </div>
      </div>

      {/* SUB-SECTION 1: THÔNG TIN CHUNG */}
      {activeSubSection === "general" && (
        <Card className="p-6 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-6">
          <div className="border-b border-[var(--border-muted)] pb-3">
            <h3 className="font-display font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#c084fc]" />
              THÔNG TIN CỐT LÕI &amp; THỜI GIAN TỔ CHỨC
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
              Thiết lập tên cuộc thi, mùa giải, hạn đăng ký và thời gian diễn ra tổng thể.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)]">
                Tên Sự Kiện / Cuộc Thi *
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Ví dụ: SEAL HACKATHON 2026"
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-zinc-700 text-white font-bold focus:border-[#a855f7] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)]">
                Mùa Giải
              </label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-zinc-700 text-white focus:border-[#a855f7] focus:outline-none cursor-pointer"
              >
                <option value="Spring">Mùa Xuân (Spring)</option>
                <option value="Summer">Mùa Hè (Summer)</option>
                <option value="Fall">Mùa Thu (Fall)</option>
                <option value="Winter">Mùa Đông (Winter)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)]">
                Năm Tổ Chức &amp; Max Đội
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-zinc-700 text-white font-bold focus:border-[#a855f7] focus:outline-none text-center"
                />
                <input
                  type="number"
                  value={maxTeams}
                  onChange={(e) => setMaxTeams(Number(e.target.value))}
                  placeholder="Max đội"
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-zinc-700 text-white font-bold focus:border-[#a855f7] focus:outline-none text-center"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Cột 1: Thời Gian Đăng Ký */}
            <div className="p-4 bg-[var(--bg-input)] border border-zinc-800 hud-clipped space-y-3">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block border-b border-zinc-800 pb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                THỜI HẠN ĐĂNG KÝ THAM GIA
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">Mở Đăng Ký</label>
                  <input
                    type="datetime-local"
                    value={registrationStartDate}
                    onChange={(e) => setRegistrationStartDate(e.target.value)}
                    className="w-full p-2 bg-[#090e11] border border-zinc-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">Đóng Đăng Ký</label>
                  <input
                    type="datetime-local"
                    value={registrationEndDate}
                    onChange={(e) => setRegistrationEndDate(e.target.value)}
                    className="w-full p-2 bg-[#090e11] border border-zinc-700 text-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Cột 2: Thời Gian Diễn Ra Sự Kiện */}
            <div className="p-4 bg-[var(--bg-input)] border border-zinc-800 hud-clipped space-y-3">
              <span className="text-[10px] font-bold text-[#c084fc] uppercase tracking-wider block border-b border-zinc-800 pb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#c084fc]" />
                THỜI GIAN DIỄN RA SỰ KIỆN TỔNG THỂ
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">Bắt Đầu Sự Kiện</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 bg-[#090e11] border border-zinc-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">Kết Thúc Sự Kiện</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 bg-[#090e11] border border-zinc-700 text-white text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)]">
              Mô Tả Chi Tiết &amp; Thể Lệ Cuộc Thi
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giới thiệu mục tiêu, đối tượng tham gia, thể lệ..."
              className="w-full p-3 bg-[var(--bg-input)] border border-zinc-700 text-white font-sans text-xs focus:border-[#a855f7] focus:outline-none"
            />
          </div>
        </Card>
      )}

      {/* SUB-SECTION 2: CẤU HÌNH VÒNG THI */}
      {activeSubSection === "rounds" && (
        <Card className="p-6 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-muted)] pb-3">
            <div>
              <h3 className="font-display font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#c084fc]" />
                QUẢN LÝ VÒNG THI &amp; YÊU CẦU NỘP BÀI ({rounds.length} VÒNG)
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
                Thiết lập hạn nộp bài, thời gian chấm thi, phúc khảo và quy định nộp sản phẩm cho từng vòng.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddRound}
              className="px-3 py-2 bg-[#a855f7]/15 border border-[#a855f7] text-[#c084fc] hover:bg-[#a855f7] hover:text-white font-bold uppercase flex items-center gap-1.5 hud-clipped transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ THÊM VÒNG THI</span>
            </button>
          </div>

          {isLoadingRounds ? (
            <div className="py-12 text-center text-xs text-zinc-500">Đang tải danh sách vòng thi...</div>
          ) : rounds.length === 0 ? (
            <div className="p-8 text-center border border-zinc-800 bg-[var(--bg-input)] text-zinc-400">
              Chưa có vòng thi nào được cấu hình. Bấm "+ THÊM VÒNG THI" để bắt đầu.
            </div>
          ) : (
            <div className="space-y-6">
              {rounds.map((r, idx) => (
                <div
                  key={r.id || `round-${idx}`}
                  className="p-5 bg-[var(--bg-input)] border border-zinc-800 hud-clipped space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-[#a855f7] text-white flex items-center justify-center font-bold text-xs hud-clipped">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={r.roundName}
                        onChange={(e) => handleRoundChange(idx, "roundName", e.target.value)}
                        placeholder={`Tên Vòng ${idx + 1}`}
                        className="px-3 py-1 bg-[#090e11] border border-zinc-700 text-white font-bold text-sm uppercase focus:border-[#a855f7] focus:outline-none min-w-[280px]"
                      />
                    </div>

                    {rounds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRound(idx)}
                        className="text-red-400 hover:text-red-300 font-mono text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa Vòng
                      </button>
                    )}
                  </div>

                  {/* 3 Mốc Thời Gian: Nộp Bài - Chấm Điểm - Phúc Khảo */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-[11px]">
                    <div className="p-3 bg-[#090e11] border border-zinc-800 hud-clipped space-y-2">
                      <span className="text-[10px] font-bold text-amber-400 uppercase block flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 1. HẠN NỘP BÀI (SUBMISSION)
                      </span>
                      <div className="space-y-1.5">
                        <div>
                          <span className="text-[10px] text-zinc-500 block">Bắt đầu nộp</span>
                          <input
                            type="datetime-local"
                            value={r.startDate}
                            onChange={(e) => handleRoundChange(idx, "startDate", e.target.value)}
                            className="w-full p-1.5 bg-[#141f23] border border-zinc-700 text-white text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">Hạn chót nộp bài</span>
                          <input
                            type="datetime-local"
                            value={r.endDate}
                            onChange={(e) => handleRoundChange(idx, "endDate", e.target.value)}
                            className="w-full p-1.5 bg-[#141f23] border border-zinc-700 text-white text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-[#090e11] border border-zinc-800 hud-clipped space-y-2">
                      <span className="text-[10px] font-bold text-purple-400 uppercase block flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 2. CHẤM ĐIỂM (SCORING)
                      </span>
                      <div className="space-y-1.5">
                        <div>
                          <span className="text-[10px] text-zinc-500 block">Bắt đầu chấm</span>
                          <input
                            type="datetime-local"
                            value={r.scoringStartDate}
                            onChange={(e) => handleRoundChange(idx, "scoringStartDate", e.target.value)}
                            className="w-full p-1.5 bg-[#141f23] border border-zinc-700 text-white text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">Khóa bảng chấm</span>
                          <input
                            type="datetime-local"
                            value={r.scoringEndDate}
                            onChange={(e) => handleRoundChange(idx, "scoringEndDate", e.target.value)}
                            className="w-full p-1.5 bg-[#141f23] border border-zinc-700 text-white text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-[#090e11] border border-zinc-800 hud-clipped space-y-2">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase block flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 3. PHÚC KHẢO (APPEALS)
                      </span>
                      <div className="space-y-1.5">
                        <div>
                          <span className="text-[10px] text-zinc-500 block">Mở nhận phúc khảo</span>
                          <input
                            type="datetime-local"
                            value={r.appealStartDate}
                            onChange={(e) => handleRoundChange(idx, "appealStartDate", e.target.value)}
                            className="w-full p-1.5 bg-[#141f23] border border-zinc-700 text-white text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">Đóng phúc khảo</span>
                          <input
                            type="datetime-local"
                            value={r.appealEndDate}
                            onChange={(e) => handleRoundChange(idx, "appealEndDate", e.target.value)}
                            className="w-full p-1.5 bg-[#141f23] border border-zinc-700 text-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quy Tắc Đi Tiếp & Yêu Cầu Deliverables */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase block">
                        Quy Tắc Đi Tiếp Vòng Trong
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={r.advancementRuleType}
                          onChange={(e) => handleRoundChange(idx, "advancementRuleType", e.target.value)}
                          className="p-2 bg-[#090e11] border border-zinc-700 text-white text-xs cursor-pointer focus:outline-none"
                        >
                          <option value="top">Lấy Top N đội cao điểm nhất</option>
                          <option value="percent">Lấy Top % đội đứng đầu</option>
                          <option value="minScore">Điểm tối thiểu đạt chuẩn</option>
                          <option value="none">Không lọc (Chung kết / Tự do)</option>
                        </select>

                        {r.advancementRuleType !== "none" && (
                          <input
                            type="text"
                            value={r.advancementRuleValue}
                            onChange={(e) => handleRoundChange(idx, "advancementRuleValue", e.target.value)}
                            placeholder={r.advancementRuleType === "top" ? "Ví dụ: 10" : r.advancementRuleType === "percent" ? "Ví dụ: 50%" : "Ví dụ: 8.0"}
                            className="w-28 p-2 bg-[#090e11] border border-zinc-700 text-white text-xs font-bold text-center"
                          />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase block">
                        Yêu Cầu Sản Phẩm Bắt Buộc Khi Nộp Bài
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_DELIVERABLES.map((d) => {
                          const isChecked = (r.requiredDeliverables || []).includes(d.key);
                          const Icon = d.icon;
                          return (
                            <button
                              key={d.key}
                              type="button"
                              onClick={() => toggleDeliverable(idx, d.key)}
                              className={`px-2.5 py-1 text-[10px] font-bold flex items-center gap-1.5 hud-clipped transition-all cursor-pointer ${
                                isChecked
                                  ? "bg-[#a855f7]/20 border border-[#a855f7] text-[#c084fc]"
                                  : "bg-[#090e11] border border-zinc-800 text-zinc-500 hover:text-zinc-300"
                              }`}
                            >
                              <Icon className="w-3 h-3" />
                              <span>{d.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* SUB-SECTION 3: CẤU HÌNH HẠNG MỤC (TRACKS) */}
      {activeSubSection === "tracks" && (
        <Card className="p-6 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-muted)] pb-3">
            <div>
              <h3 className="font-display font-bold text-base text-white uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-[#c084fc]" />
                QUẢN LÝ BẢNG ĐẤU &amp; GÁN TIÊU CHÍ RUBRIC ({tracks.length} HẠNG MỤC)
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
                Thiết lập các Hạng mục chuyên môn và liên kết Bộ tiêu chí (Rubric Template) tương ứng cho từng bảng thi.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddTrack}
              className="px-3 py-2 bg-[#a855f7]/15 border border-[#a855f7] text-[#c084fc] hover:bg-[#a855f7] hover:text-white font-bold uppercase flex items-center gap-1.5 hud-clipped transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ THÊM HẠNG MỤC (TRACK)</span>
            </button>
          </div>

          {isLoadingTracks ? (
            <div className="py-12 text-center text-xs text-zinc-500">Đang tải danh sách hạng mục...</div>
          ) : tracks.length === 0 ? (
            <div className="p-8 text-center border border-zinc-800 bg-[var(--bg-input)] text-zinc-400">
              Chưa có hạng mục thi đấu nào. Bấm "+ THÊM HẠNG MỤC (TRACK)" để tạo mới.
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
                            className="text-red-400 hover:text-red-300 font-mono text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Xóa Hạng Mục
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

                    {/* INLINE RUBRIC TEMPLATE SELECTOR & EXPANDABLE CRITERIA PREVIEW */}
                    <div className="pt-3 border-t border-zinc-800 space-y-3 bg-[#090e11]/60 p-4 border border-zinc-800/80 hud-clipped">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#c084fc]" />
                          <span className="text-[11px] font-bold uppercase text-[#c084fc] tracking-wider">
                            BỘ TIÊU CHÍ CHẤM ĐIỂM (RUBRIC TEMPLATE)
                          </span>
                          {matchedTemplate ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold hud-clipped">
                              ✅ ĐÃ GÁN TIÊU CHÍ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/40 text-amber-400 font-mono text-[10px] font-bold hud-clipped">
                              ⚠️ CHƯA GÁN BỘ TIÊU CHÍ
                            </span>
                          )}
                        </div>

                        {matchedTemplate && (
                          <button
                            type="button"
                            onClick={() => toggleExpandRubric(idx)}
                            className="px-3 py-1 bg-[#141f23] border border-zinc-700 hover:border-[#a855f7] text-[#c084fc] font-mono text-[11px] font-bold uppercase flex items-center gap-1.5 hud-clipped transition-all cursor-pointer shadow-sm"
                          >
                            {isExpanded ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>ẨN BẢNG TIÊU CHÍ ▲</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>XEM CHI TIẾT ({criterias.length} TIÊU CHÍ • {totalWeight}%) ▼</span>
                              </>
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
                            <span>Kho tiêu chí mẫu (Module 04) ↗</span>
                          </Link>
                        </div>
                      </div>

                      {/* Expandable Criteria Details Accordion */}
                      {isExpanded && matchedTemplate && (
                        <div className="mt-3 p-4 bg-[#0f171c] border border-zinc-700 hud-clipped space-y-3">
                          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                            <div>
                              <span className="font-bold text-xs text-white">
                                CHI TIẾT BỘ TIÊU CHÍ: {matchedTemplate.templateName || (matchedTemplate as any).Name}
                              </span>
                              {matchedTemplate.description && (
                                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                                  {matchedTemplate.description}
                                </p>
                              )}
                            </div>
                            <span className="font-mono text-xs text-[#c084fc] font-bold">
                              Tổng Trọng Số: {totalWeight}%
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

      {/* Global Save Actions Footer */}
      {saveMessage && (
        <div
          className={`p-4 font-mono text-xs border hud-clipped flex items-center gap-2.5 ${
            saveMessage.isError
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          }`}
        >
          {saveMessage.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{saveMessage.text}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped">
        <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2">
          <Info className="w-4 h-4 text-[#c084fc]" />
          <span>Lưu ý: Mọi thay đổi về vòng thi và hạng mục sẽ có hiệu lực trực tiếp cho toàn bộ thí sinh và giám khảo.</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveAll(false)}
            className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-bold uppercase tracking-wider hud-clipped transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{isSaving ? "ĐANG LƯU..." : "💾 LƯU BẢN NHÁP"}</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveAll(true)}
            className="px-6 py-2.5 bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold uppercase tracking-wider hud-clipped flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-[#a855f7]/30"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "ĐANG LƯU DỮ LIỆU..." : "🚀 LƯU & CÔNG BỐ SỰ KIỆN"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
