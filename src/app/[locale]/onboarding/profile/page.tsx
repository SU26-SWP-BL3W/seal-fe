import { OnboardingProfileView } from "@/views/OnboardingProfileView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata = {
  title: "Hồ Sơ Sinh Viên — SEAL Hackathon",
  description: "Xác thực danh tính sinh viên để tham gia SEAL Hackathon",
};

export default function OnboardingProfilePage() {
  return (
    <RoleGuard allowedRoles={["TeamLeader", "TeamMember", "Student", "any-authenticated"]}>
      <OnboardingProfileView />
    </RoleGuard>
  );
}
