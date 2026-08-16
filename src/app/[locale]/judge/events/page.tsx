import { JudgeEventsView } from "@/views/JudgeEventsView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function JudgeEventsPage() {
  return (
    <RoleGuard allowedRoles={["Judge", "Admin"]}>
      <JudgeEventsView />
    </RoleGuard>
  );
}
