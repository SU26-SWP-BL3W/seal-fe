import { useState } from "react";
import { useParams } from "next/navigation";
import { useGetTemplates } from "@/repositories/templatesRepository";
import { tracksRepository } from "@/repositories/tracksRepository";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

export function useCoordinatorAssignTemplateViewModel() {
  const params = useParams();
  const trackId = (params?.trackId as string) || "";

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const { showModal, confirmLeave, cancelStay } = useUnsavedChanges(isDirty);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: templatesList = [] } = useGetTemplates();

  const selectedTemplate = templatesList.find((t: any) => (t.id || t.Id) === selectedTemplateId);
  const activeCriteriaList: any[] = (selectedTemplate as any)?.criterias || (selectedTemplate as any)?.TemplateCriterias || [];
  const runningTotalWeight = activeCriteriaList.reduce((acc: number, c: any) => acc + (c.weight || c.Weight || 0), 0);
  const missingAllocation = 100.0 - runningTotalWeight;
  const isWeightValid = activeCriteriaList.length === 0 || runningTotalWeight === 100.0;

  const handleAssignTemplate = async () => {
    if (!isWeightValid) {
      setErrorMessage("TỔNG TRỌNG SỐ TIÊU CHÍ PHẢI ĐỦ 100%");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await tracksRepository.assignTemplateToTrack(trackId, selectedTemplateId);
      setSuccessMessage("ĐÃ GÁN MẪU TIÊU CHÍ CHO HẠNG MỤC THÀNH CÔNG!");
      setIsDirty(false);
    } catch (err: any) {
      setErrorMessage(`Gán mẫu thất bại: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    state: {
      trackId,
      selectedTemplateId,
      selectedTemplate,
      activeCriteriaList,
      runningTotalWeight,
      missingAllocation,
      isWeightValid,
      isSubmitting,
      errorMessage,
      successMessage,
      showModal,
      isDirty,
    },
    data: {
      templatesList,
    },
    actions: {
      setSelectedTemplateId,
      setIsDirty,
      handleAssignTemplate,
      confirmLeave,
      cancelStay,
    },
  };
}
