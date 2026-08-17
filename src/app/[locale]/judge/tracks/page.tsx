import { JudgeTracksView } from "@/views/JudgeTracksView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function JudgeTracksPage() {
  return (
    <RoleGuard allowedRoles={["Judge", "Admin"]}>
      <JudgeTracksView />
    </RoleGuard>
  );
}
