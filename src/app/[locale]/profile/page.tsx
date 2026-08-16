import { UserProfileView } from "@/views/UserProfileView";

// Route trong app/ luôn giữ MỎNG — chỉ render View tương ứng, không chứa logic.
export default function ProfilePage() {
  return <UserProfileView />;
}
