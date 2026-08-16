"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { CoordinatorStaffView } from "@/views/CoordinatorStaffView";

export default function CoordinatorStaffPage() {
  return (
    <RoleGuard allowedRoles={["Coordinator", "Admin"]}>
      <CoordinatorStaffView />
    </RoleGuard>
  );
}
