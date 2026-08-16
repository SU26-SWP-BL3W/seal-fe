import type { Metadata } from "next";
import { JudgeEventsView } from "@/views/JudgeEventsView";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata: Metadata = {
  title: "Sự kiện được phân công - SEAL",
  description: "Danh sách các sự kiện được phân công để chấm điểm",
};

export default function JudgeEventsPage() {
  return (
    <RoleGuard allowedRoles={["Judge", "Admin"]}>
      <JudgeEventsView />
    </RoleGuard>
  );
}
