import { JudgeScoringView } from "@/views/judge/JudgeScoringView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function JudgeScoringPage() {
  return (
    <RoleGuard allowedRoles={["Judge", "Admin"]}>
      <JudgeScoringView />
    </RoleGuard>
  );
}
