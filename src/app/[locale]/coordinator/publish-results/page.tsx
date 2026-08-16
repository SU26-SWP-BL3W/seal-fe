import { CoordinatorPublishResultsView } from "@/views/CoordinatorPublishResultsView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata = {
  title: "Quản Lý Kết Quả & Công Bố Giải Thưởng — SEAL Coordinator",
  description: "Cấu hình giải thưởng theo Track, trao giải và công bố kết quả vòng thi",
};

export default function CoordinatorPublishResultsPage() {
  return (
    <RoleGuard allowedRoles={["Coordinator", "Admin"]}>
      <CoordinatorPublishResultsView />
    </RoleGuard>
  );
}
