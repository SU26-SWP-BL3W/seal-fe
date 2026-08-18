"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { eventsRepository } from "@/repositories/eventsRepository";
import { useToast } from "@/providers/ToastProvider";

interface ComprehensiveEventEditModalProps {
  event: any;
  onClose: () => void;
  onSuccess?: () => void;
}

function formatDateTimeInput(dateStr?: string, explicitTime?: string): string {
  if (!dateStr) return "";
  const datePart = dateStr.split("T")[0];
  if (!datePart) return "";
  if (explicitTime && !dateStr.includes("T")) {
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

  // Loading state for fetching full details
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(true);

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

  // Fetch đầy đủ toàn bộ dữ liệu mới nhất của sự kiện từ Backend API khi mở modal
  useEffect(() => {
    if (!eventId) {
      setIsLoadingDetail(false);
      return;
    }
    let isMounted = true;
    setIsLoadingDetail(true);

    eventsRepository
      .getEventById(eventId)
      .then((res: any) => {
        if (!isMounted) return;
        const ev = res?.data ?? res;
        if (ev) {
          if (ev.eventName || ev.EventName) setEventName(ev.eventName || ev.EventName);
          if (ev.season !== undefined || ev.Season !== undefined) setSeason(ev.season || ev.Season || "");
          if (ev.year !== undefined || ev.Year !== undefined) setYear(Number(ev.year || ev.Year) || new Date().getFullYear());
          if (ev.maxTeams !== undefined || ev.MaxTeams !== undefined) setMaxTeams(Number(ev.maxTeams || ev.MaxTeams) || 50);
          if (ev.description !== undefined || ev.Description !== undefined) setDescription(ev.description || ev.Description || "");
          if (ev.startDate || ev.StartDate) setStartDate(formatDateTimeInput(ev.startDate || ev.StartDate, "08:00"));
          if (ev.endDate || ev.EndDate) setEndDate(formatDateTimeInput(ev.endDate || ev.EndDate, "23:59"));
          if (ev.registrationStartDate || ev.RegistrationStartDate) {
            setRegistrationStartDate(formatDateTimeInput(ev.registrationStartDate || ev.RegistrationStartDate, "08:00"));
          }
          if (ev.registrationEndDate || ev.RegistrationEndDate) {
            setRegistrationEndDate(formatDateTimeInput(ev.registrationEndDate || ev.RegistrationEndDate, "23:59"));
          }
          if (ev.status !== undefined || ev.Status !== undefined) {
            setIsPublished(Boolean(ev.status ?? ev.Status));
          }
        }
      })
      .catch((err) => {
        console.warn("Could not fetch latest event details, using existing state:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingDetail(false);
      });

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  // Status message
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) {
      const msg = "Vui lòng nhập Tên sự kiện!";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    // Kiểm tra tính hợp lệ ngày sự kiện
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      const msg = "Ngày kết thúc sự kiện phải sau ngày bắt đầu sự kiện!";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    // Kiểm tra tính hợp lệ ngày tuyển sinh
    if (registrationStartDate && registrationEndDate && new Date(registrationStartDate) >= new Date(registrationEndDate)) {
      const msg = "Thời gian khóa đăng ký phải sau thời gian mở đăng ký!";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    if (registrationEndDate && endDate && new Date(registrationEndDate) > new Date(endDate)) {
      const msg = "Thời gian khóa đăng ký không thể diễn ra sau khi sự kiện đã kết thúc!";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Cập nhật Thông Tin Sự Kiện & Ngày Giờ
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

      setIsSaving(false);
      const okMsg = "Đã cập nhật thông tin và thời gian sự kiện thành công!";
      setSuccessMsg(okMsg);
      toast.success(okMsg);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 700);
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
      setErrorMsg(apiMsg);
      toast.error(apiMsg);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-[#10171a] border border-[#00d9ff]/50 rounded-xl w-full max-w-3xl space-y-4 relative shadow-[0_0_50px_rgba(0,217,255,0.15)] my-8 font-sans text-[#e1e7ec]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-[#00d9ff]/15 border border-[#00d9ff]/30 text-[#00d9ff]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg sm:text-xl text-white uppercase tracking-wide">
                  Chỉnh Sửa Thông Tin Sự Kiện
                </h2>
                {isLoadingDetail && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Đang tải dữ liệu...
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-zinc-400">
                Cập nhật thông tin, quy mô & thời gian tổ chức sự kiện
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
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

          {isLoadingDetail ? (
            <div className="p-12 text-center space-y-3 font-mono text-xs text-zinc-400 border border-zinc-800 rounded-lg bg-[#0b1013]">
              <RefreshCw className="w-6 h-6 mx-auto text-[#00d9ff] animate-spin" />
              <p>Đang đồng bộ toàn bộ dữ liệu mới nhất của sự kiện từ máy chủ...</p>
            </div>
          ) : (
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
              disabled={isSaving || isLoadingDetail}
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
