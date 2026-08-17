"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { NavigationBar } from "./NavigationBar";
import { Footer } from "./Footer";

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { user, activeRole } = useAuth();

  const rawRole = activeRole?.roleName || activeRole?.RoleName;
  const userEmail = (user?.email || user?.Email || "").toLowerCase();

  let roleName = "";
  if (user?.isAdmin || user?.IsAdmin) {
    roleName = "Admin";
  } else {
    roleName = rawRole || "";
    if (roleName === "EventCoordinator") roleName = "Coordinator";
    if (!roleName) {
      if (userEmail.includes("ec_") || userEmail.includes("ec.") || userEmail.includes("coordinator")) {
        roleName = "Coordinator";
      } else if (userEmail.includes("judge")) {
        roleName = "Judge";
      } else if (userEmail.includes("mentor")) {
        roleName = "Mentor";
      } else {
        roleName = "Guest";
      }
    }
  }

  // Tài khoản tạm chưa đổi mật khẩu — chặn mọi trang khác, kể cả gõ thẳng URL.
  const isChangePasswordRoute = pathname.includes("/change-password");
  useEffect(() => {
    if (user?.mustChangePassword && !isChangePasswordRoute) {
      router.replace("/change-password");
    }
  }, [user?.mustChangePassword, isChangePasswordRoute, router]);

  // Auth routes không hiện sidebar
  const isAuthRoute =
    pathname.includes("/login") ||
    pathname.includes("/register") ||
    pathname.includes("/verify-email") ||
    pathname.includes("/forgot-password") ||
    pathname.includes("/reset-password");

  // Route flags
  const isAdminRoute = pathname.includes("/admin");
  const isCoordinatorRoute = pathname.includes("/coordinator");
  const isMentorRoute = pathname.includes("/mentor");
  const isJudgeRoute = pathname.includes("/judge");
  const isEventDetailRoute = pathname.includes("/events/") && (pathname.split("/events/")[1] || "").length > 0;
  const isEventInnerRoute =
    isEventDetailRoute ||
    pathname.includes("/my-team") ||
    pathname.includes("/my-submissions") ||
    pathname.includes("/appeals") ||
    pathname.includes("/leaderboard");

  // Role flags
  const isAdminRole = roleName === "Admin";
  const isCoordinatorRole = roleName === "Coordinator" || roleName === "EventCoordinator";
  const isMentorRole = roleName === "Mentor";
  const isJudgeRole = roleName === "Judge";
  const isCandidateRole = roleName === "TeamLeader" || roleName === "TeamMember";

  // Sidebar dọc: dùng route OR (eventInnerRoute AND role)
  // Fix: Admin gõ /judge/scoring -> KHÔNG hiện sidebar vì isAdminRole=false
  const hasVerticalSidebar =
    !isAuthRoute && (
      // Role dashboards
      (isAdminRoute && isAdminRole) ||
      (isCoordinatorRoute && isCoordinatorRole) ||
      (isMentorRoute && isMentorRole) ||
      (isJudgeRoute && isJudgeRole) ||
      // Event inner routes với role check
      (isEventInnerRoute && (isCoordinatorRole || isMentorRole || isJudgeRole || isCandidateRole)) ||
      // Event inner routes không cần role (xem thông tin)
      isEventInnerRoute
    );

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] relative">
      <NavigationBar />

      <div className={`flex-1 flex flex-col min-w-0 ${hasVerticalSidebar ? "md:pl-64" : ""}`}>
        <main className="flex-1 flex flex-col w-full min-h-0">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
