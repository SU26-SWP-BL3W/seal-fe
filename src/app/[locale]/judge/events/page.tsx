"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { JudgeTracksView } from "@/views/JudgeTracksView";

export default function JudgeEventsPage() {
  return (
    <RoleGuard allowedRoles={["Judge", "Admin"]}>
      <JudgeTracksView />
    </RoleGuard>
  );
}
