import { CoordinatorCalibrationView } from "@/views/CoordinatorCalibrationView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata = {
  title: "Hiệu Chuẩn Điểm & Xếp Hạng — SEAL Coordinator",
  description: "Trực quan ma trận điểm Giám khảo, tính điểm tổng & xếp hạng vòng thi",
};

export default function CoordinatorCalibrationPage() {
  return (
    <RoleGuard allowedRoles={["Coordinator", "Admin"]}>
      <CoordinatorCalibrationView />
    </RoleGuard>
  );
}
