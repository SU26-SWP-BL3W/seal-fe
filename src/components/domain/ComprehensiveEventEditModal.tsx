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
  const [startDate, setStartDate] = useState(toDateTimeLocal(event?.startDate || event?.StartDate, "08:00"));
  const [endDate, setEndDate] = useState(toDateTimeLocal(event?.endDate || event?.EndDate, "23:59"));
  const [registrationStartDate, setRegistrationStartDate] = useState(
    toDateTimeLocal(event?.registrationStartDate || event?.RegistrationStartDate, "08:00")
  );
  const [registrationEndDate, setRegistrationEndDate] = useState(
    toDateTimeLocal(event?.registrationEndDate || event?.RegistrationEndDate, "23:59")
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
            items.map((r: any, idx: number) => ({
              id: r.id || r.Id,
              roundName: r.roundName || r.RoundName || `Vòng thi ${idx + 1}`,
              roundNumber: r.roundNumber || r.RoundNumber || idx + 1,
              startDate: toDateTimeLocal(r.startDate || r.StartDate, "08:00"),
              endDate: toDateTimeLocal(r.endDate || r.EndDate, "23:59"),
              scoringStartDate: toDateTimeLocal(r.scoringStartDate || r.ScoringStartDate || r.endDate || r.EndDate, "08:00"),
              scoringEndDate: toDateTimeLocal(r.scoringEndDate || r.ScoringEndDate || r.endDate || r.EndDate, "18:00"),
              appealStartDate: toDateTimeLocal(r.appealStartDate || r.AppealStartDate || r.endDate || r.EndDate, "09:00"),
              appealEndDate: toDateTimeLocal(r.appealEndDate || r.AppealEndDate || r.endDate || r.EndDate, "23:59"),
              advancementRule: r.advancementRule || r.AdvancementRule || "",
            }))
          );
        } else {
          setRounds([
            {
              id: undefined,
              isNew: true,
              roundName: "Vòng Tuyển Chọn & Đánh Giá",
              roundNumber: 1,
              startDate: toDateTimeLocal(event?.startDate || event?.StartDate, "08:00"),
              endDate: toDateTimeLocal(event?.endDate || event?.EndDate, "23:59"),
              scoringStartDate: toDateTimeLocal(event?.endDate || event?.EndDate, "08:00"),
              scoringEndDate: toDateTimeLocal(event?.endDate || event?.EndDate, "18:00"),
              appealStartDate: toDateTimeLocal(event?.endDate || event?.EndDate, "09:00"),
              appealEndDate: toDateTimeLocal(event?.endDate || event?.EndDate, "23:59"),
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
  }, [eventId]);

  const handleAddRound = () => {
    const nextNumber = rounds.length + 1;
    setRounds([
      ...rounds,
      {
        id: `temp-${Date.now()}`,
        isNew: true,
        roundName: `Vòng thi số ${nextNumber}`,
        roundNumber: nextNumber,
        startDate: toDateTimeLocal(endDate, "08:00"),
        endDate: toDateTimeLocal(endDate, "23:59"),
        scoringStartDate: toDateTimeLocal(endDate, "08:00"),
        scoringEndDate: toDateTimeLocal(endDate, "18:00"),
        appealStartDate: toDateTimeLocal(endDate, "09:00"),
        appealEndDate: toDateTimeLocal(endDate, "23:59"),
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
        startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : new Date().toISOString(),
        registrationStartDate: registrationStartDate ? new Date(registrationStartDate).toISOString() : undefined,
        registrationEndDate: registrationEndDate ? new Date(registrationEndDate).toISOString() : undefined,
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
          startDate: r.startDate ? new Date(r.startDate).toISOString() : new Date().toISOString(),
          endDate: r.endDate ? new Date(r.endDate).toISOString() : new Date().toISOString(),
          scoringStartDate: r.scoringStartDate ? new Date(r.scoringStartDate).toISOString() : undefined,
          scoringEndDate: r.scoringEndDate ? new Date(r.scoringEndDate).toISOString() : undefined,
          appealStartDate: r.appealStartDate ? new Date(r.appealStartDate).toISOString() : undefined,
          appealEndDate: r.appealEndDate ? new Date(r.appealEndDate).toISOString() : undefined,
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
      const apiMsg = err?.response?.data?.message || err?.message || "Lưu thay đổi thất bại. Vui lòng kiểm tra dữ liệu và thử lại.";
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
            className={`px-4 py-2.5 font-bold uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "general"
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
            className={`px-4 py-2.5 font-bold uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "rounds"
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
              <div className="flex items-center justify-end pb-2 border-b border-zinc-800">
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
