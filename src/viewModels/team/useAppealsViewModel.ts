import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useMyTeam } from "@/repositories/teamsRepository";
import { useMySubmissions } from "@/repositories/submitResultsRepository";
import {
  useGetAppealsByTeam,
  useGetAppealsByEvent,
  useCreateAppeal,
  useRespondAppeal,
  readApiError,
  AppealStatus,
  type Appeal,
} from "@/repositories/appealsRepository";
import { usePagination } from "@/hooks/usePagination";
import { useToast } from "@/providers/ToastProvider";
import { pushSystemNotification } from "@/repositories/shared/notificationsRepository";

function pick(obj: unknown, ...keys: string[]): string {
  const rec = obj as Record<string, unknown> | null;
  if (!rec) return "";
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

export function useAppealsViewModel() {
  const toast = useToast();
  const { user, activeRole } = useAuth();
  const [reason, setReason] = useState("");
  const [submitResultId, setSubmitResultId] = useState("");
  const [formError, setFormError] = useState("");

  const [detailModal, setDetailModal] = useState<Appeal | null>(null);
  const [responseText, setResponseText] = useState("");
  const [respondError, setRespondError] = useState("");

  const roleName = pick(activeRole, "roleName", "RoleName");
  const isLeader = roleName === "TeamLeader";
  const isEC = roleName === "EventCoordinator" || roleName === "Coordinator" || Boolean(user?.isAdmin || user?.IsAdmin);
  const eventIdFromRole = pick(activeRole, "eventId", "EventId");

  const { data: myTeam } = useMyTeam(eventIdFromRole || undefined);
  const teamId = pick(myTeam, "id", "Id", "TeamId");
  const { data: mySubmissions = [] } = useMySubmissions();

  const teamAppeals = useGetAppealsByTeam(!isEC ? teamId || undefined : undefined);
  const eventAppeals = useGetAppealsByEvent(isEC ? eventIdFromRole || undefined : undefined);

  const { data: appealsRaw, isLoading, refetch } = isEC ? eventAppeals : teamAppeals;
  const appeals: Appeal[] = Array.isArray(appealsRaw) ? appealsRaw : ((appealsRaw as any)?.data ?? []);

  const pagination = usePagination(appeals, 6);

  const { mutateAsync: createAppeal, isPending: isSubmitting } = useCreateAppeal();
  const { mutateAsync: respondAppeal, isPending: isResponding } = useRespondAppeal();

  const handleCreateAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!reason.trim() || !submitResultId) return;

    try {
      await createAppeal({ submitResultId, reason: reason.trim() });
      toast.success("Đã gửi đơn phúc khảo thành công! Ban Tổ Chức sẽ tiếp nhận và phản hồi kết quả qua email và thông báo chuông.");
      pushSystemNotification({
        title: "Gửi đơn phúc khảo thành công",
        message: `Đội thi đã gửi đơn phúc khảo bài nộp. Ban Tổ Chức sẽ tiếp nhận và xử lý sớm nhất.`,
        type: "info",
      });
      pushSystemNotification({
        title: "Đơn phúc khảo mới cần xử lý",
        message: `Có đơn phúc khảo mới từ Đội thi cho bài nộp. Cán bộ điều phối vui lòng kiểm tra và xử lý.`,
        type: "warning",
      });
      setReason("");
      setSubmitResultId("");
      refetch();
    } catch (err) {
      const errMsg = readApiError(err);
      setFormError(errMsg);
      toast.error(errMsg);
    }
  };

  const handleRespond = async (status: typeof AppealStatus.Approved | typeof AppealStatus.Rejected) => {
    if (!detailModal || !responseText.trim()) return;
    setRespondError("");
    try {
      await respondAppeal({ id: detailModal.id, appealId: detailModal.id, status, response: responseText.trim(), payload: { status, response: responseText.trim() } } as any);
      if (status === AppealStatus.Approved) {
        toast.success("✅ Đã phê duyệt đơn phúc khảo. Điểm số bài thi đã được cập nhật và gửi thông báo tới đội thi.");
        pushSystemNotification({
          title: "Đơn phúc khảo đã được phê duyệt",
          message: `Đơn phúc khảo của bạn đã được Ban Tổ Chức phê duyệt: "${responseText.trim()}". Điểm số đã được điều chỉnh.`,
          type: "success",
        });
      } else {
        toast.info("Đã từ chối đơn phúc khảo. Lý do phản hồi đã được gửi qua thông báo và email tới đội thi.");
        pushSystemNotification({
          title: "Kết quả xử lý phúc khảo",
          message: `Ban Tổ Chức đã phản hồi đơn phúc khảo của bạn: "${responseText.trim()}".`,
          type: "warning",
        });
      }
      setDetailModal(null);
      setResponseText("");
      refetch();
    } catch (err) {
      const errMsg = readApiError(err);
      setRespondError(errMsg);
      toast.error(errMsg);
    }
  };

  const relatedSubmission = detailModal
    ? mySubmissions.find((s: any) => pick(s, "id", "Id") === detailModal.submitResultId)
    : undefined;

  return {
    state: {
      reason,
      submitResultId,
      formError,
      detailModal,
      responseText,
      respondError,
      isLeader,
      isEC,
      isLoading,
      isSubmitting,
      isResponding,
      relatedSubmission,
    },
    data: {
      appeals,
      mySubmissions,
    },
    pagination,
    actions: {
      setReason,
      setSubmitResultId,
      setDetailModal,
      setResponseText,
      handleCreateAppeal,
      handleRespond,
      refetch,
    },
  };
}
