import { AdminDashboardView } from "@/views/AdminDashboardView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AdminDashboardPage() {
  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <AdminDashboardView />
    </RoleGuard>
  );
}
