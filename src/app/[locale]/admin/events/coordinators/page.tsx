import { AdminCoordinatorsView } from "@/views/admin/AdminCoordinatorsView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AdminCoordinatorsPage() {
  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <AdminCoordinatorsView />
    </RoleGuard>
  );
}
