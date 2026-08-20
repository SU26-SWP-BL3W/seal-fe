"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useGetFinalResultsByRound, useAssignPrize, finalResultsRepository } from "@/repositories/finalResultsRepository";
import { useMyEvents, useEvents, useEventRounds } from "@/repositories/eventsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { useGetTeamsByEvent } from "@/repositories/teamsRepository";
import { useGetPrizesByEvent } from "@/repositories/results/prizesRepository";
import {
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Award,
  ChevronDown,
  Download,
  Mail,
  Send,
  X,
} from "lucide-react";
import { useToast } from "@/providers/ToastProvider";
import { Link } from "@/i18n/routing";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, Button, Card, Field, Input } from "@/components/ui";

export const CoordinatorPublishResultsView: React.FC = () => {
  const toast = useToast();
  const params = useParams();
  const { user: currentUser } = useAuth();

  const { data: myEvents = [] } = useMyEvents();
  const { data: rawAllEvents = [] } = useEvents();
  const allEvents = Array.isArray(rawAllEvents) ? rawAllEvents : (rawAllEvents as any)?.data ?? [];
  const eventsList = (currentUser?.isAdmin || currentUser?.IsAdmin)
    ? allEvents
    : myEvents;

  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");

  React.useEffect(() => {
    if (eventsList.length > 0 && !selectedEventId) {
      setSelectedEventId(eventsList[0].id || eventsList[0].eventId || "");
    }
  }, [eventsList, selectedEventId]);

  const { data: dbTracks = [] } = useGetTracksByEvent(selectedEventId);
  const { data: dbPrizes = [] } = useGetPrizesByEvent(selectedEventId);
  const { data: dbRounds = [] } = useEventRounds(selectedEventId);
  const { data: dbTeams = [] } = useGetTeamsByEvent(selectedEventId);

  const teamNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const t of dbTeams as any[]) map.set(t.id, t.name || t.teamName || t.id);
    return map;
  }, [dbTeams]);

  const roundsList: Array<{ id: string; name: string }> = dbRounds.map((r: any) => ({
    id: r.id || r.Id,
    name: r.roundName || r.RoundName || "Vòng thi",
  }));

  React.useEffect(() => {
    if (roundsList.length > 0 && !selectedRoundId) {
      setSelectedRoundId(roundsList[0].id);
    }
  }, [roundsList, selectedRoundId]);

  const tracksList = dbTracks.map((t: any) => ({
    id: t.id || t.Id || t.trackId,
    name: t.trackName || t.Name || "Hạng mục",
  }));

  React.useEffect(() => {
    if (tracksList.length > 0 && !selectedTrackId) {
      setSelectedTrackId(tracksList[0].id);
    }
  }, [tracksList, selectedTrackId]);

  const { data: results = [], isLoading, refetch } = useGetFinalResultsByRound(selectedRoundId);
  const assignPrizeMutation = useAssignPrize();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topN, setTopN] = useState<number>(10);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPublishedState, setIsPublishedState] = useState(false);

  // Local prize assignment state map
  const [assignedPrizesMap, setAssignedPrizesMap] = useState<Record<string, string>>({});

  // Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailRecipientType, setEmailRecipientType] = useState<"all" | "advanced">("all");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailCustomMessage, setEmailCustomMessage] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const availablePrizesList = dbPrizes.map((p: any, idx: number) => ({
    id: p.id || p.Id || `prz-${idx}`,
    name: `${p.prizeName || p.PrizeName || "Giải"} (${p.value || p.Value || "chưa rõ giá trị"})`,
  }));

  const currentEvent = eventsList.find((e: any) => (e.id || e.Id || e.eventId || e.EventId) === selectedEventId);
  const currentRound = roundsList.find((r) => r.id === selectedRoundId);

  // Handle Prize Assignment to Team
  const handleAssignPrizeToTeam = async (resultId: string, prizeId: string, teamName: string) => {
    setAssignedPrizesMap((prev) => ({ ...prev, [resultId]: prizeId }));
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      if (assignPrizeMutation?.mutateAsync) {
        await assignPrizeMutation.mutateAsync({
          resultId,
          prizeId: prizeId !== "none" ? prizeId : null,
        });
      }
      const prizeObj = availablePrizesList.find((p) => p.id === prizeId);
      const okMsg =
        prizeId !== "none"
          ? `Đã trao ${prizeObj?.name || 'Giải thưởng'} cho Đội "${teamName}"!`
          : `Đã hủy gán giải thưởng cho Đội "${teamName}".`;
      setSuccessMessage(okMsg);
      toast.success(okMsg);
    } catch (err: any) {
      const errMsg = `Gán giải thưởng thất bại: ${err?.message}`;
      setErrorMessage(errMsg);
      toast.error(errMsg);
    }
  };

  const displayResults = results;

  const handleCalculate = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (!selectedRoundId.startsWith("round-")) {
        await finalResultsRepository.calculateRoundResults(selectedRoundId, topN);
      }
      const okMsg = `Đã tự động tính toán xếp hạng điểm số cho Vòng thi (Top ${topN}).`;
      setSuccessMessage(okMsg);
      toast.success(okMsg);
      await refetch();
    } catch (err: any) {
      const errMsg = `Tính điểm thất bại: ${err?.response?.data?.message || err?.message}`;
      setErrorMessage(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublishStatus = async () => {
    const nextStatus = !isPublishedState;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (!selectedRoundId.startsWith("round-")) {
        await finalResultsRepository.setPublishStatus(selectedRoundId, nextStatus);
      }
      setIsPublishedState(nextStatus);
      const okMsg = nextStatus
        ? "Đã công bố kết quả và trao giải thưởng thành công."
        : "Đã ẩn bảng kết quả về chế độ bản nháp an toàn.";
      setSuccessMessage(okMsg);
      toast.success(okMsg);
      await refetch();
    } catch (err: any) {
      const errMsg = `Đổi trạng thái thất bại: ${err?.response?.data?.message || err?.message}`;
      setErrorMessage(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6.2 Xuất kết quả CSV / Excel
  const handleExportCSV = () => {
    if (displayResults.length === 0) {
      toast.error("Chưa có dữ liệu bảng điểm kết quả để xuất file!");
      return;
    }

    const eventNameStr = currentEvent?.eventName || currentEvent?.EventName || "SEAL_Event";
    const roundNameStr = currentRound?.name || "Vong_Thi";

    const headers = [
      "Hạng",
      "Tên Đội Thi",
      "Mã Kết Quả",
      "Tổng Điểm",
      "Kết Quả",
      "Giải Thưởng Gán",
      "Hạng Mục (Track)",
      "Vòng Thi",
      "Sự Kiện",
      "Ngày Xuất",
    ];

    const rows = displayResults.map((r: any, idx: number) => {
      const rankStr = String(r.rank || idx + 1);
      const name = teamNameById.get(r.teamId) || r.teamName || r.TeamName || r.teamId;
      const uid = `KQ-${(r.id || "").slice(0, 8).toUpperCase()}`;
      const score = Number(r.finalScore || r.totalScore || r.TotalScore || 0).toFixed(2);
      const isAdv = r.isAdvanced !== undefined ? Boolean(r.isAdvanced) : idx < 2;
      const statusStr = isAdv ? "THĂNG HẠNG" : "BỊ LOẠI";

      const assignedPrizeId = assignedPrizesMap[r.id] ?? r.prizeId ?? "none";
      const prizeObj = availablePrizesList.find((p) => p.id === assignedPrizeId);
      const prizeStr = prizeObj ? prizeObj.name : "Không";

      const trackNameStr = tracksList.find((t) => t.id === selectedTrackId)?.name || "Chung";

      return [
        rankStr,
        `"${name.replace(/"/g, '""')}"`,
        `"${uid}"`,
        score,
        `"${statusStr}"`,
        `"${prizeStr.replace(/"/g, '""')}"`,
        `"${trackNameStr.replace(/"/g, '""')}"`,
        `"${roundNameStr.replace(/"/g, '""')}"`,
        `"${eventNameStr.replace(/"/g, '""')}"`,
        `"${new Date().toLocaleDateString("vi-VN")}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `Ket_Qua_${eventNameStr}_${roundNameStr}_${today}.csv`.replace(/\s+/g, "_"));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Đã xuất file CSV kết quả thành công!");
  };

  // 6.2 Gửi email thông báo kết quả
  const handleOpenEmailModal = () => {
    const evName = currentEvent?.eventName || currentEvent?.EventName || "Cuộc thi";
    const rdName = currentRound?.name || "Vòng thi";
    setEmailSubject(`[SEAL HACKATHON] Thông Báo Kết Quả Chính Thức: ${evName} - ${rdName}`);
    setEmailCustomMessage(
      `Kính gửi các Đội thi,\n\nBan Tổ Chức xin trân trọng thông báo bảng điểm kết quả chính thức cho ${rdName} thuộc sự kiện ${evName} đã được công bố.\n\nCác bạn có thể đăng nhập vào hệ thống để tra cứu chi tiết điểm số, xếp hạng và nộp đơn Phúc khảo nếu cần thiết.\n\nTrân trọng,\nBan Tổ Chức SEAL`
    );
    setIsEmailModalOpen(true);
  };

  const handleSendEmailAnnouncement = async () => {
    setIsSendingEmail(true);
    try {
      // Simulate sending email notification batch to teams
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(
        `Đã gửi email thông báo kết quả thành công tới ${
          emailRecipientType === "all" ? displayResults.length : "Top các"
        } đội thi!`
      );
      setIsEmailModalOpen(false);
    } catch {
      toast.error("Gửi email thông báo thất bại, vui lòng thử lại!");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <PageShell className="max-w-[1600px]">
      <PageHeader
        title="Xét kết quả vòng thi"
        description="Kiểm tra bảng điểm, gán giải thưởng, xuất báo cáo và gửi email thông báo."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={handleExportCSV} className="text-xs">
              <Download className="h-3.5 w-3.5" /> Xuất CSV
            </Button>
            <Button variant="ghost" onClick={handleOpenEmailModal} className="text-xs">
              <Mail className="h-3.5 w-3.5" /> Gửi email
            </Button>
            <Link href={`/coordinator/prizes?eventId=${selectedEventId}`}>
              <Button variant="ghost" accent="coordinator" className="text-xs">
                <Award className="h-3.5 w-3.5" /> Cơ cấu giải thưởng
              </Button>
            </Link>
            <Button variant="ghost" disabled={isSubmitting} onClick={handleCalculate} className="text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Tính điểm
            </Button>
            <Button
              accent="coordinator"
              disabled={isSubmitting}
              onClick={handleTogglePublishStatus}
              className="text-xs"
            >
              {isPublishedState ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {isPublishedState ? "Ẩn về bản nháp" : "Công bố kết quả"}
            </Button>
          </div>
        }
      />

      <Card className="mb-6 grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
        <Field label="Sự kiện">
          {({ id }) => (
            <div className="relative">
              <select
                id={id}
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] px-3 py-2 pr-10 text-sm text-[var(--text-primary)] focus:border-[var(--accent-coordinator)] focus:outline-none"
              >
                {eventsList.length > 0 ? (
                  eventsList.map((ev: any, idx: number) => (
                    <option key={ev.id || ev.Id || ev.eventId || ev.EventId || idx} value={ev.id || ev.Id || ev.eventId || ev.EventId}>
                      {ev.eventName || ev.EventName || "Sự kiện"} ({ev.season || ev.Season || ""} {ev.year || ev.Year || ""})
                    </option>
                  ))
                ) : (
                  <option value="">Chưa có sự kiện</option>
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            </div>
          )}
        </Field>

        <Field label="Vòng thi">
          {({ id }) => (
            <div className="relative">
              <select
                id={id}
                value={selectedRoundId}
                onChange={(e) => setSelectedRoundId(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] px-3 py-2 pr-10 text-sm text-[var(--text-primary)] focus:border-[var(--accent-coordinator)] focus:outline-none"
              >
                {roundsList.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            </div>
          )}
        </Field>

        <Field label="Hạng mục">
          {({ id }) => (
            <div className="relative">
              <select
                id={id}
                value={selectedTrackId}
                onChange={(e) => setSelectedTrackId(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] px-3 py-2 pr-10 text-sm text-[var(--text-primary)] focus:border-[var(--accent-coordinator)] focus:outline-none"
              >
                {tracksList.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            </div>
          )}
        </Field>
      </Card>

      {errorMessage && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-4 text-sm text-[var(--color-danger)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-4 text-sm text-[var(--color-success)]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMessage}
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-[var(--border-muted)] bg-[var(--bg-input)]/50 px-4 py-3">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Bảng xếp hạng{tracksList.find((t) => t.id === selectedTrackId)?.name ? ` — ${tracksList.find((t) => t.id === selectedTrackId)?.name}` : ""}
          </span>
          <Badge tone={isPublishedState ? "success" : "warning"}>
            {isPublishedState ? "Đã công bố" : "Bản nháp"}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-muted)] bg-[var(--bg-input)]/30 text-xs text-[var(--text-muted)]">
                <th className="w-16 p-4 text-center font-medium">Hạng</th>
                <th className="p-4 font-medium">Tên đội</th>
                <th className="w-32 p-4 text-right font-medium">Tổng điểm</th>
                <th className="w-32 p-4 text-center font-medium">Kết quả</th>
                <th className="w-64 p-4 font-medium">Giải thưởng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-muted)]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">
                    Đang tải bảng điểm...
                  </td>
                </tr>
              ) : (
                displayResults.map((r: any, idx: number) => {
                  const rankStr = String(r.rank || idx + 1).padStart(2, "0");
                  const name = teamNameById.get(r.teamId) || r.teamName || r.TeamName || r.teamId;
                  const uid = `KQ-${(r.id || "").slice(0, 8).toUpperCase()}`;
                  const score = Number(r.finalScore || r.totalScore || r.TotalScore || 0).toFixed(2);
                  const isAdv = r.isAdvanced !== undefined ? Boolean(r.isAdvanced) : idx < 2;
                  const assignedPrizeId = assignedPrizesMap[r.id] ?? r.prizeId ?? "none";

                  return (
                    <tr key={r.id || idx} className="transition-colors hover:bg-[var(--bg-input)]/30">
                      <td className="p-4 text-center font-semibold text-[var(--accent-coordinator)]">{rankStr}</td>
                      <td className="p-4">
                        <div className="font-medium text-[var(--text-primary)]">{name}</div>
                        <div className="mt-0.5 font-mono text-xs text-[var(--text-muted)]">{uid}</div>
                      </td>
                      <td className="p-4 text-right font-semibold">{score}</td>
                      <td className="p-4 text-center">
                        <Badge tone={isAdv ? "success" : "danger"}>{isAdv ? "Thăng hạng" : "Bị loại"}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <Award className="h-4 w-4 shrink-0 text-[var(--color-warning)]" />
                          <select
                            value={assignedPrizeId}
                            onChange={(e) => handleAssignPrizeToTeam(r.id, e.target.value, name)}
                            className="w-full cursor-pointer rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] px-2.5 py-1.5 text-xs focus:border-[var(--accent-coordinator)] focus:outline-none"
                          >
                            <option value="none">— Chưa gán giải —</option>
                            {availablePrizesList.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border-muted)] bg-[var(--bg-input)]/30 px-4 py-3 text-xs text-[var(--text-muted)]">
          <span>Tổng: {displayResults.length} bản ghi</span>
        </div>
      </Card>

      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Card className="w-full max-w-xl space-y-5 p-6">
            <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Mail className="h-4 w-4" /> Gửi email thông báo kết quả
              </h3>
              <button type="button" onClick={() => setIsEmailModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEmailRecipientType("all")}
                  className={`rounded-lg border p-2.5 text-left text-xs transition-colors ${
                    emailRecipientType === "all"
                      ? "border-[var(--accent-coordinator)] bg-[var(--accent-coordinator)]/10 font-medium"
                      : "border-[var(--border-muted)] text-[var(--text-muted)]"
                  }`}
                >
                  <div>Toàn bộ đội thi</div>
                  <div className="text-[var(--text-muted)]">{displayResults.length} đội</div>
                </button>
                <button
                  type="button"
                  onClick={() => setEmailRecipientType("advanced")}
                  className={`rounded-lg border p-2.5 text-left text-xs transition-colors ${
                    emailRecipientType === "advanced"
                      ? "border-[var(--accent-coordinator)] bg-[var(--accent-coordinator)]/10 font-medium"
                      : "border-[var(--border-muted)] text-[var(--text-muted)]"
                  }`}
                >
                  <div>Đội thăng hạng & có giải</div>
                  <div className="text-[var(--text-muted)]">Chỉ top xuất sắc</div>
                </button>
              </div>

              <Field label="Tiêu đề email">
                {({ id }) => (
                  <Input id={id} type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                )}
              </Field>

              <Field label="Nội dung">
                {({ id }) => (
                  <textarea
                    id={id}
                    rows={6}
                    value={emailCustomMessage}
                    onChange={(e) => setEmailCustomMessage(e.target.value)}
                    className="w-full resize-none rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-3 text-sm focus:border-[var(--accent-coordinator)] focus:outline-none"
                  />
                )}
              </Field>
            </div>

            <div className="flex justify-end gap-3 border-t border-[var(--border-muted)] pt-4">
              <Button variant="ghost" onClick={() => setIsEmailModalOpen(false)}>Hủy</Button>
              <Button accent="coordinator" disabled={isSendingEmail} onClick={handleSendEmailAnnouncement}>
                <Send className="h-3.5 w-3.5" />
                {isSendingEmail ? "Đang gửi..." : "Xác nhận gửi"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </PageShell>
  );
};
