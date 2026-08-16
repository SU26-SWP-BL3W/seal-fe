import { TeamInvitationsView } from "@/views/TeamInvitationsView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata = {
  title: "Lời Mời Tham Gia Đội Thi — SEAL Hackathon",
  description: "Quản lý và phản hồi các lời mời gia nhập đội thi",
};

export default function MyInvitationsPage() {
  return (
    <RoleGuard allowedRoles={["TeamLeader", "TeamMember", "Student", "any-authenticated"]}>
      <TeamInvitationsView />
    </RoleGuard>
  );
}
