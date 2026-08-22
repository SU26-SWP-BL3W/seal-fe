import { AdminCreateEventView } from "@/views/admin/AdminCreateEventView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AdminCreateEventPage() {
  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <AdminCreateEventView />
    </RoleGuard>
  );
}
