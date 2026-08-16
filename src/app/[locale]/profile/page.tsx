import { UserProfileView } from "@/views/UserProfileView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function ProfilePage() {
  return (
    <RoleGuard allowedRoles={["any-authenticated"]}>
      <UserProfileView />
    </RoleGuard>
  );
}
