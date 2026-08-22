import { ResetPasswordView } from "@/views/auth/ResetPasswordView";

// Route trong app/ luôn giữ MỎNG — chỉ render View tương ứng, không chứa logic.
export default function ResetPasswordPage() {
  return <ResetPasswordView />;
}
