"use client";

import React, { useState } from "react";
import { RoundFormState } from "@/viewModels/useCreateEventWizardViewModel";
import { Layers, Plus, Trash2, AlertTriangle, ArrowLeft, ArrowRight, Award } from "lucide-react";

interface Step2RoundConfigProps {
  rounds: RoundFormState[];
  onAddRound: () => void;
  onRemoveRound: (id: string) => void;
  onUpdateRound: (id: string, field: keyof RoundFormState, value: any) => void;
  onNext: () => void;
  onPrev: () => void;
  isReadOnly?: boolean;
}

export const Step2RoundConfig: React.FC<Step2RoundConfigProps> = ({
  rounds,
  onAddRound,
  onRemoveRound,
  onUpdateRound,
  onNext,
  onPrev,
  isReadOnly = false,
}) => {
  const [selectedRoundId, setSelectedRoundId] = useState<string>(rounds[0]?.id || "");

  const activeRound = rounds.find((r) => r.id === selectedRoundId) || rounds[0] || {
    id: "rnd-default",
    roundName: "Vòng Thi 1",
    roundNumber: 1,
    startDate: "",
    endDate: "",
    scoringStartDate: "",
    scoringEndDate: "",
    advancementRule: "top:10",
  };

  // Helper to parse advancementRule string (e.g. "top:10" => mode "top", num 10)
  const parseRule = (ruleStr?: string) => {
    const raw = (ruleStr || "top:10").trim();
    if (raw.startsWith("percent:")) {
      return { mode: "percent", value: Number(raw.replace("percent:", "")) || 50 };
    }
    if (raw.startsWith("minScore:")) {
      return { mode: "minScore", value: Number(raw.replace("minScore:", "")) || 7 };
    }
    return { mode: "top", value: Number(raw.replace("top:", "")) || 10 };
  };

  const { mode: currentRuleMode, value: currentRuleValue } = parseRule(activeRound.advancementRule);

  const handleRuleModeChange = (newMode: string) => {
    const defaultVal = newMode === "percent" ? 50 : newMode === "minScore" ? 7 : 10;
    onUpdateRound(activeRound.id, "advancementRule", `${newMode}:${defaultVal}`);
  };

  const handleRuleValueChange = (newVal: number) => {
    onUpdateRound(activeRound.id, "advancementRule", `${currentRuleMode}:${newVal}`);
  };

  // Comprehensive Date Logic Validations
  const activeRoundIndex = rounds.findIndex((r) => r.id === activeRound.id);
  const prevRound = activeRoundIndex > 0 ? rounds[activeRoundIndex - 1] : null;

  const dateErrors: string[] = [];

  if (activeRound.startDate && activeRound.endDate) {
    if (new Date(activeRound.startDate) > new Date(activeRound.endDate)) {
      dateErrors.push("Hạn chót nộp bài không được trước Ngày bắt đầu nộp bài!");
    }
  }

  if (activeRound.endDate && activeRound.scoringStartDate) {
    if (new Date(activeRound.scoringStartDate) < new Date(activeRound.endDate)) {
      dateErrors.push("Ngày bắt đầu chấm điểm phải diễn ra sau (hoặc cùng lúc với) Hạn chót nộp bài!");
    }
  }

  if (activeRound.scoringStartDate && activeRound.scoringEndDate) {
    if (new Date(activeRound.scoringEndDate) < new Date(activeRound.scoringStartDate)) {
      dateErrors.push("Hạn chót chấm điểm không được trước Ngày bắt đầu chấm điểm!");
    }
  }

  if (prevRound) {
    const prevEnd = prevRound.scoringEndDate || prevRound.endDate;
    if (activeRound.startDate && prevEnd && new Date(activeRound.startDate) < new Date(prevEnd)) {
      dateErrors.push(`Ngày bắt đầu của [${activeRound.roundName || `Vòng ${activeRoundIndex + 1}`}] phải diễn ra sau kết thúc của [${prevRound.roundName || `Vòng ${activeRoundIndex}`}]!`);
    }
  }

  const hasDateError = dateErrors.length > 0;

  // Advancement Rule Limit Validations across consecutive rounds
  const advancementErrors: string[] = [];
  const advancementWarnings: string[] = [];

  if (activeRoundIndex > 0 && prevRound) {
    const prevRule = parseRule(prevRound.advancementRule);
    const currRule = parseRule(activeRound.advancementRule);

    if (prevRule.mode === "top" && currRule.mode === "top") {
      if (currRule.value > prevRule.value) {
        advancementErrors.push(
          `Vòng [${activeRound.roundName || `Vòng ${activeRoundIndex + 1}`}] thăng hạng ${currRule.value} đội — KHÔNG THỂ LỚN HƠN số lượng đội vượt qua [${prevRound.roundName || `Vòng ${activeRoundIndex}`}] (${prevRule.value} đội)!`
        );
      } else if (currRule.value === prevRule.value) {
        advancementWarnings.push(
          `Số đội thăng hạng ở [${activeRound.roundName || `Vòng ${activeRoundIndex + 1}`}] bằng đúng số đội vượt qua [${prevRound.roundName || `Vòng ${activeRoundIndex}`}] (${currRule.value} đội). Không có đội nào bị loại ở vòng này.`
        );
      }
    }
  }

  const hasAdvancementError = advancementErrors.length > 0;

  return (
    <div className="space-y-6 text-[#e1e7ec]">
      {/* 2-Column Builder Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Editor (7 cols) */}
        <div className="lg:col-span-7 bg-[#13191c] border border-[#263339] p-6 space-y-5">
          <div className="border-b border-[#263339] pb-3 font-mono text-xs font-bold text-[#8b5cf6] tracking-widest uppercase flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#8b5cf6]" />
            <span>CẤU HÌNH CHI TIẾT VÒNG THI</span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="text-[#8a9ba8] tracking-wider block uppercase text-[11px]">TÊN VÒNG THI *</label>
              <input
                type="text"
                value={activeRound.roundName}
                onChange={(e) => onUpdateRound(activeRound.id, "roundName", e.target.value)}
                disabled={isReadOnly}
                className="w-full px-4 py-2.5 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-sans text-sm focus:outline-none focus:border-[#8b5cf6]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[#8a9ba8] tracking-wider block uppercase text-[11px]">NGÀY BẮT ĐẦU NỘP BÀI *</label>
                <input
                  type="datetime-local"
                  value={activeRound.startDate ? activeRound.startDate.substring(0, 16) : ""}
                  onChange={(e) => onUpdateRound(activeRound.id, "startDate", e.target.value)}
                  disabled={isReadOnly}
                  className={`[color-scheme:dark] w-full px-3 py-2 bg-[#0a0e10] border text-[#e1e7ec] text-xs focus:outline-none cursor-pointer ${
                    hasDateError ? "border-[#ef4444]" : "border-[#263339] focus:border-[#8b5cf6]"
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#8a9ba8] tracking-wider block uppercase text-[11px]">HẠN CHÓT NỘP BÀI *</label>
                <input
                  type="datetime-local"
                  value={activeRound.endDate ? activeRound.endDate.substring(0, 16) : ""}
                  onChange={(e) => onUpdateRound(activeRound.id, "endDate", e.target.value)}
                  disabled={isReadOnly}
                  className={`[color-scheme:dark] w-full px-3 py-2 bg-[#0a0e10] border text-[#e1e7ec] text-xs focus:outline-none cursor-pointer ${
                    hasDateError ? "border-[#ef4444]" : "border-[#263339] focus:border-[#8b5cf6]"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[#8a9ba8] tracking-wider block uppercase text-[11px]">BẮT ĐẦU CHẤM ĐIỂM *</label>
                <input
                  type="datetime-local"
                  value={activeRound.scoringStartDate ? activeRound.scoringStartDate.substring(0, 16) : ""}
                  onChange={(e) => onUpdateRound(activeRound.id, "scoringStartDate", e.target.value)}
                  disabled={isReadOnly}
                  className={`[color-scheme:dark] w-full px-3 py-2 bg-[#0a0e10] border text-[#e1e7ec] text-xs focus:outline-none cursor-pointer ${
                    hasDateError ? "border-[#ef4444]" : "border-[#263339] focus:border-[#8b5cf6]"
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#8a9ba8] tracking-wider block uppercase text-[11px]">HẠN CHÓT CHẤM ĐIỂM *</label>
                <input
                  type="datetime-local"
                  value={activeRound.scoringEndDate ? activeRound.scoringEndDate.substring(0, 16) : ""}
                  onChange={(e) => onUpdateRound(activeRound.id, "scoringEndDate", e.target.value)}
                  disabled={isReadOnly}
                  className={`[color-scheme:dark] w-full px-3 py-2 bg-[#0a0e10] border text-[#e1e7ec] text-xs focus:outline-none cursor-pointer ${
                    hasDateError ? "border-[#ef4444]" : "border-[#263339] focus:border-[#8b5cf6]"
                  }`}
                />
              </div>
            </div>

            {/* Red Error Banner displaying Date Constraint Errors */}
            {hasDateError && (
              <div className="p-3 bg-red-500/10 border border-[#ef4444]/40 text-[#ef4444] text-xs font-mono space-y-1">
                <div className="font-bold flex items-center gap-1.5 uppercase">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#ef4444]" />
                  <span>CẢNH BÁO VI PHẠM LOGIC THỜI GIAN VÒNG THI</span>
                </div>
                <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                  {dateErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Red Error Banner displaying Advancement Limit Errors */}
            {hasAdvancementError && (
              <div className="p-3 bg-red-500/10 border border-[#ef4444]/40 text-[#ef4444] text-xs font-mono space-y-1">
                <div className="font-bold flex items-center gap-1.5 uppercase">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#ef4444]" />
                  <span>CẢNH BÁO LOGIC SỐ LƯỢNG ĐỘI THĂNG HẠNG VÒNG THI</span>
                </div>
                <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                  {advancementErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Amber Warning Banner for non-eliminating round */}
            {!hasAdvancementError && advancementWarnings.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono space-y-1">
                <div className="font-bold flex items-center gap-1.5 uppercase">
                  <Award className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>THÔNG TIN QUY TRÌNH LOẠI ĐỘI VÒNG THI</span>
                </div>
                <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                  {advancementWarnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Intuitive Advancement Rule Selection (LUẬT THĂNG HẠNG CHUẨN ĐẸP) */}
            <div className="space-y-2 pt-2 border-t border-[#263339]">
              <label className="text-[#8b5cf6] tracking-wider block uppercase font-bold text-[11px] flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#8b5cf6]" />
                LUẬT THĂNG HẠNG VÒNG THI (ADVANCEMENT RULE)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Option 1: Top N Teams */}
                <button
                  type="button"
                  onClick={() => handleRuleModeChange("top")}
                  disabled={isReadOnly}
                  className={`p-3 border text-left flex flex-col justify-between space-y-1 transition-all cursor-pointer ${
                    currentRuleMode === "top"
                      ? "bg-[#8b5cf6]/15 border-[#8b5cf6] text-[#e1e7ec]"
                      : "bg-[#0a0e10] border-[#263339] text-[#8a9ba8] hover:border-[#8b5cf6]/50"
                  }`}
                >
                  <span className="font-bold text-xs uppercase">Top Số Lượng Đội</span>
                  <span className="text-[10px] text-[#8a9ba8]">Lấy N đội điểm cao nhất</span>
                </button>

                {/* Option 2: Top N Percent */}
                <button
                  type="button"
                  onClick={() => handleRuleModeChange("percent")}
                  disabled={isReadOnly}
                  className={`p-3 border text-left flex flex-col justify-between space-y-1 transition-all cursor-pointer ${
                    currentRuleMode === "percent"
                      ? "bg-[#8b5cf6]/15 border-[#8b5cf6] text-[#e1e7ec]"
                      : "bg-[#0a0e10] border-[#263339] text-[#8a9ba8] hover:border-[#8b5cf6]/50"
                  }`}
                >
                  <span className="font-bold text-xs uppercase">Top % Tỷ Lệ</span>
                  <span className="text-[10px] text-[#8a9ba8]">Lấy N% đội điểm cao nhất</span>
                </button>

                {/* Option 3: Min Score Threshold */}
                <button
                  type="button"
                  onClick={() => handleRuleModeChange("minScore")}
                  disabled={isReadOnly}
                  className={`p-3 border text-left flex flex-col justify-between space-y-1 transition-all cursor-pointer ${
                    currentRuleMode === "minScore"
                      ? "bg-[#8b5cf6]/15 border-[#8b5cf6] text-[#e1e7ec]"
                      : "bg-[#0a0e10] border-[#263339] text-[#8a9ba8] hover:border-[#8b5cf6]/50"
                  }`}
                >
                  <span className="font-bold text-xs uppercase">Điểm Sàn Tối Thiểu</span>
                  <span className="text-[10px] text-[#8a9ba8]">Đạt từ N điểm trở lên</span>
                </button>
              </div>

              {/* Number Value Input */}
              <div className="flex items-center gap-3 p-3 bg-[#0a0e10] border border-[#263339]">
                <span className="text-xs text-[#8a9ba8]">
                  {currentRuleMode === "top" && "Số lượng đội thăng hạng (N):"}
                  {currentRuleMode === "percent" && "Tỷ lệ thăng hạng % (N):"}
                  {currentRuleMode === "minScore" && "Điểm sàn tối thiểu (N):"}
                </span>
                <input
                  type="number"
                  min={1}
                  max={currentRuleMode === "percent" ? 100 : 500}
                  value={currentRuleValue}
                  onChange={(e) => handleRuleValueChange(Number(e.target.value))}
                  disabled={isReadOnly}
                  className="w-24 px-3 py-1 bg-[#13191c] border border-[#263339] text-[#00d9ff] font-mono text-sm font-bold focus:outline-none focus:border-[#8b5cf6]"
                />
                <span className="text-[11px] text-[#8b5cf6] font-bold">
                  MÃ HỆ THỐNG: [{activeRound.advancementRule}]
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Round List (5 cols) */}
        <div className="lg:col-span-5 bg-[#13191c] border border-[#263339] p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-[#263339] pb-3 font-mono text-xs font-bold text-[#8a9ba8] tracking-widest uppercase">
              DANH SÁCH VÒNG THI ({rounds.length})
            </div>

            <div className="space-y-3">
              {rounds.map((rnd, idx) => {
                const isSelected = rnd.id === activeRound.id;
                const rndDateErr =
                  rnd.startDate && rnd.endDate && new Date(rnd.startDate) > new Date(rnd.endDate);

                return (
                  <div
                    key={rnd.id}
                    onClick={() => setSelectedRoundId(rnd.id)}
                    className={`p-4 border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-[#182024] border-[#8b5cf6]"
                        : "bg-[#0a0e10] border-[#263339] hover:border-[#8a9ba8]"
                    }`}
                  >
                    <div>
                      <div className="font-sans font-bold text-sm text-[#e1e7ec] flex items-center gap-2">
                        <span>{rnd.roundName}</span>
                        {rndDateErr && <span className="text-[#ef4444] text-[10px] font-mono">(LỖI NGÀY)</span>}
                      </div>
                      <div className="font-mono text-[11px] text-[#8a9ba8] mt-1">
                        {rnd.startDate ? rnd.startDate.substring(0, 10) : "01/06/2026"} - {rnd.endDate ? rnd.endDate.substring(0, 10) : "15/06/2026"}
                      </div>
                    </div>

                    <div className="font-mono text-xs border border-[#263339] px-2.5 py-1 bg-[#0a0e10] text-[#8b5cf6] font-bold">
                      {rnd.advancementRule || "top:10"}
                    </div>
                  </div>
                );
              })}

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={onAddRound}
                  className="w-full py-2.5 border border-dashed border-[#263339] hover:border-[#8b5cf6] text-[#8a9ba8] hover:text-[#8b5cf6] font-mono text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>THÊM VÒNG THI MỚI</span>
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Actions Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-[#263339] font-mono text-xs">
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2 border border-[#263339] text-[#8a9ba8] hover:text-[#e1e7ec] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> &lt; Quay lại Bước 1
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 bg-[#8b5cf6] hover:bg-purple-600 text-white font-bold flex items-center gap-1 cursor-pointer transition-colors uppercase"
        >
          <span>TIẾP TỤC BƯỚC 3: HẠNG MỤC THI &gt;</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
