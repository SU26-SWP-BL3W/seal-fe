import { AdminCoordinatorsView } from "@/views/AdminCoordinatorsView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AdminCoordinatorsPage() {
  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <AdminCoordinatorsView />
    </RoleGuard>
  );
}
