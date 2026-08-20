"use client";

import React, { useState, useMemo } from "react";
import { TemplateCriteriaFormState, TrackFormState } from "@/viewModels/useCreateEventWizardViewModel";
import { templatesRepository, getStoredCustomTemplates, saveStoredCustomTemplates } from "@/repositories/templatesRepository";
import { useGetAllCriteria } from "@/repositories/events/criteriasRepository";
import { Modal } from "@/components/ui/Modal";
import {
  AlertTriangle,
  Plus,
  X,
  Sliders,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Save,
  Layers,
  Edit3,
  Copy,
  BookOpen,
  Search,
  Scale,
  Sparkles,
  Database,
  CheckSquare,
  Square,
} from "lucide-react";

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
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Modal State for Criteria Bank Picker
  const [isCriteriaBankModalOpen, setIsCriteriaBankModalOpen] = useState(false);
  const [criteriaSearchQuery, setCriteriaSearchQuery] = useState("");
  const [selectedBankCriteriaIds, setSelectedBankCriteriaIds] = useState<string[]>([]);

  // Fetch all Criteria from Backend Kho Tiêu Chí Gốc
  const { data: pagedCriteriaResult, isLoading: isLoadingCriteriaBank } = useGetAllCriteria({
    pageSize: 100,
  });

  const allSystemCriteria = useMemo(() => {
    const raw = (pagedCriteriaResult as any)?.data || (pagedCriteriaResult as any)?.items || (Array.isArray(pagedCriteriaResult) ? pagedCriteriaResult : []);
    return Array.isArray(raw) ? raw : [];
  }, [pagedCriteriaResult]);

  // Combined Templates (System API Templates + Local Saved Templates)
  const storedTemplates = useMemo(() => getStoredCustomTemplates(), []);
  const allAvailableTemplates = useMemo(() => {
    const map = new Map<string, any>();
    (templates || []).forEach((t: any) => {
      const id = t.id || t.Id || t.templateId || t.TemplateId;
      if (id) map.set(id, t);
    });
    (storedTemplates || []).forEach((t: any) => {
      const id = t.id || t.Id || t.templateId || t.TemplateId;
      if (id && !map.has(id)) map.set(id, t);
    });
    return Array.from(map.values());
  }, [templates, storedTemplates]);

  const activeTrack = tracks.find((t) => t.id === selectedTrackId) || tracks[0];

  // Active track's criteria list
  const activeCriteriaList: TemplateCriteriaFormState[] = useMemo(() => {
    if (activeTrack && criteriasByTrack[activeTrack.id]) {
      return criteriasByTrack[activeTrack.id];
    }
    if (criterias && criterias.length > 0) {
      return criterias;
    }
    return [
      {
        criteriaId: `crit-${Date.now()}-1`,
        criterionName: "Tính Sáng Tạo & Đổi Mới",
        description: "Ý tưởng có tính đột phá, giải quyết bài toán thực tế rõ ràng.",
        weight: 40,
        maxScore: 10,
      },
      {
        criteriaId: `crit-${Date.now()}-2`,
        criterionName: "Chất Lượng Kỹ Thuật & Mã Nguồn",
        description: "Kiến trúc rõ ràng, mã nguồn sạch, ứng dụng chạy ổn định.",
        weight: 30,
        maxScore: 10,
      },
      {
        criteriaId: `crit-${Date.now()}-3`,
        criterionName: "Thuyết Trình & Trải Nghiệm Người Dùng",
        description: "Demo mượt mà, trả lời phản biện thuyết phục.",
        weight: 30,
        maxScore: 10,
      },
    ];
  }, [activeTrack, criteriasByTrack, criterias]);

  const activeTotalWeight = activeCriteriaList.reduce((acc: number, c: any) => acc + (Number(c.weight) || 0), 0);
  const activeIsValidWeight100 = Math.abs(activeTotalWeight - 100) < 0.01;
  const missingWeight = 100 - activeTotalWeight;

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // 1. IMPORT FROM TEMPLATE BANK (Kho Mẫu Tiêu Chí)
  const handleImportFromTemplate = (templateId: string) => {
    if (!templateId || !activeTrack) return;
    const targetTpl = allAvailableTemplates.find(
      (t: any) => (t.id || t.Id || t.templateId || t.TemplateId) === templateId
    );

    if (!targetTpl) return;

    const importedCriterias: TemplateCriteriaFormState[] = (targetTpl.criterias || []).map((c: any, idx: number) => ({
      criteriaId: c.criteriaId || c.CriteriaId || `crit-tpl-${Date.now()}-${idx}`,
      criterionName: c.criterionName || c.CriterionName || c.name || `Tiêu chí ${idx + 1}`,
      description: c.description || c.Description || "",
      weight: Number(c.weight || c.Weight || 25),
      maxScore: Number(c.maxScore || c.MaxScore || 10),
    }));

    if (importedCriterias.length === 0) {
      importedCriterias.push({
        criteriaId: `crit-tpl-${Date.now()}`,
        criterionName: targetTpl.templateName || "Tiêu chí mẫu",
        description: targetTpl.description || "",
        weight: 100,
        maxScore: 10,
      });
    }

    if (onUpdateTrackCriterias) {
      onUpdateTrackCriterias(activeTrack.id, importedCriterias);
    }
    if (onUpdateTrack) {
      onUpdateTrack(activeTrack.id, "templateId", templateId);
    }

    showFeedback(`Đã nạp thành công ${importedCriterias.length} tiêu chí từ mẫu "${targetTpl.templateName || targetTpl.TemplateName}" vào hạng mục [${activeTrack.trackName}]!`);
  };

  // 2. IMPORT MULTIPLE CRITERIA FROM CRITERIA BANK MODAL
  const handleOpenCriteriaBankModal = () => {
    setSelectedBankCriteriaIds([]);
    setCriteriaSearchQuery("");
    setIsCriteriaBankModalOpen(true);
  };

  const handleToggleSelectBankCriteria = (id: string) => {
    setSelectedBankCriteriaIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConfirmAddFromCriteriaBank = () => {
    if (!activeTrack || selectedBankCriteriaIds.length === 0) {
      setIsCriteriaBankModalOpen(false);
      return;
    }

    const selectedItems = allSystemCriteria.filter((c: any) =>
      selectedBankCriteriaIds.includes(c.id || c.Id)
    );

    if (selectedItems.length === 0) {
      setIsCriteriaBankModalOpen(false);
      return;
    }

    const newCriteriaRows: TemplateCriteriaFormState[] = selectedItems.map((item: any, idx: number) => ({
      criteriaId: item.id || item.Id || `crit-bank-${Date.now()}-${idx}`,
      criterionName: item.criteriaName || item.CriteriaName || item.name || "Tiêu chí từ Kho",
      description: item.description || item.Description || "",
      weight: 10, // default weight
      maxScore: 10,
    }));

    const nextList = [...activeCriteriaList, ...newCriteriaRows];

    if (onUpdateTrackCriterias) {
      onUpdateTrackCriterias(activeTrack.id, nextList);
    } else {
      newCriteriaRows.forEach((c) => onAddCriteria(c));
    }

    setIsCriteriaBankModalOpen(false);
    showFeedback(`Đã thêm ${newCriteriaRows.length} tiêu chí từ Kho tiêu chí gốc vào hạng mục [${activeTrack.trackName}]!`);
  };

  // 3. COPY RUBRIC FROM ANOTHER TRACK
  const handleCopyFromTrack = (sourceTrackId: string) => {
    if (!sourceTrackId || !activeTrack || sourceTrackId === activeTrack.id) return;
    const sourceList = criteriasByTrack[sourceTrackId] || criterias;
    if (!sourceList || sourceList.length === 0) {
      alert("Hạng mục nguồn chưa có tiêu chí để sao chép!");
      return;
    }

    const copied = sourceList.map((c: any, idx: number) => ({
      ...c,
      criteriaId: `crit-copy-${Date.now()}-${idx}`,
    }));

    if (onUpdateTrackCriterias) {
      onUpdateTrackCriterias(activeTrack.id, copied);
    }

    const sourceTrack = tracks.find((t) => t.id === sourceTrackId);
    showFeedback(`Đã sao chép toàn bộ tiêu chí từ hạng mục [${sourceTrack?.trackName || "Track khác"}] sang [${activeTrack.trackName}]!`);
  };

  // 4. AUTO-BALANCE WEIGHTS TO EXACTLY 100%
  const handleAutoBalanceWeights = () => {
    if (!activeTrack || activeCriteriaList.length === 0) return;
    const count = activeCriteriaList.length;
    const baseWeight = Math.floor(100 / count);
    const remainder = 100 - baseWeight * count;

    const balancedList = activeCriteriaList.map((c, idx) => ({
      ...c,
      weight: idx === 0 ? baseWeight + remainder : baseWeight,
    }));

    if (onUpdateTrackCriterias) {
      onUpdateTrackCriterias(activeTrack.id, balancedList);
    }

    showFeedback(`Đã tự động cân bằng ${count} tiêu chí đạt chuẩn đúng 100% trọng số!`);
  };

  // 5. SAVE CURRENT RUBRIC TO TEMPLATE BANK
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
        criteriaName: c.criterionName || c.criteriaName || "Tiêu chí",
        description: c.description || "",
        weight: Number(c.weight) || 0,
        maxScore: Number(c.maxScore) || 10,
      })),
    };

    // Store in local storage so it immediately shows in Kho Tiêu Chí / Template Bank
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

    showFeedback(`Đã lưu thành công bộ tiêu chí "${tName}" với ${activeCriteriaList.length} tiêu chí thành phần vào Kho Mẫu Tiêu Chí!`);
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

  // Filter criteria for Criteria Bank Modal
  const filteredBankCriteria = useMemo(() => {
    if (!criteriaSearchQuery.trim()) return allSystemCriteria;
    const q = criteriaSearchQuery.toLowerCase();
    return allSystemCriteria.filter(
      (c: any) =>
        (c.criteriaName || c.CriteriaName || "").toLowerCase().includes(q) ||
        (c.description || c.Description || "").toLowerCase().includes(q)
    );
  }, [allSystemCriteria, criteriaSearchQuery]);

  return (
    <div className="space-y-6 bg-[#13191c] border border-[#263339] p-6 text-[#e1e7ec]">
      {/* Header */}
      <div className="border-b border-[#263339] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-mono font-bold text-lg text-[#e1e7ec] uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#8b5cf6]" />
            Bước 4: Soạn Thảo &amp; Nạp Tiêu Chí Từ Kho
          </h3>
          <p className="text-xs font-mono text-[#8a9ba8] mt-1">
            Nạp mẫu tiêu chí từ <strong>Kho Mẫu (Template Bank)</strong>, chọn từ <strong>Kho Tiêu Chí Gốc</strong> hoặc tự do tùy biến cho từng Hạng mục.
          </p>
        </div>

        {/* Global Feedback Banner */}
        {feedbackMessage && (
          <div className="px-4 py-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold flex items-center gap-2 animate-fadeIn rounded">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedbackMessage}</span>
          </div>
        )}
      </div>

      {/* Multi-Track Switcher Tabs */}
      {tracks.length > 1 && (
        <div className="space-y-2">
          <label className="font-mono text-xs text-[#8b5cf6] font-bold uppercase tracking-wider block flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#8b5cf6]" />
            <span>CHỌN HẠNG MỤC THI ĐẤU ĐỂ CẤU HÌNH TIÊU CHÍ ({tracks.length} Hạng Mục):</span>
          </label>

          <div className="flex flex-wrap gap-2 font-mono text-xs">
            {tracks.map((trk, idx) => {
              const isSelected = trk.id === (activeTrack?.id || selectedTrackId);
              const trkCriterias = criteriasByTrack[trk.id] || (isSelected ? activeCriteriaList : []);
              const trkWeight = trkCriterias.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
              const isOk = Math.abs(trkWeight - 100) < 0.01;

              return (
                <button
                  key={trk.id}
                  type="button"
                  onClick={() => setSelectedTrackId(trk.id)}
                  className={`px-4 py-2 border transition-all cursor-pointer font-bold flex items-center gap-2.5 ${
                    isSelected
                      ? "bg-[#8b5cf6] text-white border-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.35)]"
                      : "bg-[#0a0e10] text-[#8a9ba8] border-[#263339] hover:border-[#8b5cf6]"
                  }`}
                >
                  <span>T{idx + 1}: {trk.trackName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isOk ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {trkWeight}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TOOLBAR: IMPORT FROM KHO TIÊU CHÍ / TEMPLATE BANK */}
      <div className="p-4 bg-[#0a0e10] border border-[#263339] space-y-3">
        <div className="flex items-center justify-between border-b border-[#263339] pb-2">
          <span className="font-mono text-xs text-[#00d9ff] font-bold uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-[#00d9ff]" />
            NẠP DỮ LIỆU TỪ KHO TIÊU CHÍ VÀO HẠNG MỤC: [{activeTrack?.trackName}]
          </span>
          <span className="text-[11px] font-mono text-[#8a9ba8]">
            {activeCriteriaList.length} tiêu chí hiện có
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 font-mono text-xs">
          {/* Action 1: Chọn mẫu từ Kho Mẫu (Template Bank) */}
          <div className="md:col-span-5 flex items-center gap-2">
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) handleImportFromTemplate(e.target.value);
              }}
              disabled={isReadOnly}
              className="w-full px-3 py-2 bg-[#13191c] border border-[#8b5cf6]/50 text-[#e1e7ec] font-mono text-xs focus:outline-none focus:border-[#8b5cf6] cursor-pointer"
            >
              <option value="">📂 Nạp từ Kho Mẫu Tiêu Chí (Template Bank)...</option>
              {allAvailableTemplates.map((t: any) => (
                <option key={t.id || t.Id || t.templateId} value={t.id || t.Id || t.templateId}>
                  ⚡ {t.templateName || t.TemplateName} ({(t.criterias || []).length} tiêu chí)
                </option>
              ))}
            </select>
          </div>

          {/* Action 2: Mở Modal Kho Tiêu Chí Gốc */}
          <div className="md:col-span-4 flex items-center">
            <button
              type="button"
              onClick={handleOpenCriteriaBankModal}
              disabled={isReadOnly}
              className="w-full px-3 py-2 bg-[#13191c] hover:bg-[#00d9ff]/15 border border-[#00d9ff]/50 text-[#00d9ff] font-mono text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <BookOpen className="w-4 h-4 text-[#00d9ff]" />
              <span>+ CHỌN TỪ KHO TIÊU CHÍ GỐC</span>
            </button>
          </div>

          {/* Action 3: Copy từ Track khác hoặc Cân bằng 100% */}
          <div className="md:col-span-3 flex items-center gap-2">
            {tracks.length > 1 ? (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) handleCopyFromTrack(e.target.value);
                }}
                disabled={isReadOnly}
                className="w-full px-2.5 py-2 bg-[#13191c] border border-[#263339] text-[#8a9ba8] font-mono text-xs focus:outline-none focus:border-[#8b5cf6] cursor-pointer"
              >
                <option value="">📋 Sao chép từ Track...</option>
                {tracks
                  .filter((t) => t.id !== activeTrack?.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      Sao chép: {t.trackName}
                    </option>
                  ))}
              </select>
            ) : (
              <button
                type="button"
                onClick={handleAutoBalanceWeights}
                disabled={isReadOnly || activeCriteriaList.length === 0}
                className="w-full px-3 py-2 bg-[#13191c] hover:bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Scale className="w-4 h-4" />
                <span>CÂN BẰNG 100%</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Red Weight Warning Banner */}
      {!activeIsValidWeight100 && (
        <div className="p-4 bg-red-500/10 border border-[#ef4444]/40 text-[#ef4444] font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-[#ef4444]" />
            <div>
              <span className="font-bold uppercase">
                CẢNH BÁO TRỌNG SỐ [ {activeTrack?.trackName || "HẠNG MỤC"} ]:
              </span>{" "}
              Hiện tại đạt <strong className="text-white">{activeTotalWeight}%</strong> / 100%. (Đang{" "}
              {missingWeight > 0 ? `thiếu ${missingWeight}%` : `thừa ${Math.abs(missingWeight)}%`}).
            </div>
          </div>

          <button
            type="button"
            onClick={handleAutoBalanceWeights}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-white font-mono text-xs font-bold uppercase flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>TỰ ĐỘNG CÂN BẰNG 100%</span>
          </button>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Criteria Table (8 cols) */}
        <div className="lg:col-span-8 bg-[#0a0e10] border border-[#263339] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#263339] pb-3">
            <div className="font-mono text-xs font-bold text-[#8b5cf6] tracking-widest uppercase flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#8b5cf6]" />
              <span>DANH SÁCH TIÊU CHÍ — [{activeTrack?.trackName}]</span>
            </div>

            <div className="flex items-center gap-2">
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleAddActiveCriteria}
                  className="px-3 py-1 bg-[#13191c] border border-[#8b5cf6]/40 text-[#8b5cf6] hover:bg-[#8b5cf6]/10 font-mono text-xs font-semibold cursor-pointer transition-colors"
                >
                  + THÊM TIÊU CHÍ MỚI
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#263339] text-[#8a9ba8] tracking-wider text-[11px] bg-[#13191c]">
                  <th className="p-3 w-12">STT</th>
                  <th className="p-3">TÊN TIÊU CHÍ &amp; HƯỚNG DẪN CHẤM</th>
                  <th className="p-3 w-28 text-center">THANG ĐIỂM</th>
                  <th className="p-3 w-32 text-center">TRỌNG SỐ (%)</th>
                  <th className="p-3 w-12 text-center">XÓA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263339]">
                {activeCriteriaList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-[#8a9ba8] italic">
                      Hạng mục này chưa có tiêu chí nào. Hãy chọn từ <strong>Kho Tiêu Chí</strong> hoặc nhấn <strong>+ Thêm tiêu chí mới</strong>.
                    </td>
                  </tr>
                ) : (
                  activeCriteriaList.map((crit: any, idx: number) => (
                    <tr key={crit.criteriaId || idx} className="hover:bg-[#182024]">
                      <td className="p-3 text-[#8a9ba8] font-bold">0{idx + 1}</td>
                      <td className="p-3 space-y-1.5">
                        <input
                          type="text"
                          value={crit.criterionName || ""}
                          onChange={(e) => handleUpdateActiveCriteria(idx, "criterionName", e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Tên tiêu chí (ví dụ: Tính sáng tạo, Kỹ thuật code...)"
                          className="w-full px-3 py-1.5 bg-[#13191c] border border-[#263339] text-[#e1e7ec] font-sans text-xs font-bold focus:outline-none focus:border-[#8b5cf6]"
                        />
                        <input
                          type="text"
                          value={crit.description || ""}
                          onChange={(e) => handleUpdateActiveCriteria(idx, "description", e.target.value)}
                          disabled={isReadOnly}
                          placeholder="Mô tả định hướng & thang tiêu chí đánh giá cho Giám khảo..."
                          className="w-full px-3 py-1 bg-[#13191c]/60 border border-[#263339]/60 text-[#8a9ba8] font-sans text-[11px] focus:outline-none focus:border-[#8b5cf6]"
                        />
                      </td>
                      <td className="p-3 text-center text-[#8a9ba8]">
                        <span className="px-2 py-1 bg-[#13191c] border border-[#263339] text-[#e1e7ec] text-[11px] rounded">
                          0 - {crit.maxScore || 10}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
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
                            className="w-16 px-2 py-1 bg-[#13191c] border border-[#263339] text-[#00d9ff] font-mono text-xs text-center font-bold focus:outline-none focus:border-[#8b5cf6]"
                          />
                          <span className="text-[#8a9ba8] font-bold">%</span>
                        </div>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Weight Gauge & Save to Template Bank (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Total Weight Gauge */}
          <div className="bg-[#0a0e10] border border-[#263339] p-6 space-y-4 font-mono text-xs">
            <div className="font-bold text-[#8a9ba8] tracking-widest uppercase flex items-center justify-between">
              <span>TỔNG TRỌNG SỐ [{activeTrack?.trackName}]</span>
              <span className={activeIsValidWeight100 ? "text-[#10b981]" : "text-[#ef4444]"}>
                {activeIsValidWeight100 ? "✓ ĐẠT CHUẨN" : "✗ CHƯA ĐẠT"}
              </span>
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
                  className={`h-full transition-all ${
                    activeIsValidWeight100 ? "bg-[#10b981]" : "bg-[#8b5cf6]"
                  }`}
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
                    {missingWeight > 0 ? `CẦN THÊM ${missingWeight}%` : `ĐANG DƯ ${Math.abs(missingWeight)}%`}
                  </span>
                )}
                <span>100%</span>
              </div>
            </div>

            {/* Action buttons inside gauge */}
            <div className="pt-2 border-t border-[#263339] flex flex-col gap-2">
              <button
                type="button"
                onClick={handleAutoBalanceWeights}
                className="w-full py-2 bg-[#13191c] hover:bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Scale className="w-4 h-4" />
                <span>TỰ ĐỘNG CÂN BẰNG ĐỦ 100%</span>
              </button>

              {tracks.length > 1 && onApplyToAllTracks && (
                <button
                  type="button"
                  onClick={() => {
                    onApplyToAllTracks(activeCriteriaList);
                    showFeedback(`Đã áp dụng bộ ${activeCriteriaList.length} tiêu chí này cho TẤT CẢ các Hạng mục trong sự kiện!`);
                  }}
                  className="w-full py-2 bg-[#13191c] hover:bg-[#8b5cf6]/15 border border-[#8b5cf6]/40 text-[#8b5cf6] font-mono text-xs font-bold uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>ÁP DỤNG CHO TẤT CẢ HẠNG MỤC</span>
                </button>
              )}
            </div>
          </div>

          {/* Card 2: LƯU BỘ TIÊU CHÍ VÀO KHO MẪU (SAVE TO TEMPLATE BANK) */}
          <div className="p-6 border border-[#263339] bg-[#0a0e10] space-y-4 font-mono text-xs">
            <div className="border-b border-[#263339] pb-2 font-bold text-[#8b5cf6] tracking-widest uppercase flex items-center gap-1.5">
              <Save className="w-4 h-4" />
              LƯU VÀO KHO MẪU TIÊU CHÍ (TEMPLATE BANK)
            </div>

            <p className="text-[#8a9ba8] text-[11px] leading-relaxed">
              Bạn có thể lưu bộ tiêu chí vừa thiết lập để tái sử dụng cho các mùa giải hoặc sự kiện khác.
            </p>

            <div className="space-y-2">
              <label className="text-[11px] text-[#8a9ba8] uppercase font-bold">Tên Bộ Tiêu Chí</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => onUpdateTemplateName?.(e.target.value)}
                placeholder={`Ví dụ: Bộ tiêu chí ${activeTrack?.trackName || "Hackathon"} 2026`}
                className="w-full px-3 py-2 bg-[#13191c] border border-[#263339] text-[#e1e7ec] font-sans text-xs focus:outline-none focus:border-[#8b5cf6]"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveTemplateToBankNow}
              disabled={!activeIsValidWeight100}
              className={`w-full py-2.5 font-mono text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${
                activeIsValidWeight100
                  ? "bg-[#8b5cf6] hover:bg-purple-600 text-white cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                  : "bg-[#182024] text-[#8a9ba8]/50 border border-[#263339] cursor-not-allowed"
              }`}
            >
              <Save className="w-4 h-4" />
              <span>LƯU THÀNH MẪU VÀO KHO</span>
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#263339] font-mono text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            className="px-4 py-2.5 bg-[#182024] hover:bg-[#263339] text-[#e1e7ec] border border-[#263339] font-bold uppercase flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>QUAY LẠI BƯỚC 3</span>
          </button>

          {onSaveDraft && (
            <button
              type="button"
              onClick={onSaveDraft}
              className="px-4 py-2.5 bg-[#182024] hover:bg-[#263339] text-emerald-400 border border-emerald-500/30 font-bold uppercase flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>LƯU BẢN NHÁP</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onNext}
          className="w-full sm:w-auto px-6 py-2.5 bg-[#8b5cf6] hover:bg-purple-600 text-white font-bold uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)]"
        >
          <span>TIẾP TỤC SANG BƯỚC 5 (XÁC NHẬN &amp; CÔNG BỐ)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* MODAL: CHỌN TIÊU CHÍ TỪ KHO TIÊU CHÍ GỐC */}
      <Modal
        open={isCriteriaBankModalOpen}
        onClose={() => setIsCriteriaBankModalOpen(false)}
        title="KHO TIÊU CHÍ HỆ THỐNG (CRITERIA BANK)"
        eyebrow="CHỌN & NẠP TIÊU CHÍ VÀO HẠNG MỤC"
        size="xl"
        description="Chọn các tiêu chí gốc có sẵn trong hệ thống để đưa vào bảng tiêu chí chấm điểm của Hạng mục hiện tại."
        footer={
          <div className="w-full flex items-center justify-between font-mono text-xs">
            <span className="text-[#8a9ba8]">
              Đã chọn: <strong className="text-[#00d9ff]">{selectedBankCriteriaIds.length}</strong> tiêu chí
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsCriteriaBankModalOpen(false)}
                className="px-4 py-2 bg-[#182024] text-[#8a9ba8] hover:text-white border border-[#263339] font-bold"
              >
                HỦY
              </button>
              <button
                type="button"
                onClick={handleConfirmAddFromCriteriaBank}
                disabled={selectedBankCriteriaIds.length === 0}
                className={`px-5 py-2 font-bold uppercase flex items-center gap-2 ${
                  selectedBankCriteriaIds.length > 0
                    ? "bg-[#00d9ff] text-black hover:bg-cyan-400 cursor-pointer shadow-[0_0_15px_rgba(0,217,255,0.3)]"
                    : "bg-[#182024] text-[#8a9ba8]/50 cursor-not-allowed border border-[#263339]"
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>THÊM {selectedBankCriteriaIds.length} TIÊU CHÍ ĐÃ CHỌN</span>
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 py-2 font-mono text-xs">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#8a9ba8] absolute left-3 top-3" />
            <input
              type="text"
              value={criteriaSearchQuery}
              onChange={(e) => setCriteriaSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên hoặc mô tả tiêu chí..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-sans text-xs focus:outline-none focus:border-[#00d9ff]"
            />
          </div>

          {/* Criteria List with Checkboxes */}
          <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 divide-y divide-[#263339]/50">
            {isLoadingCriteriaBank ? (
              <div className="p-8 text-center text-[#8a9ba8] italic">Đang tải danh sách tiêu chí từ Kho hệ thống...</div>
            ) : filteredBankCriteria.length === 0 ? (
              <div className="p-8 text-center text-[#8a9ba8] italic">
                Không tìm thấy tiêu chí nào phù hợp với từ khóa "{criteriaSearchQuery}".
              </div>
            ) : (
              filteredBankCriteria.map((c: any) => {
                const id = c.id || c.Id;
                const isSelected = selectedBankCriteriaIds.includes(id);

                return (
                  <div
                    key={id}
                    onClick={() => handleToggleSelectBankCriteria(id)}
                    className={`p-3 rounded border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? "bg-[#00d9ff]/10 border-[#00d9ff] text-white"
                        : "bg-[#0a0e10] border-[#263339] text-[#8a9ba8] hover:border-[#00d9ff]/50"
                    }`}
                  >
                    <div className="pt-0.5 shrink-0 text-[#00d9ff]">
                      {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-[#8a9ba8]" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="font-sans font-bold text-xs text-[#e1e7ec] flex items-center justify-between">
                        <span>{c.criteriaName || c.CriteriaName || c.name}</span>
                        <span className="text-[10px] font-mono text-[#00d9ff] bg-[#00d9ff]/10 px-2 py-0.5 rounded">
                          Thang 1-10
                        </span>
                      </div>
                      <p className="text-[11px] font-sans text-[#8a9ba8] leading-relaxed">
                        {c.description || c.Description || "Tiêu chí chấm điểm chuẩn."}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
