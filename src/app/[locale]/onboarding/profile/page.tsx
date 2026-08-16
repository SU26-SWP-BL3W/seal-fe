import { OnboardingProfileView } from "@/views/OnboardingProfileView";

// Route trong app/ luôn giữ MỎNG — chỉ render View tương ứng, không chứa logic.
export default function OnboardingProfilePage() {
  return <OnboardingProfileView />;
}
