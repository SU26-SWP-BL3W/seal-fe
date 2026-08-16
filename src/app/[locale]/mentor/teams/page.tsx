import { MentorTeamsView } from "@/views/MentorTeamsView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata = {
  title: "Đội Thi Cần Hỗ Trợ — SEAL Mentor",
  description: "Đội thi có bài nộp trong Hạng mục Mentor phụ trách",
};

export default function MentorTeamsPage() {
  return (
    <RoleGuard allowedRoles={["Mentor", "Admin", "Coordinator"]}>
      <MentorTeamsView />
    </RoleGuard>
  );
}
