"use client";

import React, { useState } from "react";
import { Button, Card, Input, Badge } from "@/components/ui";
import { useGetCriterias, useGetTemplates, templatesRepository } from "@/repositories/templatesRepository";
import { Sliders, Plus, CheckCircle2, AlertTriangle, LayoutTemplate, ArrowLeft, Trash2, Check, Lock } from "lucide-react";
import Link from "next/link";

interface SelectedCriteriaState {
  criteriaId: string;
  name: string;
  weight: number;
  maxScore: number;
}

export const CoordinatorTemplatesView: React.FC = () => {
  const { data: criterias = [], refetch: refetchCriterias } = useGetCriterias();
  const { data: templates = [], refetch: refetchTemplates } = useGetTemplates();

  // Create Criteria Form
  const [newCritName, setNewCritName] = useState("");
  const [newCritDesc, setNewCritDesc] = useState("");
  const [newCritMaxScore, setNewCritMaxScore] = useState<number>(10);

  // Create Template Form
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [selectedCriterias, setSelectedCriterias] = useState<SelectedCriteriaState[]>([
    { criteriaId: "crit-1", name: "Tính đổi mới & sáng tạo", weight: 30, maxScore: 10 },
    { criteriaId: "crit-2", name: "Kiến trúc hệ thống & Code", weight: 40, maxScore: 10 },
    { criteriaId: "crit-3", name: "Trải nghiệm người dùng UX/UI", weight: 15, maxScore: 10 },
    { criteriaId: "crit-4", name: "Kỹ năng thuyết trình & Đô thị", weight: 15, maxScore: 10 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const totalWeight = selectedCriterias.reduce((acc, curr) => acc + curr.weight, 0);
  const isValidWeight100 = totalWeight === 100;

  const handleCreateCriteria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCritName.trim()) return;
    try {
      await templatesRepository.createCriteria({
        criterionName: newCritName,
        description: newCritDesc,
        maxScore: newCritMaxScore,
      });
      setNewCritName("");
      setNewCritDesc("");
      await refetchCriterias();
      setMessage("Tạo Tiêu chí dùng chung thành công!");
    } catch {
      alert("Tạo tiêu chí thất bại.");
    }
  };

  const handleAddCriteriaToDraft = (crit: any) => {
    const critId = crit.id || crit.Id || crit.criteriaId || crit.CriteriaId;
    if (selectedCriterias.some((c) => c.criteriaId === critId)) return;
    setSelectedCriterias((prev) => [
      ...prev,
      {
        criteriaId: critId,
        name: crit.criterionName || crit.CriterionName || crit.name || "Tiêu chí",
        weight: 10,
        maxScore: crit.maxScore || crit.MaxScore || 10,
      },
    ]);
  };

  const handleRemoveCriteriaFromDraft = (critId: string) => {
    setSelectedCriterias((prev) => prev.filter((c) => c.criteriaId !== critId));
  };

  const handleUpdateWeight = (critId: string, weight: number) => {
    setSelectedCriterias((prev) =>
      prev.map((c) => (c.criteriaId === critId ? { ...c, weight: Number(weight) } : c))
    );
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidWeight100) {
      alert(`Tổng trọng số phải đạt ĐÚNG 100%! Hiện tại là ${totalWeight}%.`);
      return;
    }
    if (!templateName.trim()) {
      alert("Vui lòng nhập tên Mẫu tiêu chí (Template).");
      return;
    }

    setIsSubmitting(true);
    try {
      const resTpl = await templatesRepository.createTemplate({
        templateName,
        description: templateDesc,
      });
      const tplId = (resTpl.data as any)?.id || (resTpl.data as any)?.Id || resTpl.data?.TemplateId || "tpl-1";

      for (const item of selectedCriterias) {
        await templatesRepository.addCriteriaToTemplate({
          templateId: tplId,
          criteriaId: item.criteriaId,
          weight: item.weight,
          maxScore: item.maxScore,
        });
      }

      await refetchTemplates();
      setTemplateName("");
      setTemplateDesc("");
      setMessage("Tạo và lưu Mẫu tiêu chí RBL (100%) thành công!");
    } catch {
      alert("Lưu Mẫu tiêu chí thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-4 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-muted)] pb-6">
          <div>
            <Link href="/coordinator/dashboard" className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--accent-coordinator)] hover:underline mb-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>&lt; QUAY LẠI DASHBOARD</span>
            </Link>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-3">
              <Sliders className="w-7 h-7 text-[var(--accent-coordinator)]" />
              Kho Tiêu Chí &amp; Mẫu Chấm RBL (Evaluation Templates)
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1 font-sans">
              Quản lý thư viện Tiêu chí dùng chung và khởi tạo Mẫu tiêu chí (Template) chuẩn 100% trọng số lưu trực tiếp vào Database.
            </p>
          </div>

          {message && (
            <Badge tone="success" className="font-mono text-xs flex items-center gap-1.5 py-1.5 px-3">
              <CheckCircle2 className="w-4 h-4" /> {message}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Panel Trái: Thư viện Tiêu chí Dùng chung (Criterias) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="font-display font-bold text-base text-[var(--text-primary)] uppercase flex items-center gap-2">
                <Plus className="w-4 h-4 text-[var(--accent-coordinator)]" />
                Tạo Tiêu Chí Dùng Chung Mới
              </h3>

              <form onSubmit={handleCreateCriteria} className="space-y-3">
                <Input type="text" value={newCritName} onChange={(e) => setNewCritName(e.target.value)} placeholder="Tên tiêu chí (VD: Tính độc đáo AI)" required />
                <Input type="text" value={newCritDesc} onChange={(e) => setNewCritDesc(e.target.value)} placeholder="Mô tả hướng dẫn chấm cho Giám khảo..." />
                <div className="flex items-center justify-between gap-4">
                  <div className="w-1/2">
                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">MaxScore</label>
                    <Input type="number" value={newCritMaxScore} onChange={(e) => setNewCritMaxScore(Number(e.target.value))} />
                  </div>
                  <Button type="submit" variant="secondary" className="w-1/2 text-xs font-mono self-end">
                    + LƯU TIÊU CHÍ
                  </Button>
                </div>
              </form>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="font-display font-bold text-base text-[var(--text-primary)] uppercase">
                Thư Viện Tiêu Chí Khả Dụng ({criterias.length})
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-sans">Bấm [+ Thêm vào Mẫu] để đưa tiêu chí vào Mẫu đang soạn thảo.</p>

              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {criterias.map((crit: any, index: number) => {
                  const id = crit.id || crit.Id || crit.criteriaId || crit.CriteriaId || `c-${index}`;
                  const name = crit.criterionName || crit.CriterionName || crit.criteriaName || crit.name;
                  const desc = crit.description || crit.Description;
                  const isAdded = selectedCriterias.some((c) => c.criteriaId === id);

                  return (
                    <div key={id} className="p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h4 className="font-sans font-bold text-xs text-[var(--text-primary)]">{name}</h4>
                        <p className="text-[11px] text-[var(--text-muted)] font-sans line-clamp-2">{desc || "Chưa có mô tả"}</p>
                      </div>

                      <Button
                        type="button"
                        variant={isAdded ? "ghost" : "secondary"}
                        disabled={isAdded}
                        onClick={() => handleAddCriteriaToDraft(crit)}
                        className="text-[10px] font-mono shrink-0"
                      >
                        {isAdded ? "ĐÃ CHỌN ✓" : "+ THÊM VÀO MẪU"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Panel Phải: Thiết kế & Cấu hình Mẫu Chấm (Template Builder) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="hud-glow-coordinator p-6 space-y-6">
              
              {/* Gauge Meter 100% */}
              <div className="p-4 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[var(--accent-coordinator)]" />
                    Thanh Kiểm Tra Tổng Trọng Số (Weight Progress Meter)
                  </span>

                  <Badge tone={isValidWeight100 ? "success" : "danger"} className="font-mono text-xs">
                    {isValidWeight100 ? "✓ ĐÚNG 100% HỢP LỆ" : `⚠️ ${totalWeight}% / 100%`}
                  </Badge>
                </div>

                {/* Progress Visual Bar */}
                <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-[var(--border-muted)] p-0.5">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isValidWeight100 ? "bg-[var(--accent-coordinator)] shadow-[0_0_12px_rgba(56,189,248,0.8)]" : totalWeight > 100 ? "bg-red-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${Math.min(totalWeight, 100)}%` }}
                  />
                </div>

                {!isValidWeight100 && (
                  <p className="text-xs text-[var(--color-danger)] font-mono flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Tổng trọng số tiêu chí phải đạt chính xác 100%. Hiện tại lệch {Math.abs(100 - totalWeight)}%.
                  </p>
                )}
              </div>

              {/* Form Soạn Mẫu */}
              <form onSubmit={handleSaveTemplate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-[var(--text-muted)]">Tên Mẫu Tiêu Chí (Template Name)</label>
                  <Input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="VD: Mẫu Chuẩn AI & Machine Learning 2026" required />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-[var(--text-muted)]">Mô Tả Ứng Dụng Mẫu Chấm</label>
                  <Input type="text" value={templateDesc} onChange={(e) => setTemplateDesc(e.target.value)} placeholder="Áp dụng cho các hạng mục AI, Đột phá Công nghệ..." />
                </div>

                {/* List Selected Criteria with Weight Sliders */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-mono font-bold text-xs text-[var(--text-primary)] uppercase">
                    Danh Sách Tiêu Chí Trong Mẫu ({selectedCriterias.length})
                  </h4>

                  {selectedCriterias.map((item, index) => (
                    <div key={item.criteriaId} className="p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-sans font-bold text-xs text-[var(--text-primary)]">
                          {index + 1}. {item.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCriteriaFromDraft(item.criteriaId)}
                          className="text-xs font-mono text-[var(--color-danger)] hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Gỡ
                        </button>
                      </div>

                      <div className="flex items-center gap-4 pt-1">
                        <div className="flex-1 space-y-1">
                          <input
                            type="range"
                            min="5"
                            max="70"
                            step="5"
                            value={item.weight}
                            onChange={(e) => handleUpdateWeight(item.criteriaId, Number(e.target.value))}
                            className="w-full accent-[var(--accent-coordinator)] cursor-pointer"
                          />
                        </div>

                        <div className="w-24 shrink-0 flex items-center gap-1 bg-[var(--bg-input)] border border-[var(--border-muted)] px-2 py-1 rounded">
                          <span className="text-xs font-mono text-[var(--text-muted)]">Trọng số:</span>
                          <span className="text-xs font-mono font-bold text-[var(--accent-coordinator)]">{item.weight}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  accent="coordinator"
                  disabled={!isValidWeight100 || isSubmitting}
                  className="w-full hud-clipped font-mono text-xs py-3 flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Lock className="w-4 h-4" />
                  {isSubmitting ? "ĐANG LƯU MẪU..." : "LƯU MẪU TIÊU CHÍ VÀO DATABASE (SAVE TEMPLATE)"}
                </Button>
              </form>
            </Card>

            {/* List Existing Templates in Database */}
            <Card className="p-6 space-y-4">
              <h3 className="font-display font-bold text-base text-[var(--text-primary)] uppercase flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-[var(--accent-coordinator)]" />
                Mẫu Tiêu Chí Đã Lưu Trong Database ({templates.length})
              </h3>

              <div className="space-y-3">
                {templates.map((tpl: any, index: number) => {
                  const id = tpl.id || tpl.Id || tpl.templateId || `t-${index}`;
                  const name = tpl.templateName || tpl.TemplateName || "Mẫu Tiêu Chí";
                  return (
                    <div key={id} className="p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped flex items-center justify-between">
                      <div>
                        <h4 className="font-mono font-bold text-xs text-[var(--text-primary)]">{name}</h4>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono">ID: {id} | 100% Trọng số RBL</p>
                      </div>
                      <Badge tone="success">SẴN SÀNG ÁP DỤNG</Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

        </div>

      </main>
    </div>
  );
};
