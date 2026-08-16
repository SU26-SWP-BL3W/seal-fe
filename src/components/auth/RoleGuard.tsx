"use client";

import React, { ReactNode } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { getRoleName } from "@/lib/permissions";
import { HexagonLoader, Button, Card } from "@/components/ui";
import { ShieldAlert, Lock } from "lucide-react";
import Link from "next/link";

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

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { user, activeRole, isInitialized } = useAuth();

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
                // ĐẾN TRANG ĐĂNG NHẬP &gt;
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

  // Map API roleName to display role
  const userRoleDisplay = userRoleName === "EventCoordinator" ? "Coordinator" : userRoleName;

  const hasAccess =
    (allowedRoles.includes("Admin") && isUserAdmin) ||
    (userRoleDisplay && allowedRoles.includes(userRoleDisplay as AllowedRole)) ||
    // Student = user logged in but isStudent
    (allowedRoles.includes("Student") && user.isStudent);

  if (!hasAccess) {
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
              Tài khoản hiện tại{" "}
              <span className="text-[var(--text-primary)] font-bold">
                [{isUserAdmin ? "System Admin" : userRoleDisplay || "Guest"}]
              </span>{" "}
              không có quyền. Trang này chỉ dành cho:{" "}
              <span className="text-[var(--accent-primary)] font-bold">
                [{allowedRoles.join(", ")}]
              </span>
            </p>
          </div>
          <div className="pt-4 flex justify-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="font-mono text-xs">
                Đăng Nhập Lại
              </Button>
            </Link>
            <Link href="/">
              <Button variant="primary" className="font-mono text-xs">
                Về Trang Chủ &gt;
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
