"use client";

import React from "react";
import { Button, Input, Card } from "@/components/ui";
import { TemplateCriteriaFormState } from "@/viewModels/useCreateEventWizardViewModel";
import { useGetCriterias } from "@/repositories/templatesRepository";
import { Sliders, Plus, Trash2, ArrowLeft, ArrowRight, AlertTriangle, CheckCircle2, Award } from "lucide-react";

interface Step4TemplateCriteriaEditorProps {
  tracks?: any[];
  templates?: any[];
  criteriasByTrack?: Record<string, TemplateCriteriaFormState[]>;
  onUpdateTrackCriterias?: (trackId: string, list: TemplateCriteriaFormState[]) => void;
  onApplyToAllTracks?: (list: TemplateCriteriaFormState[]) => void;
  templateName: string;
  onUpdateTemplateName: (name: string) => void;
  criterias: TemplateCriteriaFormState[];
  totalWeight: number;
  isValidWeight100: boolean;
  onAddCriteria: (obj?: Partial<TemplateCriteriaFormState>) => void;
  onRemoveCriteria: (index: number) => void;
  onUpdateCriteria: (index: number, field: keyof TemplateCriteriaFormState, value: any) => void;
  onNext: () => void;
  onPrev: () => void;
  isReadOnly?: boolean;
}

