import { MyTeamView } from "@/views/MyTeamView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function MyTeamPage() {
  return (
    <RoleGuard allowedRoles={["any-authenticated"]}>
      <MyTeamView />
    </RoleGuard>
  );
}
