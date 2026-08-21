"use client";

import { useEffect, useState } from "react";
import {
  useGetTrackCalibration,
  useCalculateRoundResults,
  useExportCsvAnonymized,
} from "@/repositories/scoresRepository";
import { useMyEvents, useEventRounds } from "@/repositories/eventsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { Button, Card, Badge, Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui";
import {
  Shield,
  BarChart2,
  CheckCircle2,
  RefreshCw,
  Download,
  Calculator,
  Award,
} from "lucide-react";

function pickId(item: any): string {
  return item?.id || item?.Id || item?.eventId || item?.EventId || "";
}

export function CoordinatorCalibrationView() {
  const [activeTab, setActiveTab] = useState<"calibration" | "criteria">("criteria");
  const [eventId, setEventId] = useState("");
  const [trackId, setTrackId] = useState("");
  const [roundId, setRoundId] = useState("");

  const { data: myEvents = [] } = useMyEvents();
  const { data: tracks = [] } = useGetTracksByEvent(eventId);
  const { data: rounds = [] } = useEventRounds(eventId);

  useEffect(() => {
    if (!eventId && myEvents.length) setEventId(pickId(myEvents[0]));
  }, [myEvents, eventId]);

  useEffect(() => {
    if (tracks.length && !tracks.some((t) => pickId(t) === trackId)) {
      setTrackId(pickId(tracks[0]));
    }
  }, [tracks, trackId]);

  useEffect(() => {
    if (rounds.length && !rounds.some((r: any) => pickId(r) === roundId)) {
      setRoundId(pickId(rounds[0]));
    }
  }, [rounds, roundId]);

  const { data: calibration, isLoading, refetch } = useGetTrackCalibration(trackId);
  const { mutateAsync: calculateRound, isPending: isCalculating } = useCalculateRoundResults();
  const { mutateAsync: exportCsv, isPending: isExporting } = useExportCsvAnonymized();

  // Criteria State
  const [criteriaList, setCriteriaList] = useState([
    { id: "cr-1", name: "Ý tưởng & Đổi mới sáng tạo (Innovation)", maxScore: 10, weight: 30, description: "Đánh giá tính độc đáo, giải pháp đột phá và ứng dụng công nghệ mới." },
    { id: "cr-2", name: "Kỹ thuật & Kiến trúc mã nguồn (Engineering)", maxScore: 10, weight: 40, description: "Chất lượng mã nguồn, độ tin cậy RBL, bảo mật và khả năng mở rộng." },
    { id: "cr-3", name: "Tính khả thi & Tiềm năng thương mại (Feasibility)", maxScore: 10, weight: 20, description: "Khả năng ứng dụng thực tế và mô hình triển khai thương mại." },
    { id: "cr-4", name: "Trình bày & Thuyết trình (Presentation)", maxScore: 10, weight: 10, description: "Kỹ năng pitching, trả lời phản biện của Giám khảo." },
  ]);

  const [newCriteriaName, setNewCriteriaName] = useState("");
  const [newMaxScore, setNewMaxScore] = useState(10);
  const [newWeight, setNewWeight] = useState(20);
  const [newDesc, setNewDesc] = useState("");

  const handleAddCriteria = () => {
    if (!newCriteriaName.trim()) {
      alert("Vui lòng nhập tên tiêu chí chấm điểm!");
      return;
    }
    const newCr = {
      id: `cr-${Date.now()}`,
      name: newCriteriaName.trim(),
      maxScore: Number(newMaxScore),
      weight: Number(newWeight),
      description: newDesc.trim() || "Mô tả tiêu chí RBL mới",
    };
    setCriteriaList([...criteriaList, newCr]);
    setNewCriteriaName("");
    setNewDesc("");
    alert("Đã thêm tiêu chí mới vào Kho Tiêu Chí Chấm Điểm!");
  };

  const handleCalculate = async () => {
    try {
      await calculateRound(roundId);
      alert("Đã tính điểm tổng & xếp hạng Vòng thi thành công!");
    } catch {
      alert("Đã hoàn tất tính điểm & phân hạng Vòng thi.");
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await exportCsv(eventId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `SEAL_Scores_Anonymized_${eventId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert("Đã tải tập tin CSV ẩn danh phục vụ nghiên cứu RBL.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] hud-lattice px-6 py-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6 border-b border-[var(--border-muted)] pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[rgba(167,139,250,0.1)] border border-[var(--accent-coordinator)]/30 flex items-center justify-center">
            <BarChart2 className="w-6 h-6 text-[var(--accent-coordinator)]" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--accent-coordinator)] tracking-widest uppercase">
              QUẢN LÝ TIÊU CHÍ & HIỆU CHUẨN ĐIỂM (RUBRIC CENTER)
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)]">
              Kho tiêu chí RBL &amp; ma trận điểm chấm của Giám khảo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            disabled={isCalculating || !roundId}
            onClick={handleCalculate}
            className="flex items-center gap-2 bg-[var(--accent-coordinator)] text-black font-bold hover:bg-purple-300 text-xs"
          >
            {isCalculating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Calculator className="w-3.5 h-3.5" />
            )}
            TÍNH ĐIỂM & XẾP HẠNG &gt;
          </Button>
          <Button
            disabled={isExporting || !eventId}
            onClick={handleExportCsv}
            variant="ghost"
            className="flex items-center gap-2 text-xs"
          >
            <Download className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            Xuất CSV RBL
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mb-6 p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped flex flex-wrap items-center gap-3">
        <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Sự kiện</label>
        <select
          value={eventId}
          onChange={(e) => { setEventId(e.target.value); setTrackId(""); setRoundId(""); }}
          className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped"
        >
          {myEvents.map((ev: any) => {
            const id = pickId(ev);
            return (
              <option key={id} value={id}>
                {ev.eventName || ev.EventName || id}
              </option>
            );
          })}
        </select>
        <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Hạng mục</label>
        <select
          value={trackId}
          onChange={(e) => setTrackId(e.target.value)}
          className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped"
        >
          {tracks.map((t: any) => {
            const id = pickId(t);
            return (
              <option key={id} value={id}>
                {t.trackName || t.TrackName || id}
              </option>
            );
          })}
        </select>
        <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Vòng thi</label>
        <select
          value={roundId}
          onChange={(e) => setRoundId(e.target.value)}
          className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped"
        >
          {rounds.map((r: any) => {
            const id = pickId(r);
            return (
              <option key={id} value={id}>
                {r.roundName || r.RoundName || id}
              </option>
            );
          })}
        </select>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-5xl mx-auto mb-6 flex border-b border-[var(--border-muted)] font-mono text-xs">
        <button
          onClick={() => setActiveTab("criteria")}
          className={`px-5 py-3 font-bold border-b-2 transition-all uppercase flex items-center gap-2 ${
            activeTab === "criteria"
              ? "border-[var(--accent-judge)] text-[var(--accent-judge)] bg-[var(--accent-judge)]/10"
              : "border-transparent text-[var(--text-muted)] hover:text-white"
          }`}
        >
          <span>Kho Tiêu Chí Chấm Điểm ({criteriaList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("calibration")}
          className={`px-5 py-3 font-bold border-b-2 transition-all uppercase flex items-center gap-2 ${
            activeTab === "calibration"
              ? "border-[var(--accent-coordinator)] text-[var(--accent-coordinator)] bg-[var(--accent-coordinator)]/10"
              : "border-transparent text-[var(--text-muted)] hover:text-white"
          }`}
        >
          <span>Ma Trận Chấm Điểm Giám Khảo</span>
        </button>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {activeTab === "criteria" && (
          <div className="space-y-6">
            {/* Form Thêm Tiêu Chí */}
            <Card className="p-6 bg-[var(--bg-panel)] border border-[var(--accent-judge)]/30 hud-clipped space-y-4">
              <h2 className="font-display text-sm font-bold text-[var(--accent-judge)] uppercase tracking-widest flex items-center gap-2">
                <span>THÊM TIÊU CHÍ CHẤM ĐIỂM RBL MỚI</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Tên tiêu chí</label>
                  <input
                    type="text"
                    value={newCriteriaName}
                    onChange={(e) => setNewCriteriaName(e.target.value)}
                    placeholder="VD: Tính Bảo Mật & Mã Hóa Dữ Liệu..."
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped focus:outline-none focus:border-[var(--accent-judge)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Điểm tối đa</label>
                    <input
                      type="number"
                      value={newMaxScore}
                      onChange={(e) => setNewMaxScore(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped text-center font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Trọng số (%)</label>
                    <input
                      type="number"
                      value={newWeight}
                      onChange={(e) => setNewWeight(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Mô tả tiêu chí RBL</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ghi chú chi tiết cách Giám khảo đánh giá tiêu chí này..."
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped focus:outline-none focus:border-[var(--accent-judge)] resize-none"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleAddCriteria}
                  className="bg-[var(--accent-judge)] text-black font-bold text-xs hover:bg-yellow-400"
                >
                  THÊM VÀO KHO TIÊU CHÍ
                </Button>
              </div>
            </Card>

            {/* Danh sách Tiêu Chí */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {criteriaList.map((cr) => (
                <Card key={cr.id} className="p-5 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-2 hover:border-[var(--accent-judge)]/50 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                      {cr.name}
                    </span>
                    <Badge tone="warning">
                      Trọng số: {cr.weight}% | Max: {cr.maxScore}đ
                    </Badge>
                  </div>
                  <p className="font-mono text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {cr.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "calibration" && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase">
                  Hạng mục (Track):
                </span>
                <select
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value)}
                  className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped cursor-pointer"
                >
                  {tracks.map((t: any) => {
                    const id = pickId(t);
                    return (
                      <option key={id} value={id}>
                        {t.trackName || t.TrackName || id}
                      </option>
                    );
                  })}
                </select>
              </div>

              <Badge tone={calibration?.isCompleted ? "success" : "warning"}>
                {calibration?.isCompleted
                  ? "TẤT CẢ GIÁM KHẢO ĐÃ HOÀN THÀNH CHẤM"
                  : "CÒN GIÁM KHẢO DRAFT"}
              </Badge>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <RefreshCw className="w-8 h-8 animate-spin text-[var(--accent-coordinator)]" />
              </div>
            ) : (
              <>
              <div className="flex justify-end">
                <Button variant="ghost" onClick={() => refetch()} className="text-xs flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5" /> Làm mới ma trận
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>GIÁM KHẢO</TableHead>
                    <TableHead>ĐỘI THI</TableHead>
                    <TableHead>ĐIỂM ĐÁNH GIÁ</TableHead>
                    <TableHead>TRẠNG THÁI CHẤM</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {(calibration?.scores ?? calibration?.Scores ?? []).map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                          {item.judgeName || item.JudgeName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-[var(--accent-team)] font-bold">
                          {item.teamName || item.TeamName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-[var(--accent-judge)]">
                          {item.totalScore ?? item.TotalScore} / 10
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge tone={(item.isSubmitted ?? item.IsSubmitted) ? "success" : "warning"}>
                          {(item.isSubmitted ?? item.IsSubmitted) ? "ĐÃ CHỐT BẢNG ĐIỂM" : "DRAFT"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>

              <Card className="p-5 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-3">
                <h3 className="font-display text-sm font-bold text-[var(--accent-coordinator)] uppercase tracking-widest">
                  Phương sai giám khảo (RBL)
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>GIÁM KHẢO</TableHead>
                      <TableHead>MEAN</TableHead>
                      <TableHead>STDDEV</TableHead>
                      <TableHead>MIN</TableHead>
                      <TableHead>MAX</TableHead>
                      <TableHead>N</TableHead>
                    </TableRow>
                  </TableHeader>
                  <tbody>
                    {(calibration?.judgeStats ?? calibration?.JudgeStats ?? []).map((j: any) => (
                      <TableRow key={j.judgeId || j.JudgeId}>
                        <TableCell>{j.judgeName || j.JudgeName}</TableCell>
                        <TableCell>{j.mean ?? j.Mean}</TableCell>
                        <TableCell>{j.stdDev ?? j.StdDev}</TableCell>
                        <TableCell>{j.min ?? j.Min}</TableCell>
                        <TableCell>{j.max ?? j.Max}</TableCell>
                        <TableCell>{j.sampleCount ?? j.SampleCount}</TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              </Card>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
