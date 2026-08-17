import { AdminEditEventView } from "@/views/AdminEditEventView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AdminEditEventPage() {
  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <AdminEditEventView />
    </RoleGuard>
  );
}
