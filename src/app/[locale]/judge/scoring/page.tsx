import { JudgeScoringView } from "@/views/JudgeScoringView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata = {
  title: "Chấm Điểm Bài Thi — SEAL Judge",
  description: "Bảng chấm điểm bài thi hackathon cho Giám khảo",
};

export default function JudgeScoringPage() {
  return (
    <RoleGuard allowedRoles={["Judge", "Admin"]}>
      <JudgeScoringView />
    </RoleGuard>
  );
}
