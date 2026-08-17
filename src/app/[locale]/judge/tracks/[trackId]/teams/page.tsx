import { JudgeTrackTeamsView } from "@/views/JudgeTrackTeamsView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function JudgeTrackTeamsPage() {
  return (
    <RoleGuard allowedRoles={["Judge", "Admin"]}>
      <JudgeTrackTeamsView />
    </RoleGuard>
  );
}
