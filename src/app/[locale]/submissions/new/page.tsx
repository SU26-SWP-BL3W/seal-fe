import { NewSubmissionView } from "@/views/NewSubmissionView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function NewSubmissionPage() {
  return (
    <RoleGuard allowedRoles={["any-authenticated"]}>
      <NewSubmissionView />
    </RoleGuard>
  );
}
