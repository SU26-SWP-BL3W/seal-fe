import { CreateEventWizardView } from "@/views/CreateEventWizardView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function CreateEventPage() {
  return (
    <RoleGuard allowedRoles={["Coordinator", "Admin"]}>
      <CreateEventWizardView />
    </RoleGuard>
  );
}
