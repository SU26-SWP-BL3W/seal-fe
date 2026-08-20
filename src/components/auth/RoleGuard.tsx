"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { getRoleName } from "@/lib/permissions";
import { getStaffRoleDisplayLabel, resolveStaffLandingPath, type NormalizedEventRole } from "@/lib/eventRoles";
import { HexagonLoader, Button, Card } from "@/components/ui";
import { ShieldAlert, Lock } from "lucide-react";
import { Link } from "@/i18n/routing";

type AllowedRole =
  | "Admin"
  | "Coordinator"
  | "Judge"
  | "Mentor"
  | "TeamLeader"
  | "TeamMember"
  | "Student"
  | "any-authenticated";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AllowedRole[];
}

// Lấy dashboard URL theo role
function getRoleDashboardUrl(
  user: { isAdmin?: boolean; IsAdmin?: boolean; isStudent?: boolean; IsStudent?: boolean } | null,
  activeRole: { roleName?: string; RoleName?: string; eventId?: string; EventId?: string } | null,
  allEventRoles: NormalizedEventRole[] = [],
): string {
  if (user?.isAdmin || user?.IsAdmin) return "/admin/dashboard";

  const staffPath = resolveStaffLandingPath(allEventRoles);
  if (staffPath) return staffPath;

  const roleName = getRoleName(activeRole);
  const eventId = activeRole?.eventId || activeRole?.EventId;

  if (roleName === "EventCoordinator" || roleName === "Coordinator") {
    return eventId ? `/coordinator/dashboard?eventId=${eventId}` : "/coordinator/dashboard";
  }
  if (roleName === "Judge") return eventId ? `/judge/events?eventId=${eventId}` : "/judge/events";
  if (roleName === "Mentor") return eventId ? `/events/${eventId}` : "/events";
  if (roleName === "TeamLeader" || roleName === "TeamMember") return "/my-team";
  if (user?.isStudent || user?.IsStudent) return "/events";
  return "/login";
}

interface AccessDeniedScreenProps {
  redirectUrl: string;
  isUserAdmin?: boolean;
  userRoleDisplay?: string;
}

function AccessDeniedScreen({ redirectUrl, isUserAdmin, userRoleDisplay }: AccessDeniedScreenProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(redirectUrl);
    }, 2000);
    return () => clearTimeout(timer);
  }, [router, redirectUrl]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 hud-lattice">
      <Card className="max-w-lg p-8 bg-[var(--bg-panel)] hud-clipped border-[var(--color-danger)] space-y-4 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[rgba(239,68,68,0.1)] text-[var(--color-danger)] border border-[var(--color-danger)]/30 mx-auto">
          <ShieldAlert className="w-6 h-6 text-[var(--color-danger)]" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display font-bold text-2xl text-[var(--color-danger)] uppercase tracking-wider">
            403 // TRUY CẬP BỊ TỪ CHỐI
          </h3>
          <p className="font-mono text-xs text-[var(--text-muted)]">
            Tài khoản <span className="text-[var(--text-primary)] font-bold">[{isUserAdmin ? "System Admin" : userRoleDisplay || "Guest"}]</span> không có quyền truy cập trang này.
          </p>
          <p className="font-mono text-xs text-[var(--accent-primary)]">
            Đang chuyển hướng về trang của bạn...
          </p>
        </div>
        <div className="pt-4 flex justify-center gap-3">
          <Link href={redirectUrl}>
            <Button variant="primary" className="font-mono text-xs">
              Chuyển về trang của tôi
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="font-mono text-xs">
              Về Trang Chủ
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { user, activeRole, allEventRoles, isInitialized } = useAuth();

  if (!isInitialized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <HexagonLoader />
        <p className="font-mono text-xs text-[var(--text-muted)] animate-pulse">
          Đang xác thực phiên làm việc & phân quyền...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 hud-lattice">
        <Card className="max-w-md p-8 bg-[var(--bg-panel)] hud-clipped border-[var(--color-danger)] text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[rgba(239,68,68,0.1)] text-[var(--color-danger)] border border-[var(--color-danger)]/30 mx-auto">
            <Lock className="w-6 h-6 text-[var(--color-danger)]" />
          </div>
          <h3 className="font-display font-bold text-xl text-[var(--color-danger)] uppercase tracking-wider">
            YÊU CẦU ĐĂNG NHẬP
          </h3>
          <p className="font-mono text-xs text-[var(--text-muted)]">
            Trang này yêu cầu đăng nhập với tài khoản có quyền phù hợp.
          </p>
          <div className="pt-4 flex justify-center">
            <Link href="/login">
              <Button variant="primary" className="font-mono text-xs">
                ĐẾN TRANG ĐĂNG NHẬP
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // "any-authenticated": chỉ cần đăng nhập là đủ
  if (allowedRoles.includes("any-authenticated")) {
    return <>{children}</>;
  }

  const isUserAdmin = user.isAdmin;
  const userRoleName = getRoleName(activeRole);
  const userRoleDisplay = userRoleName === "EventCoordinator" ? "Coordinator" : userRoleName;
  const staffRoleLabel = getStaffRoleDisplayLabel(allEventRoles);

  const hasAccess =
    (allowedRoles.includes("Admin") && isUserAdmin) ||
    (userRoleDisplay && allowedRoles.includes(userRoleDisplay as AllowedRole)) ||
    (allowedRoles.includes("Student") && user.isStudent) ||
    allEventRoles.some((role) => allowedRoles.includes(role.roleName as AllowedRole));

  if (!hasAccess) {
    const redirectUrl = getRoleDashboardUrl(user, activeRole, allEventRoles);
    return (
      <AccessDeniedScreen
        redirectUrl={redirectUrl}
        isUserAdmin={isUserAdmin}
        userRoleDisplay={staffRoleLabel || userRoleDisplay}
      />
    );
  }

  return <>{children}</>;
};
