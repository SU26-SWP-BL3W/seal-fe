"use client";

import React, { useState } from "react";
import { useGetTemplates, templatesRepository } from "@/repositories/templatesRepository";
import { Sliders, Plus, CheckCircle2, AlertTriangle, ArrowLeft, Trash2, FolderGit2, Layers, Edit3, Save, Eye, Sparkles, Copy } from "lucide-react";
import { Link } from "@/i18n/routing";

export interface CriteriaInsideSet {
  id: string;
  criterionName: string;
  weight: number;
  maxScore: number;
  description: string;
}

export interface CriteriaSetItem {
  id: string;
  templateName: string;
  description: string;
  createdDate: string;
  criterias: CriteriaInsideSet[];
}

export const CoordinatorTemplatesView: React.FC = () => {
  const { data: dbTemplates = [], refetch: refetchTemplates } = useGetTemplates();

  // Local state for Criteria Sets (Bộ Tiêu Chí)
  const [criteriaSets, setCriteriaSets] = useState<CriteriaSetItem[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>("");

  React.useEffect(() => {
    if (Array.isArray(dbTemplates) && dbTemplates.length > 0) {
      const mapped: CriteriaSetItem[] = dbTemplates.map((t: any) => ({
        id: t.id || t.Id,
        templateName: t.templateName || t.TemplateName || "Bộ tiêu chí",
        description: t.description || t.Description || "",
        createdDate: t.createdDate ? new Date(t.createdDate).toLocaleDateString("vi-VN") : new Date().toLocaleDateString("vi-VN"),
        criterias: (t.criterias || t.TemplateCriterias || []).map((c: any) => ({
          id: c.criteriaId || c.id || c.Id,
          criterionName: c.criteriaName || c.criterionName || c.Name || "Tiêu chí",
          weight: c.weight || c.Weight || 0,
          maxScore: c.maxScore || c.MaxScore || 10,
          description: c.description || c.Description || "",
        })),
      }));
      setCriteriaSets(mapped);
      if (!selectedSetId && mapped.length > 0) {
        setSelectedSetId(mapped[0].id);
      }
    } else {
      setCriteriaSets([]);
      setSelectedSetId("");
    }
  }, [dbTemplates.length]);

  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);

  // New Criteria Set Form State
  const [newSetName, setNewSetName] = useState("");
  const [newSetDesc, setNewSetDesc] = useState("");
  const [builderCriterias, setBuilderCriterias] = useState<CriteriaInsideSet[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Computed weight for builder
  const builderTotalWeight = builderCriterias.reduce((acc, c) => acc + (Number(c.weight) || 0), 0);
  const isBuilderValid100 = builderTotalWeight === 100;

  // Active Selected Set
  const activeSet = criteriaSets.find((s) => s.id === selectedSetId) || criteriaSets[0];
  const activeSetTotalWeight = activeSet ? activeSet.criterias.reduce((acc, c) => acc + c.weight, 0) : 0;

  // Add Row inside Builder
  const handleAddCriteriaRow = () => {
    const nextIdx = builderCriterias.length + 1;
    setBuilderCriterias((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        criterionName: `Tiêu chí thành phần ${nextIdx}`,
        weight: 10,
        maxScore: 10,
        description: "Mô tả hướng dẫn chấm chi tiết cho Giám khảo...",
      },
    ]);
  };

  // Remove Row inside Builder
  const handleRemoveCriteriaRow = (id: string) => {
    if (builderCriterias.length <= 1) return;
    setBuilderCriterias((prev) => prev.filter((c) => c.id !== id));
  };

  // Update Criteria Row inside Builder
  const handleUpdateCriteriaRow = (id: string, field: keyof CriteriaInsideSet, value: any) => {
    setBuilderCriterias((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  // Save New Criteria Set into State & Database
  const handleSaveCriteriaSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetName.trim()) {
      alert("Vui lòng nhập tên cho Bộ Tiêu Chí mới!");
      return;
    }
    if (!isBuilderValid100) {
      alert(`Tổng trọng số của Bộ tiêu chí phải bằng ĐÚNG 100%! (Hiện tại: ${builderTotalWeight}%).`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (templatesRepository?.createTemplate) {
        await templatesRepository.createTemplate({
          templateName: newSetName,
          description: newSetDesc,
        });
      }

      const newSet: CriteriaSetItem = {
        id: `set-${Date.now()}`,
        templateName: newSetName,
        description: newSetDesc || "Bộ tiêu chí đánh giá chuẩn cho sự kiện.",
        createdDate: new Date().toISOString().split("T")[0],
        criterias: builderCriterias,
      };

      setCriteriaSets((prev) => [newSet, ...prev]);
      setSelectedSetId(newSet.id);
      setIsBuilderModalOpen(false);
      setNewSetName("");
      setNewSetDesc("");
      setSuccessMessage(`Đã tạo và lưu thành công "${newSetName}" vào Kho Bộ Tiêu Chí!`);
    } catch {
      alert("Lưu Bộ tiêu chí thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Criteria Set from State & Database
  const handleDeleteSet = async (setId: string, setName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (!window.confirm(`Bạn có chắc chắn muốn xóa bộ tiêu chí "${setName}" khỏi Kho Tiêu Chí hệ thống?`)) {
      return;
    }

    try {
      if (templatesRepository?.deleteTemplate) {
        await templatesRepository.deleteTemplate(setId);
      }

      const nextSets = criteriaSets.filter((s) => s.id !== setId);
      setCriteriaSets(nextSets);

      if (selectedSetId === setId) {
        setSelectedSetId(nextSets[0]?.id || "");
      }

      await refetchTemplates();

      setSuccessMessage(`✓ Đã xóa thành công bộ tiêu chí "${setName}" khỏi Kho Hệ Thống!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch {
      alert("Xóa Bộ tiêu chí thất bại!");
    }
  };

  // LOI_04: Clone/Fork Template - Copy existing set as a new template
  const handleCloneTemplate = (setId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const sourceSet = criteriaSets.find((s) => s.id === setId);
    if (!sourceSet) return;

    // Pre-fill builder with cloned data
    setNewSetName(`[Bản sao] ${sourceSet.templateName}`);
    setNewSetDesc(sourceSet.description);
    setBuilderCriterias(
      sourceSet.criterias.map((c, idx) => ({
        ...c,
        id: `clone-${Date.now()}-${idx}`,
      }))
    );
    setIsBuilderModalOpen(true);
    setSuccessMessage(`✓ Đã sao chép "${sourceSet.templateName}" - Vui lòng chỉnh sửa và lưu!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#0a0e10] text-[#e1e7ec] font-sans selection:bg-[#8b5cf6] selection:text-white flex flex-col">
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#263339] pb-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#8b5cf6] font-bold uppercase tracking-wider mb-1">
              <FolderGit2 className="w-4 h-4 text-[#8b5cf6]" />
              <span>NGÂN HÀNG DỮ LIỆU BAN TỔ CHỨC</span>
            </div>
            <h1 className="font-mono font-bold text-2xl md:text-3xl text-[#e1e7ec] uppercase tracking-wider">
              KHO BỘ TIÊU CHÍ CHẤM ĐIỂM (TEMPLATES BANK)
            </h1>
            <p className="text-xs font-sans text-[#8a9ba8] mt-1 max-w-3xl">
              Quản lý các <strong className="text-[#8b5cf6]">Bộ Tiêu Chí</strong> (mỗi Bộ Tiêu Chí gồm nhiều Tiêu Chí thành phần với tổng trọng số 100%) để tái sử dụng nhanh khi cấu hình Sự kiện &amp; Hạng mục.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsBuilderModalOpen(true)}
            className="px-5 py-2.5 bg-[#8b5cf6] hover:bg-purple-600 text-white font-mono text-xs font-bold uppercase flex items-center gap-2 cursor-pointer transition-colors shadow-lg shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>TẠO BỘ TIÊU CHÍ MỚI</span>
          </button>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 2 Panels: Left = Danh Sách Bộ Tiêu Chí (Sets), Right = Chi Tiết Tiêu Chí Thành Phần */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel: DANH SÁCH CÁC BỘ TIÊU CHÍ (4 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#13191c] border border-[#263339] p-4 flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-[#8b5cf6] uppercase tracking-wider flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-[#8b5cf6]" />
                CÁC BỘ TIÊU CHÍ ĐÃ LƯU ({criteriaSets.length})
              </span>
              <span className="text-[10px] text-[#8a9ba8]">Bấm chọn để xem tiêu chí</span>
            </div>

            {/* List of Criteria Sets Cards */}
            <div className="space-y-3">
              {criteriaSets.map((set) => {
                const isSelected = set.id === selectedSetId;
                const setWeight = set.criterias.reduce((acc, c) => acc + c.weight, 0);

                return (
                  <div
                    key={set.id}
                    onClick={() => setSelectedSetId(set.id)}
                    className={`p-4 border transition-all cursor-pointer relative space-y-3 ${
                      isSelected
                        ? "bg-[#8b5cf6]/15 border-2 border-[#8b5cf6] text-[#e1e7ec] shadow-lg scale-[1.01]"
                        : "bg-[#13191c] border-[#263339] hover:border-[#8b5cf6] text-[#8a9ba8]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#8b5cf6]/20 text-[#8b5cf6] font-mono text-[10px] font-bold uppercase">
                            BỘ TIÊU CHÍ
                          </span>
                          <span className="font-mono text-[10px] text-[#8a9ba8]">{set.createdDate}</span>
                        </div>
                        <h3 className="font-sans font-bold text-sm text-[#e1e7ec] line-clamp-2">
                          {set.templateName}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* LOI_04: Clone button */}
                        <button
                          type="button"
                          title="Nhân bản bộ tiêu chí (Clone/Fork)"
                          onClick={(e) => handleCloneTemplate(set.id, e)}
                          className="p-1.5 text-[#8a9ba8] hover:text-[#8b5cf6] hover:bg-[#8b5cf6]/10 transition-colors cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Xóa bộ tiêu chí"
                          onClick={(e) => handleDeleteSet(set.id, set.templateName, e)}
                          className="p-1.5 text-[#8a9ba8] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs font-sans text-[#8a9ba8] line-clamp-2 leading-relaxed">
                      {set.description}
                    </p>

                    {/* Stats Footer */}
                    <div className="pt-2 border-t border-[#263339] flex items-center justify-between font-mono text-[11px]">
                      <span className="text-[#e1e7ec] font-semibold flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-[#8b5cf6]" />
                        {set.criterias.length} Tiêu Chí Thành Phần
                      </span>
                      <span className="text-[#10b981] font-bold">
                        Tổng Trọng Số: {setWeight}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: CHI TIẾT CÁC TIÊU CHÍ THÀNH PHẦN TRONG BỘ (7 cols) */}
          <div className="lg:col-span-7 bg-[#13191c] border border-[#263339] p-6 space-y-6">
            {!activeSet ? (
              <div className="p-12 text-center text-[#8a9ba8] font-mono text-xs space-y-3">
                <Sliders className="w-10 h-10 text-[#8b5cf6]/40 mx-auto" />
                <p className="font-semibold text-sm text-[#e1e7ec]">Chưa có bộ tiêu chí nào trong Ngân Hàng Hệ Thống</p>
                <p className="text-xs text-[#8a9ba8]">Nhấn nút "TẠO MỚI BỘ TIÊU CHÍ" góc trên bên phải để bắt đầu khởi tạo.</p>
              </div>
            ) : (
              <>
                {/* Active Set Header */}
                <div className="border-b border-[#263339] pb-4 space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-[#8b5cf6] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#8b5cf6]" />
                      CHI TIẾT BỘ TIÊU CHÍ ĐANG CHỌN
                    </span>
                    {activeSetTotalWeight === 100 ? (
                      <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                        ✓ TRỌNG SỐ ĐỦ 100%
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                        ⚠️ TRỌNG SỐ: {activeSetTotalWeight}% (CHƯA ĐỦ 100%)
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-4 pt-1">
                    <div>
                      <h2 className="font-sans font-bold text-xl text-[#e1e7ec]">
                        {activeSet.templateName}
                      </h2>
                      <p className="text-xs font-sans text-[#8a9ba8] leading-relaxed mt-1">
                        {activeSet.description || "Chưa có mô tả chi tiết cho bộ tiêu chí này."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleCloneTemplate(activeSet.id, e)}
                        className="px-3 py-1.5 bg-[#8b5cf6]/10 border border-[#8b5cf6]/40 hover:bg-[#8b5cf6]/20 text-[#c084fc] font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Sao chép toàn bộ tiêu chí sang mẫu mới để tùy biến độc lập"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>NHÂN BẢN (CLONE)</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteSet(activeSet.id, activeSet.templateName, e)}
                        className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>XÓA BỘ TIÊU CHÍ</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Total Weight Bar */}
                <div className="p-4 bg-[#0a0e10] border border-[#263339] space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8a9ba8]">THANH PHÂN BỔ TRỌNG SỐ CÁC TIÊU CHÍ:</span>
                    <span className={activeSetTotalWeight === 100 ? "text-[#10b981] font-bold" : "text-[#f59e0b] font-bold"}>
                      {activeSetTotalWeight}% / 100%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#182024] rounded-full overflow-hidden border border-[#263339]">
                    <div
                      className={activeSetTotalWeight === 100 ? "h-full bg-[#10b981] rounded-full" : "h-full bg-[#f59e0b] rounded-full"}
                      style={{ width: `${Math.min(activeSetTotalWeight, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* List of Component Criteria inside the Set */}
                <div className="space-y-4">
                  <h3 className="font-mono font-bold text-xs text-[#8a9ba8] uppercase tracking-wider">
                    DANH SÁCH {activeSet.criterias.length} TIÊU CHÍ THÀNH PHẦN BÊN TRONG BỘ:
                  </h3>

                  <div className="space-y-3">
                    {activeSet.criterias.length === 0 ? (
                      <div className="p-6 bg-[#0a0e10] border border-[#263339] text-center text-[#8a9ba8] font-mono text-xs space-y-1">
                        <p className="font-semibold text-amber-400">⚠️ Bộ tiêu chí này chưa có tiêu chí thành phần nào</p>
                        <p className="text-[11px] text-[#8a9ba8]/70">Dữ liệu hiện tại trên hệ thống chưa tạo các tiêu chí nhỏ cho bộ này.</p>
                      </div>
                    ) : (
                      activeSet.criterias.map((crit, idx) => (
                        <div key={crit.id} className="p-4 bg-[#0a0e10] border border-[#263339] space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#8b5cf6] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <h4 className="font-sans font-bold text-sm text-[#e1e7ec]">
                                {crit.criterionName}
                              </h4>
                            </div>

                            <div className="px-3 py-1 bg-[#182024] border border-[#263339] font-mono text-xs font-bold text-[#8b5cf6] shrink-0">
                              TRỌNG SỐ: {crit.weight}%
                            </div>
                          </div>

                          <p className="text-xs font-sans text-[#8a9ba8] pl-8 leading-relaxed">
                            {crit.description}
                          </p>

                          {/* Rubric level scale guide badge */}
                          <div className="pl-8 pt-1 flex items-center gap-2 font-mono text-[10px] text-[#8a9ba8]">
                            <span>Thang điểm: Max {crit.maxScore}đ</span>
                            <span>•</span>
                            <span className="text-[#10b981]">Thang Đánh Giá Chuẩn 0-100%</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

        </div>

      </main>

      {/* Builder Modal */}
      {isBuilderModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#13191c] border border-[#263339] max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between border-b border-[#263339] pb-4">
              <div className="flex items-center gap-2 text-[#8b5cf6] font-mono text-sm font-bold uppercase">
                <Plus className="w-4 h-4" />
                <span>SOẠN BỘ TIÊU CHÍ MỚI VÀO KHO HỆ THỐNG</span>
              </div>
              <button
                type="button"
                onClick={() => setIsBuilderModalOpen(false)}
                className="text-[#8a9ba8] hover:text-white font-mono text-xs cursor-pointer"
              >
                [ ĐÓNG ✕ ]
              </button>
            </div>

            <form onSubmit={handleSaveCriteriaSet} className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-[#8a9ba8] uppercase block">TÊN BỘ TIÊU CHÍ MỚI *</label>
                <input
                  type="text"
                  required
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  placeholder="VD: Bộ Tiêu Chí Đánh Giá AI & Cloud 2026..."
                  className="w-full px-3 py-2 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-sans font-bold text-sm focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#8a9ba8] uppercase block">MÔ TẢ CHI TIẾT</label>
                <input
                  type="text"
                  value={newSetDesc}
                  onChange={(e) => setNewSetDesc(e.target.value)}
                  placeholder="Mô tả phạm vi áp dụng hoặc mục đích của bộ tiêu chí này..."
                  className="w-full px-3 py-2 bg-[#0a0e10] border border-[#263339] text-[#8a9ba8] font-sans text-xs focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#8b5cf6] font-bold uppercase">DANH SÁCH TIÊU CHÍ THÀNH PHẦN</span>
                  <button
                    type="button"
                    onClick={handleAddCriteriaRow}
                    className="px-3 py-1 bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#8b5cf6] hover:bg-[#8b5cf6]/30 text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm Tiêu Chí
                  </button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {builderCriterias.map((c, idx) => (
                    <div key={c.id} className="p-4 bg-[#0a0e10] border border-[#263339] space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-[#8a9ba8]">Tiêu chí 0{idx + 1}</span>
                        {builderCriterias.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCriteriaRow(c.id)}
                            className="text-[#ef4444] hover:underline text-[11px] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" /> Xóa
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-8">
                          <input
                            type="text"
                            value={c.criterionName}
                            onChange={(e) => handleUpdateCriteriaRow(c.id, "criterionName", e.target.value)}
                            placeholder="Tên tiêu chí (VD: Ý tưởng sáng tạo)..."
                            className="w-full px-3 py-1.5 bg-[#182024] border border-[#263339] text-[#e1e7ec] font-sans font-bold text-xs focus:outline-none focus:border-[#8b5cf6]"
                          />
                        </div>

                        <div className="sm:col-span-4 flex items-center gap-2">
                          <span className="text-[#8a9ba8] text-[10px] shrink-0">Trọng số (%):</span>
                          <input
                            type="number"
                            min={5}
                            max={100}
                            value={c.weight}
                            onChange={(e) => handleUpdateCriteriaRow(c.id, "weight", Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-[#182024] border border-[#263339] text-[#8b5cf6] font-mono font-bold text-xs text-center focus:outline-none focus:border-[#8b5cf6]"
                          />
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={c.description}
                          onChange={(e) => handleUpdateCriteriaRow(c.id, "description", e.target.value)}
                          placeholder="Mô tả chi tiết hướng dẫn chấm điểm..."
                          className="w-full px-3 py-1.5 bg-[#182024] border border-[#263339] text-[#8a9ba8] font-sans text-xs focus:outline-none focus:border-[#8b5cf6]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Save CTA */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#263339]">
                <button
                  type="button"
                  onClick={() => setIsBuilderModalOpen(false)}
                  className="px-5 py-2.5 border border-[#263339] text-[#e1e7ec] hover:bg-[#263339]/50 font-mono text-xs"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={!isBuilderValid100 || isSubmitting}
                  className="px-6 py-2.5 bg-[#8b5cf6] hover:bg-purple-600 text-white font-mono font-bold text-xs uppercase cursor-pointer disabled:opacity-40"
                >
                  {isSubmitting ? "ĐANG LƯU BỘ TIÊU CHÍ..." : "LƯU BỘ TIÊU CHÍ VÀO KHO"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
