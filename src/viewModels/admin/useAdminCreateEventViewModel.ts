import { useState } from "react";
import { eventsRepository } from "@/repositories/eventsRepository";
import { staffRepository } from "@/repositories/staffRepository";
import { usersRepository } from "@/repositories/usersRepository";

export function useAdminCreateEventViewModel() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successEventId, setSuccessEventId] = useState<string | null>(null);

  const [form, setForm] = useState({
    eventName: "SEAL Hackathon 2026",
    season: "Mùa Hè",
    year: 2026,
    startDate: "2026-07-15",
    endDate: "2026-09-20",
    registrationStartDate: "2026-06-01",
    registrationEndDate: "2026-07-10",
    description: "Đấu trường công nghệ quy mô lớn dành cho sinh viên toàn quốc do Ban Quản Trị SEAL phê duyệt.",
    coordinatorEmail: "ec.coordinator@seal.edu.vn",
    minTeamSize: 3,
    maxTeamSize: 5,
    maxTeams: 50,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!form.eventName.trim()) {
      setErrorMessage("Vui lòng nhập tên sự kiện!");
      return;
    }
    if (new Date(form.startDate) > new Date(form.endDate)) {
      setErrorMessage("Ngày bắt đầu sự kiện phải diễn ra trước ngày kết thúc!");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        eventName: form.eventName,
        season: form.season,
        year: Number(form.year),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        registrationStartDate: form.registrationStartDate ? new Date(form.registrationStartDate).toISOString() : new Date(form.startDate).toISOString(),
        registrationEndDate: form.registrationEndDate ? new Date(form.registrationEndDate).toISOString() : new Date(form.endDate).toISOString(),
        description: form.description,
        maxTeams: Number(form.maxTeams),
        status: true,
        rounds: [],
      };

      const res = await eventsRepository.createEvent(payload);

      if (res && res.success !== false && (res.data || res.id || res.Id || res.eventId || res.EventId)) {
        const innerData = res.data || res;
        const eventId = innerData.id || innerData.Id || innerData.eventId || innerData.EventId || "";
        if (form.coordinatorEmail.trim()) {
          const foundUser = await usersRepository.findUserByEmail(form.coordinatorEmail.trim());
          if (foundUser) {
            const realUserId = foundUser.id || (foundUser as any).Id || (foundUser as any).userId || (foundUser as any).UserId;
            try {
              await staffRepository.assignRoleDirectly({
                userId: realUserId,
                eventId: eventId,
                roleName: "EventCoordinator",
              });
            } catch (err: any) {
              console.error("Lỗi phân công EC:", err);
            }
          } else {
            alert(`Cảnh báo: Đã tạo thành công Sự kiện, nhưng không tìm thấy tài khoản với email "${form.coordinatorEmail}". Bạn có thể phân công lại EC ở danh sách sự kiện.`);
          }
        }
        setSuccessEventId(eventId);
      } else {
        setErrorMessage(res?.message || "Tạo sự kiện thất bại. Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.");
      }
    } catch (err: any) {
      console.error("Lỗi tạo sự kiện:", err);
      const apiMsg = err?.response?.data?.message || err?.message || "Tạo sự kiện thất bại. Vui lòng kiểm tra kết nối mạng và thử lại.";
      setErrorMessage(apiMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    state: {
      form,
      isSubmitting,
      errorMessage,
      successEventId,
    },
    actions: {
      setForm,
      handleSubmit,
    },
  };
}
