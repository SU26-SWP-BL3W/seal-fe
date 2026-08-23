import { useState } from "react";
import { useMyEvents, eventsRepository } from "@/repositories/eventsRepository";
import { useGetPendingTeams } from "@/repositories/teamsRepository";
import { useGetUsers } from "@/repositories/usersRepository";

export function useCoordinatorDashboardViewModel() {
  const { data: eventsList = [], isLoading, refetch } = useMyEvents();
  const { data: pendingTeams = [] } = useGetPendingTeams();
  const { data: pendingUsersData } = useGetUsers({ isApproved: false });
  const appealsList: { status?: number | string; Status?: string }[] = [];

  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [togglingEventId, setTogglingEventId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const handleTogglePublish = async (eventId: string, currentStatus: boolean, eventName: string) => {
    const nextStatus = !currentStatus;
    const confirmMsg = nextStatus
      ? `Bạn có chắc chắn muốn CÔNG BỐ sự kiện "${eventName}" lên trang chủ công khai không?`
      : `Bạn có chắc chắn muốn TẠM ẨN sự kiện "${eventName}" về trạng thái Bản Nháp (Draft) để chỉnh sửa không? Trong thời gian ẩn, thí sinh sẽ không thể thấy hay đăng ký mới.`;

    if (!confirm(confirmMsg)) return;

    setTogglingEventId(eventId);
    try {
      await eventsRepository.updateEvent(eventId, { status: nextStatus });
      await refetch();
    } catch (err: any) {
      alert(`Thao tác thất bại: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setTogglingEventId(null);
    }
  };

  const pendingStudentsList = pendingUsersData?.data ?? [];
  const pendingTeamsCount = pendingTeams.length;
  const pendingStudentsCount = pendingStudentsList.length;
  const openAppealsCount = Array.isArray(appealsList)
    ? appealsList.filter((a: any) => a.status === 0 || a.status === "Pending" || a.Status === "Filed").length
    : 0;

  const seenEventKeys = new Set<string>();
  const filteredEvents = eventsList
    .filter((ev, idx) => {
      const id = ev.id || ev.Id || ev.eventId || ev.EventId || `ev-id-${idx}`;
      return !deletedIds.includes(id);
    })
    .filter((ev) => {
      const name = (ev.eventName || ev.EventName || "").trim();
      if (!name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      const key = `${name.toLowerCase()}-${ev.year || ev.Year || 2026}`;
      if (seenEventKeys.has(key)) return false;
      seenEventKeys.add(key);
      return true;
    });

  const handleDeleteEvent = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      if (!deleteTargetId.startsWith("ev-id-")) {
        await eventsRepository.deleteEvent(deleteTargetId);
      }
      setDeletedIds((prev) => [...prev, deleteTargetId]);
      await refetch();
    } catch (err) {
      alert("Xóa sự kiện thất bại. Vui lòng kiểm tra lại quyền truy cập.");
    } finally {
      setDeleteTargetId(null);
      setIsDeleting(false);
    }
  };

  return {
    state: {
      searchTerm,
      deleteTargetId,
      deleteTargetName,
      isDeleting,
      togglingEventId,
      isLoading,
      now,
      pendingTeamsCount,
      pendingStudentsCount,
      openAppealsCount,
    },
    data: {
      eventsList,
      filteredEvents,
    },
    actions: {
      setSearchTerm,
      setDeleteTargetId,
      setDeleteTargetName,
      handleTogglePublish,
      handleDeleteEvent,
      refetch,
    },
  };
}
