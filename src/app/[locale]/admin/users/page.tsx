import { AdminUsersView } from "@/views/admin/AdminUsersView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AdminUsersPage() {
  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <AdminUsersView />
    </RoleGuard>
  );
}
