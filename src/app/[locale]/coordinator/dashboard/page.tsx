import { CoordinatorDashboardView } from "@/views/CoordinatorDashboardView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata = {
  title: "Bảng Điều Hành — SEAL Coordinator",
  description: "Tổng quan sự kiện, vòng thi và nhân sự do Event Coordinator phụ trách",
};

export default function CoordinatorDashboardPage() {
  return (
    <RoleGuard allowedRoles={["Coordinator", "Admin"]}>
      <CoordinatorDashboardView />
    </RoleGuard>
  );
}
