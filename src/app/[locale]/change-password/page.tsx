import { ForceChangePasswordView } from "@/views/ForceChangePasswordView";

// Route trong app/ luôn giữ MỎNG — chỉ render View tương ứng, không chứa logic.
export default function ChangePasswordPage() {
  return <ForceChangePasswordView />;
}