export const Step4TemplateCriteriaEditor: React.FC<Step4TemplateCriteriaEditorProps> = ({
  tracks = [],
  templates = [],
  criteriasByTrack = {},
  onUpdateTrackCriterias,
  onApplyToAllTracks,
  templateName,
  onUpdateTemplateName,
  criterias,
  totalWeight,
  isValidWeight100,
  onAddCriteria,
  onRemoveCriteria,
  onUpdateCriteria,
  onNext,
  onPrev,
  isReadOnly = false,
}) => {
  const { data: realCriteriaBank = [] } = useGetCriterias();
  const criteriaPresetList = realCriteriaBank;

  const [syncMessage, setSyncMessage] = React.useState<string | null>(null);
  const [saveStatus, setSaveStatus] = React.useState<Record<string, boolean>>({});

  // Render per-track cards if tracks exist
  const hasMultipleTracks = tracks.length > 0;

  // Calculate overall validity across all tracks
  const isAllTracksValid = hasMultipleTracks
    ? tracks.every((trk) => {
        const inheritedTpl = templates.find((t: any) => (t.id || t.Id || t.templateId || t.TemplateId) === trk.templateId);
        const defaultInitial = trk.templateId === "__custom__" ? [] : (inheritedTpl?.criterias ?? criterias);
        const list = criteriasByTrack[trk.id] ?? defaultInitial;
        const w = list.reduce((acc, c) => acc + (Number(c.weight) || 0), 0);
        return Math.abs(w - 100) < 0.01;
      })
    : isValidWeight100;

  return (
    <Card className="hud-glow-amber p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-4">
        <div>
          <h3 className="font-display font-bold text-lg text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[var(--accent-judge)]" />
            Bước 4: Thiết Lập Tiêu Chí & Trọng Số Chấm Điểm
          </h3>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
            Thiết lập bảng tiêu chí đánh giá RBL theo từng Hạng mục. Tổng trọng số mỗi hạng mục bắt buộc đạt ĐÚNG 100%.
          </p>
        </div>

        {/* Dynamic Weight Status Badge */}
        <div
          className={`px-4 py-2 border hud-clipped flex items-center gap-2 font-mono text-xs font-bold ${
            isAllTracksValid
              ? "bg-[rgba(16,185,129,0.1)] text-[var(--color-success)] border-[var(--color-success)]"
              : "bg-[rgba(239,68,68,0.15)] text-[var(--color-danger)] border-[var(--color-danger)]"
          }`}
        >
          {isAllTracksValid ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />
              <span>TỔNG TRỌNG SỐ: 100% (ĐẠT CHUẨN)</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-[var(--color-danger)] animate-pulse" />
              <span>CHƯA CÂN BẰNG ĐỦ 100% TRỌNG SỐ CHO MỌI HẠNG MỤC</span>
            </>
          )}
        </div>
      </div>

      {syncMessage && (
        <div className="p-3 bg-[rgba(6,182,212,0.1)] border border-cyan-500/40 text-cyan-300 font-mono text-xs rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Preset Pickers */}
      <div className="p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-2">
        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">
          Ngân hàng tiêu chí chuẩn từ SEAL (Bấm để thêm nhanh):
        </span>
        <div className="flex flex-wrap gap-2">
          {criteriaPresetList.map((item: any, idx: number) => {
            const cId = item.id || item.Id || item.criteriaId || item.CriteriaId || `crit-bank-${idx}`;
            const cName = item.criterionName || item.CriterionName || item.criteriaName || item.CriteriaName || "Tiêu chí";
            const cDesc = item.description || item.Description;
            const cWeight = item.weight || item.Weight || 20;
            const cMaxScore = item.maxScore || item.MaxScore || 10;

            return (
              <button
                key={cId}
                type="button"
                onClick={() => {
                  const newObj = {
                    criteriaId: cId,
                    criterionName: cName,
                    description: cDesc || "",
                    weight: cWeight,
                    maxScore: cMaxScore,
                  };
                  if (hasMultipleTracks && onUpdateTrackCriterias) {
                    tracks.forEach((trk) => {
                      const inheritedTpl = templates.find((t: any) => (t.id || t.Id || t.templateId || t.TemplateId) === trk.templateId);
                      const defaultInitial = trk.templateId === "__custom__" ? [] : (inheritedTpl?.criterias ?? criterias);
                      const cur = criteriasByTrack[trk.id] ?? defaultInitial;
                      onUpdateTrackCriterias(trk.id, [...cur, newObj]);
                    });
                  } else {
                    onAddCriteria(newObj);
                  }
                }}
                className="px-3 py-1 bg-[var(--bg-input)] hover:bg-[var(--accent-judge)]/10 text-[var(--text-primary)] hover:text-[var(--accent-judge)] border border-[var(--border-muted)] hover:border-[var(--accent-judge)] font-mono text-xs transition-colors hud-clipped flex items-center gap-1"
              >
                <Plus className="w-3 h-3 text-[var(--accent-judge)]" />
                + {cName} ({cWeight}%)
              </button>
            );
          })}
        </div>
      </div>

      {/* Per-Track Cards */}
      {hasMultipleTracks ? (
        <div className="space-y-6">
          {tracks.map((trk, trkIdx) => {
            const inheritedTpl = templates.find((t: any) => (t.id || t.Id || t.templateId || t.TemplateId) === trk.templateId);
            const defaultInitial = trk.templateId === "__custom__" ? [] : (inheritedTpl?.criterias ?? criterias);
            const trackCriterias = criteriasByTrack[trk.id] ?? defaultInitial;
            const trackWeight = trackCriterias.reduce((acc, c) => acc + (Number(c.weight) || 0), 0);
            const isTrackValid = Math.abs(trackWeight - 100) < 0.01;

            return (
              <div key={trk.id} className="p-5 bg-[var(--bg-panel)] border border-[var(--border-muted)] space-y-4 hud-clipped">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-muted)] pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[var(--accent-judge)]/10 text-[var(--accent-judge)] border border-[var(--accent-judge)]/30 font-mono text-xs font-bold">
                        Hạng mục #{trkIdx + 1}
                      </span>
                      <h4 className="font-mono font-bold text-sm text-[var(--text-primary)]">
                        {trk.trackName}
                      </h4>
                    </div>
                    {inheritedTpl ? (
                      <p className="text-xs font-mono text-[var(--color-success)] flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        Kế thừa từ mẫu: <strong>{inheritedTpl.templateName || inheritedTpl.TemplateName}</strong>
                      </p>
                    ) : (
                      <p className="text-xs font-mono text-[var(--text-muted)] italic">
                        Cấu hình tiêu chí tùy chỉnh (Custom Template)
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-mono text-xs font-bold px-3 py-1 border hud-clipped ${
                        isTrackValid
                          ? "text-[var(--color-success)] border-[var(--color-success)] bg-[rgba(16,185,129,0.1)]"
                          : trackWeight > 100
                          ? "text-[var(--color-danger)] border-[var(--color-danger)] bg-[rgba(239,68,68,0.15)]"
                          : "text-[var(--color-warning)] border-[var(--color-warning)] bg-[rgba(245,158,11,0.15)]"
                      }`}
                    >
                      Trọng số: {trackWeight}% / 100%{" "}
                      {isTrackValid
                        ? "✅ (Đạt chuẩn 100%)"
                        : trackWeight > 100
                        ? `🔴 (Vượt quá ${trackWeight - 100}%)`
                        : `⚠️ (Còn thiếu ${100 - trackWeight}%)`}
                    </span>

                    {trackCriterias.length > 0 && !isTrackValid && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          const count = trackCriterias.length;
                          const avg = Math.floor(100 / count);
                          const remainder = 100 - avg * count;
                          const autoBalanced = trackCriterias.map((item, i) => ({
                            ...item,
                            weight: i === 0 ? avg + remainder : avg,
                          }));
                          onUpdateTrackCriterias?.(trk.id, autoBalanced);
                        }}
                        className="text-xs font-mono text-amber-400 hover:text-amber-300 border border-amber-500/30"
                      >
                        ⚡ Tự động cân bằng 100%
                      </Button>
                    )}

                    {onApplyToAllTracks && tracks.length > 1 && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (!isTrackValid) return;
                          onApplyToAllTracks(trackCriterias);
                          setSyncMessage(`Đã sao chép toàn bộ tiêu chí của "${trk.trackName}" sang ${tracks.length - 1} Hạng mục còn lại!`);
                          setTimeout(() => setSyncMessage(null), 4000);
                        }}
                        disabled={!isTrackValid}
                        className="text-xs font-mono text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                        title={!isTrackValid ? "Cần đạt đúng 100% trọng số mới có thể đồng bộ sang hạng mục khác" : "Tự động sao chép bộ tiêu chí đang thiết lập này sang cho tất cả các Hạng mục còn lại trong sự kiện"}
                      >
                        📋 Đồng bộ cho mọi Hạng mục
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (!isTrackValid) return;
                        onUpdateTrackCriterias?.(trk.id, trackCriterias);
                        setSaveStatus((prev) => ({ ...prev, [trk.id]: true }));
                        setTimeout(() => {
                          setSaveStatus((prev) => ({ ...prev, [trk.id]: false }));
                        }, 3000);
                      }}
                      disabled={!isTrackValid}
                      className={`text-xs font-mono border transition-all ${
                        isTrackValid
                          ? "text-[var(--color-success)] border-[var(--color-success)]/40 hover:bg-[var(--color-success)]/10 cursor-pointer"
                          : "text-[var(--text-muted)] border-[var(--border-muted)] opacity-50 cursor-not-allowed"
                      }`}
                      title={!isTrackValid ? "Yêu cầu tổng trọng số phải đạt ĐÚNG 100% mới được phép lưu!" : "Lưu bộ tiêu chí cho hạng mục này"}
                    >
                      {saveStatus[trk.id] ? "✅ Đã lưu cấu hình!" : isTrackValid ? "💾 Lưu tiêu chí hạng mục" : "⚠️ Cần đủ 100% để lưu"}
                    </Button>
                  </div>
                </div>

                {/* Empty State Prompt if custom template has 0 criteria */}
                {trackCriterias.length === 0 && (
                  <div className="p-6 bg-[var(--bg-base)] border border-dashed border-[var(--border-muted)] rounded text-center space-y-3">
                    <p className="text-xs font-mono text-[var(--text-muted)]">
                      Hạng mục này đang chọn <strong>"Tự tạo mẫu tiêu chí mới"</strong> và chưa có tiêu chí nào.
                    </p>
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          const updated = [
                            { criterionName: "Tính đổi mới & sáng tạo", description: "Độ độc đáo của giải pháp", weight: 50, maxScore: 10, criteriaId: `crit-${Date.now()}` },
                            { criterionName: "Chất lượng sản phẩm & Đô thị thực chiến", description: "Mã nguồn và tính khả thi", weight: 50, maxScore: 10, criteriaId: `crit-${Date.now() + 1}` },
                          ];
                          onUpdateTrackCriterias?.(trk.id, updated);
                        }}
                        className="text-xs font-mono text-[var(--accent-judge)]"
                      >
                        + Tạo nhanh 2 tiêu chí mẫu (50% - 50%)
                      </Button>
                    </div>
                  </div>
                )}

                {/* List of criterias for this track */}
                <div className="space-y-3">
                  {trackCriterias.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-[var(--bg-base)] border-l-2 border-[var(--accent-judge)] border border-[var(--border-muted)] space-y-3 hud-clipped"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <Input
                          type="text"
                          value={item.criterionName}
                          onChange={(e) => {
                            const updated = [...trackCriterias];
                            updated[index] = { ...updated[index], criterionName: e.target.value };
                            onUpdateTrackCriterias?.(trk.id, updated);
                          }}
                          placeholder="Tên tiêu chí..."
                          className="font-mono font-bold text-sm text-[var(--accent-judge)] flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = trackCriterias.filter((_, i) => i !== index);
                            onUpdateTrackCriterias?.(trk.id, updated);
                          }}
                          className="text-xs font-mono text-[var(--color-danger)] hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Xóa
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Mô Tả Tiêu Chí</label>
                          <Input
                            type="text"
                            value={item.description}
                            onChange={(e) => {
                              const updated = [...trackCriterias];
                              updated[index] = { ...updated[index], description: e.target.value };
                              onUpdateTrackCriterias?.(trk.id, updated);
                            }}
                            placeholder="Mô tả chi tiết cách thức giám khảo chấm..."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Trọng Số (%)</label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={item.weight}
                              onChange={(e) => {
                                const updated = [...trackCriterias];
                                updated[index] = { ...updated[index], weight: Number(e.target.value) || 0 };
                                onUpdateTrackCriterias?.(trk.id, updated);
                              }}
                              className="font-mono font-bold text-center text-[var(--accent-judge)]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Điểm Tối Đa</label>
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              value={item.maxScore}
                              onChange={(e) => {
                                const updated = [...trackCriterias];
                                updated[index] = { ...updated[index], maxScore: Number(e.target.value) || 10 };
                                onUpdateTrackCriterias?.(trk.id, updated);
                              }}
                              className="font-mono font-bold text-center text-[var(--text-primary)]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="ghost"
                    onClick={() => {
                      const updated = [
                        ...trackCriterias,
                        { criterionName: "Tiêu chí chấm điểm mới", description: "", weight: 10, maxScore: 10, criteriaId: `crit-${Date.now()}` },
                      ];
                      onUpdateTrackCriterias?.(trk.id, updated);
                    }}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Thêm tiêu chí cho {trk.trackName}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Single template fallback */
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
              Tên Mẫu Tiêu Chí (Template Name)
            </label>
            <Input
              type="text"
              value={templateName}
              onChange={(e) => onUpdateTemplateName(e.target.value)}
              placeholder="e.g. Mẫu Đánh Giá Hackathon SEAL 2026"
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <h4 className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Danh Sách Tiêu Chí Chấm Điểm ({criterias.length})
            </h4>
            <Button
              variant="ghost"
              onClick={() =>
                onAddCriteria({
                  criterionName: "Tiêu chí chấm điểm mới",
                  weight: 10,
                  maxScore: 10,
                })
              }
              className="flex items-center gap-1 text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> + Thêm Tiêu Chí Tùy Chỉnh
            </Button>
          </div>

          <div className="space-y-3">
            {criterias.map((item, index) => (
              <div
                key={index}
                className="p-4 bg-[var(--bg-panel)] border-l-2 border-[var(--accent-judge)] border border-[var(--border-muted)] space-y-3 hud-clipped"
              >
                <div className="flex items-center justify-between gap-4">
                  <Input
                    type="text"
                    value={item.criterionName}
                    onChange={(e) => onUpdateCriteria(index, "criterionName", e.target.value)}
                    placeholder="Tên tiêu chí..."
                    className="font-mono font-bold text-sm text-[var(--accent-judge)] flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveCriteria(index)}
                    className="text-xs font-mono text-[var(--color-danger)] hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Mô Tả Tiêu Chí</label>
                    <Input
                      type="text"
                      value={item.description}
                      onChange={(e) => onUpdateCriteria(index, "description", e.target.value)}
                      placeholder="Mô tả chi tiết cách thức giám khảo chấm..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Trọng Số (Weight %)</label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={item.weight}
                        onChange={(e) => onUpdateCriteria(index, "weight", e.target.value)}
                        className="font-mono font-bold text-center text-[var(--accent-judge)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Điểm Tối Đa (MaxScore)</label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={item.maxScore}
                        onChange={(e) => onUpdateCriteria(index, "maxScore", e.target.value)}
                        className="font-mono font-bold text-center text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--border-muted)]">
        <Button variant="ghost" onClick={onPrev} className="flex items-center gap-2 text-xs font-mono">
          <ArrowLeft className="w-4 h-4" /> &lt; Quay Lại Bước 3
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setSyncMessage("✅ Đã lưu tạm cấu hình Mẫu tiêu chí thành công!");
              setTimeout(() => setSyncMessage(null), 4000);
            }}
            disabled={!isAllTracksValid}
            className="text-xs font-mono flex items-center gap-1.5"
          >
            💾 Lưu Tạm Cấu Hình
          </Button>

          <Button
            variant="primary"
            onClick={onNext}
            disabled={!isAllTracksValid}
            className="flex items-center gap-2 text-xs font-mono"
          >
            {!isAllTracksValid ? "Yêu Cầu Đủ 100% Cho Mọi Hạng Mục" : "💾 Lưu & Sang Bước 5: Phân Công Nhân Sự >"}
          </Button>
        </div>
      </div>
    </Card>
  );
};
