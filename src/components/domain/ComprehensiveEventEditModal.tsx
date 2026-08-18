"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Layers,
  Settings,
  Shield,
  Briefcase,
  Sliders,
  Check,
  AlertCircle,
} from "lucide-react";
import { eventsRepository } from "@/repositories/eventsRepository";
import { roundsRepository } from "@/repositories/roundsRepository";
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
  advancementRule?: string;
  isNew?: boolean;
}

interface ComprehensiveEventEditModalProps {
  event: any;
  onClose: () => void;
  onSuccess?: () => void;
}

function parseDateOnly(dateStr?: string): string {
  if (!dateStr) return "";
  return dateStr.split("T")[0];
}

function addDaysToDate(dateStr: string, days: number): string {
  const base = parseDateOnly(dateStr);
  if (!base) return "";
  const d = new Date(base);
  if (isNaN(d.getTime())) return base;
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDateTimeInput(dateStr?: string, explicitTime?: string): string {
  if (!dateStr) return "";
  const datePart = dateStr.split("T")[0];
  if (!datePart) return "";
  if (explicitTime) {
    return `${datePart}T${explicitTime}`;
  }
  if (dateStr.includes("T")) {
    const timePart = dateStr.split("T")[1]?.substring(0, 5);
    if (timePart) return `${datePart}T${timePart}`;
  }
  return `${datePart}T08:00`;
}

function toValidIso(val?: string): string | undefined {
  if (!val) return undefined;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

export const ComprehensiveEventEditModal: React.FC<ComprehensiveEventEditModalProps> = ({
  event,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const eventId = event?.id || event?.Id || event?.eventId || event?.EventId || "";

  const [activeTab, setActiveTab] = useState<"general" | "rounds">("general");

  // Form Thông Tin Sự Kiện
  const [eventName, setEventName] = useState(event?.eventName || event?.EventName || "");
  const [season, setSeason] = useState(event?.season || event?.Season || "Summer");
  const [year, setYear] = useState<number>(Number(event?.year || event?.Year) || new Date().getFullYear());
  const [maxTeams, setMaxTeams] = useState<number>(Number(event?.maxTeams || event?.MaxTeams) || 50);
  const [description, setDescription] = useState(event?.description || event?.Description || "");
  const [startDate, setStartDate] = useState(formatDateTimeInput(event?.startDate || event?.StartDate, "08:00"));
  const [endDate, setEndDate] = useState(formatDateTimeInput(event?.endDate || event?.EndDate, "23:59"));
  const [registrationStartDate, setRegistrationStartDate] = useState(
    formatDateTimeInput(event?.registrationStartDate || event?.RegistrationStartDate, "08:00")
  );
  const [registrationEndDate, setRegistrationEndDate] = useState(
    formatDateTimeInput(event?.registrationEndDate || event?.RegistrationEndDate, "23:59")
  );
  const [isPublished, setIsPublished] = useState<boolean>(
    event?.status !== undefined ? Boolean(event.status) : (event?.Status !== undefined ? Boolean(event.Status) : true)
  );

  // Form Danh Sách Vòng Thi
  const [rounds, setRounds] = useState<RoundEditState[]>([]);
  const [deletedRoundIds, setDeletedRoundIds] = useState<string[]>([]);
  const [isLoadingRounds, setIsLoadingRounds] = useState<boolean>(true);

  // Status message
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tải danh sách Vòng thi của sự kiện
  useEffect(() => {
    if (!eventId) return;
    let isMounted = true;
    setIsLoadingRounds(true);

    roundsRepository
      .getRoundsByEventId(eventId)
      .then((res) => {
        if (!isMounted) return;
        const items = res?.data?.items ?? res?.items ?? (Array.isArray(res) ? res : []);
        if (items.length > 0) {
          setRounds(
            items.map((r: any, idx: number) => {
              const rStart = r.startDate || r.StartDate || event?.startDate || new Date().toISOString();
              const rEnd = r.endDate || r.EndDate || rStart;
              const startFormatted = formatDateTimeInput(rStart, "08:00");
              const endFormatted = formatDateTimeInput(rEnd, "23:59");

              // Phân định mốc thời gian chấm điểm & phúc khảo logic không trùng lặp
              const scoringStartRaw = r.scoringStartDate || r.ScoringStartDate;
              const scoringEndRaw = r.scoringEndDate || r.ScoringEndDate;
              const appealStartRaw = r.appealStartDate || r.AppealStartDate;
              const appealEndRaw = r.appealEndDate || r.AppealEndDate;

              const defaultScoringStart = scoringStartRaw
                ? formatDateTimeInput(scoringStartRaw)
                : `${addDaysToDate(endFormatted, 1)}T08:00`;

              const defaultScoringEnd = scoringEndRaw
                ? formatDateTimeInput(scoringEndRaw)
                : `${addDaysToDate(defaultScoringStart, 3)}T18:00`;

              const defaultAppealStart = appealStartRaw
                ? formatDateTimeInput(appealStartRaw)
                : `${addDaysToDate(defaultScoringEnd, 1)}T09:00`;

              const defaultAppealEnd = appealEndRaw
                ? formatDateTimeInput(appealEndRaw)
                : `${addDaysToDate(defaultAppealStart, 3)}T23:59`;

              return {
                id: r.id || r.Id,
                roundName: r.roundName || r.RoundName || `Vòng thi ${idx + 1}`,
                roundNumber: r.roundNumber || r.RoundNumber || idx + 1,
                startDate: startFormatted,
                endDate: endFormatted,
                scoringStartDate: defaultScoringStart,
                scoringEndDate: defaultScoringEnd,
                appealStartDate: defaultAppealStart,
                appealEndDate: defaultAppealEnd,
                advancementRule: r.advancementRule || r.AdvancementRule || "",
              };
            })
          );
        } else {
          const evStart = event?.startDate || event?.StartDate || new Date().toISOString();
          const evEnd = event?.endDate || event?.EndDate || addDaysToDate(evStart, 30);
          const startFmt = formatDateTimeInput(evStart, "08:00");
          const endFmt = formatDateTimeInput(evEnd, "23:59");

          setRounds([
            {
              id: undefined,
              isNew: true,
              roundName: "Vòng Tuyển Chọn & Đánh Giá",
              roundNumber: 1,
              startDate: startFmt,
              endDate: endFmt,
              scoringStartDate: `${addDaysToDate(endFmt, 1)}T08:00`,
              scoringEndDate: `${addDaysToDate(endFmt, 4)}T18:00`,
              appealStartDate: `${addDaysToDate(endFmt, 5)}T09:00`,
              appealEndDate: `${addDaysToDate(endFmt, 7)}T23:59`,
            },
          ]);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setRounds([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingRounds(false);
      });

    return () => {
      isMounted = false;
    };
  }, [eventId, event]);

  const handleAddRound = () => {
    const nextNumber = rounds.length + 1;
    const prevRound = rounds[rounds.length - 1];

    // Khởi tạo ngày cho vòng tiếp theo sau vòng trước
    const baseStartDate = prevRound?.endDate
      ? addDaysToDate(prevRound.endDate, 1)
      : (endDate ? addDaysToDate(endDate, 1) : new Date().toISOString().split("T")[0]);
    const baseEndDate = addDaysToDate(baseStartDate, 7);

    setRounds([
      ...rounds,
      {
        id: `temp-${Date.now()}`,
        isNew: true,
        roundName: `Vòng thi số ${nextNumber}`,
        roundNumber: nextNumber,
        startDate: `${baseStartDate}T08:00`,
        endDate: `${baseEndDate}T23:59`,
        scoringStartDate: `${addDaysToDate(baseEndDate, 1)}T08:00`,
        scoringEndDate: `${addDaysToDate(baseEndDate, 4)}T18:00`,
        appealStartDate: `${addDaysToDate(baseEndDate, 5)}T09:00`,
        appealEndDate: `${addDaysToDate(baseEndDate, 7)}T23:59`,
      },
    ]);
  };

  const handleRemoveRound = (index: number) => {
    const target = rounds[index];
    if (target?.id && !target.id.startsWith("temp-")) {
      setDeletedRoundIds([...deletedRoundIds, target.id]);
    }
    const updated = rounds.filter((_, i) => i !== index);
    setRounds(updated);
  };

  const handleRoundChange = (index: number, field: keyof RoundEditState, value: any) => {
    const updated = [...rounds];
    updated[index] = { ...updated[index], [field]: value };
    setRounds(updated);
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) {
      const msg = "Vui lòng nhập Tên sự kiện!";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    // 1. Kiểm tra ngày sự kiện
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      const msg = "Ngày kết thúc sự kiện phải sau ngày bắt đầu sự kiện!";
      setErrorMsg(msg);
      toast.error(msg);
      setActiveTab("general");
      return;
    }

    // 2. Kiểm tra tính hợp lệ của từng vòng thi
    for (let i = 0; i < rounds.length; i++) {
      const r = rounds[i];
      const rName = r.roundName.trim() || `Vòng thi số ${i + 1}`;

      if (!r.startDate || !r.endDate) {
        const msg = `${rName}: Vui lòng nhập đầy đủ ngày Mở đề (Phase 1) và Hạn nộp bài (Phase 2)!`;
        setErrorMsg(msg);
        toast.error(msg);
        setActiveTab("rounds");
        return;
      }

      if (new Date(r.startDate) >= new Date(r.endDate)) {
        const msg = `${rName}: Hạn nộp bài (Phase 2) phải sau ngày Mở đề bài (Phase 1)!`;
        setErrorMsg(msg);
        toast.error(msg);
        setActiveTab("rounds");
        return;
      }

      if (r.scoringStartDate && r.scoringEndDate) {
        if (new Date(r.scoringStartDate) >= new Date(r.scoringEndDate)) {
          const msg = `${rName}: Thời gian kết thúc chấm điểm phải sau thời gian bắt đầu chấm điểm (Phase 3)!`;
          setErrorMsg(msg);
          toast.error(msg);
          setActiveTab("rounds");
          return;
        }
      }

      if (r.appealStartDate && r.appealEndDate) {
        if (new Date(r.appealStartDate) >= new Date(r.appealEndDate)) {
          const msg = `${rName}: Hạn nộp phúc khảo phải sau ngày bắt đầu công bố/phúc khảo (Phase 4 & 5)!`;
          setErrorMsg(msg);
          toast.error(msg);
          setActiveTab("rounds");
          return;
        }
      }
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Cập nhật Thông Tin Sự Kiện
      await eventsRepository.updateEvent(eventId, {
        eventName: eventName.trim(),
        season: season.trim(),
        year: Number(year),
        maxTeams: Number(maxTeams) || 50,
        description: description.trim(),
        startDate: toValidIso(startDate) || new Date().toISOString(),
        endDate: toValidIso(endDate) || new Date().toISOString(),
        registrationStartDate: toValidIso(registrationStartDate),
        registrationEndDate: toValidIso(registrationEndDate),
        status: isPublished,
      });

      // 2. Xóa các vòng thi bị gỡ
      for (const delId of deletedRoundIds) {
        try {
          await roundsRepository.deleteRound(delId);
        } catch (delErr) {
          console.warn("Could not delete round:", delId, delErr);
        }
      }

      // 3. Cập nhật hoặc Tạo mới các Vòng thi
      for (let i = 0; i < rounds.length; i++) {
        const r = rounds[i];
        const payload = {
          eventId,
          roundName: r.roundName.trim() || `Vòng thi ${i + 1}`,
          roundNumber: i + 1,
          startDate: toValidIso(r.startDate) || new Date().toISOString(),
          endDate: toValidIso(r.endDate) || new Date().toISOString(),
          scoringStartDate: toValidIso(r.scoringStartDate),
          scoringEndDate: toValidIso(r.scoringEndDate),
          appealStartDate: toValidIso(r.appealStartDate),
          appealEndDate: toValidIso(r.appealEndDate),
          advancementRule: r.advancementRule || undefined,
        };

        if (r.id && !r.id.startsWith("temp-") && !r.isNew) {
          await roundsRepository.updateRound(r.id, payload);
        } else {
          await roundsRepository.createRound(payload);
        }
      }

      setIsSaving(false);
      const okMsg = "Đã lưu thành công toàn bộ thông tin sự kiện & lộ trình các vòng thi!";
      setSuccessMsg(okMsg);
      toast.success(okMsg);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setIsSaving(false);
      const data = err?.response?.data;
      let apiMsg = "";
      if (data?.errors && typeof data.errors === "object") {
        const errList: string[] = [];
        for (const [k, v] of Object.entries(data.errors)) {
          if (Array.isArray(v)) errList.push(...v);
          else if (typeof v === "string") errList.push(v);
        }
        if (errList.length > 0) apiMsg = errList.join(" | ");
      }
      if (!apiMsg) {
        apiMsg = data?.message || data?.title || (typeof data === "string" ? data : "") || err?.message || "Lưu thay đổi thất bại.";
      }
      if (apiMsg.includes("BadRequestException") || apiMsg.includes("SEAL_Domain.Base")) {
        apiMsg = "Dữ liệu mốc thời gian của các vòng thi không hợp lệ (thời gian kết thúc phải sau thời gian bắt đầu và các giai đoạn không được trùng nhau). Vui lòng kiểm tra lại.";
      }
      setErrorMsg(apiMsg);
      toast.error(apiMsg);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-[#10171a] border border-[#00d9ff]/50 rounded-xl w-full max-w-4xl space-y-4 relative shadow-[0_0_50px_rgba(0,217,255,0.15)] my-8 font-sans text-[#e1e7ec]">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="font-display font-bold text-xl text-white uppercase tracking-wide">
            Chỉnh Sửa Sự Kiện &amp; Lộ Trình
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 flex items-center gap-2 border-b border-zinc-800 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2.5 font-bold uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === "general"
                ? "border-[#00d9ff] text-[#00d9ff] bg-[#00d9ff]/10"
                : "border-transparent text-zinc-400 hover:text-white"
              }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Thông Tin Sự Kiện</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rounds")}
            className={`px-4 py-2.5 font-bold uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeTab === "rounds"
                ? "border-[#00d9ff] text-[#00d9ff] bg-[#00d9ff]/10"
                : "border-transparent text-zinc-400 hover:text-white"
              }`}
          >
            <Layers className="w-4 h-4" />
            <span>Vòng Thi ({rounds.length})</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSaveAll} className="p-5 space-y-5">
          {successMsg && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500 text-emerald-300 text-xs font-mono rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-950/40 border border-red-500 text-red-300 text-xs font-mono rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: THÔNG TIN TỔNG QUAN & ĐĂNG KÝ */}
          {activeTab === "general" && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-zinc-300 uppercase block">
                  Tên Sự Kiện *
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                  placeholder="VD: SEAL Hackathon 2026..."
                  className="w-full bg-[#0b1013] border border-zinc-700 px-3.5 py-2.5 text-white font-mono text-sm rounded-lg focus:border-[#00d9ff] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase font-bold block">Mùa Giải</label>
                  <input
                    type="text"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    placeholder="Summer / Fall..."
                    className="w-full bg-[#0b1013] border border-zinc-700 px-3 py-2 text-white rounded-lg focus:border-[#00d9ff] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase font-bold block">Năm</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full bg-[#0b1013] border border-zinc-700 px-3 py-2 text-white rounded-lg focus:border-[#00d9ff] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase font-bold block">Số Đội Tối Đa</label>
                  <input
                    type="number"
                    value={maxTeams}
                    onChange={(e) => setMaxTeams(Number(e.target.value))}
                    className="w-full bg-[#0b1013] border border-zinc-700 px-3 py-2 text-white rounded-lg focus:border-[#00d9ff] outline-none"
                  />
                </div>
              </div>

              {/* Mốc thời gian tổng thể */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase font-bold block">
                    Ngày Bắt Đầu Sự Kiện
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#0b1013] border border-zinc-700 px-3 py-2 text-white rounded-lg focus:border-[#00d9ff] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 uppercase font-bold block">
                    Ngày Kết Thúc Sự Kiện
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#0b1013] border border-zinc-700 px-3 py-2 text-white rounded-lg focus:border-[#00d9ff] outline-none"
                  />
                </div>
              </div>

              {/* Giai đoạn Tuyển sinh */}
              <div className="p-4 bg-[#131e24] border border-cyan-500/30 rounded-lg space-y-3 font-mono text-xs">
                <div className="flex items-center gap-2 text-cyan-300 font-bold uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Thời Gian Tuyển Sinh</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 uppercase font-bold block">
                      Mở Đăng Ký
                    </label>
                    <input
                      type="datetime-local"
                      value={registrationStartDate}
                      onChange={(e) => setRegistrationStartDate(e.target.value)}
                      className="w-full bg-[#0b1013] border border-zinc-700 px-3 py-2 text-white rounded-lg focus:border-cyan-400 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 uppercase font-bold block">
                      Khóa Đăng Ký
                    </label>
                    <input
                      type="datetime-local"
                      value={registrationEndDate}
                      onChange={(e) => setRegistrationEndDate(e.target.value)}
                      className="w-full bg-[#0b1013] border border-zinc-700 px-3 py-2 text-white rounded-lg focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-zinc-300 uppercase block">
                  Mô Tả Tổng Quan Sự Kiện
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập mô tả sự kiện, thể lệ thi đấu, phần thưởng..."
                  className="w-full bg-[#0b1013] border border-zinc-700 p-3 text-white font-mono text-xs rounded-lg focus:border-[#00d9ff] outline-none resize-y"
                />
              </div>
            </div>
          )}

          {/* TAB 2: QUẢN LÝ VÒNG THI & PHASE 1 -> 5 */}
          {activeTab === "rounds" && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 font-mono text-xs">
                <span className="text-[11px] text-zinc-400">
                  Lưu ý: Thời gian các giai đoạn (Phase) phải có khoảng cách và kết thúc sau bắt đầu.
                </span>
                <button
                  type="button"
                  onClick={handleAddRound}
                  className="px-3.5 py-1.5 bg-[#00d9ff]/20 text-[#00d9ff] border border-[#00d9ff]/40 hover:bg-[#00d9ff] hover:text-black font-mono text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Vòng Thi</span>
                </button>
              </div>

              {isLoadingRounds ? (
                <div className="p-8 text-center font-mono text-xs text-zinc-400 italic">
                  Đang tải danh sách vòng thi...
                </div>
              ) : rounds.length === 0 ? (
                <div className="p-8 text-center font-mono text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                  Sự kiện chưa có vòng thi nào. Hãy bấm &quot;Thêm Vòng Thi&quot; để thiết lập.
                </div>
              ) : (
                <div className="space-y-4">
                  {rounds.map((round, idx) => (
                    <div
                      key={round.id || idx}
                      className="p-4 bg-[#0b1013] border border-zinc-800 hover:border-zinc-700 rounded-lg space-y-3 font-mono text-xs relative"
                    >
                      {/* Round Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/60">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-6 h-6 rounded bg-[#00d9ff]/10 text-[#00d9ff] border border-[#00d9ff]/30 flex items-center justify-center font-bold text-xs shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={round.roundName}
                            onChange={(e) => handleRoundChange(idx, "roundName", e.target.value)}
                            placeholder={`Tên vòng thi ${idx + 1}`}
                            className="bg-transparent border-b border-zinc-700 text-white font-bold text-sm px-1 py-0.5 focus:border-[#00d9ff] outline-none flex-1 max-w-sm"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveRound(idx)}
                          className="px-2 py-1 text-red-400 hover:bg-red-950/40 hover:text-red-300 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer self-end sm:self-auto"
                          title="Xóa vòng thi này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Gỡ vòng</span>
                        </button>
                      </div>

                      {/* Phase 1 & 2: Mở Đề & Hạn Nộp Bài */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#10171a] p-3 rounded border border-zinc-800/80">
                        <div className="space-y-1">
                          <label className="text-[11px] text-cyan-300 font-bold block">
                            Phase 1: Mở Đề Bài
                          </label>
                          <input
                            type="datetime-local"
                            value={round.startDate}
                            onChange={(e) => handleRoundChange(idx, "startDate", e.target.value)}
                            className="w-full bg-[#0b1013] border border-zinc-700 px-2.5 py-1.5 text-white rounded focus:border-[#00d9ff] outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-cyan-300 font-bold block">
                            Phase 2: Hạn Nộp Bài
                          </label>
                          <input
                            type="datetime-local"
                            value={round.endDate}
                            onChange={(e) => handleRoundChange(idx, "endDate", e.target.value)}
                            className="w-full bg-[#0b1013] border border-zinc-700 px-2.5 py-1.5 text-white rounded focus:border-[#00d9ff] outline-none"
                          />
                        </div>
                      </div>

                      {/* Phase 3, 4, 5: Chấm Điểm & Phúc Khảo */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#10171a] p-3 rounded border border-zinc-800/80">
                        <div className="space-y-1">
                          <label className="text-[11px] text-amber-300 font-bold block">
                            Phase 3: Chấm Điểm
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="datetime-local"
                              value={round.scoringStartDate}
                              onChange={(e) => handleRoundChange(idx, "scoringStartDate", e.target.value)}
                              title="Bắt đầu chấm"
                              className="w-full bg-[#0b1013] border border-zinc-700 px-2 py-1 text-white text-[11px] rounded focus:border-amber-400 outline-none"
                            />
                            <input
                              type="datetime-local"
                              value={round.scoringEndDate}
                              onChange={(e) => handleRoundChange(idx, "scoringEndDate", e.target.value)}
                              title="Khóa chấm"
                              className="w-full bg-[#0b1013] border border-zinc-700 px-2 py-1 text-white text-[11px] rounded focus:border-amber-400 outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-purple-300 font-bold block">
                            Phase 4 &amp; 5: Công Bố &amp; Phúc Khảo
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="datetime-local"
                              value={round.appealStartDate}
                              onChange={(e) => handleRoundChange(idx, "appealStartDate", e.target.value)}
                              title="Ngày công bố kết quả"
                              className="w-full bg-[#0b1013] border border-zinc-700 px-2 py-1 text-white text-[11px] rounded focus:border-purple-400 outline-none"
                            />
                            <input
                              type="datetime-local"
                              value={round.appealEndDate}
                              onChange={(e) => handleRoundChange(idx, "appealEndDate", e.target.value)}
                              title="Hạn nộp phúc khảo"
                              className="w-full bg-[#0b1013] border border-zinc-700 px-2 py-1 text-white text-[11px] rounded focus:border-purple-400 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action-Anchored Error Banner */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-950/70 border border-rose-500/80 text-rose-200 font-mono text-xs rounded-lg flex items-center gap-2.5 animate-in slide-in-from-bottom-2 shadow-[0_0_20px_rgba(244,63,94,0.25)]">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
              <div className="flex-1">
                <strong className="block text-rose-300 font-bold uppercase tracking-wider text-[11px] mb-0.5">
                  Chưa Thể Lưu Cập Nhật
                </strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800 font-mono text-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg uppercase cursor-pointer"
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#00d9ff] text-black font-extrabold uppercase hover:bg-white hover:shadow-[0_0_20px_rgba(0,217,255,0.4)] transition-all rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving ? "Đang lưu..." : "Lưu Thay Đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
