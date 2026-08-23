"use client";

import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import {
  LayoutDashboard,
  Trophy,
  Users,
  FileCheck2,
  Scale,
  Award,
  Bell,
  Settings,
  Shield,
  GraduationCap,
  Hexagon,
  FileCode,
  FolderGit2,
  CheckCircle2,
  AlertTriangle,
  School,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roleBadge?: string;
}

const PUBLIC_ITEMS: NavItem[] = [
  { label: "BẢNG ĐIỀU KHIỂN", href: "/dashboard", icon: LayoutDashboard },
  { label: "SỰ KIỆN & GIẢI ĐẤU", href: "/events", icon: Trophy },
  { label: "BẢNG XẾP HẠNG", href: "/leaderboard", icon: Award },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: "BẢNG ĐIỀU HÀNH TỔNG", href: "/admin/dashboard", icon: LayoutDashboard, roleBadge: "[ADM]" },
  { label: "QUẢN LÝ NGƯỜI DÙNG", href: "/admin/users", icon: Users, roleBadge: "[ADM]" },
  { label: "TRƯỜNG ĐẠI HỌC", href: "/admin/schools", icon: School, roleBadge: "[ADM]" },
  { label: "TẠO SỰ KIỆN MỚI", href: "/admin/events/new", icon: Plus, roleBadge: "[NEW]" },
];

const COORDINATOR_ITEMS: NavItem[] = [
  { label: "CONTROL CENTER BTC", href: "/coordinator/dashboard", icon: LayoutDashboard, roleBadge: "[EC]" },
  { label: "SỰ KIỆN & NHÂN SỰ", href: "/coordinator/staff", icon: Shield, roleBadge: "[01]" },
  { label: "QUẢN LÝ ĐỘI THI", href: "/coordinator/teams", icon: Users, roleBadge: "[02]" },
  { label: "DUYỆT HỒ SƠ THÍ SINH", href: "/coordinator/profiles", icon: CheckCircle2, roleBadge: "[03]" },
  { label: "KHO BỘ TIÊU CHÍ", href: "/coordinator/templates", icon: FolderGit2, roleBadge: "[04]" },
  { label: "QUẢN LÝ BÀI NỘP", href: "/coordinator/submissions", icon: FileCode, roleBadge: "[05]" },
  { label: "CÔNG BỐ KẾT QUẢ", href: "/coordinator/publish-results", icon: Award, roleBadge: "[06]" },
  { label: "ĐƠN PHÚC KHẢO", href: "/coordinator/appeals", icon: AlertTriangle, roleBadge: "[EC]" },
];

const CANDIDATE_ITEMS: NavItem[] = [
  { label: "KHÔNG GIAN ĐỘI THI", href: "/my-team", icon: Users, roleBadge: "[TEAM]" },
  { label: "BÀI NỘP GIẢI PHÁP", href: "/submissions", icon: FileCheck2 },
];

const JUDGE_ITEMS: NavItem[] = [
  { label: "BÀN CHẤM ĐIỂM", href: "/judge/scoring", icon: Scale, roleBadge: "[JUDGE]" },
];

const MENTOR_ITEMS: NavItem[] = [
  { label: "HẠNG MỤC CỐ VẤN", href: "/mentor/tracks", icon: GraduationCap, roleBadge: "[MENTOR]" },
  { label: "ĐỘI THI CỐ VẤN", href: "/mentor/teams", icon: Users, roleBadge: "[MENTOR]" },
  { label: "BÀI NỘP & GÓP Ý", href: "/mentor/submissions", icon: FileCheck2, roleBadge: "[MENTOR]" },
];

