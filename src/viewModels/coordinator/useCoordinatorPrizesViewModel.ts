import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  useGetPrizesByEvent,
  useCreatePrize,
  useUpdatePrize,
  useDeletePrize,
  type Prize,
} from "@/repositories/results/prizesRepository";
import { useMyEvents } from "@/repositories/eventsRepository";
import { usePagination } from "@/hooks/usePagination";

export interface DraftPrize {
  id: string;
  isNew: boolean;
  prizeName: string;
  quantity: number;
  value: string;
}

const toDraft = (p: Prize): DraftPrize => ({
  id: p.id || (p as any).Id || "",
  isNew: false,
  prizeName: p.prizeName || (p as any).PrizeName || "",
  quantity: p.quantity || (p as any).Quantity || 1,
  value: p.value || (p as any).Value || "",
});

export function useCoordinatorPrizesViewModel() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: eventsList = [] } = useMyEvents();

  const [selectedEventId, setSelectedEventId] = useState<string>(
    (searchParams?.get("eventId") as string) || (params?.id as string) || ""
  );
  const eventId =
    selectedEventId ||
    (eventsList[0]
      ? String((eventsList[0] as any).id || (eventsList[0] as any).Id || (eventsList[0] as any).eventId || (eventsList[0] as any).EventId || "")
      : "");

  const { data: serverPrizes = [], isLoading: isLoadingPrizes } = useGetPrizesByEvent(eventId);
  const createPrizeMutation = useCreatePrize();
  const updatePrizeMutation = useUpdatePrize();
  const deletePrizeMutation = useDeletePrize();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [prizes, setPrizes] = useState<DraftPrize[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  useEffect(() => {
    setPrizes((serverPrizes as Prize[]).map(toDraft));
    setRemovedIds([]);
  }, [serverPrizes]);

  const handleAddPrize = () => {
    setPrizes((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, isNew: true, prizeName: "", quantity: 1, value: "" },
    ]);
  };

  const handleRemovePrize = (id: string, isNew?: boolean) => {
    setPrizes((prev) => prev.filter((p) => p.id !== id));
    if (!isNew) {
      setRemovedIds((prev) => [...prev, id]);
    }
  };

  const handleUpdatePrize = (id: string, field: keyof DraftPrize, value: any) => {
    setPrizes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const prizeEntries = useMemo(() => {
    return prizes.map((p, originalIdx) => ({ p, originalIdx }));
  }, [prizes]);

  const pagination = usePagination(prizeEntries, 5);

  const totalPrizeBudget = prizes.reduce((acc, p) => {
    const val = Number(p.value.replace(/[^0-9]/g, "")) || 0;
    return acc + val * (p.quantity || 1);
  }, 0);

  const handleSaveConfig = async () => {
    if (!eventId) return;
    const invalid = prizes.some((p) => !p.prizeName.trim() || !p.value.trim());
    if (invalid) {
      setErrorMessage("Vui lòng nhập đầy đủ Tên giải thưởng và Giá trị cho tất cả các dòng.");
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      for (const id of removedIds) {
        await deletePrizeMutation.mutateAsync(id);
      }
      for (const p of prizes) {
        const payload = { prizeName: p.prizeName.trim(), value: p.value.trim(), quantity: p.quantity };
        if (p.isNew) {
          await createPrizeMutation.mutateAsync({ eventId, payload });
        } else {
          await updatePrizeMutation.mutateAsync({ id: p.id, payload });
        }
      }
      setRemovedIds([]);
      setSuccessMessage(`Đã lưu thành công ${prizes.length} giải thưởng — Tổng ngân sách ${totalPrizeBudget.toLocaleString("vi-VN")} VNĐ.`);
    } catch (err: any) {
      setErrorMessage(`Lưu cấu hình thất bại: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    state: {
      selectedEventId,
      eventId,
      prizes,
      isSubmitting,
      successMessage,
      errorMessage,
      totalPrizeBudget,
      isLoadingPrizes,
    },
    data: {
      eventsList,
      serverPrizes,
      prizeEntries,
    },
    pagination,
    actions: {
      setSelectedEventId,
      handleAddPrize,
      handleRemovePrize,
      handleUpdatePrize,
      handleSaveConfig,
    },
  };
}
