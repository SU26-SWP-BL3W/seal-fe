import { MentorSubmissionsView } from "@/views/MentorSubmissionsView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata = {
  title: "Tiến Độ Bài Nộp — SEAL Mentor",
  description: "Bài nộp trong Hạng mục Mentor phụ trách, theo dõi tiến độ đội thi",
};

export default function MentorSubmissionsPage() {
  return (
    <RoleGuard allowedRoles={["Mentor", "Admin", "Coordinator"]}>
      <MentorSubmissionsView />
    </RoleGuard>
  );
}
