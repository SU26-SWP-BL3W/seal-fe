import React, { useState } from "react";
import { RoundFormState } from "@/viewModels/useCreateEventWizardViewModel";
import { Layers, Plus, Trash2, AlertTriangle, ArrowLeft, ArrowRight, Award, Clock, Calendar, CheckCircle2, Shield, Save } from "lucide-react";

interface ModernDateTimePickerFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  minDate?: string;
  maxDate?: string;
  referenceLabel?: string;
}

const ModernDateTimePickerField: React.FC<ModernDateTimePickerFieldProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  hasError = false,
  minDate,
  maxDate,
  referenceLabel,
}) => {
  const rawIso = value ? value.substring(0, 16) : "";
  const [datePart, timePart] = rawIso.split("T");

  const minDateStr = minDate ? minDate.substring(0, 10) : undefined;
  const maxDateStr = maxDate ? maxDate.substring(0, 10) : undefined;

  const handleDateChange = (newDate: string) => {
    const time = timePart || "23:59";
    onChange(newDate ? `${newDate}T${time}` : "");
  };

  const handleTimeChange = (newTime: string) => {
    const date = datePart || minDateStr || new Date().toISOString().substring(0, 10);
    onChange(`${date}T${newTime}`);
  };

  const applyPresetTime = (presetTime: string) => {
    const date = datePart || minDateStr || new Date().toISOString().substring(0, 10);
    onChange(`${date}T${presetTime}`);
  };

  const applyPresetDateDays = (days: number) => {
    const base = datePart ? new Date(datePart) : minDate ? new Date(minDate) : new Date();
    base.setDate(base.getDate() + days);
    const dateStr = base.toISOString().substring(0, 10);
    const time = timePart || "23:59";
    onChange(`${dateStr}T${time}`);
  };

  const applyMinDateMatch = () => {
    if (!minDate) return;
    const iso = minDate.includes("T") ? minDate.substring(0, 16) : `${minDate}T08:00`;
    onChange(iso);
  };

  return (
    <div className="space-y-1.5 font-mono text-xs">
      <div className="flex items-center justify-between">
        <label className="text-[#8a9ba8] tracking-wider block uppercase text-[11px] font-bold flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-[#8b5cf6]" />
          {label}
        </label>
        {rawIso && (
          <span className="text-[10px] text-[#00d9ff] font-bold flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#00d9ff]" />
            {datePart ? datePart.split("-").reverse().join("/") : ""} {timePart || "23:59"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={datePart || ""}
          min={minDateStr}
          max={maxDateStr}
          onChange={(e) => handleDateChange(e.target.value)}
          disabled={disabled}
          className={`[color-scheme:dark] flex-1 px-3 py-2 bg-[#0a0e10] border text-[#e1e7ec] text-xs font-mono focus:outline-none cursor-pointer ${
            hasError ? "border-[#ef4444]" : "border-[#263339] focus:border-[#8b5cf6]"
          }`}
        />

        <input
          type="time"
          value={timePart || "23:59"}
          onChange={(e) => handleTimeChange(e.target.value)}
          disabled={disabled}
          className={`[color-scheme:dark] w-28 px-2 py-2 bg-[#0a0e10] border text-[#00d9ff] font-bold text-xs font-mono focus:outline-none cursor-pointer ${
            hasError ? "border-[#ef4444]" : "border-[#263339] focus:border-[#8b5cf6]"
          }`}
        />
      </div>

      {(minDate || maxDate || referenceLabel) && (
        <div className="text-[10px] text-[#8a9ba8] flex flex-wrap items-center gap-1 pt-0.5">
          <span className="text-[9px] uppercase text-[#8b5cf6] font-bold">Khung hợp lệ:</span>
          <span className="text-zinc-300 font-bold">
            {minDateStr ? minDateStr.split("-").reverse().join("/") : "Bất kỳ"} → {maxDateStr ? maxDateStr.split("-").reverse().join("/") : "Bất kỳ"}
          </span>
          {referenceLabel && <span className="text-[#00d9ff]/80">({referenceLabel})</span>}
        </div>
      )}
    </div>
  );
};

interface Step2RoundConfigProps {
  rounds: RoundFormState[];
  onAddRound: () => void;
  onRemoveRound: (id: string) => void;
  onUpdateRound: (id: string, field: keyof RoundFormState, value: any) => void;
  onNext: () => void;
  onPrev: () => void;
  onSaveDraft?: () => void;
  isReadOnly?: boolean;
  eventStartDate?: string;
  eventEndDate?: string;
}

export const Step2RoundConfig: React.FC<Step2RoundConfigProps> = ({
  rounds,
  eventStartDate,
  eventEndDate,
  onAddRound,
  onRemoveRound,
  onUpdateRound,
  onNext,
  onPrev,
  onSaveDraft,
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
    if (raw === "none" || raw === "top:0") {
      return { mode: "none", value: 0 };
    }
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
    if (newMode === "none") {
      onUpdateRound(activeRound.id, "advancementRule", "none");
      return;
    }
    const defaultVal = newMode === "percent" ? 50 : newMode === "minScore" ? 7 : 10;
    onUpdateRound(activeRound.id, "advancementRule", `${newMode}:${defaultVal}`);
  };

  const handleRuleValueChange = (newVal: number) => {
    if (currentRuleMode === "none") return;
    onUpdateRound(activeRound.id, "advancementRule", `${currentRuleMode}:${newVal}`);
  };

  // Comprehensive Date Logic Validations
  const activeRoundIndex = rounds.findIndex((r) => r.id === activeRound.id);
  const prevRound = activeRoundIndex > 0 ? rounds[activeRoundIndex - 1] : null;
  const prevRoundEnd = prevRound?.scoringEndDate || prevRound?.endDate;

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

            {/* Modern HUD DateTime Pickers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0a0e10]/60 p-4 border border-[#263339]">
              <ModernDateTimePickerField
                label="NGÀY BẮT ĐẦU NỘP BÀI *"
                value={activeRound.startDate || ""}
                minDate={prevRoundEnd || eventStartDate}
                maxDate={eventEndDate}
                referenceLabel={prevRoundEnd ? `Sau ${prevRound?.roundName || "vòng trước"}` : "Sau khai mạc sự kiện"}
                onChange={(val) => onUpdateRound(activeRound.id, "startDate", val)}
                disabled={isReadOnly}
                hasError={hasDateError}
              />
              <ModernDateTimePickerField
                label="HẠN CHÓT NỘP BÀI *"
                value={activeRound.endDate || ""}
                minDate={activeRound.startDate || prevRoundEnd || eventStartDate}
                maxDate={eventEndDate}
                referenceLabel="Sau ngày bắt đầu nộp bài"
                onChange={(val) => onUpdateRound(activeRound.id, "endDate", val)}
                disabled={isReadOnly}
                hasError={hasDateError}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0a0e10]/60 p-4 border border-[#263339]">
              <ModernDateTimePickerField
                label="BẮT ĐẦU CHẤM ĐIỂM *"
                value={activeRound.scoringStartDate || ""}
                minDate={activeRound.endDate || activeRound.startDate || prevRoundEnd || eventStartDate}
                maxDate={eventEndDate}
                referenceLabel="Sau hạn chót nộp bài"
                onChange={(val) => onUpdateRound(activeRound.id, "scoringStartDate", val)}
                disabled={isReadOnly}
                hasError={hasDateError}
              />
              <ModernDateTimePickerField
                label="HẠN CHÓT CHẤM ĐIỂM *"
                value={activeRound.scoringEndDate || ""}
                minDate={activeRound.scoringStartDate || activeRound.endDate || activeRound.startDate || prevRoundEnd || eventStartDate}
                maxDate={eventEndDate}
                referenceLabel="Sau ngày bắt đầu chấm điểm"
                onChange={(val) => onUpdateRound(activeRound.id, "scoringEndDate", val)}
                disabled={isReadOnly}
                hasError={hasDateError}
              />
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

            {/* Intuitive Advancement Rule Selection & Non-Elimination Toggle */}
            <div className="space-y-3 pt-3 border-t border-[#263339]">
              <label className="text-[#8b5cf6] tracking-wider block uppercase font-bold text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#8b5cf6]" />
                  LUẬT THĂNG HẠNG VÒNG THI (ADVANCEMENT RULE)
                </span>
                <span className="text-[10px] text-[#8a9ba8] font-normal">
                  Mã Cấu Hình: <strong className="text-[#00d9ff] font-mono">{activeRound.advancementRule || "top:10"}</strong>
                </span>
              </label>

              {/* NON-ELIMINATION QUICK TOGGLE SWITCH */}
              <div className={`p-3 border flex items-center justify-between transition-colors ${
                currentRuleMode === "none" ? "bg-emerald-500/15 border-emerald-500/50" : "bg-[#0a0e10] border-[#263339]"
              }`}>
                <div className="space-y-0.5 pr-4">
                  <div className="font-bold text-xs text-[#e1e7ec] flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>VÒNG THI BẢO TOÀN (KHÔNG LOẠI ĐỘI NÀO)</span>
                  </div>
                  <p className="text-[11px] text-[#8a9ba8] leading-relaxed">
                    Bật công tắc này nếu đây là Vòng Chung Kết hoặc Vòng Đấu Bảo Toàn (tất cả các đội đều được giữ nguyên đi tiếp sang bước chốt giải).
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={currentRuleMode === "none"}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onUpdateRound(activeRound.id, "advancementRule", "none");
                      } else {
                        onUpdateRound(activeRound.id, "advancementRule", "top:10");
                      }
                    }}
                    disabled={isReadOnly}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#182024] peer-focus:outline-none border border-[#263339] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10b981]"></div>
                </label>
              </div>

              {/* Mode Selection Grid (Disabled/Hidden if non-elimination is checked) */}
              {currentRuleMode !== "none" ? (
                <>
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
                  </div>
                </>
              ) : (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>✓ ĐÃ BẬT VÒNG BẢO TOÀN (KHÔNG LOẠI ĐỘI — 0 ĐỘI BỊ LOẠI, TẤT CẢ ĐI TIẾP)</span>
                </div>
              )}
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
          <ArrowLeft className="w-4 h-4" /> <span>Quay lại Bước 1</span>
        </button>

        <div className="flex items-center gap-3">
          {onSaveDraft && (
            <button
              type="button"
              onClick={onSaveDraft}
              className="px-4 py-2 bg-[#13191c] border border-[#263339] hover:border-[#8b5cf6] text-[#8a9ba8] hover:text-[#e1e7ec] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4 text-[#8b5cf6]" />
              <span>LƯU BẢN NHÁP</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNext}
            className="px-6 py-2.5 bg-[#8b5cf6] hover:bg-purple-600 text-white font-bold flex items-center gap-1 cursor-pointer transition-colors uppercase"
          >
            <span>TIẾP TỤC BƯỚC 3: HẠNG MỤC THI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
