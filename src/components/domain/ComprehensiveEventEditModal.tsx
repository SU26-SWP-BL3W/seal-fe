"use client";

import React, { useState, useEffect } from "react";
import { eventsRepository } from "@/repositories/eventsRepository";
import { roundsRepository } from "@/repositories/roundsRepository";
import { tracksRepository, type Track } from "@/repositories/events/tracksRepository";
import { useToast } from "@/providers/ToastProvider";

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
  isNew?: boolean;
}

const AVAILABLE_DELIVERABLES = [
  { key: "github", label: "MÃ NGUỒN (GITHUB / GITLAB REPO URL)" },
  { key: "deployed_url", label: "LIVE DEMO URL (WEBSITE / APP ĐÃ DEPLOY)" },
  { key: "slides", label: "SLIDE THUYẾT TRÌNH (GOOGLE SLIDES / CANVA / PDF)" },
  { key: "demo_video", label: "VIDEO DEMO (YOUTUBE / GOOGLE DRIVE <= 5 PHÚT)" },
  { key: "report", label: "BẢN ĐỀ CƯƠNG / BÁO CÁO KIẾN TRÚC (PDF / DOCS)" },
  { key: "figma", label: "LINK THIẾT KẾ UI/UX (FIGMA PROTOTYPE)" },
];

interface ComprehensiveEventEditModalProps {
  event: any;
  onClose: () => void;
  onSuccess?: () => void;
}

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

