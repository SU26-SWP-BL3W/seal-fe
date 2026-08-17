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
  const roleName = activeRole?.RoleName || (user?.IsAdmin ? "Admin" : "Guest");

  // Tài khoản tạm chưa đổi mật khẩu — chặn mọi trang khác, kể cả gõ thẳng URL.
  const isChangePasswordRoute = pathname.includes("/change-password");
  useEffect(() => {
    if (user?.mustChangePassword && !isChangePasswordRoute) {
      router.replace("/change-password");
    }
  }, [user?.mustChangePassword, isChangePasswordRoute, router]);

  const isCoordinatorRoute = pathname.includes("/coordinator");
  const isMentorRoute = pathname.includes("/mentor");
  const isJudgeRoute = pathname.includes("/judge");
  const isAdminRoute = pathname.includes("/admin");

  const hasVerticalSidebar =
    isCoordinatorRoute ||
    isMentorRoute ||
    isJudgeRoute ||
    isAdminRoute;

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
