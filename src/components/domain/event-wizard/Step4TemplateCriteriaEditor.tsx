"use client";

import React, { useState } from "react";
import { TemplateCriteriaFormState, TrackFormState } from "@/viewModels/useCreateEventWizardViewModel";
import { templatesRepository, getStoredCustomTemplates, saveStoredCustomTemplates } from "@/repositories/templatesRepository";
import { AlertTriangle, Plus, X, Sliders, ArrowLeft, ArrowRight, CheckCircle2, Save, Layers, Lock, Edit3, ShieldCheck, BookmarkPlus, Copy } from "lucide-react";

interface Step4TemplateCriteriaEditorProps {
  tracks?: TrackFormState[];
  templates?: any[];
  criteriasByTrack?: Record<string, TemplateCriteriaFormState[]>;
  onUpdateTrackCriterias?: (trackId: string, list: TemplateCriteriaFormState[]) => void;
  onUpdateTrack?: (id: string, field: keyof TrackFormState, value: any) => void;
  onApplyToAllTracks?: (list: TemplateCriteriaFormState[]) => void;
  templateName?: string;
  onUpdateTemplateName?: (name: string) => void;
  criterias: TemplateCriteriaFormState[];
  totalWeight: number;
  isValidWeight100: boolean;
  onAddCriteria: (obj?: Partial<TemplateCriteriaFormState>) => void;
  onRemoveCriteria: (index: number) => void;
  onUpdateCriteria: (index: number, field: keyof TemplateCriteriaFormState, value: any) => void;
  onNext: () => void;
  onPrev: () => void;
  onSaveDraft?: () => void;
  isReadOnly?: boolean;
}

