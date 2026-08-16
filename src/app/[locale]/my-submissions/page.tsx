import { MySubmissionsView } from "@/views/MySubmissionsView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function MySubmissionsPage() {
  return (
    <RoleGuard allowedRoles={["any-authenticated"]}>
      <MySubmissionsView />
    </RoleGuard>
  );
}
