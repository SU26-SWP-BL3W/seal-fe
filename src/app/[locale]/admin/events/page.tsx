import { AdminEventsView } from "@/views/AdminEventsView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AdminEventsPage() {
  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <AdminEventsView />
    </RoleGuard>
  );
}
