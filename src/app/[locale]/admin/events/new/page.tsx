import { AdminCreateEventView } from "@/views/AdminCreateEventView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AdminCreateEventPage() {
  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <AdminCreateEventView />
    </RoleGuard>
  );
}