export function DashboardSidebar() {
  const pathname = usePathname() || "";
  const { user, activeRole } = useAuth();

  const userEmail = (user?.email || user?.Email || "").toLowerCase();
  const rawRole = activeRole?.roleName || activeRole?.RoleName;
  const isAdmin = Boolean(user?.isAdmin || user?.IsAdmin);
  const isCoordinator =
    isAdmin ||
    rawRole === "Coordinator" ||
    rawRole === "EventCoordinator" ||
    userEmail.includes("coordinator") ||
    userEmail.includes("ec_") ||
    pathname.includes("/coordinator");

  const isJudge = rawRole === "Judge" || userEmail.includes("judge") || pathname.includes("/judge");
  const isMentor = rawRole === "Mentor" || userEmail.includes("mentor") || pathname.includes("/mentor");
  const isTeam = rawRole === "TeamLeader" || rawRole === "TeamMember" || (!isAdmin && !isCoordinator && !isJudge && !isMentor);

  return (
    <aside className="w-[260px] flex-shrink-0 border-r border-[var(--border-muted)] bg-[var(--bg-panel)] flex flex-col justify-between h-screen sticky top-0 z-20">
      {/* Brand Header */}
      <div className="overflow-y-auto">
        <div className="h-16 px-5 flex items-center gap-3 border-b border-[var(--border-muted)] bg-[var(--bg-base)]">
          <div className="h-9 w-9 hud-clipped bg-[var(--accent-primary)] flex items-center justify-center text-[var(--bg-base)] shadow-[0_0_12px_rgba(0,217,255,0.4)]">
            <Hexagon className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="font-display font-bold text-base tracking-wider text-[var(--text-primary)] flex items-center gap-2">
              SEAL <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40">HUD v2.0</span>
            </div>
            <p className="text-[10px] font-mono text-[var(--text-muted)] tracking-widest uppercase">COMMAND DECK</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {/* Public items */}
          {PUBLIC_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3 py-2 font-mono text-xs font-bold tracking-wider uppercase transition-all duration-150 ${
                  isActive
                    ? "hud-clipped border-l-2 border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"}`} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}

          {/* Coordinator Section */}
          {isCoordinator && (
            <div className="pt-3 pb-1">
              <span className="text-[9px] font-mono font-bold text-[#a855f7] tracking-widest uppercase block px-2 mb-1.5">
                BAN TỔ CHỨC (COORDINATOR)
              </span>
              {COORDINATOR_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center justify-between px-3 py-2 font-mono text-xs font-bold tracking-wider uppercase transition-all duration-150 ${
                      isActive
                        ? "hud-clipped border-l-2 border-[#a855f7] bg-[#a855f7]/15 text-white"
                        : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-input)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${isActive ? "text-[#a855f7]" : "text-[var(--text-muted)]"}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.roleBadge && (
                      <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/40">
                        {item.roleBadge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Candidate section */}
          {isTeam && (
            <div className="pt-2">
              <span className="text-[9px] font-mono font-bold text-[var(--accent-team)] tracking-widest uppercase block px-2 mb-1">
                KHÔNG GIAN ĐỘI THI
              </span>
              {CANDIDATE_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center justify-between px-3 py-2 font-mono text-xs font-bold tracking-wider uppercase transition-all duration-150 ${
                      isActive
                        ? "hud-clipped border-l-2 border-[var(--accent-team)] bg-[var(--accent-team)]/10 text-[var(--accent-team)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${isActive ? "text-[var(--accent-team)]" : "text-[var(--text-muted)]"}`} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Judge section */}
          {isJudge && (
            <div className="pt-2">
              <span className="text-[9px] font-mono font-bold text-[var(--accent-judge)] tracking-widest uppercase block px-2 mb-1">
                HỘI ĐỒNG GIÁM KHẢO
              </span>
              {JUDGE_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center justify-between px-3 py-2 font-mono text-xs font-bold tracking-wider uppercase transition-all duration-150 ${
                      isActive
                        ? "hud-clipped border-l-2 border-[var(--accent-judge)] bg-[var(--accent-judge)]/10 text-[var(--accent-judge)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${isActive ? "text-[var(--accent-judge)]" : "text-[var(--text-muted)]"}`} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Mentor section */}
          {isMentor && (
            <div className="pt-2">
              <span className="text-[9px] font-mono font-bold text-[var(--accent-mentor)] tracking-widest uppercase block px-2 mb-1">
                ĐỘI NGŨ CỐ VẤN
              </span>
              {MENTOR_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center justify-between px-3 py-2 font-mono text-xs font-bold tracking-wider uppercase transition-all duration-150 ${
                      isActive
                        ? "hud-clipped border-l-2 border-[var(--accent-mentor)] bg-[var(--accent-mentor)]/10 text-[var(--accent-mentor)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${isActive ? "text-[var(--accent-mentor)]" : "text-[var(--text-muted)]"}`} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Admin Section */}
          {isAdmin && (
            <div className="pt-3 pb-1 border-t border-[var(--border-muted)]">
              <span className="text-[9px] font-mono font-bold text-[var(--color-danger)] tracking-widest uppercase block px-2 mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-[var(--color-danger)]" />
                BAN QUẢN TRỊ (ADMIN)
              </span>
              {ADMIN_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center justify-between px-3 py-2 font-mono text-xs font-bold tracking-wider uppercase transition-all duration-150 ${
                      isActive
                        ? "hud-clipped border-l-2 border-[var(--color-danger)] bg-[var(--color-danger)]/15 text-white"
                        : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-input)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${isActive ? "text-[var(--color-danger)]" : "text-[var(--text-muted)]"}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.roleBadge && (
                      <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-[var(--color-danger)]/20 text-[var(--color-danger)] border border-[var(--color-danger)]/40">
                        {item.roleBadge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Bottom static settings */}
          <div className="pt-2 border-t border-[var(--border-muted)]">
            <Link
              href="/profile"
              className={`group flex items-center justify-between px-3 py-2 font-mono text-xs font-bold tracking-wider uppercase transition-all duration-150 ${
                pathname === "/profile"
                  ? "text-[var(--accent-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" />
                <span>CÀI ĐẶT TÀI KHOẢN</span>
              </div>
            </Link>
          </div>
        </nav>
      </div>

      {/* User Quick Info */}
      <div className="p-3 border-t border-[var(--border-muted)] bg-[var(--bg-base)]">
        <div className="flex items-center justify-between p-2 hud-clipped bg-[var(--bg-panel)] border border-[var(--border-muted)]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded bg-[var(--accent-team)]/20 border border-[var(--accent-team)]/40 flex items-center justify-center text-xs font-mono font-bold text-[var(--accent-team)] shrink-0">
              {user?.fullName?.slice(0, 2).toUpperCase() || "US"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-mono font-bold text-[var(--text-primary)] truncate">
                {user?.fullName || user?.FullName || "NGƯỜI DÙNG"}
              </p>
              <p className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                {user?.studentCode || user?.email?.split("@")[0] || "SEAL_USER"}
              </p>
            </div>
          </div>
          <Badge tone={isAdmin ? "danger" : isCoordinator ? "coordinator" : isJudge ? "judge" : isMentor ? "mentor" : "team"}>
            {isAdmin ? "[ADM]" : isCoordinator ? "[EC]" : isJudge ? "[JUD]" : isMentor ? "[MEN]" : "[TEAM]"}
          </Badge>
        </div>
      </div>
    </aside>
  );
}
