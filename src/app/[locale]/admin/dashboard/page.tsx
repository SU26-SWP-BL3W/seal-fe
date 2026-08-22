import { AdminDashboardView } from "@/views/admin/AdminDashboardView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AdminDashboardPage() {
  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <AdminDashboardView />
    </RoleGuard>
  );
}
