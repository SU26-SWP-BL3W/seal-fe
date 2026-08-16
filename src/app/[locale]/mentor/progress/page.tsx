import { MentorProgressView } from "@/views/MentorProgressView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata = {
  title: "Theo Dõi Tiến Độ Đội Thi — SEAL Mentor",
  description: "Bảng theo dõi điểm số và tiến độ đội thi cho Mentor",
};

export default function MentorProgressPage() {
  return (
    <RoleGuard allowedRoles={["Mentor", "Admin", "Coordinator"]}>
      <MentorProgressView />
    </RoleGuard>
  );
}
