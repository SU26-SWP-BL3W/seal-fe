import React, { useState } from "react";
import type { EventItem } from "@/viewModels/public/eventsMetadata";
import { staffRepository } from "@/repositories/staffRepository";
import { useEvents } from "@/repositories/eventsRepository";
import { usersRepository } from "@/repositories/usersRepository";
import { useSetupDemoEvents, useSetupDemoAppealEvent, useSetupFullEventDemo } from "@/repositories/shared/demoRepository";

export function useAdminDashboardViewModel() {
  const { data: rawEvents = [], refetch } = useEvents();
  const realEvents = Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data ?? [];
  const displayEvents = realEvents;

  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [ecEmail, setEcEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignSuccessMessage, setAssignSuccessMessage] = useState<string | null>(null);

  const { mutateAsync: setupDemoEvents, isPending: isSettingUpDemoEvents } = useSetupDemoEvents();
  const { mutateAsync: setupDemoAppealEvent, isPending: isSettingUpAppealDemo } = useSetupDemoAppealEvent();
  const { mutateAsync: setupFullEventDemo, isPending: isSettingUpFullDemo } = useSetupFullEventDemo();
  const [demoToolMessage, setDemoToolMessage] = useState<string | null>(null);

  const handleSetupDemoEvents = async () => {
    try {
      await setupDemoEvents(new Date().toISOString());
      setDemoToolMessage("Đã tạo 2 sự kiện demo (Nộp bài + Chấm điểm) quanh ngày hôm nay.");
      refetch();
    } catch (err: any) {
      setDemoToolMessage(err?.response?.data?.message || "Tạo sự kiện demo thất bại.");
    }
  };

  const handleSetupDemoAppealEvent = async () => {
    try {
      await setupDemoAppealEvent(new Date().toISOString());
      setDemoToolMessage("Đã tạo 1 sự kiện demo ở giai đoạn Phúc khảo.");
      refetch();
    } catch (err: any) {
      setDemoToolMessage(err?.response?.data?.message || "Tạo sự kiện demo phúc khảo thất bại.");
    }
  };

  const handleSetupFullEventDemo = async () => {
    try {
      await setupFullEventDemo(undefined);
      setDemoToolMessage("Đã tạo trọn vẹn 1 sự kiện demo đầy đủ (giải thưởng, vòng thi, tài khoản, bài nộp, điểm, xếp hạng, phúc khảo).");
      refetch();
    } catch (err: any) {
      setDemoToolMessage(err?.response?.data?.message || "Tạo sự kiện demo đầy đủ thất bại.");
    }
  };

  const handleOpenAssignModal = (ev: EventItem) => {
    setSelectedEvent(ev);
    setEcEmail("");
    setAssignSuccessMessage(null);
  };

  const handleAssignEc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ecEmail.trim() || !selectedEvent) return;

    setIsSubmitting(true);
    const eventId = selectedEvent.id || selectedEvent.Id || selectedEvent.eventId || selectedEvent.EventId || "";
    const eventName = selectedEvent.eventName || selectedEvent.EventName || "Sự kiện";

    const foundUser = await usersRepository.findUserByEmail(ecEmail.trim());
    if (!foundUser) {
      setIsSubmitting(false);
      alert(`Không tìm thấy tài khoản người dùng với email "${ecEmail}". Vui lòng kiểm tra lại chính tả.`);
      return;
    }

    const realUserId = foundUser.id || (foundUser as any).Id || (foundUser as any).userId || (foundUser as any).UserId;

    try {
      const res = await staffRepository.assignRoleDirectly({
        userId: realUserId,
        eventId: eventId,
        roleName: "EventCoordinator",
      });
      setIsSubmitting(false);

      if (res && res.success !== false) {
        setAssignSuccessMessage(`Đã phân công ${ecEmail} làm Event Coordinator cho sự kiện "${eventName}" thành công!`);
        setTimeout(() => {
          setSelectedEvent(null);
          setAssignSuccessMessage(null);
        }, 2000);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      const msg = err.response?.data?.message || err.message || "Phân công vai trò thất bại. Vui lòng kiểm tra quyền Admin.";
      alert(`Lỗi phân công EC: ${msg}`);
    }
  };

  return {
    state: {
      selectedEvent,
      ecEmail,
      isSubmitting,
      assignSuccessMessage,
      demoToolMessage,
      isSettingUpDemoEvents,
      isSettingUpAppealDemo,
      isSettingUpFullDemo,
    },
    data: {
      displayEvents,
    },
    actions: {
      setSelectedEvent,
      setEcEmail,
      handleOpenAssignModal,
      handleAssignEc,
      handleSetupDemoEvents,
      handleSetupDemoAppealEvent,
      handleSetupFullEventDemo,
      refetch,
    },
  };
}
