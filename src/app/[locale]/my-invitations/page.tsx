import { TeamInvitationsView } from "@/views/team/TeamInvitationsView";

// Route trong app/ luôn giữ MỎNG — chỉ render View tương ứng, không chứa logic.
export default function MyInvitationsPage() {
  return <TeamInvitationsView />;
}
