import { RoleGuard } from "@/components/auth/RoleGuard";

export default function CoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["Admin", "Coordinator"]}>
      {children}
    </RoleGuard>
  );
}
