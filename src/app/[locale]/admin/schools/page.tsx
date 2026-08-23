import { AdminSchoolsView } from "@/views/admin/AdminSchoolsView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AdminSchoolsPage() {
  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <AdminSchoolsView />
    </RoleGuard>
  );
}
