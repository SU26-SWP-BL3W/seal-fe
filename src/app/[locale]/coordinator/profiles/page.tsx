import { CoordinatorProfilesView } from "@/views/CoordinatorProfilesView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata = {
  title: "Duyệt Hồ Sơ Sinh Viên — SEAL Coordinator",
  description: "Xét duyệt hồ sơ sinh viên tham gia SEAL Hackathon",
};

export default function CoordinatorProfilesPage() {
  return (
    <RoleGuard allowedRoles={["Coordinator", "Admin"]}>
      <CoordinatorProfilesView />
    </RoleGuard>
  );
}
