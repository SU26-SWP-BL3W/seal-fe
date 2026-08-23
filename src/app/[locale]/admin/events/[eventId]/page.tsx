import { AdminEventDetailView } from "@/views/admin/AdminEventDetailView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AdminEventDetailPage() {
  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <AdminEventDetailView />
    </RoleGuard>
  );
}
