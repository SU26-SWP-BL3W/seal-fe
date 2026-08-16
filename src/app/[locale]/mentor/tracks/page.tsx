import { MentorTracksView } from "@/views/MentorTracksView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata = {
  title: "Hạng Mục Được Phân Công — SEAL Mentor",
  description: "Danh sách Hạng mục mà Mentor đang giữ vai trò Cố vấn chuyên môn",
};

export default function MentorTracksPage() {
  return (
    <RoleGuard allowedRoles={["Mentor", "Admin", "Coordinator"]}>
      <MentorTracksView />
    </RoleGuard>
  );
}
