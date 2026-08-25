import { useState, useMemo } from "react";
import { appealsRepository, AppealStatus, useAppealsByRound } from "@/repositories/appealsRepository";
import { useMyEvents, useEvents, useEventRounds } from "@/repositories/eventsRepository";
import { useGetTeamsByEvent } from "@/repositories/teamsRepository";
import { useGetEventRoles } from "@/repositories/staffRepository";
import { usePagination } from "@/hooks/usePagination";
import { useAuth } from "@/providers/AuthProvider";

/**
 * =========================================================================================
 * VIEWMODEL: useCoordinatorAppealsViewModel
 * MÔ HÌNH: MVVM (Model - View - ViewModel)
 * VAI TRÒ: Điều phối viên (Event Coordinator - EC) / Ban Tổ Chức
 * 
 * NHIỆM VỤ CHÍNH:
 *   1. Quản lý State và logic xử lý hàng đợi đơn phúc khảo (/coordinator/appeals).
 *   2. Tự động truy vấn danh sách Sự kiện -> Vòng thi -> Đơn phúc khảo (Appeals) của vòng.
 *   3. Lọc danh sách Giám khảo (Judges) trong sự kiện để phân công chấm lại.
 *   4. Cung cấp 2 Action chính:
 *      - `handleApproveAppeal`: Duyệt đơn (status=1) & phân công Giám khảo (assignedJudgeId) chấm lại.
 *      - `handleRejectAppeal`: Từ chối đơn (status=2) kèm lý do giải trình bắt buộc (rejectReason).
 * =========================================================================================
 */
export function useCoordinatorAppealsViewModel() {
  const { user: currentUser } = useAuth();

  // ---------------------------------------------------------------------------------------
  // [BƯỚC 1]: TRUY VẤN SỰ KIỆN & VÒNG THI (CASCADE QUERIES)
  // ---------------------------------------------------------------------------------------
  const { data: rawMyEvents = [] } = useMyEvents();
  const { data: rawAllEvents = [] } = useEvents();
  const myEventsList = Array.isArray(rawMyEvents) ? rawMyEvents : (rawMyEvents as any)?.data ?? [];
  const allEvents = Array.isArray(rawAllEvents) ? rawAllEvents : (rawAllEvents as any)?.data ?? [];

  const eventsList = useMemo(() => {
    if (currentUser?.isAdmin || currentUser?.IsAdmin) {
      return allEvents;
    }
    // Với EC: CHỈ lấy các sự kiện mình được phân công
    return myEventsList;
  }, [myEventsList, allEvents, currentUser?.isAdmin, currentUser?.IsAdmin]);

  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const eventId = selectedEventId || (eventsList[0] ? String((eventsList[0] as any).id || (eventsList[0] as any).Id || (eventsList[0] as any).eventId || (eventsList[0] as any).EventId || "") : "");

  const { data: rounds = [] } = useEventRounds(eventId);
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const roundId = selectedRoundId || (rounds[0] ? String((rounds[0] as any).id || (rounds[0] as any).Id || "") : "");

  // Lấy danh sách nhân sự sự kiện và lọc ra những người có vai trò Giám khảo (Judge)
  const { data: eventRoles = [] } = useGetEventRoles(eventId);
  const judges = eventRoles.filter((r: any) => (r.roleName || r.RoleName) === "Judge");

  // Tra cứu Map Tên đội thi theo ID
  const { data: teams = [] } = useGetTeamsByEvent(eventId);
  const teamNameById = useMemo(() => {
    const map = new Map<string, string>();
    (teams as any[]).forEach((t) => {
      const id = t.id || t.Id;
      const name = t.name || t.Name || t.teamName || t.TeamName;
      if (id) map.set(id, name || id);
    });
    return map;
  }, [teams]);

  // ---------------------------------------------------------------------------------------
  // [BƯỚC 2]: TRUY VẤN DANH SÁCH ĐƠN PHÚC KHẢO TRONG VÒNG (APPEALS QUERY)
  // ---------------------------------------------------------------------------------------
  const { data: appeals = [], isLoading, refetch } = useAppealsByRound(roundId);
  const displayAppeals = appeals;

  // Phân trang 6 đơn / trang
  const pagination = usePagination(displayAppeals, 6);

  // ---------------------------------------------------------------------------------------
  // [BƯỚC 3]: STATE QUẢN LÝ THAO TÁC DUYỆT / TỪ CHỐI
  // ---------------------------------------------------------------------------------------
  const [selectedAppealId, setSelectedAppealId] = useState<string | null>(null);
  const [assignedJudgeId, setAssignedJudgeId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingAppealId, setRejectingAppealId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ---------------------------------------------------------------------------------------
  // [ACTION 1]: DUYỆT ĐƠN PHÚC KHẢO & PHÂN CÔNG GIÁM KHẢO (APPROVE APPEAL)
  // Gửi request PUT /api/Appeals/{id}/respond với status = 1 (Approved)
  // ---------------------------------------------------------------------------------------
  const handleApproveAppeal = async () => {
    if (!selectedAppealId) return;
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await appealsRepository.respondAppeal(
        selectedAppealId,
        true, // isApproved = true
        "Chấp nhận đơn phúc khảo.",
        assignedJudgeId || undefined // ID Giám khảo phụ trách chấm lại bài nộp
      );
      setSuccessMessage(`Đã duyệt đơn phúc khảo và phân công Giám khảo chấm lại.`);
      setSelectedAppealId(null); // Đóng modal duyệt
      await refetch();           // Làm mới lại bảng đơn
    } catch (err: any) {
      setErrorMessage(`Duyệt đơn thất bại: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------------------
  // [ACTION 2]: TỪ CHỐI ĐƠN PHÚC KHẢO (REJECT APPEAL)
  // Gửi request PUT /api/Appeals/{id}/respond với status = 2 (Rejected) kèm lý do bắt buộc
  // ---------------------------------------------------------------------------------------
  const handleRejectAppeal = async () => {
    if (!rejectingAppealId || !rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối đơn phúc khảo!");
      return;
    }
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await appealsRepository.respondAppeal(
        rejectingAppealId,
        false, // isApproved = false (Rejected)
        rejectReason.trim() // Nội dung giải trình gửi cho Đội thi
      );
      setSuccessMessage(`Đã từ chối đơn phúc khảo với lý do: "${rejectReason}".`);
      setRejectingAppealId(null); // Đóng modal từ chối
      setRejectReason("");
      await refetch();
    } catch (err: any) {
      setErrorMessage(`Từ chối đơn thất bại: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------------------
  // [BƯỚC 4]: TRẢ VỀ STATE, DATA, PAGINATION & ACTIONS CHO VIEW (VIEW CONTRACT)
  // ---------------------------------------------------------------------------------------
  return {
    state: {
      selectedEventId,
      selectedRoundId,
      eventId,
      roundId,
      selectedAppealId,
      assignedJudgeId,
      rejectReason,
      rejectingAppealId,
      isSubmitting,
      successMessage,
      errorMessage,
    },
    data: {
      eventsList,
      rounds,
      judges,
      teamNameById,
      appeals,
      displayAppeals,
      isLoading,
    },
    pagination,
    actions: {
      setSelectedEventId,
      setSelectedRoundId,
      setSelectedAppealId,
      setAssignedJudgeId,
      setRejectReason,
      setRejectingAppealId,
      handleApproveAppeal,
      handleRejectAppeal,
      refetch,
    },
  };
}
