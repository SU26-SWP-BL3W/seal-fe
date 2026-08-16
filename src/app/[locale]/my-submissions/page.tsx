import { MySubmissionsView } from "@/views/MySubmissionsView";

// Route trong app/ luôn giữ MỎNG — chỉ render View tương ứng, không chứa logic.
export default function MySubmissionsPage() {
  return <MySubmissionsView />;
}
