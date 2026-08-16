import { LandingPortalView } from "@/views/LandingPortalView";

// Route trong app/ luôn giữ MỎNG — chỉ render View tương ứng, không chứa logic.
export default function Home() {
  return <LandingPortalView />;
}
