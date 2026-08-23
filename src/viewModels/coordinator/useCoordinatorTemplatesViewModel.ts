import React, { useState, useEffect } from "react";
import { useGetTemplates, templatesRepository } from "@/repositories/templatesRepository";
import { usePagination } from "@/hooks/usePagination";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

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

export function useCoordinatorTemplatesViewModel() {
  const { data: dbTemplates = [], refetch: refetchTemplates } = useGetTemplates();

  const [criteriaSets, setCriteriaSets] = useState<CriteriaSetItem[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>("");

  useEffect(() => {
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

  const setPagination = usePagination(criteriaSets, 4);

  const activeSet = criteriaSets.find((s) => s.id === selectedSetId) || criteriaSets[0];
  const activeSetTotalWeight = (activeSet?.criterias || []).reduce((acc, c) => acc + c.weight, 0);

  const criteriaPagination = usePagination(activeSet?.criterias || [], 4);

  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const unsavedChanges = useUnsavedChanges(isDirty);

  const [newSetName, setNewSetName] = useState("");
  const [newSetDesc, setNewSetDesc] = useState("");
  const [builderCriterias, setBuilderCriterias] = useState<CriteriaInsideSet[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleOpenCreateModal = () => {
    setEditingSetId(null);
    setNewSetName("");
    setNewSetDesc("");
    setBuilderCriterias([
      {
        id: `new-${Date.now()}-1`,
        criterionName: "Tiêu chí Đổi Mới & Sáng Tạo",
        weight: 40,
        maxScore: 10,
        description: "Đánh giá tính độc đáo, khác biệt và hàm lượng công nghệ.",
      },
      {
        id: `new-${Date.now()}-2`,
        criterionName: "Tiêu chí Tính Khả Thi & Triển Khai",
        weight: 60,
        maxScore: 10,
        description: "Đánh giá khả năng áp dụng thực tế và hoàn thiện mô hình.",
      },
    ]);
    setIsBuilderModalOpen(true);
  };

  const handleOpenEditModal = (set: CriteriaSetItem) => {
    setEditingSetId(set.id);
    setNewSetName(set.templateName);
    setNewSetDesc(set.description);
    setBuilderCriterias(
      set.criterias.length > 0
        ? set.criterias.map((c) => ({ ...c }))
        : [
            {
              id: `crit-${Date.now()}`,
              criterionName: "Tiêu chí thành phần 1",
              weight: 100,
              maxScore: 10,
              description: "Mô tả chi tiết tiêu chí chấm điểm...",
            },
          ]
    );
    setIsBuilderModalOpen(true);
  };

  const builderTotalWeight = builderCriterias.reduce((acc, c) => acc + (Number(c.weight) || 0), 0);
  const isBuilderValid100 = builderTotalWeight === 100;

  const handleAddCriteriaRow = () => {
    setIsDirty(true);
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

  const handleRemoveCriteriaRow = (id: string) => {
    if (builderCriterias.length <= 1) return;
    setIsDirty(true);
    setBuilderCriterias((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateCriteriaRow = (id: string, field: keyof CriteriaInsideSet, value: any) => {
    setIsDirty(true);
    setBuilderCriterias((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSaveCriteriaSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetName.trim()) {
      alert("Vui lòng nhập tên cho Bộ Tiêu Chí!");
      return;
    }
    if (!isBuilderValid100) {
      alert(`Tổng trọng số của Bộ tiêu chí phải bằng ĐÚNG 100%! (Hiện tại: ${builderTotalWeight}%).`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSetId) {
        setCriteriaSets((prev) =>
          prev.map((s) =>
            s.id === editingSetId
              ? { ...s, templateName: newSetName, description: newSetDesc, criterias: builderCriterias }
              : s
          )
        );
        setSuccessMessage(`Đã cập nhật thành công Bộ tiêu chí "${newSetName}"!`);
      } else {
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
        setSuccessMessage(`Đã tạo và lưu thành công "${newSetName}" vào Kho Bộ Tiêu Chí!`);
      }

      setIsBuilderModalOpen(false);
      setIsDirty(false);
      setNewSetName("");
      setNewSetDesc("");
      setEditingSetId(null);
    } catch {
      alert("Lưu Bộ tiêu chí thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

      setSuccessMessage(`Đã xóa thành công bộ tiêu chí "${setName}" khỏi Kho Hệ Thống!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch {
      alert("Xóa Bộ tiêu chí thất bại!");
    }
  };

  return {
    state: {
      criteriaSets,
      selectedSetId,
      activeSet,
      activeSetTotalWeight,
      isBuilderModalOpen,
      editingSetId,
      newSetName,
      newSetDesc,
      builderCriterias,
      builderTotalWeight,
      isBuilderValid100,
      isSubmitting,
      successMessage,
      unsavedChanges,
    },
    pagination: {
      setPagination,
      criteriaPagination,
    },
    actions: {
      setSelectedSetId,
      setIsBuilderModalOpen,
      setNewSetName,
      setNewSetDesc,
      handleOpenCreateModal,
      handleOpenEditModal,
      handleAddCriteriaRow,
      handleRemoveCriteriaRow,
      handleUpdateCriteriaRow,
      handleSaveCriteriaSet,
      handleDeleteSet,
      setSuccessMessage,
    },
  };
}