export const ComprehensiveEventEditModal: React.FC<ComprehensiveEventEditModalProps> = ({
  event,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const eventId = event?.id || event?.Id || event?.eventId || event?.EventId || "";

  const [activeTab, setActiveTab] = useState<"general" | "rounds" | "tracks">("general");

  // 1. Form Thông Tin Sự Kiện
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

  // 2. Form Danh Sách Vòng Thi
  const [rounds, setRounds] = useState<RoundEditState[]>([]);
  const [deletedRoundIds, setDeletedRoundIds] = useState<string[]>([]);
  const [isLoadingRounds, setIsLoadingRounds] = useState<boolean>(true);

  // 3. Form Hạng Mục (Tracks)
  const [tracks, setTracks] = useState<TrackEditState[]>([]);
  const [deletedTrackIds, setDeletedTrackIds] = useState<string[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(true);

  // Status message
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tải danh sách Vòng thi & Hạng mục của sự kiện
  useEffect(() => {
    if (!eventId) return;
    let isMounted = true;
    setIsLoadingRounds(true);
    setIsLoadingTracks(true);

    // Load Rounds
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

    // Load Tracks
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

  // Round handlers
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
    if (target?.id && !target.id.startsWith("temp-")) setDeletedRoundIds([...deletedRoundIds, target.id]);
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

  // Track handlers
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
    if (target?.id && !target.id.startsWith("temp-")) setDeletedTrackIds([...deletedTrackIds, target.id]);
    setTracks(tracks.filter((_, i) => i !== index));
  };

  const handleTrackChange = (index: number, field: keyof TrackEditState, value: any) => {
    const updated = [...tracks];
    updated[index] = { ...updated[index], [field]: value };
    setTracks(updated);
  };

  // Save All logic with strict validation
  const handleExecuteSave = async (targetPublishStatus: boolean) => {
    if (!eventName.trim()) {
      const msg = "Vui lòng nhập Tên sự kiện!";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    // Validate Event Timeline
    const evStart = startDate ? new Date(startDate) : new Date();
    const evEnd = endDate ? new Date(endDate) : new Date();
    if (evStart >= evEnd) {
      const msg = "Ngày bắt đầu sự kiện phải trước ngày kết thúc sự kiện!";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    // Validate Rounds Timeline & AdvancementRule
    for (let i = 0; i < rounds.length; i++) {
      const r = rounds[i];
      const rName = r.roundName.trim() || `Vòng ${i + 1}`;
      const rStart = r.startDate ? new Date(r.startDate) : evStart;
      const rEnd = r.endDate ? new Date(r.endDate) : evEnd;

      if (rStart >= rEnd) {
        const msg = `[${rName}]: Ngày bắt đầu nộp bài phải trước hạn chót nộp bài!`;
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }

      if (rStart < evStart || rEnd > evEnd) {
        const msg = `[${rName}]: Thời gian nộp bài phải nằm trong khoảng diễn ra sự kiện (${toDateTimeLocal(startDate)} - ${toDateTimeLocal(endDate)})!`;
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }

      if (r.scoringStartDate && r.scoringEndDate) {
        const sStart = new Date(r.scoringStartDate);
        const sEnd = new Date(r.scoringEndDate);
        if (sStart < rEnd) {
          const msg = `[${rName}]: Thời gian bắt đầu chấm điểm phải từ sau hạn nộp bài!`;
          setErrorMsg(msg);
          toast.error(msg);
          return;
        }
        if (sEnd <= sStart) {
          const msg = `[${rName}]: Hạn chót chấm điểm phải sau thời điểm bắt đầu chấm!`;
          setErrorMsg(msg);
          toast.error(msg);
          return;
        }
      }
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Cập nhật Event
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

      // 2. Xóa Vòng thi bị gỡ
      for (const delId of deletedRoundIds) {
        try { await roundsRepository.deleteRound(delId); } catch {}
      }

      // 3. Cập nhật hoặc Tạo Vòng thi
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

      // 4. Xóa Track bị gỡ
      for (const delTrackId of deletedTrackIds) {
        try { await tracksRepository.deleteTrack(delTrackId); } catch {}
      }

      // 5. Cập nhật hoặc Tạo Track
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        const trackPayload = {
          eventId,
          trackName: t.trackName.trim() || `HẠNG MỤC ${i + 1}`,
          description: t.description?.trim() || "",
          submissionRuleDescription: t.submissionRuleDescription?.trim() || "",
        };

        if (t.id && !t.id.startsWith("temp-") && !t.isNew) {
          await tracksRepository.updateTrack(t.id, trackPayload);
        } else {
          await tracksRepository.createTrack(trackPayload);
        }
      }

      setIsSaving(false);
      const okMsg = targetPublishStatus
        ? "ĐÃ LƯU & CÔNG KHAI SỰ KIỆN THÀNH CÔNG!"
        : "ĐÃ LƯU DỮ LIỆU SỰ KIỆN DƯỚI DẠNG BẢN NHÁP THÀNH CÔNG!";
      setSuccessMsg(okMsg);
      toast.success(okMsg);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setIsSaving(false);
      const rawMsg = err?.response?.data?.message || err?.message || "LỖI KHI LƯU DỮ LIỆU SỰ KIỆN.";
      setErrorMsg(rawMsg);
      toast.error(rawMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      {/* Modal Container: Fixed Dimensions to prevent jumping/layout shift across tabs */}
      <div className="w-[940px] max-w-[95vw] h-[730px] max-h-[92vh] flex flex-col bg-[#0b1013] border border-cyan-500/50 shadow-2xl font-mono text-xs text-zinc-300 hud-clipped overflow-hidden">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-[#0b1013] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isPublished ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
              <span className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">
                ADMIN EVENT &amp; DELIVERABLES CONFIGURATION • [{isPublished ? "ĐANG CÔNG KHAI" : "BẢN NHÁP (DRAFT)"}]
              </span>
            </div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider mt-1">
              CHỈNH SỬA SỰ KIỆN, VÒNG THI &amp; QUY ĐỊNH NỘP BÀI
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-3 py-1.5 border border-zinc-700 hover:border-white text-zinc-400 hover:text-white font-bold uppercase transition-colors cursor-pointer"
          >
            ĐÓNG [ESC]
          </button>
        </div>

        {/* Fixed Tabs Navigation Bar */}
        <div className="flex items-center border-b border-zinc-800 bg-[#0b1013] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-5 py-3 font-bold uppercase transition-all border-b-2 cursor-pointer ${
              activeTab === "general"
                ? "border-cyan-500 text-cyan-400 bg-cyan-950/20"
                : "border-transparent text-zinc-500 hover:text-white"
            }`}
          >
            1. THÔNG TIN SỰ KIỆN
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rounds")}
            className={`px-5 py-3 font-bold uppercase transition-all border-b-2 cursor-pointer ${
              activeTab === "rounds"
                ? "border-cyan-500 text-cyan-400 bg-cyan-950/20"
                : "border-transparent text-zinc-500 hover:text-white"
            }`}
          >
            2. VÒNG THI &amp; QUY ĐỊNH NỘP BÀI ({rounds.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tracks")}
            className={`px-5 py-3 font-bold uppercase transition-all border-b-2 cursor-pointer ${
              activeTab === "tracks"
                ? "border-cyan-500 text-cyan-400 bg-cyan-950/20"
                : "border-transparent text-zinc-500 hover:text-white"
            }`}
          >
            3. HẠNG MỤC THI ĐẤU / TRACKS ({tracks.length})
          </button>
        </div>

        {/* Scrollable Form Body with fixed gutter */}
        <div className="flex-1 overflow-y-scroll p-6 space-y-6 [scrollbar-gutter:stable]">
          {errorMsg && (
            <div className="p-3.5 bg-red-950/70 border border-red-500 text-red-200 font-bold uppercase hud-clipped">
              [LỖI VALIDATE] {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 bg-emerald-950/70 border border-emerald-500 text-emerald-200 font-bold uppercase hud-clipped">
              [THÀNH CÔNG] {successMsg}
            </div>
          )}

          {/* TAB 1: THÔNG TIN SỰ KIỆN */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-zinc-400 font-bold uppercase block">
                  TÊN SỰ KIỆN CUỘC THI *:
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="vd: FPT Edu Hackathon 2026..."
                  className="w-full h-10 px-3 bg-[#0b1013] border border-zinc-700 text-white focus:border-cyan-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-400 font-bold uppercase block">MÙA GIẢI:</label>
                  <input
                    type="text"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    className="w-full h-10 px-3 bg-[#0b1013] border border-zinc-700 text-white focus:border-cyan-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-400 font-bold uppercase block">NĂM TỔ CHỨC:</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-[#0b1013] border border-zinc-700 text-white focus:border-cyan-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-400 font-bold uppercase block">SỐ ĐỘI TỐI ĐA:</label>
                  <input
                    type="number"
                    value={maxTeams}
                    onChange={(e) => setMaxTeams(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-[#0b1013] border border-zinc-700 text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#10171a] border border-zinc-800">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-400 font-bold uppercase block">
                    NGÀY MỞ ĐĂNG KÝ (TUYỂN SINH):
                  </label>
                  <input
                    type="datetime-local"
                    value={registrationStartDate}
                    onChange={(e) => setRegistrationStartDate(e.target.value)}
                    className="w-full h-10 px-3 bg-[#0b1013] border border-zinc-700 text-white focus:border-cyan-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-400 font-bold uppercase block">
                    HẠN CHÓT ĐĂNG KÝ (KHÓA TUYỂN SINH):
                  </label>
                  <input
                    type="datetime-local"
                    value={registrationEndDate}
                    onChange={(e) => setRegistrationEndDate(e.target.value)}
                    className="w-full h-10 px-3 bg-[#0b1013] border border-zinc-700 text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#10171a] border border-zinc-800">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-400 font-bold uppercase block">
                    NGÀY BẮT ĐẦU SỰ KIỆN (KHAI MẠC):
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 px-3 bg-[#0b1013] border border-zinc-700 text-white focus:border-cyan-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-400 font-bold uppercase block">
                    NGÀY KẾT THÚC SỰ KIỆN (BẾ MẠC):
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 px-3 bg-[#0b1013] border border-zinc-700 text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-zinc-400 font-bold uppercase block">MÔ TẢ TỔNG QUAN:</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-[#0b1013] border border-zinc-700 text-white focus:border-cyan-500 outline-none"
                  placeholder="Mô tả thể lệ, quy chế cuộc thi..."
                />
              </div>
            </div>
          )}

          {/* TAB 2: VÒNG THI & QUY ĐỊNH NỘP BÀI */}
          {activeTab === "rounds" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <span className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider block">
                    CẤU HÌNH LỘ TRÌNH THI ĐẤU &amp; YÊU CẦU NỘP BÀI TỪNG VÒNG
                  </span>
                  <p className="text-[10px] text-zinc-500">
                    Bật/tắt các sản phẩm thí sinh bắt buộc phải nộp và thiết lập tiêu chí chọn đội đi tiếp (Top N / Top %).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddRound}
                  className="px-3.5 py-1.5 border border-cyan-500 text-cyan-400 font-bold uppercase hover:bg-cyan-950/20 text-xs transition-colors cursor-pointer"
                >
                  + THÊM VÒNG THI MỚI
                </button>
              </div>

              {isLoadingRounds ? (
                <div className="p-8 text-center text-zinc-500">Đang tải danh sách vòng thi...</div>
              ) : rounds.length === 0 ? (
                <div className="p-8 text-center border border-zinc-800 text-zinc-500">
                  Chưa có vòng thi nào. Hãy bấm &quot;+ THÊM VÒNG THI MỚI&quot; để khởi tạo.
                </div>
              ) : (
                rounds.map((r, idx) => (
                  <div
                    key={r.id || idx}
                    className="p-4 bg-[#10171a] border border-zinc-800 space-y-4"
                  >
                    {/* Header Vòng */}
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                      <div className="flex items-center gap-2.5 flex-1 mr-3">
                        <span className="px-2 py-0.5 bg-cyan-600 text-white font-bold text-[10px] shrink-0">
                          VÒNG {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={r.roundName}
                          onChange={(e) => handleRoundChange(idx, "roundName", e.target.value)}
                          placeholder="vd: VÒNG SƠ LOẠI & Ý TƯỞNG..."
                          className="w-full h-8 px-2.5 bg-[#0b1013] border border-zinc-700 text-white font-bold text-xs focus:border-cyan-400 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRound(idx)}
                        className="px-2.5 py-1 border border-red-500/40 text-red-400 hover:bg-red-500/10 font-bold uppercase text-[10px] transition-colors cursor-pointer shrink-0"
                      >
                        GỠ VÒNG
                      </button>
                    </div>

                    {/* Timeline 3 Phase */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-[#0b1013] border border-zinc-800 space-y-2">
                        <span className="text-[10px] text-cyan-400 font-bold uppercase block tracking-wider">
                          1. HẠN NỘP BÀI (SUBMISSION):
                        </span>
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-500 block">MỞ NỘP BÀI:</span>
                          <input
                            type="datetime-local"
                            value={r.startDate}
                            onChange={(e) => handleRoundChange(idx, "startDate", e.target.value)}
                            className="w-full h-7 px-2 bg-[#10171a] border border-zinc-700 text-[10px] text-white outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-500 block">HẠN CHÓT NỘP:</span>
                          <input
                            type="datetime-local"
                            value={r.endDate}
                            onChange={(e) => handleRoundChange(idx, "endDate", e.target.value)}
                            className="w-full h-7 px-2 bg-[#10171a] border border-zinc-700 text-[10px] text-white outline-none"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-[#0b1013] border border-zinc-800 space-y-2">
                        <span className="text-[10px] text-amber-400 font-bold uppercase block tracking-wider">
                          2. CHẤM ĐIỂM (SCORING):
                        </span>
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-500 block">BẮT ĐẦU CHẤM:</span>
                          <input
                            type="datetime-local"
                            value={r.scoringStartDate}
                            onChange={(e) => handleRoundChange(idx, "scoringStartDate", e.target.value)}
                            className="w-full h-7 px-2 bg-[#10171a] border border-zinc-700 text-[10px] text-white outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-500 block">HẠN CHÓT CHẤM:</span>
                          <input
                            type="datetime-local"
                            value={r.scoringEndDate}
                            onChange={(e) => handleRoundChange(idx, "scoringEndDate", e.target.value)}
                            className="w-full h-7 px-2 bg-[#10171a] border border-zinc-700 text-[10px] text-white outline-none"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-[#0b1013] border border-zinc-800 space-y-2">
                        <span className="text-[10px] text-purple-400 font-bold uppercase block tracking-wider">
                          3. CÔNG BỐ &amp; PHÚC KHẢO (APPEAL):
                        </span>
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-500 block">MỞ PHÚC KHẢO:</span>
                          <input
                            type="datetime-local"
                            value={r.appealStartDate}
                            onChange={(e) => handleRoundChange(idx, "appealStartDate", e.target.value)}
                            className="w-full h-7 px-2 bg-[#10171a] border border-zinc-700 text-[10px] text-white outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-500 block">HẾT HẠN PHÚC KHẢO:</span>
                          <input
                            type="datetime-local"
                            value={r.appealEndDate}
                            onChange={(e) => handleRoundChange(idx, "appealEndDate", e.target.value)}
                            className="w-full h-7 px-2 bg-[#10171a] border border-zinc-700 text-[10px] text-white outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Deliverables Checklist */}
                    <div className="p-3.5 bg-[#0b1013] border border-zinc-800 space-y-2">
                      <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider block">
                        CÁC SẢN PHẨM BẮT BUỘC THÍ SINH PHẢI NỘP TRONG VÒNG NÀY:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {AVAILABLE_DELIVERABLES.map((d) => {
                          const isChecked = (r.requiredDeliverables || []).includes(d.key);
                          return (
                            <label
                              key={d.key}
                              className={`flex items-center gap-2 p-2 border transition-colors cursor-pointer select-none text-[10px] ${
                                isChecked
                                  ? "bg-cyan-950/30 border-cyan-500 text-white font-bold"
                                  : "bg-[#10171a] border-zinc-800 text-zinc-400"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleDeliverable(idx, d.key)}
                                className="w-3.5 h-3.5 accent-cyan-500 cursor-pointer"
                              />
                              <span>{d.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Regex-safe Advancement Rule Selector */}
                    <div className="p-3.5 bg-[#0b1013] border border-zinc-800 space-y-2">
                      <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                        QUY TẮC CHỌN ĐỘI ĐI TIẾP VÀO VÒNG SAU (ADVANCEMENT CRITERIA):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-500 block">LOẠI TIÊU CHÍ:</span>
                          <select
                            value={r.advancementRuleType}
                            onChange={(e) => handleRoundChange(idx, "advancementRuleType", e.target.value)}
                            className="w-full h-8 px-2 bg-[#10171a] border border-zinc-700 text-[11px] text-white outline-none cursor-pointer"
                          >
                            <option value="none">KHÔNG GIỚI HẠN / MẶC ĐỊNH</option>
                            <option value="top">LẤY TOP N ĐỘI MỖI TRACK (top:N)</option>
                            <option value="percent">LẤY TOP % ĐỘI MỖI TRACK (percent:P)</option>
                            <option value="minScore">ĐIỂM TRUNG BÌNH TỐI THIỂU (minScore:X)</option>
                          </select>
                        </div>

                        {r.advancementRuleType !== "none" && (
                          <div className="space-y-1">
                            <span className="text-[9px] text-zinc-500 block">
                              GIÁ TRỊ ({r.advancementRuleType === "top" ? "SỐ ĐỘI" : r.advancementRuleType === "percent" ? "% TỔNG ĐỘI" : "ĐIỂM TỐI THIỂU"}):
                            </span>
                            <input
                              type="number"
                              value={r.advancementRuleValue}
                              onChange={(e) => handleRoundChange(idx, "advancementRuleValue", e.target.value)}
                              placeholder={r.advancementRuleType === "top" ? "vd: 10" : r.advancementRuleType === "percent" ? "vd: 50" : "vd: 75"}
                              className="w-full h-8 px-2.5 bg-[#10171a] border border-zinc-700 text-[11px] text-white outline-none font-bold"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: HẠNG MỤC THI ĐẤU (TRACKS) */}
          {activeTab === "tracks" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <span className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider block">
                    CẤU HÌNH HẠNG MỤC / CHỦ ĐỀ THI ĐẤU (TRACKS)
                  </span>
                  <p className="text-[10px] text-zinc-500">
                    Phân chia các bảng đấu chuyên môn (AI, Web/App, IoT, Blockchain...) và quy định nộp bài đặc thù.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTrack}
                  className="px-3.5 py-1.5 border border-purple-500 text-purple-400 font-bold uppercase hover:bg-purple-950/20 text-xs transition-colors cursor-pointer"
                >
                  + THÊM HẠNG MỤC MỚI
                </button>
              </div>

              {isLoadingTracks ? (
                <div className="p-8 text-center text-zinc-500">Đang tải danh sách hạng mục...</div>
              ) : tracks.length === 0 ? (
                <div className="p-8 text-center border border-zinc-800 text-zinc-500">
                  Chưa có hạng mục nào. Hãy bấm &quot;+ THÊM HẠNG MỤC MỚI&quot; để khởi tạo.
                </div>
              ) : (
                tracks.map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className="p-4 bg-[#10171a] border border-zinc-800 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <div className="flex items-center gap-2.5 flex-1 mr-3">
                        <span className="px-2 py-0.5 bg-purple-600 text-white font-bold text-[10px] shrink-0">
                          TRACK {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={t.trackName}
                          onChange={(e) => handleTrackChange(idx, "trackName", e.target.value)}
                          placeholder="vd: TRACK 1: GENAI & CHUYỂN ĐỔI SỐ..."
                          className="w-full h-8 px-2.5 bg-[#0b1013] border border-zinc-700 text-white font-bold text-xs focus:border-purple-400 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTrack(idx)}
                        className="px-2.5 py-1 border border-red-500/40 text-red-400 hover:bg-red-500/10 font-bold uppercase text-[10px] transition-colors cursor-pointer shrink-0"
                      >
                        GỠ TRACK
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase block">
                          MÔ TẢ ĐỀ BÀI &amp; ĐỊNH HƯỚNG CÔNG NGHỆ:
                        </label>
                        <textarea
                          rows={2}
                          value={t.description || ""}
                          onChange={(e) => handleTrackChange(idx, "description", e.target.value)}
                          placeholder="Mô tả bài toán cần giải quyết, định hướng công nghệ..."
                          className="w-full p-2 bg-[#0b1013] border border-zinc-700 text-[11px] text-white outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase block">
                          QUY ĐỊNH NỘP BÀI RIÊNG CỦA TRACK (NẾU CÓ):
                        </label>
                        <textarea
                          rows={2}
                          value={t.submissionRuleDescription || ""}
                          onChange={(e) => handleTrackChange(idx, "submissionRuleDescription", e.target.value)}
                          placeholder="vd: Yêu cầu đính kèm dataset, video quay mô hình chạy thực tế..."
                          className="w-full p-2 bg-[#0b1013] border border-zinc-700 text-[11px] text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Fixed Bottom Footer Action Bar */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-800 bg-[#0b1013] shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 border border-zinc-700 hover:border-white text-zinc-400 hover:text-white font-bold uppercase transition-colors cursor-pointer"
          >
            HỦY BỎ
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleExecuteSave(false)}
              disabled={isSaving}
              className="px-5 py-2.5 border border-amber-500/60 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40 font-bold uppercase transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "ĐANG LƯU..." : "LƯU DƯỚI DẠNG NHÁP (DRAFT)"}
            </button>

            <button
              type="button"
              onClick={() => handleExecuteSave(true)}
              disabled={isSaving}
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase transition-all shadow-md shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "ĐANG LƯU..." : "LƯU & CÔNG KHAI NGAY (PUBLIC)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

