"use client";

import React from "react";
import { Button, Card, Badge, Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui";
import {
  BarChart2,
  RefreshCw,
  Download,
  Calculator,
} from "lucide-react";
import { useCoordinatorCalibrationViewModel } from "@/viewModels/coordinator/useCoordinatorCalibrationViewModel";

export function CoordinatorCalibrationView() {
  const { state, data, actions } = useCoordinatorCalibrationViewModel();

  const {
    activeTab,
    eventId,
    trackId,
    roundId,
    criteriaList,
    newCriteriaName,
    newMaxScore,
    newWeight,
    newDesc,
    isCalculating,
    isExporting,
    isLoading,
  } = state;

  const {
    myEvents,
    tracks,
    rounds,
    calibration,
  } = data;

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
              QUẢN LÝ TIÊU CHÍ &amp; HIỆU CHUẨN ĐIỂM (RUBRIC CENTER)
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)]">
              Kho tiêu chí RBL &amp; ma trận điểm chấm của Giám khảo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            disabled={isCalculating || !roundId}
            onClick={actions.handleCalculate}
            className="flex items-center gap-2 bg-[var(--accent-coordinator)] text-black font-bold hover:bg-purple-300 text-xs"
          >
            {isCalculating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Calculator className="w-3.5 h-3.5" />
            )}
            TÍNH ĐIỂM &amp; XẾP HẠNG &gt;
          </Button>
          <Button
            disabled={isExporting || !eventId}
            onClick={actions.handleExportCsv}
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
          onChange={(e) => { actions.setEventId(e.target.value); actions.setTrackId(""); actions.setRoundId(""); }}
          className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped"
        >
          {myEvents.map((ev: any) => {
            const id = actions.pickId(ev);
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
          onChange={(e) => actions.setTrackId(e.target.value)}
          className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped"
        >
          {tracks.map((t: any) => {
            const id = actions.pickId(t);
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
          onChange={(e) => actions.setRoundId(e.target.value)}
          className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped"
        >
          {rounds.map((r: any) => {
            const id = actions.pickId(r);
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
          onClick={() => actions.setActiveTab("criteria")}
          className={`px-5 py-3 font-bold border-b-2 transition-all uppercase flex items-center gap-2 ${
            activeTab === "criteria"
              ? "border-[var(--accent-judge)] text-[var(--accent-judge)] bg-[var(--accent-judge)]/10"
              : "border-transparent text-[var(--text-muted)] hover:text-white"
          }`}
        >
          <span>Kho Tiêu Chí Chấm Điểm ({criteriaList.length})</span>
        </button>
        <button
          onClick={() => actions.setActiveTab("calibration")}
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
                    onChange={(e) => actions.setNewCriteriaName(e.target.value)}
                    placeholder="VD: Tính Bảo Mật &amp; Mã Hóa Dữ Liệu..."
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped focus:outline-none focus:border-[var(--accent-judge)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Điểm tối đa</label>
                    <input
                      type="number"
                      value={newMaxScore}
                      onChange={(e) => actions.setNewMaxScore(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped text-center font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Trọng số (%)</label>
                    <input
                      type="number"
                      value={newWeight}
                      onChange={(e) => actions.setNewWeight(Number(e.target.value))}
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
                  onChange={(e) => actions.setNewDesc(e.target.value)}
                  placeholder="Ghi chú chi tiết cách Giám khảo đánh giá tiêu chí này..."
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped focus:outline-none focus:border-[var(--accent-judge)] resize-none"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={actions.handleAddCriteria}
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
                  onChange={(e) => actions.setTrackId(e.target.value)}
                  className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped cursor-pointer"
                >
                  {tracks.map((t: any) => {
                    const id = actions.pickId(t);
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
                <Button variant="ghost" onClick={() => actions.refetch()} className="text-xs flex items-center gap-2">
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
