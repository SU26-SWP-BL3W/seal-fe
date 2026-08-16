import { CoordinatorTeamsView } from "@/views/CoordinatorTeamsView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata = {
  title: "Duyệt Đội Thi — SEAL Coordinator",
  description: "Duyệt hoặc từ chối đơn đăng ký đội thi",
};

export default function CoordinatorTeamsPage() {
  return (
    <RoleGuard allowedRoles={["Coordinator", "Admin"]}>
      <CoordinatorTeamsView />
    </RoleGuard>
  );
}
