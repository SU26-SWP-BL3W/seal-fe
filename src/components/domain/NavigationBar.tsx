"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Link } from "@/i18n/routing";
import { SealShield } from "./SealShield";
import { NotificationBell } from "./NotificationBell";
import { hasEventPermission } from "@/lib/permissions";
import { useEventDetail } from "@/repositories/eventsRepository";
import {
  Globe,
  Users,
  Building2,
  PlusCircle,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  Target,
  Zap,
  IdCard,
  Ruler,
  Briefcase,
  Scale,
  Trophy,
  FileText,
  Send,
  UserPlus,
  Compass,
  User,
  Calendar,
  Award,
  Settings,
  Sliders,
  FileCheck,
  AlertTriangle,
  Activity,
  LayoutDashboard,
  UserCheck,
} from "lucide-react";

export function NavigationBar() {
  const pathname = usePathname() || "";
  const { user, activeRole, logout } = useAuth();
  const rawRole = activeRole?.roleName || activeRole?.RoleName;
  const userEmail = (user?.email || user?.Email || "").toLowerCase();
  
  let roleName = "Guest";
  if (!user) {
    roleName = "Guest";
  } else if (user?.isAdmin || user?.IsAdmin) {
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

  const urlEventId = pathname.includes("/events/")
    ? (pathname.split("/events/")[1]?.split("/")[0] || "")
    : "";
  const roleEventId = activeRole?.eventId || activeRole?.EventId || "";
  const currentEventId = urlEventId || roleEventId;
  const { data: currentEvent } = useEventDetail(currentEventId);
  const currentEventName =
    currentEvent?.eventName || currentEvent?.EventName || currentEvent?.name || "";

  // XÁC ĐỊNH NGHIỆP VỤ RENDER THANH NAVBAR DỌC HOẶC NGANG
  const isCoordinatorRoute = pathname.includes("/coordinator");
  const isMentorRoute = pathname.includes("/mentor");
  const isJudgeRoute = pathname.includes("/judge");
  const isAdminRoute = pathname.includes("/admin");
  const isCandidateRoute =
    pathname.includes("/my-team") ||
    pathname.includes("/my-submissions") ||
    pathname.includes("/my-invitations");

  const isCoordinatorRole = roleName === "Coordinator" || roleName === "EventCoordinator";
  const isMentorRole = roleName === "Mentor";
  const isJudgeRole = roleName === "Judge";
  const isCandidateRole = roleName === "TeamLeader" || roleName === "TeamMember";

  const showCoordinatorSidebar = (isCoordinatorRoute && roleName !== "Admin") || (isCoordinatorRole && (pathname.includes("/coordinator") || pathname.includes("/appeals")));
  const showMentorSidebar = isMentorRoute;
  const showJudgeSidebar = isJudgeRoute;
  const showParticipantSidebar = isCandidateRoute && isCandidateRole;
  const showAdminSidebar = isAdminRoute || (roleName === "Admin" && isCoordinatorRoute);

  // ─────────────────────────────────────────────────────────────
  // CHẾ ĐỘ 10: NAVBAR DỌC DÀNH RIÊNG CHO SYSTEM ADMIN (ADMIN WORKSPACE)
  // ─────────────────────────────────────────────────────────────
  if (showAdminSidebar) {
    return (
      <aside className="w-full md:w-64 bg-[var(--bg-panel)] border-b md:border-b-0 md:border-r border-[var(--color-danger)]/40 flex flex-col justify-between p-5 shrink-0 z-50 md:fixed md:left-0 md:top-0 md:bottom-0 overflow-y-auto">
        <div className="flex flex-col gap-5">
          {/* Brand Logo & Notification Bell */}
          <div className="flex flex-col gap-3 pb-4 border-b border-[var(--border-muted)]">
            <div className="flex items-center justify-between">
              <Link href="/admin/dashboard" className="font-display font-bold text-lg text-[var(--color-danger)] tracking-widest uppercase flex items-center gap-2">
                <SealShield className="h-6 w-6 text-[var(--color-danger)]" />
                <span>ADMIN PANEL</span>
              </Link>
              <NotificationBell align="left" />
            </div>
            <Link
              href="/"
              className="font-mono text-[11px] text-[var(--text-muted)] hover:text-[var(--color-danger)] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Quay lại trang chủ
            </Link>
          </div>

          {/* Admin Profile Card */}
          <div className="p-3 bg-[var(--bg-input)] border border-[var(--color-danger)]/40 hud-clipped flex flex-col gap-1">
            <span className="font-mono text-[9px] text-[var(--color-danger)] font-bold uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-danger)]" /> SYSTEM ADMIN
            </span>
            <span className="font-display text-xs font-bold text-[var(--text-primary)] truncate">
              {user?.fullName || user?.FullName || "Quản Trị Viên Hệ Thống"}
            </span>
            <span className="font-mono text-[10px] text-[var(--text-muted)] truncate">
              {user?.email || "admin.system@seal.edu.vn"}
            </span>
          </div>

          {/* Vertical Navigation Menu Sections */}
          <nav className="flex flex-col gap-4 font-mono text-xs">
            {/* Section A: Quản Trị Hệ Thống */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[var(--color-danger)] font-bold tracking-widest uppercase px-2 mb-0.5">
                A. QUẢN TRỊ HỆ THỐNG
              </span>

              <Link
                href="/admin/dashboard"
                className={`flex items-center gap-2.5 px-3 py-2 hud-clipped transition-all font-bold ${
                  pathname === "/admin/dashboard" || pathname === "/admin"
                    ? "bg-[var(--color-danger)] text-white shadow-md shadow-[var(--color-danger)]/20"
                    : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-input)]"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" /> Tổng Quan Dashboard
              </Link>

              <Link
                href="/admin/users"
                className={`flex items-center gap-2.5 px-3 py-2 hud-clipped transition-all font-bold ${
                  pathname.includes("/admin/users")
                    ? "bg-[var(--color-danger)] text-white shadow-md shadow-[var(--color-danger)]/20"
                    : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-input)]"
                }`}
              >
                <Users className="w-4 h-4 shrink-0" /> Quản Lý Tài Khoản
              </Link>

              <Link
                href="/admin/schools"
                className={`flex items-center gap-2.5 px-3 py-2 hud-clipped transition-all font-bold ${
                  pathname.includes("/admin/schools")
                    ? "bg-[var(--color-danger)] text-white shadow-md shadow-[var(--color-danger)]/20"
                    : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-input)]"
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" /> Danh Mục Trường ĐH
              </Link>
            </div>

            {/* Section B: Quản Lý Sự Kiện */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-[var(--color-danger)] font-bold tracking-widest uppercase px-2 mb-0.5">
                B. QUẢN LÝ SỰ KIỆN
              </span>

              <Link
                href="/admin/events/new"
                className={`flex items-center gap-2.5 px-3 py-2 hud-clipped transition-all font-bold ${
                  pathname.includes("/admin/events/new")
                    ? "bg-[var(--color-danger)] text-white shadow-md shadow-[var(--color-danger)]/30"
                    : "text-[var(--color-danger)] bg-[var(--color-danger)]/5 hover:bg-[var(--color-danger)]/15 border border-[var(--color-danger)]/30"
                }`}
              >
                <PlusCircle className="w-4 h-4 shrink-0" /> Tạo Sự Kiện Mới
              </Link>

              <Link
                href="/admin/events"
                className={`flex items-center gap-2.5 px-3 py-2 hud-clipped transition-all font-bold ${
                  pathname === "/admin/events" || (pathname.includes("/admin/events/") && !pathname.includes("/admin/events/new") && !pathname.includes("/admin/events/coordinators"))
                    ? "bg-[var(--color-danger)] text-white shadow-md shadow-[var(--color-danger)]/20"
                    : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-input)]"
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0" /> Danh Sách Sự Kiện
              </Link>

              <Link
                href="/admin/events/coordinators"
                className={`flex items-center gap-2.5 px-3 py-2 hud-clipped transition-all font-bold ${
                  pathname.includes("/admin/events/coordinators")
                    ? "bg-[var(--color-danger)] text-white shadow-md shadow-[var(--color-danger)]/20"
                    : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-input)]"
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0" /> Phân Công EC
              </Link>
            </div>
          </nav>
        </div>

        {/* Bottom User Info & Role Switcher */}
        <div className="flex flex-col gap-2.5 pt-3 border-t border-[var(--border-muted)] mt-4">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-[var(--text-muted)]">Vai trò:</span>
            <span className="text-[var(--color-danger)] font-bold">System Admin</span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full py-2 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/50 text-[var(--color-danger)] font-mono text-xs font-bold uppercase hover:bg-[var(--color-danger)] hover:text-white transition-all hud-clipped cursor-pointer relative z-50 flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> ĐĂNG XUẤT
          </button>
        </div>
      </aside>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CHẾ ĐỘ 1A: NAVBAR DỌC DÀNH RIÊNG CHO EVENT COORDINATOR (BTC)
  // ─────────────────────────────────────────────────────────────
  if (showCoordinatorSidebar) {
    return (
      <aside className="w-full md:w-64 bg-[var(--bg-panel)] border-b md:border-b-0 md:border-r border-[#a855f7]/40 flex flex-col justify-between p-4 shrink-0 z-50 md:fixed md:left-0 md:top-0 md:bottom-0 overflow-hidden">
        <div className="flex flex-col gap-4 overflow-y-auto pr-1 text-xs [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#263339] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {/* Brand Logo & Notification Bell */}
          <div className="flex flex-col gap-3 pb-4 border-b border-[var(--border-muted)]">
            <div className="flex items-center justify-between">
              <Link href="/coordinator/dashboard" className="font-display font-bold text-lg text-[#a855f7] tracking-widest uppercase flex items-center gap-2">
                <SealShield className="h-6 w-6 text-[#a855f7]" />
                <span>COORD PANEL</span>
              </Link>
              <NotificationBell align="left" />
            </div>
            <Link
              href="/coordinator/dashboard"
              className="font-mono text-[11px] text-[var(--text-muted)] hover:text-[#a855f7] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Quay lại Control Center
            </Link>
          </div>

          {/* Coordinator Profile Card */}
          <div className="p-3 bg-[var(--bg-input)] border border-[#a855f7]/40 hud-clipped flex flex-col gap-1">
            <span className="font-mono text-[9px] text-[#a855f7] font-bold uppercase tracking-widest flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#a855f7]" /> EVENT COORDINATOR
            </span>
            <span className="font-display text-xs font-bold text-[var(--text-primary)] truncate">
              {user?.FullName || "Trần Văn Điều Phối"}
            </span>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">
              Ban Tổ Chức Hệ Thống
            </span>
          </div>

          {/* Vertical Coordinator Menu Section */}
          <nav className="flex flex-col gap-1.5 font-mono text-xs">
            <span className="font-mono text-[10px] font-bold text-[#8b5cf6] tracking-wider px-3 py-1 uppercase border-b border-[#263339] mb-1">
              MENU BẢNG ĐIỀU KHIỂN
            </span>

            {/* 1. Control Center BTC */}
            <Link
              href="/coordinator/dashboard"
              className={`flex items-center gap-2.5 px-3 py-2 hud-clipped transition-all font-bold text-xs ${
                pathname === "/coordinator/dashboard"
                  ? "bg-[#8b5cf6] text-white shadow-sm"
                  : "text-[#8a9ba8] hover:text-white hover:bg-[#13191c]"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-[#8b5cf6]" /> Control Center BTC
            </Link>


            <span className="font-mono text-[10px] font-bold text-[#8a9ba8] tracking-wider px-3 py-1 uppercase mt-3 border-b border-[#263339] mb-1">
              THỦ TỤC & ĐỘI THI
            </span>

            {/* 3. Duyệt Tài Khoản Thí Sinh */}
            <Link
              href="/coordinator/profiles"
              className={`flex items-center gap-2.5 px-3 py-2 hud-clipped transition-all font-bold text-xs ${
                pathname.includes("/coordinator/profiles")
                  ? "bg-[#8b5cf6] text-white shadow-sm"
                  : "text-[#8a9ba8] hover:text-white hover:bg-[#13191c]"
              }`}
            >
              <IdCard className="w-4 h-4 shrink-0 text-[#00d9ff]" /> Duyệt Tài Khoản Thí Sinh
            </Link>

            {/* 4. Duyệt Đội Thi */}
            <Link
              href="/coordinator/teams"
              className={`flex items-center gap-2.5 px-3 py-2 hud-clipped transition-all font-bold text-xs ${
                pathname.includes("/coordinator/teams")
                  ? "bg-[#8b5cf6] text-white shadow-sm"
                  : "text-[#8a9ba8] hover:text-white hover:bg-[#13191c]"
              }`}
            >
              <Users className="w-4 h-4 shrink-0 text-[#10b981]" /> Duyệt Đăng Ký Đội Thi
            </Link>

            <span className="font-mono text-[10px] font-bold text-[#8a9ba8] tracking-wider px-3 py-1 uppercase mt-3 border-b border-[#263339] mb-1">
              CHẤM ĐIỂM & NHÂN SỰ
            </span>

            {/* 5. Kho Tiêu Chí */}
            <Link
              href="/coordinator/templates"
              className={`flex items-center gap-2.5 px-3 py-2 hud-clipped transition-all font-bold text-xs ${
                pathname.includes("/coordinator/templates")
                  ? "bg-[#8b5cf6] text-white shadow-sm"
                  : "text-[#8a9ba8] hover:text-white hover:bg-[#13191c]"
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0 text-[#8b5cf6]" /> Kho Tiêu Chí (Templates)
            </Link>

            {/* 6. Phân Công Nhân Sự */}
            <Link
              href="/coordinator/staff"
              className={`flex items-center gap-2.5 px-3 py-2 hud-clipped transition-all font-bold text-xs ${
                pathname.includes("/coordinator/staff")
                  ? "bg-[#8b5cf6] text-white shadow-sm"
                  : "text-[#8a9ba8] hover:text-white hover:bg-[#13191c]"
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#8b5cf6]" /> Mời Giám Khảo & Cố Vấn
            </Link>

            {/* 7. Phòng Phân Tích RBL */}
            <Link
              href="/coordinator/calibration"
              className={`flex items-center gap-2.5 px-3 py-2 hud-clipped transition-all font-bold text-xs ${
                pathname.includes("/coordinator/calibration")
                  ? "bg-[#8b5cf6] text-white shadow-sm"
                  : "text-[#8a9ba8] hover:text-white hover:bg-[#13191c]"
              }`}
            >
              <Activity className="w-4 h-4 shrink-0 text-[#10b981]" /> Phòng Phân Tích RBL
            </Link>

            <span className="font-mono text-[10px] font-bold text-[#8a9ba8] tracking-wider px-3 py-1 uppercase mt-3 border-b border-[#263339] mb-1">
              KẾT QUẢ & PHÚC KHẢO
            </span>

            {/* 8. Công Bố Kết Quả */}
            <Link
              href="/coordinator/publish-results"
              className={`flex items-center gap-2.5 px-3 py-2 hud-clipped transition-all font-bold text-xs ${
                pathname.includes("/coordinator/publish-results")
                  ? "bg-[#8b5cf6] text-white shadow-sm"
                  : "text-[#8a9ba8] hover:text-white hover:bg-[#13191c]"
              }`}
            >
              <FileCheck className="w-4 h-4 shrink-0 text-[#f59e0b]" /> Công Bố Kết Quả
            </Link>

            {/* 9. Cơ Cấu Giải Thưởng */}
            <Link
              href="/coordinator/prizes"
              className={`flex items-center gap-2.5 px-3 py-2 hud-clipped transition-all font-bold text-xs ${
                pathname.includes("/coordinator/prizes")
                  ? "bg-[#8b5cf6] text-white shadow-sm"
                  : "text-[#8a9ba8] hover:text-white hover:bg-[#13191c]"
              }`}
            >
              <Award className="w-4 h-4 shrink-0 text-[#f59e0b]" /> Cơ Cấu Giải Thưởng
            </Link>

            {/* 10. Xử Lý Phúc Khảo */}
            <Link
              href="/coordinator/appeals"
              className={`flex items-center gap-2.5 px-3 py-2 hud-clipped transition-all font-bold text-xs ${
                pathname.includes("/coordinator/appeals")
                  ? "bg-[#8b5cf6] text-white shadow-sm"
                  : "text-[#8a9ba8] hover:text-white hover:bg-[#13191c]"
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#ef4444]" /> Xử Lý Phúc Khảo
            </Link>

            {/* 11. Khám Phá & Chi Tiết Sự Kiện */}
            <Link
              href="/events"
              className={`flex items-center gap-2.5 px-3 py-2 hud-clipped transition-all font-bold text-xs ${
                pathname === "/events" || (pathname.includes("/events/") && !pathname.includes("/coordinator/events"))
                  ? "bg-[#8b5cf6] text-white shadow-sm"
                  : "text-[#8a9ba8] hover:text-white hover:bg-[#13191c]"
              }`}
            >
              <Compass className="w-4 h-4 shrink-0 text-[#00d9ff]" /> Chi Tiết Sự Kiện &amp; Phase
            </Link>
          </nav>
        </div>

        {/* Bottom User Info & Role Switcher */}
        <div className="flex flex-col gap-2.5 pt-3 border-t border-[var(--border-muted)]">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-[var(--text-muted)]">Vai trò:</span>
            <span className="text-[#a855f7] font-bold">Coordinator</span>
          </div>


          <button
            type="button"
            onClick={logout}
            className="w-full py-2 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/50 text-[var(--color-danger)] font-mono text-xs font-bold uppercase hover:bg-[var(--color-danger)] hover:text-white transition-all hud-clipped cursor-pointer relative z-50 mb-4 flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> ĐĂNG XUẤT
          </button>
        </div>
      </aside>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CHẾ ĐỘ 1B: NAVBAR DỌC DÀNH RIÊNG CHO MENTOR CỐ VẤN
  // ─────────────────────────────────────────────────────────────
  if (showMentorSidebar) {
    const activeViewEventId = currentEventId;
    const isAuthorizedMentor = hasEventPermission(user, activeRole, activeViewEventId);

    return (
      <aside className="w-full md:w-64 bg-[var(--bg-panel)] border-b md:border-b-0 md:border-r border-[#2dd4bf]/30 flex flex-col justify-between p-5 shrink-0 z-50 md:fixed md:left-0 md:top-0 md:bottom-0">
        <div className="flex flex-col gap-6">
          {/* Brand Logo & Notification Bell */}
          <div className="flex flex-col gap-3 pb-4 border-b border-[var(--border-muted)]">
            <div className="flex items-center justify-between">
              <Link href="/" className="font-display font-bold text-lg text-[#2dd4bf] tracking-widest uppercase flex items-center gap-2">
                <SealShield className="h-6 w-6 text-[#2dd4bf]" />
                <span>MENTOR PANEL</span>
              </Link>
              <NotificationBell />
            </div>
            <Link
              href="/"
              className="font-mono text-[11px] text-[var(--text-muted)] hover:text-[#2dd4bf] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Quay lại trang chủ
            </Link>
          </div>

          {/* Mentor Profile Card */}
          <div className={`p-3 bg-[var(--bg-input)] border hud-clipped flex flex-col gap-1 ${
            isAuthorizedMentor ? "border-[#2dd4bf]/40" : "border-[var(--color-warning)]/50 bg-[var(--color-warning)]/5"
          }`}>
            <span className={`font-mono text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 ${
              isAuthorizedMentor ? "text-[#2dd4bf]" : "text-[var(--color-warning)]"
            }`}>
              <Briefcase className="w-3.5 h-3.5" /> {isAuthorizedMentor ? "MENTOR CỐ VẤN" : "CHƯA PHÂN CÔNG CỐ VẤN"}
            </span>
            <span className="font-display text-xs font-bold text-[var(--text-primary)] truncate">
              {user?.FullName || "Cố Vấn Chuyên Môn"}
            </span>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">
              {isAuthorizedMentor ? "Phân công: AI & Machine Learning" : "Quyền hạn: Read-Only (Chỉ Xem)"}
            </span>
          </div>

          {/* Vertical Mentor Menu Section */}
          <nav className="flex flex-col gap-1.5 font-mono text-xs">
            <span className="text-[10px] text-[var(--text-muted)] tracking-widest uppercase mb-1">
              MENU CỐ VẤN
            </span>

            {isAuthorizedMentor ? (
              <>
                <Link
                  href="/mentor/tracks"
                  className={`flex items-center gap-2.5 px-3 py-2.5 hud-clipped transition-all font-bold ${
                    pathname === "/mentor/tracks" || pathname === "/mentor"
                      ? "bg-[#2dd4bf] text-[var(--bg-base)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-input)]"
                  }`}
                >
                  <Briefcase className="w-4 h-4 shrink-0" /> Hạng Mục Cố Vấn
                </Link>

                <Link
                  href="/mentor/teams"
                  className={`flex items-center gap-2.5 px-3 py-2.5 hud-clipped transition-all font-bold ${
                    pathname.includes("/mentor/teams")
                      ? "bg-[#2dd4bf] text-[var(--bg-base)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-input)]"
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" /> Đội Thi Cố Vấn
                </Link>

                <Link
                  href="/mentor/submissions"
                  className={`flex items-center gap-2.5 px-3 py-2.5 hud-clipped transition-all font-bold ${
                    pathname.includes("/mentor/submissions")
                      ? "bg-[#2dd4bf] text-[var(--bg-base)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-input)]"
                  }`}
                >
                  <Send className="w-4 h-4 shrink-0" /> Bài Nộp &amp; Góp Ý
                </Link>

                <Link
                  href={`/events/${activeViewEventId}/leaderboard`}
                  className={`flex items-center gap-2.5 px-3 py-2.5 hud-clipped transition-all font-bold ${
                    pathname.includes("/leaderboard")
                      ? "bg-[var(--accent-judge)] text-[var(--bg-base)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--accent-judge)] hover:bg-[var(--bg-input)]"
                  }`}
                >
                  <Trophy className="w-4 h-4 shrink-0" /> Bảng Xếp Hạng Track
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={`/events/${activeViewEventId}`}
                  className={`flex items-center gap-2.5 px-3 py-2.5 hud-clipped transition-all font-bold ${
                    pathname.includes(`/events/${activeViewEventId}`) && !pathname.includes(`/leaderboard`)
                      ? "bg-[var(--accent-primary)] text-[var(--bg-base)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" /> Thể Lệ & Chi Tiết Sự Kiện
                </Link>

                <Link
                  href={`/events/${activeViewEventId}/leaderboard`}
                  className={`flex items-center gap-2.5 px-3 py-2.5 hud-clipped transition-all font-bold ${
                    pathname.includes("/leaderboard")
                      ? "bg-[var(--accent-judge)] text-[var(--bg-base)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--accent-judge)] hover:bg-[var(--bg-input)]"
                  }`}
                >
                  <Trophy className="w-4 h-4 shrink-0" /> Bảng Xếp Hạng
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Bottom User Info & Role Switcher */}
        <div className="flex flex-col gap-2.5 pt-3 border-t border-[var(--border-muted)]">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-[var(--text-muted)]">Vai trò:</span>
            <span className="text-[#2dd4bf] font-bold">
              {isAuthorizedMentor ? "Mentor" : "User (Chưa Phân Công Cố Vấn)"}
            </span>
          </div>


          <button
            type="button"
            onClick={logout}
            className="w-full py-2 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/50 text-[var(--color-danger)] font-mono text-xs font-bold uppercase hover:bg-[var(--color-danger)] hover:text-white transition-all hud-clipped cursor-pointer relative z-50 mb-4 flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> ĐĂNG XUẤT
          </button>
        </div>
      </aside>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CHẾ ĐỘ 1C: NAVBAR DỌC DÀNH RIÊNG CHO GIÁM KHẢO (JUDGE)
  // ─────────────────────────────────────────────────────────────
  if (showJudgeSidebar) {
    const activeViewEventId = currentEventId;
    const isAuthorizedJudge = hasEventPermission(user, activeRole, activeViewEventId);

    return (
      <aside className="w-full md:w-64 bg-[var(--bg-panel)] border-b md:border-b-0 md:border-r border-[var(--accent-judge)]/30 flex flex-col justify-between p-5 shrink-0 z-50 md:fixed md:left-0 md:top-0 md:bottom-0">
        <div className="flex flex-col gap-6">
          {/* Brand Logo & Notification Bell */}
          <div className="flex flex-col gap-3 pb-4 border-b border-[var(--border-muted)]">
            <div className="flex items-center justify-between">
              <Link href="/" className="font-display font-bold text-lg text-[var(--accent-judge)] tracking-widest uppercase flex items-center gap-2">
                <SealShield className="h-6 w-6 text-[var(--accent-judge)]" />
                <span>JUDGE PANEL</span>
              </Link>
              <NotificationBell align="left" />
            </div>
            <Link
              href="/"
              className="font-mono text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-judge)] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Quay lại trang chủ
            </Link>
          </div>

          {/* Judge Profile Card */}
          <div className={`p-3 bg-[var(--bg-input)] border hud-clipped flex flex-col gap-1 ${
            isAuthorizedJudge ? "border-[var(--accent-judge)]/40" : "border-[var(--color-warning)]/50 bg-[var(--color-warning)]/5"
          }`}>
            <span className={`font-mono text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 ${
              isAuthorizedJudge ? "text-[var(--accent-judge)]" : "text-[var(--color-warning)]"
            }`}>
              <Scale className="w-3.5 h-3.5" /> {isAuthorizedJudge ? "GIÁM KHẢO CHẤM ĐIỂM" : "CHƯA PHÂN CÔNG GIÁM KHẢO"}
            </span>
            <span className="font-display text-xs font-bold text-[var(--text-primary)] truncate">
              {user?.FullName || "Giám Khảo Chuyên Môn"}
            </span>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">
              {isAuthorizedJudge ? "Hội đồng Chấm điểm RBL" : "Quyền hạn: Read-Only (Chỉ Xem)"}
            </span>
          </div>

          {/* Vertical Judge Menu Section */}
          <nav className="flex flex-col gap-1.5 font-mono text-xs">
            <span className="text-[10px] text-[var(--text-muted)] tracking-widest uppercase mb-1">
              MENU GIÁM KHẢO
            </span>

            {isAuthorizedJudge ? (
              <>
                <Link
                  href="/judge/events"
                  className={`flex items-center gap-2.5 px-3 py-2.5 hud-clipped transition-all font-bold ${
                    pathname === "/judge/events"
                      ? "bg-[var(--accent-judge)] text-[var(--bg-base)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-input)]"
                  }`}
                >
                  <Calendar className="w-4 h-4 shrink-0" /> Sự Kiện Phân Công
                </Link>

                <Link
                  href="/judge/tracks"
                  className={`flex items-center gap-2.5 px-3 py-2.5 hud-clipped transition-all font-bold ${
                    pathname.includes("/judge/tracks")
                      ? "bg-[var(--accent-judge)] text-[var(--bg-base)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-input)]"
                  }`}
                >
                  <Award className="w-4 h-4 shrink-0" /> Hạng Mục Chấm Thi
                </Link>

                <Link
                  href="/judge/scoring"
                  className={`flex items-center gap-2.5 px-3 py-2.5 hud-clipped transition-all font-bold ${
                    pathname.includes("/judge/scoring")
                      ? "bg-[var(--accent-judge)] text-[var(--bg-base)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-input)]"
                  }`}
                >
                  <Scale className="w-4 h-4 shrink-0" /> Bàn Chấm Điểm RBL
                </Link>

                <Link
                  href={`/events/${activeViewEventId}/leaderboard`}
                  className={`flex items-center gap-2.5 px-3 py-2.5 hud-clipped transition-all font-bold ${
                    pathname.includes("/leaderboard")
                      ? "bg-[var(--accent-judge)] text-[var(--bg-base)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--accent-judge)] hover:bg-[var(--bg-input)]"
                  }`}
                >
                  <Trophy className="w-4 h-4 shrink-0" /> Bảng Xếp Hạng Kết Quả
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={`/events/${activeViewEventId}`}
                  className={`flex items-center gap-2.5 px-3 py-2.5 hud-clipped transition-all font-bold ${
                    pathname.includes(`/events/${activeViewEventId}`) && !pathname.includes(`/leaderboard`)
                      ? "bg-[var(--accent-primary)] text-[var(--bg-base)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" /> Thể Lệ & Chi Tiết Sự Kiện
                </Link>

                <Link
                  href={`/events/${activeViewEventId}/leaderboard`}
                  className={`flex items-center gap-2.5 px-3 py-2.5 hud-clipped transition-all font-bold ${
                    pathname.includes("/leaderboard")
                      ? "bg-[var(--accent-judge)] text-[var(--bg-base)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--accent-judge)] hover:bg-[var(--bg-input)]"
                  }`}
                >
                  <Trophy className="w-4 h-4 shrink-0" /> Bảng Xếp Hạng
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Bottom User Info & Role Switcher */}
        <div className="flex flex-col gap-2.5 pt-3 border-t border-[var(--border-muted)]">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-[var(--text-muted)]">Vai trò:</span>
            <span className="text-[var(--accent-judge)] font-bold">
              {isAuthorizedJudge ? "Judge" : "User (Chưa Phân Công Giám Khảo)"}
            </span>
          </div>


          <button
            type="button"
            onClick={logout}
            className="w-full py-2 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/50 text-[var(--color-danger)] font-mono text-xs font-bold uppercase hover:bg-[var(--color-danger)] hover:text-white transition-all hud-clipped cursor-pointer relative z-50 mb-4 flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> ĐĂNG XUẤT
          </button>
        </div>
      </aside>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CHẾ ĐỘ 1C: NAVBAR DỌC KHI THÍ SINH VÀO DÀNH RIÊNG CHO WORKSPACE ĐỘI THI
  // ─────────────────────────────────────────────────────────────
  if (showParticipantSidebar) {
    const activeViewEventId = currentEventId;
    const isJoinedThisEvent = hasEventPermission(user, activeRole, activeViewEventId);

    return (
      <aside className="w-full md:w-64 bg-[var(--bg-panel)] border-b md:border-b-0 md:border-r border-[var(--border-muted)] flex flex-col justify-between p-5 shrink-0 z-50 md:fixed md:left-0 md:top-0 md:bottom-0">
        <div className="flex flex-col gap-6">
          {/* Brand Logo & Notification Bell */}
          <div className="flex flex-col gap-3 pb-4 border-b border-[var(--border-muted)]">
            <div className="flex items-center justify-between">
              <Link href="/" className="font-display font-bold text-lg text-[var(--accent-primary)] tracking-widest uppercase flex items-center gap-2">
                <SealShield className="h-6 w-6 text-[var(--accent-primary)]" />
                <span>SEAL WORKSPACE</span>
              </Link>
              <NotificationBell align="left" />
            </div>
            <Link
              href="/"
              className="font-mono text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-primary)] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Quay lại trang chủ
            </Link>
          </div>

          {/* Event Status Banner */}
          <div className={`p-3 bg-[var(--bg-input)] border hud-clipped flex flex-col gap-1 ${
            isJoinedThisEvent ? "border-[var(--border-muted)]" : "border-[var(--color-warning)]/50 bg-[var(--color-warning)]/5"
          }`}>
            <span className={`font-mono text-[9px] font-bold uppercase tracking-widest ${
              isJoinedThisEvent ? "text-[var(--accent-primary)]" : "text-[var(--color-warning)]"
            }`}>
              {isJoinedThisEvent ? "ĐANG THI ĐẤU" : "SỰ KIỆN CHƯA THAM GIA"}
            </span>
            <span className="font-display text-xs font-bold text-[var(--text-primary)] truncate">
              {currentEventName || (isJoinedThisEvent ? "Sự kiện đang tham gia" : "Chưa chọn sự kiện")}
            </span>
            <span className="font-mono text-[10px] font-bold text-[var(--accent-team)]">
              {isJoinedThisEvent ? "Đội thi" : "Trạng thái: Thí sinh tự do"}
            </span>
          </div>

          {/* Vertical Menu Section */}
          <nav className="flex flex-col gap-1.5 font-mono text-xs">
            <span className="text-[10px] text-[var(--text-muted)] tracking-widest uppercase mb-1">
              ĐIỀU HƯỚNG SỰ KIỆN
            </span>

            <Link
              href={`/events/${activeViewEventId}`}
              className={`flex items-center gap-2.5 px-3 py-2.5 hud-clipped transition-all font-bold ${
                pathname.includes(`/events/${activeViewEventId}`) && !pathname.includes(`/leaderboard`)
                  ? "bg-[var(--accent-primary)] text-[var(--bg-base)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" /> Thể Lệ & Chi Tiết Sự Kiện
            </Link>

            {/* NẾU ĐÃ THAM GIA SỰ KIỆN NÀY: HIỂN THỊ CÁC CHỨC NĂNG THI ĐẤU CỦA ĐỘI */}
            {isJoinedThisEvent && (
              <>
                <Link
                  href="/my-team"
                  className={`flex items-center gap-2.5 px-3 py-2.5 hud-clipped transition-all font-bold ${
                    pathname.includes("/my-team")
                      ? "bg-[var(--accent-team)] text-[var(--bg-base)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--accent-team)] hover:bg-[var(--bg-input)]"
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" /> {roleName === "TeamLeader" ? "Quản Lý Đội Thi" : "Xem Đội Thi Của Tôi"}
                </Link>

                <Link
                  href="/my-submissions"
                  className={`flex items-center gap-2.5 px-3 py-2.5 hud-clipped transition-all font-bold ${
                    pathname.includes("/my-submissions") || pathname.includes("/submissions/")
                      ? "bg-[var(--accent-team)] text-[var(--bg-base)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--accent-team)] hover:bg-[var(--bg-input)]"
                  }`}
                >
                  <Send className="w-4 h-4 shrink-0" /> {roleName === "TeamLeader" ? "Bài Nộp Của Đội" : "Xem Bài Nộp Của Đội"}
                </Link>

                <Link
                  href={`/events/${activeViewEventId}/leaderboard`}
                  className={`flex items-center gap-2.5 px-3 py-2.5 hud-clipped transition-all font-bold ${
                    pathname.includes("/leaderboard")
                      ? "bg-[var(--accent-judge)] text-[var(--bg-base)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--accent-judge)] hover:bg-[var(--bg-input)]"
                  }`}
                >
                  <Trophy className="w-4 h-4 shrink-0" /> Bảng Xếp Hạng
                </Link>

                {roleName === "TeamLeader" && (
                  <Link
                    href="/appeals"
                    className={`flex items-center gap-2.5 px-3 py-2.5 hud-clipped transition-all font-bold ${
                      pathname.includes("/appeals")
                        ? "bg-[var(--accent-coordinator)] text-[var(--bg-base)] shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--accent-coordinator)] hover:bg-[var(--bg-input)]"
                    }`}
                  >
                    <Scale className="w-4 h-4 shrink-0" /> Phúc Khảo & Khiếu Nại
                  </Link>
                )}
              </>
            )}

            {/* NẾU CHƯA THAM GIA SỰ KIỆN NÀY: HIỂN THỊ NÚT ĐĂNG KÝ / TẠO ĐỘI MỚI & BXH */}
            {!isJoinedThisEvent && (
              <>
                <Link
                  href="/register"
                  className="flex items-center gap-2.5 px-3 py-2.5 hud-clipped transition-all font-bold text-[var(--accent-team)] hover:bg-[var(--accent-team)] hover:text-black border border-[var(--accent-team)]/40 mt-1"
                >
                  <UserPlus className="w-4 h-4 shrink-0" /> Đăng Ký / Tạo Đội Mới
                </Link>

                <Link
                  href={`/events/${activeViewEventId}/leaderboard`}
                  className={`flex items-center gap-2.5 px-3 py-2.5 hud-clipped transition-all font-bold ${
                    pathname.includes("/leaderboard")
                      ? "bg-[var(--accent-judge)] text-[var(--bg-base)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--accent-judge)] hover:bg-[var(--bg-input)]"
                  }`}
                >
                  <Trophy className="w-4 h-4 shrink-0" /> Bảng Xếp Hạng
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Bottom User Info & Role Switcher */}
        <div className="flex flex-col gap-2.5 pt-3 border-t border-[var(--border-muted)]">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-[var(--text-muted)]">Vai trò:</span>
            <span className="text-[var(--accent-team)] font-bold">
              {isJoinedThisEvent ? roleName : "User (Thí sinh tự do)"}
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full py-2 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/50 text-[var(--color-danger)] font-mono text-xs font-bold uppercase hover:bg-[var(--color-danger)] hover:text-white transition-all hud-clipped cursor-pointer relative z-50 mb-4 flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> ĐĂNG XUẤT
          </button>
        </div>
      </aside>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CHẾ ĐỘ 2: NAVBAR NGANG (HORIZONTAL TOPBAR) - MỌI VAI TRÒ Ở TRANG NGOÀI
  // ─────────────────────────────────────────────────────────────
  return (
    <nav className="w-full h-16 border-b border-[var(--border-muted)] bg-[var(--bg-panel)] flex items-center justify-between px-6 shrink-0 z-30 shadow-sm">
      
      {/* Left: Brand & Main Navigation Links */}
      <div className="flex items-center gap-6 md:gap-8">
        <Link href="/" className="font-display font-bold text-lg text-[var(--accent-primary)] tracking-widest uppercase hover:opacity-80 flex items-center gap-2">
          <SealShield className="h-6 w-6 text-[var(--accent-primary)]" />
          <span>SEAL</span>
        </Link>

        <div className="hidden md:flex gap-5 items-center font-mono text-xs">
          <Link
            href="/"
            className={`transition-colors flex items-center gap-1.5 ${
              pathname === "/" || pathname.endsWith("/vi") || pathname.endsWith("/en")
                ? "text-[var(--accent-primary)] font-bold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Trang chủ
          </Link>

          <Link
            href="/events"
            className={`transition-colors flex items-center gap-1.5 ${
              pathname.includes("/events")
                ? "text-[var(--accent-primary)] font-bold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Compass className="w-3.5 h-3.5" /> Khám phá Sự kiện
          </Link>

          {/* Single Workspace Access Link for Coordinator */}
          {user && roleName === "Coordinator" && (
            <Link
              href="/coordinator/dashboard"
              className="text-[#a855f7] font-bold hover:underline flex items-center gap-1.5 bg-[#a855f7]/10 border border-[#a855f7]/30 px-3 py-1 hud-clipped text-xs"
            >
              <Target className="w-3.5 h-3.5" /> Control Center BTC
            </Link>
          )}

          {user && roleName === "Mentor" && (
            <Link
              href="/mentor/tracks"
              className="text-[#2dd4bf] font-bold hover:underline flex items-center gap-1.5 bg-[#2dd4bf]/10 border border-[#2dd4bf]/30 px-3 py-1 hud-clipped text-xs"
            >
              <Briefcase className="w-3.5 h-3.5" /> Bàn Làm Việc Mentor
            </Link>
          )}

          {user && roleName === "Judge" && (
            <Link
              href="/judge/scoring"
              className="text-[var(--accent-judge)] font-bold hover:underline flex items-center gap-1.5 bg-[var(--accent-judge)]/10 border border-[var(--accent-judge)]/30 px-3 py-1 hud-clipped text-xs"
            >
              <Scale className="w-3.5 h-3.5" /> Bàn Chấm Giám Khảo
            </Link>
          )}

          {/* Single Workspace Access Link for System Admin */}
          {user && roleName === "Admin" && (
            <Link
              href="/admin/dashboard"
              className="text-[var(--color-danger)] font-bold hover:underline flex items-center gap-1.5 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 px-3 py-1 hud-clipped text-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Bảng Điều Hành Admin
            </Link>
          )}

          {user && (roleName === "TeamLeader" || roleName === "TeamMember") && (
            <Link
              href="/my-team"
              className="text-[var(--accent-team)] font-bold hover:underline flex items-center gap-1.5 bg-[var(--accent-team)]/10 border border-[var(--accent-team)]/30 px-3 py-1 hud-clipped text-xs"
            >
              <Users className="w-3.5 h-3.5" /> Đội Thi Của Tôi
            </Link>
          )}
        </div>
      </div>
      
      {/* Right: Notification & Role Switcher */}
      <div className="flex items-center gap-4">
        <NotificationBell align="right" />


        {user ? (
          <div className="flex items-center gap-3 font-mono text-xs">
            {user.isStudent && !user.isApproved && roleName !== "Coordinator" && roleName !== "Admin" && roleName !== "Judge" && roleName !== "Mentor" && (
              <Link
                href="/profile"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/40 font-bold hover:bg-[var(--color-warning)] hover:text-black transition-all hud-clipped"
                title="Hồ sơ chưa duyệt — Cập nhật thẻ sinh viên"
              >
                ⚠️ Chưa duyệt thẻ SV ➔
              </Link>
            )}

            <Link
              href="/profile"
              className="text-[var(--text-primary)] hover:text-[var(--accent-primary)] font-bold flex items-center gap-1.5 border border-[var(--border-muted)] px-2.5 py-1 bg-[var(--bg-input)] hud-clipped"
            >
              <User className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Hồ sơ cá nhân
            </Link>

            <button
              onClick={logout}
              className="text-[var(--color-danger)] hover:underline border border-[var(--color-danger)]/30 px-2.5 py-1 hud-clipped cursor-pointer flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Đăng xuất
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 font-mono text-xs">
            <Link href="/login">
              <button className="hud-clipped px-3.5 py-1.5 border border-[var(--accent-primary)]/40 text-[var(--accent-primary)] font-bold uppercase tracking-wider hover:bg-[var(--accent-primary)]/10 transition-all cursor-pointer">
                ĐĂNG NHẬP
              </button>
            </Link>
            <Link href="/register">
              <button className="hud-clipped px-3.5 py-1.5 bg-[var(--accent-primary)] text-[var(--bg-base)] font-bold uppercase tracking-wider hover:bg-white transition-all shadow-sm cursor-pointer">
                ĐĂNG KÝ
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