export const Step4TemplateCriteriaEditor: React.FC<Step4TemplateCriteriaEditorProps> = ({
  tracks = [],
  templates = [],
  criteriasByTrack = {},
  onUpdateTrackCriterias,
  onUpdateTrack,
  onApplyToAllTracks,
  templateName = "",
  onUpdateTemplateName,
  criterias,
  totalWeight,
  isValidWeight100,
  onAddCriteria,
  onRemoveCriteria,
  onUpdateCriteria,
  onNext,
  onPrev,
  onSaveDraft,
  isReadOnly = false,
}) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string>(tracks[0]?.id || "");
  const [saveToBankToggleMap, setSaveToBankToggleMap] = useState<Record<string, boolean>>({});

  const activeTrack = tracks.find((t) => t.id === selectedTrackId) || tracks[0];

  // Check if active track is using an existing system template vs custom
  const selectedTemplate = templates.find(
    (t: any) => (t.id || t.Id || t.templateId || t.TemplateId) === activeTrack?.templateId
  );

  const isInheritedTemplate = Boolean(selectedTemplate && activeTrack?.templateId !== "__custom__");

  // Toggle state for saving custom rubric to template bank (DEFAULT: OFF = false)
  const saveToBank = activeTrack ? (saveToBankToggleMap[activeTrack.id] ?? false) : false;
  const toggleSaveToBank = () => {
    if (activeTrack) {
      setSaveToBankToggleMap((prev) => ({ ...prev, [activeTrack.id]: !saveToBank }));
    }
  };

  const [bankSaveSuccess, setBankSaveSuccess] = useState<string | null>(null);

  // Active track's criteria list
  const activeCriteriaList = isInheritedTemplate && selectedTemplate?.criterias?.length
    ? selectedTemplate.criterias.map((c: any, idx: number) => ({
        criteriaId: c.criteriaId || c.CriteriaId || `crit-sys-${idx}`,
        criterionName: c.criterionName || c.CriterionName || c.name || "Tiêu chí hệ thống",
        description: c.description || c.Description || "",
        weight: c.weight || c.Weight || 30,
        maxScore: c.maxScore || c.MaxScore || 10,
      }))
    : activeTrack && criteriasByTrack[activeTrack.id]
    ? criteriasByTrack[activeTrack.id]
    : criterias;

  const activeTotalWeight = activeCriteriaList.reduce((acc: number, c: any) => acc + (Number(c.weight) || 0), 0);
  const activeIsValidWeight100 = Math.abs(activeTotalWeight - 100) < 0.01;
  const missingWeight = 100 - activeTotalWeight;

  const handleSaveTemplateToBankNow = async () => {
    if (!activeIsValidWeight100) {
      alert(`Tổng trọng số của Hạng mục phải bằng ĐÚNG 100%! (Hiện tại: ${activeTotalWeight}%).`);
      return;
    }
    const tName = templateName?.trim() || `Bộ tiêu chí ${activeTrack?.trackName || "Custom"} 2026`;
    const newTemplateObj = {
      id: `tpl-${Date.now()}`,
      templateName: tName,
      description: `Bộ tiêu chí soạn thảo trực tiếp tại Wizard cho Hạng mục ${activeTrack?.trackName || ""}.`,
      createdTime: new Date().toISOString(),
      lastUpdatedTime: new Date().toISOString(),
      criterias: activeCriteriaList.map((c: any, idx: number) => ({
        criteriaId: c.criteriaId || `crit-${Date.now()}-${idx}`,
        criterionName: c.criterionName || "Tiêu chí",
        description: c.description || "",
        weight: Number(c.weight) || 0,
        maxScore: Number(c.maxScore) || 10,
      })),
    };

    // Store in local storage with full component criterias so it shows in Kho Tiêu Chí
    const stored = getStoredCustomTemplates();
    saveStoredCustomTemplates([newTemplateObj, ...stored]);

    try {
      if (templatesRepository?.createTemplate) {
        await templatesRepository.createTemplate({
          templateName: tName,
          description: newTemplateObj.description,
        });
      }
    } catch {
      // ignore
    }

    setBankSaveSuccess(`Đã lưu thành công bộ tiêu chí "${tName}" với ${activeCriteriaList.length} tiêu chí thành phần vào Kho!`);
    setTimeout(() => setBankSaveSuccess(null), 4500);
  };

  // Clone System Template for THIS event only (protect original template in bank)
  const handleCustomizeTemplateForEvent = () => {
    if (!activeTrack || !selectedTemplate) return;
    const clonedCriterias: TemplateCriteriaFormState[] = (selectedTemplate.criterias || []).map((c: any, idx: number) => ({
      criteriaId: `crit-cloned-${Date.now()}-${idx}`,
      criterionName: c.criterionName || c.CriterionName || c.name || "Tiêu chí",
      description: c.description || c.Description || "",
      weight: Number(c.weight || c.Weight || 20),
      maxScore: Number(c.maxScore || c.MaxScore || 10),
    }));

    if (onUpdateTrackCriterias) {
      onUpdateTrackCriterias(activeTrack.id, clonedCriterias);
    }

    // Switch track to custom mode via immutability callback
    if (onUpdateTrack) {
      onUpdateTrack(activeTrack.id, "templateId", "__custom__");
    }

    setBankSaveSuccess(`Đã sao chép bộ tiêu chí "${selectedTemplate.templateName}" vào sự kiện! Bạn có thể tự do chỉnh sửa tiêu chí cho riêng sự kiện này mà không làm ảnh hưởng đến bản gốc trong Kho.`);
    setTimeout(() => setBankSaveSuccess(null), 4500);
  };

  const handleUpdateActiveCriteria = (index: number, field: keyof TemplateCriteriaFormState, value: any) => {
    if (activeTrack && onUpdateTrackCriterias) {
      const nextList = [...activeCriteriaList];
      nextList[index] = { ...nextList[index], [field]: field === "weight" || field === "maxScore" ? Number(value) : value };
      onUpdateTrackCriterias(activeTrack.id, nextList);
    } else {
      onUpdateCriteria(index, field, value);
    }
  };

  const handleAddActiveCriteria = () => {
    const newItem: TemplateCriteriaFormState = {
      criteriaId: `crit-${Date.now()}`,
      criterionName: "Tiêu chí chấm mới",
      description: "",
      weight: 10,
      maxScore: 10,
    };
    if (activeTrack && onUpdateTrackCriterias) {
      onUpdateTrackCriterias(activeTrack.id, [...activeCriteriaList, newItem]);
    } else {
      onAddCriteria(newItem);
    }
  };

  const handleRemoveActiveCriteria = (index: number) => {
    if (activeTrack && onUpdateTrackCriterias) {
      const nextList = activeCriteriaList.filter((_: any, i: number) => i !== index);
      onUpdateTrackCriterias(activeTrack.id, nextList);
    } else {
      onRemoveCriteria(index);
    }
  };

  return (
    <div className="space-y-6 bg-[#13191c] border border-[#263339] p-6 text-[#e1e7ec]">
      
      {/* Header */}
      <div className="border-b border-[#263339] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-mono font-bold text-lg text-[#e1e7ec] uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#8b5cf6]" />
            Bước 4: Soạn Thảo Tiêu Chí Chấm Điểm
          </h3>
          <p className="text-xs font-mono text-[#8a9ba8] mt-1">
            Chỉnh sửa các tiêu chí chấm điểm và điều chỉnh trọng số (tổng trọng số cần đạt đúng 100%).
          </p>
        </div>
      </div>

      {/* Multi-Track Switcher Tabs */}
      {tracks.length > 1 && (
        <div className="space-y-2">
          <label className="font-mono text-xs text-[#8b5cf6] font-bold uppercase tracking-wider block flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#8b5cf6]" />
            <span>CHỌN HẠNG MỤC XEM / SOẠN TIÊU CHÍ ({tracks.length} Hạng Mục):</span>
          </label>

          <div className="flex flex-wrap gap-2 font-mono text-xs">
            {tracks.map((trk, idx) => {
              const trkTemplate = templates.find(
                (t: any) => (t.id || t.Id || t.templateId || t.TemplateId) === trk.templateId
              );
              const isTrkInherited = Boolean(trkTemplate && trk.templateId !== "__custom__");
              const isSelected = trk.id === (activeTrack?.id || selectedTrackId);

              return (
                <button
                  key={trk.id}
                  type="button"
                  onClick={() => setSelectedTrackId(trk.id)}
                  className={`px-4 py-2 border transition-all cursor-pointer font-bold flex items-center gap-2 ${
                    isSelected
                      ? "bg-[#8b5cf6] text-white border-[#8b5cf6]"
                      : "bg-[#0a0e10] text-[#8a9ba8] border-[#263339] hover:border-[#8b5cf6]"
                  }`}
                >
                  <span>T{idx + 1}: {trk.trackName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CASE 1: INHERITED SYSTEM TEMPLATE MODE */}
      {isInheritedTemplate ? (
        <div className="space-y-6">
          <div className="p-4 bg-[#0a0e10] border border-[#8b5cf6]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
            <div className="space-y-1">
              <div className="text-[#8b5cf6] font-bold uppercase flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#8b5cf6]" />
                HẠNG MỤC [{activeTrack?.trackName}] ĐANG SỬ DỤNG MẪU HỆ THỐNG:
              </div>
              <div className="text-[#e1e7ec] font-sans font-bold text-sm">
                {selectedTemplate?.templateName || selectedTemplate?.TemplateName}
              </div>
              <div className="text-[#8a9ba8] text-[11px]">
                {selectedTemplate?.description || selectedTemplate?.Description || "Bộ tiêu chí mẫu của hệ thống."}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCustomizeTemplateForEvent}
              className="px-4 py-2.5 bg-[#8b5cf6] hover:bg-purple-600 text-white font-mono text-xs font-bold uppercase flex items-center gap-2 cursor-pointer transition-colors shadow-md shrink-0"
            >
              <Edit3 className="w-4 h-4" />
              <span>TÙY CHỈNH TIÊU CHÍ CHO SỰ KIỆN NÀY</span>
            </button>
          </div>

          {/* Clean READ-ONLY Table View */}
          <div className="bg-[#0a0e10] border border-[#263339] p-6 space-y-4">
            <div className="font-mono text-xs font-bold text-[#8b5cf6] tracking-widest uppercase flex items-between justify-between">
              <span>BẢNG TIÊU CHÍ NGUYÊN BẢN ({activeCriteriaList.length} Tiêu chí)</span>
              <span className="text-[#10b981] font-mono">[ TỔNG TRỌNG SỐ: 100% ]</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#263339] text-[#8a9ba8] tracking-wider text-[11px] bg-[#182024]">
                    <th className="p-3 w-16">STT</th>
                    <th className="p-3">TÊN TIÊU CHÍ CHẤM ĐIỂM</th>
                    <th className="p-3 w-32 text-center">TRỌNG SỐ (%)</th>
                    <th className="p-3 w-28 text-center">MAX SCORE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263339]">
                  {activeCriteriaList.map((c: any, idx: number) => (
                    <tr key={c.id || idx} className="hover:bg-[#182024]">
                      <td className="p-3 font-bold text-[#8b5cf6]">0{idx + 1}</td>
                      <td className="p-3 font-sans font-bold text-sm text-[#e1e7ec]">
                        {c.criterionName || c.name}
                      </td>
                      <td className="p-3 text-center font-bold text-[#10b981]">{c.weight}%</td>
                      <td className="p-3 text-center font-bold text-[#e1e7ec]">{c.maxScore || 10}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* CASE 2: CUSTOM RUBRIC MODE */
        <div className="space-y-6">
          
          {/* Red Weight Warning Banner */}
          {!activeIsValidWeight100 && (
            <div className="p-4 bg-red-500/10 border border-[#ef4444]/30 text-[#ef4444] font-mono text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
                <span>CẢNH BÁO TRỌNG SỐ TIÊU CHÍ [ {activeTrack?.trackName || "HẠNG MỤC"} ]</span>
              </div>
              <div>
                TỔNG TRỌNG SỐ HIỆN TẠI: <strong className="text-white">{activeTotalWeight}%</strong>. Tổng phải bằng đúng **100%** mới có thể xuất bản. (Đang thiếu: <strong className="text-white">{missingWeight}%</strong>).
              </div>
            </div>
          )}

          {/* 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Criteria Custom Table (8 cols) */}
            <div className="lg:col-span-8 bg-[#0a0e10] border border-[#263339] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#263339] pb-3">
                <div className="font-mono text-xs font-bold text-[#8b5cf6] tracking-widest uppercase">
                  SOẠN TIÊU CHÍ - HẠNG MỤC: [{activeTrack?.trackName}]
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleAddActiveCriteria}
                    className="px-3 py-1 bg-[#13191c] border border-[#8b5cf6]/40 text-[#8b5cf6] hover:bg-[#8b5cf6]/10 font-mono text-xs font-semibold cursor-pointer transition-colors"
                  >
                    + THÊM TIÊU CHÍ
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-[#263339] text-[#8a9ba8] tracking-wider text-[11px] bg-[#13191c]">
                      <th className="p-3 w-14">STT</th>
                      <th className="p-3">TÊN TIÊU CHÍ CHẤM</th>
                      <th className="p-3 w-28 text-center">THANG ĐIỂM</th>
                      <th className="p-3 w-28 text-center">TRỌNG SỐ (%)</th>
                      <th className="p-3 w-12 text-center">XÓA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#263339]">
                    {activeCriteriaList.map((crit: any, idx: number) => (
                      <tr key={crit.criteriaId || idx} className="hover:bg-[#182024]">
                        <td className="p-3 text-[#8a9ba8] font-bold">0{idx + 1}</td>
                        <td className="p-3 space-y-1">
                          <input
                            type="text"
                            value={crit.criterionName}
                            onChange={(e) => handleUpdateActiveCriteria(idx, "criterionName", e.target.value)}
                            disabled={isReadOnly}
                            className="w-full px-3 py-1.5 bg-[#13191c] border border-[#263339] text-[#e1e7ec] font-sans text-sm focus:outline-none focus:border-[#8b5cf6]"
                          />
                        </td>
                        <td className="p-3 text-center text-[#8a9ba8]">Thang 1-10</td>
                        <td className="p-3 text-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={crit.weight ?? 0}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (!raw.trim()) {
                                handleUpdateActiveCriteria(idx, "weight", 0);
                                return;
                              }
                              const digits = raw.replace(/[^0-9]/g, "");
                              const val = digits === "" ? 0 : Math.min(100, Math.max(0, parseInt(digits, 10)));
                              handleUpdateActiveCriteria(idx, "weight", val);
                            }}
                            disabled={isReadOnly}
                            className="w-20 px-2 py-1 bg-[#13191c] border border-[#263339] text-[#00d9ff] font-mono text-xs text-center font-bold focus:outline-none focus:border-[#8b5cf6]"
                          />
                        </td>
                        <td className="p-3 text-center">
                          {!isReadOnly && activeCriteriaList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveActiveCriteria(idx)}
                              className="text-[#8a9ba8] hover:text-[#ef4444] p-1 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Weight Progress & TOGGLE SAVE TO TEMPLATE BANK (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Card 1: Total Weight Gauge */}
              <div className="bg-[#0a0e10] border border-[#263339] p-6 space-y-4 font-mono text-xs">
                <div className="font-bold text-[#8a9ba8] tracking-widest uppercase">
                  TỔNG TRỌNG SỐ [{activeTrack?.trackName}]
                </div>

                <div className="text-4xl font-bold flex items-baseline gap-2">
                  <span className={activeIsValidWeight100 ? "text-[#10b981]" : "text-[#ef4444]"}>
                    {activeTotalWeight}
                  </span>
                  <span className="text-xl text-[#8a9ba8]">/ 100%</span>
                </div>

                {/* Custom Visual Weight Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-3 bg-[#13191c] border border-[#263339] flex overflow-hidden">
                    <div
                      className="h-full bg-[#8b5cf6] transition-all"
                      style={{ width: `${Math.min(activeTotalWeight, 100)}%` }}
                    ></div>
                    {missingWeight > 0 && (
                      <div
                        className="h-full bg-red-500/40 animate-pulse"
                        style={{ width: `${missingWeight}%` }}
                      ></div>
                    )}
                  </div>

                  <div className="flex justify-between text-[10px] text-[#8a9ba8]">
                    <span>0%</span>
                    {!activeIsValidWeight100 && (
                      <span className="text-[#ef4444] font-bold uppercase">
                        CẦN THÊM {missingWeight}%
                      </span>
                    )}
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Card 2: TOGGLE CHECKBOX SAVE TO TEMPLATE BANK */}
              <div className="p-6 border border-[#263339] bg-[#0a0e10] space-y-4 font-mono text-xs">
                <div className="border-b border-[#263339] pb-2 font-bold text-[#8b5cf6] tracking-widest uppercase flex items-center gap-1.5">
                  <Save className="w-4 h-4" />
                  CẤU HÌNH LƯU KHO TIÊU CHÍ
                </div>

                <label className="flex items-start gap-3 p-3 bg-[#13191c] border border-[#263339] hover:border-[#8b5cf6] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={saveToBank}
                    onChange={toggleSaveToBank}
                    className="w-4 h-4 mt-0.5 accent-[#8b5cf6] cursor-pointer"
                  />
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-[#e1e7ec]">
                      {saveToBank ? "ĐỒNG Ý LƯU VÀO KHO TIÊU CHÍ" : "KHÔNG LƯU VÀO KHO TIÊU CHÍ"}
                    </div>
                    <p className="text-[11px] text-[#8a9ba8] leading-relaxed">
                      {saveToBank
                        ? "Bộ tiêu chí này sẽ được lưu thành bản mẫu chung để tái sử dụng cho các sự kiện sau."
                        : "Bộ tiêu chí này chỉ áp dụng riêng cho sự kiện hiện tại, không lưu vào kho hệ thống."}
                    </p>
                  </div>
                </label>

                {/* Input Tên Bộ Tiêu Chí (Disabled / Greyed out ONLY when saveToBank === false) */}
                <div className={`space-y-1.5 pt-1 transition-all ${saveToBank ? "" : "opacity-40"}`}>
                  <label className="text-[11px] text-[#8a9ba8] uppercase font-bold flex items-center gap-1">
                    Tên bộ tiêu chí lưu kho *
                  </label>
                  <input
                    type="text"
                    disabled={!saveToBank}
                    value={templateName || ""}
                    onChange={(e) => onUpdateTemplateName?.(e.target.value)}
                    placeholder="Ví dụ: Bộ Tiêu Chí Standard Pitch Deck 2026..."
                    className={`w-full px-3 py-2 border font-sans text-xs focus:outline-none ${
                      saveToBank
                        ? "bg-[#13191c] border-[#263339] text-[#e1e7ec] focus:border-[#8b5cf6]"
                        : "bg-[#0a0e10] border-[#182024] text-[#8a9ba8]/50 cursor-not-allowed"
                    }`}
                  />
                </div>

                {/* Instant Save to Bank Button */}
                {saveToBank && (
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={!activeIsValidWeight100}
                      onClick={handleSaveTemplateToBankNow}
                      className="w-full py-2.5 px-3 bg-[#8b5cf6]/20 border border-[#8b5cf6]/60 hover:bg-[#8b5cf6]/30 text-[#c084fc] font-mono text-xs font-bold uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <BookmarkPlus className="w-4 h-4 text-[#c084fc]" />
                      <span>LƯU BỘ TIÊU CHÍ NÀY VÀO KHO NGAY</span>
                    </button>
                  </div>
                )}

                {bankSaveSuccess && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold text-center">
                    {bankSaveSuccess}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Bottom Actions Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-[#263339] font-mono text-xs">
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2 border border-[#263339] text-[#8a9ba8] hover:text-[#e1e7ec] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> <span>Bước 3: Hạng Mục</span>
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
            <span>TIẾP TỤC BƯỚC 5: CÔNG BỐ SỰ KIỆN</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
